"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Mail,
  MapPin,
  Pause,
  Play,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
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
import { CreateOutboundSequenceModal, OutboundSequenceFormPayload } from "@/components/admin/outbound/create-outbound-sequence-modal";

interface OutboundLead {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  lead_status: string;
  priority: string;
}

interface OutboundSequence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OutboundSequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  scheduled_date: string;
  scheduled_time: string;
  scheduled_timezone: string;
  email_subject: string;
  email_body: string;
  is_active: boolean;
}

interface OutboundSequenceEnrollment {
  id: string;
  status: string;
  current_step: number;
  enrolled_at: string;
  completed_at: string | null;
  lead_id: string;
  lead: OutboundLead;
}

interface OutboundSequenceAction {
  id: string;
  email_to: string;
  email_subject: string;
  email_body: string;
  scheduled_for: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  lead: {
    company_name: string;
    contact_name: string | null;
    contact_email: string | null;
  };
  step: {
    step_number: number;
  };
}

export default function OutboundSequenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sequenceId = params.id as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sequence, setSequence] = useState<OutboundSequence | null>(null);
  const [steps, setSteps] = useState<OutboundSequenceStep[]>([]);
  const [enrollments, setEnrollments] = useState<OutboundSequenceEnrollment[]>([]);
  const [actions, setActions] = useState<OutboundSequenceAction[]>([]);
  const [availableLeads, setAvailableLeads] = useState<OutboundLead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchSequence = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/outbound/sequences/${sequenceId}?include_enrollments=true`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sequence");
      }

      setSequence(data.sequence);
      setSteps(data.steps || []);
      setEnrollments(data.enrollments || []);
    } catch (error: any) {
      console.error("Error fetching sequence detail:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load sequence details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [sequenceId, toast]);

  const fetchActions = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/outbound/sequences/${sequenceId}/actions`);
      const data = await response.json();
      if (response.ok) {
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error("Error fetching sequence actions:", error);
    }
  }, [sequenceId]);

  const fetchAvailableLeads = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/outbound/leads");
      const data = await response.json();
      if (!response.ok) return;
      setAvailableLeads(data.leads || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  }, []);

  useEffect(() => {
    if (!sequenceId) return;
    fetchSequence();
    fetchActions();
    fetchAvailableLeads();
  }, [sequenceId, fetchSequence, fetchActions, fetchAvailableLeads]);

  const handleToggleActive = async () => {
    if (!sequence) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/admin/outbound/sequences/${sequence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !sequence.is_active }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }
      toast({
        title: "Success",
        description: !sequence.is_active ? "Sequence activated." : "Sequence paused.",
      });
      await fetchSequence();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update sequence status.",
        variant: "destructive",
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteSequence = async () => {
    if (!sequence) return;
    setIsMutating(true);
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
      router.push("/admin/outbound");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sequence.",
        variant: "destructive",
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleEnrollLead = async () => {
    if (!selectedLeadId) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/admin/outbound/sequences/${sequenceId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLeadId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to enrol lead");
      }
      toast({
        title: "Success",
        description: `Lead enrolled and ${data.scheduledCount || 0} emails scheduled.`,
      });
      setSelectedLeadId("");
      setIsEnrollModalOpen(false);
      await Promise.all([fetchSequence(), fetchActions()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enrol lead.",
        variant: "destructive",
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleStopEnrollment = async (enrollmentId: string) => {
    setIsMutating(true);
    try {
      const response = await fetch(
        `/api/admin/outbound/sequences/${sequenceId}/enrollments?enrollmentId=${encodeURIComponent(enrollmentId)}&reason=${encodeURIComponent("Manually removed from sequence")}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove enrollment");
      }
      toast({
        title: "Success",
        description: "Lead removed from sequence.",
      });
      await Promise.all([fetchSequence(), fetchActions()]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove lead.",
        variant: "destructive",
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateSequence = async (payload: OutboundSequenceFormPayload) => {
    if (!sequence) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/outbound/sequences/${sequence.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update sequence");
      }
      toast({
        title: "Success",
        description: "Sequence updated successfully.",
      });
      setIsEditModalOpen(false);
      await fetchSequence();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update sequence.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const availableLeadOptions = useMemo(() => {
    const activeLeadIds = new Set(
      enrollments.filter((enrollment) => enrollment.status === "active").map((enrollment) => enrollment.lead_id)
    );
    return availableLeads.filter((lead) => lead.contact_email && !activeLeadIds.has(lead.id));
  }, [availableLeads, enrollments]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">Loading sequence...</div>
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">Sequence not found.</p>
        <Link href="/admin/outbound">
          <Button variant="outline">Back to outbound</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <Link href="/admin/outbound" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Outbound
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{sequence.name}</h1>
            <Badge className={sequence.is_active ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"}>
              {sequence.is_active ? "Active" : "Paused"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{sequence.description || "No description provided."}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)} disabled={isMutating}>
            <Eye className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleToggleActive} disabled={isMutating}>
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
          <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={isMutating}>
                <Plus className="mr-2 h-4 w-4" />
                Add leads
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add lead to sequence</DialogTitle>
                <DialogDescription>
                  Select a lead with an email address to enrol into this sequence.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label>Lead</Label>
                  <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLeadOptions.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.company_name} {lead.contact_email ? `(${lead.contact_email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {availableLeadOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No eligible leads available (all active leads may already be enrolled or missing email).
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEnrollModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleEnrollLead} disabled={!selectedLeadId || isMutating}>
                    {isMutating ? "Adding..." : "Add lead"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isMutating}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this sequence?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes this sequence and all related email logs. Stop active enrolments first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSequence} className="bg-red-600 hover:bg-red-700">
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps ({steps.length})</TabsTrigger>
          <TabsTrigger value="enrollments">Enrolments ({enrollments.filter((e) => e.status === "active").length})</TabsTrigger>
          <TabsTrigger value="actions">Email actions ({actions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Created</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{format(new Date(sequence.created_at), "dd/MM/yyyy HH:mm")}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Updated</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{format(new Date(sequence.updated_at), "dd/MM/yyyy HH:mm")}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active enrolments</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-semibold">{enrollments.filter((e) => e.status === "active").length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Emails sent</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-semibold">{actions.filter((a) => a.status === "sent").length}</p></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle>Email steps</CardTitle>
              <CardDescription>Each step sends at the exact scheduled date and time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No steps configured.</p>
              ) : (
                steps.map((step) => (
                  <div key={step.id} className="rounded-md border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Step {step.step_number}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(`${step.scheduled_date}T${step.scheduled_time}`), "dd/MM/yyyy HH:mm")} ({step.scheduled_timezone})
                      </span>
                    </div>
                    <p className="text-sm font-medium">{step.email_subject}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{step.email_body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Lead enrolments</CardTitle>
              <CardDescription>Manage leads currently enrolled in this sequence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enrolments yet.</p>
              ) : (
                enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{enrollment.lead?.company_name || "Unknown lead"}</p>
                        <Badge variant="outline">{enrollment.status}</Badge>
                        <Badge variant="outline">Step {enrollment.current_step}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {enrollment.lead?.contact_name ? (
                          <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{enrollment.lead.contact_name}</span>
                        ) : null}
                        {enrollment.lead?.contact_email ? (
                          <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{enrollment.lead.contact_email}</span>
                        ) : null}
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Enrolled {format(new Date(enrollment.enrolled_at), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    </div>
                    {enrollment.status === "active" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this lead?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This stops all remaining scheduled emails for this lead.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleStopEnrollment(enrollment.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove lead
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Email actions log</CardTitle>
              <CardDescription>Full history of scheduled, sent, failed, and cancelled emails.</CardDescription>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No email actions yet.</p>
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{action.email_subject}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{action.lead?.company_name || "Unknown lead"}</span>
                            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{action.email_to}</span>
                            <span>Step {action.step?.step_number || "-"}</span>
                          </div>
                        </div>
                        <Badge
                          className={
                            action.status === "sent"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                              : action.status === "scheduled"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                              : action.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          }
                        >
                          {action.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Scheduled: {format(new Date(action.scheduled_for), "dd/MM/yyyy HH:mm")}</p>
                        {action.sent_at ? <p>Sent: {format(new Date(action.sent_at), "dd/MM/yyyy HH:mm")}</p> : null}
                        {action.error_message ? <p className="text-red-600">Error: {action.error_message}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateOutboundSequenceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleUpdateSequence}
        isSubmitting={isSaving}
        mode="edit"
        initialData={{
          name: sequence.name,
          description: sequence.description,
          steps: steps.map((step) => ({
            step_number: step.step_number,
            scheduled_date: step.scheduled_date,
            scheduled_time: step.scheduled_time,
            scheduled_timezone: step.scheduled_timezone,
            email_subject: step.email_subject,
            email_body: step.email_body,
            is_active: step.is_active,
          })),
        }}
      />
    </div>
  );
}
