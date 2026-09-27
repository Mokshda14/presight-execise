import type { DB } from './db.js';
import type { SortField, SortDir, User, UsersResponse, UserFilter, FacetsResponse, FacetValue } from './types.js';

export function buildUserFilter(f: UserFilter): {
  where: string;
  params: (string | number)[];
} {
  const conds: string[] = [];
  const params: (string | number)[] = [];

  if (f.q) {
    conds.push(
      "(first_name LIKE ? ESCAPE '\\' OR last_name LIKE ? ESCAPE '\\' OR (first_name || ' ' || last_name) LIKE ? ESCAPE '\\')",
    );
    // collapse whitespace so "Ada  Lovelace" still matches the concatenated form
    const like = `%${f.q.replace(/\s+/g, ' ').replace(/[\\%_]/g, '\\$&')}%`;
    params.push(like, like, like);
  }
  if (f.nationalities?.length) {
    conds.push(`nationality IN (${f.nationalities.map(() => '?').join(',')})`);
    params.push(...f.nationalities);
  }
  if (f.hobbies?.length) {
    conds.push(`id IN (
      SELECT uh.user_id FROM user_hobbies uh
      JOIN hobbies h ON h.id = uh.hobby_id
      WHERE h.name IN (${f.hobbies.map(() => '?').join(',')})
      GROUP BY uh.user_id
      HAVING COUNT(DISTINCT h.id) = ?
    )`);
    params.push(...f.hobbies, f.hobbies.length);
  }

  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

const SORT_COLUMNS: Record<SortField, string> = {
  first_name: 'first_name',
  last_name: 'last_name',
  age: 'age',
  nationality: 'nationality',
};

export function listUsers(
  db: DB,
  f: UserFilter,
  sort: SortField,
  dir: SortDir,
  page: number,
  limit: number,
): UsersResponse {
  const { where, params } = buildUserFilter(f);
  const col = SORT_COLUMNS[sort];
  const direction = dir === 'desc' ? 'DESC' : 'ASC';

  const { c: total } = db
    .prepare(`SELECT COUNT(*) AS c FROM users ${where}`)
    .get(...params) as { c: number };

  const rows = db
    .prepare(
      `SELECT id, avatar, first_name, last_name, age, nationality
       FROM users ${where}
       ORDER BY ${col} ${direction}, id ${direction}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, (page - 1) * limit) as Omit<User, 'hobbies'>[];

  const hobbiesById = new Map<number, string[]>();
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const hobbyRows = db
      .prepare(
        `SELECT uh.user_id AS userId, h.name
         FROM user_hobbies uh JOIN hobbies h ON h.id = uh.hobby_id
         WHERE uh.user_id IN (${ids.map(() => '?').join(',')})
         ORDER BY h.name`,
      )
      .all(...ids) as { userId: number; name: string }[];
    for (const { userId, name } of hobbyRows) {
      const list = hobbiesById.get(userId) ?? [];
      list.push(name);
      hobbiesById.set(userId, list);
    }
  }

  const users: User[] = rows.map((r) => ({ ...r, hobbies: hobbiesById.get(r.id) ?? [] }));
  return { users, page, limit, total, hasMore: page * limit < total };
}

export function getFacets(db: DB, f: UserFilter): FacetsResponse {
  // own selection excluded, otherwise the OR group could never grow
  const nat = buildUserFilter({ q: f.q, hobbies: f.hobbies });
  const nationalities = db
    .prepare(
      `SELECT nationality AS value, COUNT(*) AS count
       FROM users ${nat.where}
       GROUP BY nationality
       ORDER BY count DESC, value ASC
       LIMIT 20`,
    )
    .all(...nat.params) as FacetValue[];

  // counted inside the fully narrowed set, since hobbies are AND
  const full = buildUserFilter(f);
  const hobbies = db
    .prepare(
      `SELECT h.name AS value, COUNT(*) AS count
       FROM user_hobbies uh
       JOIN hobbies h ON h.id = uh.hobby_id
       WHERE uh.user_id IN (SELECT id FROM users ${full.where})
       GROUP BY h.id
       ORDER BY count DESC, value ASC
       LIMIT 20`,
    )
    .all(...full.params) as FacetValue[];

  return { hobbies, nationalities };
}
