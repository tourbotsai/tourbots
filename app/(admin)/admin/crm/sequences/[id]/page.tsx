"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Mail,
  Pause,
  Phone,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { AppTitle } from "@/components/shared/app-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

export const dynamic = "force-dynamic";

interface CrmCompany {
  id: string;
  company_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  region: string;
  status: string;
}

interface CrmSequence {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "paused";
}

interface CrmSequenceContact {
  id: string;
  sequence_id: string;
  company_id: string;
  added_at: string;
  company: CrmCompany | null;
}

interface CrmSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  step_type: "email" | "call";
  email_subject: string | null;
  email_body: string | null;
  call_script: string | null;
}

interface CrmSequenceStepStatus {
  id: string;
  step_id: string;
  company_id: string;
  completed_at: string | null;
}

type CrmScheduledEmailStatus = "scheduled" | "processing" | "sent" | "failed" | "cancelled";

interface CrmScheduledEmail {
  id: string;
  step_id: string;
  company_id: string;
  scheduled_for: string;
  status: CrmScheduledEmailStatus;
  attempts: number;
  error_message: string | null;
  sent_at: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "No date set";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

const DEFAULT_STEP_TIME: Record<"email" | "call", string> = {
  email: "14:00",
  call: "10:00",
};

function contactName(company: CrmCompany | null) {
  if (!company) return "Unknown company";
  const name = `${company.first_name || ""} ${company.last_name || ""}`.trim();
  return name || company.company_name;
}

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatScheduledFor(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CrmSequenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sequenceId = params.id as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [sequence, setSequence] = useState<CrmSequence | null>(null);
  const [contacts, setContacts] = useState<CrmSequenceContact[]>([]);
  const [steps, setSteps] = useState<CrmSequenceStep[]>([]);
  const [stepStatuses, setStepStatuses] = useState<CrmSequenceStepStatus[]>([]);
  const [pendingCompletionKey, setPendingCompletionKey] = useState<string | null>(null);
  const [scheduledEmails, setScheduledEmails] = useState<CrmScheduledEmail[]>([]);
  const [pendingScheduledEmailId, setPendingScheduledEmailId] = useState<string | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState(true);

  const [availableCompanies, setAvailableCompanies] = useState<CrmCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [stepScheduledDate, setStepScheduledDate] = useState("");
  const [stepScheduledTime, setStepScheduledTime] = useState(DEFAULT_STEP_TIME.email);
  const [stepType, setStepType] = useState<"email" | "call">("email");
  const [stepEmailSubject, setStepEmailSubject] = useState("");
  const [stepEmailBody, setStepEmailBody] = useState("");
  const [stepCallScript, setStepCallScript] = useState("");

  const [expandedStepIds, setExpandedStepIds] = useState<Set<string>>(new Set());
  const [stepSearchTerms, setStepSearchTerms] = useState<Record<string, string>>({});
  const [stepHideCompleted, setStepHideCompleted] = useState<Record<string, boolean>>({});

  const fetchSequence = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/crm/sequences/${sequenceId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch sequence");

      setSequence(data.sequence);
      setContacts(data.contacts || []);
      setSteps(data.steps || []);
      setStepStatuses(data.stepStatuses || []);
      setScheduledEmails(data.scheduledEmails || []);
    } catch (error: any) {
      console.error("Error fetching CRM sequence:", error);
      toast({ title: "Error", description: error.message || "Failed to load sequence.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [sequenceId, toast]);

  const fetchAvailableCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/crm/companies");
      const data = await response.json();
      if (!response.ok) return;
      setAvailableCompanies(data.companies || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, []);

  useEffect(() => {
    if (!sequenceId) return;
    fetchSequence();
    fetchAvailableCompanies();

    fetch("/api/admin/crm/gmail")
      .then((response) => response.json())
      .then((data) => setIsGmailConnected(Boolean(data.account)))
      .catch(() => {});
  }, [sequenceId, fetchSequence, fetchAvailableCompanies]);

  const eligibleCompanies = useMemo(() => {
    const alreadyAdded = new Set(contacts.map((contact) => contact.company_id));
    return availableCompanies.filter((company) => !alreadyAdded.has(company.id));
  }, [availableCompanies, contacts]);

  const completedKeySet = useMemo(() => {
    const keys = new Set<string>();
    for (const status of stepStatuses) {
      if (status.completed_at) keys.add(`${status.step_id}:${status.company_id}`);
    }
    return keys;
  }, [stepStatuses]);

  const completedCountByStep = useMemo(() => {
    const counts = new Map<string, number>();
    for (const step of steps) {
      let count = 0;
      for (const contact of contacts) {
        if (completedKeySet.has(`${step.id}:${contact.company_id}`)) count += 1;
      }
      counts.set(step.id, count);
    }
    return counts;
  }, [steps, contacts, completedKeySet]);

  const scheduledEmailByKey = useMemo(() => {
    const map = new Map<string, CrmScheduledEmail>();
    for (const scheduledEmail of scheduledEmails) {
      map.set(`${scheduledEmail.step_id}:${scheduledEmail.company_id}`, scheduledEmail);
    }
    return map;
  }, [scheduledEmails]);

  const handleToggleStatus = async () => {
    if (!sequence) return;
    setIsMutating(true);
    try {
      const nextStatus = sequence.status === "active" ? "paused" : "active";
      const response = await fetch(`/api/admin/crm/sequences/${sequence.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update sequence");

      toast({ title: "Success", description: nextStatus === "active" ? "Sequence activated." : "Sequence paused." });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update sequence.", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteSequence = async () => {
    if (!sequence) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/admin/crm/sequences/${sequence.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete sequence");

      toast({ title: "Success", description: "Sequence deleted successfully." });
      router.push("/admin/crm");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete sequence.", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddContact = async () => {
    if (!selectedCompanyId) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/admin/crm/sequences/${sequenceId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: selectedCompanyId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add contact");

      toast({ title: "Success", description: "Contact added to sequence." });
      setSelectedCompanyId("");
      setIsAddContactModalOpen(false);
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add contact.", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveContact = async (companyId: string) => {
    setIsMutating(true);
    try {
      const response = await fetch(
        `/api/admin/crm/sequences/${sequenceId}/contacts?companyId=${encodeURIComponent(companyId)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove contact");

      toast({ title: "Success", description: "Contact removed from sequence." });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove contact.", variant: "destructive" });
    } finally {
      setIsMutating(false);
    }
  };

  const resetStepForm = () => {
    setStepTitle("");
    setStepDescription("");
    setStepScheduledDate("");
    setStepScheduledTime(DEFAULT_STEP_TIME.email);
    setStepType("email");
    setStepEmailSubject("");
    setStepEmailBody("");
    setStepCallScript("");
  };

  const handleStepTypeChange = (value: "email" | "call") => {
    setStepType(value);
    // Keep the time field in sync with a sensible default (10:00 calls, 14:00 emails)
    // unless the user has already deviated from both defaults.
    if (Object.values(DEFAULT_STEP_TIME).includes(stepScheduledTime)) {
      setStepScheduledTime(DEFAULT_STEP_TIME[value]);
    }
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleCreateStep = async () => {
    if (!stepTitle.trim()) {
      toast({ title: "Title required", description: "Please give the step a title.", variant: "destructive" });
      return;
    }
    if (stepType === "email" && (!stepEmailSubject.trim() || !stepEmailBody.trim())) {
      toast({
        title: "Email details required",
        description: "Please provide a subject and body for this email step.",
        variant: "destructive",
      });
      return;
    }
    if (stepType === "call" && !stepCallScript.trim()) {
      toast({ title: "Script required", description: "Please provide a call script for this step.", variant: "destructive" });
      return;
    }

    setIsSavingStep(true);
    try {
      const response = await fetch(`/api/admin/crm/sequences/${sequenceId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: stepTitle,
          description: stepDescription,
          scheduled_date: stepScheduledDate || null,
          scheduled_time: stepScheduledTime || null,
          step_type: stepType,
          email_subject: stepType === "email" ? stepEmailSubject : null,
          email_body: stepType === "email" ? stepEmailBody : null,
          call_script: stepType === "call" ? stepCallScript : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create step");

      toast({ title: "Success", description: "Step added to sequence." });
      resetStepForm();
      setIsAddStepModalOpen(false);
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create step.", variant: "destructive" });
    } finally {
      setIsSavingStep(false);
    }
  };

  const handleToggleStepCompletion = async (step: CrmSequenceStep, companyId: string, isComplete: boolean) => {
    const key = `${step.id}:${companyId}`;
    setPendingCompletionKey(key);
    try {
      if (isComplete) {
        const response = await fetch(
          `/api/admin/crm/sequences/${sequenceId}/steps/${step.id}/complete?companyId=${encodeURIComponent(companyId)}`,
          { method: "DELETE" }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to revert step");
      } else {
        const response = await fetch(`/api/admin/crm/sequences/${sequenceId}/steps/${step.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to complete step");
        toast({
          title: "Logged",
          description: "Activity logged automatically and step marked complete.",
        });
      }
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update step status.", variant: "destructive" });
    } finally {
      setPendingCompletionKey(null);
    }
  };

  const handleRescheduleEmail = async (scheduledEmailId: string, datetimeLocalValue: string) => {
    setPendingScheduledEmailId(scheduledEmailId);
    try {
      const scheduledFor = new Date(datetimeLocalValue).toISOString();
      const response = await fetch(`/api/admin/crm/scheduled-emails/${scheduledEmailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to reschedule email");
      toast({ title: "Rescheduled", description: "This contact's send time has been updated." });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reschedule email.", variant: "destructive" });
    } finally {
      setPendingScheduledEmailId(null);
    }
  };

  const handleSendEmailNow = async (scheduledEmailId: string) => {
    setPendingScheduledEmailId(scheduledEmailId);
    try {
      const response = await fetch(`/api/admin/crm/scheduled-emails/${scheduledEmailId}/send`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send email");
      toast({ title: "Sent", description: "Email sent via Gmail and logged to activity history." });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send email.", variant: "destructive" });
    } finally {
      setPendingScheduledEmailId(null);
    }
  };

  const handleCancelScheduledEmail = async (scheduledEmailId: string) => {
    setPendingScheduledEmailId(scheduledEmailId);
    try {
      const response = await fetch(`/api/admin/crm/scheduled-emails/${scheduledEmailId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to cancel email");
      toast({ title: "Cancelled", description: "This scheduled email will not be sent." });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel email.", variant: "destructive" });
    } finally {
      setPendingScheduledEmailId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Loading sequence...
        </div>
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Sequence not found.</p>
        <Link href="/admin/crm">
          <Button variant="outline">Back to CRM</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isGmailConnected ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            No Gmail account connected — email steps will not send automatically.{" "}
            <Link href="/admin/crm" className="font-medium underline underline-offset-2">
              Connect one from the CRM page
            </Link>
            .
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-b border-gray-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <Link href="/admin/crm" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Back to CRM
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">{sequence.title}</h1>
            <Badge
              className={
                sequence.status === "active"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }
            >
              {sequence.status === "active" ? "Active" : "Paused"}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{sequence.description || "No description provided."}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100" onClick={handleToggleStatus} disabled={isMutating}>
            {sequence.status === "active" ? (
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
              <Button variant="destructive" disabled={isMutating}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this sequence?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the sequence, its steps, and its contact list. Activities already logged
                  against companies are not affected.
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

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-slate-900">Contacts</CardTitle>
              <CardDescription>Companies enrolled in this sequence.</CardDescription>
            </div>
            <Dialog open={isAddContactModalOpen} onOpenChange={setIsAddContactModalOpen}>
              <DialogTrigger asChild>
                <Button disabled={isMutating}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add contact to sequence</DialogTitle>
                  <DialogDescription>Select a company from the CRM to enrol in this sequence.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label>Company</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {eligibleCompanies.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      All companies are already enrolled in this sequence, or none exist yet.
                    </p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddContactModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleAddContact} disabled={!selectedCompanyId || isMutating}>
                    {isMutating ? "Adding..." : "Add contact"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-500">No contacts yet. Add companies to start working this sequence.</p>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/crm/${contact.company_id}`} className="font-medium text-slate-900 hover:underline">
                      {contact.company?.company_name || "Unknown company"}
                    </Link>
                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
                      {contactName(contact.company)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {contact.company?.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {contact.company.phone}
                      </span>
                    ) : null}
                    {contact.company?.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {contact.company.email}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700"
                  onClick={() => handleRemoveContact(contact.company_id)}
                  disabled={isMutating}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-slate-900">Steps</CardTitle>
              <CardDescription>
                Ticking a step for a contact logs it as an activity immediately — there is no separate manual log step.
              </CardDescription>
            </div>
            <Dialog open={isAddStepModalOpen} onOpenChange={setIsAddStepModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[36rem]">
                <DialogHeader>
                  <DialogTitle>Add sequence step</DialogTitle>
                  <DialogDescription>Steps are shown in the order they are created.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} placeholder="e.g. Intro email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={stepDescription}
                      onChange={(event) => setStepDescription(event.target.value)}
                      rows={2}
                      placeholder="Optional internal note about this step"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Scheduled date</Label>
                      <Input type="date" value={stepScheduledDate} onChange={(event) => setStepScheduledDate(event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Scheduled time</Label>
                      <Input type="time" value={stepScheduledTime} onChange={(event) => setStepScheduledTime(event.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <RadioGroup
                      value={stepType}
                      onValueChange={(value) => handleStepTypeChange(value as "email" | "call")}
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="email" id="step-type-email" />
                        <Label htmlFor="step-type-email" className="cursor-pointer font-normal">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="call" id="step-type-call" />
                        <Label htmlFor="step-type-call" className="cursor-pointer font-normal">
                          Call
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {stepType === "email" ? (
                    <>
                      <div className="space-y-1.5">
                        <Label>Email subject</Label>
                        <Input value={stepEmailSubject} onChange={(event) => setStepEmailSubject(event.target.value)} placeholder="Subject line" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email body</Label>
                        <Textarea
                          value={stepEmailBody}
                          onChange={(event) => setStepEmailBody(event.target.value)}
                          rows={6}
                          placeholder="Hi {{first_name}}, ..."
                        />
                        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Info className="h-3.5 w-3.5" />
                          Supports {"{{first_name}}"}, {"{{last_name}}"}, and {"{{company_name}}"} variables.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Call script</Label>
                      <Textarea
                        value={stepCallScript}
                        onChange={(event) => setStepCallScript(event.target.value)}
                        rows={6}
                        placeholder="Hi {{first_name}}, this is..."
                      />
                      <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Info className="h-3.5 w-3.5" />
                        Supports {"{{first_name}}"}, {"{{last_name}}"}, and {"{{company_name}}"} variables.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetStepForm();
                      setIsAddStepModalOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateStep} disabled={isSavingStep}>
                    {isSavingStep ? "Adding..." : "Add step"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 ? (
            <p className="text-sm text-slate-500">No steps configured yet.</p>
          ) : (
            steps.map((step) => {
              const isExpanded = expandedStepIds.has(step.id);
              const completedCount = completedCountByStep.get(step.id) || 0;
              const totalContacts = contacts.length;
              const isStepFullyDone = totalContacts > 0 && completedCount === totalContacts;
              const searchTerm = stepSearchTerms[step.id] || "";
              const hideCompleted = Boolean(stepHideCompleted[step.id]);
              const visibleContacts = contacts.filter((contact) => {
                const name = contact.company?.company_name?.toLowerCase() || "";
                if (searchTerm && !name.includes(searchTerm.toLowerCase())) return false;
                if (hideCompleted && completedKeySet.has(`${step.id}:${contact.company_id}`)) return false;
                return true;
              });

              return (
                <div key={step.id} className="rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleStepExpanded(step.id)}
                    className="flex w-full flex-wrap items-center gap-2 p-4 text-left"
                  >
                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
                      Step {step.step_order}
                    </Badge>
                    <Badge
                      className={
                        step.step_type === "email"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                          : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                      }
                    >
                      {step.step_type === "email" ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Call
                        </span>
                      )}
                    </Badge>
                    {step.scheduled_date ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(step.scheduled_date)}
                        {formatTime(step.scheduled_time) ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(step.scheduled_time)}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    <span className="text-sm font-medium text-slate-900">{step.title}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {totalContacts > 0 ? (
                        <Badge
                          className={
                            isStepFullyDone
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          {isStepFullyDone ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
                          {completedCount}/{totalContacts} done
                        </Badge>
                      ) : null}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-slate-100 p-4 pt-3">
                      {step.description ? <p className="text-sm text-slate-600">{step.description}</p> : null}
                      {step.step_type === "email" && step.email_subject ? (
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-medium">Subject:</span> {step.email_subject}
                        </p>
                      ) : null}
                      {(step.step_type === "email" ? step.email_body : step.call_script) ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">
                          {step.step_type === "email" ? step.email_body : step.call_script}
                        </p>
                      ) : null}

                      {contacts.length > 0 ? (
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Per-contact completion</p>
                            <label className="flex items-center gap-2 text-xs text-slate-500">
                              <Checkbox
                                checked={hideCompleted}
                                onCheckedChange={(checked) =>
                                  setStepHideCompleted((prev) => ({ ...prev, [step.id]: Boolean(checked) }))
                                }
                              />
                              Hide completed
                            </label>
                          </div>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                              value={searchTerm}
                              onChange={(event) =>
                                setStepSearchTerms((prev) => ({ ...prev, [step.id]: event.target.value }))
                              }
                              placeholder="Search companies..."
                              className="pl-8"
                            />
                          </div>
                          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                            {visibleContacts.length === 0 ? (
                              <p className="py-2 text-sm text-slate-500">No companies match this filter.</p>
                            ) : (
                              visibleContacts.map((contact) => {
                                const key = `${step.id}:${contact.company_id}`;
                                const isComplete = completedKeySet.has(key);
                                const isPending = pendingCompletionKey === key;
                                const scheduledEmail = scheduledEmailByKey.get(key);
                                const isEmailStep = step.step_type === "email";
                                const isEmailPending = scheduledEmail ? pendingScheduledEmailId === scheduledEmail.id : false;

                                return (
                                  <div
                                    key={contact.id}
                                    className="flex flex-col gap-2 rounded-md bg-slate-50/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                      <Checkbox
                                        checked={isComplete}
                                        disabled={isPending}
                                        onCheckedChange={() => handleToggleStepCompletion(step, contact.company_id, isComplete)}
                                      />
                                      {contact.company?.company_name || "Unknown company"}
                                    </label>

                                    {isComplete ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {isEmailStep && scheduledEmail?.sent_at
                                          ? `Sent via Gmail ${formatScheduledFor(scheduledEmail.sent_at)}`
                                          : "Logged to activity history"}
                                      </span>
                                    ) : isEmailStep && scheduledEmail ? (
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        {scheduledEmail.status === "failed" ? (
                                          <span className="inline-flex items-center gap-1 text-rose-700" title={scheduledEmail.error_message || undefined}>
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Failed{scheduledEmail.error_message ? `: ${scheduledEmail.error_message}` : ""}
                                          </span>
                                        ) : scheduledEmail.status === "cancelled" ? (
                                          <span className="inline-flex items-center gap-1 text-slate-500" title={scheduledEmail.error_message || undefined}>
                                            <XCircle className="h-3.5 w-3.5" />
                                            Skipped
                                          </span>
                                        ) : scheduledEmail.status === "processing" ? (
                                          <span className="inline-flex items-center gap-1 text-slate-500">
                                            <Send className="h-3.5 w-3.5 animate-pulse" />
                                            Sending...
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-slate-500">
                                            <Clock className="h-3.5 w-3.5" />
                                            Sends {formatScheduledFor(scheduledEmail.scheduled_for)}
                                          </span>
                                        )}

                                        <Input
                                          type="datetime-local"
                                          disabled={isEmailPending}
                                          defaultValue={toDatetimeLocalValue(scheduledEmail.scheduled_for)}
                                          onBlur={(event) => {
                                            if (!event.target.value) return;
                                            handleRescheduleEmail(scheduledEmail.id, event.target.value);
                                          }}
                                          className="h-7 w-[170px] px-2 text-xs"
                                        />

                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          disabled={isEmailPending}
                                          onClick={() => handleSendEmailNow(scheduledEmail.id)}
                                          className="h-7 border-slate-300 bg-white px-2 text-xs text-slate-700 hover:bg-slate-100"
                                        >
                                          {scheduledEmail.status === "failed" ? (
                                            <RotateCcw className="mr-1 h-3 w-3" />
                                          ) : (
                                            <Send className="mr-1 h-3 w-3" />
                                          )}
                                          {scheduledEmail.status === "failed" ? "Retry" : "Send now"}
                                        </Button>

                                        {scheduledEmail.status !== "cancelled" ? (
                                          <button
                                            type="button"
                                            disabled={isEmailPending}
                                            onClick={() => handleCancelScheduledEmail(scheduledEmail.id)}
                                            className="text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline disabled:opacity-50"
                                          >
                                            Skip
                                          </button>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
