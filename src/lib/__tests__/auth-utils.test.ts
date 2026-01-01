import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { NextResponse } from 'next/server';

// Mock services
vi.mock('@/services/supabase/supabase-admin', () => ({
    supabaseAdmin: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    },
}));

vi.mock('server-only', () => ({}));

describe('requireAdmin Helper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 401 if no authorization header', async () => {
        const req = new Request('http://localhost/api/test', {
            headers: {},
        });

        const result = await requireAdmin(req as any);
        expect(result).toBeInstanceOf(NextResponse);
        if (result instanceof NextResponse) {
            expect(result.status).toBe(401);
        }
    });

    it('should return 401 if token is invalid', async () => {
        (supabaseAdmin.auth.getUser as any).mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' },
        });

        const req = new Request('http://localhost/api/test', {
            headers: { authorization: 'Bearer invalid' },
        });

        const result = await requireAdmin(req as any);
        expect(result).toBeInstanceOf(NextResponse);
        if (result instanceof NextResponse) {
            expect(result.status).toBe(401);
        }
    });

    it('should return 403 if user is not admin', async () => {
        (supabaseAdmin.auth.getUser as any).mockResolvedValue({
            data: { user: { id: 'user_123' } },
            error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { role: 'user' },
                    error: null,
                }),
            }),
        });
        (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

        const req = new Request('http://localhost/api/test', {
            headers: { authorization: 'Bearer token' },
        });

        const result = await requireAdmin(req as any);
        expect(result).toBeInstanceOf(NextResponse);
        if (result instanceof NextResponse) {
            expect(result.status).toBe(403);
        }
    });

    it('should return user object if admin', async () => {
        (supabaseAdmin.auth.getUser as any).mockResolvedValue({
            data: { user: { id: 'admin_123', email: 'admin@test.com' } },
            error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { role: 'admin' },
                    error: null,
                }),
            }),
        });
        (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

        const req = new Request('http://localhost/api/test', {
            headers: { authorization: 'Bearer token' },
        });

        const result = await requireAdmin(req as any);
        expect(result).not.toBeInstanceOf(NextResponse);
        expect(result).toEqual({
            id: 'admin_123',
            email: 'admin@test.com',
            role: 'admin'
        });
    });
});
