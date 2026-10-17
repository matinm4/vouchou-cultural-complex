/* ==================================================================
 *  کنترلر ارائه — ناوبری اسلایدها، همگام‌سازی با صحنه سه‌بعدی
 * ================================================================== */
(function () {
  const S = window.SLIDES, N = S.length;
  const stage = document.getElementById('stage');
  const $ = (s) => document.querySelector(s);
  const fa = (n) => String(n).padStart(2, '0');
  let idx = -1, current = null, playTimer = null, manualNight = null, manualXray = null;

  $('#tot').textContent = fa(N);

  /* ------------ صدای کلیک ملایم (Web Audio) ------------ */
  let actx = null;
  function tick(freq = 520) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, actx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 0.5, actx.currentTime + 0.25);
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.06, actx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.35);
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.4);
    } catch (e) { }
  }

  /* ------------ ساخت DOM هر اسلاید ------------ */
  function build(i) {
    const s = S[i];
    const el = document.createElement('section');
    el.className = 'slide';

    if (s.layout === 'hero') {
      el.classList.add('hero');
      el.innerHTML = `<div class="hero-box">
        <div class="kicker">VOUCHOU</div>
        <h1>${s.b[0].v}</h1>
        <h3>${s.b[1].v}</h3>
        <div class="line"></div>
        <div class="hint">← برای ادامه کلید جهت یا دکمه بعدی را بزنید</div>
      </div>`;
      return el;
    }
    if (s.layout === 'empty') { el.classList.add('hero'); return el; }

    if (s.b.some(b => b.big)) el.classList.add('big');
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="slide-no">${fa(i + 1)} — ${fa(N)}</div>`;
    let d = 0.15;
    s.b.forEach(b => {
      let node;
      switch (b.t) {
        case 'h': node = document.createElement('h2'); node.textContent = b.v; break;
        case 'lead': node = document.createElement('div'); node.className = 'lead'; node.textContent = b.v; break;
        case 'p': node = document.createElement('p'); node.textContent = b.v; break;
        case 'li':
          node = document.createElement('div'); node.className = 'li';
          node.innerHTML = `<div><b></b> <span></span></div>`;
          node.querySelector('b').textContent = b.k; node.querySelector('span').textContent = b.v; break;
        case 'stats':
          node = document.createElement('div'); node.className = 'stats'; node.setAttribute('aria-label', b.raw);
          node.innerHTML = b.v.map(([k, v]) => `<div class="stat"><span>${k}:</span><b>${v}</b></div>`).join(''); break;
        case 'img':
          node = document.createElement('figure');
          node.className = 'img' + (b.tall ? ' tall' : '') + (b.drawing ? ' drawing' : '');
          node.innerHTML = `<img src="${b.v}" alt="" loading="eager" />`;
          node.addEventListener('click', () => openLightbox(b.v));
          node.addEventListener('mousemove', (e) => {
            const r = node.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            node.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
          });
          node.addEventListener('mouseleave', () => (node.style.transform = ''));
          break;
      }
      node.classList.add('blk');
      node.style.animationDelay = d + 's'; d += 0.12;
      card.appendChild(node);
    });
    el.appendChild(card);
    return el;
  }

  /* ------------ رفتن به اسلاید ------------ */
  function go(i, silent) {
    if (i < 0 || i >= N || i === idx) return;
    const forward = i > idx;
    idx = i;
    if (!silent) tick(forward ? 560 : 420);

    if (current) {
      const old = current; old.classList.remove('enter'); old.classList.add('leave');
      setTimeout(() => old.remove(), 650);
    }
    current = build(i);
    stage.appendChild(current);
    requestAnimationFrame(() => current.classList.add('enter'));

    const s = S[i];
    Scene3D.flyTo(s.cam, s.tgt, 2.4);
    manualNight = null; manualXray = null;
    Scene3D.setNight(s.mode === 'night');
    Scene3D.setXray(s.xray || null);
    Scene3D.setAutoOrbit(!!s.orbit);
    const hasCard = !s.layout && !document.body.classList.contains('hide-ui');
    Scene3D.setShift(hasCard ? (current.classList.contains('big') ? 0.26 : 0.22) : 0);

    $('#cur').textContent = fa(i + 1);
    $('#bar').style.width = ((i + 1) / N * 100) + '%';
    syncButtons();
    document.querySelectorAll('.thumb').forEach((t, k) => t.classList.toggle('active', k === i));
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { try { location.hash = String(i + 1); } catch (_) {} }
  }
  const next = () => go(Math.min(N - 1, idx + 1));
  const prev = () => go(Math.max(0, idx - 1));

  function syncButtons() {
    $('#nightBtn').classList.toggle('on', Scene3D.isNight());
    $('#nightBtn').textContent = Scene3D.isNight() ? '☀' : '☾';
    $('#xrayBtn').classList.toggle('on', Scene3D.isXray());
    $('#orbitBtn').classList.toggle('on', Scene3D.getAutoOrbit());
    $('#playBtn').classList.toggle('on', !!playTimer);
    $('#playBtn').textContent = playTimer ? '❚❚' : '▶';
    $('#hideBtn').classList.toggle('on', document.body.classList.contains('hide-ui'));
  }

  /* ------------ پخش خودکار ------------ */
  function togglePlay() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    else playTimer = setInterval(() => { if (idx >= N - 1) go(0); else next(); }, 9000);
    syncButtons();
  }

  /* ------------ فهرست اسلایدها ------------ */
  const gridInner = $('#grid .grid-inner');
  S.forEach((_, k) => {
    const t = document.createElement('div'); t.className = 'thumb';
    t.style.animationDelay = (k * 0.03) + 's';
    t.innerHTML = `<img src="assets/pages/slide_${fa(k + 1)}.jpg" alt="" loading="lazy"/><span>${fa(k + 1)}</span>`;
    t.addEventListener('click', () => { $('#grid').classList.remove('show'); go(k); });
    gridInner.appendChild(t);
  });
  $('#grid').addEventListener('click', (e) => { if (e.target.id === 'grid') $('#grid').classList.remove('show'); });

  /* ------------ لایت‌باکس ------------ */
  function openLightbox(src) { $('#lightbox img').src = src; $('#lightbox').classList.add('show'); }
  $('#lightbox').addEventListener('click', () => $('#lightbox').classList.remove('show'));

  /* ------------ اکشن‌ها ------------ */
  const actions = {
    next, prev, play: togglePlay,
    night() { Scene3D.setNight(!Scene3D.isNight()); syncButtons(); },
    xray() { Scene3D.setXray(Scene3D.isXray() ? null : ['box', 'top', 'right', 'tower', 'circulation']); syncButtons(); },
    orbit() { Scene3D.setAutoOrbit(!Scene3D.getAutoOrbit()); syncButtons(); },
    hide() {
      document.body.classList.toggle('hide-ui');
      const hidden = document.body.classList.contains('hide-ui');
      Scene3D.setShift(hidden || S[idx].layout ? 0 : (current.classList.contains('big') ? 0.26 : 0.22));
      syncButtons();
    },
    grid() { $('#grid').classList.toggle('show'); },
    full() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }
  };
  document.querySelectorAll('.dock button').forEach(b => b.addEventListener('click', () => { actions[b.dataset.act](); tick(700); }));

  document.addEventListener('keydown', (e) => {
    if ($('#lightbox').classList.contains('show')) { if (e.key === 'Escape') $('#lightbox').classList.remove('show'); return; }
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'PageDown' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowRight' || e.key === 'PageUp' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(N - 1);
    else if (k === 'f') actions.full();
    else if (k === 'n') actions.night();
    else if (k === 'x') actions.xray();
    else if (k === 'o') actions.orbit();
    else if (k === 'h') actions.hide();
    else if (k === 'g' || e.key === 'Escape') actions.grid();
    else if (k === 'p') actions.play();
  });

  // سوایپ لمسی (راست‌به‌چپ)
  let tx = null;
  stage.addEventListener('touchstart', (e) => (tx = e.touches[0].clientX), { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (tx === null) return; const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 60) dx > 0 ? next() : prev(); tx = null;
  });

  /* ------------ شروع ------------ */
  const startAt = Math.max(0, Math.min(N - 1, (parseInt(location.hash.slice(1)) || 1) - 1));
  $('#startBtn').addEventListener('click', () => {
    $('#loader').classList.add('hide'); tick(380);
    go(startAt, true);
  });
})();
