import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { getCSRFToken } from '@/lib/csrf-middleware';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user if available
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
    }

    // Generate and return CSRF token
    const csrfToken = await getCSRFToken(userId);

    return NextResponse.json({
      csrfToken,
      expiresIn: 3600000, // 1 hour in milliseconds
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}