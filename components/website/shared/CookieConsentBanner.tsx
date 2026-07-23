"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentState,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());
    setReady(true);

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentState>).detail;
      setConsent(detail || readCookieConsent());
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  if (!ready || consent || pathname?.startsWith("/embed")) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="mx-auto flex max-w-[50rem] flex-col gap-4 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-[0_18px_44px_rgba(2,6,23,0.45)] backdrop-blur-md sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-white">Cookies</p>
          <p className="text-sm leading-relaxed text-slate-300">
            We use essential cookies to run the Service, and optional analytics cookies to
            understand how the website is used.{" "}
            <Link
              href="/legal?section=cookies"
              className="text-white underline decoration-slate-500 underline-offset-2 transition-colors hover:decoration-white"
            >
              Read our Cookie Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white"
            onClick={() => setConsent(writeCookieConsent(false))}
          >
            Reject non-essential
          </Button>
          <Button
            type="button"
            className="bg-white text-slate-900 hover:bg-slate-200"
            onClick={() => setConsent(writeCookieConsent(true))}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
