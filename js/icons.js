/* Brand icons for links. The icon is detected from the URL (or chosen by hand). */
(function () {
  'use strict';
  let n = 0;
  const X_PATH = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';
  const I = {
    instagram: id => '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".65" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#' + id + ')"/><rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.3" cy="7.7" r="1.1" fill="#fff"/></svg>',
    linkedin: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path fill="#fff" d="M7.1 9.6H4.4V19h2.7V9.6zM5.7 5.2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM19.6 13.6c0-2.5-1.3-4.2-3.6-4.2-1.2 0-2 .6-2.4 1.2V9.6h-2.6V19h2.7v-5.1c0-1.3.6-2.1 1.7-2.1 1 0 1.5.7 1.5 2.1V19h2.7v-5.4z"/></svg>',
    x: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x=".4" y=".4" width="23.2" height="23.2" rx="6" fill="#000" stroke="#5a5a5a" stroke-width=".8"/><path transform="translate(5 5) scale(.583)" fill="#fff" d="' + X_PATH + '"/></svg>',
    facebook: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M13.5 20v-7h2.3l.4-2.8h-2.7V8.5c0-.8.3-1.3 1.4-1.3h1.4V4.7c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2H8.3V13h2.4v7z"/></svg>',
    youtube: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000"/><path fill="#fff" d="M10 9l5 3-5 3z"/></svg>',
    whatsapp: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#25D366"/><path d="M12 5.8a6.2 6.2 0 0 0-5.3 9.4l-.9 3 3.1-.8A6.2 6.2 0 1 0 12 5.8z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.6 9.4c.3 2.2 2 3.9 4.2 4.3l.9-1-1.5-.8-.6.5a3 3 0 0 1-1.6-1.6l.5-.6-.8-1.5z" fill="#fff"/></svg>',
    linktree: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#43E660"/><path d="M12 5v14M7.5 8.5l9 7M16.5 8.5l-9 7" stroke="#0b3d1a" stroke-width="2" stroke-linecap="round"/></svg>',
    email: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#5b6b8c"/><path d="M5.5 8l6.5 5 6.5-5M5.5 8v8h13V8z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    website: () => '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#3b82f6"/><g fill="none" stroke="#fff" stroke-width="1.5"><circle cx="12" cy="12" r="6.5"/><ellipse cx="12" cy="12" rx="2.8" ry="6.5"/><path d="M5.5 12h13"/></g></svg>'
  };
  const LABELS = { instagram: 'Instagram', linkedin: 'LinkedIn', x: 'X', facebook: 'Facebook', youtube: 'YouTube', whatsapp: 'WhatsApp', linktree: 'Linktree', email: 'Email', website: 'Website' };

  function detect(url) {
    const u = String(url || '').trim().toLowerCase();
    if (u.indexOf('mailto:') === 0) return 'email';
    let h = '';
    try { h = new URL(u, location.href).hostname.replace(/^www\./, ''); } catch (e) {}
    const is = d => h === d || h.endsWith('.' + d);
    if (is('instagram.com')) return 'instagram';
    if (is('linkedin.com')) return 'linkedin';
    if (is('x.com') || is('twitter.com')) return 'x';
    if (is('facebook.com') || is('fb.com')) return 'facebook';
    if (is('youtube.com') || is('youtu.be')) return 'youtube';
    if (is('wa.me') || is('whatsapp.com')) return 'whatsapp';
    if (is('linktr.ee')) return 'linktree';
    return 'website';
  }

  window.HoloIcons = {
    names: Object.keys(I),
    labels: LABELS,
    label: name => LABELS[name] || 'Link',
    detect: detect,
    forItem: it => (it && it.icon && it.icon !== 'auto' && I[it.icon]) ? it.icon : detect(it && it.url),
    svg: name => (I[name] || I.website)('ig' + (++n))
  };
})();
