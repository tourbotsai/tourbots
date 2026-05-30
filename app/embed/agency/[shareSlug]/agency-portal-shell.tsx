'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Camera, Eye, EyeOff, FileJson, LineChart, Settings } from 'lucide-react';
import { CustomisationForm } from '@/components/app/chatbots/shared/customisation-form';
import { ChatbotCustomisation, ChatbotTrigger, Conversation, EmbedStat } from '@/lib/types';
import { getAdvancedDefaultCustomisation } from '@/lib/chatbot-customisation-service';
import { TourChatbotSettings } from '@/components/app/chatbots/tour/chatbot-settings';
import { TourViewer } from '@/components/app/tours/tour-viewer';
import { TourMenuBuilder } from '@/components/app/tours/menu/tour-menu-builder';
import { TourTrendChart, TourTrendPoint } from '@/components/app/tours/tour-trend-chart';
import { EmbedStatistics } from '@/components/app/chatbots/shared/embed-statistics';
import { ConversationSessions } from '@/components/app/chatbots/shared/conversation-sessions';
import { useUser } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

type ModuleName = 'tour' | 'settings' | 'customisation' | 'analytics';

interface AgencyPortalShellProps {
  shareSlug: string;
  tourId?: string | null;
  shareActive: boolean;
  agencyName: string;
  agencyLogoUrl?: string | null;
  tourTitle: string;
  showHeader: boolean;
  primaryColour: string;
  secondaryColour: string;
  backgroundColour?: string | null;
  modules: Partial<Record<ModuleName, boolean>>;
  venueId?: string | null;
  venueName?: string | null;
  tourBlocks?: {
    setup?: boolean;
    menu?: boolean;
  };
  settingsBlocks?: {
    config?: boolean;
    information?: boolean;
    documents?: boolean;
    triggers?: boolean;
  };
  previewOnly?: boolean;
  // When the shell is launched from the universal portal entry, the client has
  // already authenticated, so we seed the session to avoid flashing a second
  // login form while the background session check confirms and fetches CSRF.
  initialSession?: SessionState | null;
  previewSettings?: PortalSettings | null;
  previewInformationSections?: InformationSection[];
  previewTriggers?: ChatbotTrigger[];
  previewCustomisation?: ChatbotCustomisation | null;
  previewAnalyticsStats?: PortalAnalyticsStats | null;
  previewAnalyticsTrend?: TourTrendPoint[];
  previewAnalyticsEmbedStats?: EmbedStat[];
  previewAnalyticsConversations?: Conversation[];
}

interface SessionState {
  authenticated: boolean;
  csrfToken?: string | null;
  user?: {
    email: string;
    displayName?: string | null;
  };
}

interface PortalSettings {
  id: string;
  chatbot_name: string;
  welcome_message: string | null;
  personality_prompt: string | null;
  instruction_prompt: string | null;
  guardrail_prompt: string | null;
  guardrails_enabled: boolean;
  is_active: boolean;
}

interface PortalAnalyticsStats {
  totalMessages: number;
  totalConversations: number;
  totalSessions: number;
  tourViews: number;
  tourMoves: number;
}

interface InformationField {
  id?: string;
  field_key: string;
  field_label: string;
  field_value: string | null;
  field_type: 'text' | 'textarea' | 'url' | 'phone' | 'email';
  display_order: number;
  is_required: boolean;
}

interface InformationSection {
  id?: string;
  section_key: string;
  section_title: string;
  display_order: number;
  is_active: boolean;
  fields: InformationField[];
}

export function AgencyPortalShell({
  shareSlug,
  tourId,
  shareActive,
  agencyName,
  agencyLogoUrl,
  tourTitle,
  showHeader,
  primaryColour,
  secondaryColour,
  backgroundColour,
  modules,
  venueId,
  venueName,
  tourBlocks,
  settingsBlocks,
  previewOnly = false,
  initialSession = null,
  previewSettings = null,
  previewInformationSections = [],
  previewTriggers = [],
  previewCustomisation = null,
  previewAnalyticsStats = null,
  previewAnalyticsTrend = [],
  previewAnalyticsEmbedStats = [],
  previewAnalyticsConversations = [],
}: AgencyPortalShellProps) {
  const { user: appUser } = useUser();
  const [session, setSession] = useState<SessionState>(initialSession ?? { authenticated: false });
  const [loadingSession, setLoadingSession] = useState(!previewOnly && !initialSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleName>('tour');
  const [selectedTourTab, setSelectedTourTab] = useState<'setup' | 'menu'>('setup');

  // The advanced (script) embed disables the iframe's internal scroll and
  // auto-resizes it to fit content. That leaves the sticky-preview tabs
  // (customisation + tour menu) with no scrolling ancestor, so we give them
  // their own fixed-height scroll region. The simple iframe embed scrolls as a
  // whole and supports sticky natively, so it omits the autoHeight flag and we
  // leave those tabs flowing normally.
  const autoHeightEmbed = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autoHeight') === '1';
  }, []);
  const stickyScrollClass = autoHeightEmbed ? 'lg:h-[900px] lg:overflow-y-auto' : '';

  const [settingsData, setSettingsData] = useState<PortalSettings | null>(previewSettings);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [customisationData, setCustomisationData] = useState<ChatbotCustomisation | null>(previewCustomisation);
  const [customisationLoading, setCustomisationLoading] = useState(false);
  const [customisationSaving, setCustomisationSaving] = useState(false);

  const [analyticsStats, setAnalyticsStats] = useState<PortalAnalyticsStats | null>(previewAnalyticsStats);
  const [analyticsTrend, setAnalyticsTrend] = useState<TourTrendPoint[]>(previewAnalyticsTrend);
  const [analyticsEmbedStats, setAnalyticsEmbedStats] = useState<EmbedStat[]>(previewAnalyticsEmbedStats);
  const [analyticsConversations, setAnalyticsConversations] = useState<Conversation[]>(previewAnalyticsConversations);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [informationLoading, setInformationLoading] = useState(false);
  const [informationSections, setInformationSections] = useState<InformationSection[]>(previewInformationSections);
  const [informationDraftSections, setInformationDraftSections] = useState<InformationSection[]>([]);
  const [informationSaving, setInformationSaving] = useState(false);
  const [informationExpanded, setInformationExpanded] = useState(true);
  const [expandedInformationSections, setExpandedInformationSections] = useState<Record<string, boolean>>({});
  const moduleList = useMemo(() => (Object.keys(modules) as ModuleName[]), [modules]);
  const visibleModules = useMemo(() => {
    const meta: { value: ModuleName; label: string; icon: typeof Camera }[] = [
      { value: 'tour', label: 'Tour', icon: Camera },
      { value: 'settings', label: 'Settings', icon: Settings },
      { value: 'customisation', label: 'Customisation', icon: FileJson },
      { value: 'analytics', label: 'Analytics', icon: LineChart },
    ];
    return meta.filter((item) => Boolean(modules[item.value]));
  }, [modules]);
  const resolvedTourId = tourId || null;
  const resolvedTourBlocks = {
    setup: tourBlocks?.setup !== false,
    menu: tourBlocks?.menu !== false,
  };
  const resolvedSettingsBlocks = {
    config: settingsBlocks?.config !== false,
    information: settingsBlocks?.information !== false,
    documents: settingsBlocks?.documents !== false,
    triggers: settingsBlocks?.triggers !== false,
  };
  const informationReadOnly = previewOnly;

  // Keep the active tour sub-tab pointing at an enabled block. If the agency
  // hides one of them, fall back to the other so the user never lands on a tab
  // that renders nothing.
  useEffect(() => {
    if (selectedTourTab === 'setup' && !resolvedTourBlocks.setup && resolvedTourBlocks.menu) {
      setSelectedTourTab('menu');
    } else if (selectedTourTab === 'menu' && !resolvedTourBlocks.menu && resolvedTourBlocks.setup) {
      setSelectedTourTab('setup');
    }
  }, [resolvedTourBlocks.setup, resolvedTourBlocks.menu, selectedTourTab]);

  function toKey(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function inferFieldType(label: string): InformationField['field_type'] {
    const normalised = label.toLowerCase();
    if (normalised.includes('email')) return 'email';
    if (normalised.includes('phone')) return 'phone';
    if (normalised.includes('website') || normalised.includes('url')) return 'url';
    if (normalised.includes('address') || normalised.includes('description') || normalised.includes('notes')) return 'textarea';
    return 'text';
  }

  function getPortalHeaders(base: HeadersInit = {}): HeadersInit {
    return { ...(base as Record<string, string>) };
  }

  async function fetchSession(background = false) {
    if (!background) setLoadingSession(true);
    try {
      const res = await fetch(`/api/public/agency-portal/auth/session?shareSlug=${encodeURIComponent(shareSlug)}`, {
        credentials: 'include',
        headers: getPortalHeaders(),
      });
      const data = await res.json();
      setSession(data?.authenticated ? data : { authenticated: false });
    } catch {
      // On a background refresh keep the optimistic seeded session rather than
      // dropping the user back to the login form on a transient network error.
      if (!background) setSession({ authenticated: false });
    } finally {
      if (!background) setLoadingSession(false);
    }
  }

  useEffect(() => {
    if (previewOnly) {
      setLoadingSession(false);
      return;
    }
    // If we were seeded with a session, confirm it in the background (and pull
    // the CSRF token) without flashing the loading/login state.
    fetchSession(Boolean(initialSession));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareSlug, previewOnly]);

  useEffect(() => {
    if (modules[selectedModule]) return;
    const fallbackModule = (['tour', 'settings', 'customisation', 'analytics'] as ModuleName[]).find(
      (moduleName) => modules[moduleName]
    );
    if (fallbackModule) {
      setSelectedModule(fallbackModule);
    }
  }, [modules, selectedModule]);

  useEffect(() => {
    if (previewOnly) return;
    if (!session.authenticated) return;
    if (!modules[selectedModule]) return;

    if (selectedModule === 'settings') {
      void loadSettings();
    } else if (selectedModule === 'customisation') {
      void loadCustomisation();
    } else if (selectedModule === 'analytics') {
      void loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModule, session.authenticated, previewOnly]);

  useEffect(() => {
    setInformationDraftSections(
      informationSections.map((section, sectionIndex) => ({
        ...section,
        section_key: section.section_key || toKey(section.section_title || `section_${sectionIndex + 1}`),
        section_title: section.section_title || `Section ${sectionIndex + 1}`,
        display_order: Number.isFinite(section.display_order) ? section.display_order : sectionIndex,
        fields: (section.fields || []).map((field, fieldIndex) => ({
          ...field,
          field_key: field.field_key || toKey(field.field_label || `field_${fieldIndex + 1}`),
          field_label: field.field_label || `Field ${fieldIndex + 1}`,
          field_type: field.field_type || inferFieldType(field.field_label || ''),
          field_value: field.field_value ?? '',
          display_order: Number.isFinite(field.display_order) ? field.display_order : fieldIndex,
          is_required: field.is_required === true,
        })),
      }))
    );
  }, [informationSections]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/public/agency-portal/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: getPortalHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ shareSlug, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Login failed.');
        return;
      }
      setPassword('');
      setMessage('Signed in successfully.');
      await fetchSession();
    } catch {
      setMessage('Unable to sign in right now.');
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    setMessage(null);
    try {
      await fetch('/api/public/agency-portal/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: getPortalHeaders(),
      });
      setSession({ authenticated: false });
      setMessage('Signed out.');
    } catch {
      setMessage('Unable to sign out right now.');
    } finally {
      setPending(false);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/public/agency-portal/settings?shareSlug=${encodeURIComponent(shareSlug)}`, {
        method: 'GET',
        credentials: 'include',
        headers: getPortalHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Unable to load settings.');
        return;
      }
      setSettingsData(data?.settings || null);
    } catch {
      setMessage('Unable to load settings right now.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function saveSettings() {
    if (!settingsData) return;
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/public/agency-portal/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: getPortalHeaders({
          'Content-Type': 'application/json',
          'x-csrf-token': session.csrfToken || '',
        }),
        body: JSON.stringify({
          shareSlug,
          updates: {
            chatbot_name: settingsData.chatbot_name,
            welcome_message: settingsData.welcome_message,
            personality_prompt: settingsData.personality_prompt,
            instruction_prompt: settingsData.instruction_prompt,
            guardrail_prompt: settingsData.guardrail_prompt,
            guardrails_enabled: settingsData.guardrails_enabled,
            is_active: settingsData.is_active,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Failed to save settings.');
        return;
      }
      setSettingsData(data?.settings || null);
      setMessage('Settings saved.');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSettingsSaving(false);
    }
  }

  async function loadCustomisation() {
    setCustomisationLoading(true);
    try {
      const res = await fetch(`/api/public/agency-portal/customisation?shareSlug=${encodeURIComponent(shareSlug)}`, {
        method: 'GET',
        credentials: 'include',
        headers: getPortalHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Unable to load customisation.');
        return;
      }
      const nextCustomisation = data?.customisation || null;
      setCustomisationData(nextCustomisation);
    } catch {
      setMessage('Unable to load customisation right now.');
    } finally {
      setCustomisationLoading(false);
    }
  }

  async function saveCustomisation(
    updates: Partial<Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'tour_id' | 'chatbot_type' | 'created_at' | 'updated_at'>>
  ) {
    setCustomisationSaving(true);
    try {
      const res = await fetch('/api/public/agency-portal/customisation', {
        method: 'PUT',
        credentials: 'include',
        headers: getPortalHeaders({
          'Content-Type': 'application/json',
          'x-csrf-token': session.csrfToken || '',
        }),
        body: JSON.stringify({
          shareSlug,
          customisation: updates,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save customisation.');
      }
      const nextCustomisation = data?.customisation || null;
      setCustomisationData(nextCustomisation);
      return nextCustomisation as ChatbotCustomisation;
    } catch {
      setMessage('Failed to save customisation.');
      throw new Error('Failed to save customisation.');
    } finally {
      setCustomisationSaving(false);
    }
  }

  async function resetCustomisationToDefaults() {
    setCustomisationSaving(true);
    try {
      const defaults = getAdvancedDefaultCustomisation('tour');
      const res = await fetch('/api/public/agency-portal/customisation', {
        method: 'PUT',
        credentials: 'include',
        headers: getPortalHeaders({
          'Content-Type': 'application/json',
          'x-csrf-token': session.csrfToken || '',
        }),
        body: JSON.stringify({
          shareSlug,
          customisation: defaults,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to reset customisation.');
      }
      const nextCustomisation = data?.customisation || null;
      setCustomisationData(nextCustomisation);
      return nextCustomisation as ChatbotCustomisation;
    } catch {
      setMessage('Failed to reset customisation.');
      throw new Error('Failed to reset customisation.');
    } finally {
      setCustomisationSaving(false);
    }
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const [statsRes, detailsRes] = await Promise.all([
        fetch(`/api/public/agency-portal/analytics?shareSlug=${encodeURIComponent(shareSlug)}&view=stats`, {
          credentials: 'include',
          headers: getPortalHeaders(),
        }),
        fetch(`/api/public/agency-portal/analytics?shareSlug=${encodeURIComponent(shareSlug)}&view=details`, {
          credentials: 'include',
          headers: getPortalHeaders(),
        }),
      ]);

      const statsJson = await statsRes.json();
      const detailsJson = await detailsRes.json();

      if (!statsRes.ok) {
        setMessage(statsJson?.error || 'Failed to load analytics stats.');
        return;
      }
      if (!detailsRes.ok) {
        setMessage(detailsJson?.error || 'Failed to load analytics details.');
        return;
      }

      setAnalyticsStats(statsJson?.stats || null);
      setAnalyticsTrend(detailsJson?.trend || []);
      setAnalyticsEmbedStats(detailsJson?.embedStats || []);
      setAnalyticsConversations(detailsJson?.conversations || []);
    } catch {
      setMessage('Failed to load analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadInformation() {
    setInformationLoading(true);
    try {
      const res = await fetch(`/api/public/agency-portal/information?shareSlug=${encodeURIComponent(shareSlug)}`, {
        credentials: 'include',
        headers: getPortalHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Failed to load information.');
        return;
      }
      setInformationSections(Array.isArray(data?.sections) ? data.sections : []);
    } catch {
      setMessage('Failed to load information.');
    } finally {
      setInformationLoading(false);
    }
  }

  async function saveInformationSections() {
    if (informationReadOnly) return;
    setInformationSaving(true);
    try {
      const payload = informationDraftSections.map((section, sectionIndex) => ({
        id: section.id,
        section_key: toKey(section.section_key || section.section_title || `section_${sectionIndex + 1}`),
        section_title: section.section_title.trim() || `Section ${sectionIndex + 1}`,
        display_order: sectionIndex,
        is_active: section.is_active !== false,
        fields: (section.fields || []).map((field, fieldIndex) => ({
          id: field.id,
          field_key: toKey(field.field_key || field.field_label || `field_${fieldIndex + 1}`),
          field_label: field.field_label.trim() || `Field ${fieldIndex + 1}`,
          field_type: field.field_type || inferFieldType(field.field_label),
          field_value: field.field_value || '',
          display_order: fieldIndex,
          is_required: field.is_required === true,
        })),
      }));

      const res = await fetch('/api/public/agency-portal/information', {
        method: 'PUT',
        credentials: 'include',
        headers: getPortalHeaders({
          'Content-Type': 'application/json',
          'x-csrf-token': session.csrfToken || '',
        }),
        body: JSON.stringify({
          shareSlug,
          sections: payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Failed to save information sections.');
        return;
      }
      const savedSections = Array.isArray(data?.sections) ? data.sections : [];
      setInformationSections(savedSections);
      setMessage('Information sections saved.');
    } catch {
      setMessage('Failed to save information sections.');
    } finally {
      setInformationSaving(false);
    }
  }

  function getInformationSectionExpandKey(section: InformationSection, index: number) {
    return `${section.id || section.section_key || 'section'}-${index}`;
  }

  function isInformationSectionExpanded(section: InformationSection, index: number) {
    const key = getInformationSectionExpandKey(section, index);
    return expandedInformationSections[key] ?? true;
  }

  function toggleInformationSection(section: InformationSection, index: number) {
    if (informationReadOnly) return;
    const key = getInformationSectionExpandKey(section, index);
    setExpandedInformationSections((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  }

  function updateInformationSection(sectionIndex: number, updates: Partial<InformationSection>) {
    if (informationReadOnly) return;
    setInformationDraftSections((prev) =>
      prev.map((section, index) => (index === sectionIndex ? { ...section, ...updates } : section))
    );
  }

  function updateInformationField(sectionIndex: number, fieldIndex: number, updates: Partial<InformationField>) {
    if (informationReadOnly) return;
    setInformationDraftSections((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          fields: section.fields.map((field, idx) => (idx === fieldIndex ? { ...field, ...updates } : field)),
        };
      })
    );
  }

  function addInformationSection() {
    if (informationReadOnly) return;
    const nextIndex = informationDraftSections.length;
    setInformationDraftSections((prev) => [
      ...prev,
      {
        section_key: `section_${nextIndex + 1}`,
        section_title: `Section ${nextIndex + 1}`,
        display_order: nextIndex,
        is_active: true,
        fields: [],
      },
    ]);
  }

  function deleteInformationSection(sectionIndex: number) {
    if (informationReadOnly) return;
    setInformationDraftSections((prev) => prev.filter((_, index) => index !== sectionIndex));
  }

  function addInformationField(sectionIndex: number) {
    if (informationReadOnly) return;
    setInformationDraftSections((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) return section;
        const nextFieldIndex = section.fields.length;
        return {
          ...section,
          fields: [
            ...section.fields,
            {
              field_key: `field_${nextFieldIndex + 1}`,
              field_label: `Field ${nextFieldIndex + 1}`,
              field_type: 'text',
              field_value: '',
              display_order: nextFieldIndex,
              is_required: false,
            },
          ],
        };
      })
    );
  }

  function deleteInformationField(sectionIndex: number, fieldIndex: number) {
    if (informationReadOnly) return;
    setInformationDraftSections((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          fields: section.fields.filter((_, idx) => idx !== fieldIndex),
        };
      })
    );
  }

  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"
      style={{ backgroundColor: backgroundColour || '#F8FAFC' }}
    >
      <style jsx global>{`
        html, body, #__next {
          height: auto !important;
        }
      `}</style>
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        {showHeader && (
          <Card className="overflow-hidden border-slate-200">
            <div
              className="px-6 py-5 text-white"
              style={{
                background: `linear-gradient(120deg, ${primaryColour} 0%, ${secondaryColour} 100%)`,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {agencyLogoUrl ? (
                    <img
                      src={agencyLogoUrl}
                      alt={`${agencyName} logo`}
                      className="h-10 w-10 rounded bg-white/90 object-contain p-1 ring-1 ring-white/40"
                    />
                  ) : null}
                  <div>
                    <h1 className="text-2xl font-semibold">{agencyName}</h1>
                    <p className="mt-1 text-sm text-slate-100/90">{tourTitle} - {shareSlug}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        <Card className="border-slate-200">
          <CardContent className="space-y-5 p-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-slate-900">Client sign-in</p>
              {previewOnly ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="agency-preview-email">Client email</Label>
                      <Input id="agency-preview-email" placeholder="client@example.com" disabled />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="agency-preview-password">Password</Label>
                      <Input id="agency-preview-password" type="password" placeholder="********" disabled />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" disabled>
                      Sign in
                    </Button>
                    <p className="text-xs text-slate-500">
                      Temporary preview mode. Save share for real login and permanent embed links.
                    </p>
                  </div>
                </div>
              ) : loadingSession ? (
                <p className="text-sm text-slate-600">Checking session...</p>
              ) : session.authenticated ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-600">
                    Signed in as <span className="font-medium">{session.user?.displayName || session.user?.email}</span>.
                  </p>
                  <Button size="sm" onClick={handleLogout} disabled={pending}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <form className="space-y-3" onSubmit={handleLogin}>
                  <div className="space-y-1">
                    <Label htmlFor="agency-login-email">Client email</Label>
                    <Input
                      id="agency-login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="agency-login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="agency-login-password"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={pending || !shareActive}>
                    Sign in
                  </Button>
                </form>
              )}
            </div>

            {(previewOnly || session.authenticated) && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <Tabs value={selectedModule} onValueChange={(value) => setSelectedModule(value as ModuleName)}>
                  <TabsList
                    className="grid w-full"
                    style={{ gridTemplateColumns: `repeat(${Math.max(visibleModules.length, 1)}, minmax(0, 1fr))` }}
                  >
                    {visibleModules.map(({ value, label, icon: Icon }) => (
                      <TabsTrigger key={value} value={value}>
                        <Icon className="mr-1 h-4 w-4" /> {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="tour" className="mt-3">
                    {!resolvedTourId ? (
                      <p className="text-sm text-slate-600">No tour selected for this share.</p>
                    ) : !resolvedTourBlocks.setup && !resolvedTourBlocks.menu ? (
                      <p className="text-sm text-slate-600">No tour sections are enabled for this share.</p>
                    ) : (
                      <Tabs value={selectedTourTab} onValueChange={(value) => setSelectedTourTab(value as 'setup' | 'menu')}>
                        {resolvedTourBlocks.setup && resolvedTourBlocks.menu && (
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="setup">Tour Setup</TabsTrigger>
                            <TabsTrigger value="menu">Tour Menu</TabsTrigger>
                          </TabsList>
                        )}
                        {resolvedTourBlocks.setup && (
                          <TabsContent value="setup" className="mt-4">
                            <TourViewer
                              selectedTourIdOverride={resolvedTourId}
                              forcedVenueId={venueId || appUser?.venue?.id}
                              forcedVenueName={venueName || appUser?.venue?.name}
                            />
                          </TabsContent>
                        )}
                        {resolvedTourBlocks.menu && (
                          <TabsContent value="menu" className="mt-4">
                          <div className={stickyScrollClass}>
                            <TourMenuBuilder
                              tourId={resolvedTourId}
                              venueId={venueId || appUser?.venue?.id}
                              layoutMode="split"
                            />
                          </div>
                          </TabsContent>
                        )}
                      </Tabs>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="mt-3">
                    {!previewOnly && resolvedTourId ? (
                      <TourChatbotSettings selectedTourId={resolvedTourId} visibleSections={resolvedSettingsBlocks} />
                    ) : settingsLoading ? (
                      <p className="text-sm text-slate-600">Loading settings...</p>
                    ) : settingsData ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Chatbot name</Label>
                            <Input
                              value={settingsData.chatbot_name || ''}
                              onChange={(e) => setSettingsData((prev) => prev ? { ...prev, chatbot_name: e.target.value } : prev)}
                              disabled={previewOnly}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Active</Label>
                            <div className="pt-2">
                              <Switch
                                checked={Boolean(settingsData.is_active)}
                                onCheckedChange={(checked) => setSettingsData((prev) => prev ? { ...prev, is_active: checked } : prev)}
                                disabled={previewOnly}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Welcome message</Label>
                          <Input
                            value={settingsData.welcome_message || ''}
                            onChange={(e) =>
                              setSettingsData((prev) => prev ? { ...prev, welcome_message: e.target.value } : prev)
                            }
                            disabled={previewOnly}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Personality</Label>
                          <Textarea
                            rows={4}
                            value={settingsData.personality_prompt || ''}
                            onChange={(e) =>
                              setSettingsData((prev) => prev ? { ...prev, personality_prompt: e.target.value } : prev)
                            }
                            disabled={previewOnly}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Instructions</Label>
                          <Textarea
                            rows={5}
                            value={settingsData.instruction_prompt || ''}
                            onChange={(e) =>
                              setSettingsData((prev) => prev ? { ...prev, instruction_prompt: e.target.value } : prev)
                            }
                            disabled={previewOnly}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(settingsData.guardrails_enabled)}
                            onCheckedChange={(checked) =>
                              setSettingsData((prev) => prev ? { ...prev, guardrails_enabled: checked } : prev)
                            }
                            disabled={previewOnly}
                          />
                          <Label>Enable guardrails</Label>
                        </div>
                        {settingsData.guardrails_enabled && (
                          <div className="space-y-1">
                            <Label>Guardrails</Label>
                            <Textarea
                              rows={5}
                              value={settingsData.guardrail_prompt || ''}
                              onChange={(e) =>
                                setSettingsData((prev) => prev ? { ...prev, guardrail_prompt: e.target.value } : prev)
                              }
                              disabled={previewOnly}
                            />
                          </div>
                        )}
                        <Button onClick={saveSettings} disabled={settingsSaving || previewOnly}>
                          {previewOnly ? 'Preview mode (read-only)' : settingsSaving ? 'Saving...' : 'Save settings'}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">No settings found.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="customisation" className="mt-3">
                    {customisationLoading ? (
                      <p className="text-sm text-slate-600">Loading customisation...</p>
                    ) : customisationData ? (
                      <>
                        {previewOnly ? (
                          <p className="mb-2 text-xs text-slate-500">
                            Temporary preview mode: customisation is read-only until the share is saved.
                          </p>
                        ) : null}
                        <div
                          className={cn(
                            previewOnly ? 'pointer-events-none select-none' : '',
                            stickyScrollClass,
                          )}
                        >
                          <CustomisationForm
                            customisation={{
                              ...customisationData,
                              show_powered_by: false,
                              mobile_show_powered_by: false,
                            }}
                            onUpdate={saveCustomisation}
                            onReset={resetCustomisationToDefaults}
                            isLoading={customisationSaving}
                            customBrandingEnabled={true}
                            hidePoweredByControl={true}
                            layoutMode="split"
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-600">No customisation found.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="analytics" className="mt-3">
                    {analyticsLoading ? (
                      <p className="text-sm text-slate-600">Loading analytics...</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-slate-500">Tour views</p>
                              <p className="text-xl font-semibold">{analyticsStats?.tourViews || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-slate-500">Tour moves</p>
                              <p className="text-xl font-semibold">{analyticsStats?.tourMoves || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-slate-500">Conversations</p>
                              <p className="text-xl font-semibold">{analyticsStats?.totalConversations || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-slate-500">Messages</p>
                              <p className="text-xl font-semibold">{analyticsStats?.totalMessages || 0}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-slate-500">Sessions</p>
                              <p className="text-xl font-semibold">{analyticsStats?.totalSessions || 0}</p>
                            </CardContent>
                          </Card>
                        </div>
                        <Separator />
                        <TourTrendChart data={analyticsTrend} />
                        <Separator />
                        <EmbedStatistics stats={analyticsEmbedStats} />
                        <Separator />
                        <ConversationSessions conversations={analyticsConversations} typeLabel="tour" />
                      </div>
                    )}
                  </TabsContent>

                </Tabs>
              </div>
            )}

            {message && <p className="text-sm text-slate-600">{message}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

