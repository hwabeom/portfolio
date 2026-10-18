import crypto from 'node:crypto';
import {config} from './config.js';

const COOKIE = 'yeda_admin';
const MAX_AGE = 12 * 60 * 60 * 1000;

const sha256 = text => crypto.createHash('sha256').update(String(text)).digest();
const sign = data => crypto.createHmac('sha256', config.sessionSecret).update(data).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(input) {
  if (!config.adminPassword || typeof input !== 'string') return false;
  // 길이가 달라도 같은 시간에 비교하도록 해시끼리 비교한다
  return crypto.timingSafeEqual(sha256(input), sha256(config.adminPassword));
}

const cookieOptions = {httpOnly: true, secure: config.isProd, sameSite: 'strict', path: '/'};

// 세션은 서버에 저장하지 않고 만료 시각을 HMAC으로 서명한 쿠키로 들고 다닌다
export function startSession(res) {
  const payload = Buffer.from(JSON.stringify({exp: Date.now() + MAX_AGE})).toString('base64url');
  res.cookie(COOKIE, `${payload}.${sign(payload)}`, {...cookieOptions, maxAge: MAX_AGE});
}

export function endSession(res) {
  res.clearCookie(COOKIE, cookieOptions);
}

function readCookie(req) {
  const pair = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`));
  return pair ? decodeURIComponent(pair.slice(COOKIE.length + 1)) : '';
}

export function isAdmin(req) {
  const [payload, sig] = readCookie(req).split('.');
  if (!payload || !sig || !safeEqual(sign(payload), sig)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({error: '관리자 로그인이 필요해요.'});
}
