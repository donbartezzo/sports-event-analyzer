import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { profileSchema, type ProfileFormData } from '../../lib/validations/profile';
import { useSupabase } from '../../lib/hooks/useSupabase';

export function ProfileForm() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useSupabase();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      notifications: {
        email: true,
        push: true,
      },
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Load user profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setValue('fullName', profile.full_name);
          setValue('email', user.email || '');
          setValue('bio', profile.bio);
          setValue('preferredAnalysisType', profile.preferred_analysis_type);
          setValue('notifications', {
            email: profile.email_notifications,
            push: profile.push_notifications,
          });
        }
      }
    };

    loadProfile();
  }, [supabase, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setStatus('idle');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: data.fullName,
          bio: data.bio,
          preferred_analysis_type: data.preferredAnalysisType,
          email_notifications: data.notifications.email,
          push_notifications: data.notifications.push,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setStatus('success');
    } catch (err) {
      console.error('Error updating profile:', err);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            {...register('fullName')}
            disabled={isLoading}
          />
          {errors.fullName && (
            <p className="text-sm font-medium text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            disabled={true} // Email can only be changed through auth settings
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm font-medium text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            {...register('bio')}
            disabled={isLoading}
            placeholder="Tell us about yourself"
          />
          {errors.bio && (
            <p className="text-sm font-medium text-destructive">
              {errors.bio.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="preferredAnalysisType">Preferred Analysis Type</Label>
          <Select
            disabled={isLoading}
            onValueChange={(value) => setValue('preferredAnalysisType', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select analysis type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Notifications</Label>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailNotifications"
                disabled={isLoading}
                onCheckedChange={(checked) => 
                  setValue('notifications.email', checked as boolean)
                }
              />
              <Label htmlFor="emailNotifications" className="text-sm font-normal">
                Email notifications
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pushNotifications"
                disabled={isLoading}
                onCheckedChange={(checked) => 
                  setValue('notifications.push', checked as boolean)
                }
              />
              <Label htmlFor="pushNotifications" className="text-sm font-normal">
                Push notifications
              </Label>
            </div>
          </div>
        </div>
      </div>

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>Failed to update profile</AlertDescription>
        </Alert>
      )}
      {status === 'success' && (
        <Alert>
          <AlertDescription>Profile updated successfully</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update profile'}
      </Button>
    </form>
  );
}
