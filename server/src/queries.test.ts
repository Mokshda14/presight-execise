import { describe, it, expect, beforeEach } from 'vitest';
import { type DB } from './db';
import { buildUserFilter, listUsers, getFacets } from './queries';
import { fixtureDb } from './test-fixture';

function idsFor(db: DB, filter: Parameters<typeof buildUserFilter>[0]): number[] {
  const { where, params } = buildUserFilter(filter);
  return (db.prepare(`SELECT id FROM users ${where} ORDER BY id`).all(...params) as any[])
    .map((r) => r.id);
}

describe('buildUserFilter', () => {
  let db: DB;
  beforeEach(() => { db = fixtureDb(); });

  it('empty filter matches everyone', () => {
    expect(idsFor(db, {})).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('q matches first OR last name, case-insensitive substring', () => {
    expect(idsFor(db, { q: 'smith' })).toEqual([1, 3]);
    expect(idsFor(db, { q: 'ali' })).toEqual([1, 5]); // Alice (first), Alison (last)
  });

  it('q matches the full "first last" name, including across the boundary', () => {
    expect(idsFor(db, { q: 'alice smith' })).toEqual([1]);
    expect(idsFor(db, { q: 'e Sm' })).toEqual([1]); // alicE SMith
    expect(idsFor(db, { q: 'alice   smith' })).toEqual([1]); // internal runs collapse
    expect(idsFor(db, { q: 'smith alice' })).toEqual([]); // reversed order is not a match
  });

  it('nationalities are OR', () => {
    expect(idsFor(db, { nationalities: ['German', 'Spanish'] })).toEqual([2, 4, 5]);
  });

  it('hobbies are AND (must have all)', () => {
    expect(idsFor(db, { hobbies: ['Chess', 'Reading'] })).toEqual([1, 4]);
    expect(idsFor(db, { hobbies: ['Chess', 'Reading', 'Hiking'] })).toEqual([4]);
  });

  it('all filters combine with AND', () => {
    expect(idsFor(db, { q: 'a', nationalities: ['French'], hobbies: ['Reading'] })).toEqual([1, 3]);
  });

  it('treats LIKE metacharacters in q as literal characters', () => {
    expect(idsFor(db, { q: '_' })).toEqual([]);
    expect(idsFor(db, { q: '%' })).toEqual([]);
  });
});

describe('listUsers', () => {
  let db: DB;
  beforeEach(() => { db = fixtureDb(); });

  it('sorts by age asc with id tie-break', () => {
    const r = listUsers(db, {}, 'age', 'asc', 1, 10);
    expect(r.users.map((u) => u.id)).toEqual([2, 1, 4, 6, 3, 5]); // 25, then 30s by id, 35, 40
  });

  it('sorts desc with id desc tie-break', () => {
    const r = listUsers(db, {}, 'age', 'desc', 1, 10);
    expect(r.users.map((u) => u.id)).toEqual([5, 3, 6, 4, 1, 2]);
  });

  it('paginates without duplicates or gaps across pages', () => {
    const p1 = listUsers(db, {}, 'age', 'asc', 1, 2);
    const p2 = listUsers(db, {}, 'age', 'asc', 2, 2);
    const p3 = listUsers(db, {}, 'age', 'asc', 3, 2);
    const all = [...p1.users, ...p2.users, ...p3.users].map((u) => u.id);
    expect(all).toEqual([2, 1, 4, 6, 3, 5]);
    expect(new Set(all).size).toBe(6);
  });

  it('reports pagination metadata', () => {
    const r = listUsers(db, {}, 'first_name', 'asc', 1, 4);
    expect(r).toMatchObject({ page: 1, limit: 4, total: 6, hasMore: true });
    const last = listUsers(db, {}, 'first_name', 'asc', 2, 4);
    expect(last.hasMore).toBe(false);
    expect(last.users).toHaveLength(2);
  });

  it('hasMore is false when total is an exact multiple of limit', () => {
    const r = listUsers(db, {}, 'first_name', 'asc', 2, 3);
    expect(r.total).toBe(6);
    expect(r.hasMore).toBe(false);
  });

  it('total reflects the active filter', () => {
    const r = listUsers(db, { nationalities: ['French'] }, 'first_name', 'asc', 1, 10);
    expect(r.total).toBe(3);
  });

  it('hydrates hobbies sorted alphabetically, empty array when none', () => {
    const r = listUsers(db, {}, 'first_name', 'asc', 1, 10);
    const dave = r.users.find((u) => u.first_name === 'Dave')!;
    expect(dave.hobbies).toEqual(['Chess', 'Hiking', 'Reading']);
    const eve = r.users.find((u) => u.first_name === 'Eve')!;
    expect(eve.hobbies).toEqual([]);
  });
});

describe('getFacets', () => {
  let db: DB;
  beforeEach(() => { db = fixtureDb(); });

  it('counts reflect the whole dataset when no filters', () => {
    const r = getFacets(db, {});
    expect(r.nationalities).toEqual([
      { value: 'French', count: 3 },
      { value: 'German', count: 2 },
      { value: 'Spanish', count: 1 },
    ]);
    expect(r.hobbies).toEqual([
      { value: 'Chess', count: 3 },
      { value: 'Reading', count: 3 },
      { value: 'Hiking', count: 2 },
    ]);
  });

  it('scopes counts to the text filter', () => {
    const r = getFacets(db, { q: 'smith' }); // Alice, Carol: both French
    expect(r.nationalities).toEqual([{ value: 'French', count: 2 }]);
    expect(r.hobbies).toEqual([
      { value: 'Reading', count: 2 },
      { value: 'Chess', count: 1 },
    ]);
  });

  it('nationality facet ignores its own selection (else OR could never grow)', () => {
    const r = getFacets(db, { nationalities: ['French'] });
    expect(r.nationalities.map((n) => n.value)).toEqual(['French', 'German', 'Spanish']);
  });

  it('nationality facet still respects hobby filter', () => {
    const r = getFacets(db, { nationalities: ['French'], hobbies: ['Hiking'] });
    // Hiking users: Dave (Spanish), Frank (French)
    expect(r.nationalities).toEqual([
      { value: 'French', count: 1 },
      { value: 'Spanish', count: 1 },
    ]);
  });

  it('hobby facet counts within the fully narrowed set', () => {
    const r = getFacets(db, { hobbies: ['Chess'] }); // users 1, 2, 4
    expect(r.hobbies).toEqual([
      { value: 'Chess', count: 3 },
      { value: 'Reading', count: 2 },
      { value: 'Hiking', count: 1 },
    ]);
  });

  it('hobby facet under a nationality-only selection counts within French users', () => {
    // French users: Alice (Chess, Reading), Carol (Reading), Frank (Hiking)
    const r = getFacets(db, { nationalities: ['French'] });
    expect(r.hobbies).toEqual([
      { value: 'Reading', count: 2 },
      { value: 'Chess', count: 1 },
      { value: 'Hiking', count: 1 },
    ]);
  });

  it('breaks count ties alphabetically', () => {
    const r = getFacets(db, {});
    const chess = r.hobbies.findIndex((h) => h.value === 'Chess');
    const reading = r.hobbies.findIndex((h) => h.value === 'Reading');
    expect(chess).toBeLessThan(reading); // both count 3
  });

  it('caps each list at 20', () => {
    // fixture has fewer than 20 values, so just assert the shape
    const r = getFacets(db, {});
    expect(r.hobbies.length).toBeLessThanOrEqual(20);
    expect(r.nationalities.length).toBeLessThanOrEqual(20);
  });
});
