/* Contact us: /contact/ai-support and /contact/staff-support */
(function () {
  'use strict';
  const C = HoloCommon, esc = UI.esc, root = document.getElementById('ct');
  const EDIT_MS = 15 * 60 * 1000, DEL_MS = 24 * 60 * 60 * 1000;
  let cleanup = null;

  /* ============ AI support ============ */
  function ai() {
    const KEY = 'holo-ai-chat'; let hist = []; try { hist = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) {}
    root.innerHTML = '<div class="ai"><div class="ai-head"><div><b>Holomatrix AI support</b><small>Ask about Holomatrix or this website. AI can make mistakes.</small></div><button class="btn btn-ghost btn-sm" id="aic">Clear</button></div>' +
      '<div class="ai-msgs" id="aim"></div>' +
      '<form class="ai-form" id="aif" autocomplete="off"><input class="input" id="aii" maxlength="500" placeholder="Type your message…" required><button class="btn btn-primary btn-sm" id="ais">Send</button></form></div>';
    const box = document.getElementById('aim'), inp = document.getElementById('aii'), btn = document.getElementById('ais');
    const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(hist.slice(-20))); } catch (e) {} };
    const draw = typing => {
      box.innerHTML = (hist.length ? '' : '<div class="cb them">How can I assist you?</div>') +
        hist.map(m => '<div class="cb ' + (m.role === 'user' ? 'me' : 'them') + '">' + esc(m.content) + '</div>').join('') + (typing ? '<div class="cb them"><span class="typing"><i></i><i></i><i></i></span></div>' : '');
      box.scrollTop = box.scrollHeight;
    };
    async function send(text) {
      text = text.trim(); if (!text) return;
      hist.push({ role: 'user', content: text.slice(0, 500) }); save(); draw(true); btn.disabled = true;
      let reply = 'Something went wrong. Please try again.';
      try {
        const s = await Auth.session(), h = { 'Content-Type': 'application/json' }; if (s) h.Authorization = 'Bearer ' + s.access_token;
        const r = await fetch('/api/ai-chat', { method: 'POST', headers: h, body: JSON.stringify({ messages: hist.slice(-10) }) });
        const j = await r.json().catch(() => ({})); reply = r.ok ? j.reply : (j.error || reply);
      } catch (e) { reply = 'Network problem. Please check your connection and try again.'; }
      hist.push({ role: 'assistant', content: reply }); save(); draw(false); btn.disabled = false; inp.focus();
    }
    document.getElementById('aif').onsubmit = e => { e.preventDefault(); const t = inp.value; inp.value = ''; send(t); };
    document.getElementById('aic').onclick = () => { hist = []; save(); draw(false); };
    draw(false);
  }

  /* ============ Staff support (live chat with the team) ============ */
  async function staff() {
    const me = await Auth.access();
    if (!me) { root.innerHTML = '<div class="box"><h3>Log in to chat with our team</h3><p>Your messages stay private between you and the Holomatrix team.</p><div class="row"><a class="btn btn-primary btn-sm" href="/login?next=/contact/staff-support">Log in</a><a class="btn btn-ghost btn-sm" href="/signup">Sign up</a></div></div>'; return; }
    let conv = null, msgs = [], channel = null, timer = null, dead = false;
    cleanup = () => { dead = true; if (channel) sb.removeChannel(channel); clearInterval(timer); };
    const age = m => Date.now() - new Date(m.created_at).getTime();

    const bubble = m => {
      const mine = m.sender_type === 'user';
      const acts = mine ? (age(m) < EDIT_MS ? '<button class="lk" data-edit="' + m.id + '">Edit</button>' : '') + (age(m) < DEL_MS ? '<button class="lk" data-del="' + m.id + '">Delete</button>' : '') : '';
      return '<div class="cb ' + (mine ? 'me' : 'them') + '">' + (!mine && m.sender_name ? '<span class="sn">' + esc(m.sender_name) + '</span>' : '') + esc(m.body) + '<small>' + C.time(m.created_at) + (m.edited_at ? ' · edited' : '') + '</small>' + (acts ? '<div class="macts">' + acts + '</div>' : '') + '</div>';
    };
    const head = () => {
      const closed = conv.status === 'closed';
      return '<div><b>Holomatrix Support</b>' + (conv.assigned_name ? '<small class="ok">✓ Assisted by ' + esc(conv.assigned_name) + '</small>' : '<small>' + (closed ? 'Conversation closed' : 'Waiting for a team member…') + '</small>') + '</div>' + (closed ? '' : '<button class="btn btn-ghost btn-sm" id="close">Close conversation</button>');
    };
    const drawMsgs = scroll => { const b = document.getElementById('cm'); if (!b) return; b.innerHTML = msgs.map(bubble).join('') || '<div class="empty" style="margin:auto">Say hello 👋 Our team will reply here.</div>'; if (scroll) b.scrollTop = b.scrollHeight; };
    const add = m => { if (msgs.some(x => x.id === m.id)) return; msgs.push(m); drawMsgs(true); };

    function drawAll() {
      const closed = conv.status === 'closed';
      root.innerHTML = '<div class="ct"><div class="ct-head" id="ch">' + head() + '</div><div class="ct-msgs" id="cm"></div>' +
        (closed ? '<div class="ct-note">This conversation is closed.<button class="btn btn-primary btn-sm" id="newc">Start a new conversation</button></div>'
          : '<form class="ct-form" id="cf" autocomplete="off"><input class="input" id="ci" placeholder="Write your message…" maxlength="1000" required><button class="btn btn-primary btn-sm">Send</button></form>') + '</div>';
      drawMsgs(true); bind();
    }
    function bind() {
      const f = document.getElementById('cf');
      if (f) f.onsubmit = async e => {
        e.preventDefault(); const i = document.getElementById('ci'), text = i.value.trim(); if (!text) return; i.value = '';
        const { data, error } = await sb.from('support_messages').insert({ conversation_id: conv.id, sender_type: 'user', sender_id: me.user.id, body: text }).select().single();
        if (error) { i.value = text; return UI.toast('Message could not be sent.', 'error'); } add(data);
      };
      const nc = document.getElementById('newc'); if (nc) nc.onclick = startNew;
      const cl = document.getElementById('close');
      if (cl) cl.onclick = async () => {
        if (!(await UI.confirm('Close this conversation?', 'You can start a new one any time.', { confirmText: 'Close' }))) return;
        const { error } = await sb.from('support_conversations').update({ status: 'closed' }).eq('id', conv.id);
        if (error) return UI.toast(error.message, 'error'); conv.status = 'closed'; drawAll();
      };
    }
    root.onclick = async e => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) {
        const m = msgs.find(x => x.id === ed.dataset.edit); if (!m) return;
        if (age(m) >= EDIT_MS) { drawMsgs(); return UI.toast('You can only edit a message within 15 minutes.', 'warn'); }
        const v = await UI.prompt('Edit message', 'You can edit for 15 minutes after sending.', { value: m.body });
        if (v === null || !v.trim() || v.trim() === m.body) return;
        const { data, error } = await sb.from('support_messages').update({ body: v.trim().slice(0, 1000) }).eq('id', m.id).select();
        if (error || !data || !data.length) return UI.toast('This message can no longer be edited.', 'error'); Object.assign(m, data[0]); drawMsgs();
      }
      if (dl) {
        const m = msgs.find(x => x.id === dl.dataset.del); if (!m) return;
        if (!(await UI.confirm('Delete this message?', 'It will be removed for everyone.', { confirmText: 'Delete', danger: true }))) return;
        const { data, error } = await sb.from('support_messages').delete().eq('id', m.id).select();
        if (error || !data || !data.length) return UI.toast('Messages can only be deleted within 1 day.', 'error'); msgs = msgs.filter(x => x.id !== m.id); drawMsgs();
      }
    };

    async function openConv(c) {
      conv = c;
      const { data } = await sb.from('support_messages').select('*').eq('conversation_id', c.id).order('created_at');
      if (dead) return; msgs = data || []; drawAll();
      channel = sb.channel('contact-' + c.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: 'conversation_id=eq.' + c.id }, p => add(p.new))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_messages', filter: 'conversation_id=eq.' + c.id }, p => { const i = msgs.findIndex(x => x.id === p.new.id); if (i > -1) { msgs[i] = p.new; drawMsgs(); } })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'support_messages' }, p => { if (p.old && msgs.some(x => x.id === p.old.id)) { msgs = msgs.filter(x => x.id !== p.old.id); drawMsgs(); } })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_conversations', filter: 'id=eq.' + c.id }, p => { const was = conv.status; conv = Object.assign(conv, p.new); if (was !== conv.status) drawAll(); else { const h = document.getElementById('ch'); if (h) { h.innerHTML = head(); bind(); } } })
        .subscribe();
      timer = setInterval(() => drawMsgs(), 30000);
    }
    async function startNew() {
      const { data, error } = await sb.from('support_conversations').insert({ user_id: me.user.id }).select().single();
      if (error) return UI.toast('Could not start a conversation.', 'error');
      if (channel) { sb.removeChannel(channel); channel = null; } openConv(data);
    }
    const { data } = await sb.from('support_conversations').select('*').eq('user_id', me.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (data) openConv(data); else startNew();
  }

  C.tabs({
    el: document.getElementById('tabs'), items: [['ai-support', 'AI support'], ['staff-support', 'Staff support']],
    onChange: id => { if (cleanup) { cleanup(); cleanup = null; } root.onclick = null; root.innerHTML = '<div class="empty">Loading…</div>'; id === 'ai-support' ? ai() : staff(); }
  });
})();
