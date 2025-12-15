import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Report, ModerationQueueItem, ModerationAction, ReportsStats } from '@/lib/types';

class ReportsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Reports Management
  async createReport(reportData: {
    reported_user_id: string;
    content_type: Report['content_type'];
    content_id: string;
    reason: Report['reason'];
    description?: string;
  }): Promise<Report> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        ...reportData,
      })
      .select(`
        *,
        reporter:users!reports_reporter_id_fkey(id, firstName, lastName, email),
        reported_user:users!reports_reported_user_id_fkey(id, firstName, lastName, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async getReports(filters?: {
    status?: Report['status'];
    content_type?: Report['content_type'];
    limit?: number;
    offset?: number;
  }): Promise<Report[]> {
    let query = this.supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reports_reporter_id_fkey(id, firstName, lastName, email),
        reported_user:users!reports_reported_user_id_fkey(id, firstName, lastName, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.content_type) {
      query = query.eq('content_type', filters.content_type);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateReportStatus(
    reportId: string,
    status: Report['status'],
    adminNotes?: string
  ): Promise<Report> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_by = user.id;
      updateData.resolved_at = new Date().toISOString();
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    const { data, error } = await this.supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        *,
        reporter:users!reports_reporter_id_fkey(id, firstName, lastName, email),
        reported_user:users!reports_reported_user_id_fkey(id, firstName, lastName, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Moderation Queue Management
  async addToModerationQueue(itemData: {
    content_type: ModerationQueueItem['content_type'];
    content_id: string;
    flag_reason: ModerationQueueItem['flag_reason'];
    severity?: ModerationQueueItem['severity'];
  }): Promise<ModerationQueueItem> {
    const { data, error } = await this.supabase
      .from('moderation_queue')
      .insert(itemData)
      .select(`
        *,
        flagged_by_user:users!moderation_queue_flagged_by_fkey(id, firstName, lastName, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async getModerationQueue(filters?: {
    status?: ModerationQueueItem['status'];
    severity?: ModerationQueueItem['severity'];
    content_type?: ModerationQueueItem['content_type'];
    limit?: number;
    offset?: number;
  }): Promise<ModerationQueueItem[]> {
    let query = this.supabase
      .from('moderation_queue')
      .select(`
        *,
        flagged_by_user:users!moderation_queue_flagged_by_fkey(id, firstName, lastName, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.content_type) {
      query = query.eq('content_type', filters.content_type);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateModerationStatus(
    itemId: string,
    status: ModerationQueueItem['status'],
    reviewNotes?: string
  ): Promise<ModerationQueueItem> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status !== 'pending') {
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    if (reviewNotes) {
      updateData.review_notes = reviewNotes;
    }

    const { data, error } = await this.supabase
      .from('moderation_queue')
      .update(updateData)
      .eq('id', itemId)
      .select(`
        *,
        flagged_by_user:users!moderation_queue_flagged_by_fkey(id, firstName, lastName, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Moderation Actions
  async createModerationAction(actionData: {
    moderation_id?: string;
    report_id?: string;
    action_type: ModerationAction['action_type'];
    action_details?: Record<string, any>;
  }): Promise<ModerationAction> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('moderation_actions')
      .insert({
        performed_by: user.id,
        ...actionData,
      })
      .select(`
        *,
        performed_by_user:users!moderation_actions_performed_by_fkey(id, firstName, lastName, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Statistics
  async getReportsStats(): Promise<ReportsStats> {
    // Get reports stats
    const reportsStats = await this.supabase
      .from('reports')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error;
        const stats = {
          total: data?.length || 0,
          pending: data?.filter(r => r.status === 'pending').length || 0,
          investigating: data?.filter(r => r.status === 'investigating').length || 0,
          resolved: data?.filter(r => r.status === 'resolved').length || 0,
          dismissed: data?.filter(r => r.status === 'dismissed').length || 0,
        };
        return stats;
      });

    // Get moderation queue stats
    const moderationStats = await this.supabase
      .from('moderation_queue')
      .select('status, severity')
      .then(({ data, error }) => {
        if (error) throw error;
        const stats = {
          total: data?.length || 0,
          pending: data?.filter(m => m.status === 'pending').length || 0,
          critical: data?.filter(m => m.severity === 'critical').length || 0,
        };
        return stats;
      });

    return {
      totalReports: reportsStats.total,
      pendingReports: reportsStats.pending,
      investigatingReports: reportsStats.investigating,
      resolvedReports: reportsStats.resolved,
      dismissedReports: reportsStats.dismissed,
      moderationQueueItems: moderationStats.total,
      pendingModerationItems: moderationStats.pending,
      criticalItems: moderationStats.critical,
    };
  }
}

const reportsService = new ReportsService(supabase);
export default reportsService;