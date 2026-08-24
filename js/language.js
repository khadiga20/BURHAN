/* ==========================================================================
   BURHAN | بُرهان — Bilingual & RTL/LTR Management System
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'burhan_preferred_lang';
  const SUPPORTED_LANGS = ['en', 'ar'];
  const DEFAULT_LANG = 'ar';

  function getCurrentLanguage() {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    if (stored && SUPPORTED_LANGS.includes(stored)) {
      return stored;
    }
    const htmlLang = document.documentElement.lang;
    if (htmlLang && SUPPORTED_LANGS.includes(htmlLang)) {
      return htmlLang;
    }
    return DEFAULT_LANG;
  }


  function setLanguage(lang, preserveScroll) {
    if (preserveScroll === undefined) preserveScroll = true;
    if (!SUPPORTED_LANGS.includes(lang)) {
      lang = DEFAULT_LANG;
    }

    const currentScrollY = preserveScroll ? window.scrollY : 0;
    const isRtl = lang === 'ar';

    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}

    // Update language toggle buttons ARIA state
    var toggleBtns = document.querySelectorAll('[data-lang-toggle]');
    for (var i = 0; i < toggleBtns.length; i++) {
      toggleBtns[i].setAttribute('aria-label', isRtl ? 'Switch to English' : 'التحويل إلى العربية');
    }

    // Update all bilingual content elements
    var i18nElements = document.querySelectorAll('[data-en][data-ar]');
    for (var j = 0; j < i18nElements.length; j++) {
      var el = i18nElements[j];
      var text = el.getAttribute('data-' + lang);
      if (text !== null) {
        el.textContent = text;
      }
    }

    // Restore scroll position after content swap
    if (preserveScroll && currentScrollY > 0) {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    }

    window.dispatchEvent(new CustomEvent('burhan:languageChanged', {
      detail: { lang: lang, dir: isRtl ? 'rtl' : 'ltr' }
    }));
  }

  function toggleLanguage() {
    var current = getCurrentLanguage();
    var next = current === 'ar' ? 'en' : 'ar';
    setLanguage(next, true);
  }

  /**
   * initLanguageSystem — Called ONCE by main.js on DOMContentLoaded.
   * Do NOT call this anywhere else.
   */
  function initLanguageSystem() {
    // Apply stored/default language on page load
    var initialLang = getCurrentLanguage();
    setLanguage(initialLang, false);

    // Single delegated click listener for all language toggle controls
    document.addEventListener('click', function (event) {
      var toggleBtn = event.target.closest('[data-lang-toggle]');
      if (!toggleBtn) return;
      event.preventDefault();
      var targetLang = toggleBtn.getAttribute('data-lang-target');
      if (targetLang && SUPPORTED_LANGS.includes(targetLang)) {
        setLanguage(targetLang, true);
      } else {
        toggleLanguage();
      }
    });
  }

  // Expose API — do NOT self-init here
  window.BURHAN = window.BURHAN || {};
  window.BURHAN.language = {
    get: getCurrentLanguage,
    set: setLanguage,
    toggle: toggleLanguage,
    init: initLanguageSystem
  };

})();
