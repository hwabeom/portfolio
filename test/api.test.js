import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {after, before, describe, test} from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const dataDir = mkdtempSync(path.join(tmpdir(), 'portfolio-test-'));
const PASSWORD = 'test-password';
let base = '';
let server = null;

// 실제 서버 프로세스를 임시 DB로 띄워 HTTP로 검사한다
function start(env = {}) {
  const port = 40000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/index.js'], {
    cwd: root,
    env: {...process.env, NODE_ENV: 'test', PORT: String(port), DATA_DIR: dataDir, ADMIN_PASSWORD: PASSWORD, SESSION_SECRET: 'x'.repeat(32), TRUST_PROXY: '0', SMTP_HOST: '', ...env},
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return new Promise((resolve, reject) => {
    let log = '';
    const onData = d => {
      log += d;
      if (log.includes('실행 중')) resolve({child, base: `http://localhost:${port}`});
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', code => reject(new Error(`서버가 종료됨 (${code})\n${log}`)));
  });
}

const stop = child => new Promise(resolve => {
  child.removeAllListeners('exit');
  child.on('exit', resolve);
  child.kill('SIGTERM');
});

async function restart(env) {
  await stop(server);
  ({child: server, base} = await start(env));
}

async function call(pathname, {method = 'GET', body, cookie, headers = {}} = {}) {
  const res = await fetch(base + pathname, {
    method,
    headers: {...(body !== undefined ? {'content-type': 'application/json'} : {}), ...(cookie ? {cookie} : {}), ...headers},
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return {res, status: res.status, json, text};
}

async function login(password = PASSWORD) {
  const {res, status} = await call('/api/login', {method: 'POST', body: {password}});
  return {status, cookie: res.headers.get('set-cookie')?.split(';')[0]};
}

const newPost = {title: '테스트 글', date: '2026-10-18', tags: ['테스트'], summary: '', content: '## 제목\r\n본문'};

before(async () => { ({child: server, base} = await start()); });
after(async () => {
  await stop(server);
  rmSync(dataDir, {recursive: true, force: true});
});

describe('정적 파일과 보안 헤더', () => {
  test('메인 페이지와 보안 헤더', async () => {
    const {res, status} = await call('/');
    assert.equal(status, 200);
    const csp = res.headers.get('content-security-policy');
    assert.match(csp, /script-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  test('public 밖의 파일과 DB는 내려가지 않는다', async () => {
    for (const p of ['/../package.json', '/%2e%2e/server/config.js', '/data/portfolio.db', '/.env']) {
      const {status, text} = await call(p);
      assert.notEqual(status, 200, p);
      assert.doesNotMatch(text, /ADMIN_PASSWORD|SQLite format/, p);
    }
  });

  test('없는 API는 JSON 404', async () => {
    const {status, json} = await call('/api/nope');
    assert.equal(status, 404);
    assert.ok(json.error);
  });

  test('깨진 JSON은 400', async () => {
    const {status} = await call('/api/login', {method: 'POST', body: '{bad'});
    assert.equal(status, 400);
  });
});

describe('관리자 인증', () => {
  test('틀린 비밀번호는 401, 맞으면 HttpOnly·SameSite 쿠키', async () => {
    assert.equal((await login('wrong')).status, 401);
    const {res} = await call('/api/login', {method: 'POST', body: {password: PASSWORD}});
    const setCookie = res.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
  });

  test('세션 조회', async () => {
    assert.equal((await call('/api/session')).json.admin, false);
    const {cookie} = await login();
    assert.equal((await call('/api/session', {cookie})).json.admin, true);
  });

  test('위조·변조한 쿠키는 거부', async () => {
    const {cookie} = await login();
    const [name, value] = cookie.split('=');
    const [, sig] = value.split('.');
    const forged = Buffer.from(JSON.stringify({exp: Date.now() + 1e9})).toString('base64url');
    for (const bad of [`${name}=${forged}.${sig}`, `${name}=${forged}`, `${name}=garbage`]) {
      assert.equal((await call('/api/posts', {method: 'POST', body: newPost, cookie: bad})).status, 401);
    }
  });

  test('JSON이 아닌 폼 전송(CSRF 형태)은 본문이 비어 저장되지 않는다', async () => {
    const {cookie} = await login();
    const {status} = await call('/api/posts', {method: 'POST', body: 'title=x', cookie, headers: {'content-type': 'text/plain'}});
    assert.equal(status, 400);
  });
});

describe('블로그 글', () => {
  test('기본 글이 시드된다', async () => {
    const {status, json} = await call('/api/posts');
    assert.equal(status, 200);
    assert.ok(json.length >= 1);
    assert.ok(json.every(p => p.id && p.title && Array.isArray(p.tags)));
  });

  test('로그인 없이는 쓰기·수정·삭제 불가', async () => {
    assert.equal((await call('/api/posts', {method: 'POST', body: newPost})).status, 401);
    assert.equal((await call('/api/posts/livinglab-2026-retro', {method: 'PUT', body: newPost})).status, 401);
    assert.equal((await call('/api/posts/livinglab-2026-retro', {method: 'DELETE'})).status, 401);
  });

  test('작성 → 조회 → 수정 → 삭제', async () => {
    const {cookie} = await login();
    const created = await call('/api/posts', {method: 'POST', body: newPost, cookie});
    assert.equal(created.status, 201);
    assert.equal(created.json.content, '## 제목\n본문', '줄바꿈이 \\n 으로 통일된다');
    assert.equal(created.json.summary, '제목 본문', '요약이 비면 본문으로 채운다');
    const id = created.json.id;

    assert.equal((await call(`/api/posts/${id}`)).json.title, '테스트 글');
    const updated = await call(`/api/posts/${id}`, {method: 'PUT', body: {...newPost, title: '수정됨'}, cookie});
    assert.equal(updated.json.title, '수정됨');
    assert.equal((await call(`/api/posts/${id}`, {method: 'DELETE', cookie})).status, 204);
    assert.equal((await call(`/api/posts/${id}`)).status, 404);
  });

  test('잘못된 입력은 400', async () => {
    const {cookie} = await login();
    const cases = [{...newPost, title: ''}, {...newPost, title: 'x'.repeat(121)}, {...newPost, date: '2026/10/18'}, {...newPost, tags: Array(11).fill('t').map((t, i) => t + i)}, {...newPost, content: ''}, {...newPost, title: 123}];
    for (const body of cases) assert.equal((await call('/api/posts', {method: 'POST', body, cookie})).status, 400, JSON.stringify(body).slice(0, 60));
  });

  test('글을 모두 지우고 재시작해도 기본 글이 되살아나지 않는다', async () => {
    const {cookie} = await login();
    for (const p of (await call('/api/posts')).json) await call(`/api/posts/${p.id}`, {method: 'DELETE', cookie});
    await restart();
    assert.deepEqual((await call('/api/posts')).json, []);
  });
});

describe('연락 메시지', () => {
  test('검증, 저장, 관리자 조회·삭제', async () => {
    assert.equal((await call('/api/contact', {method: 'POST', body: {name: '홍길동', email: 'bad', message: 'hi'}})).status, 400);
    assert.equal((await call('/api/contact', {method: 'POST', body: {name: '', email: 'a@b.co', message: 'hi'}})).status, 400);
    const ok = await call('/api/contact', {method: 'POST', body: {name: '홍길동\r\nBcc: evil@x.com', email: 'a@b.co', subject: '제안\nBcc: x', message: '안녕\r\n하세요'}});
    assert.equal(ok.status, 200);

    assert.equal((await call('/api/messages')).status, 401);
    const {cookie} = await login();
    const [m] = (await call('/api/messages', {cookie})).json;
    assert.doesNotMatch(m.name + m.subject, /[\r\n]/, '헤더 인젝션이 되지 않도록 줄바꿈 제거');
    assert.equal(m.message, '안녕\n하세요');
    assert.match(m.createdAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    assert.equal(m.mailed, false);

    assert.equal((await call(`/api/messages/${m.id}`, {method: 'DELETE', cookie})).status, 204);
    assert.equal((await call(`/api/messages/${m.id}`, {method: 'DELETE', cookie})).status, 404);
  });

  test('허니팟을 채우면 저장하지 않고 성공처럼 응답', async () => {
    const {cookie} = await login();
    const before = (await call('/api/messages', {cookie})).json.length;
    assert.equal((await call('/api/contact', {method: 'POST', body: {name: 'bot', email: 'a@b.co', message: 'spam', _honey: 'x'}})).status, 200);
    assert.equal((await call('/api/messages', {cookie})).json.length, before);
  });

  test('너무 자주 보내면 429', async () => {
    let last;
    for (let i = 0; i < 6; i++) last = await call('/api/contact', {method: 'POST', body: {name: 'a', email: 'a@b.co', message: 'x'}});
    assert.equal(last.status, 429);
  });
});

describe('세션 무효화', () => {
  test('비밀번호를 바꾸면 기존 세션이 무효가 된다', async () => {
    const {cookie} = await login();
    await restart({ADMIN_PASSWORD: 'new-password'});
    assert.equal((await call('/api/session', {cookie})).json.admin, false);
    await restart();
  });

  test('로그인 실패가 반복되면 429', async () => {
    let last;
    for (let i = 0; i < 11; i++) last = await login('wrong');
    assert.equal(last.status, 429);
  });
});

describe('배포 설정 검사', () => {
  test('production에서 필수 환경 변수가 없으면 시작하지 않는다', async () => {
    await assert.rejects(start({NODE_ENV: 'production', ADMIN_PASSWORD: '', SESSION_SECRET: ''}), /ADMIN_PASSWORD/);
    await assert.rejects(start({NODE_ENV: 'production', SESSION_SECRET: 'short'}), /SESSION_SECRET/);
  });

  test('production 쿠키는 Secure, HSTS 적용', async () => {
    const prod = await start({NODE_ENV: 'production'});
    const res = await fetch(`${prod.base}/api/login`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({password: PASSWORD})});
    assert.match(res.headers.get('set-cookie'), /Secure/);
    assert.ok(res.headers.get('strict-transport-security'));
    await stop(prod.child);
  });
});
