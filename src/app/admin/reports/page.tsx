"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/services/supabase/supabase";
import type { Report, ModerationQueueItem, ReportsStats } from "@/lib/types";
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Flag,
  MessageSquare
} from "lucide-react";

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [moderationItems, setModerationItems] = useState<ModerationQueueItem[]>([]);
  const [stats, setStats] = useState<ReportsStats | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedModerationItem, setSelectedModerationItem] = useState<ModerationQueueItem | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // Filters
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [moderationStatusFilter, setModerationStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        return;
      }

      // Fetch reports
      const reportsRes = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      // Fetch moderation queue
      const moderationRes = await fetch('/api/moderation', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (moderationRes.ok) {
        const moderationData = await moderationRes.json();
        setModerationItems(moderationData.moderationItems || []);
      }

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats.reportsStats);
      }

    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({
        title: "Error",
        description: "Failed to load reports data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, status: Report['status']) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Report ${status} successfully.`,
        });

        // Refresh data
        await fetchReportsData();
        setActionDialogOpen(false);
        setSelectedReport(null);
        setAdminNotes('');
      } else {
        throw new Error('Failed to update report');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report status.",
        variant: "destructive",
      });
    }
  };

  const handleModerationAction = async (itemId: string, status: ModerationQueueItem['status']) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/moderation/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Moderation item ${status} successfully.`,
        });

        // Refresh data
        await fetchReportsData();
        setModerationDialogOpen(false);
        setSelectedModerationItem(null);
        setReviewNotes('');
      } else {
        throw new Error('Failed to update moderation item');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update moderation status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock },
      investigating: { variant: 'default' as const, icon: Eye },
      resolved: { variant: 'default' as const, icon: CheckCircle },
      dismissed: { variant: 'outline' as const, icon: XCircle },
      reviewing: { variant: 'default' as const, icon: Eye },
      approved: { variant: 'default' as const, icon: CheckCircle },
      rejected: { variant: 'destructive' as const, icon: XCircle },
      removed: { variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive',
    } as const;

    return (
      <Badge variant={severityConfig[severity as keyof typeof severityConfig] || 'secondary'}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = reportStatusFilter === 'all' || report.status === reportStatusFilter;
    const matchesSearch = !searchTerm ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredModerationItems = moderationItems.filter(item => {
    const matchesStatus = moderationStatusFilter === 'all' || item.status === moderationStatusFilter;
    const matchesSearch = !searchTerm || item.content_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading reports and moderation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Moderation</h1>
          <p className="text-muted-foreground">Manage user reports and content moderation queue</p>
        </div>
        <Button onClick={fetchReportsData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReports}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingReports} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moderation Queue</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.moderationQueueItems}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingModerationItems} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedReports}</div>
              <p className="text-xs text-muted-foreground">
                {stats.dismissedReports} dismissed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalItems}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search reports, users, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            User Reports ({filteredReports.length})
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Moderation Queue ({filteredModerationItems.length})
          </TabsTrigger>
        </TabsList>

        {/* User Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No reports match your search criteria.' : 'No user reports have been submitted yet.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {report.reason.charAt(0).toUpperCase() + report.reason.replace('_', ' ').slice(1)} Report
                        </CardTitle>
                        <CardDescription>
                          Reported by {report.reporter?.email} • {new Date(report.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Content Type</Label>
                        <p className="text-sm text-muted-foreground capitalize">{report.content_type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Reported User</Label>
                        <p className="text-sm text-muted-foreground">{report.reported_user?.email}</p>
                      </div>
                    </div>

                    {report.description && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {report.description}
                        </p>
                      </div>
                    )}

                    {report.admin_notes && (
                      <div>
                        <Label className="text-sm font-medium">Admin Notes</Label>
                        <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                          {report.admin_notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Dialog open={actionDialogOpen && selectedReport?.id === report.id} onOpenChange={(open) => {
                        setActionDialogOpen(open);
                        if (!open) setSelectedReport(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Review Report</DialogTitle>
                            <DialogDescription>
                              Take action on this user report.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                              <Textarea
                                id="admin-notes"
                                placeholder="Add notes about your investigation or decision..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReportAction(report.id, 'investigating')}
                                variant="outline"
                              >
                                Mark as Investigating
                              </Button>
                              <Button
                                onClick={() => handleReportAction(report.id, 'resolved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve
                              </Button>
                              <Button
                                onClick={() => handleReportAction(report.id, 'dismissed')}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Moderation Queue Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={moderationStatusFilter} onValueChange={setModerationStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredModerationItems.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Moderation queue is empty</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No items match your search criteria.' : 'No content is currently flagged for moderation.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredModerationItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg capitalize">
                          {item.content_type} Content
                        </CardTitle>
                        <CardDescription>
                          ID: {item.content_id} • Flagged {new Date(item.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(item.severity)}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Flag Reason</Label>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.flag_reason.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Severity</Label>
                        <p className="text-sm text-muted-foreground capitalize">{item.severity}</p>
                      </div>
                    </div>

                    {item.review_notes && (
                      <div>
                        <Label className="text-sm font-medium">Review Notes</Label>
                        <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                          {item.review_notes}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Dialog open={moderationDialogOpen && selectedModerationItem?.id === item.id} onOpenChange={(open) => {
                        setModerationDialogOpen(open);
                        if (!open) setSelectedModerationItem(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedModerationItem(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Review Moderation Item</DialogTitle>
                            <DialogDescription>
                              Take action on this flagged content.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                              <Textarea
                                id="review-notes"
                                placeholder="Add notes about your review decision..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() => handleModerationAction(item.id, 'reviewing')}
                                variant="outline"
                              >
                                Mark as Reviewing
                              </Button>
                              <Button
                                onClick={() => handleModerationAction(item.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleModerationAction(item.id, 'rejected')}
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleModerationAction(item.id, 'removed')}
                                variant="destructive"
                              >
                                Remove Content
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
