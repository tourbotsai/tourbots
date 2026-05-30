"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AppTitle } from "@/components/shared/app-title";
import { AgencySettings } from "@/components/app/settings/agency-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBilling } from "@/hooks/app/useBilling";
import { useUser } from "@/hooks/useUser";
import { venueHasAgencyPortal } from "@/lib/billing-entitlements";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AgencyPage() {
  return (
    <AuthGuard requireAuth={true} requireVenue={true}>
      <AgencyContent />
    </AuthGuard>
  );
}

function AgencyContent() {
  const { user } = useUser();
  const { billingRecord, fetchBilling, isLoading } = useBilling();

  useEffect(() => {
    if (user?.venue_id) {
      void fetchBilling();
    }
  }, [user?.venue_id, fetchBilling]);

  const isAgencyPlan = venueHasAgencyPortal(billingRecord);

  return (
    <div className="space-y-8 dark:rounded-2xl dark:border dark:border-slate-800/70 dark:bg-[#12161f]/88 dark:p-4 dark:[--background:220_18%_8%] dark:[--card:220_15%_11%] dark:[--popover:220_15%_11%] dark:[--muted:220_10%_18%] dark:[--muted-foreground:220_8%_70%] dark:[--border:220_9%_24%] dark:[--input:220_9%_24%] dark:[--ring:220_10%_70%]">
      <AppTitle
        title="Agency"
        description="Manage your agency portal branding and client access."
      />

      {isLoading && !billingRecord ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading agency settings...
        </div>
      ) : isAgencyPlan ? (
        <AgencySettings />
      ) : (
        <Card className="dark:border-slate-800 dark:bg-[#121923]/92">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-base font-medium">The Agency plan is required for this page.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Upgrade to the Agency plan to set up branded client portals, share tour chatbots with your clients, and manage agency add-ons.
            </p>
            <Button asChild className="mt-2">
              <Link href="/app/settings">Go to Billing</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
