import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'data', 'users.json');

function readFileStore() {
  if (!existsSync(filePath)) return [];
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeFileStore(rows) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(rows, null, 2));
}

async function createPostgres() {
  const pg = await import('pg');
  const connectionString = process.env.DATABASE_URL;
  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new pg.default.Pool({
    connectionString,
    ssl: local ? false : { rejectUnauthorized: false },
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS zap_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  return {
    async list() {
      const result = await pool.query(`SELECT id, name, email FROM zap_users ORDER BY name ASC LIMIT 200`);
      return result.rows;
    },
    async save(user) {
      await pool.query(`
        INSERT INTO zap_users (id, name, email, seen)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, seen = NOW()
      `, [user.id, user.name, user.email || '']);
    },
  };
}

let storePromise;

function store() {
  if (!storePromise) {
    storePromise = process.env.DATABASE_URL
      ? createPostgres()
      : Promise.resolve({
        async list() {
          return readFileStore();
        },
        async save(user) {
          const rows = readFileStore().filter((row) => row.id !== user.id);
          rows.push({ id: user.id, name: user.name, email: user.email || '' });
          writeFileStore(rows);
        },
      });
  }
  return storePromise;
}

export async function rememberUser(user) {
  if (!user?.id || !user?.name) return;
  const users = await store();
  await users.save({ id: user.id, name: user.name, email: user.email || '' });
}

export async function listUsers() {
  const users = await store();
  return users.list();
}
