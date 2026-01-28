import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import transactionService from '@/services/supabase/transaction.service';

export async function GET(request: NextRequest) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) return adminOrResponse;

    const transactions = await transactionService.getAllTransactions();
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Admin transactions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) return adminOrResponse;

    const { userId, providerTxnId, status, context } = await request.json();

    const updatedTransaction = await transactionService.updateTransactionStatus(
      userId,
      providerTxnId,
      status,
      context
    );

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    console.error('Admin update transaction API error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}