"use client";

import { type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlignLeft, AlignCenter, AlignRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Continuous left-rail surface — one panel, not a stack of cards. */
export function InspectorShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Quiet sticky enable / title strip at the top of the inspector. */
export function InspectorHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3.5 dark:border-neutral-800">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Collapsible inspector section — Framer/Webstudio style, no nested card chrome. */
export function InspectorSection({
  id,
  open,
  onOpenChange,
  icon,
  title,
  summary,
  badge,
  children,
  defaultOpen,
}: {
  id: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  icon?: ReactNode;
  title: string;
  summary?: string;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <div className="border-b border-slate-100 last:border-b-0 dark:border-neutral-800">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            id={`${id}-header`}
            aria-expanded={open}
            aria-controls={`${id}-panel`}
            className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-neutral-900/80"
          >
            {icon ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
                {icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {title}
                </span>
                {badge}
              </span>
              {summary ? (
                <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {summary}
                </span>
              ) : null}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-header`}
            className="space-y-3 px-4 pb-3.5 pt-1"
          >
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/** Uppercase group / intersection label used across the menu builder. */
export const inspectorGroupLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400";

/** Small uppercase group label inside a section. */
export function InspectorGroup({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className={inspectorGroupLabelClass}>{label}</p>
        {hint ? (
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{hint}</p>
        ) : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/** Label left, control right — primary property-row pattern. */
export function PropertyRow({
  label,
  description,
  children,
  htmlFor,
  className,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-0.5", className)}>
      <div className="min-w-0 flex-1">
        <Label
          htmlFor={htmlFor}
          className="text-[12px] font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </Label>
        {description ? (
          <p className="mt-0.5 text-[10px] leading-snug text-slate-400 dark:text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Label above control — for wider fields (selects, textareas). */
export function PropertyStack({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[12px] font-medium text-slate-700 dark:text-slate-200">
          {label}
        </Label>
        {hint ? (
          <span className="text-[10px] font-medium text-slate-400">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
  columns,
  className,
}: {
  options: { value: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-0.5 rounded-lg bg-slate-100/90 p-0.5 dark:bg-neutral-900",
        columns === 3 ? "grid-cols-3" : columns === 4 ? "grid-cols-4" : "grid-cols-2",
        !columns && options.length <= 2 && "grid-cols-2",
        !columns && options.length === 3 && "grid-cols-3",
        !columns && options.length >= 4 && "grid-cols-4",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all",
            value === option.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ChoiceCardGrid({
  options,
  value,
  onChange,
}: {
  options: {
    value: string;
    label: string;
    hint: string;
    diagram: ReactNode;
  }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all",
              selected
                ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 dark:border-slate-100 dark:bg-neutral-900 dark:ring-slate-100"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 dark:border-neutral-800 dark:hover:bg-neutral-900/70"
            )}
          >
            <span className="shrink-0">{option.diagram}</span>
            <span className="min-w-0">
              <span className="block text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                {option.label}
              </span>
              <span className="block text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                {option.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Soft inset well for related sub-controls (e.g. reopen button, close button). */
export function InspectorWell({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/60",
        className
      )}
    >
      {title ? <p className={inspectorGroupLabelClass}>{title}</p> : null}
      {children}
    </div>
  );
}

export function SliderField({
  label,
  value,
  unit = "px",
  min,
  max,
  step,
  onChange,
  hint,
  formatValue,
}: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  hint?: string;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[12px] font-medium text-slate-700 dark:text-slate-200">
          {label}
          {hint ? (
            <span className="ml-1.5 text-[10px] font-normal text-slate-400">{hint}</span>
          ) : null}
        </Label>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
          {formatValue ? formatValue(value) : `${value}${unit}`}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

export function MoreOptions({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        {open ? "Hide advanced" : "More options"}
      </button>
      {open ? <div className="mt-2.5 space-y-3">{children}</div> : null}
    </div>
  );
}

export function AlignmentToggle({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange: (alignment: "left" | "center" | "right") => void;
  className?: string;
}) {
  const current = value || "center";
  const options = [
    { value: "left" as const, icon: AlignLeft },
    { value: "center" as const, icon: AlignCenter },
    { value: "right" as const, icon: AlignRight },
  ];

  return (
    <div
      className={cn(
        "inline-flex rounded-lg bg-slate-100/90 p-0.5 dark:bg-neutral-900",
        className
      )}
    >
      {options.map(({ value: option, icon: Icon }) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors",
            current === option
              ? "bg-white text-slate-900 shadow-sm dark:bg-neutral-800 dark:text-white"
              : "hover:text-slate-800 dark:hover:text-slate-200"
          )}
          aria-label={`Align ${option}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

/** @deprecated Prefer PropertyRow — kept for existing block editors. */
export function CompactRow({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PropertyRow label={label} description={hint} className={className}>
      {children}
    </PropertyRow>
  );
}

export function CompactSlider({
  label,
  value,
  unit = "px",
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}) {
  return (
    <SliderField
      label={label}
      value={value}
      unit={unit}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      formatValue={formatValue}
    />
  );
}

export const denseFieldClass =
  "h-8 rounded-lg border-slate-200 bg-white text-xs shadow-none focus-visible:ring-slate-300 dark:border-neutral-700 dark:bg-neutral-900";
export const denseLabelClass =
  "text-[12px] font-medium text-slate-700 dark:text-slate-200";
