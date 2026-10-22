# Portfolio

<p align="center">
  <a href="https://hwabeom-portfolio.onrender.com">
    <img src="https://img.shields.io/badge/🌐_LIVE_DEMO-Visit_Portfolio-2ea44f?style=for-the-badge" alt="Visit Portfolio" />
  </a>
</p>

<p align="center">
  <strong>Personal Portfolio</strong><br/>
  개발 프로젝트와 활동, 수상 이력, 기술 기록을 소개하는 개인 포트폴리오
</p>

> **Live Service** · [hwabeom-portfolio.onrender.com](https://hwabeom-portfolio.onrender.com)

※ Render 무료 호스팅 환경으로 운영되어 일정 시간 접속이 없으면 첫 방문 시 로딩이 발생할 수 있습니다. 서비스가 다시 시작되는 동안 잠시 기다려 주세요.

---

## 👋 About

개발 프로젝트부터 대외활동, 수상 이력, 기술 기록까지 한곳에서 살펴볼 수 있는 개인 포트폴리오입니다.

IDE를 모티브로 한 인터페이스를 통해 익숙하면서도 색다른 탐색 경험을 제공하고, 실제 웹 서비스 운영을 고려해 블로그와 연락 기능을 함께 구현했습니다.

단순히 결과물을 나열하는 데 그치지 않고, 어떤 문제에 관심을 가지고 무엇을 만들었는지 기록하는 공간을 지향합니다.

## ✨ Features

- **IDE Interface**  
  에디터, 탭, 파일 탐색기에서 영감을 얻은 인터페이스

- **Project Explorer**  
  프로젝트, 활동, 수상 이력 탐색 및 검색·필터링

- **Blog**  
  기술 기록과 생각을 공유하는 블로그 및 관리자 글 관리 기능

- **Contact**  
  문의 메시지 접수 및 관리자 메시지 관리

- **Pixel Cat**  
  화면 하단을 자유롭게 돌아다니는 픽셀 고양이

- **Responsive Design**  
  다양한 화면 크기에 대응하는 레이아웃

## 🛠️ Tech Stack

| Category | Technologies |
| --- | --- |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express |
| Database | SQLite |
| Authentication | HMAC-signed Cookie |
| Email | SMTP |
| Testing | `node:test` |
| DevOps | Docker, GitHub Actions |
| Hosting | Render |

## 📁 Project Structure

```text
.
├── public/
│   ├── index.html       # Main page
│   ├── style.css        # Styles & responsive design
│   ├── app.js           # UI interactions & API integration
│   ├── data.js          # Projects, activities & awards
│   ├── posts.js         # Default blog posts
│   ├── pet.js           # Pixel cat animation
│   └── assets/          # Images & presentation slides
│
├── server/
│   ├── index.js         # Express server
│   ├── config.js        # Environment configuration
│   ├── auth.js          # Admin authentication
│   ├── db.js            # SQLite database
│   ├── mail.js          # Email delivery
│   └── routes/          # API routes
│
├── test/                # API integration tests
└── .github/workflows/   # CI workflows
```

## 🔒 Behind the Scenes

화면 구성뿐 아니라 실제 서비스 운영에 필요한 기능도 함께 고려했습니다.

- **Admin Authentication** — HMAC 서명 기반 관리자 세션 인증
- **Blog Management** — 게시글 작성, 수정, 삭제 및 조회
- **Contact API** — 문의 메시지 저장 및 이메일 알림 연동
- **Rate Limiting** — 로그인 및 문의 요청 횟수 제한
- **Security Headers** — Helmet 기반 CSP 및 보안 헤더 적용
- **Input Protection** — HTML 이스케이프 및 메일 헤더 인젝션 방지
- **API Testing** — `node:test` 기반 통합 테스트
- **CI Pipeline** — GitHub Actions 기반 테스트 및 Docker 검증

## ☁️ Deployment

**Hosted on Render**

실제 배포 환경에서 웹 서비스의 동작을 확인할 수 있습니다.

[**포트폴리오 바로가기 →**](https://hwabeom-portfolio.onrender.com)

---

<p align="center">
  <sub>Built with curiosity, code, and a little pixel cat.</sub>
</p>
