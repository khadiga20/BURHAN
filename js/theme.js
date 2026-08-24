/* ==========================================================================
   BURHAN | بُرهان — Dark/Light Theme System Manager
   Handles localStorage persistence, system preference detection,
   root attribute toggling (data-theme="light" | "dark"), and ARIA states.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'burhan_theme';
  var SUPPORTED_THEMES = ['light', 'dark'];

  function getSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getCurrentTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    if (stored && SUPPORTED_THEMES.indexOf(stored) !== -1) {
      return stored;
    }
    return 'dark';
  }

  function setTheme(theme) {
    if (SUPPORTED_THEMES.indexOf(theme) === -1) {
      theme = 'dark';
    }

    document.documentElement.setAttribute('data-theme', theme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}

    // Update toggle buttons in DOM
    var toggleBtns = document.querySelectorAll('[data-theme-toggle]');
    toggleBtns.forEach(function (btn) {
      var isDark = theme === 'dark';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'
      );
      
      var iconSun = btn.querySelector('.theme-icon-sun');
      var iconMoon = btn.querySelector('.theme-icon-moon');
      if (iconSun && iconMoon) {
        iconSun.style.display = isDark ? 'inline-block' : 'none';
        iconMoon.style.display = isDark ? 'none' : 'inline-block';
      }
    });

    window.dispatchEvent(new CustomEvent('burhan:themeChanged', {
      detail: { theme: theme }
    }));
  }

  function toggleTheme() {
    var current = getCurrentTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  function initThemeSystem() {
    var initialTheme = getCurrentTheme();
    setTheme(initialTheme);

    // Single delegated click handler for theme toggles
    document.addEventListener('click', function (event) {
      var toggleBtn = event.target.closest('[data-theme-toggle]');
      if (!toggleBtn) return;
      event.preventDefault();
      toggleTheme();
    });

    // Listen to OS theme changes if user has no explicit preference stored
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        try {
          if (!localStorage.getItem(STORAGE_KEY)) {
            setTheme('dark');
          }
        } catch (err) {}
      });
    }
  }

  // Immediate execution on script parse to prevent Theme & Direction Flash (FOUC)
  var immediateTheme = getCurrentTheme();
  document.documentElement.setAttribute('data-theme', immediateTheme);

  try {
    var storedLang = localStorage.getItem('burhan_preferred_lang');
    if (storedLang === 'en') {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    } else {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  } catch (e) {}

  // Expose API
  window.BURHAN = window.BURHAN || {};
  window.BURHAN.theme = {
    get: getCurrentTheme,
    set: setTheme,
    toggle: toggleTheme,
    init: initThemeSystem
  };

})();
