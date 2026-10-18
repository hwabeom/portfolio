import {mkdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import vm from 'node:vm';
import {config} from './config.js';

mkdirSync(config.dataDir, {recursive: true});

export const db = new DatabaseSync(path.join(config.dataDir, 'portfolio.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS posts (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    date       TEXT NOT NULL,
    tags       TEXT NOT NULL DEFAULT '[]',
    summary    TEXT NOT NULL DEFAULT '',
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    mailed     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// 처음 실행할 때만 public/posts.js 의 기본 글을 DB에 넣는다
function seedPosts() {
  if (db.prepare('SELECT COUNT(*) AS n FROM posts').get().n > 0) return;
  const source = readFileSync(path.join(config.publicDir, 'posts.js'), 'utf8');
  const seed = vm.runInNewContext(`${source}\nSEED_POSTS`);
  const insert = db.prepare('INSERT INTO posts (id, title, date, tags, summary, content) VALUES (?, ?, ?, ?, ?, ?)');
  db.exec('BEGIN');
  for (const p of seed) insert.run(p.id, p.title, p.date, JSON.stringify(p.tags), p.summary, p.content);
  db.exec('COMMIT');
  console.log(`[db] 기본 글 ${seed.length}개를 넣었어요.`);
}

seedPosts();
