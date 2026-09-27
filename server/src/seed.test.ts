import { describe, it, expect } from 'vitest';
import { openDb, applySchema } from './db';
import { seedDb, seedIfEmpty } from './seed';

function freshDb() {
  const db = openDb(':memory:');
  applySchema(db);
  return db;
}

describe('seedDb', () => {
  it('inserts the requested number of users with valid fields', () => {
    const db = freshDb();
    seedDb(db, 100);
    const users = db.prepare('SELECT * FROM users').all() as any[];
    expect(users).toHaveLength(100);
    for (const u of users) {
      expect(u.first_name.length).toBeGreaterThan(0);
      expect(u.age).toBeGreaterThanOrEqual(18);
      expect(u.age).toBeLessThanOrEqual(80);
      expect(u.avatar).toMatch(/^https:\/\//);
    }
  });

  it('gives each user 0 to 10 hobbies', () => {
    const db = freshDb();
    seedDb(db, 100);
    const rows = db
      .prepare('SELECT user_id, COUNT(*) AS n FROM user_hobbies GROUP BY user_id')
      .all() as any[];
    for (const r of rows) expect(r.n).toBeLessThanOrEqual(10);
  });

  it('is deterministic across runs', () => {
    const a = freshDb();
    const b = freshDb();
    seedDb(a, 50);
    seedDb(b, 50);
    expect(a.prepare('SELECT * FROM users').all()).toEqual(
      b.prepare('SELECT * FROM users').all(),
    );
  });
});

describe('seedIfEmpty', () => {
  it('seeds an empty db and skips a populated one', () => {
    const db = freshDb();
    seedIfEmpty(db);
    const n = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as any).c;
    expect(n).toBeGreaterThan(0);
    seedIfEmpty(db);
    expect((db.prepare('SELECT COUNT(*) AS c FROM users').get() as any).c).toBe(n);
  });
});
