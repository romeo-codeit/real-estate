import { describe, it, expect } from 'vitest';
import { ValidationSchemas, INVESTMENT_LIMITS } from '@/lib/validation';

describe('Investment Limits Validation', () => {
    describe('Deposit validation', () => {
        it('should reject amounts below minimum', async () => {
            const result = ValidationSchemas.deposit.safeParse({
                amount: 5, // Below $10 minimum
                currency: 'USD',
                paymentMethod: 'stripe',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Minimum deposit');
            }
        });

        it('should reject amounts above maximum', async () => {
            const result = ValidationSchemas.deposit.safeParse({
                amount: 200000, // Above $100k maximum
                currency: 'USD',
                paymentMethod: 'stripe',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Maximum deposit');
            }
        });

        it('should accept valid amounts', async () => {
            const result = ValidationSchemas.deposit.safeParse({
                amount: 1000,
                currency: 'USD',
                paymentMethod: 'stripe',
            });

            expect(result.success).toBe(true);
        });

        it('should reject negative amounts', async () => {
            const result = ValidationSchemas.deposit.safeParse({
                amount: -100,
                currency: 'USD',
                paymentMethod: 'stripe',
            });

            expect(result.success).toBe(false);
        });

        it('should reject zero amounts', async () => {
            const result = ValidationSchemas.deposit.safeParse({
                amount: 0,
                currency: 'USD',
                paymentMethod: 'stripe',
            });

            expect(result.success).toBe(false);
        });
    });

    describe('Withdrawal validation', () => {
        it('should reject amounts below minimum', async () => {
            const result = ValidationSchemas.withdraw.safeParse({
                amount: 5,
                currency: 'USD',
                walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Minimum withdrawal');
            }
        });

        it('should reject amounts above maximum', async () => {
            const result = ValidationSchemas.withdraw.safeParse({
                amount: 100000, // Above $50k maximum
                currency: 'USD',
                walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Maximum withdrawal');
            }
        });

        it('should accept valid amounts', async () => {
            const result = ValidationSchemas.withdraw.safeParse({
                amount: 5000,
                currency: 'USD',
                walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            });

            expect(result.success).toBe(true);
        });
    });

    describe('Investment validation', () => {
        it('should reject amounts below global minimum', async () => {
            const result = ValidationSchemas.invest.safeParse({
                amount: 5, // Below $10 minimum
                investmentType: 'crypto',
                targetId: 'btc',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Minimum investment');
            }
        });

        it('should reject amounts above global maximum', async () => {
            const result = ValidationSchemas.invest.safeParse({
                amount: 2000000, // Above $1M maximum
                investmentType: 'crypto',
                targetId: 'btc',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Maximum investment');
            }
        });

        it('should accept valid investment amounts', async () => {
            const result = ValidationSchemas.invest.safeParse({
                amount: 10000,
                investmentType: 'plan',
                targetId: 'plan-123',
                durationMonths: 12,
            });

            expect(result.success).toBe(true);
        });

        it('should reject non-finite numbers', async () => {
            const result = ValidationSchemas.invest.safeParse({
                amount: Infinity,
                investmentType: 'crypto',
                targetId: 'btc',
            });

            expect(result.success).toBe(false);
        });

        it('should reject NaN', async () => {
            const result = ValidationSchemas.invest.safeParse({
                amount: NaN,
                investmentType: 'crypto',
                targetId: 'btc',
            });

            expect(result.success).toBe(false);
        });
    });

    describe('INVESTMENT_LIMITS config', () => {
        it('should have all required limits defined', () => {
            expect(INVESTMENT_LIMITS.GLOBAL_MIN).toBeDefined();
            expect(INVESTMENT_LIMITS.GLOBAL_MAX).toBeDefined();
            expect(INVESTMENT_LIMITS.DEPOSIT_MIN).toBeDefined();
            expect(INVESTMENT_LIMITS.DEPOSIT_MAX).toBeDefined();
            expect(INVESTMENT_LIMITS.WITHDRAW_MIN).toBeDefined();
            expect(INVESTMENT_LIMITS.WITHDRAW_MAX).toBeDefined();
            expect(INVESTMENT_LIMITS.CRYPTO_MIN).toBeDefined();
            expect(INVESTMENT_LIMITS.PROPERTY_MIN).toBeDefined();
            expect(INVESTMENT_LIMITS.PLAN_MIN).toBeDefined();
        });

        it('should have sensible limit values', () => {
            expect(INVESTMENT_LIMITS.GLOBAL_MIN).toBeLessThan(INVESTMENT_LIMITS.GLOBAL_MAX);
            expect(INVESTMENT_LIMITS.DEPOSIT_MIN).toBeLessThan(INVESTMENT_LIMITS.DEPOSIT_MAX);
            expect(INVESTMENT_LIMITS.WITHDRAW_MIN).toBeLessThan(INVESTMENT_LIMITS.WITHDRAW_MAX);
        });
    });
});
