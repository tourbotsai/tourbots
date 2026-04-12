"use client";

import { useEffect, useMemo, useState } from "react";
import { useGuides } from "@/hooks/resources/useGuides";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X, FileText, Clock, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const placeholderSections = [
  "Account Setup",
  "Tour Setup",
  "Chatbot Setup",
  "Share and Embed",
  "Analytics",
  "Billing",
  "Add-ons",
];

export function GuideGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuideSlug, setSelectedGuideSlug] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { guides, isLoading, error, updateFilters } = useGuides({ limit: 100 });

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilters({
      search: searchQuery.trim() || undefined,
      difficulty: undefined,
      tags: undefined,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    updateFilters({ search: undefined, difficulty: undefined, tags: undefined });
  };

  useEffect(() => {
    if (guides.length === 0) {
      setSelectedGuideSlug("");
      return;
    }
    const selectedExists = guides.some((guide) => guide.slug === selectedGuideSlug);
    if (!selectedGuideSlug || !selectedExists) {
      setSelectedGuideSlug(guides[0].slug);
    }
  }, [guides, selectedGuideSlug]);

  const selectedGuide = useMemo(
    () => guides.find((guide) => guide.slug === selectedGuideSlug) || null,
    [guides, selectedGuideSlug]
  );

  const guideSections = useMemo(() => {
    const sectionMap = new Map<string, typeof guides>();

    guides.forEach((guide) => {
      // A guide should live in one primary section only.
      const primarySection = guide.tags && guide.tags.length > 0 ? guide.tags[0] : "General";
      if (!sectionMap.has(primarySection)) {
        sectionMap.set(primarySection, []);
      }
      sectionMap.get(primarySection)!.push(guide);
    });

    // Ensure planned sections always appear, even before docs exist.
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

  useEffect(() => {
    if (!selectedGuide?.id) return;
    fetch(`/api/public/resources/guides/views/${selectedGuide.id}`, {
      method: "POST",
    }).catch(() => undefined);
  }, [selectedGuide?.id]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (error) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <div className="mb-4 text-red-400">⚠️ Error loading guides</div>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="pb-16 pt-2 lg:pb-24 lg:pt-3">
      <div className="container">
        {isLoading && guides.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/45 shadow-[0_18px_44px_rgba(2,6,23,0.28)]">
            <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="h-fit bg-slate-950/45 p-3 md:p-4 lg:sticky lg:top-0 lg:max-h-[78vh] lg:overflow-y-auto">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search guides..."
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 pr-24 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-brand-primary focus-visible:outline-none"
                />
                <Button
                  type="submit"
                  className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-white px-3 text-slate-900 hover:bg-slate-200"
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
                    className="text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Clear filters
                  </Button>
                </div>
              )}

              <div className="mt-5 border-t border-slate-700/70 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Sections</p>
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
                        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {sectionName}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {expandedSections[sectionName] ? "−" : "+"}
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
                                    ? "text-white"
                                    : "text-slate-300 hover:text-white"
                                }`}
                              >
                                <span className="flex items-start gap-2">
                                  <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="line-clamp-2">{guide.title}</span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="px-1 py-1 text-xs text-slate-500">Guides coming soon</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="min-h-[520px] border-l border-slate-700/70 bg-slate-900/55 p-6 md:p-8">
              {!selectedGuide ? (
                <div className="flex h-full items-center justify-center py-16 text-center">
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-white">No guides found</h3>
                    <p className="mb-6 text-slate-300">Try another keyword or clear filters.</p>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800"
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 border-b border-slate-700/70 pb-5">
                    {selectedGuide.tags && selectedGuide.tags.length > 0 && (
                      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        {selectedGuide.tags[0]} section
                      </p>
                    )}
                    <h2 className="text-2xl font-semibold text-white md:text-3xl">{selectedGuide.title}</h2>
                    {selectedGuide.excerpt && (
                      <p className="mt-3 text-slate-300">{selectedGuide.excerpt}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-slate-400 md:text-sm">
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

                  <div className="max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({ children }) => (
                          <h2 className="mt-10 border-t border-slate-700/70 pt-8 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mt-8 text-xl font-semibold text-slate-100 md:text-2xl">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mt-4 text-base leading-8 text-slate-100 md:text-lg">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-100 marker:text-slate-300">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-100 marker:font-semibold marker:text-slate-300">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => <li className="pl-1 leading-8">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        blockquote: ({ children }) => (
                          <blockquote className="mt-6 border-l-4 border-brand-primary/80 bg-slate-800/40 px-5 py-4 italic text-slate-100">
                            {children}
                          </blockquote>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            className="font-medium text-sky-300 underline underline-offset-4 transition-colors hover:text-sky-200"
                            target={href?.startsWith("http") ? "_blank" : undefined}
                            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                          >
                            {children}
                          </a>
                        ),
                        hr: () => <hr className="my-10 border-slate-700/80" />,
                        code: ({ children }) => (
                          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-sky-200">{children}</code>
                        ),
                      }}
                    >
                      {selectedGuide.content}
                    </ReactMarkdown>
                  </div>
                </>
              )}
            </div>
            </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}