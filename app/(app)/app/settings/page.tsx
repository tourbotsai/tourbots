"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppTitle } from "@/components/shared/app-title";
import { ProfileForm } from "@/components/app/settings/profile-form";
import { VenueSettings } from "@/components/app/settings/venue-settings";
import { Subscription } from "@/components/app/settings/subscription";
import { AgencySettings } from "@/components/app/settings/agency-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useRef } from "react";

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <AuthGuard requireAuth={true} requireVenue={true}>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const mobileTabsScrollRef = useRef<HTMLDivElement>(null);
  const settingsTabTriggerClass =
    "h-full shrink-0 whitespace-nowrap rounded-lg px-3 text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      mobileTabsScrollRef.current?.scrollTo({ left: 0, behavior: "auto" });
    }
  }, []);

  return (
    <div className="space-y-8 dark:rounded-2xl dark:border dark:border-slate-800/70 dark:bg-[#12161f]/88 dark:p-4 dark:[--background:220_18%_8%] dark:[--card:220_15%_11%] dark:[--popover:220_15%_11%] dark:[--muted:220_10%_18%] dark:[--muted-foreground:220_8%_70%] dark:[--border:220_9%_24%] dark:[--input:220_9%_24%] dark:[--ring:220_10%_70%]">
      <AppTitle 
        title="Settings"
        description="Manage your account, venue information, and subscription settings."
      />

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <div ref={mobileTabsScrollRef} className="overflow-x-auto md:overflow-visible">
          <TabsList className="flex h-10 w-max min-w-full items-stretch gap-1 rounded-xl border border-border/80 bg-muted/70 p-1 dark:border-input dark:bg-background md:grid md:w-full md:grid-cols-4">
            <TabsTrigger
              value="profile"
              className={settingsTabTriggerClass}
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="venue"
              className={settingsTabTriggerClass}
            >
              Account Settings
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className={settingsTabTriggerClass}
            >
              Billing
            </TabsTrigger>
            <TabsTrigger
              value="agency"
              className={settingsTabTriggerClass}
            >
              Agency Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="venue" className="space-y-6">
          <VenueSettings />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Subscription />
        </TabsContent>

        <TabsContent value="agency" className="space-y-6">
          <AgencySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
} 