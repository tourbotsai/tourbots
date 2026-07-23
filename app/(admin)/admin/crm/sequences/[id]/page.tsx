"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Mail,
  Pause,
  Phone,
  PhoneMissed,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
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
  is_stopped?: boolean;
  stopped_at?: string | null;
  stopped_reason?: "manual" | "inbound_reply" | null;
}

function stoppedTooltip(company: Pick<CrmCompany, "stopped_reason" | "stopped_at">) {
  const when = company.stopped_at
    ? new Date(company.stopped_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "an unknown time";
  return company.stopped_reason === "inbound_reply"
    ? `Stopped automatically — a reply was detected on ${when}`
    : `Stopped manually on ${when}`;
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

interface CrmSequenceEffectiveScheduleEntry {
  step_id: string;
  company_id: string;
  effective_date: string | null;
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

function isBeforeToday(dateOnly: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateOnly) < today;
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
  const [effectiveSchedule, setEffectiveSchedule] = useState<CrmSequenceEffectiveScheduleEntry[]>([]);
  const [pendingScheduledEmailId, setPendingScheduledEmailId] = useState<string | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState(true);

  const [isUpcomingActionsExpanded, setIsUpcomingActionsExpanded] = useState(true);

  const [isContactsExpanded, setIsContactsExpanded] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [availableCompanies, setAvailableCompanies] = useState<CrmCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [pendingStopCompanyId, setPendingStopCompanyId] = useState<string | null>(null);

  const [isStepsExpanded, setIsStepsExpanded] = useState(false);

  const [outcomeModal, setOutcomeModal] = useState<{
    stepId: string;
    companyId: string;
    companyName: string;
    outcome: "positive" | "negative";
  } | null>(null);
  const [outcomeNote, setOutcomeNote] = useState("");
  const [outcomeStopContact, setOutcomeStopContact] = useState(false);
  const [isSavingOutcome, setIsSavingOutcome] = useState(false);

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
      setEffectiveSchedule(data.effectiveSchedule || []);
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

  const visibleTopContacts = useMemo(() => {
    const term = contactSearchTerm.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((contact) => {
      const company = contact.company;
      const haystack = `${company?.company_name || ""} ${contactName(company)}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [contacts, contactSearchTerm]);

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

  const effectiveDateByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of effectiveSchedule) {
      if (entry.effective_date) map.set(`${entry.step_id}:${entry.company_id}`, entry.effective_date);
    }
    return map;
  }, [effectiveSchedule]);

  // The date range (earliest -> latest) a given step's contacts actually fall
  // on. When every contact lands on the same date (an unstaggered sequence,
  // or one where no contact has an anchor_date), this collapses to a single
  // date, matching the old shared-date display exactly.
  const dateRangeByStep = useMemo(() => {
    const map = new Map<string, { earliest: string; latest: string }>();
    for (const step of steps) {
      let earliest: string | null = null;
      let latest: string | null = null;
      for (const contact of contacts) {
        const effectiveDate = effectiveDateByKey.get(`${step.id}:${contact.company_id}`);
        if (!effectiveDate) continue;
        if (!earliest || effectiveDate < earliest) earliest = effectiveDate;
        if (!latest || effectiveDate > latest) latest = effectiveDate;
      }
      if (earliest && latest) map.set(step.id, { earliest, latest });
    }
    return map;
  }, [steps, contacts, effectiveDateByKey]);

  // The next few outstanding actions across the whole sequence, soonest due
  // first. Stopped contacts are excluded — there's nothing to action for them
  // until they're resumed. Anything without a due date is excluded too, since
  // "due" is meaningless without one.
  const upcomingActions = useMemo(() => {
    const items: { step: CrmSequenceStep; contact: CrmSequenceContact; dueDate: string }[] = [];
    for (const step of steps) {
      for (const contact of contacts) {
        const key = `${step.id}:${contact.company_id}`;
        if (completedKeySet.has(key)) continue;
        if (contact.company?.is_stopped) continue;
        const dueDate = effectiveDateByKey.get(key) || step.scheduled_date;
        if (!dueDate) continue;
        items.push({ step, contact, dueDate });
      }
    }
    items.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
    return items.slice(0, 5);
  }, [steps, contacts, completedKeySet, effectiveDateByKey]);

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

  const handleStopContact = async (companyId: string) => {
    setPendingStopCompanyId(companyId);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}/stop`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to stop outreach");

      toast({
        title: "Stopped",
        description: "No automated emails will send, and this is flagged in every sequence this contact is part of.",
      });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to stop outreach.", variant: "destructive" });
    } finally {
      setPendingStopCompanyId(null);
    }
  };

  const handleResumeContact = async (companyId: string) => {
    setPendingStopCompanyId(companyId);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}/stop`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to resume outreach");

      toast({ title: "Resumed", description: "This contact can be contacted again." });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to resume outreach.", variant: "destructive" });
    } finally {
      setPendingStopCompanyId(null);
    }
  };

  // Shared between the Steps section and the Upcoming Actions summary above
  // it, so both render exactly the same controls for a given (step, contact).
  const renderStepActionsForContact = (step: CrmSequenceStep, contact: CrmSequenceContact) => {
    const key = `${step.id}:${contact.company_id}`;
    const isComplete = completedKeySet.has(key);
    const isPending = pendingCompletionKey === key;
    const scheduledEmail = scheduledEmailByKey.get(key);
    const isEmailStep = step.step_type === "email";
    const isEmailPending = scheduledEmail ? pendingScheduledEmailId === scheduledEmail.id : false;
    const effectiveDate = effectiveDateByKey.get(key);
    const isCallOverdue = Boolean(effectiveDate && !isEmailStep && isBeforeToday(effectiveDate));
    const isStopped = Boolean(contact.company?.is_stopped);
    const companyName = contact.company?.company_name || "Unknown company";

    if (isComplete) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isEmailStep && scheduledEmail?.sent_at
              ? `Sent ${formatScheduledFor(scheduledEmail.sent_at)}`
              : "Logged to activity history"}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleUndoStepCompletion(step, contact.company_id)}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 hover:underline disabled:opacity-50"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
        </div>
      );
    }

    if (isStopped) {
      return (
        <span
          className="inline-flex items-center gap-1 text-xs text-rose-700"
          title={contact.company ? stoppedTooltip(contact.company) : undefined}
        >
          <Ban className="h-3.5 w-3.5" />
          Stopped — {isEmailStep ? "no automated email" : "do not call"}
        </span>
      );
    }

    if (isEmailStep) {
      return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {scheduledEmail ? (
            <>
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
            </>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => completeStepForContact(step, contact.company_id, { markScheduledEmailSent: true })}
            className="h-7 border-slate-300 bg-white px-2 text-xs text-slate-700 hover:bg-slate-100"
            title="Marks this as done without actually sending via Gmail"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Mark as sent
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {effectiveDate ? (
          <span
            className={`inline-flex items-center gap-1 text-xs ${isCallOverdue ? "text-rose-700" : "text-slate-500"}`}
          >
            {isCallOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
            {isCallOverdue ? "Overdue since" : "Due"} {formatDate(effectiveDate)}
          </span>
        ) : null}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => completeStepForContact(step, contact.company_id, { outcome: "no_answer" })}
            className="h-7 border-slate-300 bg-white px-2 text-xs text-slate-600 hover:bg-slate-100"
          >
            <PhoneMissed className="mr-1 h-3 w-3" />
            No answer
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => openOutcomeModal(step, contact.company_id, companyName, "positive")}
            className="h-7 border-emerald-300 bg-white px-2 text-xs text-emerald-700 hover:bg-emerald-50"
          >
            <ThumbsUp className="mr-1 h-3 w-3" />
            Positive
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => openOutcomeModal(step, contact.company_id, companyName, "negative")}
            className="h-7 border-rose-300 bg-white px-2 text-xs text-rose-700 hover:bg-rose-50"
          >
            <ThumbsDown className="mr-1 h-3 w-3" />
            Negative
          </Button>
        </div>
      </div>
    );
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

  const completeStepForContact = async (
    step: CrmSequenceStep,
    companyId: string,
    options: {
      outcome?: "no_answer" | "positive" | "negative";
      note?: string;
      stopContact?: boolean;
      markScheduledEmailSent?: boolean;
    } = {}
  ) => {
    const key = `${step.id}:${companyId}`;
    setPendingCompletionKey(key);
    try {
      const response = await fetch(`/api/admin/crm/sequences/${sequenceId}/steps/${step.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, ...options }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to complete step");
      toast({
        title: "Logged",
        description:
          options.stopContact
            ? "Activity logged and outreach stopped for this contact."
            : "Activity logged and step marked complete.",
      });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to complete step.", variant: "destructive" });
    } finally {
      setPendingCompletionKey(null);
    }
  };

  const handleUndoStepCompletion = async (step: CrmSequenceStep, companyId: string) => {
    const key = `${step.id}:${companyId}`;
    setPendingCompletionKey(key);
    try {
      const response = await fetch(
        `/api/admin/crm/sequences/${sequenceId}/steps/${step.id}/complete?companyId=${encodeURIComponent(companyId)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to revert step");
      toast({ title: "Reverted", description: "Marked as not done again." });
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to revert step.", variant: "destructive" });
    } finally {
      setPendingCompletionKey(null);
    }
  };

  const openOutcomeModal = (
    step: CrmSequenceStep,
    companyId: string,
    companyName: string,
    outcome: "positive" | "negative"
  ) => {
    setOutcomeNote("");
    setOutcomeStopContact(false);
    setOutcomeModal({ stepId: step.id, companyId, companyName, outcome });
  };

  const handleSubmitOutcomeModal = async () => {
    if (!outcomeModal) return;
    const key = `${outcomeModal.stepId}:${outcomeModal.companyId}`;
    setIsSavingOutcome(true);
    setPendingCompletionKey(key);
    try {
      const response = await fetch(`/api/admin/crm/sequences/${sequenceId}/steps/${outcomeModal.stepId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: outcomeModal.companyId,
          outcome: outcomeModal.outcome,
          note: outcomeNote,
          stopContact: outcomeModal.outcome === "negative" ? outcomeStopContact : false,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to log outcome");
      toast({
        title: "Logged",
        description:
          outcomeModal.outcome === "negative" && outcomeStopContact
            ? "Outcome logged and outreach stopped for this contact."
            : "Outcome logged and step marked complete.",
      });
      setOutcomeModal(null);
      await fetchSequence();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to log outcome.", variant: "destructive" });
    } finally {
      setIsSavingOutcome(false);
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
          <button
            type="button"
            onClick={() => setIsUpcomingActionsExpanded((prev) => !prev)}
            className="flex w-full items-center gap-2 text-left"
          >
            {isUpcomingActionsExpanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            )}
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                Upcoming actions
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
                  {upcomingActions.length}
                </Badge>
              </CardTitle>
              <CardDescription>The next outstanding actions across this sequence, soonest due first.</CardDescription>
            </div>
          </button>
        </CardHeader>
        {isUpcomingActionsExpanded ? (
          <CardContent className="space-y-2">
            {upcomingActions.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing due right now — everything is either done or not yet due.</p>
            ) : (
              upcomingActions.map(({ step, contact, dueDate }) => (
                <div
                  key={`${step.id}:${contact.id}`}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="outline" className="shrink-0 border-slate-300 bg-slate-50 text-slate-600">
                      Step {step.step_order}
                    </Badge>
                    <Badge
                      className={
                        step.step_type === "email"
                          ? "shrink-0 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                          : "shrink-0 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
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
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(dueDate)}
                    </span>
                    <span className="truncate font-medium text-slate-900">
                      {contact.company?.company_name || "Unknown company"}
                    </span>
                    <span className="truncate text-xs text-slate-500">{step.title}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">{renderStepActionsForContact(step, contact)}</div>
                </div>
              ))
            )}
          </CardContent>
        ) : null}
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsContactsExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-left"
            >
              {isContactsExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  Contacts
                  <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
                    {contacts.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Companies enrolled in this sequence.</CardDescription>
              </div>
            </button>
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
        {isContactsExpanded ? (
          <CardContent className="space-y-2">
            {contacts.length > 0 ? (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={contactSearchTerm}
                  onChange={(event) => setContactSearchTerm(event.target.value)}
                  placeholder="Search companies..."
                  className="h-8 pl-8 text-sm"
                />
              </div>
            ) : null}
            {contacts.length === 0 ? (
              <p className="text-sm text-slate-500">No contacts yet. Add companies to start working this sequence.</p>
            ) : visibleTopContacts.length === 0 ? (
              <p className="py-2 text-sm text-slate-500">No companies match this filter.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {visibleTopContacts.map((contact) => {
                  const isStopped = Boolean(contact.company?.is_stopped);
                  const isPendingStop = pendingStopCompanyId === contact.company_id;
                  return (
                    <div
                      key={contact.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-sm"
                    >
                      <Link
                        href={`/admin/crm/${contact.company_id}`}
                        className="min-w-0 truncate font-medium text-slate-900 hover:underline"
                      >
                        {contact.company?.company_name || "Unknown company"}
                      </Link>
                      <span className="truncate text-xs text-slate-500">{contactName(contact.company)}</span>
                      {contact.company?.phone ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Phone className="h-3 w-3" />
                          {contact.company.phone}
                        </span>
                      ) : null}
                      {isStopped ? (
                        <Badge
                          title={contact.company ? stoppedTooltip(contact.company) : undefined}
                          className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                        >
                          <Ban className="mr-1 h-3 w-3" />
                          Stopped
                        </Badge>
                      ) : null}

                      <div className="ml-auto flex items-center gap-1.5">
                        {isStopped ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 border-emerald-300 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleResumeContact(contact.company_id)}
                            disabled={isPendingStop}
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Resume
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 border-rose-300 px-2 text-xs text-rose-700 hover:bg-rose-50"
                                disabled={isPendingStop}
                              >
                                <Ban className="mr-1 h-3 w-3" />
                                Stop
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Stop all outreach to {contact.company?.company_name || "this company"}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This cancels every scheduled email for this company across all sequences, and
                                  flags it as stopped everywhere it appears — no automated emails will send, and
                                  it's a reminder not to call. You can resume at any time.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleStopContact(contact.company_id)}
                                  className="bg-rose-600 hover:bg-rose-700"
                                >
                                  Stop outreach
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveContact(contact.company_id)}
                          disabled={isMutating}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        ) : null}
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsStepsExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-left"
            >
              {isStepsExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              )}
              <div>
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  Steps
                  <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
                    {steps.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Ticking a step for a contact logs it as an activity immediately — there is no separate manual log step.
                </CardDescription>
              </div>
            </button>
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
        {isStepsExpanded ? (
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
              const dateRange = dateRangeByStep.get(step.id);
              const isStaggeredRange = Boolean(dateRange && dateRange.earliest !== dateRange.latest);
              const visibleContacts = contacts
                .filter((contact) => {
                  const name = contact.company?.company_name?.toLowerCase() || "";
                  if (searchTerm && !name.includes(searchTerm.toLowerCase())) return false;
                  if (hideCompleted && completedKeySet.has(`${step.id}:${contact.company_id}`)) return false;
                  return true;
                })
                .sort((a, b) => {
                  // Soonest due date first so it's obvious what needs doing next.
                  // Contacts with no date (shouldn't normally happen) sort last.
                  const dateA = effectiveDateByKey.get(`${step.id}:${a.company_id}`) || "9999-12-31";
                  const dateB = effectiveDateByKey.get(`${step.id}:${b.company_id}`) || "9999-12-31";
                  if (dateA !== dateB) return dateA < dateB ? -1 : 1;
                  return (a.company?.company_name || "").localeCompare(b.company?.company_name || "");
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
                    {dateRange ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500" title={isStaggeredRange ? "Staggered — each company has its own date, see below" : undefined}>
                        <Calendar className="h-3.5 w-3.5" />
                        {isStaggeredRange
                          ? `${formatDate(dateRange.earliest)} \u2013 ${formatDate(dateRange.latest)}`
                          : formatDate(dateRange.earliest)}
                        {formatTime(step.scheduled_time) ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(step.scheduled_time)}
                          </span>
                        ) : null}
                        {isStaggeredRange ? (
                          <span className="ml-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            Varies per company
                          </span>
                        ) : null}
                      </span>
                    ) : step.scheduled_date ? (
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
                                const isStopped = Boolean(contact.company?.is_stopped);
                                const isComplete = completedKeySet.has(`${step.id}:${contact.company_id}`);

                                return (
                                  <div
                                    key={contact.id}
                                    className={`flex flex-col gap-2 rounded-md px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${
                                      isStopped ? "bg-rose-50/60" : "bg-slate-50/70"
                                    }`}
                                  >
                                    <span className={`text-sm text-slate-700 ${isStopped && !isComplete ? "text-slate-400" : ""}`}>
                                      {contact.company?.company_name || "Unknown company"}
                                    </span>
                                    {renderStepActionsForContact(step, contact)}
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
        ) : null}
      </Card>

      <Dialog open={Boolean(outcomeModal)} onOpenChange={(open) => !open && setOutcomeModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide more information</DialogTitle>
            <DialogDescription>
              {outcomeModal
                ? `Logging a ${outcomeModal.outcome === "positive" ? "positive" : "negative"} outcome for ${outcomeModal.companyName}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {outcomeModal?.outcome === "negative" ? (
              <label className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50/60 p-3 text-sm text-rose-900">
                <Checkbox
                  checked={outcomeStopContact}
                  onCheckedChange={(checked) => setOutcomeStopContact(Boolean(checked))}
                  className="mt-0.5"
                />
                <span>
                  Stop outreach for this contact — pauses automated emails and flags &quot;do not call&quot; across
                  every sequence they&apos;re in.
                </span>
              </label>
            ) : null}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={outcomeNote}
                onChange={(event) => setOutcomeNote(event.target.value)}
                rows={4}
                placeholder="What happened on the call..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOutcomeModal(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitOutcomeModal} disabled={isSavingOutcome}>
              {isSavingOutcome ? "Saving..." : "Save outcome"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
