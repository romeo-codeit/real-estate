import { NextRequest, NextResponse } from 'next/server';
import { verifyTwoFAToken } from '@/lib/twofa';
import twoFactorService from '@/services/supabase/two-factor.service';
import { requireEmailVerified } from '@/lib/auth-utils';
import notificationService from '@/services/supabase/notification.service';

export async function POST(request: NextRequest) {
  const userOrResponse = await requireEmailVerified(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const body = await request.json().catch(() => ({}));
  const token = body?.token as string | undefined;

  if (!token) {
    return NextResponse.json({ error: 'Missing verification code' }, { status: 400 });
  }

  const record = await twoFactorService.getByUserId(userOrResponse.id);
  if (!record || !record.secret) {
    return NextResponse.json({ error: 'No 2FA secret found. Start setup again.' }, { status: 400 });
  }

  const isValid = verifyTwoFAToken(record.secret, token);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  await twoFactorService.setEnabled(userOrResponse.id, true);

  // Notify user for audit trail
  try {
    await notificationService.createNotification({
      user_id: userOrResponse.id,
      type: 'two_factor_enabled',
      title: 'Two-factor enabled',
      body: 'You successfully enabled two-factor authentication.',
      data: { enabled_at: new Date().toISOString() },
    });
  } catch (notifyError) {
    console.error('2FA enable notification error:', notifyError);
  }

  return NextResponse.json({ success: true });
}
