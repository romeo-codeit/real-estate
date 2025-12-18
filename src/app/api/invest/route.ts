import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import investmentPlansService from '@/services/supabase/investment-plans.service';
import roiService from '@/services/supabase/roi.service';
import investmentService from '@/services/supabase/investment.service';
import transactionService from '@/services/supabase/transaction.service';
import { paymentService } from '@/services/payments/payment.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ValidationSchemas, ValidationHelper } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';

// Investment API handler
const investHandler = async (request: NextRequest) => {
  try {
    // Per-IP rate limiting to avoid hammering investment/payment flows
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'invest_post');
    if (!limit.ok && limit.response) return limit.response;
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate and sanitize input
    const validationResult = await ValidationHelper.validate(ValidationSchemas.invest, body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.errors },
        { status: 400 }
      );
    }
    
    const {
      amount,
      investmentType, // 'property', 'crypto', or 'plan'
      targetId, // property ID, crypto type, or plan ID
      durationMonths,
      currency = 'USD',
      paymentMethod = 'crypto' // Default to crypto if not specified
    } = validationResult.data;

    // Additional business logic validation if needed
    if (investmentType === 'plan' && !durationMonths) {
      return NextResponse.json({ error: 'Duration is required for plan investments' }, { status: 400 });
    }

    // Get ROI rate based on investment type
    let roiRate = 0;
    let sanityId = null;

    if (investmentType === 'property') {
      // For property investments, use dynamic ROI from settings
      const roiSettings = await roiService.getROIForType('property');
      roiRate = roiSettings.base_roi;
      sanityId = targetId; // Property ID from Sanity
    } else if (investmentType === 'plan') {
      // For plan investments, get plan details from database
      const plan = await investmentPlansService.getPlanById(targetId);
      if (!plan) {
        return NextResponse.json({ error: 'Invalid investment plan' }, { status: 400 });
      }
      roiRate = plan.roi_rate;
    } else if (investmentType === 'crypto') {
      // For crypto investments, use dynamic ROI from settings
      const roiSettings = await roiService.getROIForType('crypto');
      roiRate = roiSettings.base_roi;
    }

    // Check if it's a crypto payment method
    const cryptoService = (paymentService as any).services.get('crypto');
    const supportedCryptoMethods = await cryptoService.getSupportedMethods();
    const isCryptoMethod = supportedCryptoMethods.some((method: any) => method.id === paymentMethod);

    // For non-crypto investments, check available balance
    if (!isCryptoMethod) {
      const { availableToWithdraw } = await transactionService.getUserAvailableBalance(user.id);
      
      if (amount > availableToWithdraw) {
        return NextResponse.json(
          {
            error: 'Insufficient balance for investment',
            availableToWithdraw,
            requiredAmount: amount
          },
          { status: 400 }
        );
      }
    }

    // Calculate end date if duration is provided
    const startDate = new Date();
    const endDate = durationMonths ? new Date(startDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000) : null;

    // Create investment record
    const investment = await investmentService.createInvestment({
      user_id: user.id,
      amount_invested: amount,
      investment_type: investmentType as 'crypto' | 'property' | 'plan',
      roi_rate: roiRate,
      sanity_id: sanityId,
      start_date: startDate.toISOString(),
      end_date: endDate?.toISOString() || null,
      duration_months: durationMonths || null,
      status: 'pending' // Investment starts as pending until payment is confirmed
    });

    // Create transaction record
    const transaction = await transactionService.createTransaction({
      user_id: user.id,
      type: 'investment',
      amount,
      currency,
      status: 'pending',
      provider: isCryptoMethod ? 'crypto' : paymentMethod,
      related_object: {
        investment_id: investment.id,
        target_id: targetId,
        investment_type: investmentType
      },
      metadata: {
        investment_id: investment.id,
        target_id: targetId,
        investment_type: investmentType,
        roi_rate: roiRate,
        duration_months: durationMonths,
        payment_method: paymentMethod,
        crypto_type: isCryptoMethod ? paymentMethod : null,
        initiated_at: new Date().toISOString(),
      }
    });

    // Process payment based on method
    let paymentResult = null;
    try {
      if (paymentMethod !== 'crypto') {
        // For non-crypto payments, initiate payment through payment service
        paymentResult = await paymentService.createPayment(
          paymentMethod,
          amount,
          currency,
          user.id,
          {
            investment_id: investment.id,
            transaction_id: transaction.id,
            investment_type: investmentType,
            target_id: targetId,
          }
        );

        // Link this investment transaction to the gateway payment
        // so that webhooks can settle it using provider_txn_id
        const gatewayId = paymentResult.success
          ? (paymentResult.paymentId ?? paymentResult.transactionId)
          : undefined;

        if (gatewayId) {
          await transactionService.setProviderTransactionId(
            transaction.id,
            gatewayId
          );
        }
      }
      // For crypto payments, we don't initiate through payment service here
      // The user will send crypto to the provided address
    } catch (paymentError) {
      console.error('Payment initiation error:', paymentError);
      // Don't fail the entire request, just log the error
      // The investment and transaction are still created
    }

    return NextResponse.json({
      success: true,
      investment,
      transaction,
      payment: paymentResult,
      message: 'Investment initiated successfully'
    });

  } catch (error) {
    console.error('Invest API error:', error);
    return NextResponse.json(
      { error: 'Failed to process investment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'invest_get');
    if (!limit.ok && limit.response) return limit.response;
    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's investments
    const investments = await investmentService.getInvestments(user.id);

    return NextResponse.json({ investments });

  } catch (error) {
    console.error('Get investments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  return investHandler(request);
}