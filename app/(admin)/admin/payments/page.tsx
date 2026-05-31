"use client";

import { AppTitle } from "@/components/shared/app-title";
import { PaymentsOverview } from "@/components/admin/payments/payments-overview";
import { AdminBillingVenuesTable } from "@/components/admin/payments/admin-billing-venues-table";
import { PaymentLinkCreator } from "@/components/admin/payments/payment-link-creator";
import { PaymentLinksList } from "@/components/admin/payments/payment-links-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <AppTitle
        title="Payments"
        description="Live revenue, subscriptions, payment links, and manual plan overrides across all accounts."
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="overrides">Plan overrides</TabsTrigger>
          <TabsTrigger value="payment-links">Payment links</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <PaymentsOverview />
        </TabsContent>

        <TabsContent value="overrides" className="mt-6">
          <AdminBillingVenuesTable />
        </TabsContent>

        <TabsContent value="payment-links" className="mt-6 space-y-6">
          <PaymentLinkCreator />
          <PaymentLinksList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
