import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReferralService } from '@/services/supabase/referral.service';
import { supabase } from '@/services/supabase/supabase';

// Mock services
vi.mock('@/services/supabase/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

vi.mock('server-only', () => ({}));

describe('ReferralService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateReferralCode', () => {
        it('should return existing code if user already has one', async () => {
            const mockCode = 'REF12345ABC';
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: { referral_code: mockCode },
                        error: null,
                    }),
                }),
            });

            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const result = await ReferralService.generateReferralCode('user_123');

            expect(result).toBe(mockCode);
            expect(supabase.from).toHaveBeenCalledWith('profiles');
        });

        it('should generate and save new code if user does not have one', async () => {
            const mockFrom = vi.fn();
            (supabase.from as any).mockImplementation(mockFrom);

            // Mock: user has no code
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { referral_code: null },
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock: check for collision - no collision
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: { code: 'PGRST116' }, // Not found
                        }),
                    }),
                }),
            });

            // Mock: update user profile with new code
            mockFrom.mockReturnValueOnce({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            });

            const result = await ReferralService.generateReferralCode('user_123');

            expect(result).toMatch(/^REF[A-Z0-9_]+$/);
        });
    });

    describe('validateReferralCode', () => {
        it('should return true for valid code', async () => {
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'user_123' },
                        error: null,
                    }),
                }),
            });

            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const result = await ReferralService.validateReferralCode('REF12345ABC');

            expect(result).toBe(true);
            expect(supabase.from).toHaveBeenCalledWith('profiles');
        });

        it('should return false for invalid code', async () => {
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116' },
                    }),
                }),
            });

            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const result = await ReferralService.validateReferralCode('INVALID');

            expect(result).toBe(false);
        });
    });

    describe('createReferral', () => {
        it('should create referral record for valid code', async () => {
            const mockFrom = vi.fn();
            (supabase.from as any).mockImplementation(mockFrom);

            // Mock: find referrer by code
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: 'referrer_123' },
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock: check existing referral
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: null,
                            error: { code: 'PGRST116' },
                        }),
                    }),
                }),
            });

            // Mock: insert new referral
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { id: 'ref_123', status: 'registered' },
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await ReferralService.createReferral('REF12345ABC', 'referee_456');

            expect(result).toBeTruthy();
            expect(result?.status).toBe('registered');
        });

        it('should prevent self-referral', async () => {
            const mockSelect = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'user_123' },
                        error: null,
                    }),
                }),
            });

            (supabase.from as any).mockReturnValue({ select: mockSelect });

            const result = await ReferralService.createReferral('REF12345ABC', 'user_123');

            expect(result).toBeNull();
        });
    });
});
