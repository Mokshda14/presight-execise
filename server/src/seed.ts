import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { faker } from '@faker-js/faker';
import { openDb, applySchema, type DB } from './db.js';

const HOBBIES = [
  'Reading', 'Chess', 'Hiking', 'Cycling', 'Swimming', 'Running', 'Yoga',
  'Painting', 'Drawing', 'Photography', 'Cooking', 'Baking', 'Gardening',
  'Fishing', 'Camping', 'Climbing', 'Surfing', 'Skiing', 'Snowboarding',
  'Skateboarding', 'Dancing', 'Singing', 'Guitar', 'Piano', 'Violin',
  'Drums', 'Knitting', 'Sewing', 'Pottery', 'Woodworking', 'Origami',
  'Calligraphy', 'Journaling', 'Blogging', 'Podcasting', 'Gaming',
  'Board Games', 'Puzzles', 'Astronomy', 'Birdwatching', 'Traveling',
  'Languages', 'Volunteering', 'Meditation', 'Martial Arts', 'Boxing',
  'Tennis', 'Badminton', 'Basketball', 'Football', 'Volleyball',
  'Table Tennis', 'Golf', 'Archery', 'Fencing', 'Rowing', 'Sailing',
  'Scuba Diving', 'Magic Tricks', 'Collecting Stamps',
];

const NATIONALITIES = [
  'American', 'British', 'Canadian', 'Australian', 'German', 'French',
  'Italian', 'Spanish', 'Portuguese', 'Dutch', 'Belgian', 'Swiss',
  'Austrian', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Irish',
  'Polish', 'Czech', 'Greek', 'Turkish', 'Russian', 'Ukrainian',
  'Indian', 'Chinese', 'Japanese', 'Korean', 'Vietnamese', 'Thai',
  'Indonesian', 'Filipino', 'Brazilian', 'Argentinian', 'Mexican',
  'Chilean', 'Egyptian', 'Nigerian', 'Kenyan', 'South African',
];

export function seedDb(db: DB, count = 5000): void {
  faker.seed(42);

  const insertHobby = db.prepare('INSERT INTO hobbies (name) VALUES (?)');
  const insertUser = db.prepare(
    'INSERT INTO users (avatar, first_name, last_name, age, nationality) VALUES (?, ?, ?, ?, ?)',
  );
  const insertUserHobby = db.prepare(
    'INSERT INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)',
  );

  db.transaction(() => {
    const hobbyIds = HOBBIES.map((name) => Number(insertHobby.run(name).lastInsertRowid));
    for (let i = 0; i < count; i++) {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      const avatar = `https://api.dicebear.com/10.x/clay/svg?seed=${i}`;
      const age = faker.number.int({ min: 18, max: 80 });
      const nationality = faker.helpers.arrayElement(NATIONALITIES);
      const userId = Number(insertUser.run(avatar, first, last, age, nationality).lastInsertRowid);
      const n = faker.number.int({ min: 0, max: 10 });
      for (const hobbyId of faker.helpers.arrayElements(hobbyIds, n)) {
        insertUserHobby.run(userId, hobbyId);
      }
    }
  })();
}

export function seedIfEmpty(db: DB): void {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  if (c === 0) seedDb(db);
}

// CLI entry: yarn workspace presight-server seed
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'users.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = openDb(dbPath);
  applySchema(db);
  seedDb(db);
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  console.log(`Seeded ${c} users into ${dbPath}`);
}
