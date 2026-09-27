// @ts-nocheck
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

function boot(pageUrl: string) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><body>
      <script src="https://tourbots.ai/embed/chat.js" data-venue-id="11111111-1111-4111-8111-111111111111" data-chatbot-config-id="22222222-2222-4222-8222-222222222222"></script>
      <iframe id="showroom" src="https://tourbots.ai/embed/tour/11111111-1111-4111-8111-111111111111?tourId=33333333-3333-4333-8333-333333333333"></iframe>
      <div id="pricing">Pricing</div>
    </body></html>`,
    { url: pageUrl, runScripts: 'outside-only' },
  );
  const source = readFileSync('public/embed/chat.js', 'utf8');
  dom.window.eval(source);
  return dom;
}

function postFromChat(dom: JSDOM, data: Record<string, unknown>) {
  const frames = Array.from(dom.window.document.getElementsByTagName('iframe')) as HTMLIFrameElement[];
  const chatFrame = frames.find((frame) => (frame.src || '').includes('/embed/chatbot/'));
  if (!chatFrame?.contentWindow) throw new Error('chat iframe was not mounted');
  const event = new dom.window.MessageEvent('message', {
    data: { source: 'tourbots', type: 'site_guide', ...data },
    origin: 'https://tourbots.ai',
  });
  Object.defineProperty(event, 'source', { value: chatFrame.contentWindow });
  dom.window.dispatchEvent(event);
}

describe('embed site guide script', () => {
  it('scrolls to a listed anchor and ignores another website', () => {
    const dom = boot('https://www.example.com/services');
    const target = dom.window.document.getElementById('pricing');
    let scrolled = false;
    if (target) target.scrollIntoView = () => { scrolled = true; };
    postFromChat(dom, { action: 'scroll', anchor: 'pricing' });
    expect(scrolled).toBe(true);

    const before = dom.window.location.href;
    postFromChat(dom, { action: 'open_page', path: 'https://evil.example/phish' });
    expect(dom.window.location.href).toBe(before);
  });

  it('stores a same-site page change and the tour move to run after load', () => {
    const dom = boot('https://www.example.com/');
    try {
      postFromChat(dom, {
        action: 'open_page',
        path: '/portfolio/',
        pending: [{ action: 'navigate', sweep_id: 'sweep-1', selector: '#showroom' }],
      });
    } catch {
      // jsdom cannot complete a real navigation. The pending action is stored first.
    }
    const pending = JSON.parse(dom.window.sessionStorage.getItem('tourbots-site-guide-pending') || '{}');
    expect(pending.path).toBe('/portfolio/');
    expect(pending.steps[0].sweep_id).toBe('sweep-1');
  });

  it('only rewrites a TourBots tour embed address', () => {
    const dom = boot('https://www.example.com/portfolio');
    const showroom = dom.window.document.getElementById('showroom') as HTMLIFrameElement;
    postFromChat(dom, {
      action: 'load_tour',
      embedPath: 'https://evil.example/embed/tour/x',
      selector: '#showroom',
    });
    expect(showroom.src).toContain('tourbots.ai/embed/tour/');

    postFromChat(dom, {
      action: 'load_tour',
      embedPath: '/embed/tour/11111111-1111-4111-8111-111111111111?tourId=44444444-4444-4444-8444-444444444444&showTitle=false&showChat=true',
      selector: '#showroom',
    });
    expect(showroom.src).toContain('tourId=44444444-4444-4444-8444-444444444444');
    expect(showroom.src.startsWith('https://tourbots.ai/embed/tour/')).toBe(true);
  });
});
