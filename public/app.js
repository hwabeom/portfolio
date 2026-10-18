const pages = [['overview', 'overview.tsx', 'TS'], ['projects', 'projects.py', 'PY'], ['about', 'about.md', 'MD'], ['experience', 'experience.json', '{}'], ['awards', 'awards.json', '{}'], ['blog', 'blog.md', 'MD'], ['contact', 'contact.ts', 'TS']];
const NAME = '예다은';
const GITHUB = 'https://github.com/hwabeom';
const EMAIL = 'yeda0311@gmail.com';
// 같은 서버(server/)의 API. 정적 호스팅이나 file:// 로 열면 연결에 실패하고 읽기 전용으로 동작한다
const API = '/api';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const splitTags = value => (Array.isArray(value) ? value : String(value ?? '').split(',')).map(t => t.trim()).filter(Boolean);
const tags = value => splitTags(value).map(t => `<span class="tag">${esc(t)}</span>`).join('');
const findProject = id => DATA.projects.find(p => p.id === id);
const external = (url, label, cls = 'button') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;

async function api(path, {method = 'GET', body} = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? {'Content-Type': 'application/json'} : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(json?.error || `HTTP ${res.status}`), {status: res.status, fromServer: Boolean(json?.error)});
  return json;
}

function period(s) {
  return s.split(' → ').map(v => {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? esc(v) : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  }).join(' — ');
}

// "2026"처럼 연도만 있는 기록은 그 해의 맨 위에 오도록 정렬
const dateKey = d => (/^\d{4}$/.test(d) ? `${d}/99` : d);
const byDateDesc = (a, b) => dateKey(b['날짜']).localeCompare(dateKey(a['날짜']));
const formatDate = d => d.replaceAll('/', '.');

function title(label, heading, copy) {
  return `<p class="eyebrow reveal">// ${label}</p><h1 class="reveal">${heading}</h1>${copy ? `<p class="lead reveal">${copy}</p>` : ''}`;
}

/* ---------- Cards ---------- */

function projectVisual(p, i) {
  if (p.thumb) return `<div class="thumb"><img src="${esc(p.thumb)}" alt="" loading="lazy"></div>`;
  return `<div class="project-art ${p.color}"><span class="art-label">PROJECT / ${String(i + 1).padStart(2, '0')}</span><strong>${esc(p.name)}</strong><i class="shape s1"></i><i class="shape s2"></i></div>`;
}

function projectCard(p) {
  const i = DATA.projects.indexOf(p);
  const badges = [
    p.award ? '<span class="badge award">★ 수상</span>' : '',
    p.slides ? `<span class="badge">▶ 발표 자료 ${p.slides.length}p</span>` : ''
  ].join('');
  return `<article class="card project-card reveal" data-project="${p.id}" tabindex="0" role="button" aria-label="${esc(p.title)} 상세 보기">
    <div class="visual">${projectVisual(p, i)}<div class="badges">${badges}</div><span class="open-hint">자세히 보기 →</span></div>
    <div class="card-body">
      <p class="note mono">${esc(p.period)}</p>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.summary)}</p>
      <div class="tags">${tags(p.keywords)}</div>
    </div>
  </article>`;
}

/* ---------- Pages ---------- */

function overview() {
  const awardCount = DATA.awards.filter(a => a['분류'] === '수상').length;
  const highlights = DATA.awards.filter(a => a.project && a['날짜'].startsWith('2026'));
  const code = [
    'developer = {',
    `  <em>"name": "${NAME}",</em>`,
    '  <em>"role": ["Developer", "Planner", "Designer"],</em>',
    '  <em>"stack": ["Python", "Flask", "React"],</em>',
    '  <em>"focus": "지역과 일상의 문제 해결"</em>',
    '}'
  ];
  return `<section class="hero">
    <div>${title('DEVELOPER · PLANNER · DESIGNER', '문제를 발견하고,<br><span class="grad">서비스로 연결합니다.</span>', `안녕하세요, ${NAME}입니다.<br>공공데이터와 기술로 지역과 일상의 불편을 풀어내고, 기획부터 디자인·개발까지 팀을 이끌어 끝까지 완성합니다.`)}
      <div class="actions reveal"><a class="button primary" href="#projects">프로젝트 보기 →</a>${external(GITHUB, 'GitHub')}</div>
    </div>
    <div class="code reveal"><div class="code-label">profile.py</div><pre>${code.map((line, i) => `<span class="line" style="--i:${i}"><span class="ln">${String(i + 1).padStart(2, '0')}</span> ${line}</span>`).join('')}<span class="caret"></span></pre></div>
  </section>
  <div class="stats">
    ${[[DATA.projects.length, '프로젝트'], [awardCount, '수상'], [DATA.activities.length, '대외활동·경험']].map(([n, label]) => `<div class="stat reveal"><strong data-count="${n}">${n}</strong><span>${label}</span></div>`).join('')}
  </div>
  ${highlights.map(a => `<button class="featured-award reveal" data-project="${a.project}"><small>2026 / HIGHLIGHT</small><span class="fa-title">${esc(a['내용'])}</span><span class="note">${esc(findProject(a.project).name)} 프로젝트 보기 →</span></button>`).join('')}
  <div class="section-heading reveal"><h2>Selected Projects</h2><a class="subtle" href="#projects">VIEW ALL ↗</a></div>
  <div class="grid">${DATA.projects.slice(0, 4).map(projectCard).join('')}</div>`;
}

function projects() {
  return `${title('PROJECTS', 'Projects', '지역의 문제와 일상의 필요에서 시작한 개발·기획·디자인 기록입니다. 카드를 누르면 자세한 설명과 발표 자료를 볼 수 있습니다.')}
  <div class="filterbar reveal">${['전체', '개발', '기획', '디자인'].map((v, i) => `<button data-project-filter="${v}" class="${i ? '' : 'active'}">${v}</button>`).join('')}</div>
  <div class="grid" id="project-list">${DATA.projects.map(projectCard).join('')}</div>`;
}

function about() {
  const stack = [['Languages', 'Python · TypeScript · JavaScript · Java · Kotlin'], ['Backend', 'Flask · FastAPI · Spring Boot'], ['Frontend', 'React · Next.js · Electron'], ['Mobile', 'Jetpack Compose · React Native'], ['Database', 'MySQL · PostgreSQL · SQLite · Firebase'], ['Infra · HW', 'AWS EC2 · Docker · Vercel · Raspberry Pi'], ['Collaboration', 'Git · GitHub · Figma']];
  return `${title('ABOUT ME', '사람을 이해하고,<br>문제를 해결합니다.', '공공데이터와 지역 문제 해결 프로젝트에서 팀을 이끌며 개발·기획·디자인을 함께 맡아 왔습니다.')}
  <div class="about-grid">
    <section class="card card-body reveal"><p class="eyebrow">01 / TECH STACK</p><h2>기술과 협업 도구</h2>${stack.map(([a, b]) => `<div class="stack-row"><span>${a}</span><strong>${b}</strong></div>`).join('')}</section>
    <section class="card card-body reveal"><p class="eyebrow">02 / BEYOND CODE</p><h2>개발 밖의 경험도 함께</h2><p>교육 봉사, 학원 조교, 청년정책네트워크 분과장, 서포터즈 활동에서 다양한 사람을 만나며 사용자의 입장에서 생각하는 법을 배웠습니다. 소설과 게임을 만들며 쌓은 이야기 감각은 서비스를 기획하고 발표할 때도 힘이 됩니다.</p><div class="actions"><a class="button" href="#experience">활동 기록 →</a><a class="button" href="#awards">수상 기록 →</a></div></section>
  </div>
  <div class="section-heading reveal"><h2>Experience Archive</h2><span class="subtle">LEARNING & EXPLORATION</span></div>
  ${DATA.experiences.map((v, i) => `<div class="record reveal"><time>ARCHIVE / ${String(i + 1).padStart(2, '0')}</time><h3>${esc(v)}</h3></div>`).join('')}`;
}

function activityRows(rows) {
  return rows.map(r => `<article class="record reveal"><time>${period(r['활동 기간'])}</time><div><h3>${esc(r['소속'])}</h3><div class="tags">${tags(r['키워드'])}</div></div></article>`).join('') || '<p class="empty">아직 이 분류에 등록된 활동이 없습니다.</p>';
}

function experience() {
  const categories = ['전체', ...new Set(DATA.activities.flatMap(a => splitTags(a['키워드'])))];
  return `${title('EXPERIENCE', '활동과 경험', '교육·봉사·동아리·서포터즈. 다양한 현장에서 쌓은 기록입니다.')}
  <div class="filterbar reveal">${categories.map((v, i) => `<button data-activity-filter="${esc(v)}" class="${i ? '' : 'active'}">${esc(v)}</button>`).join('')}</div>
  <div class="records" id="activity-list">${activityRows(DATA.activities)}</div>`;
}

function awardRows(rows) {
  return rows.map(r => `<article class="record reveal"><time>${esc(formatDate(r['날짜']))}</time><div><h3>${esc(r['내용'])}</h3>${r.project ? `<button class="link-button" data-project="${r.project}">관련 프로젝트 · ${esc(findProject(r.project).name)} →</button>` : ''}</div><span class="tag">${esc(r['분류'])}</span></article>`).join('') || '<p class="empty">검색 결과가 없습니다.</p>';
}

function awards() {
  return `${title('AWARDS & CERTIFICATES', '수상과 배움의 기록', '공모전 수상부터 자격·어학·수료까지.')}
  <label class="reveal"><span class="note">기록 검색</span><br><input class="search" id="award-search" type="search" placeholder="공모전, 수료, TOEIC 등"></label>
  <div class="records" id="award-list">${awardRows([...DATA.awards].sort(byDateDesc))}</div>`;
}

function contact() {
  return `${title('CONTACT', '함께할 다음 프로젝트를<br>기다립니다.', '프로젝트나 협업에 관한 이야기가 있다면 편하게 연락해 주세요.')}
  <div class="about-grid contact-grid">
    <section>
      <button class="contact-row reveal" data-action="copy-email" aria-label="이메일 주소 복사"><div><strong>Email</strong><small>${EMAIL}</small></div><span class="copy-label">복사</span></button>
      <a class="contact-row reveal" href="${GITHUB}" target="_blank" rel="noopener noreferrer"><div><strong>GitHub</strong><small>github.com/hwabeom</small></div><span>↗</span></a>
      <a class="contact-row reveal" href="tel:+821052959844"><div><strong>Phone</strong><small>010-5295-9844</small></div><span>↗</span></a>
      <div class="contact-row reveal"><div><strong>Discord</strong><small>hwabeom</small></div></div>
    </section>
    <section class="card card-body reveal">
      <p class="eyebrow">SEND A MESSAGE</p><h2>메시지 보내기</h2>
      <p class="note">메일 앱을 열지 않고 여기서 바로 보낼 수 있어요.</p>
      <form id="contact-form" class="form">
        <div class="field-row">
          <label class="field"><span>이름</span><input name="name" required maxlength="40" autocomplete="name"></label>
          <label class="field"><span>답장 받을 이메일</span><input type="email" name="email" required maxlength="120" autocomplete="email"></label>
        </div>
        <label class="field"><span>제목</span><input name="subject" maxlength="100" placeholder="협업 제안, 프로젝트 문의 등"></label>
        <label class="field"><span>내용</span><textarea name="message" rows="6" required maxlength="3000"></textarea></label>
        <input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="form-status" role="status" aria-live="polite"></p>
        <button class="button primary" type="submit">보내기 ↗</button>
      </form>
    </section>
  </div>`;
}

async function sendMail(form) {
  const f = Object.fromEntries(new FormData(form));
  if (f._honey) return;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  form.classList.add('sending');
  status.className = 'form-status';
  status.textContent = '보내는 중…';
  try {
    await api('/contact', {method: 'POST', body: {name: f.name, email: f.email, subject: f.subject, message: f.message}});
    form.reset();
    status.classList.add('ok');
    status.textContent = '메시지를 보냈어요! 확인하고 답장 드릴게요.';
  } catch (err) {
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(f.subject || '포트폴리오 문의')}&body=${encodeURIComponent(`${f.message}\n\n— ${f.name} (${f.email})`)}`;
    const reason = err.fromServer ? esc(err.message) : '전송하지 못했어요. 잠시 후 다시 시도하거나';
    status.classList.add('error');
    status.innerHTML = `${reason} <a href="${esc(mailto)}">메일 앱으로 보내기</a>를 이용해 주세요.`;
  } finally {
    button.disabled = false;
    form.classList.remove('sending');
  }
}

function copyEmail(button) {
  const label = button.querySelector('.copy-label');
  const done = ok => { label.textContent = ok ? '복사됨 ✓' : EMAIL; setTimeout(() => { label.textContent = '복사'; }, 1800); };
  if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(() => done(true), () => done(false));
  else done(false);
}

/* ---------- Blog ---------- */

// 서버에 연결되기 전이나 연결할 수 없을 때는 posts.js 의 기본 글을 보여 준다
let posts = SEED_POSTS.map(p => ({...p}));
let online = false;
let loginEnabled = false;
let isAdmin = false;
let afterLogin = null;

async function connect() {
  try {
    const [list, session] = await Promise.all([api('/posts'), api('/session')]);
    posts = list;
    online = true;
    loginEnabled = session.loginEnabled;
    isAdmin = session.admin;
  } catch {
    online = false;
  }
  if (location.hash.startsWith('#blog')) render();
}

// 세션이 끝났거나 저장에 실패했을 때 공통으로 처리한다
function handleAdminError(err) {
  if (err.status === 401) {
    isAdmin = false;
    render();
    return toast('로그인이 만료됐어요. 다시 로그인해 주세요.');
  }
  toast(err.fromServer ? err.message : '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
}

const sortedPosts = () => [...posts].sort((a, b) => b.date.localeCompare(a.date));
const postDate = d => esc(d.replaceAll('-', '.'));
const readMin = text => Math.max(1, Math.round(text.replace(/\s/g, '').length / 400));
const postHref = p => `#blog/${encodeURIComponent(p.id)}`;

// 간단한 마크다운: ## 소제목, - 목록, > 인용, **굵게**, `코드`, [링크](https://…)
function md(src) {
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
  return String(src).replace(/\r/g, '').split(/\n{2,}/).map(block => {
    const lines = block.trim().split('\n');
    if (!lines[0]) return '';
    if (/^### /.test(lines[0])) return `<h3>${inline(lines[0].slice(4))}</h3>`;
    if (/^## /.test(lines[0])) return `<h2>${inline(lines[0].slice(3))}</h2>`;
    if (lines.every(l => /^- /.test(l))) return `<ul>${lines.map(l => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    if (lines.every(l => /^> ?/.test(l))) return `<blockquote>${lines.map(l => inline(l.replace(/^> ?/, ''))).join('<br>')}</blockquote>`;
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

function postCard(p) {
  return `<a class="post-card reveal" href="${postHref(p)}">
    <time class="mono">${postDate(p.date)} · ${readMin(p.content)}분</time>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.summary)}</p>
    <div class="tags">${tags(p.tags)}</div>
  </a>`;
}

const postCards = list => list.map(postCard).join('') || '<p class="empty">아직 작성된 글이 없습니다.</p>';

function adminBar() {
  if (!online || !loginEnabled) return '';
  if (!isAdmin) return `<div class="admin-bar reveal"><button class="link-button write-link" data-action="post-new">✎ 관리자 글쓰기</button></div>`;
  return `<div class="admin-bar reveal">
      <span class="admin-badge mono">● 관리자 모드</span>
      <button class="button primary" data-action="post-new">✎ 새 글 쓰기</button>
      <button class="button" data-action="messages">받은 메시지</button>
      <button class="button" data-action="post-export">posts.js 백업</button>
      <button class="button" data-action="logout">로그아웃</button>
    </div>
    <p class="note admin-note reveal">작성·수정한 글은 서버에 바로 저장돼 모든 방문자에게 보입니다. 'posts.js 백업'은 현재 글을 기본 글 파일 형식으로 내려받아요.</p>`;
}

function blog(id) {
  if (id) return postView(id);
  const list = sortedPosts();
  const tagList = ['전체', ...new Set(list.flatMap(p => p.tags))];
  return `${title('BLOG', '만들고, 기록하고,<br>돌아봅니다.', '프로젝트 회고와 행사 후기, 만들면서 배운 것들을 적습니다.')}
  ${adminBar()}
  <div class="filterbar reveal">${tagList.map((t, i) => `<button data-post-tag="${esc(t)}" class="${i ? '' : 'active'}">${esc(t)}</button>`).join('')}</div>
  <div class="post-list" id="post-list">${postCards(list)}</div>`;
}

function postView(id) {
  const list = sortedPosts();
  const i = list.findIndex(p => p.id === id);
  const p = list[i];
  if (!p) return `${title('BLOG', '글을 찾을 수 없어요.', '삭제되었거나 주소가 잘못되었을 수 있어요.')}<a class="button" href="#blog">← 목록으로</a>`;
  const newer = list[i - 1], older = list[i + 1];
  return `<article class="post">
    <a class="subtle back reveal" href="#blog">← BLOG</a>
    <p class="eyebrow reveal">// ${postDate(p.date)} · ${readMin(p.content)} MIN READ</p>
    <h1 class="post-title reveal">${esc(p.title)}</h1>
    <div class="tags reveal">${tags(p.tags)}</div>
    ${isAdmin ? `<div class="admin-bar reveal"><button class="button" data-action="post-edit" data-id="${esc(p.id)}">✎ 수정</button><button class="button danger" data-action="post-delete" data-id="${esc(p.id)}">삭제</button></div>` : ''}
    <div class="post-body reveal">${md(p.content)}</div>
    <nav class="post-nav reveal" aria-label="다른 글">
      ${older ? `<a href="${postHref(older)}"><small>← 이전 글</small>${esc(older.title)}</a>` : '<span></span>'}
      ${newer ? `<a class="next" href="${postHref(newer)}"><small>다음 글 →</small>${esc(newer.title)}</a>` : ''}
    </nav>
  </article>`;
}

function loginForm() {
  return `<form class="m-body form" id="login-form">
    <p class="eyebrow">// ADMIN</p>
    <h2 id="modal-title">관리자 확인</h2>
    <p class="note">글을 작성·수정·삭제하려면 비밀번호를 입력해 주세요.</p>
    <label class="field"><span>비밀번호</span><input type="password" name="password" autocomplete="current-password" required></label>
    <p class="form-status" role="status" aria-live="polite"></p>
    <div class="actions"><button class="button primary" type="submit">확인</button><button class="button" type="button" data-close>취소</button></div>
  </form>`;
}

function editorForm(p) {
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const v = p || {title: '', date: today, tags: [], summary: '', content: ''};
  return `<form class="m-body form" id="post-form" data-id="${p ? esc(p.id) : ''}">
    <p class="eyebrow">// ${p ? 'EDIT POST' : 'NEW POST'}</p>
    <h2 id="modal-title">${p ? '글 수정' : '새 글 쓰기'}</h2>
    <label class="field"><span>제목</span><input name="title" required maxlength="120" value="${esc(v.title)}"></label>
    <div class="field-row">
      <label class="field"><span>날짜</span><input type="date" name="date" required value="${esc(v.date)}"></label>
      <label class="field"><span>태그 (쉼표로 구분)</span><input name="tags" value="${esc(v.tags.join(', '))}" placeholder="프로젝트 회고, AWS"></label>
    </div>
    <label class="field"><span>요약 (비우면 본문 앞부분으로 채워져요)</span><input name="summary" maxlength="200" value="${esc(v.summary)}"></label>
    <div class="field">
      <div class="editor-tabs"><span>본문</span><button type="button" class="active" data-editor-tab="write">작성</button><button type="button" data-editor-tab="preview">미리보기</button></div>
      <textarea name="content" rows="16" required>${esc(v.content)}</textarea>
      <div class="post-body preview" hidden></div>
      <p class="note">## 소제목 · - 목록 · &gt; 인용 · **굵게** · \`코드\` · [링크](https://…) · 문단은 빈 줄로 구분</p>
    </div>
    <div class="actions"><button class="button primary" type="submit">${p ? '수정 저장' : '발행하기'}</button><button class="button" type="button" data-close>취소</button></div>
  </form>`;
}

function requireAdmin(next, opener) {
  if (isAdmin) return next();
  afterLogin = next;
  openModal(loginForm(), opener, true);
}

async function login(form) {
  const status = form.querySelector('.form-status');
  const input = form.elements.password;
  try {
    await api('/login', {method: 'POST', body: {password: input.value}});
  } catch (err) {
    status.className = 'form-status error';
    status.textContent = err.fromServer ? err.message : '서버에 연결하지 못했어요.';
    if (err.status === 401) {
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      input.select();
    }
    return;
  }
  isAdmin = true;
  closeModal(true);
  render();
  const next = afterLogin;
  afterLogin = null;
  if (next) next();
  else toast('관리자 모드로 전환했어요.');
}

async function savePost(form) {
  const f = new FormData(form);
  const data = {title: f.get('title').trim(), date: f.get('date'), tags: splitTags(f.get('tags')), summary: f.get('summary').trim(), content: f.get('content').trim()};
  const editId = form.dataset.id;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  let saved;
  try {
    saved = editId
      ? await api(`/posts/${encodeURIComponent(editId)}`, {method: 'PUT', body: data})
      : await api('/posts', {method: 'POST', body: data});
  } catch (err) {
    button.disabled = false;
    if (err.status === 401) closeModal(true);
    return handleAdminError(err);
  }
  posts = editId ? posts.map(p => (p.id === editId ? saved : p)) : [...posts, saved];
  closeModal(true);
  const hash = postHref(saved);
  if (location.hash === hash) render();
  else location.hash = hash;
  toast(editId ? '글을 수정했어요.' : '글을 발행했어요.');
}

async function deletePost(id) {
  const p = posts.find(x => x.id === id);
  if (!p || !confirm(`‘${p.title}’ 글을 삭제할까요?`)) return;
  try {
    await api(`/posts/${encodeURIComponent(id)}`, {method: 'DELETE'});
  } catch (err) {
    return handleAdminError(err);
  }
  posts = posts.filter(x => x.id !== id);
  location.hash = 'blog';
  toast('글을 삭제했어요.');
}

function messagesView(list) {
  const rows = list.map(m => `<article class="record">
      <time>${esc(m.createdAt.slice(0, 16).replace(/-/g, '.'))}</time>
      <div>
        <h3>${esc(m.subject || `${m.name}님의 메시지`)}</h3>
        <p>${esc(m.name)} · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.mailed ? '' : ' · 메일 미발송'}</p>
        <p class="message-text">${esc(m.message)}</p>
      </div>
      <button class="button danger" data-action="message-delete" data-id="${m.id}">삭제</button>
    </article>`).join('');
  return `<div class="m-body inbox">
    <p class="eyebrow">// INBOX</p>
    <h2 id="modal-title">받은 메시지</h2>
    <p class="note">연락처 폼으로 받은 최근 메시지 ${list.length}개예요.</p>
    <div class="records">${rows || '<p class="empty">아직 받은 메시지가 없어요.</p>'}</div>
  </div>`;
}

async function openMessages(opener) {
  try {
    openModal(messagesView(await api('/messages')), opener);
  } catch (err) {
    handleAdminError(err);
  }
}

async function deleteMessage(button) {
  if (!confirm('이 메시지를 삭제할까요?')) return;
  try {
    await api(`/messages/${button.dataset.id}`, {method: 'DELETE'});
  } catch (err) {
    if (err.status === 401) closeModal(true);
    return handleAdminError(err);
  }
  button.closest('.record').remove();
  toast('메시지를 삭제했어요.');
}

function exportPosts() {
  const blob = new Blob([`const SEED_POSTS = ${JSON.stringify(sortedPosts(), null, 2)};\n`], {type: 'text/javascript'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'posts.js';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function toast(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2400);
}

const views = {overview, projects, about, experience, awards, blog, contact};

/* ---------- Animations ---------- */

const observer = 'IntersectionObserver' in window && !reduceMotion
  ? new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    observer.unobserve(e.target);
    const counter = e.target.querySelector('[data-count]');
    if (counter) countUp(counter);
  }), {rootMargin: '0px 0px -40px 0px'})
  : null;

function animateIn(root) {
  let n = 0;
  root.querySelectorAll('.reveal:not(.in)').forEach(el => {
    if (!observer) return el.classList.add('in');
    const top = el.getBoundingClientRect().top;
    el.style.setProperty('--d', `${top < innerHeight ? Math.min(n++, 10) * 60 : 0}ms`);
    observer.observe(el);
  });
}

function countUp(el) {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const step = now => {
    const t = Math.min((now - start) / 900, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Routing ---------- */

function render() {
  // #blog/글-id 처럼 하위 경로가 있는 주소도 처리한다
  const [base, ...rest] = location.hash.slice(1).split('/');
  const key = base in views ? base : 'overview';
  const sub = rest.length ? decodeURIComponent(rest.join('/')) : undefined;
  const page = pages.find(p => p[0] === key);
  document.getElementById('files').innerHTML = pages.map(([id, name, icon]) => `<button data-page="${id}" class="${key === id ? 'active' : ''}" ${key === id ? 'aria-current="page"' : ''}><span class="file-icon">${icon}</span>${name}</button>`).join('');
  document.getElementById('tabs').innerHTML = pages.map(([id, name, icon]) => `<button role="tab" aria-selected="${key === id}" data-page="${id}" class="${key === id ? 'active' : ''}"><span class="file-icon">${icon}</span>${name}</button>`).join('');
  const main = document.getElementById('content');
  main.innerHTML = views[key](sub);
  main.classList.remove('page-enter');
  void main.offsetWidth;
  main.classList.add('page-enter');
  document.getElementById('status').textContent = page[1];
  const post = key === 'blog' && sub && posts.find(p => p.id === sub);
  document.title = `${post ? post.title : page[1]} — ${NAME} 포트폴리오`;
  document.querySelector('aside').classList.remove('open');
  document.getElementById('menu').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
  animateIn(main);
}

/* ---------- Modal & slide viewer ---------- */

const modal = document.getElementById('modal');
let lastFocus = null;
let viewer = null;
let formDirty = false;
let modalToken = 0;

function openModal(html, opener, narrow = false) {
  modalToken++;
  lastFocus = opener || document.activeElement;
  viewer = null;
  formDirty = false;
  document.getElementById('modal-content').innerHTML = html;
  const panel = modal.querySelector('.modal-panel');
  panel.scrollTop = 0;
  panel.classList.toggle('narrow', narrow);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => modal.classList.add('show'));
  (modal.querySelector('#modal-content input, #modal-content textarea') || modal.querySelector('.close')).focus();
}

function closeModal(force = false) {
  if (modal.hidden) return;
  if (!force && formDirty && !confirm('작성 중인 내용이 사라져요. 닫을까요?')) return;
  if (document.fullscreenElement) document.exitFullscreen();
  const token = ++modalToken;
  modal.classList.remove('show');
  document.body.classList.remove('modal-open');
  setTimeout(() => {
    if (token !== modalToken) return;
    modal.hidden = true;
    document.getElementById('modal-content').innerHTML = '';
  }, reduceMotion ? 0 : 250);
  viewer = null;
  formDirty = false;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

function modalContent(p) {
  const meta = [['기간', p.period], ['팀', p.team], ['역할', p.role]];
  // 발표 자료가 있으면 팝업 맨 위에서 바로 넘겨 볼 수 있도록 뷰어를 대표 이미지 자리에 둔다
  const top = p.slides ? `<div class="viewer">
        <div class="stage" id="stage">
          <img id="slide-img" alt="">
          <button class="nav prev" data-slide="-1" aria-label="이전 슬라이드">‹</button>
          <button class="nav next" data-slide="1" aria-label="다음 슬라이드">›</button>
          <span class="counter" id="slide-counter"></span>
          <button class="fs" id="slide-fs" aria-label="전체 화면으로 보기">⛶</button>
        </div>
        <div class="strip" id="strip">${p.slides.map((s, i) => `<button data-goto="${i}" aria-label="${i + 1}번 슬라이드"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join('')}</div>
        <p class="viewer-hint mono">발표 자료 ${p.slides.length}장 · ← → 키 또는 스와이프로 넘기기 · ⛶ 전체 화면</p>
      </div>` : `<div class="m-hero ${p.color}"><strong>${esc(p.name)}</strong></div>`;
  return `${top}
    <div class="m-body">
      <p class="eyebrow">// ${esc(p.name.toUpperCase())}</p>
      <h2 id="modal-title">${esc(p.title)}</h2>
      ${p.award ? `<p class="m-award">★ ${esc(p.award)}</p>` : ''}
      <dl class="m-meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <section class="m-section">${p.description.map(d => `<p>${esc(d)}</p>`).join('')}</section>
      <section class="m-section"><h3>주요 내용</h3><ul class="m-list">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></section>
      <section class="m-section"><h3>기술 · 도구</h3><div class="tags">${tags(p.stack)}</div></section>
      ${p.links.length ? `<div class="actions">${p.links.map((l, i) => external(l.url, l.label, i ? 'button' : 'button primary')).join('')}</div>` : ''}
    </div>`;
}

function openProject(id, opener) {
  const p = findProject(id);
  if (!p) return;
  openModal(modalContent(p), opener);
  viewer = p.slides ? {slides: p.slides, index: 0} : null;
  if (viewer) showSlide(0);
}

function showSlide(index) {
  if (!viewer) return;
  const total = viewer.slides.length;
  viewer.index = (index + total) % total;
  const img = document.getElementById('slide-img');
  img.classList.remove('swap');
  void img.offsetWidth;
  img.classList.add('swap');
  img.src = viewer.slides[viewer.index];
  img.alt = `발표 자료 ${viewer.index + 1}번 슬라이드`;
  document.getElementById('slide-counter').textContent = `${viewer.index + 1} / ${total}`;
  document.querySelectorAll('#strip button').forEach((b, i) => b.classList.toggle('active', i === viewer.index));
  const active = document.querySelector('#strip button.active');
  if (active) active.scrollIntoView({block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth'});
  new Image().src = viewer.slides[(viewer.index + 1) % total];
}

function toggleFullscreen() {
  const stage = document.getElementById('stage');
  if (document.fullscreenElement) return document.exitFullscreen();
  if (stage.requestFullscreen) stage.requestFullscreen();
  else window.open(viewer.slides[viewer.index], '_blank', 'noopener');
}

/* ---------- Events ---------- */

const actions = {
  'copy-email': el => copyEmail(el),
  'post-new': el => requireAdmin(() => openModal(editorForm(), el), el),
  'post-edit': el => requireAdmin(() => openModal(editorForm(posts.find(p => p.id === el.dataset.id)), el), el),
  'post-delete': el => requireAdmin(() => deletePost(el.dataset.id), el),
  'post-export': () => exportPosts(),
  'messages': el => requireAdmin(() => openMessages(el), el),
  'message-delete': el => deleteMessage(el),
  'logout': async () => {
    await api('/logout', {method: 'POST'}).catch(() => {});
    isAdmin = false;
    render();
    toast('로그아웃했어요.');
  }
};

const settingsButton = document.getElementById('settings');
const settingsPop = document.getElementById('settings-pop');

function toggleSettings(open = settingsPop.hidden) {
  settingsPop.hidden = !open;
  settingsButton.setAttribute('aria-expanded', String(open));
  settingsButton.classList.toggle('active', open);
  if (open && window.pixelPet) document.getElementById('pet-toggle').checked = window.pixelPet.isEnabled();
}

document.addEventListener('change', e => {
  if (e.target.id === 'pet-toggle' && window.pixelPet) window.pixelPet.setEnabled(e.target.checked);
});

document.addEventListener('click', e => {
  // 본문 바로가기는 해시를 바꾸지 않고 본문으로 포커스만 옮긴다
  if (e.target.closest('.skip')) { e.preventDefault(); return document.getElementById('content').focus(); }
  if (e.target.closest('#settings')) return toggleSettings();
  if (!settingsPop.hidden && !e.target.closest('#settings-pop')) toggleSettings(false);
  const page = e.target.closest('[data-page]');
  if (page) location.hash = page.dataset.page;

  const action = e.target.closest('[data-action]');
  if (action) return actions[action.dataset.action](action);
  const project = e.target.closest('[data-project]');
  if (project) return openProject(project.dataset.project, project);
  if (e.target.closest('[data-close]')) return closeModal();

  const tab = e.target.closest('[data-editor-tab]');
  if (tab) {
    const form = tab.closest('form');
    const preview = tab.dataset.editorTab === 'preview';
    form.querySelectorAll('[data-editor-tab]').forEach(b => b.classList.toggle('active', b === tab));
    form.elements.content.hidden = preview;
    const box = form.querySelector('.preview');
    box.hidden = !preview;
    if (preview) box.innerHTML = md(form.elements.content.value) || '<p class="note">본문이 비어 있어요.</p>';
    return;
  }
  const postTag = e.target.closest('[data-post-tag]');
  if (postTag) {
    const value = postTag.dataset.postTag;
    document.querySelectorAll('[data-post-tag]').forEach(b => b.classList.toggle('active', b === postTag));
    const list = document.getElementById('post-list');
    list.innerHTML = postCards(sortedPosts().filter(p => value === '전체' || p.tags.includes(value)));
    animateIn(list);
    return;
  }
  const move = e.target.closest('[data-slide]');
  if (move) return showSlide(viewer.index + Number(move.dataset.slide));
  const go = e.target.closest('[data-goto]');
  if (go) return showSlide(Number(go.dataset.goto));
  if (e.target.closest('#slide-fs')) return toggleFullscreen();

  const pf = e.target.closest('[data-project-filter]');
  if (pf) {
    const value = pf.dataset.projectFilter;
    document.querySelectorAll('[data-project-filter]').forEach(b => b.classList.toggle('active', b === pf));
    const list = document.getElementById('project-list');
    list.innerHTML = DATA.projects.filter(p => value === '전체' || p.keywords.includes(value)).map(projectCard).join('');
    animateIn(list);
  }
  const af = e.target.closest('[data-activity-filter]');
  if (af) {
    const value = af.dataset.activityFilter;
    document.querySelectorAll('[data-activity-filter]').forEach(b => b.classList.toggle('active', b === af));
    const list = document.getElementById('activity-list');
    list.innerHTML = activityRows(DATA.activities.filter(a => value === '전체' || splitTags(a['키워드']).includes(value)));
    animateIn(list);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !settingsPop.hidden) { toggleSettings(false); return settingsButton.focus(); }
  if (!modal.hidden) {
    if (e.key === 'Escape' && !document.fullscreenElement) closeModal();
    else if (viewer && e.key === 'ArrowLeft') showSlide(viewer.index - 1);
    else if (viewer && e.key === 'ArrowRight') showSlide(viewer.index + 1);
    else if (e.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button, a[href], input, textarea')].filter(el => el.offsetParent !== null);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    return;
  }
  const card = e.target.closest('.project-card');
  if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openProject(card.dataset.project, card); }
});

let touchX = null;
modal.addEventListener('touchstart', e => { if (e.target.closest('#stage')) touchX = e.touches[0].clientX; }, {passive: true});
modal.addEventListener('touchend', e => {
  if (touchX === null || !viewer) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) showSlide(viewer.index + (dx < 0 ? 1 : -1));
  touchX = null;
});

document.addEventListener('submit', e => {
  const handlers = {'contact-form': sendMail, 'login-form': login, 'post-form': savePost};
  if (!handlers[e.target.id]) return;
  e.preventDefault();
  handlers[e.target.id](e.target);
});

document.addEventListener('input', e => {
  if (e.target.closest('#post-form')) formDirty = true;
  if (e.target.id !== 'award-search') return;
  const q = e.target.value.trim().toLowerCase();
  const list = document.getElementById('award-list');
  list.innerHTML = awardRows(DATA.awards.filter(a => `${a['내용']} ${a['날짜']} ${a['분류']}`.toLowerCase().includes(q)).sort(byDateDesc));
  animateIn(list);
});

document.getElementById('menu').addEventListener('click', () => {
  const open = document.querySelector('aside').classList.toggle('open');
  document.getElementById('menu').setAttribute('aria-expanded', String(open));
});
window.addEventListener('hashchange', render);
render();
connect();
