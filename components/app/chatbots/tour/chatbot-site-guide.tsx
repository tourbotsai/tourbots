"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Map, Plus, Trash2 } from "lucide-react";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { useToast } from "@/components/ui/use-toast";

interface SectionDraft {
  title: string;
  anchor: string;
  description: string;
}

interface PageDraft {
  title: string;
  path: string;
  description: string;
  tourId: string;
  tourIframeSelector: string;
  handoffMode: "none" | "open_chat" | "pass_question";
  sections: SectionDraft[];
}

interface TourOption {
  id: string;
  title: string;
}

const emptyPage = (): PageDraft => ({
  title: "",
  path: "/",
  description: "",
  tourId: "",
  tourIframeSelector: "",
  handoffMode: "none",
  sections: [],
});

interface ChatbotSiteGuideProps {
  chatbotConfigId?: string | null;
}

export function ChatbotSiteGuide({ chatbotConfigId }: ChatbotSiteGuideProps) {
  const { getAuthHeaders } = useAuthHeaders();
  const { toast } = useToast();
  const [siteOrigin, setSiteOrigin] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!chatbotConfigId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/app/chatbots/site-guide?chatbotConfigId=${chatbotConfigId}`, {
        headers: await getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not load the site guide");
      setSiteOrigin(data.siteOrigin || "");
      setEnabled(Boolean(data.enabled));
      setTours(data.tours || []);
      setPages(
        (data.pages || []).map((page: PageDraft) => ({
          title: page.title || "",
          path: page.path || "/",
          description: page.description || "",
          tourId: page.tourId || "",
          tourIframeSelector: page.tourIframeSelector || "",
          handoffMode: page.handoffMode || "none",
          sections: (page.sections || []).map((section) => ({
            title: section.title || "",
            anchor: section.anchor || "",
            description: section.description || "",
          })),
        })),
      );
    } catch (error: any) {
      toast({
        title: "Could not load the site guide",
        description: error?.message || "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [chatbotConfigId, getAuthHeaders, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePage = (index: number, patch: Partial<PageDraft>) => {
    setPages((current) => current.map((page, pageIndex) => (pageIndex === index ? { ...page, ...patch } : page)));
  };

  const save = async () => {
    if (!chatbotConfigId) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/app/chatbots/site-guide", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          chatbotConfigId,
          siteOrigin,
          enabled,
          pages,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not save the site guide");
      toast({
        title: "Site guide saved",
        description: enabled
          ? "Visitors can be guided around the pages you listed."
          : "The guide is saved and switched off. The chatbot will keep answering questions only.",
      });
      await load();
    } catch (error: any) {
      toast({
        title: "Could not save the site guide",
        description: error?.message || "Check the site origin and page paths.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!chatbotConfigId) return null;

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                <Map className="h-4 w-4" />
              </span>
              Site guide
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm dark:text-slate-400">
              List the pages this chatbot may open, the sections it may scroll to, and which TourBots tour sits on each page. It will only move a tour when the visitor is on that page. Leave this empty and the chatbot answers questions exactly as it does today. The guide runs on the live embed, not in the playground. Use the advanced embed snippet so the script can move the page.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="site-guide-enabled" className="text-sm text-slate-600 dark:text-slate-300">Enabled</Label>
            <Switch id="site-guide-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading site guide
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="site-origin">Site origin</Label>
              <Input
                id="site-origin"
                value={siteOrigin}
                onChange={(event) => setSiteOrigin(event.target.value)}
                placeholder="https://www.example.com"
                className="border-slate-200 bg-white text-sm dark:border-input dark:bg-background"
              />
              <p className="text-xs text-muted-foreground">The website this chatbot is installed on. Paths below must belong to this origin.</p>
            </div>

            <div className="space-y-4">
              {pages.map((page, index) => (
                <div key={`page-${index}`} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-input">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Page {index + 1}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPages((current) => current.filter((_, pageIndex) => pageIndex !== index))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove page
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input value={page.title} onChange={(event) => updatePage(index, { title: event.target.value })} placeholder="Infinity Tours" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Path</Label>
                      <Input value={page.path} onChange={(event) => updatePage(index, { path: event.target.value })} placeholder="/infinitytours/" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>What this page is for</Label>
                    <Textarea
                      value={page.description}
                      onChange={(event) => updatePage(index, { description: event.target.value })}
                      placeholder="Pricing for Core, Pro, and Ultra tours."
                      className="min-h-[72px]"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Tour on this page</Label>
                      <select
                        value={page.tourId}
                        onChange={(event) => updatePage(index, { tourId: event.target.value })}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-input dark:bg-background"
                      >
                        <option value="">No TourBots tour</option>
                        {tours.map((tour) => (
                          <option key={tour.id} value={tour.id}>{tour.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Handoff to the tour chatbot</Label>
                      <select
                        value={page.handoffMode}
                        onChange={(event) => updatePage(index, { handoffMode: event.target.value as PageDraft["handoffMode"] })}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-input dark:bg-background"
                      >
                        <option value="none">Do not hand over</option>
                        <option value="open_chat">Open the tour chatbot</option>
                        <option value="pass_question">Open it and pass a question</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tour frame selector</Label>
                    <Input
                      value={page.tourIframeSelector}
                      onChange={(event) => updatePage(index, { tourIframeSelector: event.target.value })}
                      placeholder="#showroom-tour (optional)"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank to use the first TourBots tour embed on the page. Set this when a page has more than one.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Sections</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updatePage(index, { sections: [...page.sections, { title: "", anchor: "", description: "" }] })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add section
                      </Button>
                    </div>
                    {page.sections.map((section, sectionIndex) => (
                      <div key={`section-${index}-${sectionIndex}`} className="grid gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-[1fr_1fr_auto] dark:bg-neutral-900">
                        <Input
                          value={section.title}
                          placeholder="Section title"
                          onChange={(event) => {
                            const sections = page.sections.map((item, itemIndex) => itemIndex === sectionIndex ? { ...item, title: event.target.value } : item);
                            updatePage(index, { sections });
                          }}
                        />
                        <Input
                          value={section.anchor}
                          placeholder="Element id, for example pricing"
                          onChange={(event) => {
                            const sections = page.sections.map((item, itemIndex) => itemIndex === sectionIndex ? { ...item, anchor: event.target.value } : item);
                            updatePage(index, { sections });
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updatePage(index, { sections: page.sections.filter((_, itemIndex) => itemIndex !== sectionIndex) })}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setPages((current) => [...current, emptyPage()])}>
                <Plus className="mr-2 h-4 w-4" />
                Add page
              </Button>
              <Button type="button" onClick={save} disabled={isSaving} className="bg-slate-900 text-white hover:bg-slate-800">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save site guide
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
