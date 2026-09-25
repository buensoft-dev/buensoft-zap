import './style.css';
import { Game, MODES, SKILLS } from './game.js';

const app = document.querySelector('#app');
const cache = new Map();

const state = {
  modeId: 'es-en',
  skillId: 2,
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
  daily: false,
  theme: localStorage.getItem('zap-theme') || 'neon',
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
      state.screen = 'review';
      state.selectedWord = state.game.suggested[0] || '';
      state.savedId = null;
      refreshScores().then(() => {
        if (state.screen === 'review') render();
      });
      render();
      return;
    }
    if (state.game.secondsLeft > 0 && state.game.secondsLeft <= 3) sounds.tick();
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
  const name = playerName(state.playerName).trim();
  state.playerName = name;
  if (!name.replace(/ /g, '')) {
    state.saveError = 'Escribe tu nombre, máximo 20 letras';
    render();
    return;
  }
  const response = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
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

function beginMatch() {
  state.savedId = null;
  state.saveError = '';
  const mode = modeById(state.modeId);
  const skill = skillById(state.skillId);
  state.screen = 'loading';
  render();
  loadDictionary(mode)
    .then((dictionary) => {
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
    if (badge) badge.textContent = index === game.timerRow ? `${game.secondsLeft}s` : '';
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
    const clock = rowIndex === game.timerRow ? `${game.secondsLeft}s` : '';
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

function saveFormHtml(game) {
  if (state.savedId) {
    return `<p class="saved">Puntuación de <strong>${escapeHtml(state.playerName)}</strong> guardada: ${game.pointsTotal} puntos.</p>`;
  }
  return `
    <form id="save-score" class="save-score">
      <p>Tu puntuación es <strong>${game.pointsTotal}</strong> puntos. El nombre admite máximo 20 letras.</p>
      <input id="player-name" maxlength="20" placeholder="Tu nombre" value="${escapeHtml(state.playerName)}" autocomplete="name" />
      <span class="name-count">${playerName(state.playerName).trim().length}/20</span>
      <button class="primary" type="submit">GUARDAR SCORE</button>
    </form>
    ${state.saveError ? `<p class="hint bad-note">${escapeHtml(state.saveError)}</p>` : ''}
  `;
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
      <div class="sheet">
        <p class="eyebrow">Buensoft Zap</p>
        <h2>Arma palabras antes de que se acabe el tiempo</h2>
        <p class="hint">${mode.hint} Hay 10 filas de 7 letras. El reloj avanza solo por las filas; cada palabra válida te da fichas nuevas y puntos según el modo (nivel × letras × 10). Las palabras no se pueden repetir.</p>
        <div class="choices">${modes}</div>
        <div class="skills">${skills}</div>
        <button class="choice ${state.daily ? 'active' : ''}" id="daily">Desafío del día · ${today()}</button>
        <div class="themes">
          ${THEMES.map((theme) => `<button class="swatch ${theme.id === state.theme ? 'active' : ''}" data-theme="${theme.id}">${theme.name}</button>`).join('')}
        </div>
        ${state.error ? `<p class="hint">${state.error}</p>` : ''}
        <h3 class="board-title">${scoreTitle()}</h3>
        ${scoresHtml()}
        <div class="sheet-actions">
          <button class="primary" id="play">JUGAR</button>
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
          <span class="eyebrow">${mode.label}</span>
          <h1>Buensoft Zap</h1>
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
          <aside class="card meaning">${meaningBlock(game)}</aside>
          <div>${boardHtml(game)}</div>
        </div>
      ` : ''}
    </div>
    ${state.screen === 'menu' || state.screen === 'loading' && !game ? menuHtml() : ''}
    ${state.screen === 'splash' ? splashHtml() : ''}
    ${state.screen === 'review' && game ? reviewHtml(game) : ''}
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
refreshScores().finally(() => render());

window.addEventListener('pointerdown', () => sounds.ready(), { once: true });
window.addEventListener('keydown', onKey);
