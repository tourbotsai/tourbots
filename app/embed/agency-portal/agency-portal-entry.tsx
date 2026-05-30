'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { AgencyPortalShell } from '../agency/[shareSlug]/agency-portal-shell';

interface EnabledModules {
  tour?: boolean;
  settings?: boolean;
  customisation?: boolean;
  analytics?: boolean;
  settings_blocks?: {
    config?: boolean;
    information?: boolean;
    documents?: boolean;
    triggers?: boolean;
  };
}

interface ResolvedShare {
  shareSlug: string;
  tourId: string | null;
  tourTitle: string;
  enabledModules: EnabledModules;
}

interface AgencyPortalEntryProps {
  agencyId: string;
  agencyName: string;
  agencyLogoUrl: string | null;
  primaryColour: string;
  secondaryColour: string;
  showHeader: boolean;
}

export function AgencyPortalEntry({
  agencyId,
  agencyName,
  agencyLogoUrl,
  primaryColour,
  secondaryColour,
  showHeader,
}: AgencyPortalEntryProps) {
  const [status, setStatus] = useState<'loading' | 'login' | 'authed'>('loading');
  const [share, setShare] = useState<ResolvedShare | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/public/agency-portal/auth/session', {
          credentials: 'include',
        });
        const data = await res.json();
        if (!active) return;
        if (data?.authenticated && data.share) {
          setShare({
            shareSlug: data.share.shareSlug,
            tourId: data.share.tourId ?? null,
            tourTitle: data.share.tourTitle || 'Tour',
            enabledModules: data.share.enabledModules || {},
          });
          setStatus('authed');
        } else {
          setStatus('login');
        }
      } catch {
        if (active) setStatus('login');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/public/agency-portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agencyId, email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.authenticated || !data.share) {
        setError(data?.error || 'Invalid credentials.');
        return;
      }
      setShare({
        shareSlug: data.share.shareSlug,
        tourId: data.share.tourId ?? null,
        tourTitle: data.share.tourTitle || 'Tour',
        enabledModules: data.share.enabledModules || {},
      });
      setStatus('authed');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (status === 'authed' && share) {
    const modules = share.enabledModules || {};
    return (
      <AgencyPortalShell
        shareSlug={share.shareSlug}
        tourId={share.tourId}
        shareActive
        agencyName={agencyName}
        agencyLogoUrl={agencyLogoUrl}
        tourTitle={share.tourTitle}
        showHeader={showHeader}
        primaryColour={primaryColour}
        secondaryColour={secondaryColour}
        modules={{
          tour: modules.tour !== false,
          settings: modules.settings !== false,
          customisation: modules.customisation !== false,
          analytics: modules.analytics !== false,
        }}
        venueId={agencyId}
        settingsBlocks={{
          config: modules.settings_blocks?.config !== false,
          information: modules.settings_blocks?.information !== false,
          documents: modules.settings_blocks?.documents !== false,
          triggers: modules.settings_blocks?.triggers !== false,
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <style jsx global>{`
        html, body, #__next {
          height: auto !important;
        }
      `}</style>
      <div className="mx-auto w-full max-w-md space-y-6">
        {showHeader && (
          <Card className="overflow-hidden border-slate-200">
            <div
              className="px-6 py-5 text-white"
              style={{
                background: `linear-gradient(120deg, ${primaryColour} 0%, ${secondaryColour} 100%)`,
              }}
            >
              <div className="flex items-center gap-3">
                {agencyLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agencyLogoUrl}
                    alt={`${agencyName} logo`}
                    className="h-10 w-10 rounded bg-white/90 object-contain p-1 ring-1 ring-white/40"
                  />
                ) : null}
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-100/90">Agency client portal</p>
                  <h1 className="text-2xl font-semibold">{agencyName}</h1>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="border-slate-200">
          <CardContent className="space-y-5 p-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-1 text-sm font-medium text-slate-900">Client sign-in</p>
              <p className="mb-3 text-xs text-slate-500">Sign in with the credentials your agency provided.</p>

              {status === 'loading' ? (
                <p className="text-sm text-slate-600">Checking session...</p>
              ) : (
                <form className="space-y-3" onSubmit={handleLogin}>
                  <div className="space-y-1">
                    <Label htmlFor="agency-portal-email">Client email</Label>
                    <Input
                      id="agency-portal-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agency-portal-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="agency-portal-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
