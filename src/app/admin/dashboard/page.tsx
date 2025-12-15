"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, BarChart, AlertTriangle, FileText, RefreshCw, Shield, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-rbac";
import { supabase } from "@/services/supabase/supabase";

export default function AdminDashboardPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalInvestments: 0,
    openReports: 0,
    userGrowth: 0,
    propertyGrowth: 0,
    investmentGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, role } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get the current session for authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('No active session');
        }

        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const handleGenerateBlogPosts = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-blog-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'manual-admin'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success!",
          description: `Generated ${result.count} blog posts successfully.`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate blog posts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate blog posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `+${stats.userGrowth}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalProperties.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `+${stats.propertyGrowth} from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `$${(stats.totalInvestments / 1000000).toFixed(1)}M`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `+${stats.investmentGrowth}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.openReports.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : '3 new reports today'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blog Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Content Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Generate Blog Posts</h3>
              <p className="text-sm text-muted-foreground">
                Create AI-generated blog posts about crypto, investments, and real estate
              </p>
            </div>
            <Button
              onClick={handleGenerateBlogPosts}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Posts'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Webhook Endpoint</h4>
            <p className="text-sm text-muted-foreground mb-2">
              News services can automatically trigger blog post generation:
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              POST {process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/webhooks/blog-news
            </code>
          </div>
        </CardContent>
      </Card>

       <div className="text-center py-12">
        <h2 className="text-2xl">Moderation Queues Overview</h2>
        <p className="text-muted-foreground">This section is under construction. Queues will be displayed here.</p>
      </div>
    </div>
  );
}
