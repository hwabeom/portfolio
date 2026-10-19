# 포트폴리오

포트폴리오 사이트입니다.
VS Code 화면을 닮은 정적 프론트엔드와, 블로그·연락 폼을 처리하는 Express 백엔드로 구성됩니다.

## 구조

```
public/            정적 프론트엔드 (빌드 과정 없음)
  index.html       페이지 기본 구조
  style.css        색상·글꼴·반응형 디자인
  app.js           탭·검색·필터, 블로그·연락 폼 (API 호출)
  data.js          프로젝트·활동·수상 데이터
  posts.js         블로그 기본 글 (DB가 비어 있을 때 시드로 사용)
  pet.js           하단을 돌아다니는 픽셀 고양이
  assets/          발표 자료 슬라이드·이미지
server/            백엔드 (Node.js + Express + SQLite)
  index.js         서버 진입점, 보안 헤더, 정적 파일 제공
  config.js        환경 변수
  auth.js          관리자 세션 (HMAC 서명 쿠키)
  db.js            SQLite 스키마와 기본 글 시드
  mail.js          SMTP 메일 발송
  routes/          auth · posts · contact API
test/              API 통합 테스트 (node:test)
.github/workflows/ CI: 테스트 + Docker 이미지 검증
```

## 로컬에서 실행

Node.js 22.13 이상이 필요합니다 (내장 `node:sqlite` 사용).

```bash
npm install
cp .env.example .env    # ADMIN_PASSWORD 등을 채운다
npm run dev             # http://localhost:3000, 파일을 고치면 자동 재시작
npm test                # API 통합 테스트 (임시 DB 사용, 실제 data/ 는 건드리지 않음)
```

`main`에 push하거나 PR을 열면 GitHub Actions가 테스트, `npm audit`, Docker 이미지 빌드·헬스 체크를 돌립니다.

DB 파일은 `data/portfolio.db`에 생기며, 처음 실행할 때 `public/posts.js`의 글이 들어갑니다.
`public/index.html`을 바로 열거나 정적 호스팅에 올려도 사이트는 보이지만, 이때 블로그는 읽기 전용이고 연락 폼은 메일 앱 링크로 대신합니다.

## API

| 메서드 | 경로 | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/api/health` | 헬스 체크 | 공개 |
| GET | `/api/session` | 관리자 로그인 여부 | 공개 |
| POST | `/api/login` | 관리자 로그인 `{password}` | 공개 (실패 15분 10회 제한) |
| POST | `/api/logout` | 로그아웃 | 공개 |
| GET | `/api/posts` · `/api/posts/:id` | 블로그 글 목록·상세 | 공개 |
| POST · PUT · DELETE | `/api/posts` · `/api/posts/:id` | 글 작성·수정·삭제 | 관리자 |
| POST | `/api/contact` | 연락 메시지 `{name, email, subject, message}` | 공개 (시간당 5회 제한) |
| GET · DELETE | `/api/messages` · `/api/messages/:id` | 받은 메시지 보기·삭제 | 관리자 |

## 환경 변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 배포 시 | 블로그 관리자 비밀번호 |
| `SESSION_SECRET` | 배포 시 | 세션 쿠키 서명 키, 32자 이상 |
| `NODE_ENV` | | `production`이면 Secure 쿠키·HSTS 적용 |
| `PORT` | | 기본 3000 |
| `TRUST_PROXY` | | 앞단 프록시 개수, 기본 1 (Render·Railway). rate limit이 방문자 IP를 구분하는 데 쓰임 |
| `DATA_DIR` | | SQLite 저장 폴더, 기본 `data` (Docker는 `/data`) |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | | 연락 폼 알림 메일. 비우면 DB에만 저장 |
| `MAIL_TO` · `MAIL_FROM` | | 받는 주소 (기본 yeda0311@gmail.com) · 보내는 주소 (기본 `SMTP_USER`) |

Gmail로 받으려면 Google 계정에서 2단계 인증을 켜고 [앱 비밀번호](https://myaccount.google.com/apppasswords)를 만들어 `SMTP_USER`에 Gmail 주소, `SMTP_PASS`에 앱 비밀번호를 넣습니다.
메일 발송이 실패해도 메시지는 DB에 남아 있어 관리자 모드의 **받은 메시지**에서 볼 수 있습니다.
서버가 시작할 때 SMTP 접속을 한 번 시험하고 결과를 로그에 남기니, 배포 직후 로그에서 `[mail] SMTP 연결 확인`이 보이는지 확인하세요.

## 보안 정책

- 관리자 세션은 서버에 저장하지 않고, 만료 시각을 HMAC으로 서명한 `HttpOnly`·`SameSite=Strict` 쿠키(배포 시 `Secure`)로 12시간 유지합니다.
- 서명 키는 `SESSION_SECRET`과 `ADMIN_PASSWORD`로 만들기 때문에, **둘 중 하나를 바꾸면 이미 로그인한 모든 세션이 바로 끊깁니다.** 쿠키가 유출됐다고 의심되면 비밀번호를 바꾸세요.
- 쓰기 API는 JSON 요청만 받고 쿠키가 SameSite=Strict라서 다른 사이트에서 위조한 요청(CSRF)은 통하지 않습니다.
- 로그인 실패는 15분에 10회, 연락 폼은 1시간에 5회로 IP별 제한합니다.
- helmet으로 CSP(`script-src 'self'`, `frame-ancestors 'none'` 등)와 보안 헤더를 붙이고, 화면에 출력하는 값은 모두 HTML 이스케이프합니다.
- 연락 메시지의 이름·제목에서 줄바꿈을 지워 메일 헤더 인젝션을 막습니다.
- Docker 컨테이너에서는 서버가 root가 아닌 `node` 사용자로 실행됩니다.

## 배포

SQLite 파일을 쓰기 때문에 **영구 디스크(볼륨)를 붙일 수 있는 곳**에 올려야 재배포해도 글과 메시지가 남습니다.

### Render (render.yaml 포함)

1. [Render](https://render.com) → **New + → Blueprint** → 이 GitHub 저장소 선택
2. `ADMIN_PASSWORD` 값을 입력 (`SESSION_SECRET`은 자동 생성)
3. 배포가 끝나면 `https://<서비스명>.onrender.com`에서 확인, `main`에 push할 때마다 자동 배포

기본 설정은 **무료 플랜**입니다 (요금 없음). 무료 플랜에는 다음 제약이 있습니다.

- 15분 동안 접속이 없으면 서버가 잠들고, 다음 접속 때 깨어나는 데 1분쯤 걸립니다.
- 영구 디스크가 없어 서버가 잠들었다 깨거나 재배포하면 DB가 기본 글 상태로 돌아갑니다. 오래 남길 글은 관리자 모드의 **posts.js 백업**으로 받아 `public/posts.js`에 반영한 뒤 push하세요.
- SMTP 포트가 막혀 메일 알림을 보낼 수 없습니다. 연락 메시지는 **받은 메시지**에서 확인합니다 (이 역시 서버가 다시 시작되면 사라집니다).

글과 메시지를 계속 남기고 메일 알림도 받으려면 `render.yaml`에서 `plan: starter`로 바꾸고 주석 처리한 `disk`·SMTP 설정을 살리세요. 이때부터 요금이 청구됩니다.

배포 후 확인할 것:

1. `https://<서비스명>.onrender.com/api/health`가 `{"ok":true}`인지
2. blog.md 탭에서 **관리자 글쓰기**로 로그인해 글을 쓰고, 다른 브라우저에서도 보이는지
3. contact.ts 탭에서 메시지를 보내 관리자 모드의 **받은 메시지**에 쌓이는지

### Railway · Fly.io · 직접 운영하는 서버

`Dockerfile`로 어디서든 같은 이미지를 띄울 수 있습니다. 볼륨을 `/data`에 연결하고 위 환경 변수를 넣으면 됩니다.

```bash
docker build -t hwabeom-portfolio .
docker run -d -p 3000:3000 -v portfolio-data:/data \
  -e NODE_ENV=production -e ADMIN_PASSWORD=... -e SESSION_SECRET=... \
  hwabeom-portfolio
```

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/)를 따릅니다. 타입과 범위는 영어, 제목과 본문은 한국어로 씁니다.

```
<type>(<scope>): <제목>

<본문: 무엇을, 왜 바꿨는지>
```

| type | 쓰는 때 |
| --- | --- |
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 동작은 그대로 두고 코드 구조 개선 |
| `style` | 코드 포맷·세미콜론 등 (CSS 디자인 변경은 `feat`/`fix`) |
| `docs` | 문서 |
| `content` | 프로젝트·활동·블로그 글 등 포트폴리오 내용 수정 |
| `test` | 테스트 |
| `build` | Docker·의존성·배포 설정 |
| `ci` | CI 설정 |
| `chore` | 그 밖의 잡일 |

- scope: `server`, `client`, `blog`, `contact`, `deps` 등 (생략 가능)
- 제목은 50자 안쪽, 마침표 없이 "~ 추가 / 수정 / 제거"처럼 끝냅니다.
- 하위 호환이 깨지면 타입 뒤에 `!`를 붙이고 본문에 `BREAKING CHANGE:`를 적습니다.

저장소에 들어 있는 템플릿을 쓰면 `git commit` 때 위 형식이 편집기에 미리 채워집니다.

```bash
git config commit.template .gitmessage
```
