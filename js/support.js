/* Floating support chat widget. Logged-in users chat live with staff. */
(function () {
  const state = { open: false, conv: null, seen: new Set(), channel: null, loaded: false };

  const CHAT_SVG =
    '<svg class="i-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></svg>' +
    '<svg class="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  const btn = document.createElement('button');
  btn.id = 'hc-btn';
  btn.setAttribute('aria-label', 'Open support chat');
  btn.innerHTML = CHAT_SVG;

  const panel = document.createElement('section');
  panel.id = 'hc-panel';
  panel.setAttribute('aria-label', 'Support chat');
  panel.innerHTML =
    '<header class="hc-head">' +
    '<img src="' + HOLO.LOGO + '" alt="">' +
    '<div><strong>Holomatrix Support</strong><span>We usually reply within a few hours</span></div>' +
    '<button class="hc-close" aria-label="Close chat">✕</button>' +
    '</header>' +
    '<div class="hc-body" id="hc-body"></div>' +
    '<form class="hc-form" id="hc-form" autocomplete="off">' +
    '<input id="hc-input" placeholder="Type your message…" maxlength="1000" required>' +
    '<button class="hc-send" aria-label="Send message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
    '</form>';

  document.body.appendChild(panel);
  document.body.appendChild(btn);

  const body = panel.querySelector('#hc-body');
  const form = panel.querySelector('#hc-form');
  const input = panel.querySelector('#hc-input');

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function bubble(kind, text, time) {
    const d = document.createElement('div');
    d.className = 'hc-msg ' + kind;
    d.textContent = text;
    if (time) {
      const s = document.createElement('small');
      s.textContent = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      d.appendChild(s);
    }
    body.appendChild(d);
    scrollDown();
  }

  function renderMsg(m) {
    if (state.seen.has(m.id)) return;
    state.seen.add(m.id);
    bubble(m.sender_type === 'user' ? 'user' : 'staff', m.body, m.created_at);
  }

  function resetState() {
    if (state.channel) { sb.removeChannel(state.channel); }
    state.channel = null; state.conv = null; state.loaded = false; state.seen.clear();
    body.innerHTML = '';
  }

  async function start() {
    const session = await Auth.session();

    if (!session) {
      form.style.display = 'none';
      body.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'hc-login';
      box.innerHTML =
        '<div style="font-size:2.4rem">💬</div>' +
        '<p>Log in to chat with the Holomatrix team. It only takes a moment.</p>' +
        '<a class="btn btn-primary" href="/login?next=' + encodeURIComponent(location.pathname) + '">Log in to chat</a>';
      body.appendChild(box);
      return;
    }

    form.style.display = '';
    if (state.loaded) { setTimeout(() => input.focus(), 300); return; }

    body.innerHTML = '<div class="hc-note">Loading…</div>';

    let { data: conv } = await sb
      .from('support_conversations').select('*')
      .eq('user_id', session.user.id).eq('status', 'open')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!conv) {
      const r = await sb.from('support_conversations').insert({ user_id: session.user.id }).select().single();
      if (r.error) {
        body.innerHTML = '<div class="hc-note">Chat is unavailable right now. Please try again later.</div>';
        return;
      }
      conv = r.data;
    }
    state.conv = conv;

    const { data: msgs } = await sb
      .from('support_messages').select('*')
      .eq('conversation_id', conv.id).order('created_at', { ascending: true });

    body.innerHTML = '';
    bubble('staff', 'Hi! 👋 How can we help you today?');
    (msgs || []).forEach(renderMsg);

    state.channel = sb.channel('support-' + conv.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: 'conversation_id=eq.' + conv.id },
        p => renderMsg(p.new))
      .subscribe();

    state.loaded = true;
    setTimeout(() => input.focus(), 300);
  }

  function setOpen(v) {
    state.open = v;
    panel.classList.toggle('open', v);
    btn.classList.toggle('open', v);
    btn.setAttribute('aria-label', v ? 'Close support chat' : 'Open support chat');
    if (v) start();
  }

  btn.addEventListener('click', () => setOpen(!state.open));
  panel.querySelector('.hc-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.open) setOpen(false); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !state.conv) return;
    input.value = '';
    const session = await Auth.session();
    if (!session) return start();

    const { data, error } = await sb.from('support_messages')
      .insert({ conversation_id: state.conv.id, sender_type: 'user', sender_id: session.user.id, body: text })
      .select().single();

    if (error) { UI.toast('Message could not be sent. Please try again.', 'error'); input.value = text; return; }
    renderMsg(data);
  });

  sb.auth.onAuthStateChange(ev => {
    if (ev === 'SIGNED_OUT') { resetState(); if (state.open) start(); }
    if (ev === 'SIGNED_IN' && state.open) start();
  });

  window.HoloSupport = { open: () => setOpen(true), close: () => setOpen(false) };
})();
