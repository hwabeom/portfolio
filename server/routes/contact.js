import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import {requireAdmin} from '../auth.js';
import {db} from '../db.js';
import {sendContactMail} from '../mail.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {error: '메시지를 너무 자주 보냈어요. 1시간 뒤에 다시 시도해 주세요.'}
});

// 메일 헤더에 들어가는 값이라 줄바꿈을 지운다
const line = v => (typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').trim() : '');

router.post('/contact', contactLimiter, async (req, res) => {
  const body = req.body ?? {};
  // 사람 눈에 보이지 않는 칸을 채웠다면 스팸봇으로 보고 조용히 성공 처리한다
  if (body._honey) return res.json({ok: true});

  const name = line(body.name);
  const email = line(body.email);
  const subject = line(body.subject);
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || name.length > 40) return res.status(400).json({error: '이름은 1~40자로 적어 주세요.'});
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error: '이메일 주소를 확인해 주세요.'});
  if (subject.length > 100) return res.status(400).json({error: '제목은 100자까지 적을 수 있어요.'});
  if (!message || message.length > 3000) return res.status(400).json({error: '내용은 1~3,000자로 적어 주세요.'});

  const m = {name, email, subject, message};
  const {lastInsertRowid} = db.prepare('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)').run(name, email, subject, message);
  try {
    if (await sendContactMail(m)) db.prepare('UPDATE messages SET mailed = 1 WHERE id = ?').run(lastInsertRowid);
  } catch (err) {
    // 메일이 실패해도 메시지는 저장돼 있으니 관리자 화면에서 볼 수 있다
    console.error('[mail] 전송 실패:', err.message);
  }
  res.json({ok: true});
});

router.get('/messages', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 200').all();
  res.json(rows.map(r => ({id: r.id, name: r.name, email: r.email, subject: r.subject, message: r.message, mailed: Boolean(r.mailed), createdAt: r.created_at})));
});

router.delete('/messages/:id', requireAdmin, (req, res) => {
  const {changes} = db.prepare('DELETE FROM messages WHERE id = ?').run(Number(req.params.id));
  if (!changes) return res.status(404).json({error: '메시지를 찾을 수 없어요.'});
  res.status(204).end();
});

export default router;
