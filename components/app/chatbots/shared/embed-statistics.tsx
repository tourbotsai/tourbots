"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Eye,
  Globe,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { EmbedStat } from "@/lib/types";

function getDeviceType(userAgent?: string | null) {
  if (!userAgent) return "Desktop";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return "Mobile";
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "Tablet";
  }
  return "Desktop";
}

function renderDeviceCell(userAgent?: string | null) {
  const device = getDeviceType(userAgent);
  const Icon = device === "Mobile" ? Smartphone : device === "Tablet" ? Tablet : Monitor;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
      <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
      {device}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDomain(domain?: string | null) {
  if (!domain) return "Unknown";
  return domain.replace(/^www\./, "");
}

interface EmbedStatisticsProps {
  stats: EmbedStat[];
}

/**
 * Collapsible "Embed statistics" panel listing per-domain embed performance.
 * Shared between the tour analytics tab and the agency client portal so both
 * behave identically.
 */
export function EmbedStatistics({ stats }: EmbedStatisticsProps) {
  const [isEmbedStatsExpanded, setIsEmbedStatsExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Embed statistics</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Detailed performance across websites and pages.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEmbedStatsExpanded(!isEmbedStatsExpanded)}
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
        >
          {isEmbedStatsExpanded ? (
            <>
              Collapse
              <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Expand
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {isEmbedStatsExpanded && (
        <div className="rounded-lg border border-slate-200 bg-white dark:border-input dark:bg-background">
          {stats.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              <Globe className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p className="text-sm">No embed data yet</p>
              <p className="text-xs">Share your tours to start seeing analytics.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block space-y-3 p-3 sm:hidden">
                {stats.map((stat) => (
                  <Card key={stat.id} className="rounded-lg border border-slate-200 p-3 shadow-none dark:border-input dark:bg-background">
                    <div className="flex items-start justify-between mb-2">
                      {renderDeviceCell(stat.user_agent)}
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Eye className="h-3 w-3" />
                        {stat.views_count.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{formatDomain(stat.domain)}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(stat.last_viewed_at)}
                      </div>
                      {stat.page_url && (
                        <a
                          href={stat.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs dark:text-slate-300 dark:hover:text-slate-100"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Page
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Device</TableHead>
                      <TableHead className="text-xs">Domain</TableHead>
                      <TableHead className="text-xs">Views</TableHead>
                      <TableHead className="text-xs">Last Viewed</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat) => (
                      <TableRow key={stat.id}>
                        <TableCell>{renderDeviceCell(stat.user_agent)}</TableCell>
                        <TableCell className="font-medium text-sm">{formatDomain(stat.domain)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="text-sm font-medium">{stat.views_count.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(stat.last_viewed_at)}
                        </TableCell>
                        <TableCell>
                          {stat.page_url && (
                            <a
                              href={stat.page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs dark:text-slate-300 dark:hover:text-slate-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
