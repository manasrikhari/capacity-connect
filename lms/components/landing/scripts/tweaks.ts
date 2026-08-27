export const tweaksScript = `
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "audience": "everyone",
    "accent": "#836BA6",
    "animations": true
  }/*EDITMODE-END*/;

  // Audience-aware copy. innerHTML because some strings carry <br>/<em>.
  const COPY = {
    heroTitle: {
      everyone: 'Live classes that<br><em>remember</em><br>everything.',
      teachers: 'Teach live.<br><em>Let AI handle</em><br>the rest.',
      students: 'Never miss<br><em>a thing,</em><br>ever again.'
    },
    heroLede: {
      everyone: 'A live classroom, a shared whiteboard, and an AI that remembers every session â one calm place for teachers to teach and students to never miss a thing.',
      teachers: 'Your live classroom, your AI assistant, and your whole batch â in one calm place built for independent educators.',
      students: 'Join live, ask the AI anything you missed, and revise from every class â so you never fall behind, even if you join late or zone out.'
    },
    trustLine: {
      everyone: 'Everything a class needs â for teachers and students alike',
      teachers: 'Everything an independent educator needs â nothing they donât',
      students: 'Everything you need to keep up â and never miss a class'
    },
    featuresHead: {
      everyone: 'Classes run better<br><em>for everyone.</em>',
      teachers: 'Four reasons educators<br>move their whole batch <em>here.</em>',
      students: 'Four reasons students<br>never fall <em>behind here.</em>'
    },
    featD_h3: {
      everyone: 'One calm place for the whole class',
      teachers: 'A platform teachers actually enjoy',
      students: 'Your whole class, in one place'
    },
    featD_p: {
      everyone: 'Classes, notes, tests, and fees in one clean, fast place â teachers run the batch and students always know whatâs next, whatâs due, and where to revise.',
      teachers: 'Schedule classes, publish notes, run tests, manage students, and track fees â in one clean, fast, uncluttered place. No enterprise bloat, no clutter.',
      students: 'Notes, tests, schedules, and fees in one clean place â always know whatâs next, whatâs due, and where to find everything from class.'
    },
    ctaP: {
      everyone: 'Teach it, learn it, and never lose it â live classes that explain themselves, for everyone in the room.',
      teachers: 'Teach live, let AI capture and explain it all, and manage the entire batch â without leaving the room.',
      students: 'Show up, stay curious, and let AI catch the rest â revise any class, any doubt, anytime.'
    }
  };

  function persist(edits) {
    Object.assign(TWEAKS, edits);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }
  function applyAudience(mode) {
    for (const id in COPY) { const el = document.getElementById(id); if (el) el.innerHTML = COPY[id][mode]; }
    document.querySelectorAll('#segAudience button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === mode)));
  }
  function applyAccent(hex) {
    let s = document.getElementById('accentStyle');
    if (!s) { s = document.createElement('style'); s.id = 'accentStyle'; document.head.appendChild(s); }
    s.textContent = ':root{--accent-green:' + hex + ';}'
      + '.btn-primary{background:' + hex + ' !important;border-color:' + hex + ' !important;}'
      + '#tweaks .switch[aria-pressed="true"]{background:' + hex + ' !important;}';
    document.querySelectorAll('#swAccent .sw').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === hex)));
  }
  function applyAnimations(on) {
    document.body.classList.toggle('no-anim', !on);
    document.getElementById('tkAnim').setAttribute('aria-pressed', String(on));
  }

  // Apply persisted defaults on load
  applyAudience(TWEAKS.audience);
  applyAccent(TWEAKS.accent);
  applyAnimations(TWEAKS.animations);

  // Wire controls
  document.getElementById('segAudience').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    applyAudience(b.dataset.v); persist({ audience: b.dataset.v });
  });
  document.getElementById('swAccent').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    applyAccent(b.dataset.v); persist({ accent: b.dataset.v });
  });
  document.getElementById('tkAnim').addEventListener('click', () => {
    const on = !(TWEAKS.animations); applyAnimations(on); persist({ animations: on });
  });

  // Tweaks host protocol â register listener BEFORE announcing availability
  const panel = document.getElementById('tweaks');
  window.addEventListener('message', e => {
    const t = e.data && e.data.type;
    if (t === '__activate_edit_mode') panel.classList.add('open');
    else if (t === '__deactivate_edit_mode') panel.classList.remove('open');
  });
  document.getElementById('tkClose').addEventListener('click', () => {
    panel.classList.remove('open');
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  });
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');
`;
