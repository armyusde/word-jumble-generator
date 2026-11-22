// Word Jumble Generator — a drag-and-drop word jumble.
// Left: 5 jumbled words. Each has 1–2 circled boxes. Those circled letters
// form the scrambled final word on the right, which unlocks once all 5 are solved.

const MIN_LEN = 5;
const MAX_LEN = 7;
const PUZZLE_COUNT = 5;

const wordPool = [...new Set(
  WORDS.map(w => w.trim().toUpperCase())
       .filter(w => /^[A-Z]+$/.test(w) && w.length >= MIN_LEN && w.length <= MAX_LEN)
)];

const els = {
  puzzles: document.getElementById("puzzles"),
  final: document.getElementById("final"),
  message: document.getElementById("message"),
  score: document.getElementById("score"),
  mistakes: document.getElementById("mistakes"),
  scoreBtn: document.getElementById("score-btn"),
  scoreModal: document.getElementById("score-modal"),
  scoreForm: document.getElementById("score-form"),
  scoreSummary: document.getElementById("score-summary"),
  nameInput: document.getElementById("name-input"),
  cancelBtn: document.getElementById("cancel-btn"),
  hint: document.getElementById("hint-btn"),
  newGame: document.getElementById("new-btn"),
};

let game = null;
let score = 0;
let mistakes = 0;

/* ---------- helpers ---------- */

const rand = n => Math.floor(Math.random() * n);
const pick = arr => arr[rand(arr.length)];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Scramble a word, making sure the result isn't the word itself.
function scramble(word) {
  if (new Set(word).size === 1) return word;
  let s;
  do { s = shuffle(word.split("")).join(""); } while (s === word);
  return s;
}

// Does `word` contain every letter in `letters` (counting repeats)?
function containsLetters(word, letters) {
  const counts = {};
  for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
  for (const ch of letters) {
    if (!counts[ch]) return false;
    counts[ch]--;
  }
  return true;
}

/* ---------- language ---------- */
// The puzzles are always English words; only the buttons and messages change.
// To add a language: add an entry to TEXT with the same keys. "name" is what
// the language dropdown shows, and "code" is the standard language tag.

const LANG_KEY = "wordJumble.lang";
const TEXT = {
  en: {
    title: "Word Jumble Generator",
    won: "Games won:",
    mistakesLabel: "Mistakes:",
    unscramble: "Unscramble the 5 words",
    instructions: 'Drag the letters down into the boxes. Letters in the <span class="circle-key"></span> circled boxes go to the final jumble.',
    finalJumble: "Final Jumble",
    hint: "Hint",
    newGame: "New game",
    enterName: "Enter name for high score",
    highScore: "High Score!",
    yourName: "Enter your name",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    name: "English", code: "en",
    start: () => "Solve all 5 words to unlock the final jumble.",
    progress: n => `${n} of ${PUZZLE_COUNT} words solved.`,
    allSolved: () => "All 5 solved! Now unscramble the final jumble.",
    solved: w => `You solved it: ${w}!`,
    summary: (w, m, h) => {
      const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
      return `You solved "${w}" with ${plural(m, "mistake")} and ${plural(h, "hint")}.`;
    },
    saved: name => `Saved! Nice work, ${name}.`,
  },
  zh: {
    title: "单词拼图生成器",
    won: "胜利局数：",
    mistakesLabel: "错误：",
    unscramble: "拼出这 5 个单词",
    instructions: '把字母拖到下面的格子里。<span class="circle-key"></span> 圆圈格子里的字母会用于最终拼词。',
    finalJumble: "最终拼词",
    hint: "提示",
    newGame: "新游戏",
    enterName: "输入名字记录高分",
    highScore: "新高分！",
    yourName: "输入你的名字",
    save: "保存",
    saving: "保存中…",
    cancel: "取消",
    name: "中文（简体）", code: "zh-CN",
    start: () => "解出全部 5 个单词，即可解锁最终拼词。",
    progress: n => `已解出 ${n} / ${PUZZLE_COUNT} 个单词。`,
    allSolved: () => "5 个单词全部解出！现在来拼最终的单词吧。",
    solved: w => `答对了：${w}！`,
    summary: (w, m, h) => `你解出了“${w}”，错误 ${m} 次，提示 ${h} 次。`,
    saved: name => `已保存！干得好，${name}。`,
  },
};

let lang = "en";
try { const saved = localStorage.getItem(LANG_KEY); if (TEXT[saved]) lang = saved; } catch (e) {}
const t = key => TEXT[lang][key];

let lastMessage = null; // remembered so it can be re-shown in the other language

function setMessage(key, args = [], kind = "") {
  lastMessage = { key, args, kind };
  els.message.textContent = TEXT[lang][key](...args);
  els.message.className = "message " + kind;
}

function applyLanguage() {
  document.documentElement.lang = t("code");
  document.title = t("title");
  document.querySelectorAll("[data-t]").forEach(n => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll("[data-t-html]").forEach(n => { n.innerHTML = t(n.dataset.tHtml); });
  langSelect.value = lang;
  if (lastMessage) setMessage(lastMessage.key, lastMessage.args, lastMessage.kind);
  if (game && !els.scoreModal.hidden) els.scoreSummary.textContent = summaryText();
}

// Language dropdown: each language listed in its own name.
const langSelect = document.getElementById("lang-select");
for (const [id, tx] of Object.entries(TEXT)) {
  const opt = document.createElement("option");
  opt.value = id; opt.textContent = tx.name; opt.lang = tx.code;
  langSelect.appendChild(opt);
}

langSelect.addEventListener("change", () => {
  lang = langSelect.value;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  applyLanguage();
});

/* ---------- puzzle generation ---------- */

// Pick a final word (5–7 letters), split its letters into 5 groups of 1–2,
// then find a different word for each group that contains those letters.
function generateGame() {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const finalWord = pick(wordPool);
    const extra = finalWord.length - PUZZLE_COUNT; // how many groups get 2 letters
    if (extra < 0 || extra > PUZZLE_COUNT) continue;

    const sizes = shuffle([...Array(PUZZLE_COUNT)].map((_, i) => (i < extra ? 2 : 1)));
    const letters = shuffle(finalWord.split(""));
    const groups = [];
    let pos = 0;
    for (const size of sizes) { groups.push(letters.slice(pos, pos + size)); pos += size; }

    const used = new Set([finalWord]);
    const words = [];
    for (const group of groups) {
      const candidates = wordPool.filter(w => !used.has(w) && containsLetters(w, group));
      if (!candidates.length) break;
      const w = pick(candidates);
      used.add(w);
      words.push(w);
    }
    if (words.length !== PUZZLE_COUNT) continue;

    // Choose which boxes are circled in each word.
    const puzzles = words.map((word, i) => {
      const circled = new Set();
      for (const ch of groups[i]) {
        const options = [...word].map((c, idx) => idx).filter(idx => word[idx] === ch && !circled.has(idx));
        circled.add(pick(options));
      }
      return { word, circled };
    });
    return { finalWord, puzzles };
  }
  throw new Error("Couldn't build a puzzle — try adding more words to words.js");
}

/* ---------- building the board ---------- */

function makeTile(letter, puzzle) {
  const tile = document.createElement("div");
  tile.className = "tile";
  tile.textContent = letter;
  tile.dataset.letter = letter;
  tile._puzzle = puzzle;
  tile.addEventListener("pointerdown", startDrag);
  // Stop iPhone Safari from treating a touch on a tile as a pan/zoom gesture
  // (this is what broke dragging when the page was zoomed in).
  tile.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  return tile;
}

function makeSlots(puzzle, container) {
  for (let i = 0; i < puzzle.word.length; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (puzzle.circled && puzzle.circled.has(i)) slot.classList.add("circled");
    slot.dataset.index = i;
    slot._puzzle = puzzle;
    container.appendChild(slot);
    puzzle.slotEls.push(slot);
  }
}

function newGame() {
  const { finalWord, puzzles } = generateGame();
  els.puzzles.innerHTML = "";
  els.final.innerHTML = "";

  game = { puzzles: [], final: null, solvedCount: 0, done: false, mistakes: 0, hints: 0 };
  els.scoreBtn.hidden = true;

  puzzles.forEach((p, n) => {
    const puzzle = {
      word: p.word, circled: p.circled, filled: new Array(p.word.length).fill(false),
      active: true, solved: false, slotEls: [], isFinal: false,
    };
    const box = document.createElement("div");
    box.className = "puzzle";
    box.innerHTML = `<div class="puzzle-num">${n + 1}</div>`;
    const body = document.createElement("div");
    body.className = "puzzle-body";
    const tray = document.createElement("div");
    tray.className = "tray";
    for (const ch of scramble(p.word)) tray.appendChild(makeTile(ch, puzzle));
    const slots = document.createElement("div");
    slots.className = "slots";
    makeSlots(puzzle, slots);
    body.append(tray, slots);
    box.appendChild(body);
    els.puzzles.appendChild(box);
    puzzle.el = box;
    game.puzzles.push(puzzle);
  });

  // Final puzzle: empty tray that fills up as the left words are solved.
  const final = {
    word: finalWord, circled: null, filled: new Array(finalWord.length).fill(false),
    active: false, solved: false, slotEls: [], isFinal: true,
  };
  const tray = document.createElement("div");
  tray.className = "tray final-tray";
  const slots = document.createElement("div");
  slots.className = "slots";
  makeSlots(final, slots);
  els.final.append(tray, slots);
  els.final.classList.add("locked");
  final.tray = tray;
  game.final = final;

  setMessage("start");
  els.hint.disabled = false;
}

/* ---------- game flow ---------- */

function placeLetter(slot, tile) {
  const puzzle = slot._puzzle;
  const i = Number(slot.dataset.index);
  slot.textContent = puzzle.word[i];
  slot.classList.add("filled");
  puzzle.filled[i] = true;
  tile.classList.remove("picked");
  tile.classList.add("used"); // permanently dimmed

  if (puzzle.filled.every(Boolean)) solvePuzzle(puzzle);
}

function solvePuzzle(puzzle) {
  puzzle.solved = true;
  puzzle.active = false;

  if (puzzle.isFinal) {
    game.done = true;
    score++;
    els.score.textContent = score;
    els.final.classList.add("solved");
    setMessage("solved", [puzzle.word], "win");
    els.hint.disabled = true;
    els.scoreBtn.hidden = false;
    return;
  }

  puzzle.el.classList.add("solved");
  // Send the circled letters over to the final jumble (locked until all 5 are done).
  for (const idx of puzzle.circled) {
    const tile = makeTile(puzzle.word[idx], game.final);
    tile.classList.add("locked");
    game.final.tray.appendChild(tile);
  }

  game.solvedCount++;
  if (game.solvedCount === PUZZLE_COUNT) unlockFinal();
  else setMessage("progress", [game.solvedCount]);
}

function unlockFinal() {
  const final = game.final;
  // Make sure the final tray isn't accidentally already in the right order.
  let tiles = [...final.tray.children];
  while (tiles.map(t => t.dataset.letter).join("") === final.word && new Set(final.word).size > 1) {
    shuffle(tiles);
  }
  tiles.forEach(t => { t.classList.remove("locked"); final.tray.appendChild(t); });
  final.active = true;
  els.final.classList.remove("locked");
  setMessage("allSolved", [], "win");
  // On phones the final jumble sits below the 5 words, so bring it into view.
  els.final.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- drag and drop (pointer events: works with mouse + touch) ---------- */

// How dragging works: a copy of the letter ("ghost") is placed exactly on top of
// the letter, inside the same row, and then moved by how far the finger has moved
// since it touched down. Only *differences* in finger position are used, so it
// stays correct when the iPhone is pinch-zoomed or the page is scrolled.
let drag = null;

function startDrag(e) {
  const tile = e.currentTarget;
  if (drag || tile.classList.contains("used") || !tile._puzzle.active) return;
  e.preventDefault();

  const ghost = tile.cloneNode(true);
  ghost.classList.add("ghost");
  ghost.style.left = tile.offsetLeft + "px";
  ghost.style.top = tile.offsetTop + "px";
  tile.parentElement.appendChild(ghost);

  tile.classList.add("picked"); // dim the original while it's being dragged

  drag = {
    tile, ghost,
    startX: e.clientX,
    startY: e.clientY,
    // On touch screens, lift the tile above the finger so you can see where it's going.
    lift: e.pointerType === "touch" ? tile.offsetHeight * 0.8 : 0,
  };
  moveGhost(e.clientX, e.clientY);

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", returnTile);
}

// While a tile is being dragged, don't let the page scroll or pan under the finger.
document.addEventListener("touchmove", e => { if (drag) e.preventDefault(); }, { passive: false });

function moveGhost(x, y) {
  const dx = x - drag.startX;
  const dy = y - drag.startY - drag.lift;
  drag.ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
}

// Find the empty box (of the same word) closest to the dragged tile's center.
// The tile snaps to it if it's within about one box-width, so drops don't
// need to be pixel-perfect.
function nearestSlot() {
  const g = drag.ghost.getBoundingClientRect();
  const gx = g.left + g.width / 2;
  const gy = g.top + g.height / 2;
  let best = null, bestDist = Infinity;
  for (const slot of drag.tile._puzzle.slotEls) {
    if (slot.classList.contains("filled")) continue;
    const r = slot.getBoundingClientRect();
    const d = Math.hypot(gx - (r.left + r.width / 2), gy - (r.top + r.height / 2));
    if (d < bestDist) { best = slot; bestDist = d; }
  }
  if (!best) return null;
  const reach = best.getBoundingClientRect().width * 1.1;
  return bestDist <= reach ? best : null;
}

function clearHover() {
  document.querySelectorAll(".slot.hover").forEach(s => s.classList.remove("hover"));
}

function onDragMove(e) {
  moveGhost(e.clientX, e.clientY);
  clearHover();
  const slot = nearestSlot();
  if (slot) slot.classList.add("hover");
}

function endDrag(e) {
  moveGhost(e.clientX, e.clientY);
  const slot = nearestSlot();
  clearHover();

  if (slot) {
    const i = Number(slot.dataset.index);
    if (slot._puzzle.word[i] === drag.tile.dataset.letter) {
      placeLetter(slot, drag.tile);
      drag.ghost.remove();
      stopDrag();
      return;
    }
    mistakes++;
    game.mistakes++;
    els.mistakes.textContent = mistakes;
    slot.classList.add("wrong");
    setTimeout(() => slot.classList.remove("wrong"), 400);
  }
  returnTile();
}

// Slide the copy back to where the letter is, then remove it.
function returnTile() {
  const { ghost, tile } = drag;
  ghost.classList.add("returning");
  ghost.style.transform = "translate(0, 0)";
  setTimeout(() => { ghost.remove(); tile.classList.remove("picked"); }, 200);
  stopDrag();
}

function stopDrag() {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", returnTile);
  drag = null;
}

/* ---------- buttons ---------- */

// Hint: fill the next empty box of the first unsolved word (or the final, once unlocked).
els.hint.addEventListener("click", () => {
  if (!game || game.done) return;
  const puzzle = game.puzzles.find(p => !p.solved) || (game.final.active ? game.final : null);
  if (!puzzle) return;
  const i = puzzle.filled.findIndex(f => !f);
  const tray = puzzle.isFinal ? game.final.tray : puzzle.el.querySelector(".tray");
  const tile = [...tray.querySelectorAll(".tile:not(.used)")].find(t => t.dataset.letter === puzzle.word[i]);
  if (tile) { game.hints++; placeLetter(puzzle.slotEls[i], tile); }
});

els.newGame.addEventListener("click", newGame);

/* ---------- high score popup ---------- */

const HIGH_SCORE_KEY = "wordJumble.highScores";

function saveHighScore(entry) {
  try {
    const list = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY) || "[]");
    list.push(entry);
    // Best games first: fewest mistakes, then fewest hints.
    list.sort((a, b) => a.mistakes - b.mistakes || a.hints - b.hints);
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) { /* storage unavailable (e.g. private browsing) — just skip saving */ }
}

const summaryText = () => TEXT[lang].summary(game.final.word, game.mistakes, game.hints);

function openScoreModal() {
  els.scoreSummary.textContent = summaryText();
  els.nameInput.value = "";
  els.scoreModal.hidden = false;
  els.nameInput.focus();
}

function closeScoreModal() {
  els.scoreModal.hidden = true;
}

els.scoreBtn.addEventListener("click", openScoreModal);
els.cancelBtn.addEventListener("click", closeScoreModal);
els.scoreModal.addEventListener("click", e => { if (e.target === els.scoreModal) closeScoreModal(); });

/* ---------- bonus pack ---------- */
// assets/levels.dat is an encrypted bonus pack. A name entered in the high score
// box is tried as its key; only the right one opens it.

const PACK_URL = "assets/levels.dat";
const PACK_ROUNDS = 600000;

async function openPack(name) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  if (key.length < 8 || !window.crypto || !crypto.subtle || typeof DecompressionStream === "undefined") return null;
  try {
    const res = await fetch(PACK_URL);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const n = buf.length;
    if (n < 100 || String.fromCharCode(...buf.subarray(0, 4)) !== "WJG1") return null;

    const salt = buf.slice(4, 20), iv = buf.slice(20, 36), tag = buf.slice(n - 32);
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: PACK_ROUNDS, hash: "SHA-256" }, base, 512));

    const macKey = await crypto.subtle.importKey("raw", bits.slice(32), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!(await crypto.subtle.verify("HMAC", macKey, tag, buf.subarray(0, n - 32)))) return null;

    const aesKey = await crypto.subtle.importKey("raw", bits.slice(0, 32), { name: "AES-CBC" }, false, ["decrypt"]);
    const zipped = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, aesKey, buf.subarray(36, n - 32));
    const text = await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function showPack(pack) {
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(n => n.remove());
  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: pack.css }));
  document.body.className = "";
  document.body.innerHTML = pack.html;
  self.PACK = { index: pack.index, books: pack.books, booksZh: pack.booksZh, lang };
  const script = document.createElement("script");
  script.textContent = `(() => {\n${pack.js}\n})();`;
  document.body.appendChild(script);
  window.scrollTo(0, 0);
}

els.scoreForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = els.nameInput.value.trim();
  if (!name) return;

  const saveBtn = els.scoreForm.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  saveBtn.textContent = t("saving");
  const pack = await openPack(name);
  saveBtn.disabled = false;
  saveBtn.textContent = t("save");

  els.scoreBtn.hidden = true; // one entry per game
  closeScoreModal();
  if (pack) { showPack(pack); return; }

  saveHighScore({
    name, word: game.final.word, mistakes: game.mistakes, hints: game.hints,
    date: new Date().toISOString(),
  });
  setMessage("saved", [name], "win");
});

// Start fresh (drop any leftover #... from the address).
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
applyLanguage();
newGame();
