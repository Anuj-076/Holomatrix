/* Messages: private chats between helpers and clients. Round button bottom-right with a red unread number. */
(function () {
  'use strict';
  if (window.HoloInbox) return;
  const esc = UI.esc;
  let me = null, threads = [], cur = null, msgs = [], ch = null, isOpen = false, fab, panel, badge, body, title, backBtn, reqOpen = false;
  const asked = new Set();

  if (!document.querySelector('link[href="/css/clients.css"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/clients.css'; document.head.appendChild(l); }

  const myRead = t => t.client_id === me ? t.client_read_at : t.hirer_read_at;
  const other = t => t.client_id === me ? { n: t.hirer_name, a: t.hirer_avatar } : { n: t.client_name, a: t.client_avatar };
  const unread = t => t.last_sender_id && t.last_sender_id !== me && new Date(t.last_message_at) > new Date(myRead(t));
  const av = o => '<span class="mx-av">' + (o.a && /^https:\/\//.test(o.a) ? '<img src="' + esc(o.a) + '" alt="" referrerpolicy="no-referrer">' : esc((o.n || '?').trim().charAt(0).toUpperCase())) + '</span>';
  const tm = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  function updBadge() { const n = threads.filter(unread).length; badge.hidden = !n; badge.textContent = n > 9 ? '9+' : String(n); }

  async function loadThreads() {
    const { data } = await sb.from('dm_threads').select('*').order('last_message_at', { ascending: false }).limit(100);
    threads = data || []; updBadge();
    if (isOpen && !cur) drawList();
  }

  function drawList() {
    cur = null; title.textContent = 'Messages'; backBtn.hidden = true;
    body.innerHTML = threads.map(t => { const o = other(t); return '<button class="mx-item" data-t="' + t.id + '">' + av(o) + '<span class="g"><b>' + esc(o.n || 'Member') + '</b><small>' + esc(t.last_preview || 'Say hello 👋') + '</small></span>' + (unread(t) ? '<span class="mx-dot"></span>' : '') + '</button>'; }).join('') ||
      '<div class="mx-empty">No conversations yet.<br>Open a request in <b>Find a client</b> and press <b>Offer help</b>.</div>';
  }

  const bubble = m => '<div class="mx-b ' + (m.sender_id === me ? 'me' : 'them') + '">' + esc(m.body) + '<small>' + tm(m.created_at) + '</small></div>';
  function drawMsgs() { const box = body.querySelector('.mx-msgs'); if (!box) return; box.innerHTML = msgs.map(bubble).join(''); body.scrollTop = body.scrollHeight; }

  async function markRead(id) {
    await sb.rpc('dm_mark_read', { p_thread: id });
    const t = threads.find(x => x.id === id);
    if (t) { if (t.client_id === me) t.client_read_at = new Date().toISOString(); else t.hirer_read_at = new Date().toISOString(); updBadge(); }
  }

  async function closeRequest() {
    const { error } = await sb.from('client_profiles').update({ request_status: 'closed', visible: false }).eq('user_id', me);
    if (error) return UI.toast(error.message, 'error');
    reqOpen = false; UI.toast('Request closed. Glad you found help! 🎉', 'success');
    const n = body.querySelector('.mx-note'); if (n) { n.className = 'mx-note ok'; n.innerHTML = '✅ Your request is closed, so other helpers will not contact you about it.'; }
  }

  async function openThread(id) {
    let t = threads.find(x => x.id === id);
    if (!t) { await loadThreads(); t = threads.find(x => x.id === id); }
    if (!t) return;
    cur = t; const o = other(t);
    title.textContent = o.n || 'Chat'; backBtn.hidden = false;
    body.innerHTML = '<div class="mx-top"><div class="mx-safe">🛡️ Stay safe: never share passwords, one-time codes or bank details, and never pay strangers in advance. Holomatrix is not responsible for payments or agreements.</div></div><div class="mx-msgs"></div>';
    const { data } = await sb.from('dm_messages').select('*').eq('thread_id', id).order('created_at');
    msgs = data || []; drawMsgs(); markRead(id);

    reqOpen = false;
    if (t.client_id === me) {   // I am the person who needs help
      const { data: cp } = await sb.from('client_profiles').select('request_status').eq('user_id', me).maybeSingle();
      reqOpen = !!(cp && cp.request_status === 'open');
      const top = body.querySelector('.mx-top');
      if (top && reqOpen) {
        const n = document.createElement('div'); n.className = 'mx-note';
        n.innerHTML = '🙋 Someone is offering to help. <b>Once you have found the help you need, close your request</b> so other helpers are not confused.<button type="button">I found help, close my request</button>';
        n.querySelector('button').onclick = closeRequest; top.appendChild(n);
      } else if (top && cp) top.insertAdjacentHTML('beforeend', '<div class="mx-note ok">✅ Your request is closed.</div>');
    }

    let f = panel.querySelector('.mx-f');
    if (!f) {
      f = document.createElement('form'); f.className = 'mx-f'; f.autocomplete = 'off';
      f.innerHTML = '<input class="input" maxlength="1000" placeholder="Write a message…" required><button class="btn btn-primary btn-sm">Send</button>';
      f.onsubmit = async e => {
        e.preventDefault();
        const inp = f.querySelector('input'), text = inp.value.trim(); if (!text || !cur) return; inp.value = '';
        const { data: m, error } = await sb.from('dm_messages').insert({ thread_id: cur.id, sender_id: me, body: text }).select().single();
        if (error) { inp.value = text; return UI.toast(error.message, 'error'); }
        if (!msgs.some(x => x.id === m.id)) { msgs.push(m); drawMsgs(); }
        // Ask the person who needs help, the first time they reply in each chat
        if (cur.client_id === me && reqOpen && !asked.has(cur.id)) {
          asked.add(cur.id);
          if (await UI.confirm('Have you found your helper?', 'If this person is helping you, please close your request now. Otherwise other helpers may keep contacting you about the same problem.', { confirmText: 'Yes, close my request', cancelText: 'Not yet' })) closeRequest();
        }
      };
      panel.appendChild(f);
    }
    f.hidden = false;
  }

  function showList() { const f = panel.querySelector('.mx-f'); if (f) f.hidden = true; drawList(); }
  function setOpen(v) {
    isOpen = v; panel.classList.toggle('open', v);
    fab.setAttribute('aria-label', v ? 'Close messages' : 'Open messages');
    if (v) { if (cur) openThread(cur.id); else { loadThreads(); drawList(); } }
  }

  function build() {
    fab = document.createElement('button'); fab.className = 'mx-fab'; fab.setAttribute('aria-label', 'Open messages');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg><span class="mx-badge" hidden>0</span>';
    badge = fab.querySelector('.mx-badge');
    panel = document.createElement('section'); panel.className = 'mx-panel'; panel.setAttribute('aria-label', 'Messages');
    panel.innerHTML = '<div class="mx-h"><button class="mx-back" aria-label="Back" hidden>←</button><span>Messages</span><button class="mx-x" aria-label="Close">✕</button></div><div class="mx-body"></div>';
    document.body.appendChild(panel); document.body.appendChild(fab);
    body = panel.querySelector('.mx-body'); title = panel.querySelector('.mx-h span'); backBtn = panel.querySelector('.mx-back');
    fab.onclick = () => setOpen(!isOpen);
    panel.querySelector('.mx-x').onclick = () => setOpen(false);
    backBtn.onclick = showList;
    body.onclick = e => { const b = e.target.closest('[data-t]'); if (b) openThread(b.dataset.t); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) setOpen(false); });
  }

  function subscribe() {
    ch = sb.channel('dm-' + me)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages' }, p => {
        const m = p.new;
        if (isOpen && cur && m.thread_id === cur.id) { if (!msgs.some(x => x.id === m.id)) { msgs.push(m); drawMsgs(); } if (m.sender_id !== me) markRead(cur.id); }
        else if (m.sender_id !== me) UI.toast('💬 You have a new message', 'info');
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => loadThreads())
      .subscribe();
  }

  window.HoloInbox = {
    open: () => setOpen(true),
    startWith: async clientUserId => {
      const { data, error } = await sb.rpc('start_dm', { p_client: clientUserId });
      if (error) return UI.toast(error.message, 'error', 6000);
      await loadThreads(); setOpen(true); openThread(data);
    }
  };

  Auth.access().then(a => { if (!a) return; me = a.user.id; build(); loadThreads(); subscribe(); });
})();
