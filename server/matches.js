import crypto from 'crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { currentUser } from './auth.js';
import { listUsers } from './users.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'data', 'matches.json');
const historyPath = path.join(root, 'data', 'history.json');
const dictCache = new Map();

function readFileStore() {
  if (!existsSync(filePath)) return [];
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function readHistory() {
  if (!existsSync(historyPath)) return [];
  try {
    const data = JSON.parse(readFileSync(historyPath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeFileStore(rows) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(rows, null, 2));
}

function writeHistory(rows) {
  mkdirSync(path.dirname(historyPath), { recursive: true });
  writeFileSync(historyPath, JSON.stringify(rows, null, 2));
}

async function dictionary(modeId) {
  if (dictCache.has(modeId)) return dictCache.get(modeId);
  const file = modeId === 'en-es' ? 'en-es.json' : 'es-en.json';
  const raw = readFileSync(path.join(root, 'public', 'data', file), 'utf8');
  const data = JSON.parse(raw);
  dictCache.set(modeId, data);
  return data;
}

function code() {
  return crypto.randomBytes(4).toString('hex');
}

function activePlayers(match) {
  return match.players.filter((player) => !player.left);
}

function cleanBoard(body, dict, skillId) {
  const words = [];
  const seen = new Set();
  for (const item of body?.words || []) {
    const word = String(item.word || '').toUpperCase().replace(/[^A-ZÑ]/g, '');
    if (!word || seen.has(word) || !Object.prototype.hasOwnProperty.call(dict, word)) continue;
    if (word.length < 3 || word.length > 7) continue;
    seen.add(word);
    const claimed = Number(item.points) || 0;
    const max = skillId * word.length * 10 * 10 + skillId * 100;
    words.push({ word, points: Math.max(0, Math.min(claimed, max)) });
  }
  const grid = Array.isArray(body?.grid) ? body.grid.slice(0, 10).map((row) => (
    Array.isArray(row) ? row.slice(0, 7).map((letter) => String(letter || '').slice(0, 1).toUpperCase()) : []
  )) : [];
  return { words, grid };
}

function scoringPlayers(match) {
  return match.players.filter((player) => !player.left || player.board);
}

function scoreRound(match) {
  const counts = new Map();
  scoringPlayers(match).forEach((player) => {
    (player.board?.words || []).forEach((item) => {
      counts.set(item.word, (counts.get(item.word) || 0) + 1);
    });
  });
  scoringPlayers(match).forEach((player) => {
    const words = (player.board?.words || []).map((item) => ({
      ...item,
      struck: (counts.get(item.word) || 0) > 1,
    }));
    const roundScore = words.reduce((sum, item) => sum + (item.struck ? 0 : item.points), 0);
    player.board = { ...(player.board || {}), words, grid: player.board?.grid || [] };
    player.roundScore = roundScore;
  });
}

function standings(match) {
  return [...match.players].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function publicMatch(match, userId) {
  const ranked = standings(match);
  return {
    id: match.id,
    hostId: match.hostId,
    hostName: match.hostName || '',
    modeId: match.modeId,
    skillId: match.skillId,
    rounds: match.rounds,
    seats: match.seats,
    round: match.round,
    phase: match.phase,
    seed: match.seed,
    finisher: match.finisher,
    you: userId || '',
    invites: match.invites,
    players: ranked.map((player, index) => ({
      userId: player.userId,
      name: player.name,
      ready: player.ready,
      left: player.left,
      finished: player.finished,
      total: player.total,
      roundScore: player.roundScore,
      board: player.board,
      place: index + 1,
    })),
  };
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
    CREATE TABLE IF NOT EXISTS zap_matches (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS zap_history (
      id TEXT PRIMARY KEY,
      played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      data JSONB NOT NULL
    )
  `);
  return {
    async all() {
      const result = await pool.query(`SELECT data FROM zap_matches ORDER BY updated_at DESC LIMIT 80`);
      return result.rows.map((row) => row.data);
    },
    async save(match) {
      await pool.query(`
        INSERT INTO zap_matches (id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, [match.id, JSON.stringify(match)]);
    },
    async archive(row) {
      await pool.query(`
        INSERT INTO zap_history (id, played_at, data) VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (id) DO NOTHING
      `, [row.id, row.playedAt, JSON.stringify(row)]);
    },
    async history() {
      const result = await pool.query(`SELECT data FROM zap_history ORDER BY played_at DESC LIMIT 30`);
      return result.rows.map((row) => row.data);
    },
  };
}

let storePromise;

function store() {
  if (!storePromise) {
    storePromise = process.env.DATABASE_URL
      ? createPostgres()
      : Promise.resolve({
        async all() {
          return readFileStore();
        },
        async save(match) {
          const rows = readFileStore().filter((row) => row.id !== match.id);
          rows.unshift(match);
          writeFileStore(rows.slice(0, 80));
        },
        async archive(row) {
          const rows = readHistory().filter((item) => item.id !== row.id);
          rows.unshift(row);
          writeHistory(rows.slice(0, 30));
        },
        async history() {
          return readHistory();
        },
      });
  }
  return storePromise;
}

async function load(id) {
  const matches = await store();
  return (await matches.all()).find((match) => match.id === id) || null;
}

async function save(match) {
  const matches = await store();
  if (match.phase === 'podium' && !match.savedHistory) {
    match.savedHistory = true;
    await matches.archive(historyRow(match));
  }
  await matches.save(match);
  return match;
}

function historyRow(match) {
  const players = standings(match).map((player, index) => ({
    name: player.name,
    total: player.total || 0,
    place: index + 1,
  }));
  return {
    id: match.id,
    playedAt: match.createdAt || new Date().toISOString(),
    modeId: match.modeId,
    skillId: match.skillId,
    rounds: match.rounds,
    players,
  };
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function requireUser(req) {
  const user = currentUser(req);
  if (!user) fail('Entra con Google para competir', 401);
  return user;
}

export function matchRoutes(app) {
  app.get('/api/users', async (req, res) => {
    try {
      requireUser(req);
      const users = await listUsers();
      res.json(users.map((user) => ({ id: user.id, name: user.name })));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo leer la lista' });
    }
  });

  app.get('/api/invites', async (req, res) => {
    try {
      const user = requireUser(req);
      const matches = await store();
      const rows = (await matches.all()).filter((match) => match.phase === 'lobby' && match.invites.some((invite) => invite.userId === user.id && invite.status === 'pending'));
      res.json(rows.map((match) => publicMatch(match, user.id)));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudieron leer las invitaciones' });
    }
  });

  app.get('/api/history', async (_req, res) => {
    try {
      const matches = await store();
      const archived = await matches.history();
      const seen = new Set(archived.map((row) => row.id));
      const older = (await matches.all())
        .filter((match) => match.phase === 'podium' && !seen.has(match.id))
        .map((match) => historyRow(match));
      res.json([...archived, ...older].slice(0, 30));
    } catch {
      res.status(500).json({ error: 'No se pudo leer el historial' });
    }
  });

  app.post('/api/matches', async (req, res) => {
    try {
      const user = requireUser(req);
      const seats = Math.min(6, Math.max(2, Number(req.body?.seats) || 2));
      const rounds = Math.min(5, Math.max(1, Number(req.body?.rounds) || 1));
      const modeId = req.body?.modeId === 'en-es' ? 'en-es' : 'es-en';
      const skillId = [1, 2, 3].includes(Number(req.body?.skillId)) ? Number(req.body.skillId) : 2;
      const match = {
        id: code(),
        hostId: user.id,
        hostName: user.name,
        modeId,
        skillId,
        rounds,
        seats,
        round: 1,
        phase: 'lobby',
        seed: '',
        finisher: null,
        invites: [],
        players: [{
          userId: user.id,
          name: user.name,
          ready: false,
          left: false,
          finished: false,
          total: 0,
          roundScore: 0,
          board: null,
        }],
        createdAt: new Date().toISOString(),
      };
      await save(match);
      res.status(201).json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo crear la partida' });
    }
  });

  app.get('/api/matches/:id', async (req, res) => {
    try {
      const match = await load(req.params.id);
      if (!match) fail('La partida no existe', 404);
      const user = currentUser(req);
      res.json(publicMatch(match, user?.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo leer la partida' });
    }
  });

  app.post('/api/matches/:id/join', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match) fail('La partida no existe', 404);
      if (match.phase !== 'lobby') fail('La partida ya comenzó');
      match.invites = match.invites.filter((invite) => invite.userId !== user.id);
      let player = match.players.find((item) => item.userId === user.id);
      if (player) player.left = false;
      else if (activePlayers(match).length >= match.seats) fail('La partida ya está llena');
      else {
        match.players.push({
          userId: user.id,
          name: user.name,
          ready: false,
          left: false,
          finished: false,
          total: 0,
          roundScore: 0,
          board: null,
        });
      }
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo entrar' });
    }
  });

  app.post('/api/matches/:id/invite', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match || match.hostId !== user.id) fail('Solo el anfitrión invita', 403);
      if (match.phase !== 'lobby') fail('La partida ya comenzó');
      const target = String(req.body?.userId || '');
      const name = String(req.body?.name || '').slice(0, 20);
      if (!target || !name) fail('Elige un jugador');
      if (match.players.some((player) => player.userId === target && !player.left)) fail('Ese jugador ya está en la sala');
      const taken = activePlayers(match).length + match.invites.filter((invite) => invite.status === 'pending').length;
      if (taken >= match.seats) fail('No hay lugares libres');
      match.invites = match.invites.filter((invite) => invite.userId !== target);
      match.invites.push({ userId: target, name, status: 'pending' });
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo invitar' });
    }
  });

  app.post('/api/matches/:id/invite/answer', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match) fail('La partida no existe', 404);
      const invite = match.invites.find((item) => item.userId === user.id && item.status === 'pending');
      if (!invite) fail('No tienes esa invitación');
      if (req.body?.accept && match.phase === 'lobby') {
        invite.status = 'accepted';
        if (!match.players.some((player) => player.userId === user.id)) {
          if (activePlayers(match).length >= match.seats) fail('La partida ya está llena');
          match.players.push({
            userId: user.id,
            name: user.name,
            ready: false,
            left: false,
            finished: false,
            total: 0,
            roundScore: 0,
            board: null,
          });
        }
      } else invite.status = 'declined';
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo responder' });
    }
  });

  app.post('/api/matches/:id/remove', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match || match.hostId !== user.id) fail('Solo el anfitrión puede quitar invitaciones', 403);
      const target = String(req.body?.userId || '');
      match.invites = match.invites.filter((invite) => invite.userId !== target);
      const player = match.players.find((item) => item.userId === target && item.userId !== match.hostId);
      if (player) player.left = true;
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo quitar' });
    }
  });

  app.post('/api/matches/:id/ready', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match) fail('La partida no existe', 404);
      const player = activePlayers(match).find((item) => item.userId === user.id);
      if (!player) fail('No estás en esta partida', 403);
      player.ready = true;
      const pending = match.invites.some((invite) => invite.status === 'pending');
      const room = activePlayers(match);
      if (match.phase === 'lobby' && !pending && room.length >= 2 && room.every((item) => item.ready)) {
        match.phase = 'playing';
        match.seed = `${match.id}|${match.round}|${match.modeId}`;
        match.finisher = null;
        room.forEach((item) => {
          item.ready = false;
          item.finished = false;
          item.roundScore = 0;
          item.board = null;
        });
      }
      if (match.phase === 'review' && room.length >= 1 && room.every((item) => item.ready)) {
        match.players.forEach((item) => {
          item.total += item.roundScore || 0;
        });
        room.forEach((item) => {
          item.ready = false;
          item.finished = false;
          item.roundScore = 0;
          item.board = null;
        });
        if (match.round >= match.rounds) match.phase = 'podium';
        else {
          match.round += 1;
          match.phase = 'playing';
          match.seed = `${match.id}|${match.round}|${match.modeId}`;
          match.finisher = null;
        }
      }
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo marcar listo' });
    }
  });

  app.post('/api/matches/:id/board', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match) fail('La partida no existe', 404);
      const player = match.players.find((item) => item.userId === user.id && !item.left);
      if (!player) fail('No estás en esta partida', 403);
      if (match.phase === 'playing' || match.phase === 'review') {
        const dict = await dictionary(match.modeId);
        player.board = cleanBoard(req.body, dict, match.skillId);
        if (req.body?.finish && match.phase === 'playing' && !match.finisher) {
          match.finisher = { userId: user.id, name: user.name };
          match.phase = 'review';
          player.finished = true;
          scoreRound(match);
        } else if (match.phase === 'review') {
          player.finished = true;
          scoreRound(match);
        }
      }
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo guardar el tablero' });
    }
  });

  app.post('/api/matches/:id/leave', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match) fail('La partida no existe', 404);
      const player = match.players.find((item) => item.userId === user.id);
      if (player) {
        player.left = true;
        if (match.phase === 'playing' || match.phase === 'review') scoreRound(match);
      }
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo salir' });
    }
  });
}
