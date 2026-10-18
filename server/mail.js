import nodemailer from 'nodemailer';
import {config} from './config.js';

const {host, port, user, pass} = config.smtp;
// 인증 정보가 없으면 보내 봐야 매번 실패하므로 메일을 끈다
const transporter = host && user && pass ? nodemailer.createTransport({host, port, secure: port === 465, auth: {user, pass}}) : null;

if (!transporter) console.warn('[mail] SMTP 설정(SMTP_HOST·SMTP_USER·SMTP_PASS)이 없어 연락 메시지는 DB에만 저장돼요.');
else {
  // 배포 직후 로그에서 설정이 맞는지 바로 확인할 수 있게 시작할 때 한 번 접속해 본다
  transporter.verify().then(
    () => console.log(`[mail] SMTP 연결 확인 → ${config.mailTo} 로 알림을 보내요.`),
    err => console.error('[mail] SMTP 연결 실패:', err.message)
  );
}

export const mailEnabled = Boolean(transporter);

export async function sendContactMail(m) {
  if (!transporter) return false;
  await transporter.sendMail({
    from: {name: '포트폴리오 알림', address: config.mailFrom},
    to: config.mailTo,
    replyTo: {name: m.name, address: m.email},
    subject: `[포트폴리오] ${m.subject || `${m.name}님의 메시지`}`,
    text: `${m.message}\n\n— ${m.name} (${m.email})`
  });
  return true;
}
