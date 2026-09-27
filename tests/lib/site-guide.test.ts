import { describe, expect, it } from 'vitest';
import {
  buildSiteGuideTools,
  interpretSiteGuideTool,
  matchCurrentPage,
  shouldDeliverSiteGuideHandoff,
  siteGuideHandoffDeliveryKey,
  normaliseCataloguePath,
  normaliseSiteOrigin,
  pageUrlMatches,
  type SiteGuide,
} from '@/lib/site-guide';

const guide: SiteGuide = {
  enabled: true,
  siteOrigin: 'https://www.apollo3d.co.uk',
  pages: [
    {
      id: 'page-home',
      title: 'Home',
      path: '/',
      description: 'Overview',
      sortOrder: 0,
      tourId: null,
      tourTitle: null,
      tourIframeSelector: null,
      handoffMode: 'none',
      sections: [
        { id: 'sec-market', title: 'Market it', anchor: 'market', description: null, sortOrder: 0 },
      ],
      points: [],
    },
    {
      id: 'page-infinity',
      title: 'Infinity Tours',
      path: '/infinitytours/',
      description: 'Core, Pro, and Ultra',
      sortOrder: 1,
      tourId: 'tour-1',
      tourTitle: 'Show tour',
      tourIframeSelector: '#infinity-tour',
      handoffMode: 'pass_question',
      sections: [
        { id: 'sec-ultra', title: 'Ultra', anchor: 'ultra', description: null, sortOrder: 0 },
      ],
      points: [
        {
          id: 'point-hall',
          name: 'Main hall',
          sweepId: 'sweep-1',
          position: { x: 1, y: 2, z: 3 },
          rotation: { x: 0, y: 10 },
        },
      ],
    },
  ],
};

describe('site guide catalogue', () => {
  it('accepts an origin and a same-site path', () => {
    expect(normaliseSiteOrigin('https://www.apollo3d.co.uk/')).toBe('https://www.apollo3d.co.uk');
    expect(normaliseCataloguePath('/infinitytours/?experience=kitchenaid', 'https://www.apollo3d.co.uk')).toBe(
      '/infinitytours/?experience=kitchenaid',
    );
    expect(normaliseCataloguePath('https://www.apollo3d.co.uk/virtual-tours/', 'https://www.apollo3d.co.uk')).toBe(
      '/virtual-tours/',
    );
  });

  it('rejects another site and scheme-relative paths', () => {
    expect(normaliseCataloguePath('https://example.com/pricing', 'https://www.apollo3d.co.uk')).toBeNull();
    expect(normaliseCataloguePath('//evil.example/phish', 'https://www.apollo3d.co.uk')).toBeNull();
    expect(normaliseSiteOrigin('javascript:alert(1)')).toBeNull();
  });

  it('matches the current page including a query string', () => {
    expect(pageUrlMatches(
      'https://www.apollo3d.co.uk',
      '/infinitytour/?experience=kitchenaid',
      'https://www.apollo3d.co.uk/infinitytour/?experience=kitchenaid',
    )).toBe(true);
    expect(pageUrlMatches(
      'https://www.apollo3d.co.uk',
      '/infinitytour/?experience=kitchenaid',
      'https://www.apollo3d.co.uk/infinitytour/?experience=other',
    )).toBe(false);
    expect(matchCurrentPage(guide, 'https://www.apollo3d.co.uk/infinitytours/')).toMatchObject({ id: 'page-infinity' });
    expect(matchCurrentPage(guide, 'https://www.apollo3d.co.uk/infinitytours')).toMatchObject({ id: 'page-infinity' });
    expect(matchCurrentPage(guide, 'https://other.example/infinitytours/')).toBeNull();
  });

  it('offers tour tools only on a page that lists a tour', () => {
    const homeTools = buildSiteGuideTools(guide, guide.pages[0]).map((tool) => tool.name);
    const tourTools = buildSiteGuideTools(guide, guide.pages[1]).map((tool) => tool.name);
    expect(homeTools).toEqual(['open_site_page', 'scroll_to_section']);
    expect(tourTools).toContain('guide_navigate');
    expect(tourTools).toContain('handoff_tour_chat');
    expect(homeTools).not.toContain('guide_navigate');
  });

  it('resolves an open-page request to a catalogue path and a pending tour move', () => {
    const result = interpretSiteGuideTool(
      'open_site_page',
      { page_id: 'page-infinity', point_id: 'point-hall', section_id: 'sec-ultra' },
      guide,
      guide.pages[0],
      'venue-1',
    );
    expect(result && 'action' in result && result.action.path).toBe('/infinitytours/');
    if (!result || !('action' in result)) throw new Error('expected action');
    expect(result.action.pending?.map((step) => step.action)).toEqual(['scroll', 'load_tour', 'navigate']);
    expect(result.action.pending?.[2]).toMatchObject({ sweep_id: 'sweep-1', area_name: 'Main hall' });
    expect(result.action.pending?.[1].embedPath).toContain('/embed/tour/venue-1');
    expect(result.action.pending?.[1].embedPath).toContain('tourId=tour-1');
  });

  it('refuses a tour move when the visitor is not on that page', () => {
    const result = interpretSiteGuideTool(
      'guide_navigate',
      { point_id: 'point-hall' },
      guide,
      guide.pages[0],
      'venue-1',
    );
    expect(result).toEqual({ error: 'That point is not on the current page tour' });
  });

  it('refuses a handoff question when the page does not allow one', () => {
    const result = interpretSiteGuideTool(
      'open_site_page',
      { page_id: 'page-home', handoff_question: 'Show me the hall' },
      guide,
      null,
      'venue-1',
    );
    expect(result).toEqual({ error: 'That page does not accept a handed-over question' });
  });

  it('allows a handoff question on a page configured for it', () => {
    const result = interpretSiteGuideTool(
      'handoff_tour_chat',
      { question: 'Where is the armour?' },
      guide,
      guide.pages[1],
      'venue-1',
    );
    expect(result && 'action' in result && result.action).toMatchObject({
      action: 'handoff',
      prompt: 'Where is the armour?',
      autoSend: true,
    });
  });

  it('ignores a repeated handoff while the host script is still retrying', () => {
    const key = siteGuideHandoffDeliveryKey('What is this space used for?', true);
    const first = { key, at: 1_000 };
    expect(shouldDeliverSiteGuideHandoff(null, key, 1_000)).toBe(true);
    expect(shouldDeliverSiteGuideHandoff(first, key, 1_500)).toBe(false);
    expect(shouldDeliverSiteGuideHandoff(first, key, 12_000)).toBe(false);
    expect(shouldDeliverSiteGuideHandoff(first, key, 16_000)).toBe(true);
    expect(shouldDeliverSiteGuideHandoff(first, siteGuideHandoffDeliveryKey('A different question', true), 2_000)).toBe(true);
  });
});
