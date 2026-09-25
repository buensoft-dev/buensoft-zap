import './style.css';
import { Game, MODES, SKILLS } from './game.js';
import { historyHtml, matchHtml, postBoard } from './compete.js';

const app = document.querySelector('#app');
const cache = new Map();

const state = {
  modeId: 'es-en',
  skillId: 1,
  game: null,
  screen: 'menu',
  selectedWord: '',
  flashOn: false,
  scores: [],
  playerName: '',
  savedId: null,
  saveError: '',
  popSlot: null,
  followedRow: null,
  daily: true,
  theme: localStorage.getItem('zap-theme') || 'neon',
  targetPoints: 0,
  targetName: '',
  recordShown: false,
  recordFlash: false,
  user: null,
  authReady: false,
  match: null,
  users: [],
  history: [],
  invites: [],
  playMode: 'solo',
  competeSeats: 4,
  competeRounds: 2,
};

const THEMES = [
  { id: 'neon', name: 'Neón' },
  { id: 'ocean', name: 'Océano' },
  { id: 'sunset', name: 'Atardecer' },
  { id: 'dark', name: 'Oscuro' },
];

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
}

let timerId = 0;
let flashId = 0;
let animating = false;
let recordTimer = 0;
let matchPoll = 0;

const sounds = {
  ctx: null,
  ready() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    if (!this.ctx) this.ctx = new Audio();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, duration, type = 'square', gain = 0.08) {
    const ctx = this.ready();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  },
  tap() { this.tone(640, 0.07, 'square', 0.06); },
  back() { this.tone(240, 0.06, 'sine', 0.05); },
  tick() { this.tone(920, 0.05, 'square', 0.04); },
  fail() {
    this.tone(180, 0.18, 'sawtooth', 0.05);
    this.tone(110, 0.28, 'square', 0.04);
  },
  win() {
    [523, 659, 784].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.12, 'square', 0.06), index * 70);
    });
  },
  zap() {
    [784, 988, 1318, 1568].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.14, 'square', 0.07), index * 60);
    });
  },
  boom() {
    const ctx = this.ready();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const amp = ctx.createGain();
    amp.gain.value = 0.18;
    noise.connect(amp).connect(ctx.destination);
    noise.start();
    this.tone(90, 0.16, 'sine', 0.1);
  },
  record() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.16, 'square', 0.07), index * 80);
    });
  },
};

function playerName(value) {
  return String(value || '').replace(/[^\p{L} ]/gu, '').replace(/ {2,}/g, ' ').slice(0, 20);
}

function modeById(id) {
  return MODES.find((mode) => mode.id === id) || MODES[0];
}

function skillById(id) {
  return SKILLS.find((skill) => skill.id === id) || SKILLS[1];
}

async function loadDictionary(mode) {
  if (cache.has(mode.id)) return cache.get(mode.id);
  const response = await fetch(`/data/${mode.file}`);
  if (!response.ok) throw new Error('No se pudo cargar el diccionario');
  const data = await response.json();
  cache.set(mode.id, data);
  return data;
}

function stopClocks() {
  clearInterval(timerId);
  clearInterval(flashId);
  timerId = 0;
  flashId = 0;
  state.flashOn = false;
}

function startClocks() {
  stopClocks();
  timerId = setInterval(() => {
    const result = state.game.tick();
    if (result.ended) {
      stopClocks();
      if (state.match) {
        postBoard(state, true).then(() => {
          state.screen = 'match';
          render();
        });
        return;
      }
      state.screen = 'review';
      state.selectedWord = state.game.suggested[0] || '';
      state.savedId = null;
      refreshScores().then(() => {
        if (state.screen === 'review') render();
      });
      render();
      return;
    }
    const rowLeft = state.game.rowSeconds[state.game.timerRow];
    if (rowLeft > 0 && rowLeft <= 3) sounds.tick();
    if (!paintHud()) render();
  }, 1000);
  flashId = setInterval(() => {
    if (!state.game?.flash) {
      state.flashOn = false;
      return;
    }
    state.flashOn = !state.flashOn;
    const num = app.querySelector('.num.live');
    if (num) num.classList.toggle('flash', state.flashOn);
  }, 180);
}

async function refreshScores() {
  try {
    const response = await fetch('/api/scores');
    if (!response.ok) throw new Error('No se pudieron cargar los puntajes');
    state.scores = await response.json();
  } catch {
    state.scores = [];
  }
}

async function saveScore(event) {
  event.preventDefault();
  if (!state.user) {
    state.saveError = 'Entra con Google para guardar el puntaje';
    render();
    return;
  }
  const name = playerName(state.user.name).trim();
  state.playerName = name;
  if (!name.replace(/ /g, '')) {
    state.saveError = 'El nombre de Google no tiene letras válidas';
    render();
    return;
  }
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: state.user?.name || name,
      points: state.game.pointsTotal,
      marker: state.game.marker,
      level: state.game.level,
      skill: state.game.skill.name,
      mode: modeById(state.modeId).label,
      daily: state.daily,
      day: state.daily ? today() : '',
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    state.saveError = data.error || 'No se pudo guardar';
    render();
    return;
  }
  state.savedId = data.saved.id;
  state.scores = data.scores;
  state.saveError = '';
  render();
}

function captureTarget() {
  const top = visibleScores()[0];
  state.targetPoints = top ? Number(top.points) || 0 : 0;
  state.targetName = top?.name || '';
  state.recordShown = false;
  state.recordFlash = false;
}

function celebrateRecord() {
  const game = state.game;
  if (!game || state.recordShown || state.targetPoints <= 0) return;
  if (game.pointsTotal <= state.targetPoints) return;
  state.recordShown = true;
  state.recordFlash = true;
  sounds.record();
  clearTimeout(recordTimer);
  recordTimer = setTimeout(() => {
    state.recordFlash = false;
    app.querySelector('.record-flash')?.remove();
  }, 1700);
}

function beginMatch() {
  state.savedId = null;
  state.saveError = '';
  const mode = modeById(state.modeId);
  const skill = skillById(state.skillId);
  state.screen = 'loading';
  render();
  Promise.all([loadDictionary(mode), refreshScores()])
    .then(([dictionary]) => {
      captureTarget();
      state.game = new Game(dictionary, skill.id, {
        daily: state.daily,
        day: today(),
        modeId: state.modeId,
      });
      state.screen = 'splash';
      state.splashTitle = `NIVEL ${state.game.level}`;
      state.splashMode = skill.splash;
      render();
      setTimeout(() => {
        if (state.screen !== 'splash') return;
        state.game.start();
        state.screen = 'play';
        startClocks();
        render();
      }, 2000);
    })
    .catch((error) => {
      state.screen = 'menu';
      state.error = error.message;
      render();
    });
}

function afterLevelSplash() {
  state.followedRow = null;
  state.game.resumeAfterLevel();
  state.screen = 'play';
  startClocks();
  render();
}

function paintHud() {
  const game = state.game;
  const clock = app.querySelector('[data-clock]');
  if (!clock || !game) return false;
  clock.textContent = game.secondsLeft;
  const warning = app.querySelector('.warning');
  if (warning) warning.textContent = game.warning || '';
  app.querySelectorAll('.num').forEach((el, index) => {
    const live = game.flash && index === game.timerRow ? 'live' : '';
    el.className = `num ${game.numberColors[index]} ${live}`;
  });
  app.querySelectorAll('.row').forEach((row, index) => {
    row.classList.toggle('is-timer', index === game.timerRow);
    const badge = row.querySelector('[data-row-clock]');
    if (badge) badge.textContent = game.rowClock(index);
  });
  return true;
}

function onSubmit() {
  if (animating || !state.game.canSubmit()) return;
  const row = app.querySelector(`.row[data-row="${state.game.playerRow}"]`);
  if (!row) {
    finishSubmit();
    return;
  }
  animating = true;
  row.classList.add('bursting');
  sounds.boom();
  setTimeout(() => {
    animating = false;
    finishSubmit();
  }, 380);
}

function finishSubmit() {
  const result = state.game.submit();
  state.popSlot = null;
  if (result.ok && result.zap) sounds.zap();
  else if (result.ok) sounds.win();
  else sounds.fail();
  if (result.ok) celebrateRecord();
  if (state.match) {
    postBoard(state, Boolean(result.finished)).then(() => {
      if (result.finished || state.match?.phase === 'review') {
        stopClocks();
        state.screen = 'match';
      }
      render();
    });
    return;
  }
  if (result.levelUp) {
    stopClocks();
    state.screen = 'splash';
    state.splashTitle = result.levelUp.splash;
    state.splashMode = result.levelUp.mode;
    render();
    setTimeout(() => {
      if (state.screen !== 'splash') return;
      afterLevelSplash();
    }, 2000);
    return;
  }
  render();
}

function onKey(event) {
  if (!state.game || state.screen !== 'play') return;
  const key = event.key;
  if (animating) return;
  if (key === 'Backspace') {
    event.preventDefault();
    state.game.backspace();
    sounds.back();
    state.popSlot = null;
    render();
    return;
  }
  if (key === 'Escape') {
    state.game.clearRow();
    sounds.back();
    state.popSlot = null;
    render();
    return;
  }
  if (key === ' ') {
    event.preventDefault();
    if (state.game.canSubmit()) onSubmit();
    return;
  }
  if (/^[a-zA-ZñÑ]$/.test(key)) {
    const letter = key.toUpperCase();
    const index = state.game.source.findIndex((tile) => !tile.hidden && tile.letter === letter);
    if (index >= 0) {
      state.game.place(index);
      state.popSlot = state.game.filledCount() - 1;
      sounds.tap();
      render();
    }
  }
}

function meaningBlock(game) {
  if (!game.headline) {
    return `<p class="hint">Forma una palabra de al menos 3 letras. Tienes ${game.secsPerSlot} segundos por cada una de las 10 casillas. Si completas las 10, subes de nivel y el tiempo baja un segundo.</p>`;
  }
  return `
    <div class="word ${game.tone}">${game.headline}</div>
    <pre class="${game.tone}">${escapeHtml(game.meaning)}</pre>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function boardHtml(game) {
  const rows = game.grid.map((row, rowIndex) => {
    const slots = row.map((cell, slotIndex) => {
      const cls = cell.kind;
      const pop = cell.kind === 'filled' && rowIndex === game.playerRow && slotIndex === state.popSlot ? 'pop' : '';
      const wild = cell.wild ? 'wild' : '';
      const disabled = cell.kind === 'filled' && rowIndex === game.playerRow ? '' : 'disabled';
      const label = cell.letter || '';
      return `<button class="slot ${cls} ${pop} ${wild}" data-slot="${slotIndex}" ${disabled}>${label}</button>`;
    }).join('');
    const color = game.numberColors[rowIndex];
    const live = game.flash && rowIndex === game.timerRow ? 'live' : '';
    const player = rowIndex === game.playerRow ? 'is-player' : '';
    const timer = rowIndex === game.timerRow ? 'is-timer' : '';
    const rejected = game.tone === 'bad' && rowIndex === game.playerRow ? 'is-bad' : '';
    const points = game.rowPoints[rowIndex] ? `${game.rowPoints[rowIndex]}` : '';
    const clock = game.rowClock(rowIndex);
    return `
      <div class="row ${player} ${timer} ${rejected}" data-row="${rowIndex}">
        <div class="num ${color} ${live}">${rowIndex + 1}</div>
        <div class="slots">${slots}</div>
        <div class="row-side">
          <div class="points">${points}</div>
          <div class="row-clock" data-row-clock>${clock}</div>
        </div>
      </div>
    `;
  }).join('');

  const tiles = game.source.map((tile, index) => `
    <button class="tile ${tile.hidden ? 'used' : ''} ${tile.wild ? 'wild' : ''}" data-tile="${index}" ${tile.hidden ? 'disabled' : ''}>${tile.letter}</button>
  `).join('');

  return `
    <section class="card board ${game.combo >= 2 ? 'combo-hot' : ''}">
      <div class="warning">${game.warning || ''}</div>
      ${game.bonus ? `<div class="fx">${game.bonus}</div>` : ''}
      ${rows}
    </section>
    <section class="card tray">
      <div>
        <div class="tiles">${tiles}</div>
        <p class="keys">Clic o teclado · Retroceso quita la última · Esc borra la fila · Espacio comprueba</p>
      </div>
      <div class="actions">
        ${game.over ? '<button class="primary" id="home-board">Página principal</button>' : `<button class="primary" id="submit" ${game.canSubmit() ? '' : 'disabled'}>TERMINAR PALABRA</button>`}
        <div class="stat"><span>Tiempo</span><strong data-clock>${game.secondsLeft}</strong></div>
      </div>
    </section>
  `;
}

function boardSkill(skill) {
  return skill === 'Experto' ? 'Avanzado' : skill;
}

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function scoreTitle() {
  const mode = modeById(state.modeId).label;
  const skill = boardSkill(skillById(state.skillId).name);
  const prefix = state.daily ? 'Desafío del día · ' : '';
  return `${prefix}Top Score - ${mode} - ${skill}`;
}

function visibleScores() {
  const mode = modeById(state.modeId).label;
  const skill = boardSkill(skillById(state.skillId).name);
  return state.scores
    .filter((row) => row.mode === mode && boardSkill(row.skill) === skill && Boolean(row.daily) === state.daily && (!state.daily || row.day === today()))
    .sort((a, b) => b.points - a.points || b.level - a.level || String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(0, 10);
}

function scoresHtml() {
  const scores = visibleScores();
  if (!scores.length) {
    return '<p class="hint">Aún no hay puntajes en esta combinación.</p>';
  }
  const rows = scores.map((row, index) => `
    <li class="${row.id === state.savedId ? 'mine' : ''}">
      <span>${index + 1}</span>
      <span>${escapeHtml(row.name)}</span>
      <strong>${row.points}</strong>
      <em>Nivel ${row.level} · ${escapeHtml(row.skill)}</em>
    </li>
  `).join('');
  return `<ol class="tops">${rows}</ol>`;
}

function accountHtml() {
  if (!state.authReady) return '';
  if (state.user) {
    return `<div class="account"><span>Entraste como <strong>${escapeHtml(state.user.name)}</strong></span><button class="ghost" id="logout" type="button">Salir</button></div>`;
  }
  return `<a class="primary google" href="/api/auth/google">Entrar con Google</a>`;
}

function saveFormHtml(game) {
  if (state.savedId) {
    return `<p class="saved">Puntuación de <strong>${escapeHtml(state.playerName)}</strong> guardada: ${game.pointsTotal} puntos.</p>`;
  }
  if (!state.user) {
    return `
      <p>Tu puntuación es <strong>${game.pointsTotal}</strong> puntos. Entra con Google para guardarla.</p>
      ${accountHtml()}
      ${state.saveError ? `<p class="hint bad-note">${escapeHtml(state.saveError)}</p>` : ''}
    `;
  }
  return `
    <form id="save-score" class="save-score">
      <p>Tu puntuación es <strong>${game.pointsTotal}</strong> puntos y se guardará como <strong>${escapeHtml(state.user.name)}</strong>.</p>
      <button class="primary" type="submit">GUARDAR SCORE</button>
    </form>
    ${state.saveError ? `<p class="hint bad-note">${escapeHtml(state.saveError)}</p>` : ''}
  `;
}

function invitesHtml() {
  if (!state.invites.length) return '';
  const invites = state.invites.map((match) => `
    <li>
      <span>${escapeHtml(match.hostName || 'Invitación')}</span>
      <button class="choice" data-answer="yes" data-match="${match.id}" type="button">Aceptar</button>
      <button class="ghost" data-answer="no" data-match="${match.id}" type="button">Negar</button>
    </li>
  `).join('');
  return `<p class="menu-label">Invitaciones</p><ul class="roster">${invites}</ul>`;
}

function friendsPanel() {
  return `
    <p class="menu-label">Nueva partida</p>
    <div class="choices">
      ${[2, 3, 4, 5, 6].map((count) => `<button class="choice ${state.competeSeats === count ? 'active' : ''}" data-seats="${count}" type="button">${count} jugadores</button>`).join('')}
    </div>
    <div class="choices">
      ${[1, 2, 3, 4, 5].map((count) => `<button class="choice ${state.competeRounds === count ? 'active' : ''}" data-rounds="${count}" type="button">${count} ${count === 1 ? 'ronda' : 'rondas'}</button>`).join('')}
    </div>
    ${invitesHtml()}
    <button class="primary" id="create-match" type="button">CREAR PARTIDA</button>
  `;
}

async function loadCompeteLists() {
  if (!state.user) return;
  const [history, invites] = await Promise.all([
    fetch('/api/history').then((response) => response.json()).catch(() => []),
    fetch('/api/invites').then((response) => response.json()).catch(() => []),
  ]);
  state.history = Array.isArray(history) ? history : [];
  state.invites = Array.isArray(invites) ? invites : [];
}

async function showPlayMode(mode) {
  state.playMode = mode;
  state.error = mode === 'friends' && !state.user ? 'Entra con Google para jugar con amigos' : '';
  if (mode === 'friends' && state.user) await loadCompeteLists();
  if (state.screen === 'menu') render();
}

function watchMatch() {
  clearInterval(matchPoll);
  if (!state.match?.id) return;
  matchPoll = setInterval(() => { refreshMatch(); }, 1200);
}

async function refreshMatch() {
  if (!state.match?.id || state.screen === 'play' && document.hidden) return;
  const response = await fetch(`/api/matches/${state.match.id}`);
  if (!response.ok) return;
  const next = await response.json();
  const previous = state.match.phase;
  state.match = next;
  if (previous === 'playing' && next.phase === 'review' && state.screen === 'play') {
    stopClocks();
    await postBoard(state, false);
    state.screen = 'match';
    render();
    return;
  }
  if (next.phase === 'playing' && state.screen === 'match' && previous !== 'playing') {
    await beginCompeteRound();
    return;
  }
  if (state.screen === 'match') render();
}

async function beginCompeteRound() {
  const match = state.match;
  const mode = modeById(match.modeId);
  const dictionary = await loadDictionary(mode);
  state.game = new Game(dictionary, match.skillId, { seed: match.seed, compete: true, modeId: match.modeId });
  state.game.start();
  state.screen = 'play';
  state.followedRow = null;
  startClocks();
  render();
}

async function enterMatch(id) {
  if (!state.user) {
    state.error = 'Entra con Google para unirte a la competencia';
    state.pendingMatch = id;
    render();
    return;
  }
  const response = await fetch(`/api/matches/${id}/join`, { method: 'POST' });
  const data = await response.json();
  if (!response.ok) {
    state.error = data.error || 'No se pudo entrar';
    render();
    return;
  }
  state.match = data;
  state.screen = 'match';
  state.playMode = 'friends';
  watchMatch();
  render();
}

function menuHtml() {
  const mode = modeById(state.modeId);
  const modes = MODES.map((item) => `
    <button class="choice ${item.id === state.modeId ? 'active' : ''}" data-mode="${item.id}">${item.label}</button>
  `).join('');
  const skills = SKILLS.map((item) => `
    <button class="choice ${item.id === state.skillId ? 'active' : ''}" data-skill="${item.id}">${item.name} · ${item.seconds}s</button>
  `).join('');
  return `
    <div class="overlay">
      <div class="sheet menu-sheet">
        <header class="menu-hero">
          <img class="game-logo" src="/logo.jpg" alt="Buensoft Zap" />
          <div>
            <h2>Arma palabras antes de que se acabe el tiempo</h2>
            <p class="hint">${mode.hint} Diez filas de siete letras. El reloj avanza por las filas y cada palabra válida reparte fichas nuevas.</p>
          </div>
        </header>
        <p class="menu-label">Color</p>
        <div class="themes">
          ${THEMES.map((theme) => `<button class="swatch ${theme.id === state.theme ? 'active' : ''}" data-theme="${theme.id}">${theme.name}</button>`).join('')}
        </div>
        <div class="play-tabs">
          <button class="${state.playMode === 'solo' ? 'active' : ''}" data-play="solo" type="button">Solo</button>
          <button class="${state.playMode === 'friends' ? 'active' : ''}" data-play="friends" type="button">Con amigos</button>
        </div>
        <div class="menu-grid">
          <section class="menu-setup">
            ${state.user ? `<p class="account-line">Entraste como <strong>${escapeHtml(state.user.name)}</strong></p>` : ''}
            <p class="menu-label">Idioma</p>
            <div class="choices">${modes}</div>
            <p class="menu-label">Nivel</p>
            <div class="skills">${skills}</div>
            ${state.playMode === 'solo' ? `<button class="choice ${state.daily ? 'active' : ''}" id="daily">Desafío del día · ${today()}</button>` : ''}
            ${state.playMode === 'friends' ? friendsPanel() : ''}
            ${state.error ? `<p class="hint">${state.error}</p>` : ''}
            <div class="sheet-actions">
              ${state.playMode === 'solo' ? '<button class="primary" id="play">JUGAR</button>' : ''}
              ${state.user ? '<button class="ghost" id="logout" type="button">SALIR</button>' : '<a class="primary google" href="/api/auth/google">Entrar con Google</a>'}
            </div>
            ${state.playMode === 'solo' ? invitesHtml() : ''}
          </section>
          <section class="menu-scores">
            ${state.playMode === 'friends' ? `<h3 class="board-title">Ganadores</h3>${historyHtml(state.history)}` : `<h3 class="board-title">${scoreTitle()}</h3>${scoresHtml()}`}
          </section>
        </div>
      </div>
    </div>
  `;
}

function splashHtml() {
  return `
    <div class="overlay">
      <div class="sheet narrow">
        <div class="splash-mode">${state.splashMode}</div>
        <div class="splash-level">${state.splashTitle}</div>
      </div>
    </div>
  `;
}

function personalHtml(game) {
  const previous = visibleScores().filter((row) => row.id !== state.savedId);
  const best = previous.reduce((max, row) => Math.max(max, Number(row.points) || 0), 0);
  if (!best) {
    return `<p class="challenge">Primera marca en esta combinación: <strong>${game.pointsTotal}</strong>. La próxima, supérala.</p>`;
  }
  if (game.pointsTotal > best) {
    return `<p class="challenge">¡Superaste tu récord! Antes tenías ${best} y ahora <strong>${game.pointsTotal}</strong>.</p>`;
  }
  return `<p class="challenge">Tu récord es ${best}. Esta partida: ${game.pointsTotal}. Te faltan ${best - game.pointsTotal} puntos para superarte.</p>`;
}

function reviewHtml(game) {
  const buttons = game.suggested.map((word) => `
    <button class="${word === state.selectedWord ? 'active' : ''}" data-review="${escapeHtml(word)}">${escapeHtml(word)}</button>
  `).join('');
  const meaning = state.selectedWord ? game.dictionary[state.selectedWord] || '' : '';
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="eyebrow">Fin del juego</p>
        <h2>Tu puntuación</h2>
        ${saveFormHtml(game)}
        ${personalHtml(game)}
        <h3 class="board-title">${scoreTitle()}</h3>
        ${scoresHtml()}
        <h2>Expande tu vocabulario</h2>
        <p class="hint">Durante todo el juego tuviste la opción de utilizar las siguientes palabras:</p>
        <div class="review-list">${buttons}</div>
        <div class="review-detail">
          <h3>${escapeHtml(state.selectedWord)}</h3>
          <pre>${escapeHtml(meaning)}</pre>
        </div>
        <div class="sheet-actions">
          <button class="ghost" id="again">Jugar de nuevo</button>
          <button class="primary" id="home">Página principal</button>
        </div>
      </div>
    </div>
  `;
}

function followRow() {
  if (state.screen !== 'play' || !state.game) return;
  if (state.followedRow === state.game.playerRow) return;
  state.followedRow = state.game.playerRow;
  const row = app.querySelector('.row.is-player');
  row?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
}

function render() {
  const game = state.game;
  const skill = game ? game.skill : skillById(state.skillId);
  const mode = modeById(state.modeId);
  app.innerHTML = `
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <img class="brand-mark" src="/favicon.png" alt="" />
          <div>
            <span class="eyebrow">${mode.label}</span>
            <h1>Buensoft Zap</h1>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><span>Nivel</span><strong>${game ? game.level : 1}</strong></div>
          <div class="stat"><span>Modo</span><strong style="font-size:16px">${skill.name}</strong></div>
          <div class="stat"><span>Marcador</span><strong>${game ? String(game.marker).padStart(2, '0') : '00'}</strong></div>
          <div class="stat"><span>Puntos</span><strong>${game ? game.pointsTotal : 0}</strong></div>
        </div>
      </header>
      ${state.screen === 'loading' ? '<p class="hint">Cargando diccionario…</p>' : ''}
      ${game && state.screen !== 'menu' ? `
        <div class="layout">
          <div class="side-col">
            <aside class="card meaning">${meaningBlock(game)}</aside>
            ${state.screen === 'play' && !state.match ? `
              <div class="target-bar ${state.recordShown ? 'beaten' : ''}">
                <span>${state.recordShown ? 'Nuevo top score' : 'Top a vencer'}</span>
                <strong>${state.targetPoints || '—'}</strong>
                <em>${state.targetName ? escapeHtml(state.targetName) : 'Sé el primero'}</em>
              </div>
            ` : ''}
          </div>
          <div>${boardHtml(game)}</div>
        </div>
      ` : ''}
    </div>
    ${state.screen === 'menu' || state.screen === 'loading' && !game ? menuHtml() : ''}
    ${state.screen === 'splash' ? splashHtml() : ''}
    ${state.screen === 'review' && game && !state.match ? reviewHtml(game) : ''}
    ${state.screen === 'match' ? matchHtml(state) : ''}
    ${state.recordFlash && game ? `
      <div class="record-flash" aria-live="polite">
        <div>
          <p>¡Nuevo top score!</p>
          <strong>${game.pointsTotal}</strong>
        </div>
      </div>
    ` : ''}
  `;
  bind();
  followRow();
}

function bind() {
  app.querySelectorAll('[data-mode]').forEach((button) => {
    button.onclick = () => {
      state.modeId = button.dataset.mode;
      state.error = '';
      render();
    };
  });
  app.querySelectorAll('[data-skill]').forEach((button) => {
    button.onclick = () => {
      state.skillId = Number(button.dataset.skill);
      render();
    };
  });
  const play = app.querySelector('#play');
  if (play) play.onclick = beginMatch;
  app.querySelectorAll('[data-play]').forEach((button) => {
    button.onclick = () => showPlayMode(button.dataset.play);
  });
  app.querySelectorAll('[data-seats]').forEach((button) => {
    button.onclick = () => {
      state.competeSeats = Number(button.dataset.seats);
      render();
    };
  });
  app.querySelectorAll('[data-rounds]').forEach((button) => {
    button.onclick = () => {
      state.competeRounds = Number(button.dataset.rounds);
      render();
    };
  });
  const createMatch = app.querySelector('#create-match');
  if (createMatch) {
    createMatch.onclick = async () => {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seats: state.competeSeats,
          rounds: state.competeRounds,
          modeId: state.modeId,
          skillId: state.skillId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        state.error = data.error || 'No se pudo crear la partida';
        render();
        return;
      }
      state.match = data;
      state.screen = 'match';
      history.replaceState(null, '', `/?partida=${data.id}`);
      watchMatch();
      const users = await fetch('/api/users').then((item) => item.json()).catch(() => []);
      state.users = Array.isArray(users) ? users : [];
      render();
    };
  }
  app.querySelectorAll('[data-invite]').forEach((button) => {
    button.onclick = async () => {
      await fetch(`/api/matches/${state.match.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: button.dataset.invite, name: button.dataset.name }),
      }).then((response) => response.json()).then((data) => {
        state.match = data;
        render();
      });
    };
  });
  app.querySelectorAll('[data-remove]').forEach((button) => {
    button.onclick = async () => {
      const response = await fetch(`/api/matches/${state.match.id}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: button.dataset.remove }),
      });
      state.match = await response.json();
      render();
    };
  });
  app.querySelectorAll('[data-answer]').forEach((button) => {
    button.onclick = async () => {
      await fetch(`/api/matches/${button.dataset.match}/invite/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept: button.dataset.answer === 'yes' }),
      });
      if (button.dataset.answer === 'yes') enterMatch(button.dataset.match);
      else {
        state.invites = state.invites.filter((match) => match.id !== button.dataset.match);
        render();
      }
    };
  });
  const matchReady = app.querySelector('#match-ready');
  if (matchReady) {
    matchReady.onclick = async () => {
      const response = await fetch(`/api/matches/${state.match.id}/ready`, { method: 'POST' });
      state.match = await response.json();
      if (state.match.phase === 'playing') await beginCompeteRound();
      else render();
    };
  }
  const matchLeave = app.querySelector('#match-leave');
  if (matchLeave) {
    matchLeave.onclick = async () => {
      await fetch(`/api/matches/${state.match.id}/leave`, { method: 'POST' });
      clearInterval(matchPoll);
      state.match = null;
      state.game = null;
      state.screen = 'menu';
      history.replaceState(null, '', '/');
      render();
    };
  }
  const matchHome = app.querySelector('#match-home');
  if (matchHome) {
    matchHome.onclick = () => {
      clearInterval(matchPoll);
      state.match = null;
      state.game = null;
      state.screen = 'menu';
      history.replaceState(null, '', '/');
      render();
    };
  }
  const copyLink = app.querySelector('#copy-link');
  if (copyLink) {
    copyLink.onclick = () => {
      navigator.clipboard?.writeText(`${location.origin}/?partida=${state.match.id}`);
    };
  }
  app.querySelectorAll('[data-theme]').forEach((button) => {
    button.onclick = () => {
      state.theme = button.dataset.theme;
      localStorage.setItem('zap-theme', state.theme);
      applyTheme();
      render();
    };
  });
  const daily = app.querySelector('#daily');
  if (daily) {
    daily.onclick = () => {
      state.daily = !state.daily;
      render();
    };
  }

  app.querySelectorAll('[data-tile]').forEach((button) => {
    button.onclick = () => {
      if (animating) return;
      state.game.place(Number(button.dataset.tile));
      state.popSlot = state.game.filledCount() - 1;
      sounds.tap();
      render();
    };
  });
  app.querySelectorAll('[data-slot]').forEach((button) => {
    button.onclick = () => {
      if (animating) return;
      state.game.removeFrom(Number(button.dataset.slot));
      state.popSlot = null;
      sounds.back();
      render();
    };
  });
  const submit = app.querySelector('#submit');
  if (submit) submit.onclick = onSubmit;

  app.querySelectorAll('[data-review]').forEach((button) => {
    button.onclick = () => {
      state.selectedWord = button.dataset.review;
      render();
    };
  });
  const goHome = () => {
    stopClocks();
    state.game = null;
    state.screen = 'menu';
    state.savedId = null;
    render();
  };
  const again = app.querySelector('#again');
  if (again) again.onclick = goHome;
  app.querySelectorAll('#home, #home-board').forEach((button) => {
    button.onclick = goHome;
  });
  const logout = app.querySelector('#logout');
  if (logout) {
    logout.onclick = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      state.user = null;
      render();
    };
  }
  const saveForm = app.querySelector('#save-score');
  if (saveForm) saveForm.onsubmit = saveScore;
  const nameInput = app.querySelector('#player-name');
  if (nameInput) {
    nameInput.oninput = () => {
      const clean = playerName(nameInput.value);
      nameInput.value = clean;
      state.playerName = clean;
      const count = app.querySelector('.name-count');
      if (count) count.textContent = `${clean.trim().length}/20`;
    };
  }
}

applyTheme();
Promise.all([
  refreshScores(),
  fetch('/api/auth/me').then((response) => response.json()).catch(() => ({ user: null })),
]).then(([, auth]) => {
  state.authReady = true;
  state.user = auth.user || null;
  if (state.user) {
    state.playerName = state.user.name;
    loadCompeteLists().then(() => { if (state.screen === 'menu') render(); });
  }
  if (new URLSearchParams(window.location.search).get('auth') === 'error') {
    state.error = 'Google no dejó entrar. Tu correo tiene que estar en los usuarios de prueba.';
  }
  const partida = new URLSearchParams(window.location.search).get('partida') || state.pendingMatch;
  if (partida && state.user) enterMatch(partida);
  else render();
});

window.addEventListener('pointerdown', () => sounds.ready(), { once: true });
window.addEventListener('keydown', onKey);
