import { openDb, applySchema, type DB } from './db.js';

// Fixture: 6 users with known attributes.
// id | name            | age | nationality | hobbies
// 1  | Alice Smith     | 30  | French      | Chess, Reading
// 2  | Bob Jones       | 25  | German      | Chess
// 3  | Carol Smith     | 35  | French      | Reading
// 4  | Dave Miller     | 30  | Spanish     | Chess, Reading, Hiking
// 5  | Eve Alison      | 40  | German      | (none)
// 6  | Frank Stone     | 30  | French      | Hiking
export function fixtureDb(): DB {
  const db = openDb(':memory:');
  applySchema(db);
  const users: [string, string, number, string][] = [
    ['Alice', 'Smith', 30, 'French'],
    ['Bob', 'Jones', 25, 'German'],
    ['Carol', 'Smith', 35, 'French'],
    ['Dave', 'Miller', 30, 'Spanish'],
    ['Eve', 'Alison', 40, 'German'],
    ['Frank', 'Stone', 30, 'French'],
  ];
  const iu = db.prepare(
    "INSERT INTO users (avatar, first_name, last_name, age, nationality) VALUES ('https://x/a.svg', ?, ?, ?, ?)",
  );
  users.forEach((u) => iu.run(...u));
  const hobbyNames = ['Chess', 'Reading', 'Hiking'];
  const ih = db.prepare('INSERT INTO hobbies (name) VALUES (?)');
  hobbyNames.forEach((h) => ih.run(h));
  const link = db.prepare(
    'INSERT INTO user_hobbies (user_id, hobby_id) SELECT ?, id FROM hobbies WHERE name = ?',
  );
  const assign: [number, string][] = [
    [1, 'Chess'], [1, 'Reading'],
    [2, 'Chess'],
    [3, 'Reading'],
    [4, 'Chess'], [4, 'Reading'], [4, 'Hiking'],
    [6, 'Hiking'],
  ];
  assign.forEach(([uid, h]) => link.run(uid, h));
  return db;
}
