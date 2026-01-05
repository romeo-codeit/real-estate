import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth-utils';

/**
 * GET /api/csrf
 * Generate and return a CSRF token for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const userOrResponse = await requireAuth(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }
    const user = userOrResponse;

    // Generate a new CSRF token for this user
    const token = CSRFProtection.createToken(user.id);

    return NextResponse.json(
      { 
        token,
        expiresIn: 3600, // 1 hour in seconds
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        }
      }
    );
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
