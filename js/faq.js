/* FAQ with clickable links. Link syntax inside any answer: [text](/page) */
(function () {
  'use strict';
  const R = window.HoloRender, e = UI.esc;
  if (!R) return;

  const FAQ = [
    ['What is Holomatrix?', 'Holomatrix is an integrated education, research and consulting venture built around the idea that knowledge should not merely be acquired; it should be explored, expanded and applied.\nWe aim to connect research-oriented learning, scientific inquiry and expert consulting within one interconnected ecosystem.'],
    ['What are the three core divisions of Holomatrix?', 'Holomatrix operates around three interconnected pillars:\n- Education: Research-focused courses, learning programmes and workshops.\n- Research: Collaborative inquiry, research projects and the dissemination of scientific work.\n- Consulting: Research, analytical, publication and scientific communication support.\nThese divisions are designed to reinforce one another: education develops talent, research expands knowledge, and consulting applies expertise to real-world challenges.'],
    ['Who does Holomatrix work with?', 'Our intended community includes students, aspiring researchers, academics, independent researchers, research groups, educational organisations and businesses seeking specialised research-oriented expertise.\nSpecific services and collaborations depend on the project scope and the capabilities available at the time.'],
    ['What research areas does Holomatrix focus on?', "Holomatrix's research interests include theoretical and mathematical physics, quantum foundations, quantum information, cosmology and interdisciplinary scientific inquiry.\nThe scope of active research may vary depending on individual projects and collaborations.\nWe aim to communicate scientific developments accurately and distinguish established findings, open questions and exploratory hypotheses."],
    ['Can students or independent researchers collaborate with Holomatrix?', "We are interested in building collaborative research opportunities for students and independent researchers.\nParticipation will depend on the project's subject, available supervision, research readiness and the applicant's relevant skills.\nWhen opportunities become available, the requirements and application process will be announced through our official channels."],
    ['Can Holomatrix guarantee publication of a research paper?', 'No. Journal acceptance is determined by independent editorial and peer-review processes.\nWe can support appropriate aspects of the research and publication process, but we cannot guarantee acceptance, citations or any particular publication outcome.\nResearch integrity, accurate attribution and transparent authorship practices are fundamental to our approach.'],
    ['What consulting services does Holomatrix currently provide?', "Holomatrix's current consulting foundation is research and publication support.\nDepending on the project, our services may include:\n- Scientific literature review and synthesis.\n- Research documentation and manuscript development support.\n- Scientific writing, editing and communication.\n- Research organisation and bibliographic support.\n- Analytical and subject-matter consultation within relevant areas of expertise.\nThe scope of each engagement is discussed and agreed upon before work begins."],
    ['How do I request a consultation or project proposal?', 'Use our [contact page](/contact/staff-support) to describe your project, research area, objectives, expected deliverables and timeline.\nSharing relevant background material at the enquiry stage helps us assess your requirements.\nWe will discuss the scope, feasibility and applicable fees before confirming an engagement.'],
    ['How are consulting fees and timelines decided?', 'Fees and timelines depend on the complexity of the work, the level of specialist input required, the deliverables and the expected turnaround.\nA project-specific proposal or quotation will be agreed upon before work begins. There is no single fee applicable to every engagement.'],

    ['How do I sign up?', 'Press [Sign up](/signup) at the top of the page. Use your email and a password, or continue with Google or LinkedIn. If you used email, confirm it from the message we send (check spam too). Then complete your profile with a unique username and a display name.'],
    ['How do I log in?', 'Press [Log in](/login), then use the same email and password, or the Google or LinkedIn button you signed up with.'],
    ['I forgot my password. What now?', 'On the [Log in](/login) page press [Forgot password?](/login?mode=forgot), enter your email and follow the link we send you.'],
    ['Can I change my username, display name or photo?', 'Yes. Open the profile photo menu, choose [Dashboard](/dashboard), then press [Edit profile](/welcome?edit=1). Every username is unique, so if a name is taken, choose another.'],
    ['How do I turn announcement emails on or off?', 'Open your [Dashboard](/dashboard) and use the Announcement emails switch under Preferences.'],
    ['Where can I read the news?', 'Open [News](/news/all) in the top menu and choose a group such as Physics, Astronomy or Holomatrix.'],
    ['How do I contact the team?', 'Open [Contact us](/contact/ai-support). [AI support](/contact/ai-support) answers questions about the website straight away. [Staff support](/contact/staff-support) is a live chat with the team (you need to be logged in).'],
    ['What is the round message button?', 'It opens your private chats. A red number shows how many chats have new messages.'],
    ['What does "Become a client" mean?', 'A client is a person who needs help with something. [Become a client](/clients/become-a-client) is free: describe what you need and define your problem so helpers can reach you. When you have found help, close your request.'],
    ['Where do I read the Privacy Policy and Terms?', 'Both are linked at the bottom of every page: [Privacy Policy](/privacy) and [Terms of Service](/terms).']
  ];

  const md = s => e(s).replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (m, t, u) => '<a class="flink" href="' + u + '">' + t + '</a>');
  const body = a => {
    let h = '', ul = false;
    String(a).split('\n').forEach(l => {
      l = l.trim(); if (!l) return;
      if (l.indexOf('- ') === 0) { if (!ul) { h += '<ul class="list">'; ul = true; } h += '<li>' + md(l.slice(2)) + '</li>'; }
      else { if (ul) { h += '</ul>'; ul = false; } h += '<p>' + md(l) + '</p>'; }
    });
    return h + (ul ? '</ul>' : '');
  };

  R.faqBlock = () => '<h2 class="hm-h2" data-t="hm.faq.h">Frequently asked questions</h2><div class="faq">' +
    FAQ.map((f, i) => '<details class="reveal"><summary data-t="hm.faq' + i + '.q">' + e(f[0]) + '</summary><div class="a" data-t="hm.faq' + i + '.a" data-multiline>' + body(f[1]) + '</div></details>').join('') + '</div>';

  /* answers that were saved as text with [links](/page) become clickable again */
  function linkify(root) {
    if (document.body.classList.contains('editing')) return;
    root.querySelectorAll('.faq .a[data-t]').forEach(el => { if (!el.children.length && /\]\(\//.test(el.textContent)) el.innerHTML = body(el.textContent); });
  }
  /* while editing, show links as [text](/page) so they survive saving */
  const nodeMd = n => Array.from(n.childNodes).map(x => x.nodeType === 3 ? x.textContent : (x.tagName === 'A' ? '[' + x.textContent + '](' + x.getAttribute('href') + ')' : x.textContent)).join('');
  function toMd() {
    document.querySelectorAll('.faq .a[data-t]').forEach(el => {
      if (!el.children.length) return;
      el.textContent = Array.from(el.children).map(c => c.tagName === 'UL' ? Array.from(c.children).map(li => '- ' + nodeMd(li)).join('\n') : nodeMd(c)).join('\n');
      el.style.whiteSpace = 'pre-wrap';
    });
  }
  const orig = Site.applyAll;
  Site.applyAll = function () { const r = orig.apply(this, arguments); linkify(document); return r; };
  new MutationObserver(() => { if (document.body.classList.contains('editing')) toMd(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
