export const COOKIE_CONSENT_STORAGE_KEY = "tb_cookie_consent";
export const COOKIE_CONSENT_EVENT = "tb-cookie-consent-changed";

export type CookieConsentState = {
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (typeof parsed.analytics !== "boolean") return null;
    return {
      necessary: true,
      analytics: parsed.analytics,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(analytics: boolean): CookieConsentState {
  const state: CookieConsentState = {
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: state }));
  return state;
}

export function hasAnalyticsConsent(state: CookieConsentState | null): boolean {
  return Boolean(state?.analytics);
}
