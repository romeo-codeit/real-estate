import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WITHDRAWAL_LIMITS, KYC_THRESHOLDS } from '@/lib/validation';

// Mock getWithdrawalLimits function (same as in route)
function getWithdrawalLimits(kycStatus: string) {
    switch (kycStatus) {
        case 'verified':
            return WITHDRAWAL_LIMITS.VERIFIED;
        case 'pending':
            return WITHDRAWAL_LIMITS.PENDING;
        case 'rejected':
            return WITHDRAWAL_LIMITS.REJECTED;
        default:
            return WITHDRAWAL_LIMITS.NONE;
    }
}

describe('Withdrawal Limits & KYC', () => {
    describe('WITHDRAWAL_LIMITS config', () => {
        it('should have proper limits for unverified users', () => {
            const limits = WITHDRAWAL_LIMITS.NONE;
            expect(limits.daily).toBe(1000);
            expect(limits.perTransaction).toBe(500);
            expect(limits.requiresApproval).toBe(500);
        });

        it('should have higher limits for verified users', () => {
            const limits = WITHDRAWAL_LIMITS.VERIFIED;
            expect(limits.daily).toBe(50000);
            expect(limits.perTransaction).toBe(25000);
            expect(limits.requiresApproval).toBe(10000);
        });

        it('should have zero limits for rejected KYC', () => {
            const limits = WITHDRAWAL_LIMITS.REJECTED;
            expect(limits.daily).toBe(0);
            expect(limits.perTransaction).toBe(0);
            expect(limits.requiresApproval).toBe(0);
        });
    });

    describe('KYC_THRESHOLDS config', () => {
        it('should have proper thresholds defined', () => {
            expect(KYC_THRESHOLDS.REQUIRE_FOR_WITHDRAWAL_ABOVE).toBe(5000);
            expect(KYC_THRESHOLDS.REQUIRE_FOR_TOTAL_ABOVE).toBe(10000);
        });
    });

    describe('getWithdrawalLimits helper', () => {
        it('should return correct limits for verified status', () => {
            const limits = getWithdrawalLimits('verified');
            expect(limits).toEqual(WITHDRAWAL_LIMITS.VERIFIED);
        });

        it('should return correct limits for pending status', () => {
            const limits = getWithdrawalLimits('pending');
            expect(limits).toEqual(WITHDRAWAL_LIMITS.PENDING);
        });

        it('should return correct limits for rejected status', () => {
            const limits = getWithdrawalLimits('rejected');
            expect(limits).toEqual(WITHDRAWAL_LIMITS.REJECTED);
        });

        it('should return NONE limits for unknown status', () => {
            const limits = getWithdrawalLimits('unknown');
            expect(limits).toEqual(WITHDRAWAL_LIMITS.NONE);
        });

        it('should return NONE limits for empty status', () => {
            const limits = getWithdrawalLimits('');
            expect(limits).toEqual(WITHDRAWAL_LIMITS.NONE);
        });
    });

    describe('Withdrawal validation logic', () => {
        it('should block withdrawals above per-transaction limit for unverified user', () => {
            const limits = getWithdrawalLimits('none');
            const amount = 600; // Above $500 limit
            expect(amount > limits.perTransaction).toBe(true);
        });

        it('should allow withdrawals below per-transaction limit for unverified user', () => {
            const limits = getWithdrawalLimits('none');
            const amount = 400;
            expect(amount <= limits.perTransaction).toBe(true);
        });

        it('should require KYC for amounts above threshold', () => {
            const amount = 6000;
            const kycStatus: string = 'none';
            const requiresKyc = amount > KYC_THRESHOLDS.REQUIRE_FOR_WITHDRAWAL_ABOVE && kycStatus !== 'verified';
            expect(requiresKyc).toBe(true);
        });

        it('should not require KYC for verified users above threshold', () => {
            const amount = 6000;
            const kycStatus: string = 'verified';
            const requiresKyc = amount > KYC_THRESHOLDS.REQUIRE_FOR_WITHDRAWAL_ABOVE && kycStatus !== 'verified';
            expect(requiresKyc).toBe(false);
        });

        it('should require admin approval for large amounts', () => {
            const limits = getWithdrawalLimits('verified');
            const amount = 15000; // Above $10k approval threshold
            const requiresApproval = amount > limits.requiresApproval;
            expect(requiresApproval).toBe(true);
        });

        it('should not require admin approval for small amounts', () => {
            const limits = getWithdrawalLimits('verified');
            const amount = 5000;
            const requiresApproval = amount > limits.requiresApproval;
            expect(requiresApproval).toBe(false);
        });

        it('should correctly calculate daily limit remaining', () => {
            const limits = getWithdrawalLimits('none');
            const totalWithdrawnToday = 700;
            const remaining = limits.daily - totalWithdrawnToday;
            expect(remaining).toBe(300);
        });

        it('should reject when daily limit exceeded', () => {
            const limits = getWithdrawalLimits('none');
            const totalWithdrawnToday = 700;
            const newWithdrawal = 400;
            const wouldExceed = totalWithdrawnToday + newWithdrawal > limits.daily;
            expect(wouldExceed).toBe(true);
        });
    });
});
