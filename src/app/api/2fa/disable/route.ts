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

  const record = await twoFactorService.getByUserId(userOrResponse.id);

  if (record?.enabled) {
    if (!token) {
      return NextResponse.json({ error: 'Verification code required to disable 2FA' }, { status: 400 });
    }

    const isValid = verifyTwoFAToken(record.secret, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }
  }

  await twoFactorService.disable(userOrResponse.id);

  try {
    await notificationService.createNotification({
      user_id: userOrResponse.id,
      type: 'two_factor_disabled',
      title: 'Two-factor disabled',
      body: 'Two-factor authentication was disabled on your account.',
      data: { disabled_at: new Date().toISOString() },
    });
  } catch (notifyError) {
    console.error('2FA disable notification error:', notifyError);
  }

  return NextResponse.json({ success: true });
}
