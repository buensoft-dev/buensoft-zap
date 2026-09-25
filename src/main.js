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
};

let timerId = 0;
let flashId = 0;

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
    }
    render();
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
  const name = state.playerName.trim();
  if (!name) {
    state.saveError = 'Escribe tu nombre';
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
      state.game = new Game(dictionary, skill.id);
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
  state.game.resumeAfterLevel();
  state.screen = 'play';
  startClocks();
  render();
}

function onSubmit() {
  const result = state.game.submit();
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
  if (key === 'Backspace') {
    event.preventDefault();
    state.game.backspace();
    render();
    return;
  }
  if (key === 'Escape') {
    state.game.clearRow();
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
      const cls = cell.kind === 'filled' || cell.kind === 'locked' ? cell.kind : cell.kind;
      const disabled = cell.kind === 'filled' && rowIndex === game.playerRow ? '' : 'disabled';
      const label = cell.letter || '';
      return `<button class="slot ${cls}" data-slot="${slotIndex}" ${disabled}>${label}</button>`;
    }).join('');
    const color = game.numberColors[rowIndex];
    const live = game.flash && rowIndex === game.timerRow ? 'live' : '';
    const player = rowIndex === game.playerRow ? 'is-player' : '';
    const rejected = game.tone === 'bad' && rowIndex === game.playerRow ? 'is-bad' : '';
    const points = game.rowPoints[rowIndex] ? `${game.rowPoints[rowIndex]} Points` : '';
    return `
      <div class="row ${player} ${rejected}">
        <div class="num ${color} ${live}">${rowIndex + 1}</div>
        <div class="slots">${slots}</div>
        <div class="points">${points}</div>
      </div>
    `;
  }).join('');

  const tiles = game.source.map((tile, index) => `
    <button class="tile ${tile.hidden ? 'used' : ''}" data-tile="${index}" ${tile.hidden ? 'disabled' : ''}>${tile.letter}</button>
  `).join('');

  return `
    <section class="card board">
      <div class="warning">${game.warning || ''}</div>
      ${rows}
    </section>
    <section class="card tray">
      <div>
        <div class="tiles">${tiles}</div>
        <p class="keys">Clic o teclado · Retroceso quita la última · Esc borra la fila · Espacio comprueba</p>
      </div>
      <div class="actions">
        <button class="primary" id="submit" ${game.canSubmit() ? '' : 'disabled'}>TERMINAR PALABRA</button>
        <div class="stat"><span>Tiempo</span><strong>${game.secondsLeft}</strong></div>
      </div>
    </section>
  `;
}

function scoresHtml() {
  if (!state.scores.length) {
    return '<p class="hint">Aún no hay puntajes. El primero en terminar una partida aparece aquí.</p>';
  }
  const rows = state.scores.map((row, index) => `
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
      <p>Tu puntuación es <strong>${game.pointsTotal}</strong> puntos. Escribe tu nombre para entrar en el top.</p>
      <input id="player-name" maxlength="20" placeholder="Tu nombre" value="${escapeHtml(state.playerName)}" autocomplete="name" />
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
        ${state.error ? `<p class="hint">${state.error}</p>` : ''}
        <h3 class="board-title">Top scores</h3>
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
        <h3 class="board-title">Top scores</h3>
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
          <button class="primary" id="close-review">OK</button>
        </div>
      </div>
    </div>
  `;
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

  app.querySelectorAll('[data-tile]').forEach((button) => {
    button.onclick = () => {
      state.game.place(Number(button.dataset.tile));
      render();
    };
  });
  app.querySelectorAll('[data-slot]').forEach((button) => {
    button.onclick = () => {
      state.game.removeFrom(Number(button.dataset.slot));
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
  const again = app.querySelector('#again');
  if (again) {
    again.onclick = () => {
      stopClocks();
      state.game = null;
      state.screen = 'menu';
      render();
    };
  }
  const closeReview = app.querySelector('#close-review');
  if (closeReview) {
    closeReview.onclick = () => {
      state.screen = 'play';
      render();
    };
  }
  const saveForm = app.querySelector('#save-score');
  if (saveForm) saveForm.onsubmit = saveScore;
  const nameInput = app.querySelector('#player-name');
  if (nameInput) {
    nameInput.oninput = () => {
      state.playerName = nameInput.value;
    };
  }
}

refreshScores().finally(() => render());

window.addEventListener('keydown', onKey);
