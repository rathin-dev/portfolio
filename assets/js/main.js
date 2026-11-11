// Rathin Baraiya — portfolio.
// Without this file every section is still visible and every link works.
// It adds the blue line that draws itself down the page, the progress rail on
// the right, the full-screen menu, and the motion.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  // ── Hero name: one span per letter, so the letters can rise in ─────────
  let letter = 0;
  $$('.hero-line').forEach((line) => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--i', letter++);
      span.textContent = ch;
      line.append(span);
    });
  });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('loaded')));

  // ── Full-screen menu ──────────────────────────────────────────────────
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const menuLinks = $$('a', menu);
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    menu.inert = !open;
    root.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => menuLinks[0] && menuLinks[0].focus({ preventScroll: true }), 300);
  };
  menu.inert = true;
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('open')) return;
    if (e.key === 'Escape') { setMenu(false); menuBtn.focus(); return; }
    if (e.key !== 'Tab') return;
    // Keep focus inside the open menu (its links plus the close button)
    const items = [menuBtn, ...menuLinks];
    const i = items.indexOf(document.activeElement);
    if (i === -1) { e.preventDefault(); items[0].focus(); }
    else if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });

  // ── Layout measurements ───────────────────────────────────────────────
  const toneEls = $$('[data-tone]');
  const hudEls = $$('[data-hud]');
  const fxEls = $$('[data-fx]');
  const hud = $('.hud');
  const hudTicks = $('.hud-ticks');
  const hudNum = $('.hud-num');
  const hudName = $('.hud-name');

  let vh = window.innerHeight;
  let maxScroll = 1;
  let hudTop = 84;
  let hudH = 0;
  let tones = [];
  let marks = [];

  const measure = () => {
    vh = window.innerHeight;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const hr = hud.getBoundingClientRect();
    hudTop = hr.top;
    hudH = hr.height;
    tones = toneEls.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, bottom: r.bottom + scrollY, dark: el.dataset.tone === 'dark' };
    });
    marks = hudEls.map((el) => {
      const [num, name] = el.dataset.hud.split('|');
      return { top: el.getBoundingClientRect().top + scrollY, num, name };
    });
    hudTicks.textContent = '';
    marks.forEach((m) => {
      const tick = document.createElement('i');
      tick.style.top = `${(clamp01(m.top / maxScroll) * hudH).toFixed(1)}px`;
      hudTicks.append(tick);
    });
  };
  // Sections can nest (the purple Mandli block sits inside Work), so the
  // innermost match wins; it is always the last one in document order.
  const darkAt = (y) => {
    let dark = false;
    tones.forEach((s) => { if (y >= s.top && y < s.bottom) dark = s.dark; });
    return dark;
  };

  // ── The blue line ─────────────────────────────────────────────────────
  // Points come from data-thread="x,y x,y" on sections: x is a fraction of the
  // page width, y a fraction of that element's height. A smooth curve runs
  // through them, and it is drawn up to just below where the visitor is reading.
  const NS = 'http://www.w3.org/2000/svg';
  const svg = $('.thread');
  const ghost = $('.thread-ghost', svg);
  const [line, lineLight] = $$('.thread-line', svg);
  const head = $('.thread-head', svg);
  const darkClip = $('#thread-dark');
  let total = 0;
  let lens = [];
  let reach = [];
  let introStart = 0;
  const INTRO = 1800;

  const curve = (pts) => {
    if (pts.length < 2) return '';
    const f = (n) => n.toFixed(1);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}`
        + ` ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}`
        + ` ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  };

  const buildThread = () => {
    const W = document.documentElement.clientWidth;
    const H = document.body.getBoundingClientRect().height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H.toFixed(0)}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    // Narrow screens use data-thread-sm where given: a route that keeps to the
    // edge, so the line doesn't run through body text on a phone
    const small = W < 900;
    const pts = [];
    $$('[data-thread], [data-thread-sm]').forEach((el) => {
      const spec = (small && el.dataset.threadSm) || el.dataset.thread;
      if (!spec) return;
      const r = el.getBoundingClientRect();
      const top = r.top + scrollY;
      spec.trim().split(/\s+/).forEach((pair) => {
        const [fx, fy] = pair.split(',').map(Number);
        pts.push([fx * W, top + fy * r.height]);
      });
    });
    const d = curve(pts);
    [ghost, line, lineLight].forEach((p) => p.setAttribute('d', d));
    total = d ? line.getTotalLength() : 0;
    [line, lineLight].forEach((p) => { p.style.strokeDasharray = `${total} ${total}`; });

    // How far down the page the line has reached at each length, so the
    // drawn length can be looked up from a scroll position.
    lens = [];
    reach = [];
    let lowest = -Infinity;
    for (let l = 0; l <= total; l += 10) {
      lowest = Math.max(lowest, line.getPointAtLength(l).y);
      lens.push(l);
      reach.push(lowest);
    }

    // On dark sections the line switches to a lighter blue
    darkClip.textContent = '';
    tones.filter((t) => t.dark).forEach((t) => {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', t.top.toFixed(0));
      rect.setAttribute('width', String(W));
      rect.setAttribute('height', (t.bottom - t.top).toFixed(0));
      darkClip.append(rect);
    });
  };

  const drawThread = () => {
    if (!total) return;
    let len = total;
    if (!reduce) {
      // The head sits low on the first screen and settles a little above the middle later
      const y = scrollY;
      const target = y + vh * (0.86 - 0.28 * clamp01(y / vh));
      let lo = 0;
      let hi = reach.length - 1;
      let idx = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (reach[mid] <= target) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      len = idx < 0 ? 0 : lens[idx];
      if (introStart) len *= easeOut(clamp01((performance.now() - introStart) / INTRO));
    }
    const off = (total - len).toFixed(1);
    line.style.strokeDashoffset = off;
    lineLight.style.strokeDashoffset = off;
    const p = line.getPointAtLength(len);
    head.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    head.style.opacity = len > 4 && len < total - 2 ? '1' : '0';
  };

  // ── Scroll-linked updates ─────────────────────────────────────────────
  const updateFx = () => {
    fxEls.forEach((el) => {
      if (reduce) { el.style.setProperty('--p', '.5'); el.style.setProperty('--q', '1'); return; }
      const r = el.getBoundingClientRect();
      // p: 0 as the element enters at the bottom, 1 as it leaves at the top.
      // q: reaches 1 when the element's middle is in the middle of the screen.
      const p = clamp01((vh - r.top) / (vh + r.height));
      el.style.setProperty('--p', p.toFixed(3));
      el.style.setProperty('--q', clamp01(p * 2).toFixed(3));
    });
  };

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const prog = clamp01(y / maxScroll);
    const dotY = prog * hudH;
    hud.style.setProperty('--hud-y', `${dotY.toFixed(1)}px`);
    let current = marks[0];
    marks.forEach((m) => { if (m.top <= y + vh * 0.4) current = m; });
    if (current && hudNum.textContent !== current.num) {
      hudNum.textContent = current.num;
      hudName.textContent = current.name;
    }
    root.classList.toggle('hdr-dark', darkAt(y + 36));
    root.classList.toggle('hud-dark', darkAt(y + hudTop + dotY));
    updateFx();
    drawThread();
  };
  const requestTick = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  };
  window.addEventListener('scroll', requestTick, { passive: true });

  const rebuild = () => { measure(); buildThread(); onScroll(); };
  let rebuildTimer = 0;
  const scheduleRebuild = () => { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 120); };
  window.addEventListener('resize', scheduleRebuild);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleRebuild).observe(document.body);
  window.addEventListener('load', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);

  rebuild();
  if (!reduce) {
    introStart = performance.now();
    const intro = () => {
      drawThread();
      if (performance.now() - introStart < INTRO) requestAnimationFrame(intro);
    };
    requestAnimationFrame(intro);
  }

  // ── Stars behind "What I do" ──────────────────────────────────────────
  $$('.stars').forEach((box) => {
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 70; i++) {
      const star = document.createElement('i');
      star.style.setProperty('--x', `${(rand() * 100).toFixed(2)}%`);
      star.style.setProperty('--y', `${(rand() * 100).toFixed(2)}%`);
      star.style.setProperty('--sz', `${(1 + rand() * 2.2).toFixed(1)}px`);
      star.style.setProperty('--o', (0.2 + rand() * 0.6).toFixed(2));
      star.style.setProperty('--t', `${(2 + rand() * 4).toFixed(1)}s`);
      box.append(star);
    }
  });

  // ── Reveals and counters ──────────────────────────────────────────────
  const reveals = $$('.reveal');
  const counters = $$('[data-count]');
  const runCount = (el) => {
    const end = Number(el.dataset.count);
    if (reduce || !end) return;
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp01((now - t0) / 1400);
      el.textContent = String(Math.round(end * easeOut(t)));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach((el) => io.observe(el));

    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        countIo.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIo.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // ── Copy email ────────────────────────────────────────────────────────
  $$('[data-copy]').forEach((btn) => {
    const label = $('[data-copy-label]', btn);
    const original = label ? label.textContent : '';
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.append(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        ta.remove();
      }
      if (label) {
        label.textContent = ok ? 'Copied' : text;
        setTimeout(() => { label.textContent = original; }, 2200);
      }
    });
  });
})();
