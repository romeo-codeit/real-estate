import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

class AuditService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Log an audit event
  async logAuditEvent(
    userId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: ipAddress,
          user_agent: userAgent,
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Exception logging audit event:', error);
    }
  }

  // Get audit logs with pagination and filtering
  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select(`
          *,
          user:users!audit_logs_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Apply filters
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data to match our interface
      const logs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
        user: log.user ? {
          firstName: log.user.first_name,
          lastName: log.user.last_name,
          email: log.user.email,
        } : undefined,
      }));

      return { logs, total: count || 0 };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  // Get audit log statistics
  async getAuditStats(): Promise<{
    totalLogs: number;
    todayLogs: number;
    recentActions: { action: string; count: number }[];
  }> {
    try {
      // Get total logs
      const { count: totalLogs } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Get today's logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayLogs } = await this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get recent actions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: actionsData } = await this.supabase
        .from('audit_logs')
        .select('action')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Count actions
      const actionCounts: { [key: string]: number } = {};
      actionsData?.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      const recentActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalLogs: totalLogs || 0,
        todayLogs: todayLogs || 0,
        recentActions,
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        totalLogs: 0,
        todayLogs: 0,
        recentActions: [],
      };
    }
  }
}

const auditService = new AuditService(supabase);
export default auditService;