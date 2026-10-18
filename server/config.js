import {randomBytes} from 'node:crypto';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;

export const config = {
  root,
  publicDir: path.join(root, 'public'),
  dataDir: path.resolve(root, env.DATA_DIR || 'data'),
  port: Number(env.PORT) || 3000,
  // 앞단 프록시 개수. rate limit 이 방문자 IP를 제대로 구분하려면 호스팅 구조에 맞아야 한다
  trustProxy: env.TRUST_PROXY === undefined ? 1 : Number(env.TRUST_PROXY),
  isProd: env.NODE_ENV === 'production',
  adminPassword: env.ADMIN_PASSWORD || '',
  sessionSecret: env.SESSION_SECRET || '',
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 465,
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || ''
  },
  mailTo: env.MAIL_TO || 'yeda0311@gmail.com',
  mailFrom: env.MAIL_FROM || env.SMTP_USER || ''
};

if (config.isProd && (!config.adminPassword || config.sessionSecret.length < 32)) {
  throw new Error('배포 환경에서는 ADMIN_PASSWORD와 32자 이상의 SESSION_SECRET 환경 변수가 필요해요.');
}
if (!config.adminPassword) console.warn('[config] ADMIN_PASSWORD가 없어 관리자 로그인이 꺼져 있어요.');
if (!config.sessionSecret) {
  // 개발할 때는 실행마다 임시 키를 만든다 (서버를 다시 켜면 로그아웃된다)
  config.sessionSecret = randomBytes(32).toString('hex');
}
