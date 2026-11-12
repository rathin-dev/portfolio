// Rathin Baraiya — portfolio.
// Without this file every section is still visible and every link works.
// It adds smooth (inertial) scrolling, the pinned 3D scenes, the blue line that
// draws itself through them, the progress rail on the right, the full-screen
// menu, and the motion.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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

  // ── Headings marked data-split: wrap each word so it can rise from a mask ──
  // Counters ([data-count]) and the rupee sign stay whole, as one unit each.
  const splitWords = (el) => {
    let i = 0;
    const unit = () => {
      const w = document.createElement('span');
      w.className = 'w';
      const wi = document.createElement('span');
      wi.className = 'wi';
      wi.style.setProperty('--i', i++);
      w.append(wi);
      return [w, wi];
    };
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          if (!child.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (!part.trim()) { frag.append(document.createTextNode(part)); return; }
            const [w, wi] = unit();
            wi.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.hasAttribute('data-count')) {
            const [w, wi] = unit();
            child.replaceWith(w);
            wi.append(child);
          } else {
            walk(child);
          }
        }
      });
    };
    walk(el);
  };
  $$('[data-split]').forEach(splitWords);

  // ── Smooth scrolling ──────────────────────────────────────────────────
  // Mouse wheels and trackpads glide to a stop instead of jumping. Touch
  // screens keep their own native momentum, and reduced motion turns it off.
  const smooth = (() => {
    if (reduce || !finePointer) return null;
    root.style.scrollBehavior = 'auto';
    let current = window.scrollY;
    let target = current;
    let running = false;
    let locked = false;
    let tween = null;
    let last = 0;
    const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const clampY = (y) => Math.min(maxY(), Math.max(0, y));

    const frame = (now) => {
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      if (tween) {
        const t = clamp01((now - tween.t0) / tween.dur);
        current = tween.from + (tween.to - tween.from) * easeInOut(t);
        if (t >= 1) { current = tween.to; target = tween.to; tween = null; }
      } else {
        // Ease towards the target; the same feel at 60 Hz and 120 Hz
        current += (target - current) * (1 - Math.pow(1 - 0.085, dt / 16.7));
        if (Math.abs(target - current) < 0.4) current = target;
      }
      window.scrollTo(0, current);
      if (tween || current !== target) {
        requestAnimationFrame(frame);
      } else {
        running = false;
        last = 0;
      }
    };
    const run = () => {
      if (running) return;
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    };

    window.addEventListener('wheel', (e) => {
      if (locked || e.ctrlKey || e.defaultPrevented) return; // ctrl + wheel is zoom
      e.preventDefault();
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      if (tween) { target = current; tween = null; }
      target = clampY(target + dy);
      run();
    }, { passive: false });

    // Stay in step with scrolling we did not start: scrollbar drag, find in page, focus
    const sync = () => { if (!running) { current = window.scrollY; target = current; } };
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);

    return {
      to(y) {
        const to = clampY(y);
        const dist = Math.abs(to - current);
        tween = { from: current, to, t0: performance.now(), dur: Math.min(1700, 650 + dist * 0.22) };
        target = to;
        run();
      },
      by(dy) {
        if (tween) { target = current; tween = null; }
        target = clampY(target + dy);
        run();
      },
      lock(on) {
        locked = on;
        tween = null;
        current = window.scrollY;
        target = current;
      },
      get locked() { return locked; },
    };
  })();

  // Page-down, space and arrow keys glide too, unless a control has focus
  if (smooth) {
    window.addEventListener('keydown', (e) => {
      if (smooth.locked || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const ae = document.activeElement;
      const pageFocused = !ae || ae === document.body || ae === root || ae.getAttribute('tabindex') === '-1';
      if (!pageFocused) return;
      const page = window.innerHeight * 0.85;
      let dy = 0;
      switch (e.key) {
        case 'ArrowDown': dy = 120; break;
        case 'ArrowUp': dy = -120; break;
        case 'PageDown': dy = page; break;
        case 'PageUp': dy = -page; break;
        case ' ': dy = e.shiftKey ? -page : page; break;
        case 'Home': e.preventDefault(); smooth.to(0); return;
        case 'End': e.preventDefault(); smooth.to(Infinity); return;
        default: return;
      }
      e.preventDefault();
      smooth.by(dy);
    });
  }

  // In-page links glide to their section and take keyboard focus with them
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const y = id === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY;
    if (smooth) smooth.to(y);
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    history.pushState(null, '', id);
    if (id !== '#top') {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  });

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
    if (smooth) smooth.lock(open);
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

  // ── Layout ────────────────────────────────────────────────────────────
  // A scroll frame reads no layout: everything that moves is worked out from
  // the scroll position and a few numbers measured here (again on resize).
  const HEAD = 0.58;   // where the line's head sits on screen while the page scrolls (fraction of its height)
  const START = 0.86;  // ...and where it starts, on the first screen
  // How a covered scene tilts away, and how a card is inset while it rises.
  // Copies of the numbers on .js .stage and .js .stage--card in style.css.
  const TILT = { perspective: 1600, depth: 280, angle: 9 };
  const INSET = { top: 0.07, side: 0.05 };
  const narrow = window.matchMedia('(max-width: 900px)');
  const toneEls = $$('[data-tone]');
  const hudEls = $$('[data-hud]');
  const fxEls = $$('[data-fx]');
  const pinEls = $$('[data-pin]');
  const hud = $('.hud');
  const hudTicks = $('.hud-ticks');
  const hudNum = $('.hud-num');
  const hudName = $('.hud-name');

  const brand = $('.brand');
  let vh = window.innerHeight;
  let vw = root.clientWidth;
  let maxScroll = 1;
  let hudTop = 84;
  let hudH = 0;
  let hudX = 0;
  let brandAt = [0, 0];
  let menuAt = [0, 0];
  let scenes = [];
  let fxs = [];
  let tones = [];
  let marks = [];

  // Top of an element on the page, from layout alone (transforms ignored)
  const pageTop = (el) => {
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  };
  // Top of an element inside a box that contains it
  const topIn = (el, box) => {
    let y = 0;
    let n = el;
    while (n && n !== box) { y += n.offsetTop; n = n.offsetParent; }
    return n === box ? y : el.getBoundingClientRect().top - box.getBoundingClientRect().top;
  };

  // Scenes. A [data-pin] wrapper is taller than its .stage, and the stage is
  // sticky, so it stays pinned while the wrapper scrolls past. On the way a
  // scene goes through three phases:
  //   rise   the stage slides up into place (over the scene before it)
  //   hold   it is pinned on its own
  //   cover  it is still pinned while the next block rises over it
  const measureScenes = () => {
    scenes = pinEls.map((wrap) => {
      const stage = $(':scope > .stage', wrap);
      const top = pageTop(wrap);
      const wrapH = wrap.offsetHeight;
      const stageH = stage ? stage.offsetHeight : wrapH;
      const pinLen = Math.max(0, wrapH - stageH);
      const cs = stage ? getComputedStyle(stage) : null;
      const pinned = !reduce && !!stage && pinLen > 1 && cs.position === 'sticky';
      const next = wrap.nextElementSibling;
      const nextTop = next ? pageTop(next) : Infinity;
      const overlap = Math.min(Math.max(top + wrapH - nextTop, 0), pinLen);
      return {
        wrap, stage, pinned, top, stageH, pinLen, nextTop,
        hold: pinLen - overlap,           // scroll distance it is pinned on its own
        rise: Math.min(vh, top),          // scroll distance it takes to slide into place
        sweep: parseFloat(wrap.dataset.sweep) || HEAD,
        dark: wrap.dataset.tone === 'dark',
        card: pinned && cs.clipPath !== 'none',   // rises as an inset, rounded card
        tilts: pinned && cs.transform !== 'none', // tilts away when covered
        ox: vw / 2,                               // where it tilts about (set with the line)
        hidden: !!stage && stage.style.visibility === 'hidden',
      };
    });
  };
  // A scene's phases at scroll position y, each 0 to 1 (see above)
  const phase = (s, y) => {
    if (reduce) return { rise: 1, hold: 0, cover: 0, pin: 0 };
    const top = s.top - y;
    const rise = clamp01((vh - top) / vh);
    if (!s.pinned) return { rise, hold: 0, cover: 0, pin: 0 };
    const into = Math.min(Math.max(-top, 0), s.pinLen);
    return {
      rise,
      hold: s.hold > 0 ? clamp01(into / s.hold) : 1,
      cover: s.pinLen > s.hold ? clamp01((into - s.hold) / (s.pinLen - s.hold)) : 0,
      pin: into / s.pinLen,
    };
  };
  // The pinned scene an element belongs to (the stage itself counts)
  const sceneOf = (el) => scenes.find((s) => s.pinned && s.stage.contains(el)) || null;
  // Where a scene's stage is on screen at scroll position y
  const stageTopAt = (s, y) => {
    const t = s.top - y;
    if (t >= 0) return t;
    return -t <= s.pinLen ? 0 : t + s.pinLen;
  };

  const centre = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const measure = () => {
    vh = window.innerHeight;
    vw = root.clientWidth;
    maxScroll = Math.max(1, root.scrollHeight - vh);
    const hr = hud.getBoundingClientRect();
    hudTop = hr.top;
    hudH = hr.height;
    hudX = hr.left;
    brandAt = centre(brand);
    menuAt = centre(menuBtn);
    measureScenes();
    fxs = fxEls.map((el) => {
      const s = sceneOf(el);
      return { el, s, top: s ? topIn(el, s.stage) : pageTop(el), h: el.offsetHeight };
    });
    tones = toneEls.map((el) => ({
      s: scenes.find((sc) => sc.pinned && sc.wrap === el) || null,
      top: pageTop(el),
      h: el.offsetHeight,
      dark: el.dataset.tone === 'dark',
    }));
    marks = hudEls.map((el) => {
      const [num, name] = el.dataset.hud.split('|');
      return { top: pageTop(el), num, name };
    });
    hudTicks.textContent = '';
    marks.forEach((m) => {
      const tick = document.createElement('i');
      tick.style.top = `${(clamp01(m.top / maxScroll) * hudH).toFixed(1)}px`;
      hudTicks.append(tick);
    });
  };
  // Is the block showing at (vx, vy) on screen dark? The last block in page
  // order that covers that point wins: later scenes are drawn over earlier
  // ones, and nested blocks (the purple Mandli inside Work) come after their
  // parent. A rising card is inset, and a covered scene tilts away from the
  // edges, so near the corners the light page can show instead.
  const darkAt = (vx, vy, y, behind) => {
    let dark = behind;
    tones.forEach((t) => {
      if (!t.s) {
        const top = t.top - y;
        if (vy >= top && vy < top + t.h) dark = t.dark;
        return;
      }
      const s = t.s;
      const top = stageTopAt(s, y);
      const { rise, cover } = phase(s, y);
      let from = top;
      let left = 0;
      let right = vw;
      if (s.card && rise < 1) {
        from += INSET.top * (1 - rise) * s.stageH;
        left = INSET.side * (1 - rise) * vw;
        right = vw - left;
      }
      if (vy < from || vy >= top + s.stageH) return;
      if (s.tilts && cover > 0) {
        const a = (TILT.angle * cover * Math.PI) / 180;
        const z = (vy - top) * Math.sin(a) - TILT.depth * cover;
        const k = TILT.perspective / (TILT.perspective - z);
        left = s.ox * (1 - k);
        right = s.ox + (vw - s.ox) * k;
      }
      if (vx >= left && vx < right) dark = t.dark;
    });
    return dark;
  };

  // ── The blue line ─────────────────────────────────────────────────────
  // Its route comes from attributes, as points "x,y x,y": x is a fraction of
  // the page width, y a fraction of the element's height.
  //   data-thread           the route while the element scrolls normally
  //   data-thread-sm        the same on narrow screens ("" = no points there)
  //   data-thread-scene     the route while its scene is pinned (y: fraction of the stage)
  //   data-thread-scene-sm  the same on narrow screens
  // Points inside a pinned stage make a piece of the line drawn inside that
  // stage, so it holds still with the stage and tilts away with it; the other
  // pieces are drawn over the page. While the page scrolls, the head stays a
  // little above the middle of the screen; while a scene is held, it runs on
  // through that scene.
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (parent) parent.append(el);
    return el;
  };
  const makeHead = (parent) => {
    const g = make('g', { class: 'thread-head' }, parent);
    make('circle', { class: 'thread-halo', r: '9' }, g);
    make('circle', { r: '3.5' }, g);
    g.style.opacity = '0';
    return g;
  };
  const pageSvg = $('.thread');
  const darkClip = $('#thread-dark');
  const pageG = make('g', {}, pageSvg);
  const pageHead = makeHead(pageSvg);
  const stageSvgs = new Map();
  let pieces = [];
  let heads = [pageHead];
  let darkRects = [];
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

  // The scroll position at which a point of the line gets drawn.
  // On the page: when it is HEAD of the way down the screen (START on the first screen).
  const pageReach = (y) => {
    if (y <= START * vh) return y - START * vh;
    if (y <= (1 + HEAD) * vh) return (y - START * vh) / (1 - START + HEAD);
    return y - HEAD * vh;
  };
  // In a pinned stage: the part above its sweep line (data-sweep, a fraction of
  // its height) is drawn while it rises, the rest while it is held. A stage
  // that rises over another scene brings the head in on its top edge.
  const stageReach = (s, y, card) => {
    const f = y / s.stageH;
    const a = s.sweep;
    if (f <= a) return card && s.rise > 0 ? s.top - s.rise * (1 - f / a) : s.top + (f - a) * s.stageH;
    return s.top + clamp01((f - a) / (1 - a)) * s.hold;
  };

  const stageSvgFor = (s) => {
    let svg = stageSvgs.get(s.stage);
    if (!svg) {
      svg = make('svg', { class: 'thread thread--stage', 'aria-hidden': 'true', focusable: 'false', preserveAspectRatio: 'none' });
      s.stage.append(svg);
      stageSvgs.set(s.stage, svg);
    }
    return svg;
  };

  const buildThread = () => {
    const W = root.clientWidth;
    const small = narrow.matches;
    pageSvg.setAttribute('viewBox', `0 0 ${W} ${document.body.getBoundingClientRect().height.toFixed(0)}`);
    pageSvg.setAttribute('preserveAspectRatio', 'none');

    // Points, grouped into pieces
    const list = [];
    $$('[data-thread], [data-thread-sm], [data-thread-scene], [data-thread-scene-sm]').forEach((el) => {
      const s = sceneOf(el);
      const name = s ? 'data-thread-scene' : 'data-thread';
      const attr = small && el.hasAttribute(`${name}-sm`) ? `${name}-sm` : name;
      const spec = (el.getAttribute(attr) || '').trim();
      if (!spec) return;
      const top = s ? topIn(el, s.stage) : pageTop(el);
      const h = el.offsetHeight;
      const pts = spec.split(/\s+/).map((pair) => {
        const [fx, fy] = pair.split(',').map(Number);
        return [fx * W, top + fy * h];
      });
      const last = list[list.length - 1];
      if (last && last.s === s) last.pts.push(...pts);
      else list.push({ s, pts });
    });

    // Joins, so the pieces read as one line
    list.forEach((pc, i) => {
      const prev = list[i - 1];
      if (!prev) return;
      const end = prev.pts[prev.pts.length - 1];
      if (pc.s) {
        // Into a scene: its piece starts at the top edge of its stage, unless
        // its route comes in from one side
        const [x0, y0] = pc.pts[0];
        if (y0 > 0 && x0 >= 0 && x0 <= W) pc.pts.unshift([prev.s ? end[0] : x0, -0.02 * pc.s.stageH]);
        if (!prev.s) prev.pts.push([pc.pts[0][0], pc.s.top + pc.pts[0][1]]);
        pc.card = !!prev.s;
      } else if (prev.s) {
        // Out of a scene: the page piece starts where the scene's piece ends
        // at the moment the next block begins to rise over it
        const at = prev.s.top + prev.s.hold;
        pc.pts.unshift([end[0], at + end[1]]);
        pc.join = { s: at, y: at + end[1], e: end[1] / vh };
      }
    });

    // Draw them
    pageG.textContent = '';
    stageSvgs.forEach((svg) => { svg.textContent = ''; svg.style.display = 'none'; });
    scenes.forEach((s) => { if (s.stage) s.stage.style.removeProperty('--ox'); });
    heads = [pageHead];
    let sMax = -Infinity;
    pieces = list.filter((pc) => pc.pts.length > 1).map((pc) => {
      let svg = pageG;
      let head = pageHead;
      if (pc.s) {
        svg = stageSvgFor(pc.s);
        svg.setAttribute('viewBox', `0 0 ${W} ${pc.s.stageH.toFixed(0)}`);
        svg.classList.toggle('thread--dark', pc.s.dark);
        svg.style.display = '';
        // The stage tilts away about the point where its line leaves it, so
        // the line still meets the next scene's line while that one rises
        const end = pc.pts[pc.pts.length - 1];
        pc.s.ox = clamp01(end[0] / W) * W;
        pc.s.stage.style.setProperty('--ox', `${(clamp01(end[0] / W) * 100).toFixed(2)}%`);
      }
      const d = curve(pc.pts);
      make('path', { class: 'thread-ghost', d }, svg);
      const line = make('path', { class: 'thread-line', d }, svg);
      const light = pc.s ? null : make('path', { class: 'thread-line thread-line--light', d, 'clip-path': 'url(#thread-dark)' }, svg);
      if (pc.s) { head = makeHead(svg); heads.push(head); }
      const total = line.getTotalLength();
      [line, light].forEach((p) => {
        if (!p) return;
        p.style.strokeDasharray = `${total} ${total}`;
        p.style.strokeDashoffset = String(total);
      });

      // How far the line has got at each length: the scroll position by which
      // that point is drawn, never earlier than any point before it
      const lens = [];
      const reach = [];
      for (let l = 0; ; l += 8) {
        const len = Math.min(l, total);
        const p = line.getPointAtLength(len);
        let s = pc.s ? stageReach(pc.s, p.y, pc.card) : pageReach(p.y);
        if (pc.join) s = Math.min(s, pc.join.s + (p.y - pc.join.y) / Math.max(0.2, 1 + HEAD - pc.join.e));
        sMax = Math.max(sMax, s);
        lens.push(len);
        reach.push(sMax);
        if (len >= total) break;
      }
      return { s: pc.s, line, light, head, total, lens, reach, drawn: -1 };
    });

    // Over dark blocks on the page the line switches to a lighter blue
    // (a pinned dark scene does that in its own stage)
    darkClip.textContent = '';
    darkRects = tones.filter((t) => t.dark && !t.s).map((t) => ({ top: t.top, bottom: t.top + t.h }));
    darkRects.forEach((r) => make('rect', {
      x: '0', y: r.top.toFixed(0), width: String(W), height: (r.bottom - r.top).toFixed(0),
    }, darkClip));
  };

  const drawThread = (y) => {
    if (!pieces.length) return;
    let lens = pieces.map((pc) => {
      if (reduce) return pc.total;
      const r = pc.reach;
      if (r[r.length - 1] <= y) return pc.total;
      if (r[0] > y) return 0;
      let lo = 0;
      let hi = r.length - 1;
      let idx = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (r[mid] <= y) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      return pc.lens[idx];
    });
    // On first load the line draws itself in, whatever the scroll position
    if (!reduce && introStart) {
      const k = easeOut(clamp01((performance.now() - introStart) / INTRO));
      if (k < 1) {
        let budget = lens.reduce((a, b) => a + b, 0) * k;
        lens = lens.map((l) => { const take = Math.min(l, budget); budget -= take; return take; });
      }
    }
    pieces.forEach((pc, i) => {
      if (pc.drawn === lens[i]) return;
      pc.drawn = lens[i];
      const off = (pc.total - lens[i]).toFixed(1);
      pc.line.style.strokeDashoffset = off;
      if (pc.light) pc.light.style.strokeDashoffset = off;
    });
    // One head, at the tip of the first piece that isn't finished
    let shown = null;
    const i = lens.findIndex((len, k) => len < pieces[k].total - 2);
    if (i >= 0 && lens[i] > 4) {
      const pc = pieces[i];
      const p = pc.line.getPointAtLength(lens[i]);
      pc.head.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      if (!pc.s) pc.head.classList.toggle('on-dark', darkRects.some((r) => p.y >= r.top && p.y < r.bottom));
      shown = pc.head;
    }
    heads.forEach((h) => {
      const o = h === shown ? '1' : '0';
      if (h.style.opacity !== o) h.style.opacity = o;
    });
  };

  // ── Scroll-linked updates ─────────────────────────────────────────────
  // This file only publishes numbers; style.css decides what they do.
  //   --p    on [data-fx]: 0 as the element enters at the bottom of the screen, 1 as it leaves at the top
  //   --q    on [data-fx]: reaches 1 when the element's middle is in the middle of the screen
  //   --in   on [data-fx]: 0 as its top edge enters at the bottom, 1 once that edge is most of the way up
  //   --rise on [data-pin]: 0 to 1 as its stage slides up into place
  //   --hold on [data-pin]: 0 to 1 while its stage is pinned on its own
  //   --cover on [data-pin]: 0 to 1 while the next block rises over its stage
  //   --pin  on [data-pin]: 0 to 1 across the whole time its stage is pinned
  // Inside a pinned stage, --p, --q and --in carry on as if the stage were
  // still scrolling, so what it holds keeps arriving while it is pinned.
  const written = new WeakMap();
  const put = (el, name, value) => {
    let cache = written.get(el);
    if (!cache) { cache = {}; written.set(el, cache); }
    if (cache[name] === value) return;
    cache[name] = value;
    el.style.setProperty(name, value);
  };
  const updateScenes = (y) => {
    scenes.forEach((s) => {
      const { rise, hold, cover, pin } = phase(s, y);
      put(s.wrap, '--rise', rise.toFixed(4));
      put(s.wrap, '--hold', hold.toFixed(4));
      put(s.wrap, '--cover', cover.toFixed(4));
      put(s.wrap, '--pin', pin.toFixed(4));
      // Once the next block has covered a stage completely, hide it, so it
      // can't show around the edges of a later scene as that one tilts away
      if (s.stage) {
        const hide = s.pinned && s.nextTop - y <= stageTopAt(s, y) + 0.5;
        if (hide !== s.hidden) {
          s.hidden = hide;
          s.stage.style.visibility = hide ? 'hidden' : '';
        }
      }
    });
  };
  const updateFx = (y) => {
    fxs.forEach((f) => {
      if (reduce) {
        put(f.el, '--p', '.5'); put(f.el, '--q', '1'); put(f.el, '--in', '1');
        return;
      }
      const top = f.s ? f.s.top - y + f.top : f.top - y;
      const p = clamp01((vh - top) / (vh + f.h));
      put(f.el, '--p', p.toFixed(4));
      put(f.el, '--q', clamp01(p * 2).toFixed(4));
      put(f.el, '--in', clamp01((vh - top) / (vh * 0.85)).toFixed(4));
    });
  };

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const prog = clamp01(y / maxScroll);
    const dotY = prog * hudH;
    hud.style.setProperty('--hud-y', `${dotY.toFixed(1)}px`);
    let current = marks[0];
    marks.forEach((m) => { if (m.top <= y + vh * 0.4) current = m; });
    if (current && hudNum.textContent !== current.num) {
      hudNum.textContent = current.num;
      hudName.textContent = current.name;
    }
    // The page behind the scenes turns dark while a dark scene tilts away
    const behind = scenes.some((s) => {
      if (!s.tilts || !s.dark) return false;
      const { cover } = phase(s, y);
      return cover > 0 && cover < 1;
    });
    root.classList.toggle('under-dark', behind);
    brand.classList.toggle('on-dark', darkAt(brandAt[0], brandAt[1], y, behind));
    menuBtn.classList.toggle('on-dark', darkAt(menuAt[0], menuAt[1], y, behind));
    root.classList.toggle('hud-dark', darkAt(hudX, hudTop + dotY, y, behind));
    updateScenes(y);
    updateFx(y);
    drawThread(y);
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
      drawThread(window.scrollY);
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

  // ── Appear on scroll, and counters ────────────────────────────────────
  const appear = $$('.reveal, [data-split]');
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
    appear.forEach((el) => io.observe(el));

    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        countIo.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIo.observe(el));
  } else {
    appear.forEach((el) => el.classList.add('in'));
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
