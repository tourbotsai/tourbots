"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useHelpGuides } from "@/hooks/app/useHelpGuides";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Loader2, Search, X } from "lucide-react";

const placeholderSections = [
  "Account Setup",
  "Tour Setup",
  "Chatbot Setup",
  "Share and Embed",
  "Analytics",
  "Billing",
  "Add-ons",
];

export function HelpCenterGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuideSlug, setSelectedGuideSlug] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { guides, isLoading, error, updateFilters } = useHelpGuides();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilters({
      search: searchQuery.trim() || undefined,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    updateFilters({
      search: undefined,
    });
  };

  useEffect(() => {
    if (guides.length === 0) {
      setSelectedGuideSlug("");
      return;
    }
    if (!selectedGuideSlug) {
      return;
    }
    const selectedExists = guides.some((guide) => guide.slug === selectedGuideSlug);
    if (!selectedExists) {
      setSelectedGuideSlug("");
    }
  }, [guides, selectedGuideSlug]);

  const selectedGuide = useMemo(
    () => guides.find((guide) => guide.slug === selectedGuideSlug) || null,
    [guides, selectedGuideSlug]
  );

  const guideSections = useMemo(() => {
    const sectionMap = new Map<string, typeof guides>();

    guides.forEach((guide) => {
      const primarySection = guide.tags && guide.tags.length > 0 ? guide.tags[0] : "General";
      if (!sectionMap.has(primarySection)) {
        sectionMap.set(primarySection, []);
      }
      sectionMap.get(primarySection)!.push(guide);
    });

    placeholderSections.forEach((sectionName) => {
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
      }
    });

    const ordered = placeholderSections
      .filter((sectionName) => sectionMap.has(sectionName))
      .map((sectionName) => ({
        sectionName,
        sectionGuides: sectionMap.get(sectionName) || [],
      }));

    const additional = Array.from(sectionMap.entries())
      .filter(([sectionName]) => !placeholderSections.includes(sectionName))
      .map(([sectionName, sectionGuides]) => ({ sectionName, sectionGuides }))
      .sort((a, b) => a.sectionName.localeCompare(b.sectionName));

    return [...ordered, ...additional];
  }, [guides]);

  useEffect(() => {
    if (guideSections.length === 0) return;
    setExpandedSections((prev) => {
      const next = { ...prev };
      guideSections.forEach((section, idx) => {
        if (next[section.sectionName] === undefined) {
          next[section.sectionName] = idx === 0;
        }
      });
      return next;
    });
  }, [guideSections]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="mb-4 text-red-500">Error loading guides</div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
        {isLoading && guides.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500 dark:text-slate-300" />
          </div>
        )}

        {!isLoading && (
          <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="h-fit border-b border-slate-200 bg-slate-50/70 p-3 md:p-4 dark:border-input dark:bg-muted/30 lg:sticky lg:top-0 lg:max-h-[74vh] lg:overflow-y-auto lg:border-b-0 lg:border-r">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search guides..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-24 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-slate-400 focus-visible:outline-none dark:border-input dark:bg-background dark:text-slate-100"
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-slate-900 px-3 text-white hover:bg-slate-800 dark:border dark:border-slate-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                  <Search className="mr-1 h-4 w-4" />
                  Search
                </Button>
              </form>

              {searchQuery && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Clear filters
                  </Button>
                </div>
              )}

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-input">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Sections
                </p>
                <div className="space-y-4 pr-1">
                  {guideSections.map(({ sectionName, sectionGuides }) => (
                    <div key={sectionName}>
                      <button
                        type="button"
                        className="mb-1 flex w-full items-center justify-between text-left"
                        onClick={() =>
                          setExpandedSections((prev) => ({
                            ...prev,
                            [sectionName]: !prev[sectionName],
                          }))
                        }
                      >
                        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          {sectionName}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {expandedSections[sectionName] ? "-" : "+"}
                        </span>
                      </button>
                      {expandedSections[sectionName] && (
                        <div className="space-y-1.5 pl-1">
                          {sectionGuides.length > 0 ? (
                            sectionGuides.map((guide) => (
                              <button
                                key={`${sectionName}-${guide.id}`}
                                type="button"
                                onClick={() => setSelectedGuideSlug(guide.slug)}
                                className={`w-full px-1 py-1.5 text-left text-sm transition-colors ${
                                  selectedGuideSlug === guide.slug
                                    ? "font-medium text-slate-900 dark:text-white"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                }`}
                              >
                                <span className="flex items-start gap-2">
                                  <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="line-clamp-2">{guide.title}</span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="px-1 py-1 text-xs text-slate-500 dark:text-slate-400">
                              Guides coming soon
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="min-h-[520px] bg-white p-6 md:p-8 dark:bg-background">
              {!selectedGuide ? (
                <div className="flex h-full items-center justify-center py-16 text-center">
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                      Select a guide to begin
                    </h3>
                    <p className="mb-6 text-slate-600 dark:text-slate-300">
                      Choose any guide from the left-hand list to open the documentation content.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 border-b border-slate-200 pb-5 dark:border-input">
                    {selectedGuide.tags && selectedGuide.tags.length > 0 && (
                      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {selectedGuide.tags[0]} section
                      </p>
                    )}
                    <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl dark:text-white">
                      {selectedGuide.title}
                    </h2>
                    {selectedGuide.excerpt && (
                      <p className="mt-3 text-slate-600 dark:text-slate-300">{selectedGuide.excerpt}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-slate-500 md:text-sm dark:text-slate-400">
                      <div className="flex items-center">
                        <Calendar className="mr-1.5 h-4 w-4" />
                        {formatDate(selectedGuide.published_at || selectedGuide.created_at)}
                      </div>
                      {selectedGuide.reading_time_minutes && (
                        <div className="flex items-center">
                          <Clock className="mr-1.5 h-4 w-4" />
                          {selectedGuide.reading_time_minutes} min read
                        </div>
                      )}
                    </div>
                  </div>

                  <MarkdownRenderer content={selectedGuide.content} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {!isLoading && guides.length === 0 && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          No published guides are currently available.
        </div>
      )}
    </section>
  );
} 