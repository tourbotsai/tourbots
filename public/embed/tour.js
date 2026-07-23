(function() {

  function resolveTourEmbedOrigin() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src;
      if (src && src.indexOf('/embed/tour.js') !== -1) {
        try {
          return new URL(src).origin;
        } catch (e) {}
      }
    }
    return 'https://tourbots.ai';
  }
  
  var TOUR_EMBED_ORIGIN = resolveTourEmbedOrigin();
  
  window.gt = window.gt || function() {
    (window.gt.q = window.gt.q || []).push(arguments);
  };
  
  var tourWidgets = {};
  
  function createTourWidget(embedId, venueId, options) {
    options = options || {};
    
    // Create main tour container
    var container = document.createElement('div');
    container.id = 'gt-container-' + embedId;
    container.style.cssText = [
      'position: relative',
      'width: ' + (options.width || '100%'),
      'height: ' + (options.height || '600px'),
      'border: none',
      'border-radius: 8px',
      'overflow: hidden',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.1)',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');
    
    // Create tour iframe with parent domain context
    var iframe = document.createElement('iframe');
    iframe.id = 'gt-iframe-' + embedId;
    iframe.src = TOUR_EMBED_ORIGIN + '/embed/tour/' + venueId + '?id=' + embedId + 
                 '&showTitle=' + (options.showTitle !== false) + 
                 '&showChat=' + (options.showChat !== false) +
                 (options.tourId ? '&tourId=' + encodeURIComponent(options.tourId) : '') +
                 '&domain=' + encodeURIComponent(window.location.hostname) +
                 '&pageUrl=' + encodeURIComponent(window.location.href);
    iframe.style.cssText = [
      'width: 100%',
      'height: 100%',
      'border: none'
    ].join(';');
    iframe.allowFullscreen = true;
    iframe.setAttribute('allow', 'xr-spatial-tracking; gyroscope; accelerometer');
    
    container.appendChild(iframe);
    
    // Find script tag and replace it with our widget
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.innerHTML && script.innerHTML.includes('gt(\'init\', \'' + embedId + '\'')) {
        script.parentNode.insertBefore(container, script);
        break;
      }
    }
    
    tourWidgets[embedId] = container;
  }
  
  // Process queued commands
  function processQueue() {
    while (window.gt.q && window.gt.q.length > 0) {
      var args = window.gt.q.shift();
      var command = args[0];
      
      if (command === 'init') {
        var embedId = args[1];
        var venueId = args[2];
        var options = args[3] || {};
        createTourWidget(embedId, venueId, options);
      }
    }
  }
  
  // Process initial queue and set up real-time processing
  processQueue();
  
  // Check for simple embed (data-venue-id)
  function initSimpleEmbed() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      var venueId = script.getAttribute('data-venue-id');
      if (venueId && script.src && script.src.includes('/embed/tour.js')) {
        var embedId = 'tour-simple-' + venueId + '-' + Date.now();
        
        // Read configuration from data attributes
        var width = script.getAttribute('data-width') || '100%';
        var height = script.getAttribute('data-height') || '600px';
        var showTitle = script.getAttribute('data-show-title') !== 'false';
        var showChat = script.getAttribute('data-show-chat') !== 'false';
        
        console.log('🔧 Simple embed config:', { width, height, showTitle, showChat });
        
        var container = document.createElement('div');
        container.style.cssText = [
          'position: relative',
          'width: ' + width,
          'height: ' + height,
          'border: none',
          'border-radius: 8px',
          'overflow: hidden',
          'box-shadow: 0 4px 12px rgba(0,0,0,0.1)'
        ].join(';');
        
        var iframe = document.createElement('iframe');
        // Pass configuration to iframe URL along with parent domain info
        iframe.src = TOUR_EMBED_ORIGIN + '/embed/tour/' + venueId + '?id=' + embedId +
                     '&domain=' + encodeURIComponent(window.location.hostname) +
                     '&pageUrl=' + encodeURIComponent(window.location.href) +
                     '&showTitle=' + showTitle +
                     '&showChat=' + showChat;
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.allowFullscreen = true;
        iframe.setAttribute('allow', 'xr-spatial-tracking; gyroscope; accelerometer');
        
        container.appendChild(iframe);
        script.parentNode.insertBefore(container, script);
        
        break; // Only init first one found
      }
    }
  }
  
  // Check for simple embed on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimpleEmbed);
  } else {
    initSimpleEmbed();
  }
  
  window.gt = function() {
    var args = Array.prototype.slice.call(arguments);
    var command = args[0];
    
    if (command === 'init') {
      var embedId = args[1];
      var venueId = args[2];
      var options = args[3] || {};
      createTourWidget(embedId, venueId, options);
    }
  };
})(); 