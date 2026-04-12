"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardContent } from "@/components/app/dashboard/dashboard-content";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true} requireVenue={true}>
      <DashboardContent />
    </AuthGuard>
  );
} 