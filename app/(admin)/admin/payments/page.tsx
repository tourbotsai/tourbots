"use client";

import { AppTitle } from "@/components/shared/app-title";
import { AdminBillingVenuesTable } from "@/components/admin/payments/admin-billing-venues-table";
import { PaymentLinkCreator } from "@/components/admin/payments/payment-link-creator";
import { PaymentTables } from "@/components/admin/payments/payment-tables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <AppTitle
        title="Payment Management"
        description="Manage subscriptions, add-ons, overrides, and payment links across all venues."
      />

      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions">Subscriptions & Add-ons</TabsTrigger>
          <TabsTrigger value="payment-links">Payment Links</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-6">
          <AdminBillingVenuesTable />
        </TabsContent>

        <TabsContent value="payment-links" className="mt-6 space-y-6">
          <PaymentLinkCreator />
          <PaymentTables showSubscriptions={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 