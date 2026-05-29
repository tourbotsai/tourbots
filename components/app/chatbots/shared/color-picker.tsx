"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  showPresets?: boolean;
  supportTransparency?: boolean;
}

interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let raw = hex.replace(/^#/, "");
  if (raw.length === 3) raw = raw.split("").map((c) => c + c).join("");
  const num = parseInt(raw.slice(0, 6), 16);
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  if (diff !== 0) {
    switch (max) {
      case r: h = ((g - b) / diff + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / diff + 2) * 60; break;
      case b: h = ((r - g) / diff + 4) * 60; break;
    }
  }
  const s = max === 0 ? 0 : (diff / max) * 100;
  const v = max * 100;
  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const vNorm = v / 100;
  const i = Math.floor(hNorm * 6);
  const f = hNorm * 6 - i;
  const p = vNorm * (1 - sNorm);
  const q = vNorm * (1 - f * sNorm);
  const t = vNorm * (1 - (1 - f) * sNorm);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = vNorm; g = t; b = p; break;
    case 1: r = q; g = vNorm; b = p; break;
    case 2: r = p; g = vNorm; b = t; break;
    case 3: r = p; g = q; b = vNorm; break;
    case 4: r = t; g = p; b = vNorm; break;
    case 5: r = vNorm; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// Split any colour string into a solid #RRGGBB hex and an alpha (0-1).
function splitHexAlpha(input: string): { hex: string; alpha: number } {
  const fallback = { hex: "#000000", alpha: 1 };
  if (!input) return fallback;
  const value = input.trim();

  if (value.startsWith("#")) {
    let raw = value.slice(1);
    if (raw.length === 3 || raw.length === 4) raw = raw.split("").map((c) => c + c).join("");
    if (raw.length === 6 || raw.length === 8) {
      const alpha = raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1;
      return { hex: `#${raw.slice(0, 6).toUpperCase()}`, alpha };
    }
    return fallback;
  }

  const rgbaMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(",").map((p) => Number(p.trim()));
    if (parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      const alpha = parts.length >= 4 && Number.isFinite(parts[3]) ? clamp(parts[3], 0, 1) : 1;
      return { hex: rgbToHex(parts[0], parts[1], parts[2]), alpha };
    }
  }

  return fallback;
}

function buildOutput(rgb: { r: number; g: number; b: number }, alpha: number): string {
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  if (alpha >= 1) return hex;
  const alphaHex = clamp(Math.round(alpha * 255), 0, 255).toString(16).padStart(2, "0").toUpperCase();
  return `${hex}${alphaHex}`;
}

const CHECKERBOARD =
  "repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 10px 10px";

export function ColorPicker({
  value,
  onChange,
  label = "Colour",
  className,
  supportTransparency = true,
}: ColorPickerProps) {
  const [hsv, setHsv] = useState<HSV>(() => {
    const { hex } = splitHexAlpha(value);
    const rgb = hexToRgb(hex);
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  });
  const [alpha, setAlpha] = useState(() => splitHexAlpha(value).alpha);
  const [hexInput, setHexInput] = useState(value || "#000000");
  const draggingRef = useRef(false);

  useEffect(() => {
    if (draggingRef.current) return;
    const { hex, alpha: a } = splitHexAlpha(value);
    const rgb = hexToRgb(hex);
    setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
    setAlpha(a);
    setHexInput(value || "#000000");
  }, [value]);

  const emit = (nextHsv: HSV, nextAlpha: number) => {
    const rgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
    const output = buildOutput(rgb, supportTransparency ? nextAlpha : 1);
    setHexInput(output);
    onChange(output);
  };

  const updateHsv = (next: HSV) => {
    setHsv(next);
    emit(next, alpha);
  };

  const updateAlpha = (next: number) => {
    const a = clamp(next, 0, 1);
    setAlpha(a);
    emit(hsv, a);
  };

  const handleHexInputChange = (raw: string) => {
    setHexInput(raw);
    if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(raw)) {
      const { hex, alpha: a } = splitHexAlpha(raw);
      const rgb = hexToRgb(hex);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setAlpha(a);
      onChange(raw.toUpperCase());
    }
  };

  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
  const baseHue = hsvToRgb(hsv.h, 100, 100);
  const baseHueHex = rgbToHex(baseHue.r, baseHue.g, baseHue.b);
  const swatchColor = `rgba(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}, ${supportTransparency ? alpha : 1})`;

  const onSaturationMove = (clientX: number, clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    updateHsv({
      ...hsv,
      s: Math.round((x / rect.width) * 100),
      v: Math.round(100 - (y / rect.height) * 100),
    });
  };

  const onLinearMove = (clientX: number, el: HTMLElement, type: "hue" | "alpha") => {
    const rect = el.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    if (type === "hue") {
      updateHsv({ ...hsv, h: Math.round(ratio * 360) });
    } else {
      updateAlpha(ratio);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${label} picker`}
              className="relative h-10 w-10 shrink-0 rounded-md border border-input shadow-sm transition-transform hover:scale-105 overflow-hidden"
              style={{ background: CHECKERBOARD }}
            >
              <span className="absolute inset-0" style={{ backgroundColor: swatchColor }} />
            </button>
          </PopoverTrigger>

          <PopoverContent align="start" className="w-64 p-3 space-y-3">
            {/* Saturation / Value */}
            <div
              className="relative h-40 w-full rounded-md cursor-crosshair select-none touch-none shadow-inner"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${baseHueHex})`,
              }}
              onPointerDown={(e) => {
                draggingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                onSaturationMove(e.clientX, e.clientY, e.currentTarget);
              }}
              onPointerMove={(e) => {
                if (draggingRef.current && e.buttons === 1) {
                  onSaturationMove(e.clientX, e.clientY, e.currentTarget);
                }
              }}
              onPointerUp={(e) => {
                draggingRef.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            >
              <div
                className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white pointer-events-none"
                style={{
                  left: `${hsv.s}%`,
                  top: `${100 - hsv.v}%`,
                  backgroundColor: currentHex,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.3)",
                }}
              />
            </div>

            {/* Hue */}
            <div
              className="relative h-3 w-full rounded-full cursor-pointer select-none touch-none"
              style={{
                background:
                  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
              }}
              onPointerDown={(e) => {
                draggingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                onLinearMove(e.clientX, e.currentTarget, "hue");
              }}
              onPointerMove={(e) => {
                if (draggingRef.current && e.buttons === 1) {
                  onLinearMove(e.clientX, e.currentTarget, "hue");
                }
              }}
              onPointerUp={(e) => {
                draggingRef.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            >
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white pointer-events-none"
                style={{
                  left: `${(hsv.h / 360) * 100}%`,
                  backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.3)",
                }}
              />
            </div>

            {/* Transparency */}
            {supportTransparency && (
              <div
                className="relative h-3 w-full rounded-full cursor-pointer select-none touch-none overflow-hidden"
                style={{ background: CHECKERBOARD }}
                onPointerDown={(e) => {
                  draggingRef.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onLinearMove(e.clientX, e.currentTarget, "alpha");
                }}
                onPointerMove={(e) => {
                  if (draggingRef.current && e.buttons === 1) {
                    onLinearMove(e.clientX, e.currentTarget, "alpha");
                  }
                }}
                onPointerUp={(e) => {
                  draggingRef.current = false;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }}
              >
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, transparent, ${currentHex})`,
                  }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white pointer-events-none"
                  style={{
                    left: `${alpha * 100}%`,
                    backgroundColor: currentHex,
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            )}

            {/* Hex + alpha readout */}
            <div className="flex items-center gap-2 pt-1">
              <span
                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-input shadow-sm"
                style={{ background: CHECKERBOARD }}
                aria-hidden="true"
              >
                <span className="absolute inset-0" style={{ backgroundColor: swatchColor }} />
              </span>
              <Input
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value)}
                placeholder="#000000"
                className="h-9 flex-1 font-mono text-sm uppercase dark:border-input dark:bg-background dark:text-slate-100"
              />
              {supportTransparency && (
                <span className="w-12 text-right text-xs font-mono text-muted-foreground">
                  {Math.round(alpha * 100)}%
                </span>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInputChange(e.target.value)}
          placeholder="#000000"
          className="h-10 flex-1 font-mono text-sm uppercase dark:border-input dark:bg-background dark:text-slate-100"
        />
      </div>
    </div>
  );
}
