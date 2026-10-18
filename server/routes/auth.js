import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import {checkPassword, endSession, isAdmin, startSession} from '../auth.js';
import {config} from '../config.js';

const router = Router();

// 비밀번호를 틀린 요청만 센다: 15분에 10번
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {error: '로그인 시도가 너무 많아요. 15분 뒤에 다시 시도해 주세요.'}
});

router.get('/session', (req, res) => {
  res.json({admin: isAdmin(req), loginEnabled: Boolean(config.adminPassword)});
});

router.post('/login', loginLimiter, (req, res) => {
  if (!checkPassword(req.body?.password)) return res.status(401).json({error: '비밀번호가 맞지 않아요.'});
  startSession(res);
  res.json({admin: true});
});

router.post('/logout', (req, res) => {
  endSession(res);
  res.status(204).end();
});

export default router;
