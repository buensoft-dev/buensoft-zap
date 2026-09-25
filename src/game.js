export const ROWS = 10;
export const SLOTS = 7;
export const TILES = 12;
export const MIN_LETTERS = 3;

export const MODES = [
  { id: 'es-en', file: 'es-en.json', label: 'Español → Inglés', hint: 'Forma palabras en español. La definición aparece en inglés.' },
  { id: 'en-es', file: 'en-es.json', label: 'Inglés → Español', hint: 'Forma palabras en inglés. La definición aparece en español.' },
];

export const SKILLS = [
  { id: 1, name: 'Principiante', splash: 'MODO PRINCIPIANTE', seconds: 30 },
  { id: 2, name: 'Intermedio', splash: 'MODO INTERMEDIO', seconds: 20 },
  { id: 3, name: 'Experto', splash: 'MODO AVANZADO', seconds: 10 },
];

const VOWELS = 'AEIOU';
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

function rand(n) {
  return Math.floor(Math.random() * n);
}

function emptyCell() {
  return { letter: '', source: -1, kind: 'open' };
}

export class Game {
  constructor(dictionary, skillId) {
    this.dictionary = dictionary;
    this.words = Object.keys(dictionary);
    this.skill = SKILLS.find((item) => item.id === skillId) || SKILLS[1];
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
  }

  get marker() {
    if (this.wordsCompleted === 0) return 0;
    return this.intScore - 1;
  }

  start() {
    this.playing = true;
    this.secondsLeft = this.secsPerSlot;
    this.warning = '';
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
    row[slot] = { letter: tile.letter, source: sourceIndex, kind: 'filled' };
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
    const word = this.currentWord();
    if (this.used.has(word)) {
      this.showReject(word, `La palabra "${word}", ya fué utilizada, no se pueden repetir las mismas palabras`);
      return { ok: false };
    }
    if (!Object.prototype.hasOwnProperty.call(this.dictionary, word)) {
      this.showReject(word, `La palabra "${word}" no se encuentra en el diccionario`);
      return { ok: false };
    }

    const row = this.grid[this.playerRow];
    const length = this.filledCount();
    row.forEach((cell, index) => {
      if (cell.kind === 'open') row[index] = { letter: '', source: -1, kind: 'blank' };
      else if (cell.kind === 'filled') row[index] = { ...cell, kind: 'locked' };
    });

    this.used.add(word);
    this.wordsCompleted += 1;
    this.intScore += length + 1;
    const points = this.skill.id * length * 10;
    this.pointsTotal += points;
    this.rowPoints[this.playerRow] = points;
    this.numberColors[this.playerRow] = 'done';
    if (this.timerRow === this.playerRow) this.flash = false;

    this.headline = word;
    this.meaning = this.dictionary[word] || '';
    this.tone = 'ok';
    this.struck = false;

    this.playerRow += 1;
    this.deal();

    if (this.playerRow >= ROWS) {
      return { ok: true, levelUp: this.advanceLevel() };
    }
    return { ok: true };
  }

  tick() {
    if (!this.playing || this.over) return { ended: false };
    this.secondsLeft -= 1;
    this.paintTimer();
    if (this.secondsLeft > 0) return { ended: false };

    this.flash = false;
    this.warning = '';
    this.timerRow += 1;
    this.secondsLeft = this.secsPerSlot;
    if (this.timerRow >= ROWS) {
      this.playing = false;
      this.over = true;
      this.warning = '';
      return { ended: true };
    }
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
    this.secondsLeft = this.secsPerSlot;
    this.flash = false;
    this.warning = '';
    this.headline = '';
    this.meaning = '';
    this.tone = '';
    this.struck = false;
    return {
      level: this.level,
      splash: `NIVEL ${this.level}`,
      mode: this.skill.splash,
    };
  }

  resumeAfterLevel() {
    this.playing = true;
    this.secondsLeft = this.secsPerSlot;
    this.paintTimer();
  }

  paintTimer() {
    if (this.timerRow >= ROWS) return;
    if (this.numberColors[this.timerRow] === 'done') {
      this.flash = false;
    } else if (this.secondsLeft <= 2) {
      this.numberColors[this.timerRow] = 'danger';
      this.flash = true;
    } else if (this.secondsLeft <= 5) {
      this.numberColors[this.timerRow] = 'hot';
      this.flash = true;
    } else if (this.secondsLeft <= 9 && this.secsPerSlot > 10) {
      this.numberColors[this.timerRow] = 'warm';
      this.flash = true;
    }
    this.warning = this.timerRow === ROWS - 1 && this.secondsLeft <= 10 && this.secondsLeft > 0
      ? `Faltan ${this.secondsLeft} segundos!`
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

  deal() {
    this.source.forEach((tile) => {
      tile.letter = '';
      tile.hidden = false;
    });

    let seed = '';
    const unused = this.words.filter((word) => !this.used.has(word));
    const pool = unused.length ? unused : this.words;
    if (pool.length) seed = pool[rand(pool.length)];
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
      const index = free[rand(free.length)];
      this.source[index].letter = letter;
      if (VOWELS.includes(letter)) vowels += 1;
    }

    const missingVowels = Math.max(0, 5 - vowels);
    for (let i = 0; i < missingVowels; i += 1) {
      const free = open();
      if (!free.length) break;
      const index = free[rand(free.length)];
      this.source[index].letter = VOWELS[rand(VOWELS.length)];
    }

    this.source.forEach((tile) => {
      if (!tile.letter) tile.letter = ALPHABET[rand(ALPHABET.length)];
    });
  }
}
