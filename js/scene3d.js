/* ==================================================================
 *  صحنه سه‌بعدی مجتمع فرهنگی ووچو — Three.js r128
 *  مدل حجمی بر اساس عکس‌ها، مقاطع و دیاگرام‌های سند ساخته شده است.
 * ================================================================== */
(function () {
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 600);
  camera.position.set(60, 30, 70);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 4;
  controls.maxDistance = 120;
  controls.target.set(0, 4, 0);

  /* ---------------- بافت‌های رویه‌ای (Canvas) ---------------- */
  function rand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function stoneTexture(holes) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'); const r = rand(holes ? 7 : 3);
    g.fillStyle = '#b9a581';
    g.fillRect(0, 0, 512, 512);
    const cols = 10, rows = 12, w = 512 / cols, h = 512 / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (holes && y % 2 === 1 && x % 2 === 1) { g.clearRect(x * w + 4, y * h + 4, w - 8, h - 8); continue; } // روزنه‌های مشبک
        const t = 0.75 + r() * 0.35;
        const base = [196 * t, 170 * t, 124 * t].map(v => Math.min(255, v | 0));
        g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
        const jx = r() * 3, jy = r() * 3;
        g.fillRect(x * w + 3 + jx, y * h + 3 + jy, w - 6, h - 6);
        // تیشه‌خوردگی
        for (let k = 0; k < 14; k++) {
          g.fillStyle = `rgba(${r() > .5 ? '255,240,210' : '90,70,40'},${r() * 0.18})`;
          g.fillRect(x * w + 4 + r() * (w - 10), y * h + 4 + r() * (h - 10), 2 + r() * 6, 1 + r() * 3);
        }
        if (r() > 0.85) { g.fillStyle = 'rgba(170,80,60,0.25)'; g.fillRect(x * w + 5, y * h + 5, w - 10, h - 10); }
      }
    }
    if (holes) { // ملات بین سنگ‌ها
      g.globalCompositeOperation = 'destination-over';
      g.fillStyle = 'rgba(0,0,0,0)';
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 8;
    return tex;
  }

  function plasterTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const r = rand(11);
    g.fillStyle = '#f1efe9'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3500; i++) {
      g.fillStyle = `rgba(${r() > .5 ? 255 : 150},${r() > .5 ? 255 : 145},${r() > .5 ? 250 : 135},${r() * 0.08})`;
      g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; return t;
  }

  function groundTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'); const r = rand(21);
    g.fillStyle = '#8d8a84'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 16) for (let x = 0; x < 512; x += 16) {
      const t = 0.8 + r() * 0.3;
      g.fillStyle = `rgb(${120 * t | 0},${122 * t | 0},${128 * t | 0})`;
      g.fillRect(x + 1, y + 1, 14, 14);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.encoding = THREE.sRGBEncoding; return t;
  }

  const stoneTex = stoneTexture(false);
  const screenTex = stoneTexture(true);
  const plasterTex = plasterTexture();

  /* ---------------- متریال‌ها ---------------- */
  const M = {
    white: new THREE.MeshStandardMaterial({ color: 0xf4f2ec, map: plasterTex, roughness: 0.92 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xffffff, map: stoneTex, roughness: 0.95 }),
    screen: new THREE.MeshStandardMaterial({ color: 0xffffff, map: screenTex, roughness: 0.95, alphaTest: 0.5, side: THREE.DoubleSide, transparent: false }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1b2430, roughness: 0.15, metalness: 0.6, emissive: 0xffd9a0, emissiveIntensity: 0.0 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.5, metalness: 0.4 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x9a9fa6, roughness: 0.85 }),
    rail: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.4, metalness: 0.7 }),
    mud: new THREE.MeshStandardMaterial({ color: 0xb59a73, roughness: 1 }),
    mud2: new THREE.MeshStandardMaterial({ color: 0xc8b08a, roughness: 1 }),
    ground: new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 0.95 }),
    hill: new THREE.MeshStandardMaterial({ color: 0xa8916b, roughness: 1, flatShading: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x4d6b35, roughness: 0.9, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x5b4632, roughness: 1 }),
    door: new THREE.MeshStandardMaterial({ color: 0x2a3446, roughness: 0.6 })
  };

  const ghostMat = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, transparent: true, opacity: 0.16, roughness: 0.3, depthWrite: false });
  const ghostEdge = new THREE.LineBasicMaterial({ color: 0x6b7480, transparent: true, opacity: 0.55 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xc0121b, roughness: 0.55, emissive: 0x5a0005, emissiveIntensity: 0.35 });

  /* ---------------- ساخت بنا ---------------- */
  const building = new THREE.Group(); scene.add(building);
  const parts = [];        // { mesh, group, mat }
  const edges = [];

  function box(w, h, d, x, y, z, mat, group, opts = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    if (mat.map && opts.uv !== false) {           // تکرار بافت متناسب با ابعاد
      const uv = geo.attributes.uv; const s = opts.uvScale || 0.33;
      const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        uv.setXY(i, uv.getX(i) * dims[f][0] * s, uv.getY(i) * dims[f][1] * s);
      }
    }
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    building.add(m);
    if (group) {
      parts.push({ mesh: m, group, mat });
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), ghostEdge);
      e.position.copy(m.position); e.visible = false; building.add(e); edges.push(e);
    } else extras.push(m);
    return m;
  }
  const extras = [];

  // پنجره مربعی روی وجه (normal: 'x+','x-','z+','z-')
  function win(face, cx, cy, cz, w, h, group = 'windows') {
    const t = 0.12, f = 0.08;
    let fw = w, fd = t, gw = w - f * 2, gd = 0.02, ox = 0, oz = 0;
    if (face[0] === 'x') { fw = t; fd = w; gw = 0.02; gd = w - f * 2; ox = face[1] === '+' ? 0.02 : -0.02; }
    else { oz = face[1] === '+' ? 0.02 : -0.02; }
    box(fw, h, fd, cx + ox, cy, cz + oz, M.frame, null, { cast: false });
    const g = box(face[0] === 'x' ? 0.05 : gw, h - f * 2, face[0] === 'x' ? gd : 0.05, cx + ox * 2.5, cy, cz + oz * 2.5, M.glass, group, { cast: false });
    windows.push(g);
  }
  const windows = [];

  /* — سکوی سنگی (جداره خیابان + نانوایی/کافه) — */
  box(11.7, 3.2, 0.6, 2.15, 1.6, 5.2, M.stone, 'podium');          // جداره بلند سنگی جلو
  box(0.6, 3.2, 10, -9, 1.6, 0.5, M.stone, 'walls');              // دیوار سنگی کناری
  box(0.6, 6.5, 8, 7.7, 3.25, 0.2, M.stone, 'walls');             // دیوار سنگی بلند شرقی
  box(16.6, 0.25, 10.8, -0.6, 0.12, 0.2, M.floor, 'courtyard', { cast: false }); // کف حیاط

  // دیوار مشبک (فخر و مدین) با روزنه
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(5, 5.2), M.screen);
  screenTex.repeat.set(1.2, 1.4);
  scr.position.set(-6.2, 2.6, 5.2); scr.castShadow = true; building.add(scr);
  parts.push({ mesh: scr, group: 'walls', mat: M.screen });

  /* — پله‌های نشیمن حیاط (آمفی‌تئاتر) — */
  for (let i = 0; i < 4; i++) box(5.5 - i * 0.6, 0.45, 1.3, 1.5, 0.25 + i * 0.45, -1.2 - i * 1.3 + 3.2, M.floor, 'courtyard');

  /* — حجم برج (تراز ۳ — ۱۰ متر) — */
  box(4.2, 10, 4.6, -5.6, 5, -1.3, M.white, 'tower');
  win('z+', -5.0, 8.1, 1.0, 1.4, 1.4);
  win('z+', -6.4, 5.6, 1.0, 1.0, 1.4);
  win('x+', -3.48, 6.5, -2.5, 1.2, 1.2);
  box(1.1, 2.3, 0.1, -6.2, 1.4, 0.98, M.door, null);

  /* — حجم کنسول اصلی (کلاس‌ها، تراز ۵.۵ تا ۸.۵) — */
  box(7.4, 3.1, 5.4, 0.4, 7.05, -1.6, M.white, 'box');
  win('z+', -1.2, 7.1, 1.12, 1.4, 1.4);
  win('z+', 2.4, 7.1, 1.12, 2.4, 1.6);
  win('x+', 4.12, 7.1, -2.4, 1.2, 1.2);
  box(7.6, 0.35, 5.8, 0.4, 5.38, -1.6, M.white, 'box');          // دال کنسول

  /* — حجم شرقی (کتابخانه) — */
  box(3.6, 5.6, 5.2, 5.6, 5.9, -1.4, M.white, 'right');
  win('z+', 5.6, 6.6, 1.22, 1.6, 2.0);
  win('x+', 7.42, 5.2, -0.6, 1.1, 1.1);

  /* — مکعب بالایی (تراز بام) — */
  box(2.6, 2.2, 2.6, 0.9, 9.7, -2.6, M.white, 'top');
  win('z+', 0.9, 9.7, -1.28, 1.0, 1.0);

  /* — طبقه همکف پشت جداره (کافه / کتابفروشی) — */
  box(6.5, 3.4, 4.0, 3.5, 1.7, -2.4, M.white, 'right');
  for (let i = 0; i < 3; i++) win('z+', 1.4 + i * 2.0, 1.6, -0.38, 1.6, 2.2);

  /* — پله بیرونی مورب + جان‌پناه (Promenade) — */
  const stairLen = 9.5, rise = 5.4;
  const ang = Math.atan2(rise, stairLen);
  const st = box(Math.hypot(stairLen, rise), 0.35, 1.5, 0, 0, 0, M.white, 'circulation');
  st.rotation.z = ang; st.position.set(-3.2 + stairLen / 2 - 4.7, rise / 2 + 0.1, 4.2);
  edges[edges.length - 1].rotation.z = ang; edges[edges.length - 1].position.copy(st.position);
  const pp = box(Math.hypot(stairLen, rise), 1.0, 0.18, 0, 0, 0, M.white, 'circulation');
  pp.rotation.z = ang; pp.position.set(st.position.x, st.position.y + 0.6, 4.95);
  edges[edges.length - 1].rotation.z = ang; edges[edges.length - 1].position.copy(pp.position);

  // پاگرد / راهروی تراز ۲ و تراس بام
  box(9.6, 0.3, 1.6, 0.6, 5.5, 2.15, M.white, 'circulation');
  box(4.2, 0.3, 1.4, 5.6, 8.85, 2.0, M.white, 'circulation');
  // نرده‌ها
  for (const [x0, x1, y, z] of [[-4.2, 5.4, 6.1, 2.9], [3.6, 7.6, 9.45, 2.65], [-2.9, 3.9, 9.05, 1.2]]) {
    box(x1 - x0, 0.06, 0.06, (x0 + x1) / 2, y + 0.5, z, M.rail, null, { cast: false });
    for (let x = x0; x <= x1; x += 0.5) box(0.03, 1.0, 0.03, x, y, z, M.rail, null, { cast: false });
  }

  /* — درختان حیاط و پیاده‌رو — */
  function tree(x, z, s = 1) {
    const g = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.1 * s, 2.2 * s, 6), M.trunk);
    tr.position.y = 1.1 * s; g.add(tr);
    for (let i = 0; i < 4; i++) {
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry((0.55 + Math.random() * 0.35) * s, 0), M.leaf);
      l.position.set((Math.random() - .5) * 0.9 * s, (2.1 + Math.random() * 0.9) * s, (Math.random() - .5) * 0.9 * s);
      l.castShadow = true; g.add(l);
    }
    tr.castShadow = true; g.position.set(x, 0, z); building.add(g); trees.push(g); return g;
  }
  const trees = [];
  tree(-2.5, 0.6, 1.1); tree(4.6, 4.2, 0.9); tree(-8.2, 7.5, 1.2); tree(9.5, 7.2, 1.3);

  /* ---------------- بستر: خیابان شیب‌دار و محله لبنان ---------------- */
  const env = new THREE.Group(); scene.add(env);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), M.ground);
  street.rotation.x = -Math.PI / 2; street.position.y = -0.02; street.receiveShadow = true; env.add(street);

  // خانه‌های خشتی خردپایه روی تپه‌های پلکانی
  const rh = rand(99);
  for (let i = 0; i < 170; i++) {
    const a = rh() * Math.PI * 2, d = 27 + rh() * 55;
    const x = Math.cos(a) * d, z = Math.sin(a) * d - 14;
    if (z > 6 && Math.abs(x) < 50) continue;               // خیابان جلوی بنا خالی بماند
    const lift = Math.max(0, (-z - 12) * 0.2);               // شیب کوهپایه
    const w = 3 + rh() * 4, h = 2.2 + rh() * 2.4, dd = 3 + rh() * 4;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h + lift, dd), rh() > .5 ? M.mud : M.mud2);
    m.position.set(x, (h + lift) / 2, z); m.rotation.y = (rh() - .5) * 0.3;
    m.castShadow = m.receiveShadow = true; env.add(m);
  }
  // کوه‌های زاگرس در افق
  for (let i = 0; i < 9; i++) {
    const g = new THREE.ConeGeometry(30 + rh() * 30, 18 + rh() * 22, 5 + (i % 3));
    const m = new THREE.Mesh(g, M.hill);
    m.position.set(-140 + i * 36, 6, -150 - rh() * 40); env.add(m);
  }

  // تیر برق‌ها
  for (const [x, z] of [[-14, 9], [9, 12]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9, 6), M.frame);
    p.position.set(x, 4.5, z); p.castShadow = true; env.add(p);
  }

  /* ---------------- نورپردازی روز و شب ---------------- */
  const hemi = new THREE.HemisphereLight(0xdfeeff, 0x8a7458, 0.65); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.0);
  sun.position.set(25, 40, 22); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // چراغ‌های شبانه: نورهای رو به بالای جداره سنگی و پنجره‌ها
  const nightLights = [];
  for (const [x, y, z, c, i] of [[-3, 0.3, 6.2, 0xffc27a, 3.5], [1.5, 0.3, 6.2, 0xffc27a, 3.5], [6, 0.3, 6.2, 0xffc27a, 3.5], [-6, 0.6, 6.6, 0xffb070, 3], [2, 5, 3, 0xfff0d0, 3], [-5, 9, 2.5, 0xffe2b0, 2.5]]) {
    const L = new THREE.PointLight(c, 0, 7, 2); L.position.set(x, y, z); scene.add(L); nightLights.push({ L, i });
  }

  // آسمان (گرادیان شیدری) + ستاره‌ها
  const skyU = { top: { value: new THREE.Color(0x6fa8dc) }, bot: { value: new THREE.Color(0xe9eef2) } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(bot,top,h),1.0);}'
  }));
  scene.add(sky);
  const starGeo = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 1500; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 + 0.08, r = 350;
    sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, transparent: true, opacity: 0 }));
  scene.add(stars);

  // ذرات معلق (گردوغبار طلایی)
  const dustGeo = new THREE.BufferGeometry(); const dp = [];
  for (let i = 0; i < 400; i++) dp.push((Math.random() - .5) * 40, Math.random() * 16, (Math.random() - .5) * 30);
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffd9a0, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  scene.fog = new THREE.Fog(0xe9eef2, 70, 260);

  /* ---------------- حالت‌ها ---------------- */
  const state = { night: 0, nightTarget: 0, xray: null, cycleIdx: 0, cycleT: 0, autoOrbit: false, shift: 0, shiftTarget: 0, shiftDirty: true };
  const C = (h) => new THREE.Color(h);
  const DAY = { top: C(0x5d9bd6), bot: C(0xf0e6d6), fog: C(0xf0e6d6), hemi: 0.55, sun: 1.55, exp: 0.88 };
  const NIGHT = { top: C(0x02040c), bot: C(0x1a2340), fog: C(0x0b1022), hemi: 0.1, sun: 0.12, exp: 1.0 };

  function applyLighting(t) {
    skyU.top.value.copy(DAY.top).lerp(NIGHT.top, t);
    skyU.bot.value.copy(DAY.bot).lerp(NIGHT.bot, t);
    scene.fog.color.copy(DAY.fog).lerp(NIGHT.fog, t);
    hemi.intensity = DAY.hemi + (NIGHT.hemi - DAY.hemi) * t;
    sun.intensity = DAY.sun + (NIGHT.sun - DAY.sun) * t;
    sun.color.setHex(t > 0.5 ? 0x9fb4ff : 0xfff1d6);
    renderer.toneMappingExposure = DAY.exp + (NIGHT.exp - DAY.exp) * t;
    M.glass.emissiveIntensity = t * 1.6;
    stars.material.opacity = t;
    nightLights.forEach(o => (o.L.intensity = o.i * t));
  }

  function setXray(groups) {
    state.xray = groups;
    const on = !!groups;
    parts.forEach((p, i) => {
      if (!on) { p.mesh.material = p.mat; p.mesh.castShadow = true; return; }
      const hit = groups.includes(p.group);
      p.mesh.material = hit ? redMat : ghostMat;
      p.mesh.castShadow = hit;
    });
    edges.forEach(e => (e.visible = on));
    extras.forEach(e => (e.visible = !on));
    trees.forEach(t => (t.visible = !on));
    env.visible = !on;
    dust.visible = !on;
  }

  const CYCLE = [['windows'], ['right'], ['tower'], ['walls', 'podium'], ['top'], ['circulation'], ['box', 'top', 'right']];

  /* ---------------- انتقال سینمایی دوربین ---------------- */
  let tween = null;
  function flyTo(pos, tgt, dur = 2.2) {
    tween = {
      p0: camera.position.clone(), t0: controls.target.clone(),
      p1: new THREE.Vector3(...pos), t1: new THREE.Vector3(...tgt),
      start: performance.now(), dur: dur * 1000
    };
    // متناسب با نسبت صفحه (موبایل) کمی عقب‌تر
    if (window.innerWidth < window.innerHeight) {
      const dir = tween.p1.clone().sub(tween.t1).multiplyScalar(1.45);
      tween.p1.copy(tween.t1).add(dir);
    }
  }
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------------- حلقه رندر ---------------- */
  const clock = new THREE.Clock();
  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    if (tween) {
      const k = Math.min(1, (performance.now() - tween.start) / tween.dur), e = ease(k);
      camera.position.lerpVectors(tween.p0, tween.p1, e);
      // قوس ملایم در مسیر
      camera.position.y += Math.sin(e * Math.PI) * 3;
      controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (k >= 1) tween = null;
    }

    controls.autoRotate = state.autoOrbit && !tween;
    controls.autoRotateSpeed = 0.6;

    // جابه‌جایی کادر تا مدل در کنار کارت متن قرار گیرد
    const wantShift = window.innerWidth > 860 ? state.shiftTarget : 0;
    if (Math.abs(state.shift - wantShift) > 0.0005 || state.shiftDirty) {
      state.shift += (wantShift - state.shift) * Math.min(1, dt * 2.5);
      const W = window.innerWidth, H = window.innerHeight;
      camera.setViewOffset(W, H, W * state.shift, 0, W, H);
      state.shiftDirty = false;
    }

    if (Math.abs(state.night - state.nightTarget) > 0.001) {
      state.night += (state.nightTarget - state.night) * Math.min(1, dt * 2.2);
      applyLighting(state.night);
    }

    if (state.xray === 'cycle' || state.cycling) {
      state.cycleT += dt;
      if (state.cycleT > 1.8) { state.cycleT = 0; state.cycleIdx = (state.cycleIdx + 1) % CYCLE.length; setXray(CYCLE[state.cycleIdx]); }
    }

    // تپش ملایم رنگ قرمز دیاگرام
    redMat.emissiveIntensity = 0.3 + Math.sin(time * 2.4) * 0.12;

    const pos = dust.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 0.25; if (y > 16) y = 0; pos.setY(i, y);
    }
    pos.needsUpdate = true;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    state.shiftDirty = true;
  });

  applyLighting(0);
  loop();

  /* ---------------- API عمومی ---------------- */
  window.Scene3D = {
    flyTo,
    setNight(on) { state.nightTarget = on ? 1 : 0; },
    isNight() { return state.nightTarget === 1; },
    setXray(g) {
      state.cycling = g === 'cycle';
      if (g === 'cycle') { state.cycleIdx = 0; state.cycleT = 0; setXray(CYCLE[0]); }
      else setXray(g || null);
    },
    isXray() { return !!state.xray; },
    setAutoOrbit(v) { state.autoOrbit = v; },
    setShift(v) { state.shiftTarget = v; },
    getAutoOrbit() { return state.autoOrbit; }
  };
})();
