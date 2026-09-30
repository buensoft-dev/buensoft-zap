import './style.css';
import { Game, MODES, SKILLS } from './game.js';
import { historyHtml, matchHtml, postBoard } from './compete.js';

const VERSION = '1.5.2';
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
  translate: localStorage.getItem('zap-translate') === '1',
  heardStart: 0,
  theme: (localStorage.getItem('zap-theme') === 'ocean' ? 'light' : localStorage.getItem('zap-theme')) || 'neon',
  targetPoints: 0,
  targetName: '',
  recordShown: false,
  recordFlash: false,
  user: null,
  authReady: false,
  match: null,
  matchStamp: '',
  viewPodium: false,
  users: [],
  history: [],
  invites: [],
  playMode: 'solo',
  competeSeats: 2,
  competeRounds: 2,
  marksLocked: false,
  marksReport: null,
  rulesOpen: false,
  seenNoticeIds: new Set(),
  departureNote: '',
  presenceSentAt: 0,
  lobbyPulseAt: 0,
  youIdleMs: 0,
  idleCheckedAt: Date.now(),
  lastActivityAt: Date.now(),
  idleClockReady: false,
  idleWarn: false,
  idleWarnMs: 120000,
  savingScore: false,
  reviewTab: 'used',
};

const THEMES = [
  { id: 'neon', name: 'Neón' },
  { id: 'light', name: 'Claro' },
  { id: 'sunset', name: 'Atardecer' },
  { id: 'dark', name: 'Oscuro' },
  { id: 'forest', name: 'Bosque' },
  { id: 'sky', name: 'Cielo' },
];

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
}

let timerId = 0;
let flashId = 0;
const clockIds = new Set();
let animating = false;
let recordTimer = 0;
let matchPoll = 0;
let invitePoll = 0;
let noteTimer = 0;
let idleWatch = 0;

const sounds = {
  ctx: null,
  tickNodes: [],
  active: [],
  countdown: false,
  silenced: false,
  ready() {
    if (this.silenced) return null;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    if (!this.ctx) this.ctx = new Audio();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  track(node) {
    this.active.push(node);
    node.onended = () => {
      this.active = this.active.filter((item) => item !== node);
    };
    return node;
  },
  tone(freq, duration, type = 'square', gain = 0.08) {
    const ctx = this.ready();
    if (!ctx) return null;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    return this.track(osc);
  },
  stopTicks() {
    this.tickNodes.forEach((node) => {
      try { node.stop(); } catch { /* el pitido ya terminó */ }
    });
    this.tickNodes = [];
  },
  stopAll() {
    this.silenced = true;
    this.countdown = false;
    this.stopTicks();
    this.active.forEach((node) => {
      try { node.stop(); } catch { /* el sonido ya terminó */ }
    });
    this.active = [];
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  },
  unsilence() {
    this.silenced = false;
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tap() { this.tone(640, 0.07, 'square', 0.06); },
  back() { this.tone(240, 0.06, 'sine', 0.05); },
  tick() {
    if (this.silenced || !this.countdown || state.screen !== 'play' || !state.game?.playing || state.game.over) return;
    const osc = this.tone(920, 0.05, 'square', 0.04);
    if (!osc) return;
    this.tickNodes.push(osc);
    osc.onended = () => {
      this.tickNodes = this.tickNodes.filter((item) => item !== osc);
    };
  },
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
    this.track(noise);
    this.tone(90, 0.16, 'sine', 0.1);
  },
  record() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.16, 'square', 0.07), index * 80);
    });
  },
  startMatch() {
    [392, 523, 659, 784, 1046].forEach((freq, index) => {
      setTimeout(() => this.tone(freq, 0.18, 'square', 0.08), index * 90);
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
  sounds.countdown = false;
  clockIds.forEach((id) => clearInterval(id));
  clockIds.clear();
  clearInterval(timerId);
  clearInterval(flashId);
  timerId = 0;
  flashId = 0;
  state.flashOn = false;
  sounds.stopTicks();
}

function startClocks() {
  stopClocks();
  sounds.unsilence();
  sounds.countdown = true;
  timerId = setInterval(() => {
    if (!state.game || state.screen !== 'play') {
      stopClocks();
      return;
    }
    const result = state.game.tick();
    if (result.ended || !state.game.playing || state.game.over) {
      stopClocks();
      if (!result.ended) return;
      if (state.match) {
        postBoard(state, true).then(() => {
          state.screen = 'match';
          render();
        });
        return;
      }
      openSoloReview();
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
  clockIds.add(timerId);
  clockIds.add(flashId);
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

function openSoloReview() {
  sounds.stopAll();
  state.screen = 'review';
  state.reviewTab = 'used';
  state.selectedWord = firstReviewWord(state.game);
  state.savedId = null;
  state.saveError = '';
  state.savingScore = false;
  lockMarks(state.game);
  if (state.user) {
    persistScore();
    return;
  }
  render();
  refreshScores().then(() => {
    if (state.screen === 'review') render();
  });
}

async function persistScore() {
  if (!state.user || !state.game || state.savedId || state.savingScore) return;
  const name = playerName(state.user.name).trim();
  state.playerName = name;
  if (!name.replace(/ /g, '')) {
    state.saveError = 'El nombre de Google no tiene letras válidas';
    state.savingScore = false;
    render();
    return;
  }
  state.savingScore = true;
  state.saveError = '';
  render();
  try {
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
        translate: Boolean(state.game?.translate),
      }),
    });
    const data = await response.json();
    state.savingScore = false;
    if (!response.ok) {
      state.saveError = data.error || 'No se pudo guardar';
      render();
      return;
    }
    state.savedId = data.saved.id;
    state.scores = data.scores;
    state.saveError = '';
    render();
  } catch {
    state.savingScore = false;
    state.saveError = 'No se pudo guardar';
    render();
  }
}

function saveScore(event) {
  event.preventDefault();
  if (!state.user) {
    state.saveError = 'Entra con Google para guardar el puntaje';
    render();
    return;
  }
  persistScore();
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
  state.marksLocked = false;
  state.marksReport = null;
  markDailyPlay();
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
        translate: state.translate,
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
    row.classList.toggle('is-player', index === game.playerRow);
    const badge = row.querySelector('[data-row-clock]');
    if (badge) badge.textContent = game.rowClock(index);
  });
  return true;
}

function noteServerIdle(idleMs, warnMs) {
  const idle = Math.max(0, Number(idleMs) || 0);
  const now = Date.now();
  state.youIdleMs = idle;
  state.idleCheckedAt = now;
  if (Number(warnMs) > 0) state.idleWarnMs = Number(warnMs);
  if (!state.idleClockReady) {
    state.lastActivityAt = now - idle;
    state.idleClockReady = true;
    return;
  }
  const localIdle = now - state.lastActivityAt;
  if (idle + 3000 < localIdle) state.lastActivityAt = now - idle;
}

function idleElapsed() {
  const local = Date.now() - (state.lastActivityAt || Date.now());
  const server = (state.youIdleMs || 0) + (Date.now() - (state.idleCheckedAt || Date.now()));
  return Math.min(local, server);
}

function shouldIdleWarn() {
  if (!state.match?.id || (state.screen !== 'play' && state.screen !== 'match')) return false;
  const phase = state.match.phase;
  if (!['lobby', 'playing', 'review'].includes(phase)) return false;
  const me = state.match.players?.find((player) => player.userId === state.user?.id);
  if (!me || me.left || me.quit) return false;
  if (phase === 'review' && me.ready) return false;
  return idleElapsed() >= (state.idleWarnMs || 120000);
}

function watchIdle() {
  clearInterval(idleWatch);
  idleWatch = setInterval(() => {
    const warn = shouldIdleWarn();
    if (warn === state.idleWarn) return;
    state.idleWarn = warn;
    if (state.screen === 'play' || state.screen === 'match') render();
  }, 1000);
}

function notePlayActivity() {
  if (!state.match?.id || (state.screen !== 'play' && state.screen !== 'match')) return;
  const now = Date.now();
  state.lastActivityAt = now;
  if (state.idleWarn) {
    state.idleWarn = false;
    document.querySelector('.idle-warn')?.remove();
  }
  if (now - state.presenceSentAt < 2000) return;
  state.presenceSentAt = now;
  fetch(`/api/matches/${state.match.id}/pulse`, { method: 'POST' }).catch(() => {});
}

function onSubmit() {
  notePlayActivity();
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
  if (result.finished || state.game.over) {
    stopClocks();
    lockMarks(state.game);
  }
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
  if (key === 'Backspace' || key === 'Escape' || key === ' ' || key === 'Enter' || /^[a-zA-ZñÑ]$/.test(key)) {
    notePlayActivity();
  }
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
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    const index = state.game.source.findIndex((tile) => !tile.hidden && tile.wild);
    if (index >= 0) {
      state.game.place(index);
      state.popSlot = state.game.filledCount() - 1;
      sounds.tap();
      render();
    }
    return;
  }
  if (key === 'Enter') {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
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

function translateHtml(game) {
  if (!game?.translate || state.screen !== 'play') return '';
  const rows = game.previewWords();
  if (!rows.length) return '';
  return `
    <aside class="card translate-card">
      <span>Traducciones</span>
      <ul>
        ${rows.map((gloss) => `<li>${escapeHtml(gloss)}</li>`).join('')}
      </ul>
    </aside>
  `;
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

function shiftDay(iso, delta) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
}

function streakBucket() {
  try {
    const data = JSON.parse(localStorage.getItem('zap-streak') || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function currentStreak() {
  const row = streakBucket()[state.user?.id || 'local'];
  if (!row?.count || !row.lastDay) return 0;
  const now = today();
  if (row.lastDay === now || row.lastDay === shiftDay(now, -1)) return row.count;
  return 0;
}

function markDailyPlay() {
  if (!state.daily || state.match) return;
  const all = streakBucket();
  const id = state.user?.id || 'local';
  const now = today();
  const prev = all[id] || { lastDay: '', count: 0 };
  if (prev.lastDay === now) return;
  all[id] = { lastDay: now, count: prev.lastDay === shiftDay(now, -1) ? prev.count + 1 : 1 };
  localStorage.setItem('zap-streak', JSON.stringify(all));
}

function streakHtml() {
  if (state.playMode !== 'solo' || !state.daily) return '';
  const count = currentStreak();
  if (!count) return '';
  return `<p class="streak">${count === 1 ? '1 día de racha' : `${count} días seguidos`}</p>`;
}

function lockMarks(game) {
  if (!game || state.marksLocked) return;
  state.marksLocked = true;
  let all = {};
  try {
    all = JSON.parse(localStorage.getItem('zap-marks') || '{}') || {};
  } catch {
    all = {};
  }
  const key = `${state.user?.id || 'local'}|${state.modeId}|${state.skillId}|${state.daily && !state.match ? 'daily' : 'free'}`;
  const prev = all[key] || { combo: 0, word: '', zaps: 0 };
  const current = {
    combo: game.maxCombo || 0,
    word: game.longestWord || '',
    zaps: game.zapCount || 0,
  };
  const beaten = {
    combo: current.combo > (prev.combo || 0) && current.combo > 0,
    word: current.word.length > String(prev.word || '').length,
    zaps: current.zaps > (prev.zaps || 0) && current.zaps > 0,
  };
  all[key] = {
    combo: Math.max(prev.combo || 0, current.combo),
    word: beaten.word ? current.word : (prev.word || current.word || ''),
    zaps: Math.max(prev.zaps || 0, current.zaps),
  };
  localStorage.setItem('zap-marks', JSON.stringify(all));
  state.marksReport = { current, beaten };
}

function racePlayers() {
  if (!state.match) return [];
  return state.match.players.filter((player) => !player.left).map((player) => {
    const mine = player.userId === state.user?.id;
    const score = mine
      ? (player.total || 0) + (state.game?.pointsTotal || 0)
      : (player.liveScore ?? player.total ?? 0);
    return { name: player.name, score, mine };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function raceChips(players) {
  const best = players[0]?.score || 0;
  return players.map((player) => `
    <span class="race-chip ${player.mine ? 'mine' : ''} ${player.score === best && best > 0 ? 'lead' : ''}">
      <em>${escapeHtml(player.name)}</em><strong>${player.score}</strong>
    </span>
  `).join('');
}

function raceHtml() {
  if (!state.match || state.screen !== 'play') return '';
  const players = racePlayers();
  if (players.length < 2) return '';
  return `<div class="race-bar">${raceChips(players)}</div>`;
}

function raceCard() {
  const bar = raceHtml();
  if (!bar) return '';
  return `<aside class="card race-card"><span>Jugadores</span>${bar}</aside>`;
}

function paintRace() {
  const bars = app.querySelectorAll('.race-bar');
  if (!bars.length || !state.match) return;
  const html = raceChips(racePlayers());
  bars.forEach((bar) => { bar.innerHTML = html; });
}

function surpriseNote(game) {
  if (!game?.surprise) return '';
  const row = game.surprise.row + 1;
  if (game.surprise.kind === 'double') return `<p class="surprise-note">Fila ${row} vale el doble.</p>`;
  return `<p class="surprise-note">Fila ${row} solo suma con 5 letras o más.</p>`;
}

function tipButton(game) {
  const left = game.tipsLeft ?? 0;
  const spent = left <= 0 || !game.playing || game.over;
  return `
    <button class="tip-btn ${left <= 0 ? 'spent' : ''}" id="tip" type="button" ${spent ? 'disabled' : ''} aria-label="Tip, ${left} disponibles" title="Tres tips por ronda">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18h6M10 21h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M12 3a6 6 0 0 0-3.2 11.1c.5.4.8 1 .8 1.6V17h4.8v-1.3c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
      <span class="tip-count">${left}</span>
    </button>
  `;
}

function boardHtml(game) {
  const rows = game.grid.map((row, rowIndex) => {
    const slots = row.map((cell, slotIndex) => {
      const cls = cell.kind;
      const pop = cell.kind === 'filled' && rowIndex === game.playerRow && slotIndex === state.popSlot ? 'pop' : '';
      const tippedSlot = cell.tipped ? 'tip-placed' : '';
      const wild = cell.wild ? 'wild' : '';
      const disabled = cell.kind === 'filled' && rowIndex === game.playerRow ? '' : 'disabled';
      const label = cell.letter || '';
      return `<button class="slot ${cls} ${pop} ${tippedSlot} ${wild}" data-slot="${slotIndex}" ${disabled}>${label}</button>`;
    }).join('');
    const color = game.numberColors[rowIndex];
    const live = game.flash && rowIndex === game.timerRow ? 'live' : '';
    const player = rowIndex === game.playerRow ? 'is-player' : '';
    const rejected = game.tone === 'bad' && rowIndex === game.playerRow ? 'is-bad' : '';
    const points = game.rowPoints[rowIndex] ? `${game.rowPoints[rowIndex]}` : '';
    const clock = game.rowClock(rowIndex);
    const surprise = game.surprise?.row === rowIndex ? game.surprise.kind : '';
    const surpriseClass = surprise === 'double' ? 'surprise-double' : surprise === 'long' ? 'surprise-long' : '';
    const surpriseTag = surprise === 'double' ? 'x2' : surprise === 'long' ? '5+' : '';
    return `
      <div class="row ${player} ${rejected} ${surpriseClass}" data-row="${rowIndex}">
        <div class="num ${color} ${live}">${rowIndex + 1}</div>
        <div class="slots">${slots}</div>
        <div class="row-side">
          ${surpriseTag ? `<div class="surprise-tag">${surpriseTag}</div>` : ''}
          <div class="points">${points}</div>
          <div class="row-clock" data-row-clock>${clock}</div>
        </div>
      </div>
    `;
  }).join('');

  const tiles = game.source.map((tile, index) => `
    <button class="tile ${tile.hidden ? 'used' : ''} ${tile.wild ? 'wild' : ''} ${!tile.hidden && game.tipped?.has(index) ? 'tipped' : ''}" data-tile="${index}" ${tile.hidden ? 'disabled' : ''}>${tile.letter}</button>
  `).join('');

  return `
    <section class="card board ${game.combo >= 2 ? 'combo-hot' : ''}">
      <div class="warning">${game.warning || ''}</div>
      ${surpriseNote(game)}
      ${game.bonus ? `<div class="fx">${game.bonus}</div>` : ''}
      <div class="rows">${rows}</div>
    </section>
    <section class="card tray">
      <div class="tray-main">
        <div class="tray-letters">
          <div class="tray-row">
            ${tipButton(game)}
            <div class="tiles">${tiles}</div>
          </div>
          <p class="keys">Clic o teclado · Retroceso quita la última · Esc borra la fila · Espacio coloca el comodín · Enter comprueba</p>
          ${game.tipped?.size ? '<p class="tip-note">El foco marcó las fichas de una palabra.</p>' : ''}
        </div>
        ${game.over
          ? '<button class="submit-word" id="home-board" type="button">Página principal</button>'
          : `<button class="submit-word" id="submit" type="button" ${game.canSubmit() ? '' : 'disabled'}>TERMINAR PALABRA</button>`}
        <div class="time-box"><span>Tiempo</span><strong data-clock>${game.secondsLeft}</strong></div>
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

function scoreStamp(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${hours}:${minutes}`;
}

function scoreHeadHtml() {
  const mode = modeById(state.modeId).label;
  const skill = boardSkill(skillById(state.skillId).name);
  const gloss = state.translate ? ' con Traducción' : '';
  const subtitle = state.daily ? `Desafío del día · ${mode}${gloss}` : `${mode}${gloss}`;
  return `
    <div class="score-head">
      <h3 class="board-title">LOS MEJORES 10 RESULTADOS</h3>
      <p class="score-sub">${subtitle}</p>
      <p class="score-skill">(${skill})</p>
    </div>
  `;
}

function visibleScores() {
  const mode = modeById(state.modeId).label;
  const skill = boardSkill(skillById(state.skillId).name);
  return state.scores
    .filter((row) => {
      if (row.mode !== mode || boardSkill(row.skill) !== skill) return false;
      if (Boolean(row.translate) !== state.translate) return false;
      if (state.daily) return Boolean(row.daily) && row.day === today();
      return true;
    })
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
      <em>Nivel ${row.level} * ${scoreStamp(row.createdAt)}</em>
    </li>
  `).join('');
  return `<ol class="tops">${rows}</ol>`;
}

function googleLink() {
  return `<a class="google" href="/api/auth/google"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 17v-3H3v-4h7V7l5 5-5 5zm9-14H12v2h7v14h-7v2h9V3z"/></svg><span>Entrar con Google</span></a>`;
}

function accountHtml() {
  if (!state.authReady) return '';
  if (state.user) {
    return `<div class="account"><span>Entraste como <strong>${escapeHtml(state.user.name)}</strong></span><button class="ghost" id="logout" type="button">Salir</button></div>`;
  }
  return googleLink();
}

function saveFormHtml(game) {
  if (state.savedId) {
    return `<p class="saved">Tu puntuación de <strong>${game.pointsTotal}</strong> puntos ya se guardó como <strong>${escapeHtml(state.playerName || state.user?.name || '')}</strong>.</p>`;
  }
  if (!state.user) {
    return `
      <p>Tu puntuación es <strong>${game.pointsTotal}</strong> puntos. Entra con Google para guardarla.</p>
      ${accountHtml()}
      ${state.saveError ? `<p class="hint bad-note">${escapeHtml(state.saveError)}</p>` : ''}
    `;
  }
  if (state.savingScore) {
    return `<p>Tu puntuación es <strong>${game.pointsTotal}</strong> puntos. Guardando…</p>`;
  }
  return `
    <form id="save-score" class="save-score">
      <p>Tu puntuación es <strong>${game.pointsTotal}</strong> puntos. No se pudo guardar automáticamente.</p>
      <button class="primary" type="submit">GUARDAR SCORE</button>
    </form>
    ${state.saveError ? `<p class="hint bad-note">${escapeHtml(state.saveError)}</p>` : ''}
  `;
}

function invitesHtml() {
  if (!state.invites.length) return '';
  const invites = state.invites.map((match) => `
    <li>
      <strong>${escapeHtml(match.hostName || 'Un jugador')} te invitó a jugar</strong>
      <span>
        <button class="join" data-answer="yes" data-match="${match.id}" type="button">UNIRSE</button>
        <button class="ignore" data-answer="no" data-match="${match.id}" type="button">IGNORAR</button>
      </span>
    </li>
  `).join('');
  return `<div class="invite-alert"><h3>Invitación a una partida</h3><ul class="roster">${invites}</ul></div>`;
}

function countOptions(from, to, unit, selected) {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
    .map((count) => `<option value="${count}" ${selected === count ? 'selected' : ''}>${count} ${unit}</option>`)
    .join('');
}

function friendsPanel() {
  return `
    <p class="menu-label">Nueva partida</p>
    <div class="match-fields">
      <label>
        <span class="menu-label">Jugadores</span>
        <select id="seats">${countOptions(2, 10, 'jugadores', state.competeSeats)}</select>
      </label>
      <label>
        <span class="menu-label">Rondas</span>
        <select id="rounds">${countOptions(2, 10, 'rondas', state.competeRounds)}</select>
      </label>
    </div>
    <button class="primary" id="create-match" type="button">CREAR PARTIDA</button>
  `;
}

async function loadCompeteLists() {
  const [history, invites] = await Promise.all([
    fetch('/api/history').then((response) => response.json()).catch(() => []),
    state.user ? fetch('/api/invites').then((response) => response.json()).catch(() => []) : Promise.resolve([]),
  ]);
  state.history = Array.isArray(history) ? history : [];
  state.invites = Array.isArray(invites) ? invites : [];
}

function watchInvites() {
  clearInterval(invitePoll);
  if (!state.user) return;
  invitePoll = setInterval(async () => {
    if (state.screen !== 'menu') return;
    const before = state.invites.map((match) => match.id).join();
    await loadCompeteLists();
    const after = state.invites.map((match) => match.id).join();
    if (before !== after && state.screen === 'menu') render();
  }, 4000);
}

async function showPlayMode(mode) {
  state.playMode = mode;
  state.error = mode === 'friends' && !state.user ? 'Entra con Google para jugar con amigos' : '';
  if (mode === 'friends') await loadCompeteLists();
  if (state.screen === 'menu') render();
}

function watchMatch() {
  clearInterval(matchPoll);
  if (!state.match?.id) return;
  matchPoll = setInterval(() => { refreshMatch(); }, 1200);
}

async function republishBoard() {
  if (!state.match || state.match.phase !== 'review' || !state.game || !state.user) return;
  const mine = state.match.players.find((player) => player.userId === state.user.id);
  const local = state.game.snapshot();
  if (!local.words.length || local.words.length <= (mine?.board?.words || []).length) return;
  if ((state.boardRepublish || 0) >= 3) return;
  state.boardRepublish = (state.boardRepublish || 0) + 1;
  await postBoard(state, false);
}

function maybeStartSound(match) {
  const started = Number(match?.startedAt) || 0;
  if (!started || started === state.heardStart) return;
  if (Date.now() - started > 8000) {
    state.heardStart = started;
    return;
  }
  state.heardStart = started;
  sounds.startMatch();
}

function showDeparture(text) {
  if (!text) return;
  state.departureNote = text;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    state.departureNote = '';
    if (state.screen === 'play' || state.screen === 'match') render();
  }, 6500);
}

function collectNotices(match) {
  const fresh = (match.notices || []).filter((notice) => notice.userId !== state.user?.id && !state.seenNoticeIds.has(notice.id));
  fresh.forEach((notice) => state.seenNoticeIds.add(notice.id));
  return fresh.map((notice) => notice.text).join(' ');
}

async function sendLobbyPresence() {
  if (!state.match?.id || state.match.phase !== 'lobby' || state.screen !== 'match' || document.hidden) return;
  if (Date.now() - state.lobbyPulseAt < 15000) return;
  state.lobbyPulseAt = Date.now();
  await fetch(`/api/matches/${state.match.id}/pulse`, { method: 'POST' }).catch(() => {});
}

async function refreshMatch() {
  if (!state.match?.id || state.screen === 'play' && document.hidden) return;
  await sendLobbyPresence();
  const response = await fetch(`/api/matches/${state.match.id}`);
  if (!response.ok) return;
  const next = await response.json();
  const previous = state.match.phase;
  const stamp = JSON.stringify(next);
  const changed = stamp !== state.matchStamp;
  state.match = next;
  state.matchStamp = stamp;
  noteServerIdle(next.youIdleMs, next.idleWarnMs);
  maybeStartSound(next);
  const me = next.players.find((player) => player.userId === state.user?.id);
  if (me?.left || me?.quit) {
    const idle = Boolean(me.idle);
    await fetch(`/api/matches/${next.id}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idle }),
    }).catch(() => {});
    leaveMatch(idle ? 'Se cerró tu lugar por inactividad. Los demás siguen la partida.' : me.quit ? '' : 'Ya no estás en esta partida.');
    return;
  }
  const note = collectNotices(next);
  if (note) showDeparture(note);
  if (next.phase === 'review') await republishBoard();
  if (previous === 'playing' && next.phase === 'review' && state.screen === 'play') {
    stopClocks();
    await postBoard(state, false);
    state.screen = 'match';
    state.viewPodium = false;
    render();
    return;
  }
  const others = next.players.filter((player) => !player.left && player.userId !== state.user?.id);
  if (me?.replay && others.length === 0 && (next.phase === 'review' || next.phase === 'podium' || state.viewPodium)) {
    await fetch(`/api/matches/${next.id}/leave`, { method: 'POST' });
    leaveMatch('Ningún jugador ha seleccionado volver a jugar.');
    return;
  }
  if (next.phase === 'playing' && state.screen === 'match' && previous !== 'playing') {
    state.viewPodium = false;
    await beginCompeteRound();
    return;
  }
  if (next.phase === 'lobby' && previous !== 'lobby' && state.screen === 'match') {
    state.viewPodium = false;
    state.game = null;
    render();
    return;
  }
  if (state.screen === 'match' && (changed || note)) render();
  if (state.screen === 'play' && next.phase === 'playing') {
    if (note) render();
    else paintRace();
  }
}

function leaveMatch(message) {
  clearInterval(matchPoll);
  clearTimeout(noteTimer);
  state.match = null;
  state.matchStamp = '';
  state.viewPodium = false;
  state.game = null;
  state.screen = 'menu';
  state.error = message || '';
  state.departureNote = '';
  state.seenNoticeIds = new Set();
  state.presenceSentAt = 0;
  state.lobbyPulseAt = 0;
  state.heardStart = 0;
  state.idleWarn = false;
  state.idleClockReady = false;
  state.youIdleMs = 0;
  state.lastActivityAt = Date.now();
  state.idleCheckedAt = Date.now();
  history.replaceState(null, '', '/');
  render();
}

async function beginCompeteRound() {
  const match = state.match;
  const mode = modeById(match.modeId);
  const dictionary = await loadDictionary(mode);
  state.game = new Game(dictionary, match.skillId, {
    seed: match.seed,
    compete: true,
    modeId: match.modeId,
    translate: Boolean(match.translate),
    priorWords: match.playedWords || [],
    ownWords: match.myWords || [],
  });
  state.marksLocked = false;
  state.marksReport = null;
  state.game.start();
  state.screen = 'play';
  state.followedRow = null;
  state.boardRepublish = 0;
  startClocks();
  render();
}

async function openMatch(data) {
  state.match = data;
  state.matchStamp = JSON.stringify(data);
  maybeStartSound(data);
  state.viewPodium = false;
  state.playMode = 'friends';
  state.error = '';
  history.replaceState(null, '', `/?partida=${data.id}`);
  watchMatch();
  const note = collectNotices(data);
  if (note) showDeparture(note);
  if (data.phase === 'playing') {
    await beginCompeteRound();
    return;
  }
  state.game = null;
  state.screen = 'match';
  render();
}

async function enterMatch(id) {
  if (!state.user) {
    state.pendingMatch = id;
    window.location.href = `/api/auth/google?partida=${encodeURIComponent(id)}`;
    return;
  }
  const response = await fetch(`/api/matches/${id}/join`, { method: 'POST' });
  const data = await response.json();
  if (!response.ok) {
    state.error = data.error || 'No se pudo entrar';
    history.replaceState(null, '', '/');
    state.screen = 'menu';
    render();
    return;
  }
  await openMatch(data);
}

async function resumeActiveMatch() {
  const response = await fetch('/api/matches/active').catch(() => null);
  if (!response?.ok) return false;
  const data = await response.json();
  if (!data?.match) return false;
  await openMatch(data.match);
  return true;
}

async function exitGame() {
  stopClocks();
  if (state.match?.id) {
    const response = await fetch(`/api/matches/${state.match.id}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quit: true }),
    });
    if (!response.ok) {
      state.departureNote = 'No se pudo salir. Intenta de nuevo.';
      if (state.screen === 'play') startClocks();
      render();
      return;
    }
    leaveMatch('');
    return;
  }
  state.game = null;
  state.screen = 'menu';
  state.savedId = null;
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
          <div class="theme-picker">
            <p class="menu-label">Color</p>
            <div class="themes">
              ${THEMES.map((theme) => `<button class="swatch ${theme.id === state.theme ? 'active' : ''}" data-theme="${theme.id}">${theme.name}</button>`).join('')}
            </div>
          </div>
          <div class="menu-hero-copy">
            <h2>Arma palabras antes de que se acabe el tiempo <span class="version">v${VERSION}</span></h2>
            <p class="hint">${mode.hint} Diez filas de ocho letras. El reloj avanza por las filas y cada palabra válida reparte fichas nuevas.</p>
          </div>
        </header>
        ${invitesHtml()}
        <div class="folder ${state.playMode === 'solo' ? 'is-solo' : 'is-friends'}">
        <div class="play-tabs" role="tablist">
          <button class="${state.playMode === 'solo' ? 'active' : ''}" data-play="solo" type="button" role="tab" aria-selected="${state.playMode === 'solo'}">Solo</button>
          <button class="${state.playMode === 'friends' ? 'active' : ''} ${state.invites.length ? 'invite-tab' : ''}" data-play="friends" type="button" role="tab" aria-selected="${state.playMode === 'friends'}">Con amigos</button>
        </div>
        <div class="menu-grid">
          <section class="menu-setup">
            ${state.user ? `<p class="account-line">Entraste como <strong>${escapeHtml(state.user.name)}</strong></p>` : ''}
            <p class="menu-label">Idioma</p>
            <div class="choices">${modes}</div>
            <p class="menu-label">Nivel</p>
            <div class="skills">${skills}</div>
            ${state.playMode === 'solo' ? `
              <label class="check-line" for="daily">
                <input id="daily" type="checkbox" ${state.daily ? 'checked' : ''} />
                <span>Desafío del día · ${today()}</span>
              </label>
            ` : ''}
            <label class="check-line" for="translate">
              <input id="translate" type="checkbox" ${state.translate ? 'checked' : ''} />
              <span>Modo traducción</span>
            </label>
            <p class="hint">En modo traducción ves hasta 3 traducciones de palabras que puedes formar. Escribe la palabra en el idioma del tablero.</p>
            <button class="rules-link" id="rules" type="button">Instrucciones</button>
            ${streakHtml()}
            ${state.playMode === 'friends' ? friendsPanel() : ''}
            ${state.error ? `<p class="hint">${state.error}</p>` : ''}
            <div class="sheet-actions">
              ${state.playMode === 'solo' ? '<button class="primary" id="play">JUGAR</button>' : ''}
              ${state.user ? '<button class="ghost" id="logout" type="button">SALIR</button>' : googleLink()}
            </div>
          </section>
          <section class="menu-scores">
            ${state.playMode === 'friends' ? historyHtml(state.history) : `${scoreHeadHtml()}${scoresHtml()}`}
          </section>
        </div>
        </div>
      </div>
    </div>
  `;
}

function rulesHtml() {
  return `
    <div class="overlay rules-overlay">
      <div class="sheet rules-sheet" role="dialog" aria-labelledby="rules-title">
        <p class="eyebrow">Cómo se cuentan los puntos</p>
        <h2 id="rules-title">Instrucciones</h2>
        <p class="hint">Cada palabra válida suma en el momento en que se acepta. El número verde de la fila es el puntaje de esa palabra. Puntos es la suma de todas.</p>
        <h3>Modo traducción</h3>
        <p class="hint">Si lo activas en el menú, durante la partida aparece una tarjeta con hasta 3 traducciones. Cada una es de una palabra distinta del diccionario que puedes formar con las letras que tienes en ese momento. La tarjeta no muestra la palabra, solo su traducción. Tú escribes la palabra en el idioma del tablero.</p>
        <p class="hint">En Español → Inglés esas traducciones están en inglés. En Inglés → Español están en español. Si ya usaste una palabra en la partida, su traducción deja de aparecer.</p>
        <p class="rules-formula">puntos = nivel × letras × 10 × combo</p>
        <p class="hint">Después se aplican el ZAP y la fila sorpresa.</p>
        <h3>Nivel</h3>
        <table class="rules-table">
          <tbody>
            <tr><td>Principiante</td><td>1</td></tr>
            <tr><td>Intermedio</td><td>2</td></tr>
            <tr><td>Avanzado</td><td>3</td></tr>
          </tbody>
        </table>
        <p class="hint">Las letras son las de la palabra aceptada. El mínimo para enviarla es 3 y el máximo es 8. El comodín cuenta como una letra de la palabra que el juego resolvió.</p>
        <h3>Combo</h3>
        <p class="hint">Empieza en 1. Sube en 1 cada vez que aceptas otra palabra mientras el reloj sigue en la misma fila del tiempo. Si el reloj baja a la fila siguiente antes de tu próxima palabra, el combo vuelve a 1.</p>
        <p class="hint">En Principiante, una palabra de 4 letras vale 40 con combo 1, 80 con combo 2 y 120 con combo 3. Una de 3 letras con combo 2 vale 60.</p>
        <h3>ZAP</h3>
        <p class="hint">Si la palabra llena las 8 casillas, además del cálculo normal se suman nivel × 100. En Principiante, 8 letras y combo 1 valen 180. En Intermedio, la misma palabra vale 360.</p>
        <h3>Fila sorpresa</h3>
        <p class="hint">Cada nivel tiene una fila especial. Si vale el doble, se calcula todo lo anterior, incluido el ZAP, y el resultado se multiplica por 2. Cuatro letras en Principiante con combo 1 valen 80. Con combo 3 valen 240.</p>
        <p class="hint">Si la fila solo suma con 5 letras o más, las palabras de 5, 6, 7 u 8 letras usan el puntaje normal. Con 3 o 4 letras esa fila vale 0.</p>
        <h3>Lo que no suma</h3>
        <p class="hint">Una palabra que no está en el diccionario, o que tú ya usaste en esa partida, no se coloca y no suma. Al subir de nivel en solitario el tablero se vacía, el combo vuelve a 1 y los puntos acumulados se conservan.</p>
        <p class="hint">Entre amigos, al cerrar la ronda, si dos o más jugadores formaron la misma palabra, esa palabra se tacha para todos y vale 0. Las demás se quedan con sus puntos.</p>
        <div class="sheet-actions">
          <button class="primary" id="rules-close" type="button">Cerrar</button>
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
  if (nearGap(game)) return '';
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

function nearGap(game) {
  const gap = (state.targetPoints || 0) - game.pointsTotal;
  return gap > 0 && gap <= 150 ? gap : 0;
}

function nearMissHtml(game) {
  const gap = nearGap(game);
  if (!gap) return '';
  return `
    <div class="near-miss">
      <div>
        <p>Te faltaron</p>
        <strong>${gap}</strong>
      </div>
      <button class="primary" id="again" type="button">Jugar de nuevo</button>
    </div>
  `;
}

function marksHtml() {
  const report = state.marksReport;
  if (!report) return '';
  const chip = (label, value, beaten) => `
    <div class="mark ${beaten ? 'fresh' : ''}">
      <span>${label}</span>
      <strong>${escapeHtml(value)}</strong>
      ${beaten ? '<em>Nuevo</em>' : ''}
    </div>
  `;
  return `
    <div class="marks">
      ${chip('Mejor combo', report.current.combo || 0, report.beaten.combo)}
      ${chip('Palabra más larga', report.current.word || '—', report.beaten.word)}
      ${chip('ZAP en la partida', report.current.zaps || 0, report.beaten.zaps)}
    </div>
  `;
}

function shownRacks(game) {
  return (game.racks || []).filter((rack) => rack.shown);
}

function rackAlternatives(game, rack) {
  return game.wordsForRack(rack)
    .filter((word) => word !== rack.played)
    .sort((a, b) => b.length - a.length || a.localeCompare(b, 'es'))
    .slice(0, 2);
}

function firstReviewWord(game) {
  const racks = shownRacks(game);
  const wrote = racks.find((rack) => rack.played);
  if (wrote) return wrote.played;
  for (const rack of racks) {
    const alternative = rackAlternatives(game, rack)[0];
    if (alternative) return alternative;
  }
  return '';
}

function reviewWordButton(word) {
  return `<button type="button" class="${word === state.selectedWord ? 'active' : ''}" data-review="${escapeHtml(word)}">${escapeHtml(word)}</button>`;
}

function reviewWordsHtml(game) {
  const meaning = state.selectedWord ? game.dictionary[state.selectedWord] || '' : '';
  const rows = shownRacks(game).map((rack) => {
    const letters = rack.letters.map((tile) => `<span>${escapeHtml(tile.wild ? '★' : tile.letter)}</span>`).join('');
    const wrote = rack.played ? reviewWordButton(rack.played) : '<span class="vocab-empty">—</span>';
    const alternatives = rackAlternatives(game, rack).map((word) => reviewWordButton(word)).join('');
    return `
      <tr>
        <td><div class="vocab-letters">${letters}</div></td>
        <td>${wrote}</td>
        <td><div class="vocab-alts">${alternatives || '<span class="vocab-empty">—</span>'}</div></td>
      </tr>
    `;
  }).join('');
  return `
    <h2>Expande tu vocabulario</h2>
    <div class="vocab-layout">
      <div class="vocab-table-wrap">
        <table class="vocab-table">
          <thead>
            <tr>
              <th>Letras disponibles</th>
              <th>Escribiste</th>
              <th>Alternativas</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="3">No hay rondas para mostrar.</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="review-detail">
        ${state.selectedWord ? `
          <h3>${escapeHtml(state.selectedWord)}</h3>
          <pre>${escapeHtml(meaning)}</pre>
        ` : '<p class="hint">Elige una palabra para ver su significado.</p>'}
      </div>
    </div>
  `;
}

function reviewHtml(game) {
  return `
    <div class="overlay">
      <div class="sheet">
        <p class="eyebrow">Fin del juego</p>
        <h2>Tu puntuación</h2>
        ${saveFormHtml(game)}
        ${nearMissHtml(game)}
        ${personalHtml(game)}
        ${marksHtml()}
        ${scoreHeadHtml()}
        ${scoresHtml()}
        ${reviewWordsHtml(game)}
        <div class="sheet-actions">
          ${nearGap(game) ? '' : '<button class="ghost" id="again" type="button">Jugar de nuevo</button>'}
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
  const board = app.querySelector('.board');
  if (!row || !board || board.scrollHeight <= board.clientHeight + 1) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

function captureGlide() {
  if (state.screen !== 'play') return null;
  const row = app.querySelector('.row.is-player');
  if (!row) return null;
  return {
    row: Number(row.dataset.row),
    top: row.offsetTop,
    left: row.offsetLeft,
    width: row.offsetWidth,
    height: row.offsetHeight,
  };
}

function slideHighlight(from) {
  if (state.screen !== 'play' || !state.game) return;
  const board = app.querySelector('.board');
  const row = board?.querySelector('.row.is-player');
  if (!board || !row) return;
  const ring = document.createElement('div');
  ring.className = 'glide-ring';
  board.appendChild(ring);
  const to = {
    top: row.offsetTop,
    left: row.offsetLeft,
    width: row.offsetWidth,
    height: row.offsetHeight,
  };
  const moved = from && from.row !== state.game.playerRow;
  const start = moved ? from : to;
  ring.style.transition = 'none';
  ring.style.transform = `translate(${start.left}px, ${start.top}px)`;
  ring.style.width = `${start.width}px`;
  ring.style.height = `${start.height}px`;
  if (!moved) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ring.style.transition = 'transform 560ms cubic-bezier(.22, .8, .28, 1), height 560ms cubic-bezier(.22, .8, .28, 1), width 560ms cubic-bezier(.22, .8, .28, 1)';
      ring.style.transform = `translate(${to.left}px, ${to.top}px)`;
      ring.style.width = `${to.width}px`;
      ring.style.height = `${to.height}px`;
    });
  });
}

function render() {
  if (state.screen !== 'play') stopClocks();
  if (state.screen === 'review') sounds.stopAll();
  const glideFrom = captureGlide();
  const overlay = app.querySelector('.overlay');
  const tableWrap = app.querySelector('.vocab-table-wrap');
  const keepOverlay = overlay ? overlay.scrollTop : 0;
  const keepTable = tableWrap ? tableWrap.scrollTop : 0;
  const keepWindow = window.scrollY;
  const game = state.game;
  const skill = game ? game.skill : skillById(state.skillId);
  const mode = modeById(state.modeId);
  const boardOn = Boolean(game && state.screen !== 'menu');
  app.innerHTML = `
    <div class="app${boardOn ? ' is-board' : ''}">
      ${boardOn ? '<div class="board-screen">' : ''}
      <header class="topbar">
        <div class="brand">
          <img class="brand-mark" src="/favicon.png" alt="" />
          <div>
            <span class="eyebrow">${mode.label}</span>
            <h1>Buensoft Zap <span class="version">v${VERSION}</span></h1>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><span>Nivel</span><strong>${game ? game.level : 1}</strong></div>
          <div class="stat"><span>Modo</span><strong style="font-size:16px">${skill.name}</strong></div>
          <div class="stat"><span>Marcador</span><strong>${game ? String(game.marker).padStart(2, '0') : '00'}</strong></div>
          <div class="stat"><span>Puntos</span><strong>${game ? game.pointsTotal : 0}</strong></div>
        </div>
        ${state.screen === 'play' ? '<button class="ghost exit-game" id="exit-game" type="button">Salir</button>' : ''}
      </header>
      ${state.departureNote ? `<p class="departure-note" role="status">${escapeHtml(state.departureNote)}</p>` : ''}
      ${state.screen === 'loading' ? '<p class="hint">Cargando diccionario…</p>' : ''}
      ${game && state.screen !== 'menu' ? `
        <div class="layout">
          <div class="side-col">
            ${translateHtml(game)}
            <aside class="card meaning">${meaningBlock(game)}</aside>
            <div class="race-slot race-slot-side">${raceCard()}</div>
            ${state.screen === 'play' && !state.match ? `
              <div class="target-bar ${state.recordShown ? 'beaten' : ''}">
                <span>${state.recordShown ? 'Nuevo top score' : 'Top a vencer'}</span>
                <strong>${state.targetPoints || '—'}</strong>
                <em>${state.targetName ? escapeHtml(state.targetName) : 'Sé el primero'}</em>
              </div>
            ` : ''}
          </div>
          <div class="play-main">${boardHtml(game)}</div>
        </div>
      ` : ''}
      ${boardOn ? '</div>' : ''}
      ${boardOn ? `<div class="race-slot race-slot-below">${raceCard()}</div>` : ''}
    </div>
    ${state.screen === 'menu' || state.screen === 'loading' && !game ? menuHtml() : ''}
    ${state.rulesOpen && state.screen === 'menu' ? rulesHtml() : ''}
    ${state.screen === 'splash' ? splashHtml() : ''}
    ${state.screen === 'review' && game && !state.match ? reviewHtml(game) : ''}
    ${state.screen === 'match' ? matchHtml(state) : ''}
    ${state.idleWarn ? '<div class="idle-warn" role="alert"><p>Llevas 2 minutos sin actividad. Si no vuelves al juego, en un minuto se te sacará de la partida.</p></div>' : ''}
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
  slideHighlight(glideFrom);
  const applyScroll = () => {
    const nextOverlay = app.querySelector('.overlay');
    const nextTable = app.querySelector('.vocab-table-wrap');
    if (nextOverlay) nextOverlay.scrollTop = keepOverlay;
    if (nextTable) nextTable.scrollTop = keepTable;
    if (keepWindow) window.scrollTo(0, keepWindow);
  };
  applyScroll();
  requestAnimationFrame(applyScroll);
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
  const rules = app.querySelector('#rules');
  if (rules) {
    rules.onclick = () => {
      state.rulesOpen = true;
      render();
    };
  }
  const rulesClose = app.querySelector('#rules-close');
  if (rulesClose) {
    rulesClose.onclick = () => {
      state.rulesOpen = false;
      render();
    };
  }
  app.querySelectorAll('[data-play]').forEach((button) => {
    button.onclick = () => showPlayMode(button.dataset.play);
  });
  const seats = app.querySelector('#seats');
  if (seats) seats.onchange = () => { state.competeSeats = Number(seats.value); };
  const rounds = app.querySelector('#rounds');
  if (rounds) rounds.onchange = () => { state.competeRounds = Number(rounds.value); };
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
          translate: state.translate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        state.error = data.error || 'No se pudo crear la partida';
        render();
        return;
      }
      const users = await fetch('/api/users').then((item) => item.json()).catch(() => []);
      state.users = Array.isArray(users) ? users : [];
      await openMatch(data);
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
      if (state.match.phase === 'review' && state.match.round >= state.match.rounds) {
        state.viewPodium = true;
        render();
        return;
      }
      matchReady.disabled = true;
      matchReady.classList.add('is-waiting');
      matchReady.textContent = 'ESPERANDO A LOS DEMÁS';
      const response = await fetch(`/api/matches/${state.match.id}/ready`, { method: 'POST' });
      state.match = await response.json();
      state.matchStamp = JSON.stringify(state.match);
      maybeStartSound(state.match);
      if (state.match.phase === 'playing') await beginCompeteRound();
      else render();
    };
  }
  const matchReplay = app.querySelector('#match-replay');
  if (matchReplay) {
    matchReplay.onclick = async () => {
      const response = await fetch(`/api/matches/${state.match.id}/replay`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        state.error = data.error || 'No se pudo volver a jugar';
        render();
        return;
      }
      if (data.replayEmpty) {
        await fetch(`/api/matches/${state.match.id}/leave`, { method: 'POST' });
        leaveMatch('Ningún jugador ha seleccionado volver a jugar.');
        return;
      }
      state.match = data;
      state.matchStamp = JSON.stringify(data);
      if (data.phase === 'lobby') state.viewPodium = false;
      render();
    };
  }
  const matchLeave = app.querySelector('#match-leave');
  if (matchLeave) {
    matchLeave.onclick = async () => {
      await fetch(`/api/matches/${state.match.id}/leave`, { method: 'POST' });
      leaveMatch('');
    };
  }
  const matchHome = app.querySelector('#match-home');
  if (matchHome) {
    matchHome.onclick = async () => {
      if (state.match?.id) await fetch(`/api/matches/${state.match.id}/leave`, { method: 'POST' });
      leaveMatch('');
    };
  }
  const copyLink = app.querySelector('#copy-link');
  if (copyLink) {
    copyLink.onclick = async () => {
      try {
        await navigator.clipboard.writeText(`${location.origin}/?partida=${state.match.id}`);
      } catch {
        return;
      }
      copyLink.textContent = 'COPIADO';
      copyLink.classList.add('copied');
      setTimeout(() => {
        copyLink.textContent = 'Copiar';
        copyLink.classList.remove('copied');
      }, 1400);
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
    daily.onchange = () => {
      state.daily = daily.checked;
      render();
    };
  }
  const translate = app.querySelector('#translate');
  if (translate) {
    translate.onchange = () => {
      state.translate = translate.checked;
      localStorage.setItem('zap-translate', state.translate ? '1' : '0');
      render();
    };
  }

  app.querySelectorAll('[data-tile]').forEach((button) => {
    button.onclick = () => {
      if (animating) return;
      notePlayActivity();
      state.game.place(Number(button.dataset.tile));
      state.popSlot = state.game.filledCount() - 1;
      sounds.tap();
      render();
    };
  });
  app.querySelectorAll('[data-slot]').forEach((button) => {
    button.onclick = () => {
      if (animating) return;
      notePlayActivity();
      state.game.removeFrom(Number(button.dataset.slot));
      state.popSlot = null;
      sounds.back();
      render();
    };
  });
  const submit = app.querySelector('#submit');
  if (submit) submit.onclick = onSubmit;
  const tip = app.querySelector('#tip');
  if (tip) {
    tip.onclick = () => {
      if (!state.game || animating) return;
      const ok = state.game.useTip();
      if (ok) {
        state.popSlot = state.game.tipSlot;
        sounds.tap();
      }
      render();
    };
  }

  app.querySelectorAll('[data-review-tab]').forEach((button) => {
    button.onclick = () => {
      state.reviewTab = 'used';
      const used = state.game?.played || [];
      if (used.length && !used.includes(state.selectedWord)) state.selectedWord = used[0];
      render();
    };
  });
  app.querySelectorAll('[data-review]').forEach((button) => {
    button.onclick = () => {
      state.selectedWord = button.dataset.review;
      render();
    };
  });
  const idleWarn = app.querySelector('.idle-warn');
  if (idleWarn) {
    idleWarn.onpointerdown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      notePlayActivity();
    };
  }
  const exitGameButton = app.querySelector('#exit-game');
  if (exitGameButton) exitGameButton.onclick = exitGame;
  const goHome = () => {
    stopClocks();
    state.game = null;
    state.screen = 'menu';
    state.savedId = null;
    render();
  };
  const again = app.querySelector('#again');
  if (again) {
    again.onclick = () => {
      stopClocks();
      beginMatch();
    };
  }
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
    loadCompeteLists().then(() => {
      watchInvites();
      if (state.screen === 'menu') render();
    });
  }
  if (new URLSearchParams(window.location.search).get('auth') === 'error') {
    state.error = 'Google no dejó entrar. Tu correo tiene que estar en los usuarios de prueba.';
  }
  const partida = new URLSearchParams(window.location.search).get('partida') || state.pendingMatch;
  if (partida) enterMatch(partida);
  else {
    render();
    if (state.user) resumeActiveMatch();
  }
});

window.addEventListener('pointerdown', () => sounds.ready(), { once: true });
window.addEventListener('pointerdown', () => notePlayActivity());
watchIdle();
window.addEventListener('keydown', onKey);
