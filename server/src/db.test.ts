import { describe, it, expect } from 'vitest';
import { openDb, applySchema } from './db';

describe('applySchema', () => {
  it('creates users, hobbies, user_hobbies tables', () => {
    const db = openDb(':memory:');
    applySchema(db);
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r: any) => r.name);
    expect(names).toEqual(expect.arrayContaining(['hobbies', 'user_hobbies', 'users']));
  });

  it('is idempotent', () => {
    const db = openDb(':memory:');
    applySchema(db);
    expect(() => applySchema(db)).not.toThrow();
  });
});
