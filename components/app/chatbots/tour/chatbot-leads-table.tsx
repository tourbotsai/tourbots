"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead, LeadStatus } from "@/lib/types";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface ChatbotLeadsTableProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatbotConfigId?: string | null;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function statusVariant(status: LeadStatus): "default" | "secondary" | "outline" {
  if (status === "contacted") return "secondary";
  if (status === "archived") return "outline";
  return "default";
}

export function ChatbotLeadsTable({ open, onOpenChange, chatbotConfigId }: ChatbotLeadsTableProps) {
  const { getAuthHeaders } = useAuthHeaders();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 25;

  const loadLeads = useCallback(async () => {
    if (!chatbotConfigId || !open) return;
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const query = new URLSearchParams({
        chatbotConfigId,
        page: String(page),
        pageSize: String(pageSize),
      });
      const response = await fetch(`/api/app/chatbots/leads?${query.toString()}`, { headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to load leads");
      }
      setLeads(data.leads || []);
      setTotalPages(Math.max(1, Number(data.totalPages || 1)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfigId, getAuthHeaders, open, page]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (open) setPage(1);
  }, [open, chatbotConfigId]);

  const updateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/app/chatbots/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update lead");
      }
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update lead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Leads</DialogTitle>
          <DialogDescription>
            Submissions from this chatbot&apos;s lead form, newest first.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-auto">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading leads...</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-500">{error}</p>
          ) : leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No leads yet — they will appear here when visitors submit the form in chat.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-input">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-neutral-900">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-slate-100 dark:border-input">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-300">
                        {formatDateTime(lead.created_at)}
                      </td>
                      <td className="px-3 py-2">{lead.visitor_name || "—"}</td>
                      <td className="px-3 py-2">{lead.visitor_email || "—"}</td>
                      <td className="px-3 py-2">{lead.visitor_phone || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={statusVariant(lead.status)}>{lead.status}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {lead.status !== "contacted" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void updateStatus(lead.id, "contacted")}
                            >
                              Mark contacted
                            </Button>
                          ) : null}
                          {lead.status !== "archived" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => void updateStatus(lead.id, "archived")}
                            >
                              Archive
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
