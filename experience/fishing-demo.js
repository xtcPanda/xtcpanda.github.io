const WIDTH = 960, HEIGHT = 600, SURFACE = 105, BOTTOM = 513, ROUND = 35;
const INK = '#181b23', BLUE = '#325fe8', PEACH = '#edc4b2', PAPER = '#f7f5f0';
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const clone = (state) => JSON.parse(JSON.stringify(state));
const langOf = (value) => String(value).startsWith('ar') ? 'ar' : 'en';
const COPY = {
  en: {
    eyebrow: 'NEW PORTFOLIO MINI-GAME', title: 'A little fishing break.',
    intro: 'An original browser game, inspired by the two-button arcade cabinet. Aim, drop the hook and see what bites.',
    screen: 'OFFICE TIDE', score: 'Score', time: 'Time left', seconds: 'seconds', start: 'Start round', drop: 'Drop hook',
    restart: 'New round', busy: 'Hook returning…', pause: 'Pause', resume: 'Resume', motion: 'Less decorative motion',
    aim: 'Hook position', help: 'Move the aim slider, or focus the sea and use ← / →. Space or Enter starts the round or drops the hook. One hook at a time.',
    notice: 'A new portfolio mini-game. Original illustrations and rules; no arcade game assets, ticket payouts or audio.',
    ready: 'Four depths. One hook. You have 35 seconds.', cast: 'Hook dropped.', missed: 'No bite. Try another depth.',
    caught: 'Caught! +', ended: 'Round finished. Final score: ', paused: 'Round paused.', visibility: 'Paused while this game is out of view.',
    sea: 'Fishing game: four fish depths, worth 10, 20, 30 and 40 points. Use the controls below to play.',
    legend: 'Deeper fish score more.', hook: 'Hook ready.', fish: 'fish caught',
  },
  ar: {
    eyebrow: 'لعبة صغيرة جديدة للبورتفوليو', title: 'استراحة صيد صغيرة.',
    intro: 'لعبة متصفح أصلية، مستوحاة من ماكينة الأركيد اللي بزرّارين. صوّب، نزّل السنّارة، وشوف مين هيعضّ.',
    screen: 'استراحة صيد', score: 'النقط', time: 'الوقت الباقي', seconds: 'ثانية', start: 'ابدأ الجولة', drop: 'نزّل السنّارة',
    restart: 'جولة جديدة', busy: 'السنّارة بترجع…', pause: 'وقّف شوية', resume: 'كمّل', motion: 'قلّل الحركة الزخرفية',
    aim: 'مكان السنّارة', help: 'حرّك مؤشر التصويب، أو اختار البحر واستخدم ← / →. Space أو Enter بيبدأ الجولة أو بينزّل السنّارة. سنّارة واحدة كل مرة.',
    notice: 'لعبة جديدة للبورتفوليو، برسومات وقواعد أصلية. من غير صور اللعبة الأصلية أو تذاكر جوايز أو صوت.',
    ready: 'أربع مستويات. سنّارة واحدة. معاك ٣٥ ثانية.', cast: 'السنّارة نزلت.', missed: 'ولا سمكة. جرّب تاني.',
    caught: 'اصطدت! +', ended: 'الجولة خلصت. مجموع النقط: ', paused: 'الجولة متوقّفة.', visibility: 'اللعبة متوقّفة طول ما هي مش ظاهرة.',
    sea: 'لعبة صيد: أربع مستويات سمك، بـ١٠ و٢٠ و٣٠ و٤٠ نقطة. استخدم الأزرار اللي تحت عشان تلعب.',
    legend: 'السمك الأعمق بيدّي نقط أكتر.', hook: 'السنّارة جاهزة.', fish: 'سمكة اتصادت',
  },
};

// Pure simulation. Rendering and elapsed wall time do not affect scoring.
export function createFishingState(seed = 7) {
  let randomSeed = (seed >>> 0) || 7;
  const random = () => { randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0; return randomSeed / 4294967296; };
  const fish = Array.from({ length: 12 }, (_, i) => {
    const depth = Math.floor(i / 3), direction = i % 2 ? -1 : 1;
    return {
      id: i, depth, x: 110 + (i % 3) * 290 + random() * 75, y: 175 + depth * 92,
      vx: direction * (37 + depth * 10 + random() * 22), size: 30 - depth * 2,
      points: (depth + 1) * 10, cooldown: 0, phase: random() * Math.PI * 2,
    };
  });
  return { version: 1, phase: 'ready', remaining: ROUND, score: 0, caught: 0, aim: WIDTH / 2,
    hook: { phase: 'idle', x: WIDTH / 2, y: SURFACE, fishId: null }, fish, elapsed: 0, reducedMotion: false, paused: false };
}

export function castFishingHook(state) {
  if (state.phase !== 'playing' || state.paused || state.hook.phase !== 'idle') return false;
  state.hook = { phase: 'dropping', x: clamp(state.aim, 50, WIDTH - 50), y: SURFACE, fishId: null };
  return true;
}

export function advanceFishing(state, seconds) {
  const events = [];
  if (state.phase !== 'playing' || state.paused || !Number.isFinite(seconds) || seconds <= 0) return events;
  let remainingDelta = Math.min(seconds, 2);
  while (remainingDelta > 0 && state.phase === 'playing') {
    const dt = Math.min(remainingDelta, .025, state.remaining); remainingDelta -= dt;
    state.remaining = Math.max(0, state.remaining - dt); state.elapsed += dt;
    for (const fish of state.fish) {
      if (fish.cooldown > 0) { fish.cooldown = Math.max(0, fish.cooldown - dt); continue; }
      if (state.hook.fishId === fish.id && state.hook.phase === 'returning') continue;
      fish.x += fish.vx * dt;
      if (fish.x > WIDTH + fish.size + 20) fish.x = -fish.size - 20;
      if (fish.x < -fish.size - 20) fish.x = WIDTH + fish.size + 20;
    }
    const hook = state.hook;
    if (hook.phase === 'idle') hook.x = clamp(state.aim, 50, WIDTH - 50);
    if (hook.phase === 'dropping') {
      hook.y = Math.min(BOTTOM, hook.y + 300 * dt);
      // Small fixed substeps avoid passing through a fish during a slow frame.
      const hit = state.fish.find((fish) => fish.cooldown <= 0 &&
        ((hook.x - fish.x) / (fish.size + 5)) ** 2 + ((hook.y - fish.y) / (fish.size * .56 + 6)) ** 2 <= 1);
      if (hit) {
        state.score += hit.points; state.caught++; hook.fishId = hit.id; hook.phase = 'returning';
        events.push({ type: 'catch', points: hit.points, depth: hit.depth });
      } else if (hook.y >= BOTTOM) { hook.phase = 'returning'; events.push({ type: 'miss' }); }
    } else if (hook.phase === 'returning') {
      hook.y = Math.max(SURFACE, hook.y - 435 * dt);
      if (hook.y <= SURFACE) {
        const caught = state.fish.find((fish) => fish.id === hook.fishId);
        if (caught) { caught.cooldown = 1.5; caught.x = caught.vx > 0 ? -caught.size - 15 : WIDTH + caught.size + 15; }
        hook.phase = 'idle'; hook.fishId = null; events.push({ type: 'ready' });
      }
    }
    if (state.remaining <= 0) {
      state.phase = 'ended'; state.hook = { phase: 'idle', x: state.aim, y: SURFACE, fishId: null };
      events.push({ type: 'end', score: state.score });
    }
  }
  return events;
}

function restoreFishing(saved) {
  const base = createFishingState();
  if (!saved || saved.version !== 1 || !['ready', 'playing', 'ended'].includes(saved.phase)) return base;
  if (!Array.isArray(saved.fish) || saved.fish.length !== 12 || saved.fish.some((f, i) => !f || f.id !== i ||
    !['x', 'y', 'vx', 'size', 'points', 'cooldown', 'phase'].every((key) => Number.isFinite(f[key])))) return base;
  const hook = saved.hook;
  if (!hook || !['idle', 'dropping', 'returning'].includes(hook.phase) || !Number.isFinite(hook.x) || !Number.isFinite(hook.y)) return base;
  return { ...base, ...clone(saved), remaining: clamp(Number(saved.remaining) || 0, 0, ROUND),
    score: Math.max(0, Number(saved.score) || 0), caught: Math.max(0, Number(saved.caught) || 0),
    aim: clamp(Number(saved.aim) || WIDTH / 2, 50, WIDTH - 50), paused: Boolean(saved.paused), reducedMotion: Boolean(saved.reducedMotion) };
}

export function mountFishingDemo(host, { lang = 'en', state: saved, onStateChange = () => {} } = {}) {
  if (!host?.ownerDocument) throw new TypeError('Fishing needs a host element.');
  const doc = host.ownerDocument, view = doc.defaultView, controller = new view.AbortController();
  const options = { signal: controller.signal };
  let language = langOf(lang), state = restoreFishing(saved), frame = 0, lastTime = null, destroyed = false, active = true, inView = !view.IntersectionObserver;
  let lastSecond = -1, lastMessage = state.phase === 'ended' ? 'ended' : state.paused ? 'paused' : state.phase === 'playing' ? 'hook' : 'ready', lastPoints = 0;
  if (!saved) state.reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = doc.createElement('section'); root.className = 'fd';
  root.innerHTML = `
    <header class="fd__intro"><span class="fd__eyebrow" data-copy="eyebrow"></span><h2 data-copy="title"></h2><p data-copy="intro"></p></header>
    <div class="fd__cabinet">
      <div class="fd__screen"><div class="fd__hud"><strong data-copy="screen"></strong><div><span data-copy="score"></span> <output data-score>0</output></div><div><span data-copy="time"></span> <output data-time>35</output></div></div>
        <canvas class="fd__sea" width="960" height="600" tabindex="0" role="img"></canvas>
        <div class="fd__depths" aria-hidden="true"><span>10</span><span>20</span><span>30</span><span>40</span></div>
        <div class="fd__overlay" hidden><strong></strong><span></span></div>
      </div>
      <div class="fd__aim"><label data-copy="aim"></label><input type="range" min="50" max="910" step="10"><span aria-hidden="true">↔</span></div>
      <div class="fd__controls"><button type="button" class="fd__star-button" data-action="drop"><span aria-hidden="true" class="fd__star">✦</span><b></b><small>01</small></button><button type="button" class="fd__star-button fd__star-button--restart" data-action="restart"><span aria-hidden="true" class="fd__star">✦</span><b data-copy="restart"></b><small>02</small></button></div>
    </div>
    <div class="fd__settings"><button type="button" data-action="pause"></button><label><input type="checkbox" data-motion><span data-copy="motion"></span></label><span data-copy="legend"></span></div>
    <p class="fd__help" data-copy="help"></p><p class="fd__status" role="status" aria-live="polite" aria-atomic="true"></p><p class="fd__notice" data-copy="notice"></p>`;
  host.append(root);
  const q = (selector) => root.querySelector(selector);
  const canvas = q('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) { root.remove(); throw new Error('Canvas 2D is unavailable.'); }
  const drop = q('[data-action=drop]'), aim = q('input[type=range]'), pause = q('[data-action=pause]');
  const uid = `fd-help-${Math.random().toString(36).slice(2, 9)}`;
  q('.fd__help').id = uid; canvas.setAttribute('aria-describedby', uid);
  q('.fd__aim label').append(aim); // A wrapping label avoids cross-instance ID collisions.
  const getState = () => clone({ ...state, lang: language });
  const notify = () => { if (!destroyed) onStateChange(getState()); };
  function message(key, points = 0) {
    lastMessage = key; lastPoints = points;
    q('.fd__status').textContent = COPY[language][key] + (key === 'caught' ? points : key === 'ended' ? state.score : '');
  }
  function numbers(number) { return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en').format(number); }
  function updateHUD() {
    q('[data-score]').textContent = numbers(state.score);
    q('[data-time]').textContent = numbers(Math.ceil(state.remaining));
    q('[data-time]').setAttribute('aria-label', `${numbers(Math.ceil(state.remaining))} ${COPY[language].seconds}`);
    drop.querySelector('b').textContent = COPY[language][state.phase !== 'playing' ? 'start' : state.hook.phase === 'idle' ? 'drop' : 'busy'];
    drop.disabled = state.phase === 'playing' && (state.paused || state.hook.phase !== 'idle');
    pause.disabled = state.phase !== 'playing'; pause.textContent = COPY[language][state.paused ? 'resume' : 'pause'];
    pause.setAttribute('aria-pressed', String(state.paused));
    aim.value = state.aim; aim.setAttribute('aria-label', COPY[language].aim);
    aim.disabled = state.phase === 'playing' && state.paused;
    const overlay = q('.fd__overlay'); overlay.hidden = state.phase === 'playing' && !state.paused;
    overlay.querySelector('strong').textContent = state.phase === 'ended' ? `${COPY[language].score}: ${numbers(state.score)}` : state.paused ? COPY[language].paused : COPY[language].screen;
    overlay.querySelector('span').textContent = state.phase === 'ended' ? `${numbers(state.caught)} ${COPY[language].fish}` : state.paused ? COPY[language].resume : COPY[language].ready;
  }
  function localise() {
    root.lang = language === 'ar' ? 'ar-EG' : 'en'; root.dir = language === 'ar' ? 'rtl' : 'ltr';
    for (const node of root.querySelectorAll('[data-copy]')) node.textContent = COPY[language][node.dataset.copy];
    // Keep the wrapped range after replacing the label copy.
    q('.fd__aim label').append(aim);
    canvas.setAttribute('aria-label', COPY[language].sea);
    q('[data-motion]').checked = state.reducedMotion;
    [...root.querySelectorAll('.fd__depths span')].forEach((el,i)=>{el.textContent=numbers((i+1)*10);});
    updateHUD(); message(lastMessage, lastPoints); paint();
  }
  function roundedRect(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function drawFish(fish, caught = false) {
    if (fish.cooldown > 0) return;
    const x = caught ? state.hook.x : fish.x, y = caught ? state.hook.y + 10 : fish.y;
    const direction = fish.vx > 0 ? 1 : -1;
    ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1); ctx.lineWidth = 2.5;
    const s = fish.size, bodyColour = fish.depth % 2 ? PEACH : PAPER;
    ctx.fillStyle = bodyColour; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(-s + 5, 0); ctx.lineTo(-s - 19, -s * .5); ctx.quadraticCurveTo(-s - 13, 0, -s - 19, s * .5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * .57, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BLUE; ctx.beginPath(); ctx.moveTo(-8, -s * .5); ctx.lineTo(-1, -s * .89); ctx.lineTo(12, -s * .5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, 1); ctx.quadraticCurveTo(2, 13, 11, 6); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(s * .53, -4, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * .43, 7); ctx.quadraticCurveTo(s * .75, 9, s * .86, 4); ctx.stroke();
    if (fish.depth > 1) { ctx.strokeStyle = BLUE; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-16 + i * 8, -7); ctx.lineTo(-19 + i * 8, 3); ctx.stroke(); } }
    ctx.restore();
  }
  function paint() {
    if (destroyed) return;
    const sx = canvas.width / WIDTH, sy = canvas.height / HEIGHT; ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#d7e2ed'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let depth = 0; depth < 4; depth++) {
      ctx.fillStyle = ['#d7e2ed', '#bbcddd', '#91adc8', '#6b8daa'][depth]; ctx.fillRect(0, 135 + depth * 92, WIDTH, 92);
      ctx.strokeStyle = '#f7f5f04a'; ctx.setLineDash([3, 12]); ctx.beginPath(); ctx.moveTo(35, 135 + depth * 92); ctx.lineTo(WIDTH - 35, 135 + depth * 92); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, WIDTH, SURFACE - 4);
    ctx.strokeStyle = BLUE; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 8) {
      const y = SURFACE + Math.sin(x / 30 + (state.reducedMotion ? 0 : state.elapsed * .5)) * 3;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // A small original wooden platform and reel sits above the drop position.
    const aimX = state.hook.phase === 'idle' ? state.aim : state.hook.x;
    roundedRect(aimX - 44, 78, 88, 17, 4, PEACH, INK);
    ctx.fillStyle = BLUE; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.arc(aimX, 67, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = PAPER; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(aimX, 67, 6, 0, Math.PI * 2); ctx.stroke();
    if (!state.reducedMotion) {
      ctx.strokeStyle = '#f7f5f073'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 15; i++) { const x = 55 + i * 63, y = 520 - ((state.elapsed * 14 + i * 73) % 350); ctx.beginPath(); ctx.arc(x, y, 2 + i % 4, 0, Math.PI * 2); ctx.stroke(); }
    }
    for (const fish of state.fish) if (fish.id !== state.hook.fishId) drawFish(fish);
    const hooked = state.fish.find((fish) => fish.id === state.hook.fishId); if (hooked) drawFish(hooked, true);
    const hookX = state.hook.phase === 'idle' ? state.aim : state.hook.x, hookY = state.hook.y;
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hookX, 81); ctx.lineTo(hookX, hookY); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hookX, hookY); ctx.lineTo(hookX, hookY + 11); ctx.arc(hookX - 5, hookY + 11, 5, 0, Math.PI); ctx.lineTo(hookX - 10, hookY + 4); ctx.stroke();
    ctx.fillStyle = '#c3b1a1'; ctx.beginPath(); ctx.moveTo(0, 535); ctx.bezierCurveTo(270, 500, 565, 570, WIDTH, 530); ctx.lineTo(WIDTH, HEIGHT); ctx.lineTo(0, HEIGHT); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#355a71'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const x of [100, 140, 760, 825, 855]) { ctx.beginPath(); ctx.moveTo(x, 553); ctx.quadraticCurveTo(x - 13, 525, x + 4, 503); ctx.stroke(); }
    ctx.fillStyle = PEACH; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (const [x, y, r] of [[265, 560, 17], [610, 570, 12]]) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r * .45 : r; const px = x + Math.cos(a) * radius, py = y + Math.sin(a) * radius; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  function resize() {
    const ratio = Math.min(view.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round((canvas.clientWidth || WIDTH) * ratio));
    canvas.width = width; canvas.height = Math.round(width * HEIGHT / WIDTH); paint();
  }
  const canRun = () => active && inView && !doc.hidden;
  function tick(time) {
    frame = 0;
    if (destroyed || state.phase !== 'playing' || state.paused || !canRun()) { lastTime = null; return; }
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 2); lastTime = time;
    const events = advanceFishing(state, dt);
    for (const event of events) {
      if (event.type === 'catch') message('caught', event.points);
      if (event.type === 'miss') message('missed');
      if (event.type === 'end') message('ended');
    }
    updateHUD(); paint();
    const second = Math.ceil(state.remaining);
    if (events.length || second !== lastSecond) { lastSecond = second; notify(); }
    if (state.phase === 'playing') frame = view.requestAnimationFrame(tick);
  }
  function run() {
    if (frame || destroyed || !canRun() || state.paused || state.phase !== 'playing') return;
    lastTime = null; frame = view.requestAnimationFrame(tick);
  }
  function stop() { view.cancelAnimationFrame(frame); frame = 0; lastTime = null; }
  function start() {
    stop(); const reducedMotion = state.reducedMotion, aimX = state.aim;
    state = createFishingState(7); state.phase = 'playing'; state.reducedMotion = reducedMotion; state.aim = aimX;
    lastSecond = -1; message('hook'); updateHUD(); paint(); notify(); run();
  }
  function action() {
    if (state.phase !== 'playing') { start(); return; }
    if (castFishingHook(state)) { message('cast'); updateHUD(); paint(); notify(); run(); }
  }
  function reset() {
    stop(); const reducedMotion = state.reducedMotion; state = createFishingState(); state.reducedMotion = reducedMotion;
    message('ready'); updateHUD(); paint(); notify();
  }
  root.addEventListener('click', (event) => {
    const actionName = event.target.closest('[data-action]')?.dataset.action;
    if (actionName === 'drop') action();
    if (actionName === 'restart') start();
    if (actionName === 'pause' && state.phase === 'playing') {
      state.paused = !state.paused; if (state.paused) { stop(); message('paused'); } else { message('hook'); run(); }
      updateHUD(); paint(); notify();
    }
  }, options);
  aim.addEventListener('input', () => { state.aim = Number(aim.value); paint(); notify(); }, options);
  q('[data-motion]').addEventListener('change', (event) => { state.reducedMotion = event.target.checked; paint(); notify(); }, options);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) action(); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); state.aim = clamp(state.aim + (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 60 : 20), 50, WIDTH - 50); updateHUD(); paint(); notify(); }
  }, options);
  function syncVisibility() {
    if (!canRun()) { stop(); if (state.phase === 'playing') message('visibility'); }
    else { if (lastMessage === 'visibility') message(state.paused ? 'paused' : 'hook'); run(); }
    notify();
  }
  doc.addEventListener('visibilitychange', syncVisibility, options);
  const visibilityObserver = view.IntersectionObserver ? new view.IntersectionObserver(entries => {
    if (destroyed) return;
    inView = entries[0]?.isIntersecting === true;
    syncVisibility();
  }, {threshold: .01}) : null;
  visibilityObserver?.observe(canvas);
  const resizeObserver = new view.ResizeObserver(resize); resizeObserver.observe(canvas);
  localise(); resize(); if (state.phase === 'playing') run();
  return {
    setLanguage(next) { language = langOf(next); localise(); notify(); },
    setActive(value) { active = Boolean(value); syncVisibility(); }, getState, reset,
    destroy() { if (destroyed) return; stop(); onStateChange(getState()); destroyed = true; controller.abort(); resizeObserver.disconnect(); visibilityObserver?.disconnect(); root.remove(); },
  };
}
