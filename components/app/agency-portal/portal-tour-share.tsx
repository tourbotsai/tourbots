'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Check, Code, Copy, ExternalLink } from 'lucide-react';
import { generateTourEmbed, TourEmbedOptions } from '@/lib/embed-generator';

interface PortalTourShareProps {
  venueId?: string | null;
  tourId?: string | null;
  // Full base URL (e.g. https://tours.youragency.com) when a verified white-label
  // domain is active; otherwise undefined so the embed falls back to tourbots.ai.
  baseUrlOverride?: string;
}

/**
 * Self-contained tour embed/share UI for the agency client portal. Mirrors the
 * main-app `tour-share.tsx`, but does not depend on the app session
 * (`useUser`/`useAuthHeaders`) or a toast provider (none is mounted in the embed
 * layout). Embed codes are generated purely client-side via `generateTourEmbed`,
 * which only builds strings — the HMAC embed token is minted by the embed page at
 * load, so no secret is needed here.
 */
export function PortalTourShare({ venueId, tourId, baseUrlOverride }: PortalTourShareProps) {
  const [options, setOptions] = useState<TourEmbedOptions>({
    width: '100%',
    height: '600px',
    showTitle: false,
    showChat: true,
  });
  const [copied, setCopied] = useState<'iframe' | 'script' | null>(null);

  const embedCodes = useMemo(() => {
    if (!venueId || !tourId) return null;
    return generateTourEmbed(venueId, {
      ...options,
      tourId,
      baseUrlOverride,
    });
  }, [venueId, tourId, baseUrlOverride, options]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyToClipboard = async (text: string, which: 'iframe' | 'script') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      // Clipboard can be blocked in some embed contexts; fail silently.
    }
  };

  if (!venueId || !tourId) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-slate-600">No tour is available to share yet.</p>
        </CardContent>
      </Card>
    );
  }

  const previewBase = baseUrlOverride ? baseUrlOverride.replace(/\/+$/, '') : '';
  const previewUrl = embedCodes
    ? `${previewBase}/embed/tour/${venueId}?id=${embedCodes.embedId}&tourId=${tourId}&showTitle=${options.showTitle}&showChat=${options.showChat}`
    : '#';

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-900">Share and Embed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-slate-600">
            Generate production-ready embed code and configure how the widget appears on your website.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="portal-share-width" className="text-sm font-medium text-slate-700">
                Width
              </Label>
              <Input
                id="portal-share-width"
                value={options.width}
                onChange={(e) => setOptions({ ...options, width: e.target.value })}
                placeholder="100%"
                className="mt-1.5 h-10 border-slate-300 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="portal-share-height" className="text-sm font-medium text-slate-700">
                Height
              </Label>
              <Input
                id="portal-share-height"
                value={options.height}
                onChange={(e) => setOptions({ ...options, height: e.target.value })}
                placeholder="600px"
                className="mt-1.5 h-10 border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <div>
              <Label htmlFor="portal-share-show-chat" className="text-sm font-medium text-slate-800">
                Show chat widget
              </Label>
              <p className="mt-0.5 text-xs text-slate-500">
                Turn the AI chat icon on or off in the embed.
              </p>
            </div>
            <Switch
              id="portal-share-show-chat"
              checked={options.showChat}
              onCheckedChange={(checked) => setOptions({ ...options, showChat: checked })}
            />
          </div>

          {embedCodes && (
            <>
              <div className="h-px bg-slate-200" />

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Code className="h-4 w-4" />
                  Simple IFrame Embed
                </h3>
                <Textarea
                  value={embedCodes.iframe}
                  readOnly
                  rows={5}
                  className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyToClipboard(embedCodes.iframe, 'iframe')}
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    {copied === 'iframe' ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied === 'iframe' ? 'Copied' : 'Copy Code'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview Tour
                    </a>
                  </Button>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Code className="h-4 w-4" />
                  Advanced Script Embed
                </h3>
                <Textarea
                  value={embedCodes.script}
                  readOnly
                  rows={7}
                  className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyToClipboard(embedCodes.script, 'script')}
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    {copied === 'script' ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied === 'script' ? 'Copied' : 'Copy Script'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
