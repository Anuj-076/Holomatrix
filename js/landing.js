/* Landing page: loads editable content from Supabase (falls back to defaults) */
(function () {
  const esc = UI.esc;
  const safeUrl = u => {
    u = String(u || '').trim();
    return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(u) ? u : '#';
  };

  /* ---------- Default content (admin dashboard overrides these via the site_content table) ---------- */
  const DEFAULTS = {
    hero: {
      eyebrow: 'Holomatrix Consulting',
      title: 'Strategy, technology and growth,',
      highlight: 'built for what’s next.',
      subtitle: 'We help ambitious businesses and individuals turn big ideas into measurable results with clear thinking, smart tools and hands-on support.',
      primaryText: 'Get started', primaryLink: '/login',
      secondaryText: 'Explore services', secondaryLink: '#services'
    },
    stats: [
      { value: '50+', label: 'Projects delivered' },
      { value: '30+', label: 'Happy clients' },
      { value: '5+', label: 'Industries served' },
      { value: '24/7', label: 'Online support' }
    ],
    services: {
      kicker: 'What we do',
      title: 'Services designed around your goals',
      subtitle: 'Pick one service or combine them. Everything is tailored to where you are and where you want to go.',
      items: [
        { icon: '🧭', title: 'Strategy & Advisory', text: 'Clear roadmaps, market insight and decision support to move with confidence.' },
        { icon: '💻', title: 'Digital Solutions', text: 'Websites, tools and automations that save time and help you scale.' },
        { icon: '📈', title: 'Growth & Marketing', text: 'Brand, content and campaigns that attract the right audience.' },
        { icon: '🎓', title: 'Training & Mentorship', text: 'Practical guidance and workshops to build skills that last.' },
        { icon: '🤝', title: 'Partnerships', text: 'Connections and collaborations that open new opportunities.' },
        { icon: '🛠️', title: 'Custom Projects', text: 'Have something unique in mind? We’ll design it with you.' }
      ]
    },
    about: {
      kicker: 'About us',
      title: 'Who we are',
      text: 'Holomatrix is a consulting team focused on turning complexity into clarity.\nWe combine modern technology with practical experience to help our clients grow.',
      points: [
        'Honest, transparent communication',
        'Modern tools and fast delivery',
        'Support that continues after launch'
      ]
    },
    faq: [
      { q: 'How do I get started?', a: 'Create a free account, then use the chat button in the corner to tell us what you need.' },
      { q: 'How quickly will I get a reply?', a: 'Our team usually responds within a few hours during working days.' },
      { q: 'Can I customise a service for my needs?', a: 'Yes. Every project is tailored. Reach out and we will shape it with you.' }
    ],
    contact: {
      title: 'Ready to build something remarkable?',
      text: 'Create your account or talk to us right now. We’d love to hear about your idea.',
      email: '', phone: '', address: ''
    }
  };

  const C = JSON.parse(JSON.stringify(DEFAULTS));
  const $ = id => document.getElementById(id);
  let observer;

  /* ---------- Renderers ---------- */
  function renderHero() {
    const h = C.hero || DEFAULTS.hero;
    $('hero-eyebrow').textContent = h.eyebrow;
    $('hero-title').innerHTML = esc(h.title) + ' <span class="gradient-text">' + esc(h.highlight) + '</span>';
    $('hero-sub').textContent = h.subtitle;
    const a = $('hero-cta1'), b = $('hero-cta2');
    a.textContent = h.primaryText; a.href = safeUrl(h.primaryLink);
    b.textContent = h.secondaryText; b.href = safeUrl(h.secondaryLink);
  }

  function renderStats() {
    const list = Array.isArray(C.stats) ? C.stats : DEFAULTS.stats;
    $('stats-grid').innerHTML = list.map((s, i) =>
      '<div class="card stat reveal" style="--d:' + i * 80 + 'ms"><b class="gradient-text" data-count="' + esc(s.value) + '">' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>'
    ).join('');
  }

  function renderServices() {
    const s = C.services || DEFAULTS.services;
    const items = Array.isArray(s.items) ? s.items : DEFAULTS.services.items;
    $('services-kicker').textContent = s.kicker;
    $('services-title').textContent = s.title;
    $('services-sub').textContent = s.subtitle;
    $('services-grid').innerHTML = items.map((it, i) =>
      '<article class="card card-glow service reveal" style="--d:' + (i % 3) * 90 + 'ms">' +
      '<div class="ico">' + esc(it.icon) + '</div><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></article>'
    ).join('');
  }

  function renderAbout() {
    const a = C.about || DEFAULTS.about;
    $('about-kicker').textContent = a.kicker;
    $('about-title').textContent = a.title;
    $('about-text').textContent = a.text;
    const pts = Array.isArray(a.points) ? a.points : [];
    $('about-points').innerHTML = pts.map((p, i) =>
      '<div class="card point reveal" style="--d:' + i * 90 + 'ms"><i>✓</i><span>' + esc(p) + '</span></div>'
    ).join('');
  }

  function renderFaq() {
    const list = Array.isArray(C.faq) ? C.faq : DEFAULTS.faq;
    $('faq-list').innerHTML = list.map((f, i) =>
      '<details class="faq-item reveal" style="--d:' + i * 70 + 'ms"><summary>' + esc(f.q) + '</summary><div class="faq-a">' + esc(f.a) + '</div></details>'
    ).join('');
  }

  function renderContact() {
    const c = C.contact || DEFAULTS.contact;
    $('contact-title').textContent = c.title;
    $('contact-text').textContent = c.text;
    const lines = [];
    if (c.email) lines.push('<a href="mailto:' + esc(c.email) + '">✉️ ' + esc(c.email) + '</a>');
    if (c.phone) lines.push('<a href="tel:' + esc(c.phone) + '">📞 ' + esc(c.phone) + '</a>');
    if (c.address) lines.push('<span>📍 ' + esc(c.address) + '</span>');
    $('contact-lines').innerHTML = lines.join('');
  }

  /* ---------- Animations ---------- */
  function animateCount(el) {
    const raw = el.dataset.count || '';
    const m = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const end = parseFloat(m[1]), suffix = m[2], dec = (m[1].split('.')[1] || '').length;
    const start = performance.now(), dur = 1400;
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  function observeReveals() {
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          const n = e.target.querySelector('[data-count]');
          if (n) animateCount(n);
          observer.unobserve(e.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    }
    document.querySelectorAll('.reveal:not(.in)').forEach(el => observer.observe(el));
  }

  function renderAll() {
    renderHero(); renderStats(); renderServices(); renderAbout(); renderFaq(); renderContact();
    observeReveals();
  }

  /* ---------- Load editable content ---------- */
  async function load() {
    renderAll(); // show defaults instantly
    try {
      const { data, error } = await sb.from('site_content').select('key,value');
      if (!error && data && data.length) {
        data.forEach(r => { if (r.value !== null && r.key in C) C[r.key] = r.value; });
        renderAll();
      }
    } catch (e) { /* keep defaults */ }
  }

  /* ---------- Nav behaviour ---------- */
  function initNav() {
    const nav = $('nav'), links = $('nav-links'), toggle = $('nav-toggle');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.textContent = open ? '✕' : '☰';
      toggle.setAttribute('aria-expanded', open);
    });
    links.addEventListener('click', e => {
      if (e.target.closest('a')) { links.classList.remove('open'); toggle.textContent = '☰'; }
    });

    // Show "Dashboard" instead of "Log in" when signed in
    Auth.access().then(a => {
      if (!a) return;
      const b = $('nav-login');
      b.textContent = 'Dashboard';
      b.href = a.isStaff ? '/admin' : '/dashboard';
    }).catch(() => {});
  }

  /* ---------- Misc ---------- */
  function initMisc() {
    $('year').textContent = new Date().getFullYear();
    $('ig-link').href = HOLO.SOCIAL.instagram;
    $('li-link').href = HOLO.SOCIAL.linkedin;
    $('cta-chat').addEventListener('click', () => window.HoloSupport && HoloSupport.open());

    // cursor glow on service cards
    document.addEventListener('pointermove', e => {
      const card = e.target.closest && e.target.closest('.card-glow');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  document.addEventListener('DOMContentLoaded', () => { initNav(); initMisc(); load(); });
})();
