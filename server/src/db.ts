import Database from 'better-sqlite3';

export type DB = Database.Database;

export function openDb(filePath: string): DB {
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function applySchema(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY,
      avatar      TEXT NOT NULL,
      first_name  TEXT NOT NULL,
      last_name   TEXT NOT NULL,
      age         INTEGER NOT NULL,
      nationality TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hobbies (
      id   INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS user_hobbies (
      user_id  INTEGER NOT NULL REFERENCES users(id),
      hobby_id INTEGER NOT NULL REFERENCES hobbies(id),
      PRIMARY KEY (user_id, hobby_id)
    );
    CREATE INDEX IF NOT EXISTS idx_users_first_name  ON users(first_name);
    CREATE INDEX IF NOT EXISTS idx_users_last_name   ON users(last_name);
    CREATE INDEX IF NOT EXISTS idx_users_age         ON users(age);
    CREATE INDEX IF NOT EXISTS idx_users_nationality ON users(nationality);
    CREATE INDEX IF NOT EXISTS idx_user_hobbies_hobby ON user_hobbies(hobby_id, user_id);
  `);
}
