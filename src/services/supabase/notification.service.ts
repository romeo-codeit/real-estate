import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase-admin';
import { EmailService } from '../../lib/email-service';

export type NotificationRecord = {
  id: string;
  user_id: string;
  type: string | null;
  title: string | null;
  body: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
};

class NotificationService {
  private supabase: SupabaseClient;
  private emailService: EmailService;

  constructor(client: SupabaseClient) {
    this.supabase = client;
    this.emailService = EmailService.getInstance();
  }

  async createNotification(input: {
    user_id: string;
    type?: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    is_read?: boolean;
  }): Promise<NotificationRecord | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type || 'general',
        title: input.title,
        body: input.body,
        data: input.data || {},
        is_read: input.is_read ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('createNotification error:', error);
      return null;
    }

    const notification = data as NotificationRecord;

    // Send email for important notifications
    try {
      await this.sendEmailForNotification(notification, input.data);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the notification creation if email fails
    }

    return notification;
  }

  async listUserNotifications(userId: string, limit = 50): Promise<NotificationRecord[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('listUserNotifications error:', error);
      return [];
    }

    return (data || []) as NotificationRecord[];
  }

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('id', notificationId);

    if (error) {
      console.error('markRead error:', error);
      return false;
    }

    return true;
  }

  async markAllRead(userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) {
      console.error('markAllRead error:', error);
      return false;
    }

    return true;
  }

  private async sendEmailForNotification(
    notification: NotificationRecord,
    data?: Record<string, any>
  ): Promise<void> {
    // Email notifications are currently disabled
    // In-app notifications will still be created and displayed to users
    console.log('[EMAIL DISABLED] Skipping email notification for:', {
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
    });

    // Uncomment below to reactivate email notifications
    // Get user email
    // const { data: user, error } = await this.supabase
    //   .from('users')
    //   .select('email, first_name, last_name')
    //   .eq('id', notification.user_id)
    //   .single();

    // if (error || !user?.email) {
    //   console.error('Failed to get user email for notification:', error);
    //   return;
    // }

    // const userName = `${user.first_name} ${user.last_name}`.trim();

    // Email sending disabled - uncomment below to reactivate
    // Send email based on notification type
    // switch (notification.type) {
    //   case 'transaction_completed':
    //     if (data?.type === 'deposit') {
    //       const template = this.emailService.getDepositConfirmationTemplate(
    //         userName,
    //         data.amount?.toString() || '0',
    //         data.currency || 'USD',
    //         data.transaction_id || ''
    //       );
    //       await this.emailService.sendEmail(user.email, template);
    //     } else if (data?.type === 'withdrawal') {
    //       const template = this.emailService.getWithdrawalConfirmationTemplate(
    //         userName,
    //         data.amount?.toString() || '0',
    //         data.currency || 'USD',
    //         data.transaction_id || ''
    //       );
    //       await this.emailService.sendEmail(user.email, template);
    //     } else if (data?.type === 'investment') {
    //       const template = this.emailService.getInvestmentConfirmationTemplate(
    //         userName,
    //         data.related_object?.property_name || 'Property Investment',
    //         data.amount?.toString() || '0',
    //         data.currency || 'USD',
    //         data.transaction_id || ''
    //       );
    //       await this.emailService.sendEmail(user.email, template);
    //     }
    //     break;
    //
    //   default:
    //     // For other notification types, we could add more email templates
    //     break;
    // }
  }
}

const notificationService = new NotificationService(supabaseAdmin);
export default notificationService;
