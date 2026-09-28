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

const IDLE_MS = 60 * 1000;
const MATCH_COOKIE = 'zap_match';

function activePlayers(match) {
  return match.players.filter((player) => !player.left);
}

function blankPlayer(user) {
  return {
    userId: user.id,
    name: user.name,
    ready: false,
    replay: false,
    left: false,
    quit: false,
    idle: false,
    finished: false,
    total: 0,
    roundScore: 0,
    board: null,
    lastSeen: Date.now(),
  };
}

function pushNotice(match, text, userId) {
  const notices = Array.isArray(match.notices) ? match.notices : [];
  notices.push({
    id: crypto.randomBytes(4).toString('hex'),
    text,
    userId: userId || '',
    at: Date.now(),
  });
  match.notices = notices.slice(-8);
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  const found = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!found) return '';
  return decodeURIComponent(found.slice(name.length + 1));
}

function cookieFlags(req, maxAge) {
  const secure = (req.get('x-forwarded-proto') || req.protocol) === 'https';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function setMatchCookie(req, res, id) {
  res.setHeader('Set-Cookie', `${MATCH_COOKIE}=${encodeURIComponent(id)}; ${cookieFlags(req, 12 * 60 * 60)}`);
}

function clearMatchCookie(req, res) {
  res.setHeader('Set-Cookie', `${MATCH_COOKIE}=; ${cookieFlags(req, 0)}`);
}

function matchCookie(req) {
  return readCookie(req, MATCH_COOKIE).replace(/[^a-f0-9]/gi, '').slice(0, 32);
}

function beginPlaying(match, room) {
  const now = Date.now();
  match.phase = 'playing';
  match.seed = `${match.id}|${match.round}|${match.modeId}`;
  match.finisher = null;
  room.forEach((item) => {
    item.ready = false;
    item.finished = false;
    item.roundScore = 0;
    item.board = null;
    item.lastSeen = now;
  });
}

function tryAdvance(match) {
  const room = activePlayers(match);
  const host = room.find((item) => item.userId === match.hostId);
  if (match.phase === 'lobby' && host?.ready && room.length >= match.seats) {
    match.startedAt = Date.now();
    beginPlaying(match, room);
    return;
  }
  if (match.phase === 'review' && room.length >= 1 && room.every((item) => item.ready)) {
    match.players.forEach((item) => {
      item.total += item.roundScore || 0;
      item.roundScore = 0;
      item.board = null;
      item.finished = false;
      item.ready = false;
    });
    if (match.round >= match.rounds) {
      match.phase = 'podium';
      return;
    }
    match.round += 1;
    beginPlaying(match, activePlayers(match));
  }
}

function sweepMatch(match) {
  if (!['lobby', 'playing', 'review'].includes(match.phase)) return false;
  const now = Date.now();
  let changed = false;
  for (const player of match.players) {
    if (player.left || player.quit) continue;
    if (!player.lastSeen) {
      player.lastSeen = now;
      changed = true;
    }
  }
  let expired = false;
  for (const player of match.players) {
    if (player.left || player.quit || !player.lastSeen) continue;
    if (match.phase === 'review' && player.ready) continue;
    if (now - Number(player.lastSeen) < IDLE_MS) continue;
    player.left = true;
    player.idle = true;
    player.ready = false;
    pushNotice(match, `${player.name} salió por inactividad`, player.userId);
    expired = true;
  }
  if (expired) {
    if (match.phase === 'review') scoreRound(match);
    tryAdvance(match);
  }
  return changed || expired;
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
    const max = (skillId * word.length * 10 * 10 + skillId * 100) * 2;
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

function liveScores(match) {
  const counts = new Map();
  match.players.forEach((player) => {
    (player.board?.words || []).forEach((item) => {
      counts.set(item.word, (counts.get(item.word) || 0) + 1);
    });
  });
  const scores = new Map();
  match.players.forEach((player) => {
    const round = (player.board?.words || []).reduce((sum, item) => (
      (counts.get(item.word) || 0) > 1 ? sum : sum + (item.points || 0)
    ), 0);
    scores.set(player.userId, (player.total || 0) + round);
  });
  return scores;
}

function publicMatch(match, userId) {
  const ranked = standings(match);
  const live = liveScores(match);
  return {
    id: match.id,
    hostId: match.hostId,
    hostName: match.hostName || '',
    modeId: match.modeId,
    skillId: match.skillId,
    translate: Boolean(match.translate),
    rounds: match.rounds,
    seats: match.seats,
    startedAt: match.startedAt || 0,
    round: match.round,
    phase: match.phase,
    seed: match.seed,
    finisher: match.finisher,
    you: userId || '',
    invites: match.invites,
    notices: Array.isArray(match.notices) ? match.notices.slice(-8) : [],
    players: ranked.map((player, index) => ({
      userId: player.userId,
      name: player.name,
      ready: player.ready,
      replay: Boolean(player.replay),
      left: player.left,
      quit: Boolean(player.quit),
      idle: Boolean(player.idle),
      finished: player.finished,
      total: player.total,
      roundScore: player.roundScore,
      liveScore: live.get(player.userId) || 0,
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

let matchQueue = Promise.resolve();

function updateMatch(id, mutate) {
  const run = matchQueue.then(async () => {
    const match = await load(id);
    if (!match) return null;
    const keep = await mutate(match);
    if (keep !== false) await save(match);
    return match;
  });
  matchQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function save(match) {
  const matches = await store();
  const lastRound = match.phase === 'podium' || (match.phase === 'review' && match.round >= match.rounds);
  const boardsIn = activePlayers(match).every((player) => player.board || player.finished);
  if (!match.savedHistory && lastRound && (match.phase === 'podium' || boardsIn)) {
    match.savedHistory = true;
    await matches.archive(historyRow(match));
  }
  await matches.save(match);
  return match;
}

function historyRow(match) {
  const score = (player) => (player.total || 0) + (match.phase === 'review' ? (player.roundScore || 0) : 0);
  const players = [...match.players]
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
    .map((player, index) => ({
      name: player.name,
      total: score(player),
      place: index + 1,
    }));
  return {
    id: `${match.id}-${match.playIndex || 1}`,
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
      const seats = Math.min(10, Math.max(2, Number(req.body?.seats) || 2));
      const rounds = Math.min(10, Math.max(2, Number(req.body?.rounds) || 2));
      const modeId = req.body?.modeId === 'en-es' ? 'en-es' : 'es-en';
      const skillId = [1, 2, 3].includes(Number(req.body?.skillId)) ? Number(req.body.skillId) : 2;
      const match = {
        id: code(),
        hostId: user.id,
        hostName: user.name,
        modeId,
        skillId,
        translate: Boolean(req.body?.translate),
        rounds,
        seats,
        round: 1,
        phase: 'lobby',
        seed: '',
        finisher: null,
        invites: [],
        players: [blankPlayer(user)],
        notices: [],
        createdAt: new Date().toISOString(),
      };
      await save(match);
      setMatchCookie(req, res, match.id);
      res.status(201).json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo crear la partida' });
    }
  });

  app.get('/api/matches/active', async (req, res) => {
    try {
      const user = currentUser(req);
      const id = matchCookie(req);
      if (!user || !id) {
        if (id) clearMatchCookie(req, res);
        res.json({ match: null });
        return;
      }
      let match = await load(id);
      if (match) {
        match = await updateMatch(id, (current) => (sweepMatch(current) ? undefined : false));
      }
      const player = match?.players?.find((item) => item.userId === user.id);
      const open = match && ['lobby', 'playing', 'review', 'podium'].includes(match.phase);
      if (!open || !player || player.left || player.quit || player.idle) {
        clearMatchCookie(req, res);
        res.json({ match: null });
        return;
      }
      setMatchCookie(req, res, match.id);
      res.json({ match: publicMatch(match, user.id) });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo recuperar la partida' });
    }
  });

  app.get('/api/matches/:id', async (req, res) => {
    try {
      const existing = await load(req.params.id);
      if (!existing) fail('La partida no existe', 404);
      const match = await updateMatch(req.params.id, (current) => (sweepMatch(current) ? undefined : false));
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
      const existing = await load(req.params.id);
      if (!existing) fail('La partida no existe', 404);
      const match = await updateMatch(req.params.id, (current) => {
        current.invites = (current.invites || []).filter((invite) => invite.userId !== user.id);
        const player = current.players.find((item) => item.userId === user.id);
        if (player?.quit) fail('Saliste de esta partida y no puedes volver', 403);
        if (player?.idle) fail('Se cerró tu lugar por inactividad', 403);
        if (player?.left) fail('Ya no estás en esta partida', 403);
        if (player) return false;
        if (current.phase !== 'lobby') fail('La partida ya comenzó');
        if (activePlayers(current).length >= current.seats) fail('La partida ya está llena');
        current.players.push(blankPlayer(user));
        pushNotice(current, `${user.name} se unió y está esperando`, user.id);
        tryAdvance(current);
      });
      if (!match) fail('La partida no existe', 404);
      setMatchCookie(req, res, match.id);
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
      const pendingOthers = match.invites.filter((invite) => invite.status === 'pending' && invite.userId !== target).length;
      const taken = activePlayers(match).length + pendingOthers;
      if (taken >= match.seats) fail('No hay lugares libres');
      const matches = await store();
      for (const other of await matches.all()) {
        if (other.id === match.id || !Array.isArray(other.invites)) continue;
        const nextInvites = other.invites.filter((invite) => !(invite.userId === target && invite.status === 'pending'));
        if (nextInvites.length === other.invites.length) continue;
        other.invites = nextInvites;
        await matches.save(other);
      }
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
        if (!match.players.some((player) => player.userId === user.id && !player.left && !player.quit)) {
          if (activePlayers(match).length >= match.seats) fail('La partida ya está llena');
          const previous = match.players.find((player) => player.userId === user.id);
          if (previous?.quit || previous?.idle) fail('Ya no puedes entrar a esta partida', 403);
          if (previous) {
            previous.left = false;
            previous.lastSeen = Date.now();
          } else match.players.push(blankPlayer(user));
        }
        await save(match);
        setMatchCookie(req, res, match.id);
        res.json(publicMatch(match, user.id));
        return;
      }
      invite.status = 'declined';
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
      if (player && !player.left) {
        player.left = true;
        player.ready = false;
        pushNotice(match, `${player.name} ya no está en la partida`, player.userId);
        tryAdvance(match);
      }
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo quitar' });
    }
  });

  app.post('/api/matches/:id/ready', async (req, res) => {
    try {
      const user = requireUser(req);
      const existing = await load(req.params.id);
      if (!existing) fail('La partida no existe', 404);
      const match = await updateMatch(req.params.id, (current) => {
        sweepMatch(current);
        const player = activePlayers(current).find((item) => item.userId === user.id);
        if (!player) fail('No estás en esta partida', 403);
        player.ready = true;
        player.lastSeen = Date.now();
        tryAdvance(current);
      });
      if (!match) fail('La partida no existe', 404);
      setMatchCookie(req, res, match.id);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo marcar listo' });
    }
  });

  app.post('/api/matches/:id/replay', async (req, res) => {
    try {
      const user = requireUser(req);
      const match = await load(req.params.id);
      if (!match) fail('La partida no existe', 404);
      const player = activePlayers(match).find((item) => item.userId === user.id);
      if (!player) fail('No estás en esta partida', 403);
      const last = match.phase === 'podium' || (match.phase === 'review' && match.round >= match.rounds);
      if (!last) fail('La partida todavía no termina');
      player.replay = true;
      const room = activePlayers(match);
      if (room.length < 2) {
        await save(match);
        const body = publicMatch(match, user.id);
        body.replayEmpty = true;
        res.json(body);
        return;
      }
      if (room.every((item) => item.replay)) {
        if (match.phase === 'review') {
          match.players.forEach((item) => {
            item.total += item.roundScore || 0;
          });
        }
        match.playIndex = (match.playIndex || 1) + 1;
        match.phase = 'lobby';
        match.round = 1;
        match.finisher = null;
        match.seed = '';
        match.savedHistory = false;
        match.createdAt = new Date().toISOString();
        const now = Date.now();
        room.forEach((item) => {
          item.ready = false;
          item.replay = false;
          item.finished = false;
          item.total = 0;
          item.roundScore = 0;
          item.board = null;
          item.lastSeen = now;
        });
      }
      await save(match);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo volver a jugar' });
    }
  });

  app.post('/api/matches/:id/board', async (req, res) => {
    try {
      const user = requireUser(req);
      const existing = await load(req.params.id);
      if (!existing) fail('La partida no existe', 404);
      const dict = await dictionary(existing.modeId);
      const match = await updateMatch(req.params.id, (current) => {
        sweepMatch(current);
        const player = current.players.find((item) => item.userId === user.id && !item.left && !item.quit);
        if (!player) fail('No estás en esta partida', 403);
        if (current.phase !== 'playing' && current.phase !== 'review') return;
        player.lastSeen = Date.now();
        const nextBoard = cleanBoard(req.body, dict, current.skillId);
        const previous = player.board?.words?.length || 0;
        if (nextBoard.words.length >= previous) player.board = nextBoard;
        if (req.body?.finish && current.phase === 'playing' && !current.finisher) {
          current.finisher = { userId: user.id, name: user.name };
          current.phase = 'review';
          player.finished = true;
          scoreRound(current);
          activePlayers(current).forEach((item) => {
            item.lastSeen = Date.now();
          });
        } else if (current.phase === 'review') {
          player.finished = true;
          scoreRound(current);
        }
      });
      if (!match) fail('La partida no existe', 404);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo guardar el tablero' });
    }
  });

  app.post('/api/matches/:id/pulse', async (req, res) => {
    try {
      const user = requireUser(req);
      const existing = await load(req.params.id);
      if (!existing) fail('La partida no existe', 404);
      const match = await updateMatch(req.params.id, (current) => {
        const player = current.players.find((item) => item.userId === user.id && !item.left && !item.quit);
        let touched = false;
        if (player && (current.phase === 'lobby' || current.phase === 'playing')) {
          player.lastSeen = Date.now();
          touched = true;
        }
        return touched || sweepMatch(current) ? undefined : false;
      });
      if (!match) fail('La partida no existe', 404);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo registrar la actividad' });
    }
  });

  app.post('/api/matches/:id/leave', async (req, res) => {
    try {
      const user = requireUser(req);
      const existing = await load(req.params.id);
      if (!existing) fail('La partida no existe', 404);
      const match = await updateMatch(req.params.id, (current) => {
        const player = current.players.find((item) => item.userId === user.id);
        if (!player || player.left) return false;
        const idle = Boolean(req.body?.idle) && !req.body?.quit;
        player.left = true;
        player.ready = false;
        if (idle) {
          player.idle = true;
          pushNotice(current, `${player.name} salió por inactividad`, player.userId);
        } else {
          player.quit = true;
          player.idle = false;
          pushNotice(current, `${player.name} salió de la partida`, player.userId);
        }
        if (current.phase === 'review') scoreRound(current);
        tryAdvance(current);
      });
      if (!match) fail('La partida no existe', 404);
      clearMatchCookie(req, res);
      res.json(publicMatch(match, user.id));
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'No se pudo salir' });
    }
  });
}
