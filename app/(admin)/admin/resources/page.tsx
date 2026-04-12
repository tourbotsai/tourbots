"use client";

import { useState } from "react";
import { AppTitle } from "@/components/shared/app-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminBlogsTable } from "@/components/admin/resources/blogs/admin-blogs-table";
import { AdminGuidesTable } from "@/components/admin/resources/guides/admin-guides-table";

export const dynamic = 'force-dynamic';

export default function AdminResourcesPage() {
  const [activeTab, setActiveTab] = useState("blogs");

  return (
    <div className="space-y-8">
      <AppTitle
        title="Resources Management"
        description="Manage blogs and guides for the platform's knowledge base"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="blogs" className="space-y-6">
          <AdminBlogsTable />
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <AdminGuidesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
} 