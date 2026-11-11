// Small progressive enhancements. Without this file every section is still
// visible and every link works; it only adds motion and conveniences.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  // ── Headline: split into words for a staggered rise ──────────────────
  document.querySelectorAll('.split').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const outer = document.createElement('span');
            outer.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'wi';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            outer.append(inner);
            frag.append(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  });

  // ── Reveal on scroll ─────────────────────────────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  const stamps = document.querySelectorAll('[data-stamp]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));

    const stampIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('stamped');
        stampIo.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    stamps.forEach((el) => stampIo.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
    stamps.forEach((el) => el.classList.add('stamped'));
  }

  // ── Scroll-linked: progress bar, header border, device fan-out ───────
  const header = document.querySelector('.site-header');
  const progressEls = [...document.querySelectorAll('[data-progress]')];
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    root.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : '0');
    header.classList.toggle('scrolled', y > 8);

    if (!reduceMotion) {
      progressEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        // 0 when the element's top is at the bottom of the screen, 1 once it is 60% of the way up.
        const p = clamp01((vh - r.top) / (vh * 0.6));
        el.style.setProperty('--p', p.toFixed(3));
      });
    }

    // Highlight the nav link for the section in view
    let current = null;
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top < vh * 0.4) current = s;
    });
    navLinks.forEach((a) => {
      const on = current && a.getAttribute('href') === `#${current.id}`;
      a.classList.toggle('active', !!on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };

  const requestTick = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  // ── Hero tilt (mouse only) ───────────────────────────────────────────
  const tilt = document.querySelector('[data-tilt]');
  const hero = document.querySelector('.hero');
  if (tilt && hero && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      tilt.style.setProperty('--ry', `${(dx * 7).toFixed(2)}deg`);
      tilt.style.setProperty('--rx', `${(-dy * 5).toFixed(2)}deg`);
    });
    hero.addEventListener('pointerleave', () => {
      tilt.style.setProperty('--ry', '0deg');
      tilt.style.setProperty('--rx', '0deg');
    });
  }

  // ── Mobile menu ──────────────────────────────────────────────────────
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (menuBtn && menu) {
    const setOpen = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
    };
    menuBtn.addEventListener('click', () => setOpen(menu.hidden));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  // ── Copy email ───────────────────────────────────────────────────────
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('[data-copy-label]');
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
