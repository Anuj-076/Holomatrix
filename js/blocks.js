/* Custom blocks renderer (text / links / photos), shared by the landing page and the admin preview */
(function () {
  'use strict';
  const esc = UI.esc;
  const hex = v => /^#[0-9a-f]{6}$/i.test(v || '') ? v : '';
  const FONTS = ['Space Grotesk', 'Inter', 'Sora', 'Poppins', 'Manrope', 'Outfit', 'Playfair Display', 'Syne', 'DM Sans', 'Montserrat'];
  const SIZES = { s: ['.95rem', '1.5rem'], m: ['1.1rem', '2.1rem'], l: ['1.35rem', '2.9rem'], xl: ['1.8rem', '4rem'] };
  const ALIGN = ['left', 'center', 'right'];
  const safeUrl = u => { u = String(u || '').trim(); return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(u) ? u : '#'; };
  const CAM = '<svg class="ph-cam" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.4"/><path d="M8.5 6l1.2-2h4.6l1.2 2"/></svg>';

  function ensureFonts(list) {
    list.forEach(b => {
      const f = b.style && b.style.font;
      if (!f || FONTS.indexOf(f) < 0 || f === 'Space Grotesk' || f === 'Inter') return;
      if (document.querySelector('link[data-blk-font="' + f + '"]')) return;
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;500;600;700&display=swap';
      l.setAttribute('data-blk-font', f); document.head.appendChild(l);
    });
  }

  function linkHtml(i) {
    const name = HoloIcons.forItem(i);
    const inner = '<span class="ico">' + HoloIcons.svg(name) + '</span><span>' + esc(i.label || HoloIcons.label(name)) + '</span>';
    if (!i.url) return '<span class="blk-link ph-link">' + inner + '</span>';
    return '<a class="blk-link" href="' + esc(safeUrl(i.url)) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>';
  }

  function render(b, opt) {
    opt = opt || {};
    const s = b.style || {}, d = b.data || {};
    const sz = SIZES[s.size] || SIZES.m;
    const al = ALIGN.indexOf(s.align) > -1 ? s.align : 'left';
    let css = '--bk-size:' + sz[0] + ';--bk-hsize:' + sz[1] + ';';
    if (+s.fontPx >= 10 && +s.fontPx <= 60) css += '--bk-size:' + (+s.fontPx) + 'px;';      // exact text size
    if (+s.headPx >= 14 && +s.headPx <= 120) css += '--bk-hsize:' + (+s.headPx) + 'px;';   // exact heading size
    if (hex(s.color)) css += '--bk-color:' + s.color + ';';
    if (hex(s.headingColor)) css += '--bk-head:' + s.headingColor + ';';
    if (hex(s.bg)) css += '--bk-bg:' + s.bg + ';';
    if (FONTS.indexOf(s.font) > -1) css += "font-family:'" + s.font + "',system-ui,sans-serif;";
    const cls = 'blk blk-' + b.type + ' al-' + al + (hex(s.bg) || s.card ? ' blk-card' : '') + (opt.preview ? '' : ' reveal');
    const showEmpty = opt.preview || d.showEmpty;
    const head = d.heading ? '<h3 class="blk-h">' + esc(d.heading) + '</h3>' : '';
    let inner = '';

    if (b.type === 'text') {
      inner = head + (d.body ? '<div class="blk-p">' + esc(d.body) + '</div>' : '');
    } else if (b.type === 'links') {
      const items = (d.items || []).filter(i => i && (i.url || showEmpty));
      inner = head + '<div class="blk-links lay-' + (d.layout === 'cards' ? 'cards' : 'pills') + '">' + items.map(linkHtml).join('') + '</div>';
    } else if (b.type === 'photos') {
      const cols = [2, 3, 4].indexOf(+d.cols) > -1 ? +d.cols : 3;
      const shape = ['rounded', 'circle', 'square'].indexOf(d.shape) > -1 ? d.shape : 'rounded';
      const items = (d.items || []).filter(i => i && (i.url || showEmpty));
      inner = head + '<div class="blk-photos" style="--cols:' + cols + '">' + items.map(it => {
        const img = it.url && /^https:\/\//.test(it.url) ? '<img src="' + esc(it.url) + '" alt="' + esc(it.caption || '') + '" loading="lazy">' : '<div class="ph-empty">' + CAM + '</div>';
        const fig = '<figure class="ph sh-' + shape + '"><div class="ph-img">' + img + '</div>' + (it.caption ? '<figcaption>' + esc(it.caption) + '</figcaption>' : '') + '</figure>';
        return it.link ? '<a class="ph-a" href="' + esc(safeUrl(it.link)) + '" target="_blank" rel="noopener noreferrer">' + fig + '</a>' : fig;
      }).join('') + '</div>';
    }
    return '<div class="' + cls + '" style="' + esc(css) + '">' + inner + '</div>';
  }

  window.HoloBlocks = { render, ensureFonts, FONTS, SIZES };
})();
