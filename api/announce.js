/* POST /api/announce  { mode: 'preview' | 'count' | 'send', subject, body, audience } */
const SB = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BREVO = process.env.BREVO_API_KEY;
const FROM = process.env.BREVO_SENDER_EMAIL;
const FROM_NAME = process.env.BREVO_SENDER_NAME || 'Holomatrix';
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const MAX_RECIPIENTS = 290; // Brevo free plan is ~300 emails/day

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function buildHtml(subject, body) {
  const paras = body.split(/\n{2,}/).map(p =>
    '<p style="font-size:15px;line-height:1.7;color:#c4cce2;margin:0 0 16px;">' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#05070d;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070d;padding:32px 12px;"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0f1c;border:1px solid #1d2540;border-radius:20px;">' +
    '<tr><td align="center" style="padding:36px 32px 8px;"><img src="' + SITE + '/logo.jpg" width="76" height="76" alt="Holomatrix" style="display:block;border-radius:50%;border:2px solid #4de1ff;">' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#eaf0ff;margin-top:14px;">Holomatrix</div></td></tr>' +
    '<tr><td style="padding:20px 36px 8px;font-family:Arial,Helvetica,sans-serif;color:#eaf0ff;">' +
    '<h1 style="font-size:24px;margin:0 0 16px;">' + esc(subject) + '</h1>' +
    '<p style="font-size:15px;line-height:1.7;color:#c4cce2;margin:0 0 16px;">Hi {{ params.name }},</p>' + paras +
    '</td></tr><tr><td style="padding:16px 36px 30px;border-top:1px solid #1d2540;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#7f8aa8;">' +
    'You are receiving this because you have an account on Holomatrix. You can turn announcements off any time in your <a href="' + SITE + '/dashboard" style="color:#4de1ff;">account settings</a>.' +
    '</td></tr></table></td></tr></table></body></html>';
}

async function rest(path, opts) {
  return fetch(SB + path, opts);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const missing = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'SITE_URL'].filter(k => !process.env[k]);
  if (missing.length) return res.status(500).json({ error: 'Server is missing settings: ' + missing.join(', ') });

  try {
    /* ---- 1. Who is calling? ---- */
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Please log in again.' });
    const ur = await rest('/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
    if (!ur.ok) return res.status(401).json({ error: 'Your session expired. Please log in again.' });
    const user = await ur.json();

    /* ---- 2. Are they allowed? (checked by the database with THEIR token) ---- */
    const pr = await rest('/rest/v1/rpc/has_perm', {
      method: 'POST',
      headers: { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: 'send_announcements' })
    });
    if (!pr.ok || (await pr.json()) !== true) return res.status(403).json({ error: 'You do not have permission to send announcements.' });

    /* ---- 3. Validate input ---- */
    const b = req.body || {};
    const mode = ['preview', 'count', 'send'].includes(b.mode) ? b.mode : 'preview';
    const subject = String(b.subject || '').trim(), body = String(b.body || '').trim();
    const aud = String(b.audience || 'all');
    if (!subject || subject.length > 150) return res.status(400).json({ error: 'Subject must be 1 to 150 characters.' });
    if (!body || body.length > 5000) return res.status(400).json({ error: 'Message must be 1 to 5000 characters.' });
    if (!(aud === 'all' || /^role:[0-9a-f-]{36}$/i.test(aud))) return res.status(400).json({ error: 'Invalid audience.' });

    const html = buildHtml(subject, body);
    if (mode === 'preview') return res.status(200).json({ html: html.replace('{{ params.name }}', 'Friend') });

    /* ---- 4. Recipients (service role; only verified, opted-in, not banned) ---- */
    const rr = await rest('/rest/v1/rpc/announcement_recipients', {
      method: 'POST',
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ aud })
    });
    if (!rr.ok) return res.status(500).json({ error: 'Could not load recipients.' });
    const people = await rr.json();
    if (mode === 'count') return res.status(200).json({ count: people.length });
    if (!people.length) return res.status(400).json({ error: 'No eligible recipients.' });
    if (people.length > MAX_RECIPIENTS) return res.status(400).json({ error: 'That is ' + people.length + ' people, above the safe daily limit of ' + MAX_RECIPIENTS + ' for the free Brevo plan. Pick a smaller audience.' });

    /* ---- 5. Send through Brevo in chunks ---- */
    let sent = 0, failed = 0;
    for (let i = 0; i < people.length; i += 50) {
      const chunk = people.slice(i, i + 50);
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO, 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: FROM_NAME, email: FROM },
          subject, htmlContent: html, tags: ['announcement'],
          messageVersions: chunk.map(p => ({
            to: [{ email: p.email, name: p.full_name || p.email }],
            params: { name: (p.full_name || p.email.split('@')[0]).split(' ')[0] }
          }))
        })
      });
      if (r.ok) sent += chunk.length; else failed += chunk.length;
    }

    /* ---- 6. Record it ---- */
    const h = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
    await rest('/rest/v1/announcements', { method: 'POST', headers: h, body: JSON.stringify({ subject, body, sent_by: user.id, recipients_count: sent, failed_count: failed, audience: aud }) });
    await rest('/rest/v1/audit_logs', { method: 'POST', headers: h, body: JSON.stringify({ actor_id: user.id, actor_email: user.email, action: 'announcement.send', target: subject, details: { subject, recipients: sent, failed } }) });

    return res.status(200).json({ ok: true, sent, failed });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
};
