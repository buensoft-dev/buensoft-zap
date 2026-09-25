import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'data', 'scores.json');
const TOP = 10;
const STORED = 300;

function boardSkill(skill) {
  return skill === 'Experto' ? 'Avanzado' : skill;
}

function cleanName(value) {
  return String(value || '').replace(/[\u0000-\u001F<>]/g, '').trim().slice(0, 40);
}

function playerName(value) {
  const name = String(value || '').replace(/[^\p{L} ]/gu, '').trim().replace(/ {2,}/g, ' ');
  const letters = name.replace(/ /g, '');
  if (!letters || letters.length > 20) {
    const error = new Error('El nombre puede tener máximo 20 letras');
    error.status = 400;
    throw error;
  }
  return name;
}

function asEntry(body) {
  const name = playerName(body.name);
  const points = Number(body.points);
  const marker = Number(body.marker);
  const level = Number(body.level);
  if (!name) {
    const error = new Error('Escribe tu nombre');
    error.status = 400;
    throw error;
  }
  if (!Number.isInteger(points) || points < 0 || points > 1000000) {
    const error = new Error('Puntuación no válida');
    error.status = 400;
    throw error;
  }
  return {
    name,
    points,
    marker: Number.isInteger(marker) ? marker : 0,
    level: Number.isInteger(level) && level > 0 ? level : 1,
    skill: cleanName(body.skill) || 'Intermedio',
    mode: cleanName(body.mode) || 'Español → Inglés',
  };
}

function rank(rows) {
  return [...rows]
    .sort((a, b) => b.points - a.points || b.level - a.level || String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(0, TOP);
}

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
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER NOT NULL,
      marker INTEGER NOT NULL,
      level INTEGER NOT NULL,
      skill TEXT NOT NULL,
      mode TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  return {
    async list() {
      const result = await pool.query(`
        SELECT id, name, points, marker, level, skill, mode, created_at AS "createdAt"
        FROM scores
        ORDER BY points DESC, level DESC, created_at ASC
        LIMIT $1
      `, [STORED]);
      return result.rows;
    },
    async add(entry) {
      const result = await pool.query(`
        INSERT INTO scores (name, points, marker, level, skill, mode)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, points, marker, level, skill, mode, created_at AS "createdAt"
      `, [entry.name, entry.points, entry.marker, entry.level, entry.skill, entry.mode]);
      return result.rows[0];
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
        async add(entry) {
          const rows = readFileStore();
          const saved = { ...entry, id: Date.now(), createdAt: new Date().toISOString() };
          rows.push(saved);
          writeFileStore(rows.slice(-200));
          return saved;
        },
      });
  }
  return storePromise;
}

export async function listScores() {
  const scores = await store();
  return scores.list();
}

export async function addScore(body) {
  const entry = asEntry(body);
  const scores = await store();
  const saved = await scores.add(entry);
  return { saved, scores: await scores.list() };
}
