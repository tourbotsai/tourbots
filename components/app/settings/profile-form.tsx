"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User, Mail, Phone, Building2, Save, Upload, Camera, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/app/shared/theme-provider";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateVenue } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const { theme, setTheme, isLoading: isThemeUpdating } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isHideOnboardingUpdating, setIsHideOnboardingUpdating] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/app/profile', {
        method: 'PUT',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update profile');
      }

      window.location.reload();

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingAvatar(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update user's profile_image_url in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local user context (you might need to refresh user data)
      window.location.reload(); // Simple way to refresh user data
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading profile...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Profile Settings
          </CardTitle>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Manage your personal information and preferences
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/70 flex items-center justify-center">
                {user.profile_image_url ? (
                  <img 
                    src={user.profile_image_url} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-600 dark:text-slate-300" />
                )}
              </div>
              
              <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center transition-colors hover:bg-slate-800 dark:hover:bg-slate-200">
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white dark:text-slate-900" />
                  )}
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {user.email}
              </p>
              <div className="flex items-center mt-2 text-sm text-text-tertiary-light dark:text-text-tertiary-dark">
                <Building2 className="w-4 h-4 mr-1" />
                {user.venue?.name || "No venue assigned"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Personal Information</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Update your personal details and account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your first name"
                          className="h-10 sm:h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your last name"
                          className="h-10 sm:h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        className="h-10 sm:h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      This email will be used for account notifications and password resets
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto min-w-[120px] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Display Preferences</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Customise how your dashboard appears
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex flex-row items-center justify-between rounded-lg border border-border/80 bg-muted/20 dark:border-input dark:bg-background p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium dark:text-text-primary-dark">
                Dark Mode
              </Label>
              <p className="text-xs text-muted-foreground dark:text-text-secondary-dark">
                Switch between light and dark themes for your dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4 text-yellow-500 dark:text-slate-400" />
              <Switch
                className="dark:border-slate-600 dark:data-[state=checked]:bg-slate-500 dark:data-[state=unchecked]:bg-slate-800"
                checked={theme === "dark"}
                disabled={isThemeUpdating || !user?.venue}
                onCheckedChange={async (checked) => {
                  try {
                    await setTheme(checked ? "dark" : "light");

                    toast({
                      title: "Theme updated",
                      description: `Switched to ${checked ? "dark" : "light"} mode`,
                    });
                  } catch (error) {
                    console.error("Error updating theme:", error);
                    toast({
                      title: "Error",
                      description: "Failed to update theme preference",
                      variant: "destructive",
                    });
                  }
                }}
              />
              <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border border-border/80 bg-muted/20 dark:border-input dark:bg-background p-4">
            <div className="space-y-0.5 pr-3">
              <Label
                htmlFor="hide-onboarding-checklist"
                className="text-sm font-medium dark:text-text-primary-dark"
              >
                Hide onboarding checklist
              </Label>
              <p className="text-xs text-muted-foreground dark:text-text-secondary-dark">
                Remove the checklist from your dashboard entirely (you can turn it back on here at any time).
              </p>
            </div>
            <Switch
              id="hide-onboarding-checklist"
              className="shrink-0 dark:border-slate-600 dark:data-[state=checked]:bg-slate-500 dark:data-[state=unchecked]:bg-slate-800"
              checked={Boolean(user?.venue?.hide_onboarding_checklist)}
              disabled={isHideOnboardingUpdating || !user?.venue}
              onCheckedChange={async (checked) => {
                try {
                  setIsHideOnboardingUpdating(true);
                  await updateVenue({ hide_onboarding_checklist: checked });
                  toast({
                    title: checked ? "Checklist hidden" : "Checklist visible",
                    description: checked
                      ? "The onboarding checklist will no longer appear on your dashboard."
                      : "The onboarding checklist is shown on your dashboard again.",
                  });
                } catch (error) {
                  console.error("Error updating hide checklist preference:", error);
                  toast({
                    title: "Error",
                    description: "Failed to update display preference. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsHideOnboardingUpdating(false);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 