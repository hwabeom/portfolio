import {Router} from 'express';
import {requireAdmin} from '../auth.js';
import {db} from '../db.js';

const router = Router();

const toPost = row => ({id: row.id, title: row.title, date: row.date, tags: JSON.parse(row.tags), summary: row.summary, content: row.content});
const findPost = db.prepare('SELECT * FROM posts WHERE id = ?');

// 요약을 비우면 본문 앞부분에서 마크다운 기호를 걷어 내고 채운다 (클라이언트와 같은 규칙)
const autoSummary = content => content.replace(/[#>*`\-[\]()]/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);

function validate(body = {}) {
  const str = v => (typeof v === 'string' ? v.trim() : '');
  const title = str(body.title);
  const date = str(body.date);
  const content = str(body.content).replace(/\r\n?/g, '\n');
  const tags = Array.isArray(body.tags) ? [...new Set(body.tags.map(str).filter(Boolean))] : [];
  const summary = str(body.summary) || autoSummary(content);

  if (!title || title.length > 120) return {error: '제목은 1~120자로 적어 주세요.'};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return {error: '날짜 형식이 올바르지 않아요.'};
  if (tags.length > 10 || tags.some(t => t.length > 30)) return {error: '태그는 30자 이하로 10개까지 달 수 있어요.'};
  if (summary.length > 200) return {error: '요약은 200자까지 적을 수 있어요.'};
  if (!content || content.length > 50000) return {error: '본문은 1~50,000자로 적어 주세요.'};
  return {data: {title, date, tags, summary, content}};
}

router.get('/posts', (req, res) => {
  res.json(db.prepare('SELECT * FROM posts ORDER BY date DESC, created_at DESC').all().map(toPost));
});

router.get('/posts/:id', (req, res) => {
  const row = findPost.get(req.params.id);
  if (!row) return res.status(404).json({error: '글을 찾을 수 없어요.'});
  res.json(toPost(row));
});

router.post('/posts', requireAdmin, (req, res) => {
  const {data, error} = validate(req.body);
  if (error) return res.status(400).json({error});
  const id = `post-${Date.now().toString(36)}`;
  db.prepare('INSERT INTO posts (id, title, date, tags, summary, content) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, data.title, data.date, JSON.stringify(data.tags), data.summary, data.content);
  res.status(201).json(toPost(findPost.get(id)));
});

router.put('/posts/:id', requireAdmin, (req, res) => {
  const {data, error} = validate(req.body);
  if (error) return res.status(400).json({error});
  const {changes} = db.prepare(`UPDATE posts SET title = ?, date = ?, tags = ?, summary = ?, content = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(data.title, data.date, JSON.stringify(data.tags), data.summary, data.content, req.params.id);
  if (!changes) return res.status(404).json({error: '글을 찾을 수 없어요.'});
  res.json(toPost(findPost.get(req.params.id)));
});

router.delete('/posts/:id', requireAdmin, (req, res) => {
  const {changes} = db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  if (!changes) return res.status(404).json({error: '글을 찾을 수 없어요.'});
  res.status(204).end();
});

export default router;
