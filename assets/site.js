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
