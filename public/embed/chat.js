/**
 * TourBots AI — advanced chatbot loader.
 *
 * Paste this <script> onto any page (your own website, or an MPskin "extend-HTML"
 * block on a Matterport tour). It injects the TourBots chatbot as a floating,
 * self-sizing iframe and — when navigation is enabled and a Matterport tour is
 * present on the page — installs a bridge so the AI can drive the live tour.
 *
 * The chat UI itself is served from tourbots.ai inside the iframe, so all of its
 * API calls (chat, analytics) are first-party/same-origin. This file only does
 * three things on the host page:
 *   1. mount + size the iframe,
 *   2. translate navigation messages from the iframe into Matterport SDK calls,
 *   3. relay the tour's current sweep back to the iframe for move analytics.
 *   4. for a website site guide, open a listed same-site page, scroll to a
 *      section, and drive a TourBots tour embed on the page.
 */
(function () {
  'use strict';

  // ---- Resolve this script tag + its configuration --------------------------
  var script =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName('script');
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src && all[i].src.indexOf('/embed/chat.js') !== -1) return all[i];
      }
      return null;
    })();

  if (!script) return;

  function attr(name, fallback) {
    var v = script.getAttribute(name);
    return v === null || v === '' ? fallback : v;
  }

  // Base origin is derived from the script's own src so the snippet works on any
  // environment (production, preview, local) without hard-coding the host.
  var baseOrigin;
  try {
    baseOrigin = new URL(script.src).origin;
  } catch (e) {
    return;
  }

  var venueId = attr('data-venue-id', '');
  if (!venueId) return;

  var tourId = attr('data-tour-id', '');
  var chatbotConfigId = attr('data-chatbot-config-id', '');
  var embedId = attr('data-embed-id', 'chatbot-widget-' + venueId);
  var mode = attr('data-mode', 'embed');
  var navAttr = attr('data-nav', 'on');
  // Website chatbots (identified by data-chatbot-config-id) have no Matterport
  // tour to navigate, so navigation is always forced off regardless of data-nav.
  var navigationEnabled = !chatbotConfigId && !(navAttr === 'off' || navAttr === '0' || navAttr === 'false');

  // Guard against double-injection (e.g. the snippet pasted twice).
  if (window.__tourbotsChatLoaded) return;
  window.__tourbotsChatLoaded = true;

  // ---- Build the iframe URL ---------------------------------------------------
  var params = [
    'id=' + encodeURIComponent(embedId),
    'mode=' + encodeURIComponent(mode),
    'nav=' + (navigationEnabled ? 'on' : 'off'),
  ];
  if (chatbotConfigId) {
    params.push('chatbotConfigId=' + encodeURIComponent(chatbotConfigId));
  } else if (tourId) {
    params.push('tourId=' + encodeURIComponent(tourId));
  }
  try {
    params.push('domain=' + encodeURIComponent(window.location.hostname));
    params.push('pageUrl=' + encodeURIComponent(window.location.href));
  } catch (e) {
    /* ignore */
  }

  var iframeSrc = baseOrigin + '/embed/chatbot/' + encodeURIComponent(venueId) + '?' + params.join('&');

  // ---- Inject the floating iframe --------------------------------------------
  var iframe = document.createElement('iframe');
  iframe.src = iframeSrc;
  iframe.title = 'TourBots AI Assistant';
  iframe.setAttribute('allow', 'clipboard-write; microphone');
  iframe.setAttribute('allowtransparency', 'true');
  var s = iframe.style;
  s.position = 'fixed';
  s.bottom = '0px';
  s.right = '0px';
  s.left = 'auto';
  // Small initial footprint (just the collapsed button area) until the chat page
  // posts its exact size. Keeping this tight avoids a large transparent box
  // swallowing clicks meant for the host tour during the first moment of load.
  s.width = '140px';
  s.height = '140px';
  s.maxWidth = '100vw';
  s.maxHeight = '100vh';
  s.border = '0';
  s.background = 'transparent';
  s.colorScheme = 'normal';
  s.zIndex = '2147483000';
  s.overflow = 'hidden';

  // Relay the HOST viewport to the iframe. Inside the (small) floating iframe the
  // chat UI's own window.innerWidth is the iframe width, so without this it would
  // always think it is mobile and request a fullscreen widget that blocks the tour.
  function postViewport() {
    postToIframe({
      source: 'tourbots-host',
      type: 'tourbots:viewport',
      width: window.innerWidth || document.documentElement.clientWidth || 0,
      height: window.innerHeight || document.documentElement.clientHeight || 0,
    });
  }

  iframe.addEventListener('load', postViewport);

  function mount() {
    if (document.body) {
      document.body.appendChild(iframe);
    } else {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    }
  }
  mount();

  window.addEventListener('resize', postViewport);

  // ---- Size + position relay from the iframe ---------------------------------
  function applySize(data) {
    var fullscreen = data.fullscreen === true;
    if (fullscreen) {
      s.width = '100vw';
      s.height = '100vh';
      s.left = '0px';
      s.right = '0px';
      s.bottom = '0px';
      return;
    }

    var position = data.position || 'bottom-right';
    if (position.indexOf('left') !== -1) {
      s.left = '0px';
      s.right = 'auto';
    } else {
      s.right = '0px';
      s.left = 'auto';
    }
    s.bottom = '0px';

    if (typeof data.width === 'number' && data.width > 0) {
      s.width = Math.min(data.width, Math.round(window.innerWidth)) + 'px';
    }
    if (typeof data.height === 'number' && data.height > 0) {
      s.height = Math.min(data.height, Math.round(window.innerHeight)) + 'px';
    }
  }

  // ---- Matterport navigation bridge ------------------------------------------
  var mpSdk = null;
  var latestPose = null;

  function connectToMatterport() {
    if (!navigationEnabled || mpSdk) return;

    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      if (frame === iframe) continue;
      var win;
      try {
        win = frame.contentWindow;
      } catch (e) {
        continue; // cross-origin — not the Matterport bundle frame
      }
      if (!win) continue;

      var connect;
      try {
        connect = win.MP_SDK && win.MP_SDK.connect;
      } catch (e) {
        continue;
      }
      if (typeof connect !== 'function') continue;

      try {
        var result = win.MP_SDK.connect(win);
        if (result && typeof result.then === 'function') {
          result
            .then(function (sdk) {
              mpSdk = sdk;
              subscribeToTour(sdk);
            })
            .catch(function () {
              /* try the next frame on the next tick */
            });
          return; // a connect attempt is in flight; stop scanning
        }
      } catch (e) {
        /* try next frame */
      }
    }
  }

  function subscribeToTour(sdk) {
    try {
      sdk.Camera.pose.subscribe(function (pose) {
        latestPose = pose || null;
      });
    } catch (e) {
      /* pose is best-effort (analytics only) */
    }

    try {
      sdk.Sweep.current.subscribe(function (sweep) {
        if (!sweep || !sweep.sid) return;
        var rotation = latestPose && latestPose.rotation ? latestPose.rotation : null;
        var position = latestPose && latestPose.position ? latestPose.position : null;
        postToIframe({
          source: 'tourbots-host',
          type: 'tourbots:pose',
          sweepId: sweep.sid,
          position: position,
          rotation: rotation,
        });
      });
    } catch (e) {
      /* sweep subscription is best-effort */
    }
  }

  function moveTo(sweepId, rotation) {
    if (!mpSdk || !sweepId) return;
    var options = {};
    if (rotation && typeof rotation === 'object') {
      options.rotation = { x: Number(rotation.x) || 0, y: Number(rotation.y) || 0 };
    }
    try {
      options.transition = mpSdk.Sweep.Transition.FLY;
    } catch (e) {
      /* enum unavailable — SDK uses its default transition */
    }
    try {
      mpSdk.Sweep.moveTo(sweepId, options);
    } catch (e) {
      /* swallow — a stale sweep id should not break the page */
    }
  }

  var PENDING_KEY = 'tourbots-site-guide-pending';

  function sameSiteUrl(path) {
    try {
      var url = new URL(path, window.location.origin);
      if (url.origin !== window.location.origin) return null;
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return url;
    } catch (e) {
      return null;
    }
  }

  function loosePath(url) {
    var path = url.pathname || '/';
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    return path + url.search;
  }

  function pathsMatch(path) {
    var target = sameSiteUrl(path);
    if (!target) return false;
    if (loosePath(target) !== loosePath(window.location)) return false;
    if (target.hash && window.location.hash !== target.hash) return false;
    return true;
  }

  function findTourFrame(selector) {
    if (selector) {
      try {
        var selected = document.querySelector(selector);
        if (selected && selected.tagName === 'IFRAME') return selected;
      } catch (e) {
        /* invalid selector */
      }
    }
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      var src = frames[i].src || '';
      if (src.indexOf('/embed/tour/') !== -1) return frames[i];
    }
    return null;
  }

  function tourFrameOrigin(frame) {
    try {
      return new URL(frame.src).origin;
    } catch (e) {
      return baseOrigin;
    }
  }

  function postToTourFrame(frame, message) {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(message, tourFrameOrigin(frame));
    } catch (e) {
      /* ignore */
    }
  }

  function scrollToAnchor(anchor) {
    if (!anchor) return;
    var el = null;
    try {
      if (anchor.charAt(0) === '.' || anchor.charAt(0) === '[') {
        el = document.querySelector(anchor);
      } else {
        el = document.getElementById(anchor.replace(/^#/, '')) || document.querySelector('#' + anchor.replace(/^#/, ''));
      }
    } catch (e) {
      el = null;
    }
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function allowedEmbedPath(embedPath) {
    try {
      var url = new URL(embedPath, baseOrigin);
      if (url.origin !== baseOrigin) return null;
      if (url.pathname.indexOf('/embed/tour/') !== 0) return null;
      return url.toString();
    } catch (e) {
      return null;
    }
  }

  function loadTourFrame(step) {
    return new Promise(function (resolve) {
      var frame = findTourFrame(step.selector);
      var nextSrc = allowedEmbedPath(step.embedPath);
      if (!frame || !nextSrc) {
        resolve();
        return;
      }
      var current = '';
      try {
        current = new URL(frame.src).pathname + new URL(frame.src).search;
      } catch (e) {
        current = '';
      }
      var next = '';
      try {
        var parsed = new URL(nextSrc);
        next = parsed.pathname + parsed.search;
      } catch (e2) {
        resolve();
        return;
      }
      if (current === next) {
        resolve();
        return;
      }
      var done = function () {
        frame.removeEventListener('load', done);
        resolve();
      };
      frame.addEventListener('load', done);
      frame.src = nextSrc;
      window.setTimeout(resolve, 8000);
    });
  }

  function retryTourMessage(selector, message) {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts++;
      var frame = findTourFrame(selector);
      if (frame) postToTourFrame(frame, message);
      if (attempts > 24) window.clearInterval(timer);
    }, 500);
  }

  function runStep(step) {
    if (!step || !step.action) return Promise.resolve();
    if (step.action === 'scroll') {
      scrollToAnchor(step.anchor);
      return Promise.resolve();
    }
    if (step.action === 'load_tour') return loadTourFrame(step);
    if (step.action === 'navigate') {
      retryTourMessage(step.selector, {
        source: 'tourbots-host',
        type: 'tourbots:navigate',
        sweep_id: step.sweep_id,
        position: step.position,
        rotation: step.rotation,
        area_name: step.area_name,
      });
      return Promise.resolve();
    }
    if (step.action === 'handoff') {
      retryTourMessage(step.selector, {
        source: 'tourbots-host',
        type: 'tourbots:handoff',
        prompt: step.prompt || '',
        autoSend: step.autoSend === true,
      });
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  function runSteps(steps) {
    var chain = Promise.resolve();
    (steps || []).forEach(function (step) {
      chain = chain.then(function () {
        return runStep(step);
      });
    });
    return chain;
  }

  function rememberPending(path, steps) {
    try {
      if (!steps || !steps.length) {
        sessionStorage.removeItem(PENDING_KEY);
        return;
      }
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ path: path, steps: steps }));
    } catch (e) {
      /* ignore */
    }
  }

  function consumePending() {
    var raw;
    try {
      raw = sessionStorage.getItem(PENDING_KEY);
    } catch (e) {
      return;
    }
    if (!raw) return;
    var pending;
    try {
      pending = JSON.parse(raw);
    } catch (e2) {
      sessionStorage.removeItem(PENDING_KEY);
      return;
    }
    if (!pending || !pending.path || !pathsMatch(pending.path)) return;
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch (e3) {
      /* ignore */
    }
    runSteps(pending.steps);
  }

  function handleSiteGuide(data) {
    if (data.action === 'open_page') {
      var destination = sameSiteUrl(data.path);
      if (!destination) return;
      rememberPending(data.path, data.pending);
      if (!pathsMatch(data.path)) {
        try {
          window.location.assign(destination.toString());
        } catch (e) {
          /* navigation can be blocked by the host page */
        }
      } else {
        consumePending();
      }
      return;
    }
    if (data.action === 'scroll') {
      scrollToAnchor(data.anchor);
      return;
    }
    if (data.action === 'load_tour') {
      loadTourFrame({ embedPath: data.embedPath, selector: data.selector });
      return;
    }
    if (data.action === 'navigate') {
      runStep({
        action: 'navigate',
        selector: data.selector,
        sweep_id: data.sweep_id,
        position: data.position,
        rotation: data.rotation,
        area_name: data.area_name,
      });
      return;
    }
    if (data.action === 'handoff') {
      runStep({
        action: 'handoff',
        selector: data.selector,
        prompt: data.prompt,
        autoSend: data.autoSend,
      });
    }
  }

  function postToIframe(message) {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, baseOrigin);
      }
    } catch (e) {
      /* ignore */
    }
  }

  consumePending();

  if (navigationEnabled) {
    var attempts = 0;
    var poll = window.setInterval(function () {
      attempts++;
      connectToMatterport();
      // The MPskin bundle frame is injected a few seconds after page load, so we
      // poll for ~40s, then stop. The widget still works as a Q&A assistant if no
      // tour is ever found.
      if (mpSdk || attempts > 50) {
        window.clearInterval(poll);
      }
    }, 800);
  }

  // ---- Message handling from the chat iframe ---------------------------------
  window.addEventListener('message', function (event) {
    if (event.origin !== baseOrigin) return;
    if (iframe.contentWindow && event.source !== iframe.contentWindow) return;

    var data = event.data;
    if (!data || data.source !== 'tourbots' || typeof data.type !== 'string') return;

    switch (data.type) {
      case 'site_guide':
        handleSiteGuide(data);
        break;
      case 'tourbots:request-viewport':
        postViewport();
        break;
      case 'tourbots:size':
        applySize(data);
        break;
      case 'matterport_navigate':
        if (navigationEnabled) moveTo(data.sweep_id, data.rotation);
        break;
      case 'switch_matterport_model':
        // Model switching is a TourBots full-tour feature; on a host MPskin page
        // there is a single embedded model, so this is intentionally a no-op.
        break;
      case 'tour_chatbot_open_url':
        if (data.url) {
          try {
            window.open(data.url, '_blank', 'noopener');
          } catch (e) {
            /* popup blocked */
          }
        }
        break;
      default:
        break;
    }
  });
})();
