import { NextRequest, NextResponse } from 'next/server';
import { generateTwoFASecret } from '@/lib/twofa';
import twoFactorService from '@/services/supabase/two-factor.service';
import { requireEmailVerified } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const userOrResponse = await requireEmailVerified(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const label = userOrResponse.email || userOrResponse.id;
  const { secret, otpauthUrl } = generateTwoFASecret(label);

  await twoFactorService.upsertSecret(userOrResponse.id, secret, false);

  return NextResponse.json({
    secret,
    otpauthUrl,
  });
}
