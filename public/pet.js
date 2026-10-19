// 화면 하단을 돌아다니는 픽셀 고양이 (시메지 스타일 데스크톱 펫)
// 걷기 · 우다다 · 앉기 · 그루밍 · 기지개 · 하품 · 잠자기 · 나비 쫓기를 오가고,
// 누르면 점프하고, 끌어서 옮기면 떨어지고, 커서가 다가가면 올려다봅니다.
(() => {
  const W = 20, H = 14;
  const COLORS = {k: '#111214', w: '#f2f2ef', g: '#a9adb3', e: '#111214', m: '#94dec6'};
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = 42, RUN_SPEED = 150, GRAVITY = 1500, JUMP = 430;
  const OFF_KEY = 'yeda-pet-off';

  /* ---------- Sprites ---------- */
  // 오른쪽을 보는 고양이를 사각형 조각으로 채우고, 외곽선은 자동으로 그린다
  const head = (x, y, face = [['e', x + 4, y + 2, 1, 2]]) => [['w', x, y, 7, 6], ['w', x + 1, y - 1], ['w', x + 5, y - 1], ['g', x + 5, y + 4], ...face];
  const legs = (a, b) => [[4, a], [6, b], [9, a], [11, b]].map(([x, h]) => ['w', x, 10, 1, h]);
  const tailA = [['w', 2, 2, 1, 4], ['w', 1, 1, 1, 2]];
  const tailB = [['w', 2, 2, 1, 4], ['w', 3, 1, 1, 2]];
  const body = ['w', 3, 5, 9, 5];
  const scarf = ['m', 9, 7, 4, 1];
  const sitBase = [['w', 2, 10, 4, 1], ['w', 5, 6, 7, 5], ['w', 9, 11, 1, 1], ['w', 11, 11, 1, 1]];
  const sitScarf = ['m', 8, 7, 4, 1];
  const closedEye = (x, y) => ['e', x, y, 2, 1];
  const dangleTop = [['w', 7, 1, 7, 5], ['w', 8, 0], ['w', 12, 0], ['e', 9, 2, 1, 2], ['e', 11, 2, 1, 2], ['g', 10, 4], ['m', 8, 6, 5, 1], ['w', 8, 7, 5, 4], ['w', 7, 7, 1, 2], ['w', 13, 7, 1, 2]];

  const FRAMES = {
    walk1: [...tailA, body, ...head(10, 2), scarf, ...legs(2, 1)],
    walk2: [...tailB, body, ...head(10, 2), scarf, ...legs(1, 2)],
    run1: [['w', 1, 4, 2, 1], ['w', 3, 5, 9, 4], ...head(10, 2), scarf, ['w', 2, 9, 1, 2], ['w', 3, 9, 1, 1], ['w', 12, 9, 1, 2], ['w', 13, 9, 1, 1]],
    run2: [['w', 1, 3, 2, 1], ['w', 3, 5, 9, 4], ...head(10, 2), scarf, ['w', 6, 9, 1, 3], ['w', 8, 9, 1, 3]],
    sit: [...sitBase, ...head(9, 2), sitScarf],
    blink: [...sitBase, ...head(9, 2, [closedEye(12, 5)]), sitScarf],
    look: [...sitBase, ...head(9, 1, [['e', 14, 2, 1, 2]]), sitScarf],
    yawn: [...sitBase, ...head(9, 2, [closedEye(12, 4), ['e', 14, 5, 1, 2], ['g', 14, 6]]), sitScarf],
    groom1: [...sitBase, ...head(9, 2, [closedEye(12, 4)]), sitScarf, ['w', 16, 5, 1, 2]],
    groom2: [...sitBase, ...head(9, 2, [closedEye(12, 4)]), sitScarf, ['w', 16, 4, 1, 2], ['g', 15, 6]],
    stretch: [['w', 2, 1, 1, 3], ['w', 3, 3, 5, 5], ['w', 7, 6, 5, 4], ...head(11, 5, [closedEye(14, 7)]), ['m', 10, 8, 1, 2], ['w', 3, 8, 1, 4], ['w', 6, 8, 1, 4], ['w', 12, 11, 5, 1]],
    sleep: [['w', 2, 9, 1, 2], ['w', 3, 7, 11, 4], ...head(11, 5, [closedEye(14, 8)]), ['m', 10, 8, 1, 3]],
    jump: [...tailB, body, ...head(10, 2), scarf, ...legs(3, 3)],
    // 목덜미를 잡혀 매달린 정면 모습: 발을 번갈아 버둥거린다
    dangle1: [...dangleTop, ['w', 8, 11, 1, 2], ['w', 12, 11, 1, 1], ['w', 10, 11, 1, 2]],
    dangle2: [...dangleTop, ['w', 8, 11, 1, 1], ['w', 12, 11, 1, 2], ['w', 10, 11, 1, 2]]
  };

  function grid(parts) {
    const g = Array.from({length: H}, () => Array(W).fill('.'));
    parts.forEach(([c, x, y, w = 1, h = 1]) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i < W) g[j][i] = c;
    });
    const filled = (x, y) => g[y]?.[x] && g[y][x] !== '.';
    return g.map((row, y) => row.map((c, x) => (c === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? 'k' : c)));
  }

  // 같은 색이 이어지는 가로 구간은 사각형 하나로 합친다
  function rects(g, colors = COLORS) {
    let out = '';
    g.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const c = row[x];
        let n = 1;
        while (x + n < row.length && row[x + n] === c) n++;
        if (c !== '.') out += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${colors[c]}"/>`;
        x += n;
      }
    });
    return out;
  }

  const art = rows => rects(rows.map(r => [...r]));
  const heartSvg = `<svg viewBox="0 0 7 6" shape-rendering="crispEdges" aria-hidden="true">${art(['.mm.mm.', 'mmmmmmm', 'mmmmmmm', '.mmmmm.', '..mmm..', '...m...'])}</svg>`;
  const butterflySvg = `<svg viewBox="0 0 7 5" shape-rendering="crispEdges" aria-hidden="true"><g class="wing l">${art(['mm.....', 'mmm....', '.mm....', 'mm.....'])}</g><g class="wing r">${art(['.....mm', '....mmm', '....mm.', '.....mm'])}</g>${art(['...k...', '...k...', '...k...', '...k...', '..k.k..'])}</svg>`;

  /* ---------- Element ---------- */

  const pet = document.createElement('button');
  pet.type = 'button';
  pet.className = 'pet';
  pet.setAttribute('aria-label', '산책 중인 픽셀 고양이 — 누르면 점프해요');
  pet.innerHTML = `<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true"><g class="pet-swing">${Object.entries(FRAMES).map(([name, parts]) => `<g data-frame="${name}">${rects(grid(parts))}</g>`).join('')}</g></svg>
    <span class="pet-zzz" aria-hidden="true"><i>z</i><i>z</i><i>z</i></span>
    <span class="pet-bubble" aria-hidden="true"></span>`;
  document.body.appendChild(pet);

  const frames = Object.fromEntries([...pet.querySelectorAll('g[data-frame]')].map(g => [g.dataset.frame, g]));
  const bubble = pet.querySelector('.pet-bubble');
  const swingG = pet.querySelector('.pet-swing');
  const footer = document.querySelector('footer');
  const aside = document.querySelector('aside');
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  let ground = 0, minX = 0, maxX = 0;
  let x = 0, y = 0, vy = 0, dir = 1;
  let state = 'walk', since = 0, until = 0, shown = null, last = performance.now();
  let drag = null, butterfly = null, nextHop = 0, enabled = true, raf = 0;
  // 매달렸을 때 흔들림: 각도(도), 각속도, 잡은 지점의 속도
  let swing = 0, swingV = 0, holdX = 0, holdV = 0;

  // 사이드바가 화면에 붙어 있으면(데스크톱) 그 오른쪽에서만 걸어 다닌다
  function measure() {
    ground = footer ? footer.offsetHeight - 1 : 0;
    pet.style.bottom = `${ground}px`;
    const docked = aside && getComputedStyle(aside).position !== 'fixed' && aside.offsetWidth;
    minX = docked ? aside.getBoundingClientRect().right + 4 : 0;
    maxX = Math.max(minX, innerWidth - pet.offsetWidth);
    x = clamp(x, minX, maxX);
  }

  function setState(next, ms = Infinity) {
    state = next;
    since = performance.now();
    until = since + ms;
    pet.dataset.state = next;
  }

  function say(text, ms = 1200) {
    bubble.textContent = text;
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.add('show');
    clearTimeout(say.timer);
    say.timer = setTimeout(() => bubble.classList.remove('show'), ms);
  }

  function pickNext() {
    if (reduceMotion) return setState('sit', 1e9);
    const r = Math.random();
    if (r < .36) {
      if (Math.random() < .35) dir = -dir;
      setState('walk', rand(4000, 10000));
    } else if (r < .46) {
      if (Math.random() < .5) dir = -dir;
      setState('run', rand(1800, 3200));
      say('!', 700);
    } else if (r < .58) setState('sit', rand(2200, 4500));
    else if (r < .70) setState('groom', rand(2400, 4000));
    else if (r < .78) setState('stretch', 1700);
    else if (r < .88) startPlay();
    else setState('yawn', 1300);
  }

  function show(name) {
    if (shown === name) return;
    if (shown) frames[shown].classList.remove('on');
    frames[name].classList.add('on');
    shown = name;
  }

  function heart() {
    const h = document.createElement('span');
    h.className = 'pet-heart';
    h.innerHTML = heartSvg;
    h.style.left = `${x + pet.offsetWidth / 2}px`;
    h.style.bottom = `${ground + y + pet.offsetHeight - 6}px`;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1200);
  }

  /* ---------- Butterfly play ---------- */

  function startPlay() {
    setState('play', rand(4500, 6500));
    butterfly = document.createElement('span');
    butterfly.className = 'pet-butterfly';
    butterfly.innerHTML = butterflySvg;
    document.body.appendChild(butterfly);
    nextHop = performance.now() + 900;
  }

  function endPlay() {
    if (!butterfly) return;
    const b = butterfly;
    butterfly = null;
    b.classList.add('leave');
    setTimeout(() => b.remove(), 900);
  }

  function moveButterfly(now) {
    if (!butterfly) return;
    const t = (now - since) / 1000;
    const bx = x + pet.offsetWidth / 2 + Math.sin(t * 1.3) * 46 * dir + 20 * dir;
    const by = ground + pet.offsetHeight + 26 + Math.sin(t * 2.4) * 14;
    butterfly.style.transform = `translate3d(${bx}px, ${-by}px, 0)`;
  }

  /* ---------- Dangle ---------- */

  // 잡은 지점을 축으로 한 진자: 끌고 가는 방향의 반대로 몸이 뒤처졌다가 대롱대롱 흔들리며 멈춘다
  function dangle(now, dt) {
    if (reduceMotion || !dt) return swingTo(0);
    const v = (x - holdX) / dt;
    holdX = x;
    const prev = holdV;
    holdV += (v - holdV) * Math.min(1, dt * 12);
    // 오른쪽으로 끌면(가속) 몸은 왼쪽으로 뒤처진다. SVG 회전은 양수가 시계 방향이라 아래쪽이 왼쪽으로 간다
    const accel = (holdV - prev) / dt;
    swingV += (-70 * swing - 3 * swingV + accel * 0.15) * dt;
    swing = clamp(swing + swingV * dt, -55, 55);
    // 가만히 들고 있어도 살랑살랑 흔들린다
    swingTo(swing + Math.sin(now / 240) * 6);
  }

  function swingTo(deg) {
    swingG.setAttribute('transform', `rotate(${deg.toFixed(2)} ${W / 2} 0)`);
  }

  /* ---------- Loop ---------- */

  function tick(now) {
    const dt = Math.min(now - last, 50) / 1000;
    last = now;
    const airborne = state !== 'drag' && (y > 0 || vy > 0);

    if (airborne) {
      vy -= GRAVITY * dt;
      y += vy * dt;
      if (y <= 0) {
        y = 0;
        vy = 0;
        if (state === 'fall') setState('sit', rand(900, 1800));
      }
    }

    if (state === 'walk' || state === 'run') {
      const speed = state === 'run' ? RUN_SPEED : SPEED;
      x += dir * speed * dt;
      if (x <= minX || x >= maxX) { x = clamp(x, minX, maxX); dir = -dir; }
      if (state === 'run') show(Math.floor(now / 90) % 2 ? 'run1' : 'run2');
      else show(Math.floor(now / 200) % 2 ? 'walk1' : 'walk2');
    } else if (state === 'sit') {
      show(now % 3600 < 160 ? 'blink' : 'sit');
    } else if (state === 'groom') {
      show(Math.floor(now / 260) % 2 ? 'groom1' : 'groom2');
    } else if (state === 'stretch') {
      show(now - since < 1300 ? 'stretch' : 'sit');
    } else if (state === 'yawn') {
      show(now - since < 900 ? 'yawn' : 'blink');
    } else if (state === 'sleep') {
      show('sleep');
    } else if (state === 'look') {
      show('look');
    } else if (state === 'play') {
      moveButterfly(now);
      if (!airborne && now > nextHop) { vy = rand(240, 330); nextHop = now + rand(700, 1200); }
      show(y > 0 ? 'jump' : 'look');
    } else if (state === 'drag') {
      show(Math.floor(now / 170) % 2 ? 'dangle1' : 'dangle2');
      dangle(now, dt);
    } else {
      show('jump');
    }

    if (now > until) {
      if (state === 'play') { endPlay(); say('…', 900); setState('sit', 1500); }
      else if (state === 'yawn') setState('sleep', rand(7000, 13000));
      else if (state === 'sleep') setState('stretch', 1700);
      else pickNext();
    }

    pet.style.transform = `translate3d(${x}px, ${-y}px, 0)`;
    pet.classList.toggle('flip', dir < 0);
    raf = requestAnimationFrame(tick);
  }

  /* ---------- Interaction ---------- */

  function poke() {
    heart();
    if (reduceMotion || state === 'drag') return;
    if (state === 'sleep' || state === 'yawn') { say('!'); vy = 320; setState('fall'); return; }
    if (state === 'play') endPlay();
    vy = JUMP;
    setState('fall');
  }

  pet.addEventListener('pointerdown', e => {
    drag = {id: e.pointerId, sx: e.clientX, sy: e.clientY, px: x, py: y, moved: false};
    try { pet.setPointerCapture(e.pointerId); } catch {}
  });

  pet.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      endPlay();
      setState('drag');
      say('?!', 900);
      swing = swingV = holdV = 0;
      holdX = x;
    }
    if (dx) dir = dx > 0 ? 1 : -1;
    x = clamp(drag.px + dx, minX, maxX);
    y = clamp(drag.py - dy, 0, innerHeight - ground - pet.offsetHeight);
  });

  const release = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    if (moved) { vy = 0; swingTo(0); setState('fall'); }
    else poke();
  };
  pet.addEventListener('pointerup', release);
  pet.addEventListener('pointercancel', release);
  pet.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); }
  });

  // 걷는 중에 커서가 가까이 오면 멈춰서 올려다본다
  addEventListener('pointermove', e => {
    if (drag || reduceMotion || state !== 'walk') return;
    const cx = x + pet.offsetWidth / 2;
    const cy = innerHeight - ground - pet.offsetHeight / 2;
    if (Math.abs(e.clientX - cx) < 110 && cy - e.clientY < 170 && cy - e.clientY > -20) {
      dir = e.clientX >= cx ? 1 : -1;
      setState('look', 1600);
      say('?', 900);
    }
  }, {passive: true});

  /* ---------- On / off ---------- */

  function setEnabled(on) {
    enabled = on;
    pet.hidden = !on;
    try { on ? localStorage.removeItem(OFF_KEY) : localStorage.setItem(OFF_KEY, '1'); } catch {}
    cancelAnimationFrame(raf);
    endPlay();
    if (on) {
      measure();
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  window.pixelPet = {setEnabled, isEnabled: () => enabled};

  addEventListener('resize', measure);
  measure();
  x = rand(minX, maxX);
  dir = Math.random() < .5 ? 1 : -1;
  pickNext();
  show('sit');
  let off = false;
  try { off = localStorage.getItem(OFF_KEY) === '1'; } catch {}
  setEnabled(!off);
})();
