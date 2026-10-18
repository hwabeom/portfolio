import nodemailer from 'nodemailer';
import {config} from './config.js';

const {host, port, user, pass} = config.smtp;
const transporter = host ? nodemailer.createTransport({host, port, secure: port === 465, auth: user ? {user, pass} : undefined}) : null;

if (!transporter) console.warn('[mail] SMTP 설정이 없어 연락 메시지는 DB에만 저장돼요.');

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
