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
import { requireEmailVerified, requireAuth, requireTwoFactor } from '@/lib/auth-utils';
import notificationService from '@/services/supabase/notification.service';

// Helper to determine ROI and validate limits based on investment type
async function getInvestmentROIAndValidate(investmentType: string, amount: number, targetId: string) {
  let roiRate = 0;
  let sanityId = null;

  if (investmentType === 'property') {
    const roiSettings = await roiService.getROIForType('property');
    roiRate = roiSettings.base_roi;
    sanityId = targetId;

    const PROPERTY_MIN = 100;
    if (amount < PROPERTY_MIN) {
      return { error: `Minimum investment for properties is $${PROPERTY_MIN}`, code: 'AMOUNT_BELOW_MINIMUM', minAmount: PROPERTY_MIN };
    }
  } else if (investmentType === 'plan') {
    const plan = await investmentPlansService.getPlanById(targetId);
    if (!plan) return { error: 'Invalid investment plan' };

    roiRate = plan.roi_rate;
    if (plan.min_investment && amount < plan.min_investment) {
      return { error: `Minimum investment for ${plan.name} is $${plan.min_investment.toLocaleString()}`, code: 'AMOUNT_BELOW_PLAN_MINIMUM', minAmount: plan.min_investment, planName: plan.name };
    }
    if (plan.max_investment && amount > plan.max_investment) {
      return { error: `Maximum investment for ${plan.name} is $${plan.max_investment.toLocaleString()}`, code: 'AMOUNT_ABOVE_PLAN_MAXIMUM', maxAmount: plan.max_investment, planName: plan.name };
    }
  } else if (investmentType === 'crypto') {
    const roiSettings = await roiService.getROIForType('crypto');
    roiRate = roiSettings.base_roi;

    const CRYPTO_MIN = 50;
    if (amount < CRYPTO_MIN) {
      return { error: `Minimum investment for crypto is $${CRYPTO_MIN}`, code: 'AMOUNT_BELOW_MINIMUM', minAmount: CRYPTO_MIN };
    }
  }

  return { roiRate, sanityId };
}

// Investment API handler
const investHandler = async (request: NextRequest) => {
  try {
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'invest_post');
    if (!limit.ok && limit.response) return limit.response;

    const userOrResponse = await requireEmailVerified(request);
    if (userOrResponse instanceof NextResponse) return userOrResponse;
    const user = userOrResponse;

    const twoFAResult = await requireTwoFactor(request, user.id);
    if (twoFAResult instanceof NextResponse) return twoFAResult;

    const body = await request.json();
    const validationResult = await ValidationHelper.validate(ValidationSchemas.invest, body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input data', details: validationResult.errors }, { status: 400 });
    }

    const { amount, investmentType, targetId, durationMonths, currency = 'USD', paymentMethod = 'crypto' } = validationResult.data;

    if (investmentType === 'plan' && !durationMonths) {
      return NextResponse.json({ error: 'Duration is required for plan investments' }, { status: 400 });
    }

    const roiValidation = await getInvestmentROIAndValidate(investmentType, amount, targetId);
    if ('error' in roiValidation) {
      return NextResponse.json(roiValidation, { status: 400 });
    }
    const { roiRate, sanityId } = roiValidation;

    const cryptoService = (paymentService as any).services.get('crypto');
    const supportedCryptoMethods = await cryptoService.getSupportedMethods();
    const isCryptoMethod = supportedCryptoMethods.some((method: any) => method.id === paymentMethod);

    if (!isCryptoMethod) {
      const { availableToWithdraw } = await transactionService.getUserAvailableBalance(user.id);
      if (amount > availableToWithdraw) {
        return NextResponse.json({ error: 'Insufficient balance for investment', availableToWithdraw, requiredAmount: amount }, { status: 400 });
      }
    }

    const endDate = durationMonths ? new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000) : null;

    const investment = await investmentService.createInvestment({
      user_id: user.id,
      amount_invested: amount,
      investment_type: investmentType as 'crypto' | 'property' | 'plan',
      roi_rate: roiRate,
      sanity_id: sanityId,
      start_date: null,
      end_date: endDate?.toISOString() || null,
      duration_months: durationMonths || null,
      status: 'pending'
    });

    const transaction = await transactionService.createTransaction({
      user_id: user.id,
      type: 'investment',
      amount,
      currency,
      status: 'pending',
      provider: isCryptoMethod ? 'crypto' : paymentMethod,
      related_object: { investment_id: investment.id, target_id: targetId, investment_type: investmentType },
      metadata: { investment_id: investment.id, target_id: targetId, investment_type: investmentType, roi_rate: roiRate, duration_months: durationMonths, payment_method: paymentMethod, crypto_type: isCryptoMethod ? paymentMethod : null, initiated_at: new Date().toISOString() }
    });

    try {
      await notificationService.createNotification({
        user_id: user.id,
        type: 'investment_initiated',
        title: 'Investment initiated',
        body: `You started a ${investmentType} investment for ${amount} ${currency}.`,
        data: { investment_id: investment.id, transaction_id: transaction.id, amount, currency, investment_type: investmentType },
      });
    } catch (notifyError) {
      console.error('Failed to create investment notification:', notifyError);
    }

    let paymentResult = null;
    try {
      if (paymentMethod !== 'crypto') {
        paymentResult = await paymentService.createPayment(paymentMethod, amount, currency, user.id, { investment_id: investment.id, transaction_id: transaction.id, investment_type: investmentType, target_id: targetId });
        const gatewayId = paymentResult.success ? (paymentResult.paymentId ?? paymentResult.transactionId) : undefined;
        if (gatewayId) {
          await transactionService.setProviderTransactionId(transaction.id, gatewayId);
        }
      }
    } catch (paymentError) {
      console.error('Payment initiation error:', paymentError);
    }

    return NextResponse.json({ success: true, investment, transaction, payment: paymentResult, message: 'Investment initiated successfully' });
  } catch (error) {
    console.error('Invest API error:', error);
    return NextResponse.json({ error: 'Failed to process investment' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'invest_get');
    if (!limit.ok && limit.response) return limit.response;

    // Verify user authentication (no email verification needed for viewing)
    const userOrResponse = await requireAuth(request);
    if (userOrResponse instanceof NextResponse) return userOrResponse;
    const user = userOrResponse;

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