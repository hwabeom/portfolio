import express from 'express';
import helmet from 'helmet';
import {config} from './config.js';

const app = express();
// Render·Railway 같은 호스팅은 프록시 뒤에서 돌기 때문에 첫 번째 프록시의 IP 헤더를 믿는다
app.set('trust proxy', 1);

const CDN = 'https://cdn.jsdelivr.net';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // 카드 애니메이션 순서를 style="--i:…" 로 넘기기 때문에 인라인 스타일을 허용한다
      styleSrc: ["'self'", "'unsafe-inline'", CDN],
      fontSrc: ["'self'", CDN, 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: config.isProd ? [] : null
    }
  },
  strictTransportSecurity: config.isProd
}));
app.use(express.json({limit: '200kb'}));

app.get('/api/health', (req, res) => res.json({ok: true}));
app.use('/api', (req, res) => res.status(404).json({error: '존재하지 않는 API예요.'}));

app.use(express.static(config.publicDir, {
  setHeaders(res, file) {
    // 슬라이드 이미지는 잘 바뀌지 않으니 오래 캐시하고, HTML·JS·CSS는 배포하면 바로 반영되게 매번 확인한다
    res.setHeader('Cache-Control', /[\\/]assets[\\/]/.test(file) ? 'public, max-age=604800' : 'no-cache');
  }
}));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({error: '요청 형식이 올바르지 않아요.'});
  if (err.type === 'entity.too.large') return res.status(413).json({error: '내용이 너무 길어요.'});
  console.error(err);
  res.status(500).json({error: '서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'});
});

app.listen(config.port, () => console.log(`포트폴리오 서버 실행 중 → http://localhost:${config.port}`));
