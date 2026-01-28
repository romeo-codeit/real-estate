import { NextRequest, NextResponse } from 'next/server';
import notificationService from '@/services/supabase/notification.service';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const notifications = await notificationService.listUserNotifications(userOrResponse.id, 100);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const userOrResponse = await requireAuth(request);
  if (userOrResponse instanceof NextResponse) return userOrResponse;

  const body = await request.json().catch(() => ({}));
  const { id, markAll } = body || {};

  if (markAll) {
    const success = await notificationService.markAllRead(userOrResponse.id);
    return NextResponse.json({ success });
  }

  if (!id) {
    return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
  }

  const success = await notificationService.markRead(userOrResponse.id, id);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
