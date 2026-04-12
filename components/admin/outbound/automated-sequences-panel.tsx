"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Eye, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  CreateOutboundSequenceModal,
  OutboundSequenceFormPayload,
} from "@/components/admin/outbound/create-outbound-sequence-modal";

interface OutboundSequenceListItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  active_enrollment_count: number;
  step_count: number;
  sent_email_count: number;
  total_email_count: number;
  progress_percent: number;
}

interface OutboundSequenceStats {
  totalSequences: number;
  activeSequences: number;
  activeEnrollments: number;
  totalEmails: number;
  totalSent: number;
  completionRate: number;
}

export function AutomatedSequencesPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isMutatingMap, setIsMutatingMap] = useState<Record<string, boolean>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sequences, setSequences] = useState<OutboundSequenceListItem[]>([]);
  const [stats, setStats] = useState<OutboundSequenceStats | null>(null);
  const { toast } = useToast();

  const fetchSequences = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/outbound/sequences?include_stats=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sequences");
      }

      setSequences(data.sequences || []);
      setStats(data.stats || null);
    } catch (error: any) {
      console.error("Error fetching outbound sequences:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load sequences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const setMutating = (sequenceId: string, value: boolean) => {
    setIsMutatingMap((prev) => ({ ...prev, [sequenceId]: value }));
  };

  const handleCreateSequence = async (payload: OutboundSequenceFormPayload) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/outbound/sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create sequence");
      }

      toast({
        title: "Success",
        description: "Automated sequence created successfully.",
      });
      setIsCreateModalOpen(false);
      await fetchSequences();
    } catch (error: any) {
      console.error("Error creating sequence:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create sequence.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleSequence = async (sequence: OutboundSequenceListItem) => {
    setMutating(sequence.id, true);
    try {
      const response = await fetch(`/api/admin/outbound/sequences/${sequence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !sequence.is_active,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update sequence status");
      }

      toast({
        title: "Success",
        description: !sequence.is_active ? "Sequence activated." : "Sequence paused.",
      });
      await fetchSequences();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update sequence status.",
        variant: "destructive",
      });
    } finally {
      setMutating(sequence.id, false);
    }
  };

  const handleDeleteSequence = async (sequence: OutboundSequenceListItem) => {
    setMutating(sequence.id, true);
    try {
      const response = await fetch(`/api/admin/outbound/sequences/${sequence.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete sequence");
      }

      toast({
        title: "Success",
        description: "Sequence deleted successfully.",
      });
      await fetchSequences();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sequence.",
        variant: "destructive",
      });
    } finally {
      setMutating(sequence.id, false);
    }
  };

  const sequenceSummary = useMemo(() => {
    if (stats) return stats;
    return {
      totalSequences: sequences.length,
      activeSequences: sequences.filter((s) => s.is_active).length,
      activeEnrollments: sequences.reduce((acc, item) => acc + item.active_enrollment_count, 0),
      totalEmails: sequences.reduce((acc, item) => acc + item.total_email_count, 0),
      totalSent: sequences.reduce((acc, item) => acc + item.sent_email_count, 0),
      completionRate: 0,
    };
  }, [sequences, stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Automated Sequences</h2>
          <p className="text-sm text-muted-foreground">
            Build multi-step outbound email flows, enrol leads, and monitor sends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSequences} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create sequence
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total sequences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sequenceSummary.totalSequences}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active sequences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-700 dark:text-green-300">{sequenceSummary.activeSequences}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active enrolments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sequenceSummary.activeEnrollments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emails sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sequenceSummary.totalSent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sequenceSummary.completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active and saved sequences</CardTitle>
          <CardDescription>Use pause, delete, and details controls to manage each outbound flow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">Loading sequences...</div>
          ) : sequences.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No automated sequences yet. Create your first sequence to start scheduling outbound emails.
            </div>
          ) : (
            sequences.map((sequence) => {
              const isMutating = Boolean(isMutatingMap[sequence.id]);
              return (
                <div key={sequence.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold">{sequence.name}</p>
                        <Badge className={sequence.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}>
                          {sequence.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sequence.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/outbound/sequences/${sequence.id}`}>
                        <Button variant="outline" size="sm" title="View sequence details">
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSequence(sequence)}
                        disabled={isMutating}
                      >
                        {sequence.is_active ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isMutating}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this sequence?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently deletes "{sequence.name}" and all related step/email logs. Active enrolments must be stopped first.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDeleteSequence(sequence)}
                            >
                              Delete permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                    <div>
                      <p className="text-muted-foreground">Steps</p>
                      <p className="font-medium">{sequence.step_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active enrolments</p>
                      <p className="font-medium">{sequence.active_enrollment_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-medium">{sequence.sent_email_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total scheduled</p>
                      <p className="font-medium">{sequence.total_email_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(sequence.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Delivery progress</span>
                      <span>{sequence.progress_percent}%</span>
                    </div>
                    <Progress value={sequence.progress_percent} />
                  </div>

                  {!sequence.is_active ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                      <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        This sequence is paused. Scheduled emails will not send until reactivated.
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <CreateOutboundSequenceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateSequence}
        isSubmitting={isCreating}
      />
    </div>
  );
}
