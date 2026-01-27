import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import investmentService from '@/services/supabase/investment.service';
import transactionService from '@/services/supabase/transaction.service';

/**
 * Scheduled cron job to accrue interest on active investments.
 * Called daily via Vercel Cron.
 *
 * Flow:
 * 1. Query all active investments with start_date set
 * 2. Calculate accrued interest delta since last payout
 * 3. Create payout transactions for each user (delta-only)
 * 4. Record last_accrued_at and total_interest_paid to avoid double-counting
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret from Vercel
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[Interest Accrual Cron] CRON_SECRET is not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Interest Accrual Cron] Starting interest accrual job');

    // Get all active investments with start_date
    const { data: activeInvestments, error: investError } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('status', 'active')
      .not('start_date', 'is', null)
      .order('created_at', { ascending: true });

    if (investError) {
      console.error('[Interest Accrual Cron] Error fetching investments:', investError);
      throw investError;
    }

    if (!activeInvestments || activeInvestments.length === 0) {
      console.log('[Interest Accrual Cron] No active investments to process');
      return NextResponse.json({
        success: true,
        message: 'No active investments to accrue interest for',
        processed: 0,
      });
    }

    console.log(`[Interest Accrual Cron] Found ${activeInvestments.length} active investments`);

    let processed = 0;
    let totalAccrued = 0;
    const errors: Array<{ investmentId: string; error: string }> = [];

    // Process each investment
    for (const investment of activeInvestments) {
      try {
        // Require user and start_date
        if (!investment.user_id) {
          console.log(`[Interest Accrual Cron] Skipping investment ${investment.id} missing user_id`);
          continue;
        }
        if (!investment.start_date) {
          console.log(`[Interest Accrual Cron] Skipping investment ${investment.id} missing start_date`);
          continue;
        }

        const metadata = ((investment as any)?.metadata as Record<string, any>) || {};
        const lastAccruedAt = metadata.last_accrued_at ? new Date(metadata.last_accrued_at) : null;

        // If already accrued today, skip to avoid double payout
        const today = new Date().toISOString().split('T')[0];
        if (lastAccruedAt && lastAccruedAt.toISOString().split('T')[0] === today) {
          console.log(`[Interest Accrual Cron] Already accrued today for investment ${investment.id}`);
          continue;
        }

        // Calculate accrued interest using existing ROI service method
        const roiData = await investmentService.calculateCurrentROI(investment.id);

        if (!roiData || roiData.roiAmount <= 0) {
          console.log(`[Interest Accrual Cron] No interest to accrue for investment ${investment.id}`);
          continue;
        }

        // Delta since last payout to avoid double-paying
        const totalPaid = Number(metadata.total_interest_paid ?? metadata.totalInterestPaid ?? 0) || 0;
        const totalAccruedToDate = roiData.roiAmount;
        const delta = Math.max(totalAccruedToDate - totalPaid, 0);

        if (delta <= 0.01) {
          console.log(`[Interest Accrual Cron] No new interest since last payout for investment ${investment.id}`);
          continue;
        }

        // Create payout transaction for the accrued delta
        const payoutTransaction = await transactionService.createTransaction({
          user_id: investment.user_id as string,
          type: 'payout',
          amount: delta,
          currency: 'USD',
          status: 'completed',
          provider: 'system',
          related_object: {
            investment_id: investment.id,
            interest_accrual: true,
            month: new Date().toISOString().substring(0, 7), // YYYY-MM
          },
          metadata: {
            principal: roiData.principal,
            currentValue: roiData.currentValue,
            roiRate: roiData.roiRate,
            monthsElapsed: roiData.monthsElapsed,
            accrued_at: new Date().toISOString(),
            totalAccruedToDate,
            totalPaidBefore: totalPaid,
          },
        });

        console.log(
          `[Interest Accrual Cron] Created payout of $${delta.toFixed(2)} for user ${investment.user_id}, investment ${investment.id}`
        );

        // Mark accrual checkpoint to prevent double-counting
        const metadataUpdate = {
          ...metadata,
          total_interest_paid: totalPaid + delta,
          last_accrued_at: new Date().toISOString(),
        } as Record<string, any>;

        await supabaseAdmin
          .from('investments')
          .update({ metadata: metadataUpdate } as any)
          .eq('id', investment.id);

        totalAccrued += delta;
        processed++;
      } catch (error) {
        console.error(`[Interest Accrual Cron] Error processing investment ${investment.id}:`, error);
        errors.push({
          investmentId: investment.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(
      `[Interest Accrual Cron] Completed. Processed: ${processed}, Total accrued: $${totalAccrued.toFixed(2)}`
    );

    return NextResponse.json({
      success: true,
      message: 'Interest accrual job completed',
      processed,
      totalAccrued: parseFloat(totalAccrued.toFixed(2)),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Interest Accrual Cron] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/debugging in non-production environments
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'GET not allowed in production' }, { status: 405 });
  }

  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger the POST handler for testing
  return POST(request);
}
