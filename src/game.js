export const ROWS = 10;
export const SLOTS = 7;
export const TILES = 12;
export const MIN_LETTERS = 3;

export const MODES = [
  { id: 'es-en', file: 'es-en.json', label: 'Español → Inglés', hint: 'Forma palabras en español. La definición aparece en inglés.' },
  { id: 'en-es', file: 'en-es.json', label: 'Inglés → Español', hint: 'Forma palabras en inglés. La definición aparece en español.' },
];

export const SKILLS = [
  { id: 1, name: 'Principiante', splash: 'MODO PRINCIPIANTE', seconds: 20 },
  { id: 2, name: 'Intermedio', splash: 'MODO INTERMEDIO', seconds: 10 },
  { id: 3, name: 'Avanzado', splash: 'MODO AVANZADO', seconds: 5 },
];

const VOWELS = 'AEIOU';
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

function hashString(text) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyCell() {
  return { letter: '', source: -1, kind: 'open' };
}

function pickSurprise(key, level) {
  const rng = mulberry32(hashString(`sorpresa|${key}|${level}`));
  return {
    row: Math.floor(rng() * ROWS),
    kind: rng() < 0.5 ? 'double' : 'long',
  };
}

export function shortGloss(entry) {
  const raw = String(entry || '');
  const sense = raw.match(/(?:^|\n)\s*1\.\s*(?:\([^)]*\)\s*)?([^\n.]{1,48})/);
  if (sense) {
    return sense[1]
      .replace(/\s+(masculine|feminine|noun|verbo|sustantivo|adverbio).*$/i, '')
      .replace(/[,;].*$/, '')
      .trim();
  }
  const line = raw.split('\n').map((item) => item.trim()).find((item) => (
    item && !item.includes('·') && !/^\([^)]*\)$/.test(item) && !/^(interjection|adverb|adverbio|sustantivo|verbo|masculine|feminine|noun)\b/i.test(item)
  ));
  return line ? line.split(/[.;]/)[0].trim().slice(0, 48) : '';
}

export class Game {
  constructor(dictionary, skillId, options = {}) {
    this.dictionary = dictionary;
    this.words = Object.keys(dictionary);
    this.skill = SKILLS.find((item) => item.id === skillId) || SKILLS[1];
    this.daily = Boolean(options.daily);
    this.day = options.day || '';
    this.rng = options.seed
      ? mulberry32(hashString(String(options.seed)))
      : (this.daily ? mulberry32(hashString(`${this.day}|${options.modeId || ''}`)) : null);
    this.compete = Boolean(options.compete);
    this.translate = Boolean(options.translate);
    this.previewKey = '';
    this.previewList = [];
    this.surpriseKey = options.seed
      ? String(options.seed)
      : (this.daily ? `${this.day}|${options.modeId || ''}` : `libre|${Date.now()}|${Math.random()}`);
    this.maxCombo = 0;
    this.longestWord = '';
    this.zapCount = 0;
    this.combo = 0;
    this.comboTimerRow = -1;
    this.bonus = '';
    this.level = 1;
    this.secsPerSlot = this.skill.seconds;
    this.intScore = 0;
    this.wordsCompleted = 0;
    this.pointsTotal = 0;
    this.used = new Set();
    this.suggested = [];
    this.source = Array.from({ length: TILES }, () => ({ letter: '', hidden: false }));
    this.grid = Array.from({ length: ROWS }, () => Array.from({ length: SLOTS }, emptyCell));
    this.playerRow = 0;
    this.timerRow = 0;
    this.rowSeconds = Array.from({ length: ROWS }, () => this.secsPerSlot);
    this.secondsLeft = this.secsPerSlot;
    this.playing = false;
    this.over = false;
    this.numberColors = Array.from({ length: ROWS }, () => 'idle');
    this.rowPoints = Array.from({ length: ROWS }, () => 0);
    this.flash = false;
    this.warning = '';
    this.headline = '';
    this.meaning = '';
    this.tone = '';
    this.struck = false;
    this.deal();
    this.surprise = pickSurprise(this.surpriseKey, this.level);
    this.tipsLeft = 3;
    this.tipped = new Set();
    this.tipSlot = -1;
  }

  get marker() {
    if (this.wordsCompleted === 0) return 0;
    return this.intScore - 1;
  }

  snapshot() {
    const words = [];
    this.grid.forEach((row, index) => {
      const word = row.filter((cell) => cell.kind === 'locked').map((cell) => cell.letter).join('');
      if (word) words.push({ word, points: this.rowPoints[index] || 0 });
    });
    return {
      words,
      grid: this.grid.map((row) => row.map((cell) => cell.letter || '')),
      pointsTotal: this.pointsTotal,
    };
  }

  start() {
    this.playing = true;
    this.secondsLeft = this.masterTime();
    this.warning = '';
  }

  masterTime() {
    if (this.timerRow >= ROWS) return 0;
    const last = Math.min(Math.max(this.playerRow, this.timerRow), ROWS - 1);
    let sum = 0;
    for (let index = this.timerRow; index <= last; index += 1) sum += this.rowSeconds[index] || 0;
    return sum;
  }

  rowClock(index) {
    if (index < this.timerRow || index > this.playerRow || index >= ROWS) return '';
    const left = this.rowSeconds[index] || 0;
    if (left <= 0) return '';
    return `${left}s`;
  }

  filledCount(row = this.playerRow) {
    return this.grid[row].filter((cell) => cell.kind === 'filled').length;
  }

  canSubmit() {
    return this.playing && !this.over && this.filledCount() >= MIN_LETTERS;
  }

  place(sourceIndex) {
    if (!this.playing || this.over) return;
    const tile = this.source[sourceIndex];
    if (!tile || tile.hidden || !tile.letter) return;
    const row = this.grid[this.playerRow];
    if (row.some((cell) => cell.kind === 'locked' || cell.kind === 'blank')) return;
    const slot = row.findIndex((cell) => cell.kind === 'open');
    if (slot === -1) return;
    this.clearFeedback();
    tile.hidden = true;
    row[slot] = { letter: tile.letter, source: sourceIndex, kind: 'filled', wild: Boolean(tile.wild), tipped: this.tipped.has(sourceIndex) };
  }

  removeFrom(slotIndex) {
    if (!this.playing || this.over) return;
    const row = this.grid[this.playerRow];
    if (slotIndex < 0 || slotIndex >= SLOTS) return;
    if (row[slotIndex].kind !== 'filled') return;
    this.clearFeedback();
    for (let i = slotIndex; i < SLOTS; i += 1) {
      if (row[i].kind !== 'filled') continue;
      const sourceIndex = row[i].source;
      if (sourceIndex >= 0) this.source[sourceIndex].hidden = false;
      row[i] = emptyCell();
    }
  }

  backspace() {
    const row = this.grid[this.playerRow];
    let last = -1;
    row.forEach((cell, index) => {
      if (cell.kind === 'filled') last = index;
    });
    if (last >= 0) this.removeFrom(last);
  }

  clearRow() {
    const row = this.grid[this.playerRow];
    const first = row.findIndex((cell) => cell.kind === 'filled');
    if (first >= 0) this.removeFrom(first);
  }

  currentWord() {
    return this.grid[this.playerRow]
      .filter((cell) => cell.kind === 'filled')
      .map((cell) => cell.letter)
      .join('');
  }

  submit() {
    if (!this.canSubmit()) return { ok: false };
    const word = this.resolveWord();
    if (this.used.has(word)) {
      this.showReject(word, `La palabra "${word}", ya fué utilizada, no se pueden repetir las mismas palabras`);
      return { ok: false };
    }
    if (!Object.prototype.hasOwnProperty.call(this.dictionary, word)) {
      this.showReject(word, `La palabra "${word}" no se encuentra en el diccionario`);
      return { ok: false };
    }

    const row = this.grid[this.playerRow];
    const filled = row.map((cell, index) => (cell.kind === 'filled' ? index : -1)).filter((index) => index >= 0);
    word.split('').forEach((letter, index) => {
      row[filled[index]].letter = letter;
      row[filled[index]].wild = false;
    });
    const length = this.filledCount();
    if (this.comboTimerRow === this.timerRow) this.combo += 1;
    else this.combo = 1;
    this.comboTimerRow = this.timerRow;
    const zap = length === SLOTS;
    const surprise = this.surprise && this.surprise.row === this.playerRow ? this.surprise.kind : '';
    row.forEach((cell, index) => {
      if (cell.kind === 'open') row[index] = { letter: '', source: -1, kind: 'blank' };
      else if (cell.kind === 'filled') row[index] = { ...cell, kind: 'locked' };
    });

    this.used.add(word);
    this.wordsCompleted += 1;
    this.intScore += length + 1;
    let points = this.skill.id * length * 10 * this.combo + (zap ? this.skill.id * 100 : 0);
    const tags = [];
    if (this.combo > 1) tags.push(`COMBO x${this.combo}`);
    if (zap) tags.push('ZAP');
    if (surprise === 'double') {
      points *= 2;
      tags.push('DOBLE');
    } else if (surprise === 'long') {
      tags.push('FILA LARGA');
      if (length < 5) points = 0;
    }
    this.pointsTotal += points;
    this.bonus = tags.join(' · ');
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    if (word.length > this.longestWord.length) this.longestWord = word;
    if (zap) this.zapCount += 1;
    this.rowPoints[this.playerRow] = points;
    this.numberColors[this.playerRow] = 'done';
    if (this.timerRow === this.playerRow) this.flash = false;

    this.headline = word;
    this.meaning = this.dictionary[word] || '';
    this.tone = 'ok';
    this.struck = false;

    this.playerRow += 1;
    this.secondsLeft = this.masterTime();
    this.deal();

    if (this.playerRow >= ROWS) {
      if (this.compete) {
        this.playing = false;
        this.over = true;
        return { ok: true, zap, combo: this.combo, finished: true };
      }
      return { ok: true, zap, combo: this.combo, levelUp: this.advanceLevel() };
    }
    return { ok: true, zap, combo: this.combo };
  }

  tick() {
    if (!this.playing || this.over || this.timerRow >= ROWS) return { ended: false };
    this.rowSeconds[this.timerRow] -= 1;
    if (this.rowSeconds[this.timerRow] <= 0) {
      this.rowSeconds[this.timerRow] = 0;
      this.flash = false;
      this.warning = '';
      this.timerRow += 1;
      if (this.timerRow >= ROWS) {
        this.playing = false;
        this.over = true;
        this.secondsLeft = 0;
        return { ended: true };
      }
    }
    this.secondsLeft = this.masterTime();
    this.paintTimer();
    return { ended: false };
  }

  advanceLevel() {
    this.playing = false;
    this.level += 1;
    if (this.secsPerSlot > 5) this.secsPerSlot -= 1;
    this.grid = Array.from({ length: ROWS }, () => Array.from({ length: SLOTS }, emptyCell));
    this.numberColors = Array.from({ length: ROWS }, () => 'idle');
    this.rowPoints = Array.from({ length: ROWS }, () => 0);
    this.playerRow = 0;
    this.timerRow = 0;
    this.rowSeconds = Array.from({ length: ROWS }, () => this.secsPerSlot);
    this.secondsLeft = this.secsPerSlot;
    this.flash = false;
    this.warning = '';
    this.headline = '';
    this.meaning = '';
    this.tone = '';
    this.struck = false;
    this.combo = 0;
    this.comboTimerRow = -1;
    this.bonus = '';
    this.surprise = pickSurprise(this.surpriseKey, this.level);
    this.tipsLeft = 3;
    this.tipped = new Set();
    this.tipIndexes = null;
    this.tipSlot = -1;
    return {
      level: this.level,
      splash: `NIVEL ${this.level}`,
      mode: this.skill.splash,
    };
  }

  resumeAfterLevel() {
    this.playing = true;
    this.secondsLeft = this.masterTime();
    this.paintTimer();
  }

  paintTimer() {
    if (this.timerRow >= ROWS) return;
    const left = this.rowSeconds[this.timerRow];
    if (this.numberColors[this.timerRow] === 'done') {
      this.flash = false;
    } else if (left <= 2) {
      this.numberColors[this.timerRow] = 'danger';
      this.flash = true;
    } else if (left <= 5) {
      this.numberColors[this.timerRow] = 'hot';
      this.flash = true;
    } else if (left <= 9 && this.secsPerSlot > 10) {
      this.numberColors[this.timerRow] = 'warm';
      this.flash = true;
    }
    this.warning = this.timerRow === ROWS - 1 && left <= 10 && left > 0
      ? `Faltan ${left} segundos!`
      : '';
  }

  showReject(word, message) {
    this.headline = word;
    this.meaning = message;
    this.tone = 'bad';
    this.struck = true;
  }

  clearFeedback() {
    if (this.tone !== 'bad') return;
    this.headline = '';
    this.meaning = '';
    this.tone = '';
    this.struck = false;
  }

  pick(total) {
    const value = this.rng ? this.rng() : Math.random();
    return Math.floor(value * total);
  }

  resolveWord() {
    const cells = this.grid[this.playerRow].filter((cell) => cell.kind === 'filled');
    const pattern = cells.map((cell) => (cell.wild ? '' : cell.letter));
    if (!pattern.includes('')) return pattern.join('');
    const matches = [];
    for (const letter of ALPHABET) {
      const word = pattern.map((item) => item || letter).join('');
      if (Object.prototype.hasOwnProperty.call(this.dictionary, word) && !this.used.has(word)) matches.push(word);
    }
    if (!matches.length) return pattern.map((letter) => letter || 'A').join('');
    return matches[this.pick(matches.length)];
  }

  deal() {
    this.source = Array.from({ length: TILES }, () => ({ letter: '', hidden: false, wild: false, fromSeed: false }));
    this.tipped = new Set();
    this.tipIndexes = null;
    this.tipSlot = -1;

    let seed = '';
    const unused = this.words.filter((word) => !this.used.has(word));
    const pool = unused.length ? unused : this.words;
    if (pool.length) seed = pool[this.pick(pool.length)];
    if (seed) this.suggested.push(seed);

    const open = () => {
      const free = [];
      this.source.forEach((tile, index) => {
        if (!tile.letter) free.push(index);
      });
      return free;
    };

    let vowels = 0;
    for (const letter of seed) {
      const free = open();
      if (!free.length) break;
      const index = free[this.pick(free.length)];
      this.source[index].letter = letter;
      this.source[index].fromSeed = true;
      if (VOWELS.includes(letter)) vowels += 1;
    }

    const missingVowels = Math.max(0, 5 - vowels);
    for (let i = 0; i < missingVowels; i += 1) {
      const free = open();
      if (!free.length) break;
      const index = free[this.pick(free.length)];
      this.source[index].letter = VOWELS[this.pick(VOWELS.length)];
    }

    this.source.forEach((tile) => {
      if (!tile.letter) tile.letter = ALPHABET[this.pick(ALPHABET.length)];
    });

    const fillers = this.source.map((tile, index) => (tile.fromSeed ? -1 : index)).filter((index) => index >= 0);
    if (fillers.length && this.pick(100) < 45) {
      const index = fillers[this.pick(fillers.length)];
      this.source[index].letter = '★';
      this.source[index].wild = true;
    }
  }

  useTip() {
    if (this.tipsLeft <= 0 || !this.playing || this.over) return false;
    const indexes = this.tipWord();
    if (!indexes.length) {
      this.warning = 'Con estas fichas no hay una palabra para revelar';
      return false;
    }
    const step = 4 - this.tipsLeft;
    this.tipsLeft -= 1;
    this.tipped = new Set(indexes);
    this.warning = '';
    this.tipSlot = -1;
    if (step === 1) return true;
    const count = step === 2 ? 1 : Math.ceil(indexes.length / 2);
    const before = this.filledCount();
    for (let index = 0; index < count; index += 1) {
      if (!this.source[indexes[index]]?.hidden) this.place(indexes[index]);
    }
    if (this.filledCount() > before) this.tipSlot = this.filledCount() - 1;
    return true;
  }

  tipWord() {
    const row = this.grid[this.playerRow];
    const same = this.tipIndexes?.length && this.tipIndexes.every((index) => {
      const tile = this.source[index];
      if (!tile?.letter) return false;
      if (!tile.hidden) return true;
      return row.some((cell) => cell.kind === 'filled' && cell.source === index);
    });
    if (same) return this.tipIndexes;
    const indexes = this.hintTiles();
    this.tipIndexes = indexes;
    return indexes;
  }

  previewWords() {
    const visible = this.source
      .map((tile, index) => ({ tile, index }))
      .filter(({ tile }) => !tile.hidden && tile.letter);
    const sig = `${visible.map(({ tile }) => (tile.wild ? '*' : tile.letter)).join('')}|${this.used.size}`;
    if (sig === this.previewKey) return this.previewList;
    const picked = new Map();
    for (const word of this.words) {
      if (this.used.has(word) || word.length < MIN_LETTERS || word.length > SLOTS) continue;
      if (picked.has(word.length)) continue;
      if (!this.assignTiles(word, visible)) continue;
      const gloss = shortGloss(this.dictionary[word]);
      if (!gloss) continue;
      picked.set(word.length, gloss);
      if (picked.size >= 3) break;
    }
    this.previewKey = sig;
    this.previewList = [...picked.values()].slice(0, 3);
    return this.previewList;
  }

  hintTiles() {
    const visible = this.source
      .map((tile, index) => ({ tile, index }))
      .filter(({ tile }) => !tile.hidden && tile.letter);
    const seed = this.suggested[this.suggested.length - 1];
    if (seed && !this.used.has(seed)) {
      const seeded = this.assignTiles(seed, visible.filter(({ tile }) => tile.fromSeed));
      if (seeded) return seeded;
    }
    let best = [];
    for (const word of this.words) {
      if (this.used.has(word) || word.length < MIN_LETTERS || word.length > SLOTS) continue;
      if (best.length && word.length < best.length) continue;
      const indexes = this.assignTiles(word, visible);
      if (indexes && indexes.length >= best.length) best = indexes;
    }
    return best;
  }

  assignTiles(word, tiles) {
    if (!word) return null;
    const pool = tiles.map((item) => ({ ...item, used: false }));
    const indexes = [];
    for (const letter of word) {
      let found = pool.find((item) => !item.used && !item.tile.wild && item.tile.letter === letter);
      if (!found) found = pool.find((item) => !item.used && item.tile.wild);
      if (!found) return null;
      found.used = true;
      indexes.push(found.index);
    }
    return indexes;
  }
}
