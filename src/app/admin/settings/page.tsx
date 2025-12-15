
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, User as UserIcon, Settings, Shield, Users, RefreshCw, TrendingUp, BarChart } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-rbac';
import userService from '@/services/supabase/user.service';
import adminSettingsService from '@/services/supabase/admin-settings.service';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  // Roles & Permissions state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userStatus, setUserStatus] = useState("");

  // Automation Rules state
  const [roiSettings, setRoiSettings] = useState<any[]>([]);
  const [adminControls, setAdminControls] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const userData = await userService.getUserById(user.id) as any;
        if (userData) {
          // Split full_name into first and last name
          const nameParts = (userData.full_name || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setEmail(userData.email || '');
          setPhone(userData.phone_number || '');
          setUsername(userData.email?.split('@')[0] || '');
          setProfileImage(null); // No profile_photo in database
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load profile data.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, toast]);

  useEffect(() => {
    // Cleanup camera stream when dialog closes
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraDialogOpen]);

  // Load data when component mounts
  useEffect(() => {
    loadUsers();
    loadAutomationSettings();
  }, []);

  // Load users for role management
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersData = await adminSettingsService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users.',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load automation settings
  const loadAutomationSettings = async () => {
    setLoadingSettings(true);
    try {
      const [roiData, controlsData] = await Promise.all([
        adminSettingsService.getROISettings(),
        adminSettingsService.getAdminControls(),
      ]);
      setRoiSettings(roiData);
      setAdminControls(controlsData);
    } catch (error) {
      console.error('Error loading automation settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load automation settings.',
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  // Update user role and permissions
  const updateUserRole = async (userId: string, role: string, permissions: string[]) => {
    try {
      await adminSettingsService.updateUserRole(userId, role, permissions);
      toast({
        title: 'Success',
        description: 'User role updated successfully.',
      });
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user role.',
      });
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await adminSettingsService.updateUserStatus(userId, status);
      toast({
        title: 'Success',
        description: 'User status updated successfully.',
      });
      loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user status.',
      });
    }
  };

  // Update ROI settings
  const updateROISetting = async (investmentType: string, updates: any) => {
    try {
      await adminSettingsService.updateROISetting(investmentType, updates);
      toast({
        title: 'Success',
        description: 'ROI settings updated successfully.',
      });
      loadAutomationSettings(); // Refresh the settings
    } catch (error) {
      console.error('Error updating ROI settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update ROI settings.',
      });
    }
  };

  // Update admin controls
  const updateAdminControls = async (updates: any) => {
    try {
      await adminSettingsService.updateAdminControls(updates);
      toast({
        title: 'Success',
        description: 'Admin controls updated successfully.',
      });
      loadAutomationSettings(); // Refresh the settings
    } catch (error) {
      console.error('Error updating admin controls:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update admin controls.',
      });
    }
  };

  const getCameraPermission = async () => {
    // Reset state each time we open the dialog
    setHasCameraPermission(null);

    // Stop any existing stream before requesting a new one
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Unable to access camera. Please check your permissions.',
      });
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvasRef.current.toDataURL('image/png');
        setProfileImage(imageDataUrl);
        setIsCameraDialogOpen(false);

        // Stop the camera stream
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await userService.updateUser(user?.id || '', {
        firstName,
        lastName,
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Automation Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your personal information and profile picture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <Avatar className="w-32 h-32 text-muted-foreground border">
                  <AvatarImage src={profileImage || undefined} alt="Profile Picture" />
                  <AvatarFallback>
                    <UserIcon className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <AlertDialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" onClick={getCameraPermission}>
                          <Camera className="mr-2 h-4 w-4" />
                          Take Photo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Take Profile Picture</AlertDialogTitle>
                          <AlertDialogDescription>
                            Position yourself in the camera and click "Take Photo" when ready.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                          {hasCameraPermission === false && (
                            <Alert>
                              <AlertTitle>Camera Access Required</AlertTitle>
                              <AlertDescription>
                                Please allow camera access to take a photo.
                              </AlertDescription>
                            </Alert>
                          )}
                          <div className="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-64 bg-black rounded-lg"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={takePhoto} disabled={hasCameraPermission !== true}>
                              Take Photo
                            </Button>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                          </div>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>

                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="w-full md:w-auto">
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles & Permissions
              </CardTitle>
              <CardDescription>Manage user roles and permissions across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">User Management</h3>
                    <p className="text-sm text-muted-foreground">Manage user roles and access permissions</p>
                  </div>
                  <Button onClick={loadUsers} variant="outline" disabled={loadingUsers}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              user.status === 'Active' ? 'default' :
                              user.status === 'Suspended' ? 'destructive' : 'secondary'
                            }>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(user.permissions || []).slice(0, 2).map((perm: string) => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm.replace('_', ' ')}
                                </Badge>
                              ))}
                              {(user.permissions || []).length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(user.permissions || []).length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(value) => updateUserRole(user.id, value, user.permissions || [])}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="investor">Investor</SelectItem>
                                  <SelectItem value="agent">Agent</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={user.status}
                                onValueChange={(value) => updateUserStatus(user.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Active</SelectItem>
                                  <SelectItem value="Suspended">Suspended</SelectItem>
                                  <SelectItem value="Banned">Banned</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {users.length === 0 && !loadingUsers && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>Configure platform-wide automation and ROI settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Platform Automation</h3>
                    <p className="text-sm text-muted-foreground">Manage automated investment growth and ROI adjustments</p>
                  </div>
                  <Button onClick={loadAutomationSettings} variant="outline" disabled={loadingSettings}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingSettings ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {/* Admin Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Investment Growth Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="growthMode">Growth Mode</Label>
                        <Select
                          value={adminControls?.investment_growth_mode || 'automatic'}
                          onValueChange={(value) => updateAdminControls({ investment_growth_mode: value })}
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
                        <Label htmlFor="adjustmentRate">ROI Adjustment Rate (%)</Label>
                        <Input
                          id="adjustmentRate"
                          type="number"
                          step="0.1"
                          value={adminControls?.roi_adjustment_rate || 0}
                          onChange={(e) => updateAdminControls({ roi_adjustment_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ROI Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      ROI Settings by Investment Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {roiSettings.map((setting) => (
                        <div key={setting.investment_type} className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg">
                          <div>
                            <Label className="text-sm font-medium capitalize">
                              {setting.investment_type}
                            </Label>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Base ROI (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={setting.base_roi}
                              onChange={(e) => updateROISetting(setting.investment_type, {
                                base_roi: parseFloat(e.target.value) || 0
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Adjustment Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={setting.adjustment_rate}
                              onChange={(e) => updateROISetting(setting.investment_type, {
                                adjustment_rate: parseFloat(e.target.value) || 0
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Growth Direction</Label>
                            <Select
                              value={setting.growth_direction}
                              onValueChange={(value) => updateROISetting(setting.investment_type, {
                                growth_direction: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="up">Up</SelectItem>
                                <SelectItem value="down">Down</SelectItem>
                                <SelectItem value="stable">Stable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
