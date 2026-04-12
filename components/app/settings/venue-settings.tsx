"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Building2,
  Save,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUser";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { supabase } from "@/lib/supabase";
import { TeamMembersSettings } from "@/components/app/settings/team-members-settings";

const venueSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website_url: z.string().url("Invalid website URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  subscription_plan: z.enum(["essential", "professional", "premium"]),
});

type VenueFormData = z.infer<typeof venueSchema>;

export function VenueSettings() {
  const { user, updateUser } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const form = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: "",
      description: "",
      email: "",
      phone: "",
      website_url: "",
      address: "",
      city: "",
      postcode: "",
      subscription_plan: "essential",
    },
  });

  useEffect(() => {
    if (user?.venue) {
      form.reset({
        name: user.venue.name || "",
        description: user.venue.description || "",
        email: user.venue.email || "",
        phone: user.venue.phone || "",
        website_url: user.venue.website_url || "",
        address: user.venue.address || "",
        city: user.venue.city || "",
        postcode: user.venue.postcode || "",
        subscription_plan: (user.venue.subscription_plan as "essential" | "professional" | "premium") || "essential",
      });
    }
  }, [user?.venue, form]);

  const onSubmit = async (data: VenueFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/venues/${user?.venue?.id}`, {
        method: "PATCH",
        headers: await getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update venue settings");
      }

      await updateUser({});

      toast({
        title: "Venue settings updated",
        description: "Your venue information has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating venue settings:", error);
      toast({
        title: "Error",
        description: "Failed to update venue settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.venue) return;

    try {
      setIsUploadingLogo(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.venue.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('venue-logo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('venue-logo')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('venues')
        .update({ logo_url: publicUrl })
        .eq('id', user.venue.id);

      if (updateError) {
        throw updateError;
      }

      window.location.reload();

      toast({
        title: "Logo updated",
        description: "Your venue logo has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!user?.venue) {
    return (
      <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
        <CardContent className="text-center py-8 sm:py-12">
          <Building2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-text-tertiary-light dark:text-text-tertiary-dark" />
          <h3 className="text-lg sm:text-xl font-medium mb-2">No Venue Profile</h3>
          <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark">
            Contact support to set up your venue profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Update your venue's basic details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Venue Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your venue name"
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City, Country"
                        className="h-10 sm:h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+44 20 1234 5678"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="info@yourvenue.com"
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
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Website URL
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://www.yourvenue.com"
                      className="h-10 sm:h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[120px] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
          </CardContent>
          </Card>
        </form>
      </Form>

      <TeamMembersSettings />
    </div>
  );
}
