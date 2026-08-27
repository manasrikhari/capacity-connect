export const mainScript = `
  lucide.createIcons();
  // Fast smooth scroll for nav anchor links (~600 ms, ease-in-out)
  document.querySelectorAll('a[href^="#"]:not(.spy-link)').forEach(function(a) {
    a.addEventListener('click', function(e) {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const hdrH = (document.getElementById('hdr') || {}).offsetHeight || 0;
      const start = window.scrollY;
      const end = target.getBoundingClientRect().top + start - hdrH;
      const duration = 600;
      const t0 = performance.now();
      function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
      function step(now) {
        const t = Math.min((now - t0) / duration, 1);
        window.scrollTo(0, start + (end - start) * ease(t));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  });
  // Header border on scroll
  const hdr = document.getElementById('hdr');
  const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 8);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  // Reveal on scroll. Content is visible by default; only below-fold elements are
  // "armed" (hidden) at load, then animated in as they enter the viewport.
  // Assign reveal "flavors" before collecting, for livelier entrances.
  document.querySelector('.mock') && document.querySelector('.mock').classList.add('from-right');
  document.querySelectorAll('.feat').forEach(f => f.classList.add('zoom'));
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const vh0 = window.innerHeight || document.documentElement.clientHeight;
  // Modern browsers drive reveals purely via CSS animation-timeline:view() (scroll-linked).
  // Only arm the JS threshold fallback when that feature is unsupported.
  const useCssScrollReveal = (window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  if (!useCssScrollReveal) {
    reveals.forEach(el => { if (el.getBoundingClientRect().top >= vh0 * 0.9) el.classList.add('pending'); });
  }
  // Scroll progress bar + subtle hero parallax
  const bar = document.getElementById('scrollbar');
  const mockFrame = document.querySelector('.mock-frame');
  function updateScrollFx() {
    const h = document.documentElement;
    const max = (h.scrollHeight - h.clientHeight) || 1;
    bar.style.width = (Math.min(window.scrollY / max, 1) * 100) + '%';
    if (mockFrame && !document.body.classList.contains('no-anim') && window.scrollY < 1000) {
      mockFrame.style.transform = 'translateY(' + (window.scrollY * -0.035) + 'px)';
    }
  }
  let ticking = false;
  function checkReveals() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (!useCssScrollReveal) {
      for (let i = reveals.length - 1; i >= 0; i--) {
        const el = reveals[i];
        if (el.getBoundingClientRect().top < vh * 0.9) {
          if (el.classList.contains('pending')) { el.classList.remove('pending'); el.classList.add('in'); }
          reveals.splice(i, 1);
        }
      }
    }
    updateScrollFx();
    ticking = false;
  }
  function requestCheck() { if (!ticking) { ticking = true; requestAnimationFrame(checkReveals); } }
  window.addEventListener('scroll', requestCheck, { passive: true });
  window.addEventListener('resize', requestCheck, { passive: true });
  checkReveals();
  // Failsafe: never leave content hidden
  setTimeout(() => reveals.slice().forEach(el => el.classList.remove('pending')), 1800);

  // ---- "How it works": scroll-driven activation sweep ----
  // A gradient line draws leftâright as you scroll the section into view,
  // lighting each numbered step in sequence; the leading step gently pulses.
  (function () {
    const row = document.getElementById('stepsRow');
    if (!row) return;
    const fill = row.querySelector('.steps-fill');
    const stepEls = Array.from(row.querySelectorAll('.step'));
    const N = stepEls.length;
    // fraction of scroll progress at which the fill reaches each circle's centre
    const centers = stepEls.map((_, i) => ((i + 0.5) / N * 100 - 8) / 84);
    function litAll() {
      if (fill) fill.style.width = '84%';
      stepEls.forEach(s => { s.classList.add('is-lit'); s.classList.remove('is-active'); });
    }
    function update() {
      const reduce = document.body.classList.contains('no-anim')
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { litAll(); return; }
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (window.innerWidth <= 960) {                 // stacked on mobile: light each as it enters
        stepEls.forEach(s => s.classList.toggle('is-lit', s.getBoundingClientRect().top < vh * 0.85));
        return;
      }
      const r = row.getBoundingClientRect();
      const start = vh * 0.82, end = vh * 0.34;
      let p = (start - r.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      if (fill) fill.style.width = (p * 84) + '%';
      let frontier = -1;
      stepEls.forEach((s, i) => { const on = p >= centers[i]; s.classList.toggle('is-lit', on); if (on) frontier = i; });
      stepEls.forEach((s, i) => s.classList.toggle('is-active', i === frontier && p < 0.999));
    }
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', () => requestAnimationFrame(update), { passive: true });
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    update();
  })();

  // ---- Feature-catalogue PINNED scrollspy ----
  // The section pins to the viewport; scrolling cycles the three groups in place,
  // then normal scroll resumes. Falls back to plain stacked flow when disabled.
  const spyPin = document.getElementById('spyPin');
  const spyPanels = Array.from(document.querySelectorAll('.spy-panel'));
  const spyLinks = Array.from(document.querySelectorAll('.spy-link'));
  const spyFill = document.querySelector('.spy-progress-fill');
  if (spyPin && spyPanels.length) {
    const N = spyPanels.length;
    let spyActive = -1, railActive = -1, pinning = null;

    function setSpy(idx) {
      idx = Math.max(0, Math.min(N - 1, idx));
      if (idx === spyActive) return;
      spyActive = idx;
      spyPanels.forEach((p, i) => p.classList.toggle('is-active', i === idx));
      spyLinks.forEach((l, i) => l.classList.toggle('is-active', i === idx));
    }
    // Non-pinned mode: panels stay in normal flow and stay fully visible, but the
    // rail heading should still highlight whichever group is currently in view.
    function setRailActive(idx) {
      idx = Math.max(0, Math.min(N - 1, idx));
      if (idx === railActive) return;
      railActive = idx;
      spyLinks.forEach((l, i) => l.classList.toggle('is-active', i === idx));
    }
    function nearestPanel() {
      const refY = 140;
      let idx = 0;
      for (let i = 0; i < spyPanels.length; i++) {
        if (spyPanels[i].getBoundingClientRect().top <= refY) idx = i; else break;
      }
      return idx;
    }
    function setFill(progress) {
      if (spyFill) spyFill.style.transform = 'translateY(' + (progress * (N - 1) * 100) + '%)';
    }

    function enablePin() {
      const allow = window.innerWidth > 960 && !document.body.classList.contains('no-anim')
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (allow === pinning) return;
      pinning = allow;
      spyPin.classList.toggle('is-pinning', allow);
      if (!allow) { spyPanels.forEach(p => p.classList.add('is-active')); setFill(0); railActive = -1; setRailActive(nearestPanel()); }
      else { setSpy(0); }
    }

    function spyScan() {
      if (!pinning) { setRailActive(nearestPanel()); return; }
      const total = spyPin.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const scrolled = Math.min(Math.max(-spyPin.getBoundingClientRect().top, 0), total);
      const progress = scrolled / total;              // 0 â 1 across the pin
      setFill(progress);
      setSpy(Math.floor(progress * N - 1e-6));          // which of N segments
    }

    // Rail clicks jump to that group's segment within the pin
    spyLinks.forEach((l, i) => l.addEventListener('click', e => {
      e.preventDefault();
      if (!pinning) { setRailActive(i); const t = document.getElementById(l.dataset.target);
        if (t) window.scrollTo({ top: window.scrollY + t.getBoundingClientRect().top - 116, behavior: 'smooth' }); return; }
      const total = spyPin.offsetHeight - window.innerHeight;
      const pinTop = window.scrollY + spyPin.getBoundingClientRect().top;
      const target = pinTop + ((i + 0.5) / N) * total;
      window.scrollTo({ top: target, behavior: 'smooth' });
    }));

    window.addEventListener('scroll', () => requestAnimationFrame(spyScan), { passive: true });
    window.addEventListener('resize', () => { enablePin(); spyScan(); }, { passive: true });
    // React to the Tweaks "Scroll animations" toggle flipping .no-anim
    new MutationObserver(() => { enablePin(); spyScan(); })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    enablePin();
    spyScan();
  }
`;
