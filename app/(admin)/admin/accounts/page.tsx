"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppTitle } from "@/components/shared/app-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Eye, Loader2, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminAccountRow {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  toursCount: number;
  createdAt: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/accounts");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load accounts");
      }

      setAccounts(result.accounts || []);
    } catch (err: any) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="space-y-6">
      <AppTitle
        title="Accounts"
        description="Manage customer accounts, inspect their setup, and open account-level controls."
        action={
          <Button
            onClick={fetchAccounts}
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">All accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-8 text-center">
              <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">No accounts found yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Company name</th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact name</th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tours</th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                    <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3 text-sm font-medium text-slate-900">{account.companyName || "Not set"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{account.contactName || "Not set"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{account.email || "Not set"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{account.phone || "Not set"}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                          {account.toursCount}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600">
                        {new Date(account.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/admin/accounts/${account.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
