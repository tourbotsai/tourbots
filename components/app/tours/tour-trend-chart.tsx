"use client";

import { useMemo, useState } from "react";
import { useTheme } from "@/components/app/shared/theme-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export interface TourTrendPoint {
  date: string;
  tourViews: number;
  tourMoves: number;
  chatMessages: number;
  conversations: number;
}

interface TourTrendChartProps {
  /** Full daily series (most recent last). The selector slices the last N days. */
  data: TourTrendPoint[];
}

const TIMEFRAMES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

/**
 * Tour activity trend chart for the agency client portal. Mirrors the dashboard
 * "Views, moves, and messages trend" area chart, with a timeframe selector and
 * an extra conversations series.
 */
export function TourTrendChart({ data }: TourTrendChartProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [timeframe, setTimeframe] = useState("7");

  const chartGridStroke = isDarkMode ? "#334155" : "#E2E8F0";
  const chartTickColour = isDarkMode ? "#94A3B8" : "#64748B";
  const chartTooltipStyle = isDarkMode
    ? { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#E2E8F0" }
    : { backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" };
  // Monochrome slate shades to match the app's mono UI — four distinct tiers per mode.
  const viewsStroke = isDarkMode ? "#F1F5F9" : "#0F172A";
  const movesStroke = isDarkMode ? "#CBD5E1" : "#334155";
  const messagesStroke = isDarkMode ? "#94A3B8" : "#64748B";
  const conversationsStroke = isDarkMode ? "#64748B" : "#94A3B8";

  const slicedData = useMemo(() => {
    const days = Number(timeframe) || 7;
    return data.slice(-days);
  }, [data, timeframe]);

  const hasData = slicedData.some(
    (point) => point.tourViews || point.tourMoves || point.chatMessages || point.conversations
  );

  return (
    <div className="w-full space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Views, moves, and messages trend
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tour activity over the selected period.</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="h-9 w-[150px] dark:border-input dark:bg-background dark:text-slate-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:border-input dark:bg-background dark:text-slate-100">
            {TIMEFRAMES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={slicedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
            <XAxis dataKey="date" tick={{ fill: chartTickColour, fontSize: 12 }} />
            <YAxis tick={{ fill: chartTickColour, fontSize: 12 }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="tourViews" stroke={viewsStroke} fill={viewsStroke} fillOpacity={0.2} name="Tour views" />
            <Area type="monotone" dataKey="tourMoves" stroke={movesStroke} fill={movesStroke} fillOpacity={0.2} name="Tour moves" />
            <Area type="monotone" dataKey="chatMessages" stroke={messagesStroke} fill={messagesStroke} fillOpacity={0.2} name="Messages" />
            <Area type="monotone" dataKey="conversations" stroke={conversationsStroke} fill={conversationsStroke} fillOpacity={0.2} name="Conversations" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-sm text-slate-500 dark:border-input dark:bg-background dark:text-slate-400">
          No trend data available yet.
        </div>
      )}
    </div>
  );
}
