import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireEmailVerified, requireAuth } from '@/lib/auth-utils';

// Mock supabase-admin
vi.mock('@/services/supabase/supabase-admin', () => ({
    supabaseAdmin: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    },
}));

vi.mock('server-only', () => ({}));

import { supabaseAdmin } from '@/services/supabase/supabase-admin';

describe('Email Verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('requireEmailVerified', () => {
        it('should reject users without verified email', async () => {
            // Mock: user without email_confirmed_at
            (supabaseAdmin.auth.getUser as any).mockResolvedValue({
                data: {
                    user: {
                        id: 'user_123',
                        email: 'test@example.com',
                        email_confirmed_at: null, // Not verified
                    },
                },
                error: null,
            });

            const request = new NextRequest('http://localhost:3000/api/deposit', {
                headers: {
                    authorization: 'Bearer valid_token',
                },
            });

            const result = await requireEmailVerified(request);

            // Should return NextResponse with 403
            expect(result).toHaveProperty('status', 403);

            const body = await (result as Response).json();
            expect(body.code).toBe('EMAIL_NOT_VERIFIED');
            expect(body.error).toBe('Email verification required');
        });

        it('should allow users with verified email', async () => {
            // Mock: user with email_confirmed_at
            (supabaseAdmin.auth.getUser as any).mockResolvedValue({
                data: {
                    user: {
                        id: 'user_123',
                        email: 'test@example.com',
                        email_confirmed_at: '2026-01-01T00:00:00Z', // Verified
                    },
                },
                error: null,
            });

            const request = new NextRequest('http://localhost:3000/api/deposit', {
                headers: {
                    authorization: 'Bearer valid_token',
                },
            });

            const result = await requireEmailVerified(request);

            // Should return user object, not NextResponse
            expect(result).not.toHaveProperty('status');
            expect(result).toHaveProperty('id', 'user_123');
            expect(result).toHaveProperty('emailConfirmed', true);
        });

        it('should reject requests without authorization header', async () => {
            const request = new NextRequest('http://localhost:3000/api/deposit');

            const result = await requireEmailVerified(request);

            expect(result).toHaveProperty('status', 401);
        });

        it('should reject invalid tokens', async () => {
            (supabaseAdmin.auth.getUser as any).mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid token' },
            });

            const request = new NextRequest('http://localhost:3000/api/deposit', {
                headers: {
                    authorization: 'Bearer invalid_token',
                },
            });

            const result = await requireEmailVerified(request);

            expect(result).toHaveProperty('status', 401);
        });
    });

    describe('requireAuth', () => {
        it('should allow unverified users for read operations', async () => {
            // Mock: user without email_confirmed_at
            (supabaseAdmin.auth.getUser as any).mockResolvedValue({
                data: {
                    user: {
                        id: 'user_123',
                        email: 'test@example.com',
                        email_confirmed_at: null, // Not verified
                    },
                },
                error: null,
            });

            const request = new NextRequest('http://localhost:3000/api/deposit', {
                headers: {
                    authorization: 'Bearer valid_token',
                },
            });

            const result = await requireAuth(request);

            // Should return user object with emailConfirmed: false
            expect(result).not.toHaveProperty('status');
            expect(result).toHaveProperty('id', 'user_123');
            expect(result).toHaveProperty('emailConfirmed', false);
        });
    });
});
