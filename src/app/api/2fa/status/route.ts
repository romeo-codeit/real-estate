import { NextRequest, NextResponse } from 'next/server';
import twoFactorService from '@/services/supabase/two-factor.service';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const record = await twoFactorService.getByUserId(userOrResponse.id);
  return NextResponse.json({
    enabled: !!record?.enabled,
    hasSecret: !!record?.secret,
  });
}
