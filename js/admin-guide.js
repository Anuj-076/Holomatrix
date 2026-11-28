/* Admin → Writing guide: how to write news and research with the page builder */
(window.HoloAdminExt = window.HoloAdminExt || []).push(function (H) {
  'use strict';
  const esc = H.esc;
  H.addTab({ id: 'guide', label: 'Writing guide', ico: '📘', perm: ['manage_content'] }, 'content');

  const EX = [['E = mc^{2}', 'mass-energy'], ['\\hbar \\omega', 'photon energy'], ['\\frac{a}{b}', 'a fraction'], ['x_{i}^{2}', 'small number below and above'], ['\\vec{F} = m\\vec{a}', 'a vector equation'], ['\\int_{0}^{\\infty} e^{-x}\\,dx = 1', 'an integral'], ['\\langle \\psi | \\phi \\rangle', 'bra-ket'], ['\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}', 'Gauss\'s law']];

  H.R.guide = async function (v) {
    const R = window.HoloRich;
    v.innerHTML = '<div class="gd"><h2 class="pt">📘 Writing guide</h2><p class="psub">How to write news and research that look their best. Open <b>News &amp; Research</b>, press <b>+ New article</b> or <b>+ New research</b>, and the full-screen editor opens.</p>' +
      '<h3>1. The quick steps</h3><ol><li>Write the <b>title</b> and a short <b>summary</b> (the summary shows on the cards and above the article).</li><li>On the right: pick the <b>category</b>, add the <b>author</b> and a <b>cover image</b>.</li><li>Build the page with the <b>Add</b> buttons at the bottom. New blocks appear under the block you last clicked.</li><li>Press <b>👁 Preview</b> to see the real page, with maths drawn and the Contents box.</li><li>Press <b>Save</b> (or Ctrl+S). Untick <b>Published</b> on the right to keep it as a draft nobody sees.</li></ol>' +
      '<h3>2. The blocks</h3><table class="gd-ex"><tr><th>Block</th><th>Use it for</th></tr>' +
      '<tr><td><b>🔠 Heading</b></td><td>Section titles. <b>Big</b> headings make the Contents box; <b>Small</b> headings sit under them (1.1, 1.2…).</td></tr>' +
      '<tr><td><b>¶ Text</b></td><td>A paragraph. Select words to style them (see 3). Pick left, centre, right or justified.</td></tr>' +
      '<tr><td><b>🖼️ Image</b></td><td>Upload a picture. Add a caption, choose the width (20–100%) and left, centre or right.</td></tr>' +
      '<tr><td><b>▶️ Video</b></td><td>Paste a <b>YouTube</b> or <b>Vimeo</b> link (a normal watch link, a youtu.be link or a Shorts link). The video plays inside the article. Add a caption, width and position.</td></tr>' +
      '<tr><td><b>❝ Quote</b></td><td>Shown with quotation marks and “— Name” on the right. Add the person\'s name and, if you like, their role or source.</td></tr>' +
      '<tr><td><b>☰ List</b></td><td>Bullet points or a numbered list. Press Enter for the next item. Great for a References list.</td></tr>' +
      '<tr><td><b>▦ Table</b></td><td>A grid of cells. Click a cell, then use <b>＋ Row / ＋ Column / − Row / − Column</b> to grow or shrink it around that cell. Tick <b>First row is a header</b> for a title row. Cells can hold bold, links and maths. On a phone wide tables scroll sideways.</td></tr>' +
      '<tr><td><b>∑ Equation</b></td><td>A big centred equation (see 6). Optional label on the right, like (1).</td></tr>' +
      '<tr><td><b>💡 Note box</b></td><td>A coloured box: Info (cyan), Tip (green) or Warning (orange).</td></tr>' +
      '<tr><td><b>➖ Divider line</b></td><td>A thin line between parts.</td></tr></table>' +
      '<p>Text, quote, list, equation and note blocks also have <b>Normal / Small / Large / Huge text</b>, <b>Box left / centre / right</b> and a <b>Box width</b> slider (40–100%). Use a narrower box and “centre” for a pull-out look.</p>' +
      '<h3>3. Styling words (the floating bar)</h3><p><b>Select some words</b> and a small bar appears right above them. It only shows while words are selected. Your selection stays, so you can press several buttons one after another.</p>' +
      '<ul><li><b>B I U S</b>: bold, italic, underline, strikethrough. <b>x² x₂</b>: superscript and subscript. <b>&lt;/&gt;</b>: code.</li><li><b>Size ▾</b>: Small, Normal, Large, Huge for the selected words.</li><li><b>Colour ▾</b>: Cyan and Royal blue come first, then more colours, or <b>Other…</b> for any colour.</li><li><b>Highlight ▾</b>: pick a highlight colour, or <b>None</b> to remove it.</li><li><b>Link</b>: paste the address (a page on this website can be written like <code>/news/all</code>). <b>Unlink</b> removes it. <b>Clear</b> removes all styling and links from the selected words.</li><li>Shortcuts: <b>Ctrl+B / I / U</b>, <b>Ctrl+K</b> for a link, <b>Ctrl+S</b> to save.</li><li><b>Enter</b> at the end of a text block starts a new text block. <b>Shift+Enter</b> makes a line break inside the same block.</li></ul>' +
      '<h3>4. Edit on this page</h3><p>Open the <b>Preview</b> tab and press <b>✏️ Edit on this page</b>. Now you type straight into the finished page, including the title and summary.</p>' +
      '<ul><li>Click any text (or table cell) to type. Select words to get the same floating bar.</li><li><b>Hover a block</b> to see its small control strip: move up/down, duplicate, delete, text size (S M L XL), box width and position. Pictures and videos get a width slider and position buttons. Videos get <b>✎ Link</b>, equations get <b>✎ Code</b>, tables get row, column and header buttons. Headings can switch between H2 and H3.</li><li>Use the <b>Add</b> buttons under the page to add blocks.</li><li>Maths written inside text shows as codes while you edit. Press <b>👁 Read-only preview</b> to see it drawn.</li></ul>' +
      '<h3>5. Sharing and “More in…”</h3><ul><li>Every article and research has its own permanent address. At the end of each one readers see <b>Share</b> buttons: Copy link, WhatsApp, Telegram, X, LinkedIn, Facebook and Email (phones also get a Share… button).</li><li>Under the article, readers see <b>More in (category)</b>: up to 3 other published items from the same category. It appears by itself, nothing to set up.</li><li>The share buttons and “More in…” only appear on the live page, not in the Preview.</li></ul>' +
      '<h3>6. Maths and symbols</h3><p>Maths uses <b>LaTeX</b>, the standard code scientists use in papers (arXiv, Overleaf and Wikipedia use the same). Put the code between dollar signs inside any text, or use an <b>Equation</b> block for a big centred one.</p>' +
      '<table class="gd-ex"><tr><th>You type</th><th>Readers see</th><th>What it is</th></tr>' + EX.map(x => '<tr><td><code>$' + esc(x[0]) + '$</code></td><td><span>$' + esc(x[0]) + '$</span></td><td>' + esc(x[1]) + '</td></tr>').join('') + '</table>' +
      '<div class="gd-tip"><b>Rules:</b> group things with braces, so <code>x^{10}</code> not <code>x^10</code>. To show a real dollar sign in normal text type <code>\\$</code>. In the editor press <b>Ω Symbol codes</b> any time: click a symbol and its code is copied and put into your text.</div>' +
      '<h3>7. Pictures and files</h3><ul><li>Pictures: PNG, JPG, WEBP or GIF. They are shrunk automatically so pages stay fast.</li><li>Under <b>PDF or extra files</b> add downloads (PDF, Word, Excel, PowerPoint, zip, text, CSV, images; 25 MB each). They appear in a Downloads box at the bottom.</li><li>For research you can also add an <b>Original source link</b>.</li></ul>' +
      '<h3>8. Staying safe</h3><ul><li>Your work is saved as a <b>draft in this browser</b> every few seconds. If the page closes by accident, open the editor again and press <b>Restore draft</b>.</li><li>The editor asks before closing if something is unsaved.</li></ul>' +
      '<h3>9. Making it look good</h3><ul><li>Use a Big heading for each part, and keep paragraphs short.</li><li>Add a caption to every picture, video and table, and a quote or note box now and then to break up long text.</li><li>Check the <b>Preview</b> before you save, on a phone too if you can.</li></ul>' +
      '<h3>10. All symbol codes</h3><input class="input sym-q" placeholder="Search a symbol, e.g. alpha, integral, vector…" style="max-width:420px;margin-bottom:14px"><div class="gd-sym">' + R.symbolsHtml() + '</div></div>';
    const gd = v.querySelector('.gd');
    await R.symbolsWire(gd);
    R.math(gd);
  };
});
