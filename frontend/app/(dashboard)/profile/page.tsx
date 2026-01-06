'use client';

import { useState } from 'react';
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
import { Loader2, User, Mail, Phone, Camera, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 text-center">
                {user?.is_admin && (
                  <Badge variant="secondary">
                    <Shield className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    className="pl-10"
                    disabled={!isEditing}
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ''}
                    className="pl-10"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+95 9 xxx xxx xxx"
                    className="pl-10"
                    disabled={!isEditing}
                    {...register('phone')}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Account Status</span>
              <Badge variant={user?.is_active ? 'success' : 'destructive'}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email Verified</span>
              <Badge variant={user?.is_verified ? 'success' : 'warning'}>
                {user?.is_verified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Member Since</span>
              <span>
                {user?.created_at
                  ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Last Login</span>
              <span>
                {user?.last_login_at
                  ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
