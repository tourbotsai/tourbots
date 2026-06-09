'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Check, Code, Copy, ExternalLink, Navigation } from 'lucide-react';
import { generateTourChatbotEmbed } from '@/lib/embed-generator';

interface PortalChatbotShareProps {
  venueId?: string | null;
  tourId?: string | null;
  // Full base URL (e.g. https://tours.youragency.com) when a verified white-label
  // domain is active; otherwise undefined so the embed falls back to tourbots.ai.
  baseUrlOverride?: string;
}

/**
 * Self-contained chatbot embed/share UI for the agency client portal. Mirrors the
 * main-app `chatbot-share.tsx` (`TourChatbotShare`), but does not depend on the app
 * session (`useUser`/`useBilling`) or a toast provider (none is mounted in the embed
 * layout). Embed codes are generated purely client-side via `generateTourChatbotEmbed`,
 * which only builds strings — the HMAC embed token is minted by the chatbot embed page
 * at load, so no secret is needed here.
 */
export function PortalChatbotShare({ venueId, tourId, baseUrlOverride }: PortalChatbotShareProps) {
  const [navigationEnabled, setNavigationEnabled] = useState(true);
  const [copied, setCopied] = useState<'simple' | 'advanced' | null>(null);

  const embedCode = useMemo(() => {
    if (!venueId) return null;
    return generateTourChatbotEmbed(
      venueId,
      undefined,
      { navigationEnabled, baseUrlOverride },
      tourId || undefined
    );
  }, [venueId, tourId, baseUrlOverride, navigationEnabled]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyToClipboard = async (text: string, which: 'simple' | 'advanced') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      // Clipboard can be blocked in some embed contexts; fail silently.
    }
  };

  if (!venueId) {
    return (
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-slate-600">No chatbot is available to share yet.</p>
        </CardContent>
      </Card>
    );
  }

  const previewBase = baseUrlOverride ? baseUrlOverride.replace(/\/+$/, '') : '';
  const navParam = navigationEnabled ? 'on' : 'off';
  const previewUrl = embedCode
    ? `${previewBase}/embed/chatbot/${venueId}?id=${embedCode.embedId}${tourId ? `&tourId=${tourId}` : ''}&nav=${navParam}`
    : '#';

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <p className="text-sm text-slate-600">
            Add your chatbot widget to any page with one line of code, or use advanced embed options for extra control.
          </p>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <div>
              <Label htmlFor="portal-chatbot-nav" className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <Navigation className="h-4 w-4" />
                Enable tour navigation
              </Label>
              <p className="mt-0.5 text-xs text-slate-500">
                Let the assistant move the virtual tour for visitors. Turn off for a question-and-answer assistant only.
              </p>
            </div>
            <Switch
              id="portal-chatbot-nav"
              checked={navigationEnabled}
              onCheckedChange={setNavigationEnabled}
            />
          </div>

          {embedCode && (
            <>
              <div className="h-px bg-slate-200" />

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Code className="h-4 w-4" />
                  Simple Embed (Recommended)
                </h3>
                <p className="text-xs text-slate-500">
                  A self-contained chatbot you can drop onto any web page.
                </p>
                <Textarea
                  value={embedCode.simple}
                  readOnly
                  rows={3}
                  className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyToClipboard(embedCode.simple, 'simple')}
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    {copied === 'simple' ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied === 'simple' ? 'Copied' : 'Copy Code'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview Chatbot
                    </a>
                  </Button>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Code className="h-4 w-4" />
                  Advanced Embed
                </h3>
                <p className="text-xs text-slate-500">
                  A floating chat bubble that can drive the virtual tour. Use this when the chatbot sits on the same page as your tour.
                </p>
                <Textarea
                  value={embedCode.advanced}
                  readOnly
                  rows={7}
                  className="resize-none border-slate-300 bg-slate-50 font-mono text-xs text-slate-700"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyToClipboard(embedCode.advanced, 'advanced')}
                    className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    {copied === 'advanced' ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied === 'advanced' ? 'Copied' : 'Copy Code'}
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
