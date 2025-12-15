'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import roiService from '@/services/supabase/roi.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-rbac';

interface ROISetting {
  id: string;
  investment_type: string;
  base_roi: number;
  adjustment_rate: number;
  growth_direction: string;
  last_updated: string;
  updated_by: string;
}

interface AdminControls {
  id: string;
  investment_growth_mode: string;
  roi_adjustment_rate: number;
  last_applied: string;
}

export default function AdminROIManagementPage() {
  const [roiSettings, setROISettings] = useState<ROISetting[]>([]);
  const [adminControls, setAdminControls] = useState<AdminControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadROIData();
  }, []);

  const loadROIData = async () => {
    try {
      const [settings, controls] = await Promise.all([
        roiService.getROISettings(),
        roiService.getAdminControls()
      ]);
      setROISettings(settings || []);
      setAdminControls(controls);
    } catch (error) {
      console.error('Error loading ROI data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ROI management data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleROIUpdate = async (investmentType: string, newROI: number) => {
    if (!user?.id) return;

    setUpdating(investmentType);
    try {
      await roiService.updateROI(investmentType, newROI, user.id);
      toast({
        title: 'Success',
        description: `ROI for ${investmentType} updated successfully.`,
      });
      loadROIData(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ROI.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleAdminControlsUpdate = async (updates: Partial<AdminControls>) => {
    try {
      await roiService.updateAdminControls(updates);
      toast({
        title: 'Success',
        description: 'Admin controls updated successfully.',
      });
      loadROIData(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update admin controls.',
        variant: 'destructive',
      });
    }
  };

  const handleApplyAutomaticAdjustments = async () => {
    try {
      const result = await roiService.applyAutomaticAdjustments();
      toast({
        title: 'Success',
        description: result.message,
      });
      loadROIData(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply automatic adjustments.',
        variant: 'destructive',
      });
    }
  };

  const getGrowthIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">ROI Management</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading ROI data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">ROI Management</h1>

      {/* Admin Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="growth-mode">Growth Mode</Label>
              <Select
                value={adminControls?.investment_growth_mode || 'automatic'}
                onValueChange={(value) => handleAdminControlsUpdate({ investment_growth_mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment-rate">Adjustment Rate (%)</Label>
              <Input
                id="adjustment-rate"
                type="number"
                step="0.1"
                value={adminControls?.roi_adjustment_rate || 0}
                onChange={(e) => handleAdminControlsUpdate({ roi_adjustment_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleApplyAutomaticAdjustments}
                disabled={adminControls?.investment_growth_mode === 'paused'}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Apply Adjustments
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Settings by Investment Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment Type</TableHead>
                <TableHead>Current ROI</TableHead>
                <TableHead>Growth Direction</TableHead>
                <TableHead>Adjustment Rate</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roiSettings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-medium capitalize">
                    {setting.investment_type}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{setting.base_roi}%</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getGrowthIcon(setting.growth_direction)}
                      <span className="capitalize">{setting.growth_direction}</span>
                    </div>
                  </TableCell>
                  <TableCell>{setting.adjustment_rate}%</TableCell>
                  <TableCell>
                    {new Date(setting.last_updated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="New ROI %"
                        className="w-24"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            const newROI = parseFloat(input.value);
                            if (!isNaN(newROI) && newROI >= 0) {
                              handleROIUpdate(setting.investment_type, newROI);
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updating === setting.investment_type}
                        onClick={() => {
                          const input = document.querySelector(`input[placeholder="New ROI %"]`) as HTMLInputElement;
                          const newROI = parseFloat(input?.value || '0');
                          if (!isNaN(newROI) && newROI >= 0) {
                            handleROIUpdate(setting.investment_type, newROI);
                            input.value = '';
                          }
                        }}
                      >
                        {updating === setting.investment_type ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Update'
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ROI History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent ROI Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            ROI history will be displayed here. This feature is under development.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}