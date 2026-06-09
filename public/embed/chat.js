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
  var embedId = attr('data-embed-id', 'chatbot-widget-' + venueId);
  var mode = attr('data-mode', 'embed');
  var navAttr = attr('data-nav', 'on');
  var navigationEnabled = !(navAttr === 'off' || navAttr === '0' || navAttr === 'false');

  // Guard against double-injection (e.g. the snippet pasted twice).
  if (window.__tourbotsChatLoaded) return;
  window.__tourbotsChatLoaded = true;

  // ---- Build the iframe URL ---------------------------------------------------
  var params = [
    'id=' + encodeURIComponent(embedId),
    'mode=' + encodeURIComponent(mode),
    'nav=' + (navigationEnabled ? 'on' : 'off'),
  ];
  if (tourId) params.push('tourId=' + encodeURIComponent(tourId));
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
  s.width = '360px';
  s.height = '168px';
  s.maxWidth = '100vw';
  s.maxHeight = '100vh';
  s.border = '0';
  s.background = 'transparent';
  s.colorScheme = 'normal';
  s.zIndex = '2147483000';
  s.overflow = 'hidden';

  function mount() {
    if (document.body) {
      document.body.appendChild(iframe);
    } else {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    }
  }
  mount();

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

  function postToIframe(message) {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, baseOrigin);
      }
    } catch (e) {
      /* ignore */
    }
  }

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
