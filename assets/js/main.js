// Rathin Baraiya — portfolio.
// Without this file every section is still visible and every link works.
// With motion allowed it turns the page into a 3D world: scrolling flies a
// camera along the blue line, and the pieces of each stop float around it.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const clamp01 = (n) => clamp(n, 0, 1);
  // 0 → 1 with a soft start and a soft end
  const smooth = (t) => { const x = clamp01(t); return x * x * x * (x * (x * 6 - 15) + 10); };
  const easeOut = (t) => 1 - Math.pow(1 - clamp01(t), 3);
  const num = (v, fallback) => { const n = parseFloat(v); return Number.isNaN(n) ? fallback : n; };
  const pair = (v) => { const [a, b] = String(v || '0,0').split(','); return [num(a, 0), num(b, 0)]; };

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

  // ── Headings marked data-split: one span per word, numbered with --i ───
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

  // ── Stars behind "What I do" ──────────────────────────────────────────
  $$('.stars').forEach((box) => {
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 90; i++) {
      const star = document.createElement('i');
      star.style.setProperty('--x', `${(rand() * 100).toFixed(2)}%`);
      star.style.setProperty('--y', `${(rand() * 100).toFixed(2)}%`);
      star.style.setProperty('--sz', `${(1 + rand() * 2.2).toFixed(1)}px`);
      star.style.setProperty('--o', (0.2 + rand() * 0.6).toFixed(2));
      star.style.setProperty('--t', `${(2 + rand() * 4).toFixed(1)}s`);
      box.append(star);
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

  const stopEls = $$('[data-stop]');
  const hud = $('.hud');
  const hudTicks = $('.hud-ticks');
  const hudNum = $('.hud-num');
  const hudName = $('.hud-name');
  const setLabel = (label) => {
    const [n, name] = label.split('|');
    if (hudNum.textContent !== n) { hudNum.textContent = n; hudName.textContent = name; }
  };

  const canvas = $('.line');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

  // ── The ordinary page (reduced motion, or no canvas) ──────────────────
  // The progress rail follows the scroll, and the header and rail switch to
  // light colours over the dark sections.
  if (reduce || !ctx || !window.requestAnimationFrame) {
    let marks = [];
    let max = 1;
    const measure = () => {
      max = Math.max(1, root.scrollHeight - innerHeight);
      marks = stopEls.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + scrollY, bottom: r.bottom + scrollY, dark: el.hasAttribute('data-dark'), hud: el.dataset.hud || '' };
      });
      hudTicks.textContent = '';
      marks.filter((m) => m.hud).forEach((m) => {
        const tick = document.createElement('i');
        tick.style.top = `${(clamp01(m.top / max) * hud.offsetHeight).toFixed(1)}px`;
        hudTicks.append(tick);
      });
    };
    const darkAt = (y) => marks.some((m) => m.dark && y >= m.top && y < m.bottom);
    const update = () => {
      const y = scrollY;
      const dotY = clamp01(y / max) * hud.offsetHeight;
      hud.style.setProperty('--hud-y', `${dotY.toFixed(1)}px`);
      let current = marks.find((m) => m.hud);
      marks.forEach((m) => { if (m.hud && m.top <= y + innerHeight * 0.4) current = m; });
      if (current) setLabel(current.hud);
      root.classList.toggle('hdr-dark', darkAt(y + 36));
      root.classList.toggle('hud-dark', darkAt(y + hud.getBoundingClientRect().top + dotY));
    };
    let ticking = false;
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); }
    }, { passive: true });
    const refresh = () => { measure(); update(); };
    addEventListener('resize', refresh);
    addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    refresh();
    return;
  }

  // ── The 3D world ──────────────────────────────────────────────────────
  // Stops sit one behind another along the depth axis (z). The scroll
  // position becomes the camera's z: it parks in front of each stop for a
  // moment, then flies on to the next. A piece at distance r from the camera
  // is drawn at scale F / r around the middle of the screen (F is the focal
  // length), so when the camera is parked one F in front of a stop, its
  // pieces sit exactly at their data-at places, at full size.
  root.classList.add('world');
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch { /* not allowed */ }

  const spacer = $('.spacer');
  const portalEl = $('[data-portal]');
  const panel = portalEl ? $('.mandli-panel', portalEl) : null;
  const panelContent = panel ? $('.mandli-grid', panel) : null;
  const flies = portalEl ? $$('.fly', portalEl) : [];
  const counters = $$('[data-count]');
  const worldEl = $('#world');
  // The car at the end of the line. data-line-end marks where its ribbon
  // starts (fractions of its box): the line ends there, and the car grows out
  // of the line's blue dot from there.
  const car = $('.car');
  const lineEnd = car ? pair(car.dataset.lineEnd || '0,0.5') : [0, 0.5];
  if (car) car.style.transformOrigin = `${(lineEnd[0] * 100).toFixed(2)}% ${(lineEnd[1] * 100).toFixed(2)}%`;
  const narrowQuery = window.matchMedia('(max-width: 759px), (max-width: 999px) and (orientation: portrait)');

  // The tall "large viewport" height, so the phone's address bar sliding in
  // and out doesn't resize the world
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
  document.body.append(probe);

  const AHEAD = 2.8;  // how far ahead of the camera the line reaches, in F
  let W = 0;
  let H = 0;
  let F = 900;
  let narrow = false;
  let stops = [];
  let pieces = [];
  let keys = [];
  let curve = [];
  let endZ = 0;
  let total = 1;
  let portal = null;
  let numbersStop = null;
  let carPiece = null; // the piece holding the car
  let bendZ = 0;       // the line's first bend
  let homeZ = 0;       // where the car waits on the line at the top of the page
  let homeU = 1;       // how much scrolling turns it into the dot
  let homeSize = 1;    // its size there (smaller where the screen is tight)
  let carZ0 = 0;       // camera z where the line reaches its end: still the dot there …
  let carZ1 = 1;       // … and where it arrives at Contact: the car by then
  let home = null;     // the copy of the car that waits at the top
  let opening = null;  // the opening's timing, while the line grows in

  // ── The car and the dot ───────────────────────────────────────────────
  // The line's blue dot is the car, far ahead. At the top of the page a copy
  // of the car waits on the line below your name (when the page opens it
  // drives in on the tip of the line and parks there), and the first bit of
  // scrolling turns it into the dot. Near the end the dot turns back into the
  // car, bit by bit as you scroll, from where the line reaches its end until
  // the camera arrives at Contact. Scrolling back undoes both.
  let carM = 0;  // the car at the end: 0 the dot … 1 the car
  let homeM = 0; // the car at the top: 0 the dot … 1 the car
  // Grows past full size a little, then settles
  const backOut = (t) => { const x = clamp01(t) - 1; return 1 + 2.3 * x * x * x + 1.3 * x * x; };
  // How the car and the dot look part-way through the change (m: 0 dot … 1 car)
  const morphLook = (m) => ({
    scale: m <= 0 ? 0 : backOut(smooth(m)),
    solid: 1 - smooth((m - 0.2) / 0.5), // solid blue, like the dot, while small
    dot: 1 - smooth(m * 2),              // the dot shrinks away as the car grows from it
  });

  const build = () => {
    W = root.clientWidth;
    H = Math.max(innerHeight, probe.offsetHeight || 0);
    narrow = narrowQuery.matches;
    F = narrow ? 900 : clamp(W * 0.8, 900, 1400);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Stops, one behind another
    let z = 0;
    stops = stopEls.map((el, i) => {
      const gap = num(el.dataset.gap, 3);
      if (i) z += gap * F;
      const [ax, ay] = pair(narrow && el.dataset.lineM ? el.dataset.lineM : el.dataset.line);
      const swing = narrow && el.dataset.swingM ? el.dataset.swingM : el.dataset.swing;
      return {
        el, i, z, gap, ax, ay,
        hold: num(el.dataset.hold, 0.6),
        ease: num(el.dataset.ease, 1),
        swing: swing ? pair(swing) : null,
        dark: el.hasAttribute('data-dark'),
        portal: el.hasAttribute('data-portal'),
        hud: el.dataset.hud || '',
        holdStart: 0, // scroll position where the camera parks (set below)
        holdPx: 0,    // how much scrolling it stays parked for
      };
    });
    portal = stops.find((s) => s.portal) || null;
    numbersStop = stops.find((s) => s.el.querySelector('[data-count]')) || null;

    // Pieces. On phones a stop's pieces stack in a column in the middle of
    // the screen, below the header, unless a piece has its own data-at-m.
    pieces = [];
    const headerRoom = 64;
    const bottomRoom = 24;
    stops.forEach((s) => {
      const own = $$('[data-at]', s.el).filter((p) => p.closest('[data-stop]') === s.el && getComputedStyle(p).display !== 'none');
      const place = new Map();
      if (narrow) {
        const column = own.filter((p) => !p.hasAttribute('data-at-m'));
        const gapPx = 20;
        const heights = column.map((p) => p.offsetHeight);
        const sum = heights.reduce((a, b) => a + b, 0) + gapPx * Math.max(0, column.length - 1);
        let y = headerRoom + Math.max(0, (H - headerRoom - bottomRoom - sum) / 2);
        column.forEach((p, k) => {
          place.set(p, [0, (y + heights[k] / 2 - H / 2) / H]);
          y += heights[k] + gapPx;
        });
      }
      own.forEach((p) => {
        let at = pair(p.dataset.at);
        if (narrow) at = p.hasAttribute('data-at-m') ? pair(p.dataset.atM) : place.get(p);
        const depth = num(p.dataset.depth, 0);
        const [dx, dy] = pair(p.dataset.drift);
        pieces.push({
          el: p, s, depth,
          x: at[0], y: at[1],
          z: s.z + depth * F,
          d: F * (1 + depth),                      // its distance when the camera is parked
          dx: narrow ? dx * 0.5 : dx, dy,
          turn: narrow ? 0 : num(p.dataset.turn, 0),
          fade: clamp(s.gap * 0.82, 1, 1.7) * F,  // how far ahead it starts to appear
          shown: false, live: false, vars: {},
        });
        // Nearer stops, and nearer pieces within a stop, are drawn on top
        p.style.zIndex = String(1000 - s.i * 10 - Math.round(depth * 4));
      });
    });

    // The line ends where the ribbon under the car begins, wherever and however
    // big the car is on this screen. The drawing marks that point itself:
    // data-line-end="x,y" as fractions of its box.
    carPiece = car ? pieces.find((p) => p.el.contains(car)) || null : null;
    if (carPiece) {
      const [ex, ey] = lineEnd;
      carPiece.s.ax = carPiece.x + ((ex - 0.5) * carPiece.el.offsetWidth) / W;
      carPiece.s.ay = carPiece.y + ((ey - 0.5) * carPiece.el.offsetHeight) / H;
    }

    // The camera's path: scroll position → z. It arrives a little short of
    // each stop, drifts slowly through the hold, then flies to the next.
    keys = [];
    let sc = 0;
    const travel = 0.44 * H;
    stops.forEach((s, i) => {
      if (i) sc += s.gap * travel;
      const lead = i === 0 || s.portal ? 0 : 0.11;
      const drift = s.portal ? 0 : i === 0 ? 0.18 : 0.11;
      s.holdStart = sc;
      s.holdPx = s.hold * H * (s.portal ? 1 : 0.6);
      keys.push({ sc, z: s.z - F - lead * F, ease: i ? 0.5 * s.ease : 0 });
      sc += s.holdPx;
      keys.push({ sc, z: s.z - F + drift * F, ease: 0 });
    });
    total = sc;
    spacer.style.height = `${Math.round(total + H)}px`;

    // The line: through each stop's data-line point. Between stops that are
    // far apart it swings out to one side, alternating left and right. The
    // swing is scaled by the gap, so that from the parked camera it always
    // reaches about the same place near the edge of the screen. It starts just
    // off the side of the screen, so on load it comes in to the name.
    const pts = [];
    const first = stops[0];
    const side0 = first.ax >= 0 ? 1 : -1;
    pts.push({ z: first.z - 0.72 * F, x: (first.ax + 0.75 * side0) * W, y: (first.ay + 0.04) * H });
    let side = -side0;
    stops.forEach((s, i) => {
      if (i && s.gap >= 1.6) {
        const prev = stops[i - 1];
        const reach = 1 + s.gap / 2; // the swing point's distance from the parked camera, in F
        const [sx, sy] = s.swing || [side * (narrow ? 0.36 : 0.42) * reach, (side < 0 ? 0.44 : -0.42) * reach / 2.5];
        side = -side;
        pts.push({ z: (prev.z + s.z) / 2, x: sx * W, y: sy * H });
      }
      pts.push({ z: s.z, x: s.ax * W, y: s.ay * H });
    });
    endZ = pts[pts.length - 1].z;
    bendZ = pts.length > 2 ? pts[2].z : endZ;

    // A smooth curve through the points (x and y as functions of z)
    curve = [];
    const n = pts.length;
    const slope = (i, key) => {
      if (i === 0) return 0;
      // At the end the line arrives level, from the left, as seen from the
      // parked camera (x/F, y/F keep a point still on screen as z grows), so
      // it runs straight into the start of the ribbon instead of hooking into it
      if (i === n - 1) return pts[i][key] / F + (key === 'x' ? 0.25 : 0);
      return (pts[i + 1][key] - pts[i - 1][key]) / Math.max(1, pts[i + 1].z - pts[i - 1].z);
    };
    for (let i = 0; i < n - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.max(1, b.z - a.z);
      const ax = slope(i, 'x') * len;
      const ay = slope(i, 'y') * len;
      const bx = slope(i + 1, 'x') * len;
      const by = slope(i + 1, 'y') * len;
      const steps = Math.max(24, Math.round((len / F) * 44));
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        const h1 = 2 * t3 - 3 * t2 + 1;
        const h2 = t3 - 2 * t2 + t;
        const h3 = -2 * t3 + 3 * t2;
        const h4 = t3 - t2;
        curve.push({ z: a.z + len * t, x: h1 * a.x + h2 * ax + h3 * b.x + h4 * bx, y: h1 * a.y + h2 * ay + h3 * b.y + h4 * by });
      }
    }
    curve.push({ z: pts[n - 1].z, x: pts[n - 1].x, y: pts[n - 1].y });

    // The car at the top waits on the line's way in, before its first bend,
    // as seen from the top of the page: with its nose under the start of your
    // name (15% in from the edge it is heading for), or else at the nearest
    // place along the line from there where it is clear of the words and the
    // header on this screen. If there is no such place, it is a little smaller.
    homeZ = bendZ - 0.25 * F;
    homeSize = 1;
    if (carPiece) {
      const camZ = keys[0].z;
      const w = carPiece.el.offsetWidth;
      const h = carPiece.el.offsetHeight;
      const near = camZ + 0.25 * F;
      const far = bendZ - 0.2 * F;
      const at = (z) => { const p = curveAt(z); const k = F / (z - camZ); return [W / 2 + p.x * k, H / 2 + p.y * k, k]; };
      // The box around the car (and its ribbon) parked at z, mirrored and
      // tilted to the line the way updateHome draws it
      const carBox = (z, size = 1) => {
        const [X, Y, k] = at(z);
        const [Xb, Yb] = at(z - 0.01 * F);
        const flip = X - Xb < 0 ? -1 : 1;
        const a = clamp(Math.atan2(flip * (Y - Yb), flip * (X - Xb)), -0.5, 0.5);
        const s = Math.min(k, 1.15) * size;
        const xs = [];
        const ys = [];
        [[0.005, 0.04], [0.92, 0.04], [0.92, 0.9], [0.005, 0.9]].forEach(([fx, fy]) => {
          const u = flip * (fx - lineEnd[0]) * w * s;
          const v = (fy - lineEnd[1]) * h * s;
          xs.push(X + u * Math.cos(a) - v * Math.sin(a));
          ys.push(Y + u * Math.sin(a) + v * Math.cos(a));
        });
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), X - Xb];
      };
      const words = pieces.filter((p) => p.s === stops[0]).map((p) => {
        const cx = W / 2 + p.x * W;
        const cy = H / 2 + p.y * H;
        const pw = p.el.offsetWidth / 2 + 8;
        const ph = p.el.offsetHeight / 2 + 8;
        return [cx - pw, cy - ph, cx + pw, cy + ph];
      });
      const clear = (z, size) => {
        const b = carBox(z, size);
        return b[0] >= 8 && b[2] <= W - 30 && b[1] >= headerRoom && b[3] <= H - 8
          && words.every((r) => b[2] <= r[0] || b[0] >= r[2] || b[3] <= r[1] || b[1] >= r[3]);
      };
      let want = far;
      for (let z = near; z < far; z += 0.01 * F) {
        const b = carBox(z);
        const nose = b[4] < 0 ? b[0] : b[2];
        if (b[4] < 0 ? nose <= 0.15 * W : nose >= 0.85 * W) { want = z; break; }
      }
      homeZ = want;
      homeSize = 0.6;
      find: for (const size of [1, 0.9, 0.8, 0.7, 0.6]) {
        for (let d = 0; d <= far - near; d += 0.01 * F) {
          const z = [want - d, want + d].find((c) => c >= near && c <= far && clear(c, size));
          if (z !== undefined) { homeZ = z; homeSize = size; break find; }
        }
      }
    }
    homeU = Math.max(1, stops[0].holdPx + 0.15 * H); // the hold at the top, and a little of the flight on
    carZ0 = endZ - AHEAD * F;
    carZ1 = keys[keys.length - 2].z;

    // Ticks on the progress rail for the main stops
    hudTicks.textContent = '';
    stops.filter((s) => s.hud).forEach((s) => {
      const tick = document.createElement('i');
      tick.style.top = `${(clamp01(s.holdStart / Math.max(1, total)) * hud.offsetHeight).toFixed(1)}px`;
      hudTicks.append(tick);
    });
  };

  const cameraZ = (sc) => {
    if (sc <= keys[0].sc) return keys[0].z;
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1];
      const b = keys[i];
      if (sc <= b.sc) {
        let t = (sc - a.sc) / Math.max(1, b.sc - a.sc);
        t += (smooth(t) - t) * b.ease;
        return a.z + (b.z - a.z) * t;
      }
    }
    return keys[keys.length - 1].z;
  };

  // The line's point at depth z (the curve is sampled in order of z)
  const curveAt = (z) => {
    let lo = 0;
    let hi = curve.length - 1;
    if (z <= curve[lo].z) return curve[lo];
    if (z >= curve[hi].z) return curve[hi];
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (curve[mid].z <= z) lo = mid; else hi = mid;
    }
    const a = curve[lo];
    const b = curve[hi];
    const t = (z - a.z) / Math.max(1e-6, b.z - a.z);
    return { z, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  // ── Colours: the whole page fades to dark around the dark stops ────────
  const LIGHT = { '--bg': [236, 234, 226], '--ink': [18, 20, 19], '--ink-2': [59, 64, 61], '--muted': [94, 99, 96], '--hair': [211, 208, 198], '--blue': [34, 52, 224] };
  const DARK = { '--bg': [13, 14, 14], '--ink': [236, 234, 226], '--ink-2': [217, 215, 208], '--muted': [163, 168, 165], '--hair': [52, 55, 53], '--blue': [141, 151, 255] };
  const mixRGB = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  let darkness = -1;
  let lineColor = 'rgb(34,52,224)';
  const theme = (camZ) => {
    let d = 0;
    stops.forEach((s) => {
      if (!s.dark) return;
      const u = s.z - camZ - F; // 0 while parked at it; > 0 still ahead
      d = Math.max(d, Math.min(1 - smooth((u - 0.6 * F) / (0.8 * F)), 1 - smooth((-u - 0.9 * F) / (0.6 * F))));
    });
    if (Math.abs(d - darkness) < 0.003) return;
    darkness = d;
    Object.keys(LIGHT).forEach((name) => {
      const c = mixRGB(LIGHT[name], DARK[name], d);
      root.style.setProperty(name, `rgb(${c.join(',')})`);
      if (name === '--blue') lineColor = `rgb(${c.join(',')})`;
    });
  };

  // ── The line ──────────────────────────────────────────────────────────
  // Drawn from just in front of the camera to `ahead` beyond it: thick and
  // solid nearby, thin and faint far away, with a dot at its tip.
  let ahead = 0;
  const drawLine = (camZ) => {
    ctx.clearRect(0, 0, W, H);
    const near = 0.1 * F;
    const tipZ = Math.min(camZ + ahead, endZ);
    if (tipZ <= camZ + near) return;
    const cx = W / 2;
    const cy = H / 2;
    ctx.strokeStyle = lineColor;
    // Flat ends: the line is drawn in short runs of one width and opacity, and
    // round ends would overlap where two runs meet and show as darker beads
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    let prev = null;
    let run = null;
    let tip = null;
    for (let i = 0; i < curve.length; i++) {
      let p = curve[i];
      if (p.z < camZ + near) { prev = null; continue; }
      if (p.z > tipZ) {
        if (!prev) break;
        const q = curve[i - 1];
        const t = (tipZ - q.z) / Math.max(1e-6, p.z - q.z);
        p = { z: tipZ, x: q.x + (p.x - q.x) * t, y: q.y + (p.y - q.y) * t };
      }
      const dz = p.z - camZ;
      const k = F / dz;
      const X = cx + p.x * k;
      const Y = cy + p.y * k;
      if (prev) {
        if (Math.abs(X - prev.X) + Math.abs(Y - prev.Y) < 1 && p.z < tipZ) continue;
        const a = Math.round(smooth((dz - near) / (0.3 * F)) * (1 - 0.8 * smooth((dz - 1.2 * F) / ((AHEAD - 1.2) * F))) * 40) / 40;
        const w = Math.round(clamp(2.4 * k, 0.6, 7) * 4) / 4;
        if (a <= 0) {
          if (run) { ctx.stroke(); run = null; }
        } else {
          if (!run || run.a !== a || run.w !== w) {
            if (run) ctx.stroke();
            run = { a, w };
            ctx.globalAlpha = a;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(prev.X, prev.Y);
          }
          ctx.lineTo(X, Y);
        }
      }
      prev = { X, Y };
      tip = { X, Y, k };
      if (p.z >= tipZ) break;
    }
    if (run) ctx.stroke();
    ctx.globalAlpha = 1;
    // The tip: the blue dot. It hands over to the car while the car is on screen:
    // at the end of the line, and while the opening car rides the tip.
    if (!tip) return;
    let dot = tipZ >= endZ - 1 ? morphLook(carM).dot : 1;
    if (home) dot = Math.min(dot, 1 - smooth(homeM / 0.25)); // the car only becomes the dot at the end of its drive
    if (dot < 0.01) return;
    const r = clamp(5 * tip.k, 2.5, 14) * dot;
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(tip.X, tip.Y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(tip.X, tip.Y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  // ── Pieces ────────────────────────────────────────────────────────────
  // Far ahead a piece is small, faded, waiting to one side (data-drift) and
  // turned (data-turn). It settles at its place as the camera parks, then
  // grows and fades as the camera flies past. It also publishes --far,
  // --arrive and --leave for style.css.
  const setVar = (p, name, value) => {
    if (p.vars[name] === value) return;
    p.vars[name] = value;
    p.el.style.setProperty(name, value);
  };
  const placePieces = (camZ) => {
    const cx = W / 2;
    const cy = H / 2;
    pieces.forEach((p) => {
      const r = p.z - camZ;
      const o = r - p.d; // > 0: still ahead of its parked place
      let alpha = 0;
      if (r > 0.16 * F && o < 2.7 * F) {
        alpha = o > 0
          ? 1 - smooth((o - 0.45 * p.fade) / (0.55 * p.fade))
          : 1 - smooth((-o - 0.22 * F) / (0.42 * F));
      }
      // The car is there as soon as the dot has turned into it, however far away
      if (p === carPiece) alpha = r > 0.16 * F && carM > 0.001 ? 1 : 0;
      if (alpha < 0.01) {
        if (p.shown) {
          p.shown = false;
          p.live = false;
          p.el.style.visibility = 'hidden';
          p.el.style.pointerEvents = 'none';
        }
        return;
      }
      const far = o > 0 ? smooth(o / (1.9 * F)) : 0;
      const scale = p.d / r;
      const x = (p.x + p.dx * far) * W;
      const y = (p.y + p.dy * far) * H;
      if (!p.shown) { p.shown = true; p.el.style.visibility = 'visible'; }
      p.el.style.opacity = alpha.toFixed(3);
      p.el.style.transform = `translate3d(${(cx + x * scale).toFixed(1)}px,${(cy + y * scale).toFixed(1)}px,0) translate(-50%,-50%) perspective(1100px) rotateY(${(p.turn * far).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      setVar(p, '--far', far.toFixed(3));
      setVar(p, '--arrive', clamp01((0.55 * F - o) / (0.65 * F)).toFixed(3));
      setVar(p, '--leave', smooth((-o - 0.03 * F) / (0.38 * F)).toFixed(3));
      const live = alpha > 0.6 && scale < 1.6;
      if (live !== p.live) { p.live = live; p.el.style.pointerEvents = live ? 'auto' : 'none'; }
    });
  };

  // ── Mandli opens out of the line ──────────────────────────────────────
  // A purple circle grows from the point where the line passes the Mandli
  // stop until it fills the screen; its content flies in; then the panel
  // tilts away and shrinks like a card as the camera moves on.
  let portalOn = false;
  const updatePortal = (sc, camZ) => {
    if (!portal) return;
    const s0 = portal.holdStart;
    const len = portal.holdPx;
    const open = smooth((sc - (s0 - 0.75 * H)) / (1.05 * H));
    // It shrinks away as the camera leaves, while the first project arrives
    const close = smooth((sc - (s0 + len - 0.7 * H)) / H);
    if (open <= 0 || close >= 1) {
      if (portalOn) {
        portalOn = false;
        portalEl.style.visibility = 'hidden';
        portalEl.style.pointerEvents = 'none';
        root.classList.remove('on-portal');
      }
      return;
    }
    if (!portalOn) { portalOn = true; portalEl.style.visibility = 'visible'; }
    const k = F / Math.max(0.2 * F, portal.z - camZ);
    const ox = W / 2 + portal.ax * W * k;
    const oy = H / 2 + portal.ay * H * k;
    const reach = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
    const radius = reach * open + 1;
    panel.style.clipPath = `circle(${radius.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
    // The header and the rail turn white while the purple is behind them
    const covered = close < 0.06 && Math.hypot(ox, oy) < radius && Math.hypot(W - ox, oy) < radius;
    root.classList.toggle('on-portal', covered);
    panel.style.transform = close > 0
      ? `perspective(1200px) translate3d(0,${(-close * H * 0.04).toFixed(1)}px,0) rotateX(${(close * 14).toFixed(2)}deg) scale(${(1 - 0.84 * close).toFixed(4)})`
      : '';
    panel.style.borderRadius = `${(close * 36).toFixed(1)}px`;
    panel.style.opacity = (1 - smooth((close - 0.7) / 0.3)).toFixed(3);
    const t = (sc - (s0 - 0.3 * H)) / (0.95 * H);
    flies.forEach((el, i) => el.style.setProperty('--q', (1 - smooth(t * 1.6 - i * 0.12)).toFixed(3)));
    // Too tall for the screen (phones): the content scrolls through while the camera holds
    const room = H - 112;
    const over = Math.max(0, panelContent.offsetHeight - room);
    const read = clamp01((sc - (s0 + 0.25 * H)) / Math.max(1, len - 1.4 * H));
    panelContent.style.transform = over ? `translate3d(0,${(over / 2 + 24 - (over + 24) * read).toFixed(1)}px,0)` : '';
    portalEl.style.pointerEvents = open > 0.98 && close < 0.2 ? 'auto' : 'none';
  };

  // ── Counters count up when the camera reaches them ────────────────────
  let counted = false;
  let countRun = 0;
  const runCounters = () => {
    const id = ++countRun;
    const t0 = performance.now();
    const step = (now) => {
      if (id !== countRun) return;
      const t = clamp01((now - t0) / 1600);
      counters.forEach((el) => { el.textContent = String(Math.round(Number(el.dataset.count) * easeOut(t))); });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const updateCounters = (camZ) => {
    if (!numbersStop) return;
    const u = numbersStop.z - camZ - F;
    if (!counted && u < 1.3 * F && u > -0.8 * F) { counted = true; runCounters(); }
    if (counted && (u > 1.6 * F || u < -2 * F)) {
      counted = false;
      countRun++;
      counters.forEach((el) => { el.textContent = '0'; });
    }
  };
  counters.forEach((el) => { el.textContent = '0'; });

  // ── Progress rail ─────────────────────────────────────────────────────
  const updateHud = (sc) => {
    const dotY = clamp01(sc / Math.max(1, total)) * hud.offsetHeight;
    hud.style.setProperty('--hud-y', `${dotY.toFixed(1)}px`);
    let current = stops[0];
    stops.forEach((s) => { if (s.hud && s.holdStart <= sc + 0.6 * H) current = s; });
    if (current && current.hud) setLabel(current.hud);
  };

  // ── In-page links fly the camera to their stop ────────────────────────
  const stopFor = (hash) => {
    if (!hash || hash === '#' || hash === '#top') return stops[0];
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return null;
    return stops.find((s) => s.el === el || s.el.contains(el)) || null;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const hash = a.getAttribute('href');
    const s = stopFor(hash);
    if (!s) return;
    e.preventDefault();
    window.scrollTo(0, s.holdStart + 2);
    history.pushState(null, '', hash === '#top' ? location.pathname + location.search : hash);
  });

  // ── The car at the end ────────────────────────────────────────────────
  // It grows out of the dot from the start of its ribbon, where the line
  // ends, and shrinks back into it if you scroll back.
  let carShown = '';
  const updateCar = () => {
    if (!carPiece) return;
    const key = carM.toFixed(3);
    if (key === carShown) return;
    carShown = key;
    const look = morphLook(carM);
    car.style.transform = carM >= 1 ? '' : `scale(${look.scale.toFixed(4)})`;
    car.style.setProperty('--solid', look.solid.toFixed(3));
  };

  // ── The opening ───────────────────────────────────────────────────────
  // When the page opens at the top, the line grows in with the car on its tip
  // and the car parks at its place below your name (homeZ). The tip moves at
  // an even pace on screen (stretches off-screen are squeezed to the edge, so
  // no time is spent there) and slows down as the car parks.
  const OPENING = 2.2; // seconds
  const planOpening = () => {
    const camZ = cameraZ(camS);
    const z0 = camZ + 0.1 * F;
    const z1 = Math.max(z0 + 0.01 * F, homeZ);
    const table = [];
    let len = 0;
    let last = null;
    for (let i = 0; i <= 240; i++) {
      const z = z0 + ((z1 - z0) * i) / 240;
      const p = curveAt(z);
      const k = F / (z - camZ);
      const X = clamp(W / 2 + p.x * k, -0.1 * W, 1.1 * W);
      const Y = clamp(H / 2 + p.y * k, -0.1 * H, 1.1 * H);
      if (last) len += Math.hypot(X - last[0], Y - last[1]);
      last = [X, Y];
      table.push({ z, len });
    }
    opening = { table, len };
  };
  // Where the tip has got to t seconds into the opening
  const openingZ = (t) => {
    const { table, len } = opening;
    const want = smooth(t / OPENING) * len;
    let lo = 0;
    let hi = table.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (table[mid].len < want) lo = mid; else hi = mid;
    }
    const a = table[lo];
    const b = table[hi];
    const u = b.len > a.len ? clamp01((want - a.len) / (b.len - a.len)) : 1;
    return a.z + (b.z - a.z) * u;
  };

  // ── The car at the top ────────────────────────────────────────────────
  // A copy of the car, on the tip of the line: parked below your name, or on
  // its way in while the page opens.
  const sizeHome = () => {
    if (!home) return;
    home.w = home.el.offsetWidth;
    home.h = home.el.offsetHeight;
  };
  const makeHome = () => {
    const el = document.createElement('div');
    el.className = 'car-home';
    el.setAttribute('aria-hidden', 'true');
    const svg = car.cloneNode(true);
    svg.removeAttribute('style');
    el.append(svg);
    worldEl.prepend(el); // below every piece, above the line
    home = { el, face: -1, angle: 0, fit: 1, w: 0, h: 0, shown: false };
    sizeHome();
  };
  const updateHome = (camZ, tipZ, dt) => {
    const h = home;
    if (homeM <= 0.001 || tipZ <= camZ + 0.12 * F) {
      if (h.shown) { h.shown = false; h.el.style.visibility = 'hidden'; }
      return;
    }
    const p = curveAt(tipZ);
    const k = F / (tipZ - camZ);
    const X = W / 2 + p.x * k;
    const Y = H / 2 + p.y * k;
    // It faces the way the line runs on, tilted along it. It is drawn facing
    // right, so it is mirrored where the line runs left; where the line turns
    // back on itself, it turns round in one go (never squeezed).
    const zb = Math.max(camZ + 0.11 * F, tipZ - 0.03 * F);
    const b = curveAt(zb);
    const kb = F / (zb - camZ);
    const dX = X - (W / 2 + b.x * kb);
    const dY = Y - (H / 2 + b.y * kb);
    const d = Math.hypot(dX, dY);
    if (d > 0.05) {
      const c = dX / d;
      if (homeM >= 0.999) h.face = c < 0 ? -1 : 1;
      else if (h.face < 0 ? c > 0.08 : c < -0.08) h.face = -h.face;
      const want = clamp(Math.atan2(h.face * dY, h.face * dX), -0.5, 0.5);
      h.angle += (want - h.angle) * (opening && h.shown ? 1 - Math.exp(-dt * 12) : 1);
    }
    // As it drives on into the dot it gets smaller, toward the start of its
    // ribbon, where the line ends, turning solid blue toward the end. Where a
    // bend comes close to the edge of the screen it gets smaller sooner, so
    // its nose stays on screen (and it doesn't grow back on the way on).
    if (homeM >= 0.999) h.fit = 1;
    let s = Math.min(k, 1.15) * homeSize * Math.pow(homeM, 0.7);
    const room = (h.face < 0 ? X : W - X) - 6;
    h.fit = Math.min(h.fit, clamp(room / (0.92 * h.w * Math.max(s, 1e-3) * Math.cos(h.angle)), 0.25, 1));
    s *= h.fit;
    const flip = h.face;
    const solid = 1 - smooth((homeM - 0.15) / 0.45);
    h.el.style.transform = `translate3d(${X.toFixed(1)}px,${Y.toFixed(1)}px,0) rotate(${h.angle.toFixed(4)}rad) scale(${(flip * s).toFixed(4)},${s.toFixed(4)}) translate(${(-lineEnd[0] * h.w).toFixed(1)}px,${(-lineEnd[1] * h.h).toFixed(1)}px)`;
    h.el.style.setProperty('--solid', solid.toFixed(3));
    if (!h.shown) { h.shown = true; h.el.style.visibility = 'visible'; }
  };

  // ── The loop ──────────────────────────────────────────────────────────
  // The page scrolls natively; the camera eases after the scroll position,
  // faster across long jumps, so everything glides.
  let camS = 0;
  let lastT = performance.now();
  let lastS = NaN;
  let lastAhead = NaN;
  let dirty = true;
  const introAt = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const target = window.scrollY;
    const diff = target - camS;
    camS += diff * (1 - Math.exp(-dt * (Math.abs(diff) > 3 * H ? 9 : 5.5)));
    if (Math.abs(target - camS) < 0.3) camS = target;
    const t = (now - introAt - 250) / 1000;
    if (opening && t >= OPENING) opening = null;
    const camZ = cameraZ(camS);
    // The line's tip. It keeps a little way ahead of the camera (on load it
    // grows out to there). At the top of the page it is where the car waits,
    // or where the car has got to on its way in while the page opens; the
    // first bit of scrolling turns the car into the dot and sends it on ahead.
    const lead = camZ + AHEAD * F * (opening ? 1 : smooth(t / 1.7));
    let tipZ = lead;
    homeM = 0;
    if (home) {
      // It moves off at once and eases in to the dot's place, getting smaller
      // all the way: by the time it gets there it is the dot
      const u = clamp01(camS / homeU);
      const go = 1 - (1 - u) * (1 - u);
      const rest = opening ? openingZ(Math.max(0, t)) : homeZ;
      tipZ = rest + (lead - rest) * go;
      homeM = 1 - go;
    }
    ahead = tipZ - camZ;
    // Near the end the dot turns into the car as you scroll: still the dot where
    // the line reaches its end, the car by the time the camera arrives at
    // Contact. (If the page opens there, it pops out once the line grows in.)
    const carWant = camZ + ahead >= endZ - 1 ? smooth((camZ - carZ0) / (0.75 * (carZ1 - carZ0))) : 0;
    if (carM !== carWant) {
      carM += (carWant - carM) * (1 - Math.exp(-dt * 8));
      if (Math.abs(carWant - carM) < 0.002) carM = carWant;
      dirty = true;
    }
    if (dirty || camS !== lastS || ahead !== lastAhead) {
      dirty = false;
      lastS = camS;
      lastAhead = ahead;
      theme(camZ);
      if (home) updateHome(camZ, Math.min(tipZ, endZ), dt);
      drawLine(camZ);
      placePieces(camZ);
      updateCar();
      updatePortal(camS, camZ);
      updateCounters(camZ);
      updateHud(camS);
    }
    requestAnimationFrame(frame);
  };

  const rebuild = () => {
    const progress = clamp01(window.scrollY / Math.max(1, total));
    build();
    const y = progress * total;
    window.scrollTo(0, y);
    camS = y;
    if (opening) planOpening();
    sizeHome();
    dirty = true;
  };
  let resizeTimer = 0;
  let lastWidth = innerWidth;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  addEventListener('resize', () => {
    // On phones the address bar sliding in and out only changes the height: ignore that
    if (coarse && innerWidth === lastWidth) return;
    lastWidth = innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  addEventListener('load', rebuild);

  build();
  // Start at the top, or at the stop the address points to
  const startStop = location.hash ? stopFor(location.hash) : null;
  const startY = startStop && startStop !== stops[0] ? startStop.holdStart + 2 : 0;
  window.scrollTo(0, startY);
  camS = startY;
  // The car at the top; when the page opens there, it drives in on the line
  if (car && worldEl) {
    makeHome();
    if (startY === 0) planOpening();
  }
  requestAnimationFrame(frame);
})();
