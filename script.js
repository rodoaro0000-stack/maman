(() => {
  const $ = (s) => document.querySelector(s);
  const body = document.body;
  const audio = $('#bgMusic');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== À PERSONNALISER ===== */
  // Dépose tes photos dans /photos et renseigne "src" (ex: 'photos/noel.jpg').
  // Sans photo, un cadre doré élégant s'affiche à la place.
  const MEMORIES = [
    { src: '', cap: 'Ton sourire qui éclaire tout' },
    { src: '', cap: 'Les rires qu\'on n\'oublie pas' },
    { src: '', cap: 'Ta douceur, partout, toujours' },
    { src: '', cap: 'Chaque jour passé à tes côtés' },
  ];
  const LETTER = `Ma maman,\n\nAujourd'hui, c'est ton anniversaire, et j'avais envie de prendre un moment pour te dire quelque chose que je ne dis peut-être pas assez souvent : merci.\n\nMerci pour ta présence, ta patience, tes conseils, tes encouragements et toutes ces petites choses que tu fais parfois sans même y penser. Tu as une façon unique de rendre les journées plus belles et les moments difficiles un peu plus légers.\n\nJe te souhaite une année remplie de douceur, de beaux souvenirs, de rires, de santé et de tout ce qui peut te rendre heureuse. Tu mérites de recevoir autant de bonheur que tu en donnes autour de toi.\n\nJoyeux anniversaire Maman. Profite de cette journée, elle est à ton image : précieuse et pleine de lumière.\n\nJe t'aime très fort. 🤍`;

  /* ===== Utilitaires ===== */
  let timers = [], typing = null, run = 0;
  const wait = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; clearInterval(typing); typing = null; };

  // Découpe les textes en mots pour l'animation flou -> net
  document.querySelectorAll('.split').forEach((el) => {
    const d = el.dataset.d ? `${el.dataset.d}s` : '0s';
    el.setAttribute('aria-label', el.textContent);
    el.innerHTML = el.textContent.split(' ').map((w, i) =>
      `<span class="w" aria-hidden="true" style="--i:${i};--d:${d}">${w}</span>`).join(' ');
  });

  function show(name) {
    body.dataset.s = name;
    document.querySelectorAll('.scene').forEach((s) => s.classList.toggle('on', s.id === `sc-${name}`));
  }

  /* ===== Musique : fondu doux ===== */
  let fade = null;
  const fadeTo = (v, ms, done) => {
    clearInterval(fade);
    const from = audio.volume, steps = Math.max(1, ms / 50);
    let n = 0;
    fade = setInterval(() => {
      audio.volume = Math.min(1, Math.max(0, from + (v - from) * (++n / steps)));
      if (n >= steps) { clearInterval(fade); done && done(); }
    }, 50);
  };
  const setPlaying = (on) => {
    body.classList.toggle('playing', on);
    $('#music').setAttribute('aria-pressed', String(on));
    $('#music').setAttribute('aria-label', on ? 'Mettre la musique en pause' : 'Relancer la musique');
  };
  function startMusic() {
    audio.volume = 0;
    const p = audio.play();
    if (p && p.then) p.then(() => { setPlaying(true); fadeTo(.55, 4000); }).catch(() => setPlaying(false));
    else { setPlaying(true); fadeTo(.55, 4000); }
  }
  $('#music').addEventListener('click', () => {
    if (audio.paused) startMusic();
    else { setPlaying(false); fadeTo(0, 600, () => audio.pause()); }
  });

  /* ===== Canvas : poussière dorée, éclats, pétales ===== */
  const cv = $('#fx'), cx = cv.getContext('2d');
  let W, H, dpr, parts = [], dust = [], raf = 0;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const COLORS = ['#fff0c8', '#e8c77a', '#d9a3a0', '#f6f1e7'];
  const mkDust = () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.6, 2) * dpr, vy: -rnd(.08, .3) * dpr, ph: rnd(0, 6.28), a: rnd(.15, .6) });
  const spawn = (n) => { for (let i = 0; i < n; i++) dust.push(mkDust()); };

  function burst(n, cxp = .5, cyp = .45) {
    if (reduce) n = Math.round(n / 4);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28), v = rnd(2, 11) * dpr;
      parts.push({ x: W * cxp, y: H * cyp, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2 * dpr, g: .14 * dpr, drag: .985,
        r: rnd(1.5, 4) * dpr, life: 0, max: rnd(90, 170), c: COLORS[i % 4], petal: Math.random() < .3, rot: rnd(0, 6.28), vr: rnd(-.08, .08) });
    }
  }
  function petals(n) {
    for (let i = 0; i < n; i++)
      parts.push({ x: rnd(0, W), y: -20 * dpr, vx: rnd(-.6, .6) * dpr, vy: rnd(1, 2.4) * dpr, g: 0, drag: 1, r: rnd(4, 8) * dpr,
        life: 0, max: 600, c: Math.random() < .6 ? '#d9a3a0' : '#e8c77a', petal: true, rot: rnd(0, 6.28), vr: rnd(-.04, .04), sway: rnd(0, 6.28) });
  }

  function frame(t) {
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = '#e8c77a';
    for (const d of dust) {
      d.y += d.vy; d.x += Math.sin(t / 2000 + d.ph) * .25 * dpr;
      if (d.y < -10) { d.y = H + 10; d.x = rnd(0, W); }
      cx.globalAlpha = d.a * (.6 + .4 * Math.sin(t / 900 + d.ph));
      cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.28); cx.fill();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
      p.x += p.vx + (p.sway !== undefined ? Math.sin(p.life / 30 + p.sway) * .8 * dpr : 0); p.y += p.vy; p.rot += p.vr;
      if (++p.life > p.max || p.y > H + 30) { parts.splice(i, 1); continue; }
      cx.globalAlpha = Math.max(0, 1 - p.life / p.max) * .95;
      cx.fillStyle = p.c;
      cx.beginPath();
      if (p.petal) cx.ellipse(p.x, p.y, p.r * 1.7, p.r * .8, p.rot, 0, 6.28);
      else cx.arc(p.x, p.y, p.r, 0, 6.28);
      cx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  });
  addEventListener('resize', () => { size(); dust = []; spawn(innerWidth < 700 ? 35 : 70); });
  addEventListener('pointermove', (e) => {
    body.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(2));
    body.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(2));
  }, { passive: true });

  /* ===== Souvenirs : polaroids en profondeur ===== */
  const track = $('#track');
  track.innerHTML = MEMORIES.map((m, i) => `
    <figure class="pol" style="--tilt:${(i % 2 ? 1 : -1) * (2 + i)}deg">
      <div class="ph">${m.src ? `<img src="${m.src}" alt="${m.cap}" loading="lazy">` : '✦'}</div>
      <figcaption>${m.cap}</figcaption>
    </figure>`).join('');
  const cards = [...track.children];
  let ticking = false;
  function depth() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    cards.forEach((c) => {
      const d = Math.min(1, Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) / (c.offsetWidth * 1.3));
      c.style.setProperty('--s', (1 - d * .14).toFixed(3));
      c.style.setProperty('--o', (1 - d * .45).toFixed(2));
      c.style.setProperty('--r', `${(parseFloat(c.style.getPropertyValue('--tilt')) * (1 - d)).toFixed(2)}deg`);
    });
    ticking = false;
  }
  track.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(depth); } }, { passive: true });

  /* ===== Lettre ===== */
  const lb = $('#letterBody'), lh = $('#letterHint');
  const done = () => { lh.textContent = 'Une lettre juste pour toi ✨'; };
  function typeLetter(id) {
    lb.textContent = ''; lh.textContent = 'Touche la lettre pour tout lire';
    let i = 0;
    typing = setInterval(() => {
      lb.textContent += LETTER[i++];
      if (i >= LETTER.length) {
        clearInterval(typing); typing = null; done();
        wait(() => id === run && finale(), 2800);
      }
    }, 26);
  }
  $('#letterCard').addEventListener('click', () => {
    if (typing) { clearInterval(typing); typing = null; lb.textContent = LETTER; done(); wait(finale, 2800); }
  });

  /* ===== Le parcours ===== */
  function finale() {
    if (body.dataset.s === 'finale') return;
    show('finale');
    $('#flash').classList.add('go');
    burst(160); wait(() => burst(120, .3, .4), 500); wait(() => burst(120, .7, .35), 1000);
    for (let k = 0; k < 8; k++) wait(() => petals(14), k * 900);
  }

  function reset() {
    run++; clear(); parts = [];
    body.classList.remove('opened'); setPlaying(false);
    fadeTo(0, 800, () => { audio.pause(); audio.currentTime = 0; });
    $('#flash').classList.remove('go'); lb.textContent = ''; track.scrollLeft = 0;
    show('gate');
  }

  $('#enter').addEventListener('click', () => {
    const id = ++run;
    startMusic();
    show('reveal');
    wait(() => id === run && show('envelope'), 5200);
  }, { once: false });

  function open() {
    if (body.classList.contains('opened')) return;
    const id = ++run;
    body.classList.add('opened');
    burst(70);
    wait(() => { if (id === run) { show('message'); burst(60); } }, 1500);
    wait(() => id === run && (show('memories'), depth()), 8200);
  }
  $('#envelope').addEventListener('click', open);

  document.querySelector('[data-next=letter]').addEventListener('click', () => {
    const id = ++run;
    show('letter');
    wait(() => id === run && typeLetter(id), 1500);
  });
  $('#replay').addEventListener('click', reset);

  size(); spawn(innerWidth < 700 ? 35 : 70);
  show('gate');
  raf = requestAnimationFrame(frame);
})();
