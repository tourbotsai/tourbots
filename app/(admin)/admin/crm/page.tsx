"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Contact2,
  ListChecks,
  Mail,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Unplug,
  Users,
} from "lucide-react";
import { AppTitle } from "@/components/shared/app-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  status: CrmCompanyStatus;
  is_stopped?: boolean;
  stopped_at?: string | null;
  stopped_reason?: "manual" | "inbound_reply" | null;
  last_activity_date: string | null;
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
  contact_count: number;
  step_count: number;
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

const SEQUENCE_STATUS_BADGE_CLASSES: Record<"active" | "paused", string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  paused: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
};

function formatDate(value: string | null) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function contactName(company: CrmCompany) {
  const name = `${company.first_name || ""} ${company.last_name || ""}`.trim();
  return name || "Not provided";
}

interface CrmGmailAccount {
  id: string;
  email_address: string;
  status: "active" | "revoked";
}

export default function AdminCrmPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("companies");

  const [gmailAccount, setGmailAccount] = useState<CrmGmailAccount | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(true);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [isDisconnectingGmail, setIsDisconnectingGmail] = useState(false);

  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [allRegions, setAllRegions] = useState<string[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const [sequences, setSequences] = useState<CrmSequence[]>([]);
  const [isLoadingSequences, setIsLoadingSequences] = useState(false);
  const [isSequenceModalOpen, setIsSequenceModalOpen] = useState(false);
  const [isSavingSequence, setIsSavingSequence] = useState(false);
  const [sequenceTitle, setSequenceTitle] = useState("");
  const [sequenceDescription, setSequenceDescription] = useState("");
  const [sequenceStatus, setSequenceStatus] = useState<"active" | "paused">("active");

  const fetchCompanies = useCallback(
    async (overrides?: { search?: string; status?: string; region?: string }) => {
      setIsLoadingCompanies(true);
      try {
        const params = new URLSearchParams();
        const search = overrides?.search ?? activeSearchTerm;
        const status = overrides?.status ?? statusFilter;
        const region = overrides?.region ?? regionFilter;

        if (search.trim()) params.set("search", search.trim());
        if (status !== "all") params.set("status", status);
        if (region !== "all") params.set("region", region);

        const query = params.toString();
        const response = await fetch(`/api/admin/crm/companies${query ? `?${query}` : ""}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch companies");

        const fetchedCompanies: CrmCompany[] = data.companies || [];
        setCompanies(fetchedCompanies);

        if (!overrides?.search && status === "all" && region === "all") {
          const regions = new Set<string>();
          for (const company of fetchedCompanies) {
            if (company.region) regions.add(company.region);
          }
          setAllRegions(Array.from(regions).sort());
        }
      } catch (error: any) {
        console.error("Error fetching CRM companies:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load companies.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCompanies(false);
      }
    },
    [activeSearchTerm, statusFilter, regionFilter, toast]
  );

  const fetchSequences = useCallback(async () => {
    setIsLoadingSequences(true);
    try {
      const response = await fetch("/api/admin/crm/sequences");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch sequences");
      setSequences(data.sequences || []);
    } catch (error: any) {
      console.error("Error fetching CRM sequences:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load sequences.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSequences(false);
    }
  }, [toast]);

  const fetchGmailAccount = useCallback(async () => {
    setIsLoadingGmail(true);
    try {
      const response = await fetch("/api/admin/crm/gmail");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch Gmail connection status");
      setGmailAccount(data.account || null);
    } catch (error: any) {
      console.error("Error fetching CRM Gmail account:", error);
    } finally {
      setIsLoadingGmail(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchSequences();
    fetchGmailAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The OAuth callback redirects back here with a status query param since it's
  // a plain top-level browser navigation, not a fetch we control.
  useEffect(() => {
    const connected = searchParams.get("gmail_connected");
    const gmailError = searchParams.get("gmail_error");
    if (!connected && !gmailError) return;

    if (connected) {
      toast({ title: "Gmail connected", description: `Sequence emails will now send from ${connected}.` });
      fetchGmailAccount();
    } else if (gmailError) {
      toast({
        title: "Couldn't connect Gmail",
        description: gmailError.replace(/_/g, " "),
        variant: "destructive",
      });
    }
    router.replace("/admin/crm");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      const response = await fetch("/api/admin/crm/gmail/connect");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start Gmail connection");
      window.location.href = data.url;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start Gmail connection.", variant: "destructive" });
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setIsDisconnectingGmail(true);
    try {
      const response = await fetch("/api/admin/crm/gmail", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to disconnect Gmail");
      toast({ title: "Disconnected", description: "Gmail account disconnected. Scheduled sends will no longer fire." });
      setGmailAccount(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to disconnect Gmail.", variant: "destructive" });
    } finally {
      setIsDisconnectingGmail(false);
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = searchInput.trim();
    setActiveSearchTerm(cleaned);
    fetchCompanies({ search: cleaned });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    fetchCompanies({ status: value });
  };

  const handleRegionFilterChange = (value: string) => {
    setRegionFilter(value);
    fetchCompanies({ region: value });
  };

  const handleCreateSequence = async () => {
    if (!sequenceTitle.trim()) {
      toast({ title: "Title required", description: "Please give the sequence a title.", variant: "destructive" });
      return;
    }

    setIsSavingSequence(true);
    try {
      const response = await fetch("/api/admin/crm/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sequenceTitle,
          description: sequenceDescription,
          status: sequenceStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create sequence");

      toast({ title: "Success", description: "Sequence created successfully." });
      setIsSequenceModalOpen(false);
      setSequenceTitle("");
      setSequenceDescription("");
      setSequenceStatus("active");
      await fetchSequences();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sequence.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSequence(false);
    }
  };

  return (
    <div className="space-y-6">
      <AppTitle
        title="CRM"
        description="Track outbound prospects, run manual outreach sequences, and log every call and email."
        action={
          <Button
            onClick={() => {
              fetchCompanies();
              fetchSequences();
            }}
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingCompanies || isLoadingSequences ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                gmailAccount ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {isLoadingGmail
                  ? "Checking Gmail connection..."
                  : gmailAccount
                    ? "Gmail connected"
                    : "No Gmail account connected"}
              </p>
              <p className="text-xs text-slate-500">
                {gmailAccount ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Sequence emails send from {gmailAccount.email_address}
                  </span>
                ) : (
                  "Connect a Gmail/Workspace account to let sequence emails send and schedule automatically."
                )}
              </p>
            </div>
          </div>
          {gmailAccount ? (
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              onClick={handleDisconnectGmail}
              disabled={isDisconnectingGmail}
            >
              <Unplug className="mr-2 h-4 w-4" />
              {isDisconnectingGmail ? "Disconnecting..." : "Disconnect"}
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnectGmail} disabled={isConnectingGmail || isLoadingGmail}>
              <Plug className="mr-2 h-4 w-4" />
              {isConnectingGmail ? "Redirecting to Google..." : "Connect Gmail"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-6">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-900">Companies</CardTitle>
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-600">
                  {companies.length} {companies.length === 1 ? "company" : "companies"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2 sm:flex-row md:max-w-md">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search by company, contact, email, or phone"
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit" variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                    Search
                  </Button>
                </form>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={regionFilter} onValueChange={handleRegionFilterChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All regions</SelectItem>
                      {allRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="hidden rounded-md border border-slate-200 md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCompanies ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                          Loading companies...
                        </TableCell>
                      </TableRow>
                    ) : companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                          No companies found. Run the SQL migration and add companies to start populating this table.
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => (
                        <TableRow key={company.id} className="cursor-pointer">
                          <TableCell>
                            <Link href={`/admin/crm/${company.id}`} className="block font-medium text-slate-900">
                              {company.company_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/crm/${company.id}`} className="block text-sm text-slate-600">
                              {contactName(company)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/crm/${company.id}`} className="block text-sm text-slate-600">
                              {company.phone || "Not provided"}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/crm/${company.id}`} className="block text-sm text-slate-600">
                              {company.region || "Unknown"}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/crm/${company.id}`} className="flex flex-wrap items-center gap-1.5">
                              <Badge className={STATUS_BADGE_CLASSES[company.status]}>
                                {STATUS_LABELS[company.status]}
                              </Badge>
                              {company.is_stopped ? (
                                <Badge
                                  title={stoppedTooltip(company)}
                                  className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
                                >
                                  <Ban className="mr-1 h-3 w-3" />
                                  Stopped
                                </Badge>
                              ) : null}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/crm/${company.id}`} className="block text-sm text-slate-600">
                              {formatDate(company.last_activity_date)}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {isLoadingCompanies ? (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-slate-500">Loading companies...</CardContent>
                  </Card>
                ) : companies.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-slate-500">No companies found yet.</CardContent>
                  </Card>
                ) : (
                  companies.map((company) => (
                    <Link key={company.id} href={`/admin/crm/${company.id}`}>
                      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-900">{company.company_name}</p>
                              <p className="text-xs text-slate-500">{contactName(company)}</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <Badge className={STATUS_BADGE_CLASSES[company.status]}>
                                {STATUS_LABELS[company.status]}
                              </Badge>
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
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>{company.region || "Unknown region"}</span>
                            <span>Last activity: {formatDate(company.last_activity_date)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequences" className="space-y-6">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-slate-900">Sequences</CardTitle>
                  <CardDescription>Manual outreach sequences with per-contact step tracking.</CardDescription>
                </div>
                <Button onClick={() => setIsSequenceModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Sequence
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingSequences ? (
                <div className="rounded-md border border-slate-200 p-8 text-center text-sm text-slate-500">
                  Loading sequences...
                </div>
              ) : sequences.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No sequences yet. Create one to start working through your prospect list.
                </div>
              ) : (
                sequences.map((sequence) => (
                  <Link key={sequence.id} href={`/admin/crm/sequences/${sequence.id}`}>
                    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:bg-slate-100 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{sequence.title}</p>
                          <Badge className={SEQUENCE_STATUS_BADGE_CLASSES[sequence.status]}>
                            {sequence.status === "active" ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        {sequence.description ? (
                          <p className="text-sm text-slate-600">{sequence.description}</p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {sequence.contact_count} contact{sequence.contact_count === 1 ? "" : "s"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ListChecks className="h-3.5 w-3.5" />
                            {sequence.step_count} step{sequence.step_count === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 md:block" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isSequenceModalOpen} onOpenChange={setIsSequenceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Contact2 className="h-4 w-4" />
              Add sequence
            </DialogTitle>
            <DialogDescription>Create a new manual outreach sequence.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={sequenceTitle}
                onChange={(event) => setSequenceTitle(event.target.value)}
                placeholder="e.g. UK VR Tour Prospects - Wave 1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={sequenceDescription}
                onChange={(event) => setSequenceDescription(event.target.value)}
                rows={3}
                placeholder="Optional context for this sequence"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={sequenceStatus} onValueChange={(value) => setSequenceStatus(value as "active" | "paused")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSequenceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateSequence} disabled={isSavingSequence}>
              {isSavingSequence ? "Creating..." : "Create sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
