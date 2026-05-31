"use client";

import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { PlatformTrendPoint } from "@/lib/types";

interface PlatformTrendChartProps {
  data: PlatformTrendPoint[];
  isLoading?: boolean;
}

// Light-mode chart styling, mirroring the user dashboard "Views, moves, and
// messages trend" area chart — but aggregated across the whole platform.
const chartGridStroke = "#E2E8F0";
const chartTickColour = "#64748B";
const chartTooltipStyle = { backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A" };
const viewsStroke = "#0F172A"; // Tour views – strongest
const movesStroke = "#475569"; // Tour moves – mid
const messagesStroke = "#94A3B8"; // Chat messages – lightest

export function PlatformTrendChart({ data, isLoading = false }: PlatformTrendChartProps) {
  const hasData = data.some((point) => point.tourViews || point.tourMoves || point.chatMessages);

  return (
    <div className="w-full space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Views, moves, and messages trend</h3>
        <p className="text-xs text-slate-500">Last 7 days of platform-wide tour activity.</p>
      </div>

      {isLoading ? (
        <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />
      ) : hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
            <XAxis dataKey="date" tick={{ fill: chartTickColour, fontSize: 12 }} />
            <YAxis tick={{ fill: chartTickColour, fontSize: 12 }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="tourViews" stroke={viewsStroke} fill={viewsStroke} fillOpacity={0.2} name="Tour views" />
            <Area type="monotone" dataKey="tourMoves" stroke={movesStroke} fill={movesStroke} fillOpacity={0.2} name="Tour moves" />
            <Area type="monotone" dataKey="chatMessages" stroke={messagesStroke} fill={messagesStroke} fillOpacity={0.2} name="Chat messages" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 text-sm text-slate-500">
          No trend data available yet.
        </div>
      )}
    </div>
  );
}
