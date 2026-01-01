import { NextResponse } from 'next/server';
import adminService from '@/services/supabase/admin.service';
import { getPropertiesCount } from '@/services/sanity/properties.sanity';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import reportsService from '@/services/supabase/reports.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET(request: Request) {
  const limit = checkRateLimit(request as any, { windowMs: 60_000, max: 60 }, 'admin_stats_get');
  if (!limit.ok && limit.response) return limit.response;

  try {
    // Verify admin authentication
    const adminOrResponse = await requireAdmin(request as any);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }
    // const adminUser = adminOrResponse; // User verified as admin

    console.log('Fetching admin stats...');

    const [
      totalUsers,
      totalProperties,
      totalInvestments,
      transactionStats,
      recentRegistrations
    ] = await Promise.all([
      adminService.getTotalUsers().catch(err => {
        console.error('Error getting total users:', err);
        return 0;
      }),
      getPropertiesCount().catch(err => {
        console.error('Error getting properties count:', err);
        return 0;
      }),
      adminService.getTotalInvestments().catch(err => {
        console.error('Error getting total investments:', err);
        return 0;
      }),
      adminService.getTransactionStats().catch(err => {
        console.error('Error getting transaction stats:', err);
        return { deposits: 0, withdrawals: 0 };
      }),
      adminService.getRecentRegistrations().catch(err => {
        console.error('Error getting recent registrations:', err);
        return 0;
      })
    ]);

    console.log('Stats fetched successfully:', { totalUsers, totalProperties, totalInvestments, transactionStats, recentRegistrations });

    // Calculate growth percentages (simplified - in real app you'd compare with previous periods)
    const userGrowth = recentRegistrations > 0 ? ((recentRegistrations / totalUsers) * 100) : 0;

    // Get reports statistics
    const reportsStats = await reportsService.getReportsStats();

    const stats = {
      totalUsers,
      totalProperties,
      totalInvestments,
      openReports: reportsStats.pendingReports + reportsStats.investigatingReports,
      userGrowth: Math.round(userGrowth * 10) / 10, // Round to 1 decimal
      propertyGrowth: 15, // Placeholder - would need historical data
      investmentGrowth: 18, // Placeholder - would need historical data
      reportsStats,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('API /admin/stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch admin stats',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}