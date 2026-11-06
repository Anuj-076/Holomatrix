/* Holomatrix content + renderers (used by the landing page and About → Holomatrix). Every text is editable with Edit site. */
(function () {
  'use strict';
  const e = UI.esc, b = t => ['b', t];
  const D = {
    ticker: 'Education. Research. Consulting',
    tagline: 'Bridging knowledge, research and real-world application.',
    intro: [
      ['Holomatrix is an integrated education, research and consulting venture built around one central idea: ', b('knowledge should not merely be acquired; it should be explored, expanded and applied.')],
      'We bring together research-driven learning, scientific inquiry and expert consulting to create an ecosystem where education fuels discovery, research drives innovation, and practical experience creates meaningful impact.',
      'Our approach goes beyond conventional boundaries between academia and industry. We aim to create opportunities for students to engage with real research, support researchers in advancing their work, and help organisations navigate complex scientific and technical challenges.',
      'At Holomatrix, we believe the future belongs to those who continuously learn, question, investigate and innovate.'
    ],
    bridge: [
      'The journey from learning to discovery and from discovery to application is often fragmented. Students learn concepts without opportunities to engage in real research. Researchers struggle to access the resources and support needed to advance their work. Organisations, meanwhile, need specialised knowledge to solve complex problems.',
      'Holomatrix aims to bridge these gaps.',
      'We are building an interconnected ecosystem across three core domains:',
      'These are not independent verticals. They are designed to work together, creating a continuous exchange of knowledge, talent, resources and ideas.',
      'Our long-term ambition is to develop Holomatrix into a platform where learning leads to research, research leads to innovation, and innovation creates opportunities for further learning and discovery.'
    ],
    domains: [
      ['Education', 'Developing research-oriented learning experiences that equip students with the knowledge, skills and mindset to engage with scientific and technological challenges.'],
      ['Research', 'Supporting scientific inquiry, collaborative projects and the development and dissemination of original research.'],
      ['Consulting', 'Providing research, analytical and publication support to individuals, research groups and organisations.']
    ],
    what: [
      { id: 'education', title: 'Education', tag: 'Learn beyond the classroom.',
        paras: ['We believe meaningful education should extend beyond textbooks and conventional instruction. It should encourage independent thinking, scientific reasoning and the ability to investigate unanswered questions.', 'Holomatrix aims to develop research-focused learning experiences that connect theoretical foundations with practical applications.'],
        lead: 'Our planned areas of focus include:',
        list: ['Research-oriented courses and specialised learning programmes.', 'Foundations of physics, mathematics and emerging technologies.', 'Quantum physics and quantum information science.', 'Scientific computing and computational methods.', 'Research methodology, academic writing and scientific communication.', 'Workshops, webinars and collaborative learning initiatives.'],
        close: ['Our goal is not simply to teach subjects, but to help learners develop the intellectual tools and practical capabilities required to participate in research and innovation.'],
        key: 'The pathway: From curious learner to independent thinker and emerging researcher.' },
      { id: 'research', title: 'Research', tag: 'Advancing knowledge through inquiry.',
        paras: [[b('Research is the intellectual core of Holomatrix.')], 'We aim to cultivate an environment where curiosity translates into structured investigation, ideas are examined rigorously, and scientific knowledge is continuously developed.', 'Our research initiatives will focus on collaborative projects, interdisciplinary inquiry and the dissemination of research through academic publications and other scientific platforms.'],
        lead: 'Our areas of activity include:',
        list: ['Collaborative research projects and research group development.', 'Literature reviews and critical analysis of scientific developments.', 'Research methodology and theoretical modelling.', 'Scientific writing and publication support.', 'Interdisciplinary research collaborations.', 'Research internships and mentored project opportunities.', 'Exploring grants and research funding opportunities.'],
        close: ['We envision a small, collaborative research ecosystem where motivated students and researchers can contribute to ongoing projects, gain practical research experience and gradually develop independent research capabilities.'],
        key: 'Our principle: Research must be driven by intellectual honesty, methodological rigour and a commitment to evidence.' },
      { id: 'consulting', title: 'Consulting', tag: 'Turning expertise into meaningful outcomes.',
        paras: ['Holomatrix provides research and publication-oriented consulting services to individuals, researchers and organisations working across scientific and academic domains.', 'We help clients navigate the research process, strengthen their work and communicate complex ideas with greater clarity and precision.'],
        lead: 'Our current consulting focus includes:',
        list: ['Research assistance and academic project support.', 'Scientific literature review and synthesis.', 'Manuscript development and publication support.', 'Scientific writing, editing and communication.', 'Research strategy and analytical support.', 'Subject-matter consultation in relevant areas of physics and interdisciplinary science.'],
        close: ['Each engagement is approached with an emphasis on accuracy, clarity, research integrity and the specific objectives of the client.', 'We see consulting not merely as a service, but as an opportunity to engage with real-world research challenges, build collaborations and strengthen the wider research ecosystem.'] }
    ],
    model: {
      title: 'The Holomatrix Model', sub: 'Three divisions. One interconnected ecosystem.',
      intro: ['What makes Holomatrix different is the relationship between its three core divisions.', 'Education, research and consulting are designed to strengthen one another rather than operate as isolated business units.'],
      steps: [
        ['Education fuels Research.', 'Learners who demonstrate curiosity, capability and commitment can be encouraged to participate in research projects and collaborative initiatives.'],
        ['Research strengthens Consulting.', 'Original research, publications and accumulated expertise build intellectual credibility, strengthen technical capabilities and inform the solutions we offer to clients.'],
        ['Consulting sustains Research.', 'Consulting engagements generate revenue that can be reinvested into research initiatives, infrastructure, talent development and future projects.'],
        ['Research enriches Education.', 'Research findings, practical experience and emerging scientific developments become the foundation for new learning resources, courses and educational programmes.']
      ],
      cycleTitle: 'A continuous cycle of knowledge and innovation', cycle: ['Education', 'Research', 'Consulting', 'Research', 'Education'],
      close: 'This integrated model creates a self-reinforcing ecosystem in which knowledge is continuously generated, applied, tested and shared.'
    },
    mission: ['To build an integrated ecosystem that advances education, scientific research and practical innovation by connecting learners, researchers and organisations through knowledge, collaboration and expertise.', 'We strive to make research more accessible, learning more meaningful and scientific knowledge more impactful.'],
    vision: ['To become a globally connected research and education enterprise that nurtures independent thinkers, supports meaningful scientific contributions and translates knowledge into solutions that advance society.', 'We envision a future where the boundaries between learning, research and application become increasingly fluid, enabling more people to participate in the pursuit of knowledge and discovery.'],
    values: [
      ['Intellectual Curiosity', 'We encourage questioning, exploration and the pursuit of ideas beyond established boundaries.'],
      ['Scientific Integrity', 'We value evidence, transparency, methodological rigour and intellectual honesty above unsupported claims.'],
      ['Critical Thinking', 'We encourage independent thought, constructive scepticism and the willingness to challenge assumptions.'],
      ['Interdisciplinary Collaboration', 'We believe complex challenges often require perspectives and expertise from multiple disciplines.'],
      ['Accessibility of Knowledge', 'We strive to make advanced concepts, research opportunities and scientific knowledge more accessible to aspiring learners and researchers.'],
      ['Impact through Application', 'We believe knowledge creates greater value when it is translated into meaningful research, practical solutions and broader societal progress.']
    ],
    who: ['Holomatrix aims to bring together individuals and organisations across the knowledge and innovation ecosystem.', [
      ['Students and aspiring researchers', 'seeking research-oriented education, mentorship and opportunities to develop practical skills.'],
      ['Academics and independent researchers', 'looking for research collaboration, analytical assistance and publication support.'],
      ['Research groups and institutions', 'seeking specialised expertise and scientific consulting.'],
      ['Startups and organisations', 'requiring research-oriented insights, technical expertise and analytical support.'],
      ['Scientific and educational communities', 'interested in collaborations, knowledge exchange and interdisciplinary initiatives.']
    ]],
    future: {
      title: 'Building the Future of Knowledge',
      paras: ['We are at the beginning of a larger journey.', 'What started with research and publication-oriented consulting is evolving into a broader vision: an ecosystem where education, research and consulting work together to create opportunities for learning, discovery and innovation.', 'We believe that the next generation of scientific and technological progress will depend not only on individual discoveries, but also on the ecosystems that enable people to make them.', 'Holomatrix is being built with that ambition.'],
      words: ['Learn.', 'Investigate.', 'Discover.', 'Innovate.'], tag: 'Be part of the journey.',
      ctas: [['Get in Touch', '/contact/staff-support'], ['Collaborate with Us', '/contact/staff-support'], ['Explore Opportunities', '/research/all']]
    },
    faq: [
      ['How do I sign up?', 'Press Sign up at the top of the home page. Use your email and a password, or continue with Google or LinkedIn. If you used email, confirm it from the message we send (check spam too). Then complete your profile with a unique username, display name and birthday.'],
      ['How do I log in?', 'Press Log in, then use the same email and password, or the Google or LinkedIn button you signed up with.'],
      ['I forgot my password. What now?', 'On the Log in page press "Forgot password?", enter your email and follow the link we send you.'],
      ['Can I change my username, display name or photo?', 'Yes. Open the profile photo menu, choose Dashboard, then Edit profile. Every username is unique, so if a name is taken, choose another.'],
      ['How do I turn announcement emails on or off?', 'Open Dashboard and use the Announcement emails switch under Preferences.'],
      ['Where can I read the news?', 'Open News in the top menu and choose a group such as Physics, Astronomy, Biology, Chemistry, Technology or Holomatrix.'],
      ['How do I contact the team?', 'Open Contact us. AI support answers questions about the website straight away. Staff support is a live chat with the team (you need to be logged in).'],
      ['What is the round message button?', 'It opens your private chats. A red number shows how many chats have new messages.'],
      ['What does "Become a client" mean?', 'A client is a person who needs help with something. Become a client is free: describe what you need and define your problem so helpers can reach you. When you have found help, close your request.'],
      ['Where do I read the Privacy Policy and Terms?', 'Both are linked at the bottom of every page.']
    ]
  };

  const seg = (k, s) => s.map((x, i) => Array.isArray(x) ? '<strong class="em" data-t="' + k + '.' + i + '">' + e(x[1]) + '</strong>' : '<span data-t="' + k + '.' + i + '">' + e(x) + '</span>').join('');
  const p = (k, x, cls) => '<p class="' + (cls || 'hm-p') + '">' + seg(k, typeof x === 'string' ? [x] : x) + '</p>';
  const t = (k, text, tag, cls) => '<' + tag + ' class="' + cls + '" data-t="' + k + '">' + e(text) + '</' + tag + '>';
  const R = {};

  R.hero = learn => '<div class="hi-grid"><div><span class="pill-gold" data-t="hm.tag">Holomatrix</span>' +
    '<div class="mq" role="img" aria-label="' + e(D.ticker) + '"><div class="mq-track">' + [0, 1, 2, 3].map(() => '<span class="mq-i" data-t="hm.ticker">' + e(D.ticker) + '</span>').join('') + '</div></div>' +
    t('hm.tagline', D.tagline, 'p', 'hm-sub') + D.intro.map((x, i) => p('hm.intro.' + i, x)).join('') +
    (learn ? '<a class="learn" href="/about/holomatrix#learn-more"><span data-t="hm.learn">Learn more</span><i>⌄</i></a>' : '') +
    '</div><div class="hi-img img-slot" data-img="landing.intro" data-alt="Holomatrix"><span>🌌</span></div></div>';

  R.bridge = () => '<div id="learn-more" class="hm-anchor"></div>' + p('hm.br.0', D.bridge[0]) + t('hm.br.1', D.bridge[1], 'p', 'key gold') + p('hm.br.2', D.bridge[2]) +
    '<div class="dom">' + D.domains.map((d, i) => '<div class="card reveal"><h3 data-n="0' + (i + 1) + '" data-t="hm.dom.' + i + '.t">' + e(d[0]) + '</h3><p data-t="hm.dom.' + i + '.d">' + e(d[1]) + '</p></div>').join('') + '</div>' + p('hm.br.3', D.bridge[3]) + p('hm.br.4', D.bridge[4]);

  R.whatCards = () => t('hm.what.h', 'What We Do', 'h2', 'hm-h2') + '<div class="dom">' + D.domains.map((d, i) =>
    '<a class="card reveal" href="/about/holomatrix#' + D.what[i].id + '"><h3 data-n="0' + (i + 1) + '" data-t="hm.dom.' + i + '.t">' + e(d[0]) + '</h3><p class="key" style="font-size:1rem" data-t="hm.w' + i + '.tag">' + e(D.what[i].tag) + '</p><p data-t="hm.dom.' + i + '.d">' + e(d[1]) + '</p></a>').join('') + '</div>';

  R.what = () => t('hm.what.h', 'What We Do', 'h2', 'hm-h2') + D.what.map((w, i) => { const k = 'hm.w' + i;
    return '<div class="wd reveal" id="' + w.id + '"><span class="wd-n">0' + (i + 1) + '</span>' + t(k + '.t', w.title, 'h3', '') + t(k + '.tag', w.tag, 'p', 'hm-sub') +
      w.paras.map((x, j) => p(k + '.p' + j, x)).join('') + t(k + '.lead', w.lead, 'p', 'hm-p') + '<ul class="list">' + w.list.map((x, j) => '<li data-t="' + k + '.l' + j + '">' + e(x) + '</li>').join('') + '</ul>' +
      w.close.map((x, j) => p(k + '.c' + j, x)).join('') + (w.key ? t(k + '.key', w.key, 'p', 'key') : '') + '</div>'; }).join('');

  R.model = c => { const M = D.model;
    return t('hm.mod.h', M.title, 'h2', 'hm-h2') + t('hm.mod.sub', M.sub, 'p', 'hm-sub') +
      (c ? '' : M.intro.map((x, i) => p('hm.mod.i' + i, x)).join('') + '<div class="dom">' + M.steps.map((s, i) => '<div class="card reveal">' + t('hm.ms' + i + '.t', s[0], 'p', 'key') + t('hm.ms' + i + '.d', s[1], 'p', 'hm-p') + '</div>').join('') + '</div>') +
      t('hm.mod.ct', M.cycleTitle, 'p', 'key') + '<div class="cyc">' + M.cycle.map((x, i) => (i ? '<i>→</i>' : '') + '<span data-t="hm.cy' + i + '">' + e(x) + '</span>').join('') + '</div>' +
      (c ? '<a class="learn" href="/about/holomatrix#model"><span data-t="hm.learn2">Learn more</span><i>⌄</i></a>' : p('hm.mod.close', M.close)); };

  R.mv = () => '<div class="mv">' + [['Our Mission', D.mission], ['Our Vision', D.vision]].map((m, i) => '<div class="card reveal">' + t('hm.mv' + i + '.t', m[0], 'h3', '') + m[1].map((x, j) => p('hm.mv' + i + '.' + j, x)).join('') + '</div>').join('') + '</div>';
  R.values = () => t('hm.val.h', 'Our Core Values', 'h2', 'hm-h2') + '<div class="vals">' + D.values.map((v, i) => '<div class="card reveal">' + t('hm.val' + i + '.t', v[0], 'h4', '') + t('hm.val' + i + '.d', v[1], 'p', '') + '</div>').join('') + '</div>';
  R.who = () => t('hm.who.h', 'Who We Work With', 'h2', 'hm-h2') + t('hm.who.i', D.who[0], 'p', 'hm-sub') + '<div class="who">' + D.who[1].map((w, i) => '<div class="card reveal"><b data-t="hm.who' + i + '.t">' + e(w[0]) + '</b> <span data-t="hm.who' + i + '.d">' + e(w[1]) + '</span></div>').join('') + '</div>';
  R.future = () => { const F = D.future;
    return '<div class="fut reveal">' + t('hm.fut.h', F.title, 'h2', 'hm-h2') + F.paras.map((x, i) => p('hm.fut.' + i, x, 'hm-p ctr')).join('') +
      '<div class="fut-words">' + F.words.map((w, i) => '<span data-t="hm.fw' + i + '">' + e(w) + '</span>').join(' ') + '</div>' + t('hm.fut.k', F.tag, 'p', 'key ctr') +
      '<div class="cta-row">' + F.ctas.map((c, i) => '<a class="btn ' + (i ? 'btn-ghost' : 'btn-primary') + '" href="' + c[1] + '"><span data-t="hm.cta' + i + '">' + e(c[0]) + '</span></a>').join('') + '</div></div>'; };
  R.faqBlock = () => t('hm.faq.h', 'Frequently asked questions', 'h2', 'hm-h2') + '<div class="faq">' + D.faq.map((f, i) => '<details class="reveal"><summary data-t="hm.faq' + i + '.q">' + e(f[0]) + '</summary><div class="a" data-t="hm.faq' + i + '.a">' + e(f[1]) + '</div></details>').join('') + '</div>';

  R.aboutPage = () => ['<div class="hm-sec">' + R.hero(false) + '</div>', '<div class="hm-sec">' + R.bridge() + '</div>', '<div class="hm-sec">' + R.what() + '</div>', '<div class="hm-sec" id="model">' + R.model(false) + '</div>',
    '<div class="hm-sec">' + R.mv() + '</div>', '<div class="hm-sec">' + R.values() + '</div>', '<div class="hm-sec">' + R.who() + '</div>', '<div class="hm-sec">' + R.future() + '</div>', '<div class="hm-sec">' + R.faqBlock() + '</div>'].join('');

  window.HoloRender = R;
})();
