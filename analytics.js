/* ── Section dwell-time + nav click tracking ─────────────────────────
   Requires PostHog snippet loaded earlier on the page (window.posthog).
   Add data-section="name" to any <section> you want tracked.
-------------------------------------------------------------------- */
(function () {
  if (typeof posthog === 'undefined') return;

  var sectionTimers = {}; // sectionName -> { start: timestamp, total: ms }

  function getName(el) {
    return el.getAttribute('data-section') || el.className.split(' ')[0] || 'unknown';
  }

  var sections = document.querySelectorAll('[data-section]');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var name = getName(entry.target);
      if (entry.isIntersecting) {
        if (!sectionTimers[name]) sectionTimers[name] = { start: null, total: 0 };
        sectionTimers[name].start = Date.now();
      } else {
        var t = sectionTimers[name];
        if (t && t.start) {
          t.total += Date.now() - t.start;
          t.start = null;
        }
      }
    });
  }, { threshold: 0.3 }); // section counts as "viewed" once 30% visible

  sections.forEach(function (s) { observer.observe(s); });

  function flush(reason) {
    Object.keys(sectionTimers).forEach(function (name) {
      var t = sectionTimers[name];
      if (t.start) { t.total += Date.now() - t.start; t.start = null; }
      if (t.total > 500) { // ignore negligible glances under 0.5s
        posthog.capture('section_dwell', {
          section: name,
          seconds: Math.round(t.total / 100) / 10,
          page: window.location.pathname,
          reason: reason
        });
        t.total = 0;
      }
    });
  }

  // Flush on tab hide / page unload (most reliable for SPA-less sites)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush('visibilitychange');
  });
  window.addEventListener('pagehide', function () { flush('pagehide'); });

  /* ── Nav menu click tracking ────────────────────────────────────── */
  document.querySelectorAll('nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      posthog.capture('nav_click', {
        label: link.textContent.trim(),
        href: link.getAttribute('href'),
        page: window.location.pathname
      });
    });
  });
})();
