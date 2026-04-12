"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CalendarClock, Eye, Globe, Mail, Phone, RefreshCw, Search, User2 } from "lucide-react";
import { AppTitle } from "@/components/shared/app-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AutomatedSequencesPanel } from "@/components/admin/outbound/automated-sequences-panel";

export const dynamic = "force-dynamic";

interface OutboundLead {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  lead_source: string | null;
  lead_status: "new" | "attempted_contact" | "in_conversation" | "qualified" | "proposal_sent" | "won" | "lost";
  priority: "low" | "medium" | "high";
  notes_summary: string | null;
  created_at: string;
  updated_at: string;
}

interface OutboundLeadNote {
  id: string;
  lead_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
  created_by_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface OutboundLeadDetailResponse {
  lead: OutboundLead;
  notes: OutboundLeadNote[];
}

const STATUS_BADGE_CLASSES: Record<OutboundLead["lead_status"], string> = {
  new: "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200",
  attempted_contact: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  in_conversation: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  qualified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  proposal_sent: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  won: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  lost: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

const PRIORITY_BADGE_CLASSES: Record<OutboundLead["priority"], string> = {
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  medium: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
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

function prettifyStatus(status: OutboundLead["lead_status"]) {
  return status.replace(/_/g, " ");
}

export default function AdminOutboundPage() {
  const [activeTab, setActiveTab] = useState("leads-database");
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingLeadDetails, setIsLoadingLeadDetails] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [leads, setLeads] = useState<OutboundLead[]>([]);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState<OutboundLeadDetailResponse | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();

  const fetchLeads = useCallback(async (searchTerm?: string) => {
    setIsLoadingLeads(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      const query = params.toString();
      const response = await fetch(`/api/admin/outbound/leads${query ? `?${query}` : ""}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch outbound leads");
      }

      setLeads(data.leads || []);
    } catch (error: any) {
      console.error("Error fetching outbound leads:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch leads.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLeads(false);
    }
  }, [toast]);

  const fetchLeadDetails = useCallback(async (leadId: string) => {
    setIsLoadingLeadDetails(true);
    try {
      const response = await fetch(`/api/admin/outbound/leads/${leadId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch lead details");
      }
      setSelectedLeadDetails({
        lead: data.lead,
        notes: data.notes || [],
      });
    } catch (error: any) {
      console.error("Error fetching lead details:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load lead details.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLeadDetails(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const totalLeads = useMemo(() => leads.length, [leads]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedSearch = searchInput.trim();
    setActiveSearchTerm(cleanedSearch);
    fetchLeads(cleanedSearch);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setActiveSearchTerm("");
    fetchLeads("");
  };

  const handleOpenLeadModal = async (leadId: string) => {
    setIsLeadModalOpen(true);
    setSelectedLeadDetails(null);
    setNewNote("");
    await fetchLeadDetails(leadId);
  };

  const handleAddNote = async () => {
    const selectedLead = selectedLeadDetails?.lead;
    if (!selectedLead) return;
    if (!newNote.trim()) {
      toast({
        title: "Note required",
        description: "Please write a note before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingNote(true);
    try {
      const response = await fetch(`/api/admin/outbound/leads/${selectedLead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: newNote,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save note");
      }

      setSelectedLeadDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notes: [data.note, ...prev.notes],
        };
      });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding lead note:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save note.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-8">
      <AppTitle
        title="Outbound"
        description="Manage lead operations and automated outreach workflows"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leads-database">Leads Database</TabsTrigger>
          <TabsTrigger value="automated-sequences">Automated Sequences</TabsTrigger>
        </TabsList>

        <TabsContent value="leads-database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads Database</CardTitle>
              <CardDescription>
                Track outbound opportunities, review key details, and keep note history in one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2 sm:flex-row md:max-w-xl">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search by company, contact, email, or phone"
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                  {activeSearchTerm ? (
                    <Button type="button" variant="outline" onClick={handleClearSearch}>
                      Clear
                    </Button>
                  ) : null}
                </form>

                <Button
                  variant="outline"
                  onClick={() => fetchLeads(activeSearchTerm)}
                  disabled={isLoadingLeads}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLeads ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{totalLeads} leads</span>
                {activeSearchTerm ? (
                  <span>Filtered by "{activeSearchTerm}"</span>
                ) : (
                  <span>Showing latest outbound leads</span>
                )}
              </div>

              <div className="hidden rounded-md border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[90px] text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLeads ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          Loading leads...
                        </TableCell>
                      </TableRow>
                    ) : leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          No leads found. Run the SQL migration and add leads to start populating this table.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <div className="font-medium">{lead.company_name}</div>
                            {lead.website ? (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                              </a>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <p>{lead.contact_name || "N/A"}</p>
                              <p className="text-muted-foreground">{lead.contact_email || "No email"}</p>
                            </div>
                          </TableCell>
                          <TableCell>{lead.lead_source || "Direct"}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_BADGE_CLASSES[lead.lead_status]}>
                              {prettifyStatus(lead.lead_status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={PRIORITY_BADGE_CLASSES[lead.priority]}>
                              {lead.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(lead.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenLeadModal(lead.id)}
                              title="View lead details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {isLoadingLeads ? (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading leads...</CardContent>
                  </Card>
                ) : leads.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      No leads found yet.
                    </CardContent>
                  </Card>
                ) : (
                  leads.map((lead) => (
                    <Card key={lead.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{lead.company_name}</p>
                            <p className="text-xs text-muted-foreground">{lead.lead_source || "Direct source"}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenLeadModal(lead.id)}
                            title="View lead details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={STATUS_BADGE_CLASSES[lead.lead_status]}>{prettifyStatus(lead.lead_status)}</Badge>
                          <Badge className={PRIORITY_BADGE_CLASSES[lead.priority]}>{lead.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{lead.contact_email || "No contact email"}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={isLeadModalOpen}
            onOpenChange={(open) => {
              setIsLeadModalOpen(open);
              if (!open) {
                setSelectedLeadDetails(null);
                setNewNote("");
              }
            }}
          >
            <DialogContent className="sm:max-w-[46rem] max-h-[90vh] overflow-visible flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {selectedLeadDetails?.lead.company_name || "Lead details"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 overflow-y-auto px-1 pb-1">
                {isLoadingLeadDetails ? (
                  <div className="rounded-md border p-6 text-sm text-muted-foreground">
                    Loading lead details...
                  </div>
                ) : !selectedLeadDetails ? (
                  <div className="rounded-md border p-6 text-sm text-muted-foreground">
                    Lead details are unavailable.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border p-3 dark:border-input dark:bg-background">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
                        <div className="space-y-2 text-sm">
                          <p className="inline-flex items-center gap-2">
                            <User2 className="h-4 w-4 text-muted-foreground" />
                            {selectedLeadDetails.lead.contact_name || "Not provided"}
                          </p>
                          <p className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {selectedLeadDetails.lead.contact_email || "Not provided"}
                          </p>
                          <p className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {selectedLeadDetails.lead.contact_phone || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border p-3 dark:border-input dark:bg-background">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Lead metadata</p>
                        <div className="space-y-2 text-sm">
                          <p className="inline-flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Source: {selectedLeadDetails.lead.lead_source || "Direct"}
                          </p>
                          <p className="inline-flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            Created: {formatDateTime(selectedLeadDetails.lead.created_at)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={STATUS_BADGE_CLASSES[selectedLeadDetails.lead.lead_status]}>
                              {prettifyStatus(selectedLeadDetails.lead.lead_status)}
                            </Badge>
                            <Badge className={PRIORITY_BADGE_CLASSES[selectedLeadDetails.lead.priority]}>
                              {selectedLeadDetails.lead.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedLeadDetails.lead.notes_summary ? (
                      <div className="rounded-lg border p-3 dark:border-input dark:bg-background">
                        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Summary note</p>
                        <p className="text-sm">{selectedLeadDetails.lead.notes_summary}</p>
                      </div>
                    ) : null}

                    <div className="space-y-3 rounded-lg border p-3 dark:border-input dark:bg-background">
                      <p className="text-sm font-medium">Add note</p>
                      <Textarea
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        rows={4}
                        placeholder="Write your outbound context, conversation notes, or follow-up actions..."
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleAddNote} disabled={isSavingNote || !newNote.trim()}>
                          {isSavingNote ? "Saving..." : "Save note"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Previous notes ({selectedLeadDetails.notes.length})</p>
                      <div className="max-h-[18rem] space-y-3 overflow-y-auto pr-1">
                        {selectedLeadDetails.notes.length === 0 ? (
                          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                            No notes yet.
                          </div>
                        ) : (
                          selectedLeadDetails.notes.map((note) => {
                            const authorName = note.created_by_user
                              ? `${note.created_by_user.first_name || ""} ${note.created_by_user.last_name || ""}`.trim() || note.created_by_user.email || "Platform Admin"
                              : "Platform Admin";

                            return (
                              <div key={note.id} className="rounded-md border p-3">
                                <p className="whitespace-pre-wrap text-sm">{note.note}</p>
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span>{authorName}</span>
                                  <span className="mx-1">-</span>
                                  <span>{formatDateTime(note.created_at)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="automated-sequences" className="space-y-6">
          <AutomatedSequencesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
