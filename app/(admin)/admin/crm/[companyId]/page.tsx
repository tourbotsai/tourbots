"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Play,
  Plus,
  Reply,
  User2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export const dynamic = "force-dynamic";

type CrmCompanyStatus =
  | "not_started"
  | "attempted"
  | "in_sequence"
  | "interested"
  | "not_interested"
  | "dormant";

interface CrmCompany {
  id: string;
  company_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  region: string;
  notes_summary: string | null;
  source: string;
  status: CrmCompanyStatus;
  is_stopped: boolean;
  stopped_at: string | null;
  stopped_reason: "manual" | "inbound_reply" | null;
  created_at: string;
}

interface CrmNote {
  id: string;
  company_id: string;
  note_text: string;
  created_at: string;
}

interface CrmActivity {
  id: string;
  company_id: string;
  activity_type: "call" | "email";
  activity_date: string;
  activity_time: string | null;
  subject: string | null;
  summary: string;
  outcome: string | null;
  direction: "outbound" | "inbound";
  created_at: string;
}

const STATUS_LABELS: Record<CrmCompanyStatus, string> = {
  not_started: "Not started",
  attempted: "Attempted",
  in_sequence: "In sequence",
  interested: "Interested",
  not_interested: "Not interested",
  dormant: "Dormant",
};

const STATUS_BADGE_CLASSES: Record<CrmCompanyStatus, string> = {
  not_started: "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200",
  attempted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  in_sequence: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  interested: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  not_interested: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  dormant: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function stoppedTooltip(company: Pick<CrmCompany, "stopped_reason" | "stopped_at">) {
  const when = company.stopped_at ? formatDateTime(company.stopped_at) : "an unknown time";
  return company.stopped_reason === "inbound_reply"
    ? `Stopped automatically — a reply was detected on ${when}`
    : `Stopped manually on ${when}`;
}

export default function CrmCompanyDetailPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<CrmCompany | null>(null);
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set());

  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isTogglingStopped, setIsTogglingStopped] = useState(false);

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    region: "",
  });

  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [activityType, setActivityType] = useState<"call" | "email">("call");
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activityTime, setActivityTime] = useState("");
  const [activitySubject, setActivitySubject] = useState("");
  const [activitySummary, setActivitySummary] = useState("");
  const [activityOutcome, setActivityOutcome] = useState("");

  const [outcomeEditingId, setOutcomeEditingId] = useState<string | null>(null);
  const [outcomeDraft, setOutcomeDraft] = useState("");
  const [isSavingOutcome, setIsSavingOutcome] = useState(false);

  const fetchCompany = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch company");

      setCompany(data.company);
      setNotes(data.notes || []);
      setActivities(data.activities || []);
    } catch (error: any) {
      console.error("Error fetching CRM company:", error);
      toast({ title: "Error", description: error.message || "Failed to load company.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, toast]);

  useEffect(() => {
    if (!companyId) return;
    fetchCompany();
  }, [companyId, fetchCompany]);

  const handleStatusChange = async (status: CrmCompanyStatus) => {
    if (!company) return;
    setIsSavingStatus(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update status");

      setCompany(data.company);
      toast({ title: "Success", description: "Status updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update status.", variant: "destructive" });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleStopOutreach = async () => {
    setIsTogglingStopped(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}/stop`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to stop outreach");

      setCompany(data.company);
      toast({ title: "Stopped", description: "No automated emails will send, and this is flagged in every sequence." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to stop outreach.", variant: "destructive" });
    } finally {
      setIsTogglingStopped(false);
    }
  };

  const handleResumeOutreach = async () => {
    setIsTogglingStopped(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}/stop`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to resume outreach");

      setCompany(data.company);
      toast({ title: "Resumed", description: "This company can be contacted again." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to resume outreach.", variant: "destructive" });
    } finally {
      setIsTogglingStopped(false);
    }
  };

  const startEditingContact = () => {
    if (!company) return;
    setContactForm({
      company_name: company.company_name || "",
      first_name: company.first_name || "",
      last_name: company.last_name || "",
      phone: company.phone || "",
      email: company.email || "",
      region: company.region || "",
    });
    setIsEditingContact(true);
  };

  const handleSaveContactDetails = async () => {
    if (!contactForm.company_name.trim()) {
      toast({ title: "Company name required", description: "Company name cannot be blank.", variant: "destructive" });
      return;
    }
    setIsSavingContact(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update contact details");

      setCompany(data.company);
      setIsEditingContact(false);
      toast({ title: "Saved", description: "Contact details updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update contact details.", variant: "destructive" });
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({ title: "Note required", description: "Please write a note before saving.", variant: "destructive" });
      return;
    }
    setIsSavingNote(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: newNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save note");

      setNotes((prev) => [data.note, ...prev]);
      setNewNote("");
      toast({ title: "Success", description: "Note added." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save note.", variant: "destructive" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const resetActivityForm = () => {
    setActivityType("call");
    setActivityDate(new Date().toISOString().slice(0, 10));
    setActivityTime("");
    setActivitySubject("");
    setActivitySummary("");
    setActivityOutcome("");
  };

  const handleLogActivity = async () => {
    if (!activitySummary.trim()) {
      toast({ title: "Summary required", description: "Please describe what happened.", variant: "destructive" });
      return;
    }
    setIsSavingActivity(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: activityType,
          activity_date: activityDate,
          activity_time: activityTime || null,
          subject: activitySubject || null,
          summary: activitySummary,
          outcome: activityOutcome || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to log activity");

      setActivities((prev) => [data.activity, ...prev]);
      resetActivityForm();
      setIsActivityModalOpen(false);
      toast({ title: "Success", description: "Activity logged." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to log activity.", variant: "destructive" });
    } finally {
      setIsSavingActivity(false);
    }
  };

  const toggleExpanded = (activityId: string) => {
    setExpandedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const startEditingOutcome = (activity: CrmActivity) => {
    setOutcomeEditingId(activity.id);
    setOutcomeDraft(activity.outcome || "");
  };

  const handleSaveOutcome = async (activityId: string) => {
    setIsSavingOutcome(true);
    try {
      const response = await fetch(`/api/admin/crm/companies/${companyId}/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: outcomeDraft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update outcome");

      setActivities((prev) => prev.map((activity) => (activity.id === activityId ? data.activity : activity)));
      setOutcomeEditingId(null);
      toast({ title: "Success", description: "Outcome updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update outcome.", variant: "destructive" });
    } finally {
      setIsSavingOutcome(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Loading company...
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Company not found.</p>
        <Link href="/admin/crm">
          <Button variant="outline">Back to CRM</Button>
        </Link>
      </div>
    );
  }

  const contactFullName = `${company.first_name || ""} ${company.last_name || ""}`.trim();

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-6">
        <Link href="/admin/crm" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back to CRM
        </Link>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">{company.company_name}</h1>
              {company.is_stopped ? (
                <Badge
                  title={stoppedTooltip(company)}
                  className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                >
                  <Ban className="mr-1 h-3 w-3" />
                  Stopped
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-slate-500">{contactFullName || "No contact name on file"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs uppercase tracking-wide text-slate-500">Status</Label>
            <Select value={company.status} onValueChange={(value) => handleStatusChange(value as CrmCompanyStatus)} disabled={isSavingStatus}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {company.is_stopped ? (
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={handleResumeOutreach}
                disabled={isTogglingStopped}
              >
                <Play className="mr-2 h-4 w-4" />
                Resume outreach
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-50" disabled={isTogglingStopped}>
                    <Ban className="mr-2 h-4 w-4" />
                    Stop outreach
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Stop all outreach to {company.company_name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This cancels every scheduled email for this company across all sequences, and flags it as
                      stopped everywhere it appears — no automated emails will send, and it's a reminder not to call.
                      You can resume at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStopOutreach} className="bg-rose-600 hover:bg-rose-700">
                      Stop outreach
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="text-base text-slate-900">Contact information</CardTitle>
          {isEditingContact ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditingContact(false)} disabled={isSavingContact}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveContactDetails} disabled={isSavingContact}>
                {isSavingContact ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={startEditingContact}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingContact ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Company</Label>
                <Input
                  value={contactForm.company_name}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, company_name: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">First name</Label>
                <Input
                  value={contactForm.first_name}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, first_name: event.target.value }))}
                  placeholder="Not provided"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Last name</Label>
                <Input
                  value={contactForm.last_name}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, last_name: event.target.value }))}
                  placeholder="Not provided"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Phone</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Not provided"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Email</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Not provided"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Region</Label>
                <Input
                  value={contactForm.region}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, region: event.target.value }))}
                  placeholder="Unknown"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1 text-xs font-medium text-slate-600">Company</p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-900">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {company.company_name}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1 text-xs font-medium text-slate-600">Contact name</p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-900">
                  <User2 className="h-4 w-4 text-slate-400" />
                  {contactFullName || "Not provided"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1 text-xs font-medium text-slate-600">Phone</p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-900">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {company.phone || "Not provided"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1 text-xs font-medium text-slate-600">Email</p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-900">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {company.email || "Not provided"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1 text-xs font-medium text-slate-600">Region</p>
                <p className="inline-flex items-center gap-2 text-sm text-slate-900">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {company.region || "Unknown"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="mb-1 text-xs font-medium text-slate-600">Status</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className={STATUS_BADGE_CLASSES[company.status]}>{STATUS_LABELS[company.status]}</Badge>
                  {company.is_stopped ? (
                    <Badge
                      title={stoppedTooltip(company)}
                      className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      Stopped
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          )}
          {company.notes_summary ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <p className="mb-1 text-xs font-medium text-slate-600">Reference notes</p>
              <p className="text-sm text-slate-700">{company.notes_summary}</p>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-slate-400">Source: {company.source}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Add note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            rows={3}
            placeholder="Write a quick reference note about this company..."
          />
          <div className="flex justify-end">
            <Button onClick={handleAddNote} disabled={isSavingNote || !newNote.trim()}>
              {isSavingNote ? "Saving..." : "Save note"}
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-md border border-slate-200 p-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{note.note_text}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(note.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base text-slate-900">Activity history</CardTitle>
            <Dialog
              open={isActivityModalOpen}
              onOpenChange={(open) => {
                setIsActivityModalOpen(open);
                if (!open) resetActivityForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Log Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log activity</DialogTitle>
                  <DialogDescription>For calls or emails that happened outside of a sequence.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <RadioGroup
                      value={activityType}
                      onValueChange={(value) => setActivityType(value as "call" | "email")}
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="call" id="activity-type-call" />
                        <Label htmlFor="activity-type-call" className="cursor-pointer font-normal">
                          Call
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="email" id="activity-type-email" />
                        <Label htmlFor="activity-type-email" className="cursor-pointer font-normal">
                          Email
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={activityDate} onChange={(event) => setActivityDate(event.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time</Label>
                      <Input type="time" value={activityTime} onChange={(event) => setActivityTime(event.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={activitySubject}
                      onChange={(event) => setActivitySubject(event.target.value)}
                      placeholder="Optional subject line or call topic"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Summary</Label>
                    <Textarea
                      value={activitySummary}
                      onChange={(event) => setActivitySummary(event.target.value)}
                      rows={4}
                      placeholder="What happened, what was said, or the resolved email body..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Outcome</Label>
                    <Input
                      value={activityOutcome}
                      onChange={(event) => setActivityOutcome(event.target.value)}
                      placeholder="Optional — can also be added later"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsActivityModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleLogActivity} disabled={isSavingActivity}>
                    {isSavingActivity ? "Saving..." : "Save activity"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500">No activity logged yet.</p>
          ) : (
            activities.map((activity) => {
              const isExpanded = expandedActivityIds.has(activity.id);
              const isEditingOutcome = outcomeEditingId === activity.id;
              return (
                <div key={activity.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {activity.direction === "inbound" ? (
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                            <Reply className="mr-1 h-3 w-3" />
                            Reply received
                          </Badge>
                        ) : (
                          <Badge
                            className={
                              activity.activity_type === "call"
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                            }
                          >
                            {activity.activity_type === "call" ? "Call" : "Email"}
                          </Badge>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(activity.activity_date)}
                          {activity.activity_time ? ` at ${activity.activity_time.slice(0, 5)}` : ""}
                        </span>
                      </div>
                      {activity.subject ? <p className="text-sm font-medium text-slate-900">{activity.subject}</p> : null}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleExpanded(activity.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {isExpanded ? (
                    <p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50/70 p-2 text-sm text-slate-600">
                      {activity.summary}
                    </p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Outcome:</span>
                    {isEditingOutcome ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={outcomeDraft}
                          onChange={(event) => setOutcomeDraft(event.target.value)}
                          placeholder="e.g. Left voicemail, follow up next week"
                          className="h-8"
                        />
                        <Button size="sm" onClick={() => handleSaveOutcome(activity.id)} disabled={isSavingOutcome}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setOutcomeEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-slate-700">{activity.outcome || "Not set yet"}</span>
                        <Button variant="ghost" size="sm" onClick={() => startEditingOutcome(activity)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
