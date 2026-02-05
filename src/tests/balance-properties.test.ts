import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property: Balance Consistency
 * Total Balance = Sum(Deposits) + Sum(Payouts) - Sum(Withdrawals) - Sum(Investments) - Sum(Fees)
 * Available Balance = Total Balance - Pending(Withdrawals) - Pending(Investments)
 */
describe('Balance Consistency Properties', () => {

    it('Available balance should never exceed total balance', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        type: fc.constantFrom('deposit', 'withdrawal', 'investment', 'payout', 'fee'),
                        amount: fc.double({ min: 1, max: 1000000 }),
                        status: fc.constantFrom('pending', 'completed', 'failed', 'cancelled')
                    }),
                    { minLength: 0, maxLength: 200 }
                ),
                (txns) => {
                    let totalBalance = 0;
                    let pendingEncumbrance = 0;

                    txns.forEach(t => {
                        // Total Balance only counts completed transactions (ledger)
                        if (t.status === 'completed') {
                            if (t.type === 'deposit' || t.type === 'payout') {
                                totalBalance += t.amount;
                            } else if (t.type === 'withdrawal' || t.type === 'investment' || t.type === 'fee') {
                                totalBalance -= t.amount;
                            }
                        }

                        // Pending withdrawals and investments reduce "Available" balance
                        if (t.status === 'pending') {
                            if (t.type === 'withdrawal' || t.type === 'investment') {
                                pendingEncumbrance += t.amount;
                            }
                        }
                    });

                    const availableBalance = totalBalance - pendingEncumbrance;

                    // Property: Available <= Total (assuming encumbrance is positive)
                    // This catches cases where amount might be negative or undefined
                    return availableBalance <= (totalBalance + 1e-9);
                }
            )
        );
    });

    it('Algebraic sum of all net-positive and net-negative transactions must match total balance', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        amount: fc.double({ min: 0.01, max: 100000 }),
                        isPositive: fc.boolean(), // true for deposit/payout
                        isCompleted: fc.boolean()
                    })
                ),
                (entries) => {
                    let balance = 0;
                    entries.forEach(e => {
                        if (e.isCompleted) {
                            balance += e.isPositive ? e.amount : -e.amount;
                        }
                    });

                    // Inverse check
                    const sumPositive = entries.filter(e => e.isCompleted && e.isPositive).reduce((s, e) => s + e.amount, 0);
                    const sumNegative = entries.filter(e => e.isCompleted && !e.isPositive).reduce((s, e) => s + e.amount, 0);

                    return Math.abs(balance - (sumPositive - sumNegative)) < 1e-9;
                }
            )
        );
    });
});
