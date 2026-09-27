/**
 * Website site guide: catalogue validation, current-page matching, and the
 * tools a website chatbot may use to move a visitor around one site and,
 * when the page holds a TourBots tour embed, drive that embed.
 *
 * The model only ever receives catalogue ids. Addresses are resolved here
 * so a tool call cannot invent a URL.
 */

export const SITE_GUIDE_MAX_PAGES = 40;
export const SITE_GUIDE_MAX_SECTIONS = 12;

export type SiteGuideHandoffMode = 'none' | 'open_chat' | 'pass_question';

export interface SiteGuideSection {
  id: string;
  title: string;
  anchor: string;
  description: string | null;
  sortOrder: number;
}

export interface SiteGuidePoint {
  id: string;
  name: string;
  sweepId: string;
  position: { x: number; y: number; z: number } | null;
  rotation: { x: number; y: number } | null;
}

export interface SiteGuidePage {
  id: string;
  title: string;
  path: string;
  description: string | null;
  sortOrder: number;
  tourId: string | null;
  tourTitle: string | null;
  tourIframeSelector: string | null;
  handoffMode: SiteGuideHandoffMode;
  sections: SiteGuideSection[];
  points: SiteGuidePoint[];
}

export interface SiteGuide {
  enabled: boolean;
  siteOrigin: string;
  pages: SiteGuidePage[];
}

export interface SiteGuideStep {
  action: 'scroll' | 'load_tour' | 'navigate' | 'handoff';
  anchor?: string;
  embedPath?: string;
  selector?: string | null;
  sweep_id?: string;
  position?: { x: number; y: number; z: number } | null;
  rotation?: { x: number; y: number } | null;
  area_name?: string;
  prompt?: string;
  autoSend?: boolean;
}

export interface SiteGuideClientAction {
  type: 'site_guide';
  action: 'open_page' | 'scroll' | 'load_tour' | 'navigate' | 'handoff';
  path?: string;
  anchor?: string;
  embedPath?: string;
  selector?: string | null;
  sweep_id?: string;
  position?: { x: number; y: number; z: number } | null;
  rotation?: { x: number; y: number } | null;
  area_name?: string;
  prompt?: string;
  autoSend?: boolean;
  /** Follow-up steps the embed runs after a full page load. */
  pending?: SiteGuideStep[];
}

const ORIGIN_PATTERN = /^https?:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?$/;
const ANCHOR_PATTERN = /^(?:[A-Za-z][\w:-]{0,80}|#[A-Za-z][\w:-]{0,80}|\.[A-Za-z][\w:-]{0,80}|\[[A-Za-z][\w:-]{0,40}(?:="[^"]{0,80}")?\])$/;

export function normaliseSiteOrigin(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/\/+$/, '');
  if (!ORIGIN_PATTERN.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Store a same-site path: pathname, optional query, optional hash.
 * A full URL is accepted only when it matches the site origin.
 */
export function normaliseCataloguePath(input: unknown, siteOrigin: string): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500) return null;
  if (trimmed.includes('\\') || trimmed.toLowerCase().includes('javascript:')) return null;

  let path = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.origin !== siteOrigin) return null;
      path = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return null;
    }
  }

  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (path.includes('://')) return null;
  return path;
}

export function normaliseAnchor(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim().replace(/^#/, '');
  const candidate = trimmed.startsWith('.') || trimmed.startsWith('[') ? trimmed : trimmed;
  if (!candidate || candidate.length > 200) return null;
  if (!ANCHOR_PATTERN.test(candidate.startsWith('.') || candidate.startsWith('[') ? candidate : candidate)) {
    // Allow a plain element id after stripping a leading hash.
    if (!/^[A-Za-z][\w:-]{0,80}$/.test(candidate)) return null;
  }
  return candidate;
}

export function normaliseIframeSelector(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > 200) return null;
  if (!/^[A-Za-z0-9_#.\-\[\]=":\s]+$/.test(trimmed)) return null;
  return trimmed;
}

export function normaliseHandoffMode(input: unknown): SiteGuideHandoffMode {
  if (input === 'open_chat' || input === 'pass_question') return input;
  return 'none';
}

function canonicalSitePath(url: URL): string {
  let pathname = url.pathname || '/';
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return `${pathname}${url.search}`;
}

export function pageUrlMatches(siteOrigin: string, pagePath: string, pageUrl: string | null | undefined): boolean {
  if (!pageUrl) return false;
  try {
    const current = new URL(pageUrl);
    if (current.origin !== siteOrigin) return false;
    const listed = new URL(pagePath, siteOrigin);
    if (canonicalSitePath(current) !== canonicalSitePath(listed)) return false;
    if (listed.hash && current.hash !== listed.hash) return false;
    return true;
  } catch {
    return false;
  }
}

export function matchCurrentPage(guide: SiteGuide, pageUrl: string | null | undefined): SiteGuidePage | null {
  if (!guide.enabled || guide.pages.length === 0) return null;
  return guide.pages.find((page) => pageUrlMatches(guide.siteOrigin, page.path, pageUrl)) || null;
}

export function tourEmbedPath(venueId: string, tourId: string, handoffMode: SiteGuideHandoffMode): string {
  const params = new URLSearchParams({
    tourId,
    showTitle: 'false',
    showChat: handoffMode === 'none' ? 'true' : 'true',
  });
  return `/embed/tour/${venueId}?${params.toString()}`;
}

export function isSiteGuideActive(guide: SiteGuide | null | undefined): guide is SiteGuide {
  return Boolean(guide && guide.enabled && guide.pages.length > 0);
}

export function buildSiteGuidePrompt(guide: SiteGuide, currentPage: SiteGuidePage | null, venueId: string): string {
  const pages = guide.pages
    .map((page) => {
      const sections = page.sections.length
        ? `\n  Sections: ${page.sections.map((section) => `${section.title} (section_id ${section.id})`).join('; ')}`
        : '';
      const tour = page.tourId
        ? `\n  Tour embed: ${page.tourTitle || 'Tour'} (tour on this page). Points: ${
            page.points.length
              ? page.points.map((point) => `${point.name} (point_id ${point.id})`).join('; ')
              : 'none saved yet'
          }`
        : '';
      const handoff =
        page.handoffMode === 'none'
          ? ''
          : `\n  Handoff: ${page.handoffMode === 'pass_question' ? 'you may pass a question to the tour chatbot on this page' : 'you may open the tour chatbot on this page'}`;
      return `- ${page.title} (page_id ${page.id}) path ${page.path}${page.description ? ` — ${page.description}` : ''}${sections}${tour}${handoff}`;
    })
    .join('\n');

  const here = currentPage
    ? `The visitor is currently on "${currentPage.title}" (${currentPage.path}).`
    : 'The visitor is on a page that is not in the catalogue. You can still open a listed page. Do not scroll, load a tour, or move a tour until they are on the matching page.';

  const tourNow = currentPage?.tourId
    ? `This page includes the tour "${currentPage.tourTitle || 'Tour'}". You may load it and move to one of its saved points. You may not control any other tour player.`
    : 'This page has no TourBots tour embed in the catalogue. Do not offer to move a virtual tour until you have opened a page that lists one.';

  return `
SITE GUIDE:
You can guide the visitor around this website. Only use the pages, sections, and tour points listed below. Never invent an address.
${here}
${tourNow}

Listed pages:
${pages}

How to guide:
- To take the visitor to another listed page, call open_site_page with that page_id. Speak first, in one short sentence, then call the tool.
- If they should land on a section of that page, pass its section_id as well.
- If they should land inside that page's tour, pass the point_id. The page will open and the tour will move after it loads.
- To scroll the page they are already on, call scroll_to_section.
- To show the tour embed already listed for the current page, call load_site_tour.
- To move the tour they are already viewing, call guide_navigate with the point_id.
- To hand them to the tour's own chatbot, call handoff_tour_chat, and only when that page allows it. pass_question means you should include the question they want answered inside the tour.
- Do not claim you opened a page, scrolled, or moved a tour unless you called the matching tool in this turn.
- Venue id for this account's tour embeds: ${venueId}.
`.trim();
}

export function buildSiteGuideTools(guide: SiteGuide, currentPage: SiteGuidePage | null): Array<Record<string, unknown>> {
  const pageIds = guide.pages.map((page) => page.id);
  const tools: Array<Record<string, unknown>> = [
    {
      type: 'function',
      name: 'open_site_page',
      description: 'Open a page from the site catalogue on the same website. Optionally scroll to a section of that page, move its tour to a saved point after the page loads, or hand the visitor to the tour chatbot. Always reply in a short sentence before calling this.',
      parameters: {
        type: 'object',
        properties: {
          page_id: { type: 'string', enum: pageIds },
          section_id: { type: 'string', description: 'Optional section on the destination page.' },
          point_id: { type: 'string', description: 'Optional saved tour point on the destination page.' },
          handoff_question: { type: 'string', description: 'Optional question to pass to the tour chatbot when that page allows it.' },
        },
        required: ['page_id'],
      },
    },
  ];

  const currentSections = currentPage?.sections || [];
  if (currentSections.length > 0) {
    tools.push({
      type: 'function',
      name: 'scroll_to_section',
      description: 'Scroll the current page to a listed section. Always reply briefly before calling this.',
      parameters: {
        type: 'object',
        properties: {
          section_id: { type: 'string', enum: currentSections.map((section) => section.id) },
        },
        required: ['section_id'],
      },
    });
  }

  if (currentPage?.tourId) {
    tools.push({
      type: 'function',
      name: 'load_site_tour',
      description: 'Load the TourBots tour embed listed for the page the visitor is on. Always reply briefly before calling this.',
      parameters: {
        type: 'object',
        properties: {
          page_id: { type: 'string', enum: [currentPage.id] },
        },
        required: ['page_id'],
      },
    });

    if (currentPage.points.length > 0) {
      tools.push({
        type: 'function',
        name: 'guide_navigate',
        description: 'Move the TourBots tour on the current page to a saved point. Always reply briefly before calling this.',
        parameters: {
          type: 'object',
          properties: {
            point_id: { type: 'string', enum: currentPage.points.map((point) => point.id) },
          },
          required: ['point_id'],
        },
      });
    }

    if (currentPage.handoffMode !== 'none') {
      tools.push({
        type: 'function',
        name: 'handoff_tour_chat',
        description: currentPage.handoffMode === 'pass_question'
          ? 'Open the tour chatbot on this page and pass it a prepared question. Always reply briefly before calling this.'
          : 'Open the tour chatbot on this page so the visitor can continue there. Always reply briefly before calling this.',
        parameters: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'Question to send into the tour chatbot. Required when the page is set to pass a question.' },
          },
          required: currentPage.handoffMode === 'pass_question' ? ['question'] : [],
        },
      });
    }
  }

  return tools;
}

function pointSteps(page: SiteGuidePage, point: SiteGuidePoint, venueId: string): SiteGuideStep[] {
  return [
    {
      action: 'load_tour',
      embedPath: tourEmbedPath(venueId, page.tourId as string, page.handoffMode),
      selector: page.tourIframeSelector,
    },
    {
      action: 'navigate',
      sweep_id: point.sweepId,
      position: point.position,
      rotation: point.rotation,
      area_name: point.name,
      selector: page.tourIframeSelector,
    },
  ];
}

export function interpretSiteGuideTool(
  name: string,
  args: Record<string, unknown>,
  guide: SiteGuide,
  currentPage: SiteGuidePage | null,
  venueId: string,
): { action: SiteGuideClientAction; output: Record<string, unknown> } | { error: string } | null {
  const siteGuideNames = new Set([
    'open_site_page',
    'scroll_to_section',
    'load_site_tour',
    'guide_navigate',
    'handoff_tour_chat',
  ]);
  if (!siteGuideNames.has(name)) return null;
  if (!isSiteGuideActive(guide)) {
    return { error: 'Site guide is not configured' };
  }

  if (name === 'open_site_page') {
    const page = guide.pages.find((item) => item.id === args.page_id);
    if (!page) return { error: 'Unknown page' };
    const pending: SiteGuideStep[] = [];
    if (typeof args.section_id === 'string' && args.section_id) {
      const section = page.sections.find((item) => item.id === args.section_id);
      if (!section) return { error: 'Unknown section for that page' };
      pending.push({ action: 'scroll', anchor: section.anchor });
    }
    if (typeof args.point_id === 'string' && args.point_id) {
      if (!page.tourId) return { error: 'That page has no tour' };
      const point = page.points.find((item) => item.id === args.point_id);
      if (!point) return { error: 'Unknown tour point for that page' };
      pending.push(...pointSteps(page, point, venueId));
    }
    if (typeof args.handoff_question === 'string' && args.handoff_question.trim()) {
      if (page.handoffMode !== 'pass_question') {
        return { error: 'That page does not accept a handed-over question' };
      }
      pending.push({
        action: 'handoff',
        prompt: args.handoff_question.trim().slice(0, 500),
        autoSend: true,
        selector: page.tourIframeSelector,
      });
    }
    return {
      action: {
        type: 'site_guide',
        action: 'open_page',
        path: page.path,
        pending,
      },
      output: { status: 'dispatched', action: 'open_site_page', title: page.title },
    };
  }

  if (name === 'scroll_to_section') {
    const section = currentPage?.sections.find((item) => item.id === args.section_id);
    if (!section) return { error: 'That section is not on the current page' };
    return {
      action: {
        type: 'site_guide',
        action: 'scroll',
        anchor: section.anchor,
        path: currentPage?.path,
      },
      output: { status: 'dispatched', action: 'scroll_to_section', title: section.title },
    };
  }

  if (name === 'load_site_tour') {
    if (!currentPage?.tourId || args.page_id !== currentPage.id) {
      return { error: 'The current page has no listed tour' };
    }
    return {
      action: {
        type: 'site_guide',
        action: 'load_tour',
        embedPath: tourEmbedPath(venueId, currentPage.tourId, currentPage.handoffMode),
        selector: currentPage.tourIframeSelector,
        path: currentPage.path,
      },
      output: { status: 'dispatched', action: 'load_site_tour', title: currentPage.tourTitle },
    };
  }

  if (name === 'guide_navigate') {
    const point = currentPage?.points.find((item) => item.id === args.point_id);
    if (!point || !currentPage?.tourId) return { error: 'That point is not on the current page tour' };
    return {
      action: {
        type: 'site_guide',
        action: 'navigate',
        sweep_id: point.sweepId,
        position: point.position,
        rotation: point.rotation,
        area_name: point.name,
        selector: currentPage.tourIframeSelector,
        path: currentPage.path,
      },
      output: { status: 'dispatched', action: 'guide_navigate', area_name: point.name },
    };
  }

  if (name === 'handoff_tour_chat') {
    if (!currentPage || currentPage.handoffMode === 'none') {
      return { error: 'Handoff is not enabled on the current page' };
    }
    const question = typeof args.question === 'string' ? args.question.trim().slice(0, 500) : '';
    if (currentPage.handoffMode === 'pass_question' && !question) {
      return { error: 'A question is required for this handoff' };
    }
    return {
      action: {
        type: 'site_guide',
        action: 'handoff',
        prompt: question,
        autoSend: currentPage.handoffMode === 'pass_question' && Boolean(question),
        selector: currentPage.tourIframeSelector,
        path: currentPage.path,
      },
      output: { status: 'dispatched', action: 'handoff_tour_chat' },
    };
  }

  return null;
}

export const SITE_GUIDE_TOOL_NAMES = [
  'open_site_page',
  'scroll_to_section',
  'load_site_tour',
  'guide_navigate',
  'handoff_tour_chat',
] as const;
