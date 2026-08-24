/* ==========================================================================
   BURHAN | بُرهان — Responsive Navigation Manager
   Handles mobile menu toggling, aria-expanded states, and keyboard ESC closure.
   ========================================================================== */

(function () {
  'use strict';

  function initNavigation() {
    var navToggleBtn = document.querySelector('[data-nav-toggle]');
    var navMenu = document.querySelector('[data-nav-menu]');

    if (!navToggleBtn || !navMenu) return;

    function toggleMenu(open) {
      var shouldOpen = (open !== undefined) ? open : !navMenu.classList.contains('is-open');
      navMenu.classList.toggle('is-open', shouldOpen);
      navToggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      navToggleBtn.setAttribute('aria-label', shouldOpen ? 'Close Navigation Menu' : 'Open Navigation Menu');
    }

    navToggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        toggleMenu(false);
        navToggleBtn.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (navMenu.classList.contains('is-open') &&
          !navMenu.contains(e.target) &&
          !navToggleBtn.contains(e.target)) {
        toggleMenu(false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 767 && navMenu.classList.contains('is-open')) {
        toggleMenu(false);
      }
    });
  }

  // Expose API — do NOT self-init here
  window.BURHAN = window.BURHAN || {};
  window.BURHAN.navigation = {
    init: initNavigation
  };

})();
