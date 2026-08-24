/* ==========================================================================
   BURHAN | بُرهان — Motion, Cinematic Intro & Educational Environment
   Math (Left) | BURHAN (Center Clean) | Science (Right)
   ========================================================================== */

(function () {
  'use strict';

  var SESSION_KEY = 'burhan_intro_dismissed';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------------------------
     1. CINEMATIC INTRO (Runs on Home page if not dismissed)
  -------------------------------------------------------------------------- */
  function initCinematicIntro() {
    var overlay = document.querySelector('[data-cinematic-intro]');
    if (!overlay) return;
    var hasSeenIntro = sessionStorage.getItem(SESSION_KEY) === 'true';
    if (reducedMotion || hasSeenIntro) { dismissIntro(overlay, false); return; }

    overlay.setAttribute('data-intro-active', 'true');
    var stageQuestion = overlay.querySelector('[data-intro-question]');
    var stageIdentity = overlay.querySelector('[data-intro-identity]');
    var stageTagline  = overlay.querySelector('[data-intro-tagline]');
    var skipBtn       = overlay.querySelector('[data-skip-intro]');

    setTimeout(function () { if (stageQuestion) stageQuestion.classList.add('is-visible'); }, 500);
    setTimeout(function () {
      if (stageQuestion) stageQuestion.classList.add('is-exiting');
      setTimeout(function () {
        if (stageQuestion) stageQuestion.classList.remove('is-visible', 'is-exiting');
        if (stageIdentity) stageIdentity.classList.add('is-visible');
      }, 400);
    }, 2600);
    setTimeout(function () { if (stageTagline) stageTagline.classList.add('is-visible'); }, 3600);
    setTimeout(function () { dismissIntro(overlay, true); }, 6000);

    if (skipBtn) {
      skipBtn.addEventListener('click', function (e) { e.preventDefault(); dismissIntro(overlay, true); });
    }
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape' && !overlay.classList.contains('is-dismissed')) {
        dismissIntro(overlay, true);
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function dismissIntro(overlay, animate) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    if (animate) {
      overlay.classList.add('is-fading');
      setTimeout(function () {
        overlay.classList.add('is-dismissed');
        overlay.setAttribute('style', 'display:none');
        triggerHeroReveal();
      }, 450);
    } else {
      overlay.classList.add('is-dismissed');
      overlay.setAttribute('style', 'display:none');
      triggerHeroReveal();
    }
  }

  /* -------------------------------------------------------------------------
     2. HERO STAGGERED REVEAL
  -------------------------------------------------------------------------- */
  function triggerHeroReveal() {
    var heroSection = document.querySelector('.home-hero');
    if (heroSection) heroSection.classList.add('line-active');
    if (reducedMotion) {
      document.querySelectorAll('[data-reveal-hero]').forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }
    document.querySelectorAll('[data-reveal-hero]').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('is-revealed'); }, i * 120 + 200);
    });
    setTimeout(initHeroCanvas, 400);
  }

  /* -------------------------------------------------------------------------
     3. HERO CANVAS SYSTEM
  -------------------------------------------------------------------------- */
  var heroState = {
    mouseX: 0.5,   // normalized 0–1
    mouseY: 0.5,
    mouseAbsX: -9999,
    mouseAbsY: -9999,
    scrollY: 0,
    currentIntensity: 1.0,
    targetIntensity: 1.0,
    canvasW: 0,
    canvasH: 0,
    raf: null,
    objects: [],
    initialized: false
  };

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function palette() {
    return isDark()
      ? { math: 'rgba(104,130,216,', science: 'rgba(221,163,78,', brass: 'rgba(197,157,85,', neutral: 'rgba(190,185,175,' }
      : { math: 'rgba(46,62,116,',   science: 'rgba(169,118,47,', brass: 'rgba(140,107,51,', neutral: 'rgba(80,75,65,' };
  }

  /* =========================================================================
     DRAWING PRIMITIVES
  ========================================================================== */

  function drawEquation(ctx, text, cx, cy, fontSize, colorStr, alpha) {
    ctx.save();
    ctx.font = '500 ' + fontSize + 'px "IBM Plex Mono", monospace';
    ctx.fillStyle = colorStr + alpha + ')';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  function drawTriangle(ctx, cx, cy, size, colorStr, alpha) {
    var a = size * 0.72, b = size * 0.56;
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.fillStyle   = colorStr + (alpha * 0.06) + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx + a, cy); ctx.lineTo(cx, cy - b);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    var rm = size * 0.1;
    ctx.beginPath();
    ctx.moveTo(cx + rm, cy); ctx.lineTo(cx + rm, cy - rm); ctx.lineTo(cx, cy - rm);
    ctx.stroke();
    ctx.font = '500 ' + Math.floor(size * 0.20) + 'px "IBM Plex Mono", monospace';
    ctx.fillStyle = colorStr + Math.min(alpha * 1.25, 0.95) + ')';
    ctx.textAlign = 'center';
    ctx.fillText('a', cx + a * 0.5, cy + size * 0.15);
    ctx.fillText('b', cx - size * 0.15, cy - b * 0.5);
    ctx.fillText('c', cx + a * 0.46, cy - b * 0.56);
    ctx.restore();
  }

  function drawAxesWithCurve(ctx, cx, cy, size, colorStr, alpha) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.lineWidth = 1.1;
    var hs = size * 0.5, vs = size * 0.48;
    ctx.beginPath(); ctx.moveTo(cx - hs, cy); ctx.lineTo(cx + hs, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + vs * 0.6); ctx.lineTo(cx, cy - vs); ctx.stroke();
    _arrowTip(ctx, cx + hs, cy, false);
    _arrowTip(ctx, cx, cy - vs, true);
    ctx.strokeStyle = colorStr + Math.min(alpha * 1.3, 0.95) + ')';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (var i = 0; i <= 32; i++) {
      var t = (i / 32) * 2 - 1;
      var px = cx + t * hs * 0.88;
      var py = cy - t * t * vs * 0.82;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.font = 'italic 500 ' + Math.floor(size * 0.18) + 'px "IBM Plex Mono", monospace';
    ctx.fillStyle = colorStr + Math.min(alpha * 1.2, 0.95) + ')';
    ctx.textAlign = 'left';
    ctx.fillText('y = x²', cx + hs * 0.3, cy - vs * 0.72);
    ctx.restore();
  }

  function _arrowTip(ctx, x, y, vertical) {
    ctx.save(); ctx.fillStyle = ctx.strokeStyle; var s = 4;
    ctx.beginPath();
    if (vertical) { ctx.moveTo(x,y); ctx.lineTo(x-s,y+s*1.8); ctx.lineTo(x+s,y+s*1.8); }
    else          { ctx.moveTo(x,y); ctx.lineTo(x-s*1.8,y-s); ctx.lineTo(x-s*1.8,y+s); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawCircleR(ctx, cx, cy, radius, colorStr, alpha) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + radius, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '500 ' + Math.floor(radius * 0.55) + 'px "IBM Plex Mono", monospace';
    ctx.fillStyle = colorStr + Math.min(alpha * 1.25, 0.95) + ')';
    ctx.textAlign = 'center';
    ctx.fillText('r', cx + radius * 0.52, cy - radius * 0.2);
    ctx.restore();
  }

  function drawAngleDiagram(ctx, cx, cy, size, colorStr, alpha) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.lineWidth = 1.1;
    var len = size * 0.56, ang = Math.PI / 3;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+len, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+len*Math.cos(ang), cy-len*Math.sin(ang)); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, len*0.3, -ang, 0); ctx.stroke();
    ctx.font = 'italic 500 ' + Math.floor(size * 0.22) + 'px serif';
    ctx.fillStyle = colorStr + Math.min(alpha * 1.2, 0.95) + ')';
    ctx.textAlign = 'left';
    ctx.fillText('60°', cx + len * 0.34, cy - 5);
    ctx.restore();
  }

  function drawNumberLine(ctx, cx, cy, width, colorStr, alpha) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.lineWidth = 1.0;
    ctx.beginPath(); ctx.moveTo(cx - width*0.5, cy); ctx.lineTo(cx + width*0.5, cy); ctx.stroke();
    ctx.font = '500 ' + Math.floor(width * 0.1) + 'px "IBM Plex Mono", monospace';
    ctx.fillStyle = colorStr + Math.min(alpha * 1.2, 0.95) + ')';
    ctx.textAlign = 'center';
    for (var i = 0; i <= 5; i++) {
      var tx = cx - width*0.5 + (i/5)*width;
      ctx.beginPath(); ctx.moveTo(tx, cy-4); ctx.lineTo(tx, cy+4); ctx.stroke();
      ctx.fillText('' + (i-2), tx, cy + 15);
    }
    ctx.restore();
  }

  function drawBarGraph(ctx, cx, cy, size, colorStr, alpha) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.fillStyle   = colorStr + (alpha * 0.15) + ')';
    ctx.lineWidth = 1.0;
    var bars = [0.52, 0.78, 0.42, 0.91, 0.63];
    var barW = size * 0.14, maxH = size * 0.58;
    var startX = cx - size * 0.46;
    ctx.beginPath(); ctx.moveTo(startX-4, cy-maxH-10); ctx.lineTo(startX-4, cy); ctx.lineTo(startX + bars.length*(barW+4)+4, cy); ctx.stroke();
    bars.forEach(function(h, idx) {
      var bx = startX + idx*(barW+4), bh = h*maxH;
      ctx.fillRect(bx, cy-bh, barW, bh);
      ctx.strokeRect(bx, cy-bh, barW, bh);
    });
    ctx.restore();
  }

  /* Science Primitives */
  function drawWave(ctx, cx, cy, width, amplitude, colorStr, alpha, phase) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var i = 0; i <= 60; i++) {
      var t = i / 60;
      var wx = cx - width * 0.5 + t * width;
      var wy = cy + Math.sin(t * Math.PI * 3 + phase) * amplitude;
      i === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawAtom(ctx, cx, cy, size, colorStr, alpha, phase) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.fillStyle   = colorStr + alpha + ')';
    ctx.lineWidth = 1.0;
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy, size * 0.46, size * 0.19, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, size * 0.46, size * 0.19, Math.PI / 3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawMolecule(ctx, cx, cy, size, colorStr, alpha, formula) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.fillStyle   = colorStr + alpha + ')';
    ctx.lineWidth = 1.1;
    var r = size * 0.14, bl = size * 0.38;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2); ctx.fill();
    var h1x = cx + Math.cos(Math.PI * 0.83) * bl, h1y = cy + Math.sin(Math.PI * 0.83) * bl;
    var h2x = cx + Math.cos(Math.PI * 0.17) * bl, h2y = cy + Math.sin(Math.PI * 0.17) * bl;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(h1x,h1y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(h2x,h2y); ctx.stroke();
    ctx.beginPath(); ctx.arc(h1x, h1y, r*0.75, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(h2x, h2y, r*0.75, 0, Math.PI*2); ctx.fill();
    ctx.font = '500 ' + Math.floor(size * 0.22) + 'px "IBM Plex Mono", monospace';
    ctx.fillStyle = colorStr + Math.min(alpha * 1.3, 0.95) + ')';
    ctx.textAlign = 'center';
    ctx.fillText(formula, cx, cy + size * 0.48);
    ctx.restore();
  }

  function drawDNA(ctx, cx, cy, height, colorStr, alpha, phase) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.lineWidth = 1.1;
    var w = height * 0.34, steps = 18;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = i/steps;
      var px = cx + Math.sin(t*Math.PI*3.5 + phase) * w;
      var py = cy - height*0.5 + t*height;
      i===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawElementBlock(ctx, cx, cy, size, symbol, number, colorStr, alpha) {
    ctx.save();
    ctx.strokeStyle = colorStr + alpha + ')';
    ctx.strokeRect(cx-size*0.5, cy-size*0.5, size, size);
    ctx.fillStyle = colorStr + Math.min(alpha * 1.25, 0.95) + ')';
    ctx.textAlign = 'center';
    ctx.font = '500 ' + Math.floor(size*0.22) + 'px "IBM Plex Mono", monospace';
    ctx.fillText(''+number, cx, cy - size*0.08);
    ctx.font = 'bold ' + Math.floor(size*0.38) + 'px "IBM Plex Sans", sans-serif';
    ctx.fillText(symbol, cx, cy + size*0.26);
    ctx.restore();
  }

  /* =========================================================================
     PURE MATHEMATICS MANIFEST — Dedicated to mathematics.html
  ========================================================================== */
  var MATH_MANIFEST = [
    { type:'math_eq',  text:'x² + 5x + 6 = 0',   x:0.04, y:0.12, size:15, layer:2, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'(x + 2)(x + 3) = 0', x:0.18, y:0.16, size:14, layer:1, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'axes_curve',                         x:0.10, y:0.28, size:110, layer:0, colorKey:'math',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'a² + b² = c²',      x:0.06, y:0.38, size:15, layer:2, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'angle',                              x:0.24, y:0.34, size:65,  layer:1, colorKey:'math',  vDir:'up', rotSpeed:0.001 },
    { type:'math_eq',  text:'Δx = x₂ - x₁',      x:0.16, y:0.48, size:14, layer:0, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'triangle',                           x:0.08, y:0.58, size:85,  layer:1, colorKey:'math',  vDir:'up', rotSpeed:0.0008 },
    { type:'math_eq',  text:'y = mx + b',         x:0.22, y:0.62, size:15, layer:2, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'circle_r',                           x:0.12, y:0.72, size:36,  layer:2, colorKey:'brass', vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'f(x) = x²',          x:0.05, y:0.80, size:15, layer:1, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'∫ x dx = ½x² + C',   x:0.20, y:0.84, size:14, layer:2, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'lim x→∞',           x:0.08, y:0.92, size:14, layer:0, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'π ≈ 3.14159',       x:0.32, y:0.09, size:13, layer:0, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'∑ n²',              x:0.42, y:0.18, size:14, layer:1, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'∴  Q.E.D.',         x:0.35, y:0.30, size:13, layer:0, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'ΔABC',              x:0.48, y:0.42, size:14, layer:1, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'sin θ',             x:0.30, y:0.54, size:14, layer:0, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'cos θ',             x:0.44, y:0.68, size:14, layer:1, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'tan θ',             x:0.32, y:0.76, size:13, layer:0, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'∞',                 x:0.38, y:0.82, size:18, layer:0, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'2 × 5 = 10',        x:0.82, y:0.14, size:15, layer:2, colorKey:'math',   vDir:'down', rotSpeed:0 },
    { type:'math_eq',  text:'12 ÷ 3 = 4',        x:0.88, y:0.22, size:15, layer:1, colorKey:'math',   vDir:'down', rotSpeed:0 },
    { type:'number_line',                        x:0.84, y:0.32, size:120, layer:0, colorKey:'math',  vDir:'down', rotSpeed:0 },
    { type:'math_eq',  text:'√144 = 12',         x:0.78, y:0.40, size:15, layer:1, colorKey:'math',   vDir:'down', rotSpeed:0 },
    { type:'bar_graph',                          x:0.86, y:0.52, size:80,  layer:2, colorKey:'math',  vDir:'down', rotSpeed:0 }
  ];

  /* =========================================================================
     PURE SCIENCE MANIFEST — Dedicated to science.html
  ========================================================================== */
  var SCIENCE_MANIFEST = [
    { type:'wave',                              x:0.06, y:0.12, size:110, layer:2, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'molecule', formula:'H2O',           x:0.18, y:0.16, size:76,  layer:1, colorKey:'science',vDir:'up', rotSpeed:0.001 },
    { type:'math_eq',  text:'F = ma',            x:0.10, y:0.28, size:16,  layer:0, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'atom',                              x:0.08, y:0.38, size:72,  layer:2, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'E = mc²',           x:0.22, y:0.46, size:16,  layer:1, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'dna',                               x:0.07, y:0.58, size:85,  layer:0, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'v = d/t',           x:0.16, y:0.68, size:15,  layer:2, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'element_block', symbol:'Fe', number:26, x:0.12, y:0.78, size:48, layer:1, colorKey:'neutral',vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'c ≈ 3.0×10⁸ m/s',   x:0.32, y:0.09, size:13,  layer:0, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'PV = nRT',          x:0.42, y:0.18, size:14,  layer:1, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'molecule', formula:'CO2',           x:0.35, y:0.30, size:70,  layer:0, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'λ = h/p',           x:0.48, y:0.42, size:14,  layer:1, colorKey:'brass',  vDir:'up', rotSpeed:0 },
    { type:'math_eq',  text:'KE = ½mv²',         x:0.44, y:0.68, size:14,  layer:1, colorKey:'science',vDir:'up', rotSpeed:0 },
    { type:'element_block', symbol:'Cu', number:29, x:0.82, y:0.14, size:46, layer:2, colorKey:'science',vDir:'down', rotSpeed:0 },
    { type:'molecule', formula:'NaCl',          x:0.88, y:0.24, size:72,  layer:1, colorKey:'science',vDir:'down', rotSpeed:0.001 },
    { type:'math_eq',  text:'W = F·d',           x:0.78, y:0.38, size:15,  layer:1, colorKey:'science',vDir:'down', rotSpeed:0 },
    { type:'wave',                              x:0.84, y:0.52, size:95,  layer:2, colorKey:'science',vDir:'down', rotSpeed:0 },
    { type:'element_block', symbol:'O', number:8, x:0.82, y:0.88, size:44, layer:1, colorKey:'neutral',vDir:'down', rotSpeed:0 }
  ];

  /* Home Page Mixed Manifest (Preserved for Home) */
  var HOME_MANIFEST = [
    { type:'math_eq',  text:'x² + 5x + 6 = 0',  x:0.04, y:0.12, size:16, layer:2, colorKey:'math',   vDir:'up', rotSpeed:0 },
    { type:'axes_curve',                        x:0.10, y:0.28, size:115, layer:0, colorKey:'math',  vDir:'up', rotSpeed:0 },
    { type:'triangle',                          x:0.08, y:0.58, size:90,  layer:1, colorKey:'math',  vDir:'up', rotSpeed:0.0008 },
    { type:'atom',                              x:0.90, y:0.32, size:76,  layer:0, colorKey:'science',vDir:'down', rotSpeed:0 },
    { type:'physics_eq', text:'F = ma',          x:0.78, y:0.40, size:16, layer:1, colorKey:'science',vDir:'down', rotSpeed:0 },
    { type:'wave',                              x:0.84, y:0.52, size:110, layer:2, colorKey:'science',vDir:'down', rotSpeed:0 },
    { type:'molecule', formula:'H2O',           x:0.88, y:0.64, size:76,  layer:1, colorKey:'science',vDir:'down', rotSpeed:0.0012 }
  ];

  /* Refined, elegant opacities (0.10–0.25) */
  var LAYER_ALPHA_REFINED = [
    { min: 0.10, max: 0.16 },
    { min: 0.14, max: 0.20 },
    { min: 0.18, max: 0.25 }
  ];

  var PARALLAX  = [0.006, 0.013, 0.022];
  var SCROLL_SPD = [0.08, 0.16, 0.26];
  var DRIFT_BASE = [0.05, 0.08, 0.12];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function buildObjects(canvasW, canvasH) {
    var isMobile = canvasW < 768;
    var pageAttr = document.body.getAttribute('data-page');
    var isMathPage = pageAttr === 'mathematics';
    var isSciencePage = pageAttr === 'science';
    heroState.objects = [];

    var currentManifest = isMathPage ? MATH_MANIFEST : (isSciencePage ? SCIENCE_MANIFEST : HOME_MANIFEST);
    var currentAlphaRange = LAYER_ALPHA_REFINED;

    currentManifest.forEach(function (def, idx) {
      if (isMobile && def.layer === 0 && (def.type === 'axes_curve' || def.type === 'bar_graph' || def.type === 'wave')) return;
      if (isMobile && idx % 2 === 0 && def.layer < 2) return;

      var range = currentAlphaRange[def.layer];
      var speed = DRIFT_BASE[def.layer];
      var vySign = def.vDir === 'up' ? -1 : 1;

      var jitterX = (Math.random() - 0.5) * 0.03;
      var jitterY = (Math.random() - 0.5) * 0.04;

      heroState.objects.push({
        type:        def.type,
        colorKey:    def.colorKey,
        size:        def.size,
        layer:       def.layer,
        x:           (def.x + jitterX) * canvasW,
        y:           (def.y + jitterY) * canvasH,
        vDir:        def.vDir,
        vx:          (Math.random() - 0.5) * speed * 0.08,
        vy:          vySign * rand(speed * 0.05, speed * 0.14),
        rotSpeed:    def.rotSpeed || 0,
        rotation:    rand(0, Math.PI * 2),
        alpha:       rand(range.min, range.max),
        phase:       rand(0, Math.PI * 2),
        phaseSpeed:  rand(0.006, 0.016),
        text:        def.text || '',
        formula:     def.formula || '',
        symbol:      def.symbol || '',
        number:      def.number || 0,
        parallax:    PARALLAX[def.layer],
        scrollFactor:SCROLL_SPD[def.layer]
      });
    });
  }

  /* Section intensity calculator */
  function getCurrentSectionIntensity() {
    var pageAttr = document.body.getAttribute('data-page');
    if (pageAttr === 'mathematics' || pageAttr === 'science') return 1.0;

    var scrollY = window.scrollY || window.pageYOffset || 0;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return 1.0;

    var cta = document.querySelector('.closing-cta-section');
    var vpCenter = scrollY + window.innerHeight * 0.5;

    if (cta && vpCenter >= cta.offsetTop) {
      return 0.85;
    } else {
      return 1.0;
    }
  }

  /* -------------------------------------------------------------------------
     ANIMATION LOOP
  -------------------------------------------------------------------------- */
  function initHeroCanvas() {
    if (heroState.initialized) return;
    var canvas = document.getElementById('heroCanvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    heroState.initialized = true;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      heroState.canvasW = canvas.width;
      heroState.canvasH = canvas.height;
    }

    function animate() {
      ctx.clearRect(0, 0, heroState.canvasW, heroState.canvasH);

      var targetIntensity = getCurrentSectionIntensity();
      heroState.currentIntensity += (targetIntensity - heroState.currentIntensity) * 0.05;

      var mox = (heroState.mouseX - 0.5) * 2;
      var moy = (heroState.mouseY - 0.5) * 2;
      var sY  = heroState.scrollY;

      [0, 1, 2].forEach(function (layer) {
        heroState.objects.forEach(function (obj) {
          if (obj.layer !== layer) return;

          obj.x += obj.vx;
          obj.y += obj.vy;
          obj.phase += obj.phaseSpeed;
          obj.rotation += obj.rotSpeed;

          var m = 160;
          if (obj.x < -m) obj.x = heroState.canvasW + m;
          if (obj.x > heroState.canvasW + m) obj.x = -m;
          if (obj.y < -m) obj.y = heroState.canvasH + m;
          if (obj.y > heroState.canvasH + m) obj.y = -m;

          var px = obj.x + mox * obj.parallax * heroState.canvasW;
          var py = obj.y + moy * obj.parallax * heroState.canvasH;

          var scrollOff = obj.vDir === 'up' ? -sY * obj.scrollFactor : sY * obj.scrollFactor * 0.6;
          py = ((py + scrollOff) % heroState.canvasH + heroState.canvasH) % heroState.canvasH;

          var dist = Math.hypot(heroState.mouseAbsX - px, heroState.mouseAbsY - py);
          var proxBoost = Math.max(0, 1 - dist / 150) * 0.25;

          var pulseAlpha = obj.alpha * (0.85 + 0.15 * Math.sin(obj.phase));
          var finalAlpha = Math.min(pulseAlpha + proxBoost * obj.alpha, 0.30) * heroState.currentIntensity;

          var p = palette();
          var colorStr = p[obj.colorKey] || (document.body.getAttribute('data-page') === 'science' ? p.science : p.math);

          ctx.save();
          ctx.translate(px, py);
          if (obj.rotSpeed !== 0) ctx.rotate(obj.rotation);

          switch (obj.type) {
            case 'math_eq':
              if (obj.rotSpeed !== 0) { ctx.restore(); ctx.save(); ctx.translate(px, py); }
              drawEquation(ctx, obj.text, 0, 0, obj.size, colorStr, finalAlpha);
              break;
            case 'axes_curve':
              drawAxesWithCurve(ctx, 0, 0, obj.size, colorStr, finalAlpha);
              break;
            case 'triangle':
              drawTriangle(ctx, 0, 0, obj.size, colorStr, finalAlpha);
              break;
            case 'circle_r':
              drawCircleR(ctx, 0, 0, obj.size, colorStr, finalAlpha);
              break;
            case 'angle':
              drawAngleDiagram(ctx, 0, 0, obj.size, colorStr, finalAlpha);
              break;
            case 'number_line':
              ctx.restore(); ctx.save(); ctx.translate(px, py);
              drawNumberLine(ctx, 0, 0, obj.size, colorStr, finalAlpha);
              break;
            case 'bar_graph':
              ctx.restore(); ctx.save(); ctx.translate(px, py);
              drawBarGraph(ctx, 0, 0, obj.size, colorStr, finalAlpha);
              break;
            case 'wave':
              ctx.restore(); ctx.save(); ctx.translate(px, py);
              drawWave(ctx, 0, 0, obj.size, obj.size * 0.19, colorStr, finalAlpha, obj.phase);
              break;
            case 'atom':
              drawAtom(ctx, 0, 0, obj.size, colorStr, finalAlpha, obj.phase);
              break;
            case 'molecule':
              drawMolecule(ctx, 0, 0, obj.size, colorStr, finalAlpha, obj.formula);
              break;
            case 'dna':
              drawDNA(ctx, 0, 0, obj.size, colorStr, finalAlpha, obj.phase);
              break;
            case 'element_block':
              drawElementBlock(ctx, 0, 0, obj.size, obj.symbol, obj.number, colorStr, finalAlpha);
              break;
          }
          ctx.restore();
        });
      });

      heroState.raf = requestAnimationFrame(animate);
    }

    resize();
    buildObjects(heroState.canvasW, heroState.canvasH);
    animate();

    window.addEventListener('resize', function () {
      resize();
      buildObjects(heroState.canvasW, heroState.canvasH);
    });

    document.addEventListener('mousemove', function (e) {
      heroState.mouseAbsX = e.clientX;
      heroState.mouseAbsY = e.clientY;
      heroState.mouseX = e.clientX / window.innerWidth;
      heroState.mouseY = e.clientY / window.innerHeight;
    });

    document.addEventListener('mouseleave', function () {
      heroState.mouseX = 0.5;
      heroState.mouseY = 0.5;
      heroState.mouseAbsX = -9999;
      heroState.mouseAbsY = -9999;
    });

    window.addEventListener('scroll', function () {
      heroState.scrollY = window.scrollY || window.pageYOffset || 0;
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(heroState.raf);
      else animate();
    });
  }

  /* -------------------------------------------------------------------------
     4. WORLD PANEL MINI-CANVAS
  -------------------------------------------------------------------------- */
  function initWorldCanvases() {
    if (reducedMotion) return;
    ['math', 'science'].forEach(function (world) {
      var canvas = document.querySelector('[data-world-canvas="' + world + '"]');
      if (canvas && canvas.getContext) initPanelCanvas(canvas, world);
    });
  }

  function initPanelCanvas(canvas, world) {
    var ctx = canvas.getContext('2d');
    var particles = [], raf = null, active = false;
    var texts = world === 'math'
      ? ['2×5=10', '12÷3=4', 'x²+5x+6=0', '√144=12', 'a²+b²=c²', 'y=mx+b']
      : ['F=ma', 'E=mc²', 'H₂O', 'CO₂', 'v=d/t', 'KE=½mv²'];

    function color() {
      return world === 'math'
        ? (isDark() ? 'rgba(104,130,216,' : 'rgba(46,62,116,')
        : (isDark() ? 'rgba(221,163,78,'  : 'rgba(169,118,47,');
    }
    function resize() {
      canvas.width  = canvas.offsetWidth  || 400;
      canvas.height = canvas.offsetHeight || 340;
    }
    function init() {
      resize(); particles = [];
      for (var i = 0; i < 10; i++) {
        particles.push({
          x: Math.random() * canvas.width, y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.2,
          text: texts[Math.floor(Math.random() * texts.length)],
          size: 12 + Math.random() * 5,
          opacity: 0, maxOpacity: 0.18 + Math.random() * 0.12,
          phase: Math.random() * Math.PI * 2, phaseSpeed: 0.006 + Math.random() * 0.012
        });
      }
    }
    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var c = color();
      particles.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.phase += p.phaseSpeed;
        if (p.x < -30) p.x = canvas.width + 30;
        if (p.x > canvas.width + 30) p.x = -30;
        if (p.y < -30) p.y = canvas.height + 30;
        if (p.y > canvas.height + 30) p.y = -30;
        if (p.opacity < p.maxOpacity) p.opacity += 0.003;
        ctx.save();
        ctx.font = '500 ' + p.size + 'px "IBM Plex Mono", monospace';
        ctx.fillStyle = c + p.opacity * (0.5 + 0.5 * Math.sin(p.phase)) + ')';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });
      raf = requestAnimationFrame(drawFrame);
    }
    var panel = canvas.closest('.world-panel');
    if (panel) {
      panel.addEventListener('mouseenter', function () {
        if (!active) { active = true; init(); drawFrame(); }
      });
      panel.addEventListener('mouseleave', function () {
        active = false;
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  }

  /* -------------------------------------------------------------------------
     5. PHILOSOPHY SECTION WORD REVEAL
  -------------------------------------------------------------------------- */
  function formatPhilosophyQuote() {
    var quoteEl = document.querySelector('[data-philosophy-quote]');
    if (!quoteEl) return;
    var text = quoteEl.textContent.trim();
    if (!text) return;
    quoteEl.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="word" style="transition-delay:' + (i * 0.05 + 0.2) + 's">' + w + '</span>';
    }).join(' ');
  }

  /* -------------------------------------------------------------------------
     6. SCROLL REVEAL
  -------------------------------------------------------------------------- */
  function initScrollReveal() {
    var targets = document.querySelectorAll('[data-reveal],[data-reveal-slide],[data-reveal-scale],[data-philosophy-section]');
    if (reducedMotion) { targets.forEach(function (el) { el.classList.add('is-revealed'); }); return; }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          setTimeout(function () { el.classList.add('is-revealed'); },
                     parseInt(el.getAttribute('data-reveal-delay') || '0', 10));
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { observer.observe(el); });
  }

  /* -------------------------------------------------------------------------
     7. WORLD PANEL TILT
  -------------------------------------------------------------------------- */
  function initWorldPanelInteraction() {
    if (reducedMotion) return;
    document.querySelectorAll('.world-panel').forEach(function (panel) {
      panel.addEventListener('mousemove', function (e) {
        var rect = panel.getBoundingClientRect();
        panel.style.setProperty('--panel-tilt-x', (((e.clientY-rect.top)/rect.height-0.5)*4).toFixed(2)+'deg');
        panel.style.setProperty('--panel-tilt-y', (((e.clientX-rect.left)/rect.width-0.5)*6).toFixed(2)+'deg');
      });
      panel.addEventListener('mouseleave', function () {
        panel.style.setProperty('--panel-tilt-x','0deg');
        panel.style.setProperty('--panel-tilt-y','0deg');
      });
    });
  }

  window.addEventListener('burhan:languageChanged', function () { setTimeout(formatPhilosophyQuote, 50); });

  /* -------------------------------------------------------------------------
     PUBLIC API
  -------------------------------------------------------------------------- */
  window.BURHAN = window.BURHAN || {};
  window.BURHAN.motion = {
    init: function () {
      var hasSeenIntro = sessionStorage.getItem(SESSION_KEY) === 'true';
      formatPhilosophyQuote();
      initCinematicIntro();
      if (reducedMotion || hasSeenIntro) triggerHeroReveal();
      initScrollReveal();
      initWorldPanelInteraction();
      initWorldCanvases();
    },
    dismissIntro: dismissIntro
  };

})();
