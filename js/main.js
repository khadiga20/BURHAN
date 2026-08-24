/* ==========================================================================
   BURHAN | بُرهان — Main Entrypoint
   Single initialization point for all BURHAN modules.
   Scripts order: theme.js, language.js, navigation.js, motion.js, main.js
   ========================================================================== */

(function () {
  'use strict';

  function initAll() {
    window.BURHAN = window.BURHAN || {};

    if (window.BURHAN.theme && typeof window.BURHAN.theme.init === 'function') {
      window.BURHAN.theme.init();
    }

    if (window.BURHAN.language && typeof window.BURHAN.language.init === 'function') {
      window.BURHAN.language.init();
    }

    if (window.BURHAN.navigation && typeof window.BURHAN.navigation.init === 'function') {
      window.BURHAN.navigation.init();
    }

    if (window.BURHAN.motion && typeof window.BURHAN.motion.init === 'function') {
      window.BURHAN.motion.init();
    }

    document.documentElement.setAttribute('data-burhan-initialized', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
