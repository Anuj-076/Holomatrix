/* Highlights important phrases (cyan, bold, royal-blue underline) on content pages. Once per phrase per block.
   Skipped while editing with Edit site, and never touches links or text that is already highlighted. */
(function () {
  'use strict';
  const KEYS = ['real research', 'research integrity', 'scientific integrity', 'intellectual honesty', 'methodological rigour', 'interdisciplinary', 'independent thinkers',
    'publication support', 'manuscript development', 'literature review', 'scientific writing', 'self-reinforcing', 'cannot guarantee', 'does not guarantee', 'no single fee',
    'Staff support', 'Contact us', 'Become a client', 'Find a client', 'Offer help', '13-digit', '6-digit code', 'unique username', 'approved helpers', 'subscribers',
    'close your request', 'Privacy Policy', 'Terms of Service', 'admin team', 'Message from Founder', 'Track Record', 'peer review'];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pat = KEYS.slice().sort((a, b) => b.length - a.length).map(esc).join('|');
  const rxTest = new RegExp('(?:^|[^A-Za-z0-9])(' + pat + ')(?![A-Za-z0-9])', 'i');
  const SEL = '.faq .a, .hm-p, .hm-sub, .wd .list li, .vals p, .mv p, .who .card, .lg-p, .dom p, .legal-body, .pg-sub';
  const SKIP = 'a, .em, .hlu, .key, .ahl, button, script, style, [contenteditable="true"]';

  const css = document.createElement('style');
  css.textContent = '.ahl{color:var(
