'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Shield, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  RefreshCw,
  Trash2,
  LogOut,
  CheckCircle2,
  Calendar,
  Clock,
  CreditCard,
  AlertTriangle,
  Link2,
  Unlink,
  Key,
  Lock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface Session {
  id: string;
  device_type?: string;
  browser?: string;
  browser_version?: string;
  os?: string;
  os_version?: string;
  ip_address?: string;
  city?: string;
  country?: string;
  first_seen?: string;
  last_seen?: string;
  login_count: number;
  is_current: boolean;
}

export default function ProfilePage() {
  const { user, updateUser, fetchUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSession, setIsRevokingSession] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  
  // Account linking state
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/my-sessions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Revoke single session
  const handleRevokeSession = async (sessionId: string) => {
    setIsRevokingSession(sessionId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/my-sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }
      
      toast({ title: 'Session revoked successfully' });
      fetchSessions();
    } catch (error) {
      toast({
        title: 'Failed to revoke session',
        variant: 'destructive',
      });
    } finally {
      setIsRevokingSession(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllSessions = async () => {
    setIsRevokingAll(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/my-sessions`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to revoke sessions');
      }
      
      const data = await response.json();
      toast({ title: data.message });
      setShowRevokeAllDialog(false);
      fetchSessions();
    } catch (error) {
      toast({
        title: 'Failed to revoke sessions',
        variant: 'destructive',
      });
    } finally {
      setIsRevokingAll(false);
    }
  };

  // Get device icon
  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  // Set password for OAuth-only users
  const handleSetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSettingPassword(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/set-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to set password');
      }
      
      toast({ title: 'Password set successfully!' });
      setShowSetPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      // Refresh user data
      if (fetchUser) fetchUser();
    } catch (error: any) {
      toast({
        title: error.message || 'Failed to set password',
        variant: 'destructive',
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Disconnect Google account
  const handleDisconnectGoogle = async () => {
    setIsDisconnectingGoogle(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/disconnect-google`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to disconnect Google');
      }
      
      toast({ title: 'Google account disconnected' });
      // Refresh user data
      if (fetchUser) fetchUser();
    } catch (error: any) {
      toast({
        title: error.message || 'Failed to disconnect Google',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnectingGoogle(false);
    }
  };

  // Connect Google account
  const handleConnectGoogle = () => {
    // Redirect to Google OAuth
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback?action=connect`;
    const scope = 'openid email profile';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    
    window.location.href = googleAuthUrl;
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      // TODO: Call API to update profile
      updateUser(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">
      {/* Header Section with Avatar */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 rounded-xl" />
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 px-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 shadow-md transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{user?.name || 'User'}</h1>
              {user?.is_admin && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
              <Badge variant={user?.is_verified ? 'success' : 'warning'}>
                {user?.is_verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="shrink-0">
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      disabled={!isEditing}
                      {...register('name')}
                      className={!isEditing ? 'bg-muted/50' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+95 9 xxx xxx xxx"
                      disabled={!isEditing}
                      {...register('phone')}
                      className={!isEditing ? 'bg-muted/50' : ''}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Login Sessions Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Devices where you&apos;re currently logged in
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={fetchSessions}
                    disabled={isLoadingSessions}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                  </Button>
                  {sessions.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowRevokeAllDialog(true)}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sign Out All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        session.is_current 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Device Icon */}
                        <div className={`p-2 rounded-lg ${
                          session.is_current 
                            ? 'bg-primary/15 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {getDeviceIcon(session.device_type)}
                        </div>
                        
                        {/* Session Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {session.browser || 'Unknown Browser'} • {session.os || 'Unknown OS'}
                            </span>
                            {session.is_current && (
                              <Badge variant="default" className="text-xs shrink-0">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.ip_address || 'Unknown IP'}
                            </span>
                            {session.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.city}
                              </span>
                            )}
                            <span>
                              {session.last_seen 
                                ? formatDistanceToNow(new Date(session.last_seen), { addSuffix: true })
                                : 'Unknown'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Revoke Button */}
                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={isRevokingSession === session.id}
                        >
                          {isRevokingSession === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Account Stats & Settings */}
        <div className="space-y-6">
          {/* Account Stats Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant={user?.is_active ? 'success' : 'destructive'}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm">Credit Balance</span>
                <span className="font-semibold text-lg">
                  {user?.credit_balance?.toLocaleString() || 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </span>
                <span className="text-sm">
                  {user?.created_at
                    ? format(new Date(user.created_at), 'MMM d, yyyy')
                    : 'N/A'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last Login
                </span>
                <span className="text-sm">
                  {user?.last_login_at
                    ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Manage your login methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email/Password */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Email & Password</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                {user?.has_password ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowSetPasswordDialog(true)}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Set Password
                  </Button>
                )}
              </div>
              
              {/* Google */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Google</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.has_google ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {user?.has_google ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                    {user?.has_password && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDisconnectGoogle}
                        disabled={isDisconnectingGoogle}
                      >
                        {isDisconnectingGoogle ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleConnectGoogle}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
              
              {/* Info text */}
              <p className="text-xs text-muted-foreground text-center pt-2">
                {!user?.has_password && user?.has_google && (
                  "Set a password to enable email login"
                )}
                {user?.has_password && !user?.has_google && (
                  "Connect Google for faster login"
                )}
                {user?.has_password && user?.has_google && (
                  "You can login with either method"
                )}
              </p>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data.
              </p>
              <Button variant="destructive" size="sm" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of all other sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all other devices and browsers. 
              You will remain signed in on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeAllSessions}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRevokingAll}
            >
              {isRevokingAll ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Sign Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Password Dialog */}
      <AlertDialog open={showSetPasswordDialog} onOpenChange={setShowSetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Set Password
            </AlertDialogTitle>
            <AlertDialogDescription>
              Create a password to enable email login. You can then login with either Google or email/password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setNewPassword('');
              setConfirmPassword('');
            }}>
              Cancel
            </AlertDialogCancel>
            <Button 
              onClick={handleSetPassword}
              disabled={isSettingPassword || !newPassword || !confirmPassword}
            >
              {isSettingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Set Password
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
