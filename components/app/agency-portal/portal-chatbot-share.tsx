'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Check, Code, Copy, ExternalLink, Navigation } from 'lucide-react';
import { generateTourChatbotEmbed, generateWebsiteChatbotEmbed } from '@/lib/embed-generator';

interface PortalChatbotShareProps {
  venueId?: string | null;
  tourId?: string | null;
  chatbotConfigId?: string | null;
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
export function PortalChatbotShare({
  venueId,
  tourId,
  chatbotConfigId,
  baseUrlOverride,
}: PortalChatbotShareProps) {
  const isWebsiteMode = Boolean(chatbotConfigId);
  const [navigationEnabled, setNavigationEnabled] = useState(!isWebsiteMode);
  const [copied, setCopied] = useState<'simple' | 'advanced' | null>(null);

  useEffect(() => {
    if (isWebsiteMode) setNavigationEnabled(false);
  }, [isWebsiteMode]);

  const embedCode = useMemo(() => {
    if (!venueId) return null;
    if (isWebsiteMode && chatbotConfigId) {
      return generateWebsiteChatbotEmbed(venueId, chatbotConfigId, undefined, {
        baseUrlOverride,
      });
    }
    return generateTourChatbotEmbed(
      venueId,
      undefined,
      { navigationEnabled, baseUrlOverride },
      tourId || undefined
    );
  }, [venueId, tourId, chatbotConfigId, isWebsiteMode, baseUrlOverride, navigationEnabled]);

  const handleCopy = async (kind: 'simple' | 'advanced') => {
    if (!embedCode) return;
    const text = kind === 'simple' ? embedCode.simple : embedCode.advanced;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard may be blocked in some iframe contexts; leave UI unchanged.
    }
  };

  if (!venueId || (!tourId && !chatbotConfigId)) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chatbot share is unavailable for this portal.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!isWebsiteMode ? (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="portal-nav-toggle" className="text-sm font-medium">
              Enable tour navigation
            </Label>
          </div>
          <Switch
            id="portal-nav-toggle"
            checked={navigationEnabled}
            onCheckedChange={setNavigationEnabled}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Website chatbot embeds do not include tour navigation.
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <p className="text-sm font-medium">Simple iframe</p>
            </div>
            <div className="flex gap-2">
              {embedCode?.previewUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={embedCode.previewUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </a>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => handleCopy('simple')}>
                {copied === 'simple' ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                Copy
              </Button>
            </div>
          </div>
          <Textarea readOnly value={embedCode?.simple || ''} rows={4} className="font-mono text-xs" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <p className="text-sm font-medium">Advanced script</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleCopy('advanced')}>
              {copied === 'advanced' ? (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          <Textarea readOnly value={embedCode?.advanced || ''} rows={6} className="font-mono text-xs" />
        </CardContent>
      </Card>
    </div>
  );
}
