/* app.js — the survey engine shared by both variants. Plain ES5-style JS (no build, no framework) so it runs in every in-app browser.
   A variant (assets/content.js) only supplies data: the step list, per-step options, copy, brief builder and a `features` object.
   Flow: question / information screens -> short "compose" beat -> result with a copyable description
   -> CTA to MuseGen with the original query string (utm_*, ttclid, …) forwarded untouched.
   Every picture is a short looping clip of an AI-generated person: lazy-attached, played only while visible,
   poster-only for reduced-motion / Save-Data / "Pause animations". */
(function () {
  'use strict';

  var V = window.MGSV, S = window.MGSV_SHARED, CFG = window.MGPL || {};
  var F = V.features || {}, C = V.copy, STEPS = V.steps;
  var QTYPES = { cards: 1, list: 1, rows: 1, formats: 1 };
  var KEY = 'mgsv:' + V.variant;
  var MOTION_KEY = 'mgsv:motion';
  var CLIPDIR = 'assets/clips/';
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var SAVE_DATA = !!(navigator.connection && navigator.connection.saveData);
  /* Global Privacy Control: a US browser-level opt-out signal (honored for California and other states).
     When it is on, no ad/analytics script is loaded even if config.js has ids. */
  var GPC = navigator.globalPrivacyControl === true;

  var app = document.getElementById('app');
  var backBtn = document.getElementById('back');
  var countEl = document.getElementById('count');
  var fillEl = document.getElementById('fill');
  var barEl = document.getElementById('bar');
  var chipsEl = document.getElementById('chips');
  var liveEl = document.getElementById('live');
  var motionBtn = document.getElementById('motion');

  /* view: 's' = a step screen (state.id), 'c' = compose beat, 'r' = result */
  var state = { a: {}, fmt: null, view: 's', id: STEPS[0].id };
  var timers = [];
  var locked = false;
  var motionOff = false;
  var io = null;

  /* ---------- tiny helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimer() { while (timers.length) { clearTimeout(timers.pop()); } locked = false; }
  function world() { return S.byId(S.WORLDS, state.a.world); }
  function fill(text) { var wo = world(); return String(text || '').replace(/\{world\}/g, wo ? wo.name : 'your world'); }

  /* ---------- the path (steps may be conditional; today every step is shown) ---------- */
  function visible(s, a) {
    if (!s.showIf) { return true; }
    for (var k in s.showIf) {
      if (Object.prototype.hasOwnProperty.call(s.showIf, k) && s.showIf[k].indexOf(a[k]) < 0) { return false; }
    }
    return true;
  }
  function path(a) {
    var out = [];
    for (var i = 0; i < STEPS.length; i++) { if (visible(STEPS[i], a)) { out.push(STEPS[i]); } }
    return out;
  }
  function stepIndex(id) {
    var P = path(state.a);
    for (var i = 0; i < P.length; i++) { if (P[i].id === id) { return i; } }
    return -1;
  }
  function stepById(id) { for (var i = 0; i < STEPS.length; i++) { if (STEPS[i].id === id) { return STEPS[i]; } } return null; }
  function optionsOf(s, a) { return s.optionsBy ? (s.optionsBy[a.world] || []) : (s.options || []); }
  function isQ(s) { return QTYPES[s.type] === 1; }
  function valid(s, a, id) { return !!S.byId(optionsOf(s, a), id); }
  function complete(a) {
    var P = path(a);
    for (var i = 0; i < P.length; i++) { if (isQ(P[i]) && !valid(P[i], a, a[P[i].id])) { return false; } }
    return true;
  }
  function firstOpen(a) {
    var P = path(a);
    for (var i = 0; i < P.length; i++) { if (isQ(P[i]) && !valid(P[i], a, a[P[i].id])) { return i; } }
    return P.length - 1;
  }
  function fmtStep() { return stepById('fmt'); }
  function getFmt() {
    if (fmtStep()) { return state.a.fmt || V.defaultFmt(state.a); }
    return state.fmt || V.defaultFmt(state.a);
  }

  /* ---------- session persistence (same tab + same ad URL only) ---------- */
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify({ qs: location.search, a: state.a, fmt: state.fmt })); } catch (e) { /* private mode etc. */ }
  }
  function loadAnswers() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (!s || s.qs !== location.search || !s.a) { return { a: {}, fmt: null }; }
      var out = {}, P = path(out);
      for (var i = 0; i < P.length; i++) {
        if (isQ(P[i]) && valid(P[i], out, s.a[P[i].id])) { out[P[i].id] = s.a[P[i].id]; }
      }
      return { a: out, fmt: S.byId(S.FORMATS, s.fmt) ? s.fmt : null };
    } catch (e) { return { a: {}, fmt: null }; }
  }

  /* ---------- analytics (all OFF unless config.js sets an id, and never when GPC is on) ---------- */
  function loadTikTok(code) {
    var w = window, t = 'ttq';
    w.TiktokAnalyticsObject = t;
    var ttq = w[t] = w[t] || [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (o, m) { o[m] = function () { o.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < ttq.methods.length; i++) { ttq.setAndDefer(ttq, ttq.methods[i]); }
    ttq.instance = function (id) {
      var e = ttq._i[id] || [];
      for (var n = 0; n < ttq.methods.length; n++) { ttq.setAndDefer(e, ttq.methods[n]); }
      return e;
    };
    ttq.load = function (id, opts) {
      var src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = src;
      ttq._t = ttq._t || {}; ttq._t[id] = +new Date();
      ttq._o = ttq._o || {}; ttq._o[id] = opts || {};
      var s = document.createElement('script');
      s.type = 'text/javascript'; s.async = true; s.src = src + '?sdkid=' + id + '&lib=' + t;
      var f = document.getElementsByTagName('script')[0];
      f.parentNode.insertBefore(s, f);
    };
    ttq.load(code);
    ttq.page();
  }
  function loadGA(id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', id);
  }
  function track(name, data) {
    data = data || {};
    data.variant = V.variant;
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name, pl: data }); } catch (e) { /* ignore */ }
    try { if (CFG.tiktokPixel && !GPC && window.ttq) { window.ttq.track(name, data); } } catch (e) { /* ignore */ }
    try { if (CFG.ga4 && !GPC && window.gtag) { window.gtag('event', name, data); } } catch (e) { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('mgsv:event', { detail: { name: name, data: data } })); } catch (e) { /* ignore */ }
  }

  /* ---------- destination URL: original query forwarded byte-for-byte ---------- */
  function hasKey(raw, k) {
    var s = '&' + raw + '&';
    return s.indexOf('&' + k + '=') > -1 || s.indexOf('&' + k + '&') > -1;
  }
  function withQuery(base, extra) {
    var raw = CFG.forwardQuery === false ? '' : String(location.search || '').replace(/^\?/, '').replace(/^&+|&+$/g, '');
    var parts = raw ? [raw] : [];
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k) && extra[k] !== undefined && !hasKey(raw, k)) {
          parts.push(k + '=' + encodeURIComponent(extra[k]));
        }
      }
    }
    if (!parts.length) { return base; }
    return base + (base.indexOf('?') > -1 ? '&' : '?') + parts.join('&');
  }
  function picks() { return CFG.appendPicks === false ? null : V.picks(state.a, getFmt()); }

  /* ---------- motion: person clips play only while visible; poster-only when motion is off ---------- */
  function inView(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var vw = window.innerWidth || document.documentElement.clientWidth;
    return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  }
  function playVideo(v) {
    if (motionOff) { return; }
    if (!v.getAttribute('src')) { v.setAttribute('src', v.getAttribute('data-src')); }
    var p;
    try { p = v.play(); } catch (e) { p = null; }
    if (p && p.catch) { p.catch(function () { /* autoplay blocked (e.g. Low Power Mode): the poster stays */ }); }
  }
  function pauseVideo(v) { try { v.pause(); } catch (e) { /* ignore */ } }
  function releaseMedia() {
    if (io) { io.disconnect(); io = null; }
    var vs = app.querySelectorAll('video');
    for (var k = 0; k < vs.length; k++) {
      pauseVideo(vs[k]);
      if (vs[k].getAttribute('src')) { vs[k].removeAttribute('src'); try { vs[k].load(); } catch (e) { /* ignore */ } }
    }
  }
  function mountMedia() {
    var vs = app.querySelectorAll('video.clip'), k;
    for (k = 0; k < vs.length; k++) {
      vs[k].muted = true; vs[k].defaultMuted = true; vs[k].loop = true; vs[k].playsInline = true;
      vs[k].setAttribute('playsinline', ''); vs[k].setAttribute('webkit-playsinline', '');
    }
    if (!('IntersectionObserver' in window)) { for (k = 0; k < vs.length; k++) { playVideo(vs[k]); } return; }
    io = new IntersectionObserver(function (entries) {
      for (var j = 0; j < entries.length; j++) {
        if (entries[j].isIntersecting) { playVideo(entries[j].target); } else { pauseVideo(entries[j].target); }
      }
    }, { rootMargin: '80px 0px', threshold: 0.15 });
    for (k = 0; k < vs.length; k++) { io.observe(vs[k]); }
  }
  function syncMotionButton() {
    document.documentElement.classList.toggle('is-still', motionOff);
    if (!motionBtn) { return; }
    motionBtn.textContent = motionOff ? C.motionPlay : C.motionPause;
    motionBtn.setAttribute('aria-pressed', motionOff ? 'true' : 'false');
  }
  function setMotion(off, remember) {
    motionOff = off;
    if (remember) { try { sessionStorage.setItem(MOTION_KEY, off ? 'off' : 'on'); } catch (e) { /* ignore */ } }
    syncMotionButton();
    var vs = app.querySelectorAll('video.clip');
    for (var k = 0; k < vs.length; k++) {
      if (off) { pauseVideo(vs[k]); } else if (inView(vs[k])) { playVideo(vs[k]); }
    }
  }
  function initMotion() {
    var pref = null;
    try { pref = sessionStorage.getItem(MOTION_KEY); } catch (e) { pref = null; }
    motionOff = pref === 'off' ? true : pref === 'on' ? false : (REDUCED || SAVE_DATA);
    syncMotionButton();
  }
  document.addEventListener('visibilitychange', function () {
    var vs = app.querySelectorAll('video.clip');
    for (var k = 0; k < vs.length; k++) {
      if (document.hidden) { pauseVideo(vs[k]); } else if (!motionOff && inView(vs[k])) { playVideo(vs[k]); }
    }
  });

  /* iOS Low Power Mode (and a few WebViews) refuse autoplay until the first touch: retry once or twice on a real gesture. */
  var kicks = 0;
  function kickPlayback() {
    if (motionOff || kicks > 2) { return; }
    kicks++;
    var vs = app.querySelectorAll('video.clip');
    for (var k = 0; k < vs.length; k++) { if (vs[k].paused && inView(vs[k])) { playVideo(vs[k]); } }
  }
  document.addEventListener('touchend', kickPlayback, { passive: true });
  document.addEventListener('pointerdown', kickPlayback, { passive: true });

  /* Warm the next screen: posters are tiny, so fetch them while the person is still choosing. */
  function warmImage(url) { try { var im = new Image(); im.decoding = 'async'; im.src = url; } catch (e) { /* ignore */ } }
  function prefetchNext() {
    if (state.view !== 's') { return; }
    var P = path(state.a), i = stepIndex(state.id), nx = P[i + 1], k;
    if (nx) {
      if (isQ(nx)) {
        var o = optionsOf(nx, state.a);
        for (k = 0; k < o.length; k++) { if (o[k].clip) { warmImage(CLIPDIR + o[k].clip + '.jpg'); } }
      } else if (nx.type === 'samples') {
        for (k = 0; k < nx.items.length; k++) { warmImage(CLIPDIR + nx.items[k].tall + '.jpg'); }
      }
    }
    var wo = world();
    if (wo) { warmImage(CLIPDIR + wo.tall + '.jpg'); }
  }
  function warmResultClip() {
    var wo = world();
    if (!wo || motionOff || !window.fetch) { return; }
    try { window.fetch(CLIPDIR + wo.tall + '.mp4', { credentials: 'same-origin' }).catch(function () { /* ignore */ }); } catch (e) { /* ignore */ }
  }

  /* ---------- icons ---------- */
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 7.6"/></svg>';
  var AI = '<span class="ai" aria-hidden="true">AI</span>';

  /* ---------- option renderers (every picture is a person clip) ---------- */
  function clipEl(id, cls) {
    return '<video class="clip' + (cls ? ' ' + cls : '') + '" muted loop playsinline webkit-playsinline preload="none" disablepictureinpicture disableremoteplayback tabindex="-1" aria-hidden="true"' +
      ' poster="' + CLIPDIR + id + '.jpg" data-src="' + CLIPDIR + id + '.mp4"></video>';
  }
  function attr(o, i, sel, cls) {
    return 'type="button" class="' + cls + (sel ? ' is-on' : '') + '" role="radio" aria-checked="' + (sel ? 'true' : 'false') + '" data-id="' + esc(o.id) + '" style="--i:' + i + '"';
  }
  function optCard(o, i, sel) {
    return '<button ' + attr(o, i, sel, 'card pcard') + '>' +
      '<span class="media">' + clipEl(o.clip) + AI + '<span class="tick">' + TICK + '</span></span>' +
      '<span class="pcard__label"><b>' + esc(o.name) + '</b>' + (o.sub ? '<i>' + esc(o.sub) + '</i>' : '') + '</span></button>';
  }
  function optList(o, i, sel) {
    return '<button ' + attr(o, i, sel, 'card lrow') + '>' +
      '<span class="lrow__emo" aria-hidden="true">' + esc(o.emoji || '') + '</span>' +
      '<span class="lrow__txt">' + esc(o.name) + '</span><span class="tick">' + TICK + '</span></button>';
  }
  function optRow(o, i, sel) {
    return '<button ' + attr(o, i, sel, 'card prow') + '>' +
      '<span class="media media--thumb">' + clipEl(o.clip) + AI + '</span>' +
      '<span class="prow__txt"><b>' + esc(o.name) + '</b><i>' + esc(o.desc) + '</i></span>' +
      '<span class="tick">' + TICK + '</span></button>';
  }
  function optFormat(o, i, sel) {
    return '<button ' + attr(o, i, sel, 'card fcard fcard--' + o.shape) + '>' +
      '<span class="frame frame--' + o.shape + '">' + clipEl(o.clip) + AI + '</span>' +
      '<span class="fcard__txt"><b>' + esc(o.name) + '</b><i>' + esc(o.desc) + '</i></span>' +
      '<span class="tick">' + TICK + '</span></button>';
  }
  var RENDER = { cards: optCard, list: optList, rows: optRow, formats: optFormat };

  /* ---------- screens ---------- */
  function ctaBar(disabled, label) {
    return '<div class="cta-bar"><button type="button" class="btn btn--primary btn--go" id="next"' + (disabled ? ' disabled' : '') + '>' + esc(label || 'Continue') + '</button></div>';
  }

  function questionHTML(s) {
    var opts = optionsOf(s, state.a), cur = state.a[s.id], h = '', idx = 0, k;
    if ((cur === undefined || !valid(s, state.a, cur)) && s.defaultFrom) {
      var d = s.defaultFrom(state.a);
      if (d && valid(s, state.a, d)) { state.a[s.id] = d; cur = d; save(); }
    }
    for (k = 0; k < opts.length; k++) {
      if (opts[k].hidden) { continue; }
      h += RENDER[s.type](opts[k], idx++, opts[k].id === cur);
    }
    var skip = s.skip ? '<p class="skip"><button type="button" class="link" data-skip="' + esc(s.skip.id) + '">' + esc(s.skip.label) + ' →</button></p>' : '';
    var cap = s.caption ? '<p class="caption">' + esc(s.caption) + '</p>' : '';
    var kick = s.kicker ? '<p class="kicker">' + esc(s.kicker) + '</p>' : '';
    var bar = F.autoAdvance ? '' : ctaBar(!valid(s, state.a, cur), 'Continue');
    var jump = F.skipLink ? '<p class="skip"><a class="link" id="skiplink" href="' + esc(withQuery(CFG.destination, null)) + '" rel="noopener">Skip to MuseGen →</a></p>' : '';
    return '<section class="step step--' + esc(s.id) + '" data-step="' + esc(s.id) + '" aria-labelledby="h1">' + kick +
      '<h1 id="h1" tabindex="-1">' + esc(fill(s.title)) + '</h1>' +
      '<p class="sub">' + esc(fill(s.sub)) + '</p>' +
      '<div class="opts opts--' + s.type + '" role="radiogroup" aria-labelledby="h1">' + h + '</div>' +
      skip + cap + jump + bar + '</section>';
  }

  function heroHTML() {
    var wo = world();
    return wo ? '<div class="hero">' + clipEl(wo.tall, 'clip--hero') + AI + '</div>' : '';
  }

  function infoHTML(s) {
    var a = state.a, title = fill(s.title), body = '', k, it;
    if (s.type === 'milestone') {
      body = heroHTML();
    } else if (s.type === 'preview') {
      body = heroHTML() + (s.caption ? '<p class="caption">' + esc(s.caption) + '</p>' : '');
    } else if (s.type === 'how') {
      body = '<ol class="steps">';
      for (k = 0; k < s.items.length; k++) {
        it = s.items[k];
        body += '<li><span class="n" aria-hidden="true">' + (k + 1) + '</span><div><b>' + esc(it.h) + '</b><p>' + it.t + '</p></div></li>';
      }
      body += '</ol>';
    } else if (s.type === 'samples') {
      body = '<div class="rail" role="list" tabindex="0" aria-label="Sample worlds">';
      for (k = 0; k < s.items.length; k++) {
        it = s.items[k];
        body += '<div class="sample" role="listitem"><span class="media media--tall">' + clipEl(it.tall) + AI + '</span><b>' + esc(it.name) + '</b></div>';
      }
      body += '</div>' + (s.caption ? '<p class="caption">' + esc(s.caption) + '</p>' : '');
    } else if (s.type === 'photo') {
      var by = s.by[a.lead] || s.by.ai;
      title = by.title;
      body = '<div class="panel">';
      for (k = 0; k < by.p.length; k++) { body += '<p>' + esc(by.p[k]) + '</p>'; }
      body += '</div>';
    }
    return '<section class="step step--info step--' + esc(s.id) + '" data-step="' + esc(s.id) + '" aria-labelledby="h1">' +
      '<h1 id="h1" tabindex="-1">' + esc(title) + '</h1>' +
      (s.sub ? '<p class="sub">' + esc(fill(s.sub)) + '</p>' : '') + body + ctaBar(false, s.button) + '</section>';
  }

  function stepHTML(s) { return isQ(s) ? questionHTML(s) : infoHTML(s); }

  function composeHTML() {
    var cp = V.compose, k, li = '';
    if (cp.mode === 'stages') {
      for (k = 0; k < cp.stages.length; k++) {
        li += '<li class="' + (k === 0 ? 'is-run' : '') + '"><span class="dot">' + TICK + '</span><span>' + esc(cp.stages[k]) + '</span></li>';
      }
      return '<section class="step step--compose" data-step="compose" aria-labelledby="h1"><div class="spinner" aria-hidden="true"></div>' +
        '<h1 id="h1" tabindex="-1">' + esc(cp.title) + '</h1><ul class="stages">' + li + '</ul></section>';
    }
    var rows = V.recap(state.a, getFmt());
    for (k = 0; k < rows.length; k++) {
      li += '<li style="--i:' + k + '"><span class="recap__k">' + esc(rows[k][0]) + '</span><span class="recap__v">' + esc(rows[k][1]) + '</span><span class="recap__ok">' + TICK + '</span></li>';
    }
    return '<section class="step step--compose" data-step="compose" aria-labelledby="h1"><div class="spinner" aria-hidden="true"></div>' +
      '<h1 id="h1" tabindex="-1">' + esc(cp.title) + '</h1><ul class="recap">' + li + '</ul></section>';
  }

  function resultHTML() {
    var a = state.a, cp = C, fmtId = getFmt(), compact = F.resultStyle === 'compact';
    var wo = world(), fm = S.byId(S.FORMATS, fmtId);
    var steps = V.buildSteps(a, fmtId), brief = V.buildBrief(a, fmtId);
    var dest = withQuery(CFG.destination, picks());
    var tags = V.tags(a, fmtId), chips = '', ol = '', ex = '', i;
    for (i = 0; i < tags.length; i++) { chips += '<li>' + esc(tags[i]) + '</li>'; }
    for (i = 0; i < steps.length; i++) {
      ol += '<li><span class="n" aria-hidden="true">' + (i + 1) + '</span><div><b>' + esc(steps[i].h) + '</b><p>' + steps[i].t + '</p></div></li>';
    }
    for (i = 0; i < cp.expect.length; i++) { ex += '<li>' + cp.expect[i] + '</li>'; }
    var songMaker = '';
    if (a.song === 'official' && CFG.songMakerUrl) {
      songMaker = '<p class="aside">' + esc(cp.songMakerPrompt) + ' <a href="' + esc(withQuery(CFG.songMakerUrl, null)) + '" id="songmaker" rel="noopener">' + esc(cp.songMakerLink) + '</a></p>';
    }
    var seg = '';
    if (F.formatOnResult) {
      seg = '<div class="segwrap"><div class="seg" role="radiogroup" aria-label="Video shape">';
      for (i = 0; i < S.FORMATS.length; i++) {
        seg += '<button type="button" role="radio" aria-checked="' + (S.FORMATS[i].id === fmtId ? 'true' : 'false') + '" data-fmt="' + S.FORMATS[i].id + '">' + esc(S.FORMATS[i].ratio) + (S.FORMATS[i].id === '9x16' ? ' Vertical' : ' Wide') + '</button>';
      }
      seg += '</div></div>';
    }
    var ctaMain = cp.ctaMainOverride || cp.ctaMain;
    return '<section class="step step--result' + (compact ? ' compact' : '') + '" data-step="result" aria-labelledby="h1">' +
      '<p class="kicker">' + esc(cp.resultKicker) + '</p>' +
      '<h1 id="h1" tabindex="-1">Here’s your “' + esc(wo.name) + '” music video</h1>' +
      '<figure class="preview preview--' + fm.id + '"><div class="preview__frame">' + clipEl(wo.tall, 'clip--preview') + AI +
      '<span class="preview__tag">' + esc(fm.ratio) + '</span></div>' +
      '<figcaption>' + esc(cp.previewCaption) + '</figcaption></figure>' + seg +
      '<ul class="tags" aria-label="Your picks">' + chips + '</ul>' +
      '<h2>' + esc(cp.briefTitle) + '</h2>' +
      '<div class="brief" id="brief" tabindex="0">' + esc(brief) + '</div>' +
      '<div class="brief__row"><p class="hint">' + esc(cp.briefHint) + '</p>' +
      '<button type="button" class="btn btn--ghost" data-act="copy">' + esc(cp.copy) + '</button></div>' +
      '<h2>' + esc(cp.stepsTitle) + '</h2><ol class="steps">' + ol + '</ol>' + songMaker +
      '<div class="expect"><h2>' + esc(cp.expectTitle) + '</h2><ul>' + ex + '</ul></div>' +
      '<p class="fine">' + esc(cp.fine) + '</p>' +
      '<p class="again"><button type="button" class="link" data-act="again">' + esc(cp.startOver) + '</button></p>' +
      '<div class="cta-bar"><a class="btn btn--primary" id="cta" href="' + esc(dest) + '" rel="noopener">' +
      '<span class="btn__main">' + esc(ctaMain) + '<span class="btn__arrow" aria-hidden="true">→</span></span>' +
      '<span class="btn__sub">' + esc(cp.ctaSub) + '</span></a></div>' +
      '</section>';
  }

  /* ---------- drawing + navigation ---------- */
  function chipNames() {
    var P = path(state.a), out = [];
    for (var i = 0; i < P.length; i++) {
      var s = P[i];
      if (!s.chip || !valid(s, state.a, state.a[s.id])) { continue; }
      var o = S.byId(optionsOf(s, state.a), state.a[s.id]);
      if (o && !o.hidden) { out.push(o.name); }
    }
    return out;
  }
  function setChrome() {
    var P = path(state.a), n = P.length, onStep = state.view === 's';
    var idx = onStep ? Math.max(0, stepIndex(state.id)) : n;
    var shown = Math.min(idx + 1, n);
    fillEl.style.width = (onStep ? Math.round(((idx + 1) / (n + 1)) * 100) : 100) + '%';
    barEl.setAttribute('aria-valuemax', String(n));
    barEl.setAttribute('aria-valuenow', String(shown));
    countEl.textContent = F.counter ? shown + '/' + n : '';
    document.body.classList.toggle('no-count', !F.counter);
    backBtn.hidden = onStep && idx === 0;
    var names = F.chips && state.view !== 'r' ? chipNames() : [], li = '';
    for (var k = 0; k < names.length; k++) { li += '<li>' + esc(names[k]) + '</li>'; }
    chipsEl.innerHTML = li;
    chipsEl.hidden = !li;
  }
  function draw(focus) {
    setChrome();
    releaseMedia();
    app.innerHTML = state.view === 's' ? stepHTML(stepById(state.id)) : state.view === 'c' ? composeHTML() : resultHTML();
    mountMedia();
    prefetchNext();
    if (state.view === 'c' && V.compose.mode === 'stages') { runStages(); }
    if (focus !== false) {
      try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
      var h = document.getElementById('h1');
      if (h) {
        try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); }
        var pre = '';
        if (state.view === 's') { var si = stepIndex(state.id); pre = 'Step ' + (si + 1) + ' of ' + path(state.a).length + '. '; }
        liveEl.textContent = pre + h.textContent;
      }
    }
  }
  function runStages() {
    var cp = V.compose, n = cp.stages.length, per = (REDUCED ? 60 : cp.ms) / n, items = app.querySelectorAll('.stages li');
    for (var i = 0; i < n; i++) {
      (function (k) {
        if (k > 0) { later(function () { if (items[k]) { items[k].className = 'is-run'; } }, k * per); }
        later(function () { if (items[k]) { items[k].className = 'is-done'; } }, (k + 1) * per - 40);
      })(i);
    }
  }
  function go(view, id, replace) {
    clearTimer();
    state.view = view;
    if (view === 's') { state.id = id; }
    var st = view === 's' ? { v: 's', id: id } : { v: 'r' };
    try { if (replace) { history.replaceState(st, ''); } else { history.pushState(st, ''); } } catch (e) { /* ignore */ }
    draw(true);
    save();
    if (view === 's') { track('PL_Step', { step: id, n: stepIndex(id) + 1 }); }
    if (view === 'r') { track('PL_Result', picks() || {}); }
  }
  function compose() {
    clearTimer();
    state.view = 'c';
    draw(true);
    warmResultClip();
    later(function () { go('r', null, false); }, REDUCED ? 150 : V.compose.ms);
  }
  function advance() {
    clearTimer();
    var P = path(state.a), i = stepIndex(state.id);
    if (i < P.length - 1) { go('s', P[i + 1].id, false); }
    else if (complete(state.a)) { compose(); }
    else { go('s', P[firstOpen(state.a)].id, false); }
  }
  function choose(id, isSkip) {
    if (locked || state.view !== 's') { return; }
    var s = stepById(state.id);
    if (!s || !isQ(s) || !valid(s, state.a, id)) { return; }
    state.a[s.id] = id;
    if (s.id === 'world') {
      /* a different world means different setting/outfit options: forget answers that belonged to the old one */
      for (var q = 0; q < STEPS.length; q++) { if (STEPS[q].optionsBy) { delete state.a[STEPS[q].id]; } }
    }
    var btns = app.querySelectorAll('.opts [data-id]');
    for (var k = 0; k < btns.length; k++) {
      var on = btns[k].getAttribute('data-id') === id;
      btns[k].setAttribute('aria-checked', on ? 'true' : 'false');
      btns[k].classList.toggle('is-on', on);
    }
    track('PL_Pick', { step: s.id, value: id });
    save();
    prefetchNext();
    if (F.autoAdvance || isSkip) {
      locked = true;
      later(function () { locked = false; advance(); }, REDUCED ? 0 : 280);
    } else {
      var nb = document.getElementById('next');
      if (nb) { nb.disabled = false; }
    }
  }
  function setFmt(id) {
    if (!S.byId(S.FORMATS, id) || id === getFmt()) { return; }
    state.fmt = id;
    save();
    track('PL_Format', { value: id });
    draw(false);
    var b = app.querySelector('[data-fmt="' + id + '"]');
    if (b) { try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }
  }

  /* Copy: do the synchronous legacy copy first (it must run inside the tap, which every WebView allows),
     then the async Clipboard API, and as a last resort select the text so the person can copy it by hand. */
  function legacyCopy(text) {
    var ta = document.createElement('textarea'), ok = false;
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, text.length); ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text, onOk, onFail) {
    if (legacyCopy(text)) { onOk(); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(onOk, onFail); return; }
    onFail();
  }
  function selectBrief() {
    var el = document.getElementById('brief');
    if (!el || !window.getSelection || !document.createRange) { return; }
    var r = document.createRange();
    r.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
  }

  /* ---------- events ---------- */
  function hit(el) {
    return el.getAttribute && (el.getAttribute('data-id') || el.getAttribute('data-act') || el.getAttribute('data-skip') ||
      el.getAttribute('data-fmt') || el.id === 'cta' || el.id === 'songmaker' || el.id === 'next' || el.id === 'skiplink');
  }
  app.addEventListener('click', function (e) {
    var el = e.target;
    while (el && el !== app && !hit(el)) { el = el.parentNode; }
    if (!el || el === app) { return; }
    if (el.id === 'cta') {
      track('PL_Cta', picks() || {});
      /* copy-and-go variant: the tap itself copies the description (the button label says so), then the link navigates as usual */
      if (F.copyAndGo) { legacyCopy(V.buildBrief(state.a, getFmt())); }
      return;
    }
    if (el.id === 'songmaker') { track('PL_SongMaker', {}); return; }
    if (el.id === 'skiplink') { track('PL_SkipToSite', { step: state.id }); return; }
    if (el.id === 'next') {
      if (el.disabled) { return; }
      var cs = stepById(state.id);
      if (cs && isQ(cs) && !valid(cs, state.a, state.a[cs.id])) { return; }
      advance();
      return;
    }
    var fm = el.getAttribute('data-fmt');
    if (fm) { setFmt(fm); return; }
    var act = el.getAttribute('data-act');
    if (act === 'copy') {
      var label = function (t) { el.textContent = t; try { el.focus({ preventScroll: true }); } catch (e2) { /* ignore */ } later(function () { el.textContent = C.copy; }, 2400); };
      copyText(V.buildBrief(state.a, getFmt()), function () {
        label(C.copied);
        track('PL_Copy', {});
      }, function () {
        selectBrief();
        label(C.copyFailed);
      });
      return;
    }
    if (act === 'again') {
      state.a = {}; state.fmt = null; save(); go('s', STEPS[0].id, false); return;
    }
    var sk = el.getAttribute('data-skip');
    if (sk) { choose(sk, true); return; }
    var id = el.getAttribute('data-id');
    if (id) { choose(id, false); }
  });

  if (motionBtn) {
    motionBtn.addEventListener('click', function () { setMotion(!motionOff, true); track('PL_Motion', { off: motionOff }); });
  }

  function lastStepId() { var P = path(state.a); return P[P.length - 1].id; }
  backBtn.addEventListener('click', function () {
    if (state.view === 'c') {
      /* the compose beat has no history entry of its own: just return to the last step */
      clearTimer(); state.view = 's'; state.id = lastStepId(); draw(true); return;
    }
    if (window.history.length > 1 && window.history.state && window.history.state.v) { history.back(); return; }
    if (state.view === 's') {
      var i = stepIndex(state.id);
      if (i > 0) { go('s', path(state.a)[i - 1].id, true); }
    } else { go('s', lastStepId(), true); }
  });

  window.addEventListener('popstate', function (e) {
    var s = e.state;
    if (!s || !s.v) { return; }
    clearTimer();
    var P = path(state.a), open = firstOpen(state.a);
    if (s.v === 'r') {
      if (complete(state.a)) { state.view = 'r'; draw(true); return; }
      state.view = 's'; state.id = P[open].id; draw(true); return;
    }
    var want = stepIndex(s.id);
    if (want < 0) { want = 0; }
    /* never show a step beyond the first unanswered question (answers can vanish: Start over, cleared storage) */
    state.view = 's'; state.id = P[Math.min(want, open)].id;
    draw(true);
  });

  /* ---------- boot ---------- */
  function boot() {
    initMotion();
    if (!GPC) {
      if (CFG.tiktokPixel) { loadTikTok(CFG.tiktokPixel); }
      if (CFG.ga4) { loadGA(CFG.ga4); }
    }
    /* "Your Privacy Choices" is only needed when ad/analytics scripts can run */
    var pc = document.getElementById('privacy-choices');
    if (pc && CFG.privacyChoicesUrl && (CFG.tiktokPixel || CFG.ga4)) { pc.href = CFG.privacyChoicesUrl; pc.hidden = false; }
    var saved = loadAnswers();
    state.a = saved.a; state.fmt = saved.fmt;
    var P = path(state.a), hs = null, k;
    try { hs = history.state; } catch (e) { hs = null; }
    if (hs && hs.v) {
      if (hs.v === 'r' && complete(state.a)) { state.view = 'r'; }
      else {
        var w = hs.v === 's' ? stepIndex(hs.id) : firstOpen(state.a);
        state.view = 's'; state.id = P[Math.max(0, Math.min(w < 0 ? 0 : w, firstOpen(state.a)))].id;
      }
      draw(false);
    } else if (complete(state.a) && P.length) {
      /* same tab, same ad URL, survey already finished (e.g. the page was reopened) -> rebuild a sane back stack */
      try {
        history.replaceState({ v: 's', id: P[0].id }, '');
        for (k = 1; k < P.length; k++) { history.pushState({ v: 's', id: P[k].id }, ''); }
        history.pushState({ v: 'r' }, '');
      } catch (e) { /* ignore */ }
      state.view = 'r';
      draw(false);
    } else {
      var start = firstOpen(state.a);
      try { history.replaceState({ v: 's', id: P[0].id }, ''); for (k = 1; k <= start; k++) { history.pushState({ v: 's', id: P[k].id }, ''); } } catch (e) { /* ignore */ }
      state.view = 's'; state.id = P[start].id;
      draw(false);
    }
    track('PL_Start', {});
    if (state.view === 's') { track('PL_Step', { step: state.id, n: stepIndex(state.id) + 1 }); }
    document.documentElement.className += ' is-ready';
  }
  boot();
})();
