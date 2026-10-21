/*
 * CommuteAds site behaviour, shared by the redesigned pages. No libraries.
 *  - burger menu (global nav)
 *  - local-nav section highlighting
 *  - scroll reveals (.rv / .zoom) via IntersectionObserver
 *  - highlights gallery: auto-advance with progress dots and play/pause,
 *    pauses when off screen, on hover/focus, and for reduced motion
 *  - "Take a closer look" viewer tabs (keyboard: arrow keys)
 *  - "Try your ad": plays a chosen video on the tablet render, locally only
 *  - card-carousel paddles
 *  - CommuteEd "coming soon" dialog
 */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* burger */
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* split headlines into words (data-split) and intros into words (data-scrub)
     before the reveal observer starts, so their words animate */
  function splitWords(el, cls) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'w'; s.textContent = p; s.style.setProperty('--i', i++);
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          // a gradient span keeps its gradient as one unit; other inline elements split inside
          if (n.classList.contains('grad')) { n.classList.add('w'); n.style.setProperty('--i', i++); }
          else walk(n);
        }
      });
    }
    walk(el);
    el.classList.add(cls);
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    return i;
  }
  if (!reduce) {
    document.querySelectorAll('[data-split]').forEach(function (el) { splitWords(el, 'split'); });
    document.querySelectorAll('[data-scrub]').forEach(function (el) { splitWords(el, 'scrub'); el._words = el.querySelectorAll('.w'); });
  }

  /* reveals */
  var revealEls = document.querySelectorAll('.rv, .zoom');
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* local nav: mark the section in view */
  var lnLinks = document.querySelectorAll('.lnav a.lk[href^="#"]');
  if (hasIO && lnLinks.length) {
    var map = {};
    lnLinks.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) map[t.id] = a; });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          lnLinks.forEach(function (a) { a.classList.remove('on'); });
          map[e.target.id].classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { navIO.observe(document.getElementById(id)); });
  }

  /* highlights gallery */
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var track = g.querySelector('.track');
    var cards = Array.prototype.slice.call(track.children);
    var dotsWrap = g.querySelector('.dots');
    var playBtn = g.querySelector('.play');
    var ms = parseInt(g.getAttribute('data-interval') || '5000', 10);
    g.style.setProperty('--slide-ms', ms + 'ms');
    var idx = 0, timer = null, playing = !reduce, visible = false, hovering = false;

    var dots = cards.map(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show highlight ' + (i + 1) + ' of ' + cards.length);
      b.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(b);
      return b;
    });

    function mark(i) {
      cards.forEach(function (c, j) { c.classList.toggle('is-current', j === i); });
      dots.forEach(function (d, j) {
        d.removeAttribute('aria-current');
        if (j === i) { void d.offsetWidth; d.setAttribute('aria-current', 'true'); }
      });
    }
    function go(i, user) {
      idx = (i + cards.length) % cards.length;
      var c = cards[idx];
      track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      mark(idx);
      if (user) restart();
    }
    function tick() { go(idx + 1, false); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); if (playing && visible && !hovering) timer = setInterval(tick, ms); g.classList.toggle('paused', !(playing && visible && !hovering)); }
    function setPlaying(p) {
      playing = p;
      playBtn.setAttribute('aria-label', p ? 'Pause highlights' : 'Play highlights');
      playBtn.innerHTML = p
        ? '<svg viewBox="0 0 18 18" aria-hidden="true"><rect x="3" y="2" width="4" height="14" rx="1" fill="currentColor"/><rect x="11" y="2" width="4" height="14" rx="1" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 2.5v13l11-6.5z" fill="currentColor"/></svg>';
      restart();
    }
    playBtn.addEventListener('click', function () { setPlaying(!playing); });
    g.addEventListener('mouseenter', function () { hovering = true; restart(); });
    g.addEventListener('mouseleave', function () { hovering = false; restart(); });
    g.addEventListener('focusin', function () { hovering = true; restart(); });
    g.addEventListener('focusout', function () { hovering = false; restart(); });

    // a manual swipe/scroll moves the current dot to the centred card
    var st;
    track.addEventListener('scroll', function () {
      clearTimeout(st);
      st = setTimeout(function () {
        var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bestD = Infinity;
        cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
        if (best !== idx) { idx = best; mark(idx); restart(); }
      }, 120);
    }, { passive: true });

    if (hasIO) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; restart(); }, { threshold: 0.35 }).observe(g);
    } else { visible = true; }
    mark(0);
    setPlaying(playing);
  });

  /* viewer tabs */
  document.querySelectorAll('[data-viewer]').forEach(function (v) {
    var tabs = Array.prototype.slice.call(v.querySelectorAll('[role="tab"]'));
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) { p.classList.toggle('on', on); p.hidden = false; p.setAttribute('aria-hidden', String(!on)); }
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          select(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true);
        }
      });
    });
  });

  /* try your ad: local preview only, nothing is uploaded */
  var file = document.getElementById('adFile');
  if (file) {
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var video = document.getElementById('previewVideo');
      var ph = document.getElementById('previewPlaceholder');
      if (video.dataset.url) URL.revokeObjectURL(video.dataset.url);
      var url = URL.createObjectURL(f);
      video.dataset.url = url;
      video.src = url;
      video.hidden = false;
      if (ph) ph.hidden = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  /* carousel paddles */
  document.querySelectorAll('[data-carousel]').forEach(function (c) {
    var track = c.querySelector('.track');
    var prev = c.querySelector('[data-prev]'), next = c.querySelector('[data-next]');
    if (!track || !prev || !next) return;
    function step() { var card = track.children[0]; return card ? card.clientWidth + 20 : 340; }
    function update() {
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ── Motion ──────────────────────────────────────────────────────────
     One rAF-throttled scroll loop feeds progress to elements near the
     viewport: data-scroll="hero" (--p 0→1 as the hero scrolls away),
     data-parallax (--py −1→1 across the viewport) and data-scrub (lights
     words as the paragraph passes through the reading line). */
  if (!reduce) {
    var hero = document.querySelector('[data-scroll="hero"]');
    var para = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var scrubs = Array.prototype.slice.call(document.querySelectorAll('[data-scrub]'));
    var ticking = false;
    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      if (hero) {
        var hr = hero.getBoundingClientRect();
        if (hr.bottom > 0) hero.style.setProperty('--p', clamp(-hr.top / (hr.height * 0.55)).toFixed(4));
      }
      para.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = clamp((vh - r.top) / (vh + r.height));
        el.style.setProperty('--py', ((p - 0.5) * 2).toFixed(4));
      });
      scrubs.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) return;
        var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3));
        var n = el._words ? el._words.length : 0, lit = Math.round(p * n * 1.08);
        for (var i = 0; i < n; i++) el._words[i].classList.toggle('lit', i < lit);
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* numbers count up when they come into view: <span data-count="150">150</span> */
  // .ticker-num counters belong to the media kit's own script
  var counters = document.querySelectorAll('[data-count]:not(.ticker-num)');
  if (counters.length && hasIO && !reduce) {
    var cIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cIO.unobserve(e.target);
        var el = e.target, to = parseFloat(el.getAttribute('data-count')), t0 = null, dur = 1400;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(to * eased).toLocaleString('en-IN');
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; cIO.observe(el); });
  }

  /* SVG motion graphics run only while on screen (and never for reduced motion) */
  document.querySelectorAll('svg[data-live]').forEach(function (svg) {
    if (!svg.pauseAnimations) return;
    if (reduce) { svg.pauseAnimations(); svg.setCurrentTime && svg.setCurrentTime(2); return; }
    if (hasIO) new IntersectionObserver(function (es) { es[0].isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations(); }).observe(svg);
  });

  /* subtle 3D tilt for cards on devices with a fine pointer */
  if (!reduce && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('tilting');
        el.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('tilting');
        el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* CommuteEd dialog */
  var modal = document.querySelector('[data-ed-modal]');
  if (modal) {
    var opener = null;
    function open(e) { opener = e.currentTarget; modal.classList.add('open'); modal.querySelector('[data-close-ed]').focus(); }
    function close() { modal.classList.remove('open'); if (opener) opener.focus(); }
    document.querySelectorAll('[data-open-ed]').forEach(function (b) { b.addEventListener('click', open); });
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-close-ed]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }
})();
