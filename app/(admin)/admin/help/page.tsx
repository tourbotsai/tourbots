"use client";

import { useState } from "react";
import { AppTitle } from "@/components/shared/app-title";
import { AdminHelpTable } from "@/components/admin/help/admin-help-table";
import { AdminSupportConversations } from "@/components/admin/help/admin-support-conversations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';

export default function AdminHelpPage() {
  const [activeTab, setActiveTab] = useState("help-articles");

  return (
    <div className="space-y-8">
      <AppTitle
        title="Help Centre Management"
        description="Manage help articles and live contact conversations"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="help-articles">Help Articles</TabsTrigger>
          <TabsTrigger value="contact-form">Contact Form</TabsTrigger>
        </TabsList>

        <TabsContent value="help-articles" className="space-y-6">
          <AdminHelpTable />
        </TabsContent>

        <TabsContent value="contact-form" className="space-y-6">
          <AdminSupportConversations />
        </TabsContent>
      </Tabs>
    </div>
  );
} 