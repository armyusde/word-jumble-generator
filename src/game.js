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
  scoresBtn: document.getElementById("scores-btn"),
  listModal: document.getElementById("list-modal"),
  scoreList: document.getElementById("score-list"),
  listEmpty: document.getElementById("list-empty"),
  listClose: document.getElementById("list-close"),
  listClear: document.getElementById("list-clear"),
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
    updateReady: "A new version of the game is ready.",
    updateNow: "Update",
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
    updateReady: "游戏有新版本了。",
    updateNow: "更新",
  },
  ar: {
    title: "مولّد ألغاز الكلمات",
    won: "مرات الفوز:",
    mistakesLabel: "الأخطاء:",
    unscramble: "رتّب الكلمات الخمس",
    instructions: 'اسحب الحروف إلى المربعات بالأسفل. حروف المربعات المحاطة بدائرة <span class="circle-key"></span> تُستخدم في الكلمة النهائية.',
    finalJumble: "الكلمة النهائية",
    hint: "تلميح",
    newGame: "لعبة جديدة",
    enterName: "أدخل اسمك لتسجيل النتيجة",
    highScore: "نتيجة عالية!",
    yourName: "أدخل اسمك",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    cancel: "إلغاء",
    name: "العربية", code: "ar", dir: "rtl",
    start: () => "حُلّ الكلمات الخمس لفتح الكلمة النهائية.",
    progress: n => `تم حل ${n} من ${PUZZLE_COUNT} كلمات.`,
    allSolved: () => "تم حل الكلمات الخمس! رتّب الآن الكلمة النهائية.",
    solved: w => `أحسنت! الكلمة هي: ⁨${w}⁩`,
    summary: (w, m, h) => `حللت «⁨${w}⁩» — الأخطاء: ${m}، التلميحات: ${h}.`,
    saved: name => `تم الحفظ! أحسنت يا ⁨${name}⁩.`,
    updateReady: "يتوفر إصدار جديد من اللعبة.",
    updateNow: "تحديث",
  },
  es: {
    title: "Generador de Palabras Revueltas",
    won: "Partidas ganadas:",
    mistakesLabel: "Errores:",
    unscramble: "Ordena las 5 palabras",
    instructions: 'Arrastra las letras a las casillas de abajo. Las letras de las casillas con <span class="circle-key"></span> círculo van a la palabra final.',
    finalJumble: "Palabra final",
    hint: "Pista",
    newGame: "Nuevo juego",
    enterName: "Escribe tu nombre para el récord",
    highScore: "¡Nuevo récord!",
    yourName: "Escribe tu nombre",
    save: "Guardar",
    saving: "Guardando…",
    cancel: "Cancelar",
    name: "Español", code: "es",
    start: () => "Resuelve las 5 palabras para desbloquear la palabra final.",
    progress: n => `${n} de ${PUZZLE_COUNT} palabras resueltas.`,
    allSolved: () => "¡Las 5 resueltas! Ahora ordena la palabra final.",
    solved: w => `¡Lo resolviste: ${w}!`,
    summary: (w, m, h) =>
      `Resolviste «${w}» con ${m} ${m === 1 ? "error" : "errores"} y ${h} ${h === 1 ? "pista" : "pistas"}.`,
    saved: name => `¡Guardado! Buen trabajo, ${name}.`,
    updateReady: "Hay una nueva versión del juego.",
    updateNow: "Actualizar",
  },
  fr: {
    title: "Générateur de mots mélangés",
    won: "Parties gagnées :",
    mistakesLabel: "Erreurs :",
    unscramble: "Remets les 5 mots dans l’ordre",
    instructions: 'Fais glisser les lettres dans les cases en dessous. Les lettres des cases <span class="circle-key"></span> entourées forment le mot final.',
    finalJumble: "Mot final",
    hint: "Indice",
    newGame: "Nouvelle partie",
    enterName: "Inscris ton nom au tableau des scores",
    highScore: "Nouveau record !",
    yourName: "Entre ton nom",
    save: "Enregistrer",
    saving: "Enregistrement…",
    cancel: "Annuler",
    name: "Français", code: "fr",
    start: () => "Résous les 5 mots pour débloquer le mot final.",
    progress: n => `${n} mot${n > 1 ? "s" : ""} sur ${PUZZLE_COUNT} résolu${n > 1 ? "s" : ""}.`,
    allSolved: () => "Les 5 mots sont résolus ! Remets maintenant le mot final dans l’ordre.",
    solved: w => `Bravo : ${w} !`,
    summary: (w, m, h) =>
      `Tu as trouvé « ${w} » avec ${m} erreur${m > 1 ? "s" : ""} et ${h} indice${h > 1 ? "s" : ""}.`,
    saved: name => `Enregistré ! Bien joué, ${name}.`,
    updateReady: "Une nouvelle version du jeu est prête.",
    updateNow: "Mettre à jour",
  },
  pt: {
    title: "Gerador de Palavras Embaralhadas",
    won: "Partidas vencidas:",
    mistakesLabel: "Erros:",
    unscramble: "Desembaralhe as 5 palavras",
    instructions: 'Arraste as letras para as casas abaixo. As letras nas casas com <span class="circle-key"></span> círculo formam a palavra final.',
    finalJumble: "Palavra final",
    hint: "Dica",
    newGame: "Novo jogo",
    enterName: "Digite seu nome para o recorde",
    highScore: "Novo recorde!",
    yourName: "Digite seu nome",
    save: "Salvar",
    saving: "Salvando…",
    cancel: "Cancelar",
    name: "Português", code: "pt",
    start: () => "Resolva as 5 palavras para liberar a palavra final.",
    progress: n => `${n} de ${PUZZLE_COUNT} palavras resolvidas.`,
    allSolved: () => "As 5 foram resolvidas! Agora desembaralhe a palavra final.",
    solved: w => `Você acertou: ${w}!`,
    summary: (w, m, h) =>
      `Você resolveu “${w}” com ${m} ${m === 1 ? "erro" : "erros"} e ${h} ${h === 1 ? "dica" : "dicas"}.`,
    saved: name => `Salvo! Muito bem, ${name}.`,
    updateReady: "Uma nova versão do jogo está pronta.",
    updateNow: "Atualizar",
  },
  de: {
    title: "Wortsalat-Generator",
    won: "Gewonnene Spiele:",
    mistakesLabel: "Fehler:",
    unscramble: "Entwirre die 5 Wörter",
    instructions: 'Ziehe die Buchstaben in die Kästchen darunter. Die Buchstaben in den <span class="circle-key"></span> eingekreisten Kästchen ergeben das Lösungswort.',
    finalJumble: "Lösungswort",
    hint: "Tipp",
    newGame: "Neues Spiel",
    enterName: "Namen für die Bestenliste eingeben",
    highScore: "Neuer Rekord!",
    yourName: "Gib deinen Namen ein",
    save: "Speichern",
    saving: "Wird gespeichert…",
    cancel: "Abbrechen",
    name: "Deutsch", code: "de",
    start: () => "Löse alle 5 Wörter, um das Lösungswort freizuschalten.",
    progress: n => `${n} von ${PUZZLE_COUNT} Wörtern gelöst.`,
    allSolved: () => "Alle 5 gelöst! Jetzt entwirre das Lösungswort.",
    solved: w => `Geschafft: ${w}!`,
    summary: (w, m, h) =>
      `Du hast „${w}“ mit ${m} ${m === 1 ? "Fehler" : "Fehlern"} und ${h} ${h === 1 ? "Tipp" : "Tipps"} gelöst.`,
    saved: name => `Gespeichert! Gut gemacht, ${name}.`,
    updateReady: "Eine neue Version des Spiels ist bereit.",
    updateNow: "Aktualisieren",
  },
  ru: {
    title: "Генератор словесных головоломок",
    won: "Побед:",
    mistakesLabel: "Ошибок:",
    unscramble: "Разгадайте 5 слов",
    instructions: 'Перетащите буквы в клеточки ниже. Буквы в клеточках с <span class="circle-key"></span> кружком образуют последнее слово.',
    finalJumble: "Последнее слово",
    hint: "Подсказка",
    newGame: "Новая игра",
    enterName: "Записать имя в рекорды",
    highScore: "Новый рекорд!",
    yourName: "Введите ваше имя",
    save: "Сохранить",
    saving: "Сохранение…",
    cancel: "Отмена",
    name: "Русский", code: "ru",
    start: () => "Разгадайте все 5 слов, чтобы открыть последнее слово.",
    progress: n => `Разгадано слов: ${n} из ${PUZZLE_COUNT}.`,
    allSolved: () => "Все 5 слов разгаданы! Теперь соберите последнее слово.",
    solved: w => `Верно: ${w}!`,
    summary: (w, m, h) => `Вы разгадали «${w}». Ошибок: ${m}, подсказок: ${h}.`,
    saved: name => `Сохранено! Отлично, ${name}.`,
    updateReady: "Доступна новая версия игры.",
    updateNow: "Обновить",
  },
  hi: {
    title: "शब्द पहेली जनरेटर",
    won: "जीते गए खेल:",
    mistakesLabel: "गलतियाँ:",
    unscramble: "5 शब्दों को सुलझाएँ",
    instructions: 'अक्षरों को नीचे के खानों में खींचें। <span class="circle-key"></span> गोले वाले खानों के अक्षर अंतिम शब्द बनाते हैं।',
    finalJumble: "अंतिम शब्द",
    hint: "संकेत",
    newGame: "नया खेल",
    enterName: "उच्च स्कोर के लिए नाम लिखें",
    highScore: "नया उच्च स्कोर!",
    yourName: "अपना नाम लिखें",
    save: "सहेजें",
    saving: "सहेजा जा रहा है…",
    cancel: "रद्द करें",
    name: "हिन्दी", code: "hi",
    start: () => "अंतिम शब्द खोलने के लिए सभी 5 शब्द सुलझाएँ।",
    progress: n => `${PUZZLE_COUNT} में से ${n} शब्द सुलझ गए।`,
    allSolved: () => "सभी 5 शब्द सुलझ गए! अब अंतिम शब्द सुलझाएँ।",
    solved: w => `शाबाश: ${w}!`,
    summary: (w, m, h) => `आपने “${w}” सुलझाया — गलतियाँ: ${m}, संकेत: ${h}।`,
    saved: name => `सहेज लिया! बहुत बढ़िया, ${name}।`,
    updateReady: "खेल का नया संस्करण तैयार है।",
    updateNow: "अपडेट करें",
  },
  ja: {
    title: "ワードジャンブル",
    won: "勝利数：",
    mistakesLabel: "ミス：",
    unscramble: "5つの単語を並べ替えよう",
    instructions: '文字を下のマスにドラッグしてください。<span class="circle-key"></span> 丸で囲まれたマスの文字が最後の単語になります。',
    finalJumble: "最後の単語",
    hint: "ヒント",
    newGame: "新しいゲーム",
    enterName: "名前を登録する",
    highScore: "ハイスコア！",
    yourName: "名前を入力",
    save: "保存",
    saving: "保存中…",
    cancel: "キャンセル",
    name: "日本語", code: "ja",
    start: () => "5つの単語を解いて、最後の単語を開放しよう。",
    progress: n => `${PUZZLE_COUNT}個中${n}個の単語を解きました。`,
    allSolved: () => "5つの単語をすべて解きました！最後の単語を並べ替えよう。",
    solved: w => `正解：${w}！`,
    summary: (w, m, h) => `「${w}」を解きました（ミス ${m}回、ヒント ${h}回）。`,
    saved: name => `保存しました！よくできました、${name}さん。`,
    updateReady: "ゲームの新しいバージョンがあります。",
    updateNow: "更新",
  },
  ko: {
    title: "단어 뒤섞기 게임",
    won: "승리:",
    mistakesLabel: "실수:",
    unscramble: "5개의 단어를 맞혀 보세요",
    instructions: '글자를 아래 칸으로 끌어다 놓으세요. <span class="circle-key"></span> 동그라미 칸의 글자들이 마지막 단어가 됩니다.',
    finalJumble: "마지막 단어",
    hint: "힌트",
    newGame: "새 게임",
    enterName: "최고 기록에 이름 남기기",
    highScore: "최고 기록!",
    yourName: "이름을 입력하세요",
    save: "저장",
    saving: "저장 중…",
    cancel: "취소",
    name: "한국어", code: "ko",
    start: () => "5개의 단어를 모두 맞히면 마지막 단어가 열립니다.",
    progress: n => `${PUZZLE_COUNT}개 중 ${n}개를 맞혔습니다.`,
    allSolved: () => "5개의 단어를 모두 맞혔습니다! 이제 마지막 단어를 맞혀 보세요.",
    solved: w => `정답: ${w}!`,
    summary: (w, m, h) => `“${w}” 완성 — 실수 ${m}번, 힌트 ${h}번.`,
    saved: name => `저장했습니다! 잘했어요, ${name}님.`,
    updateReady: "게임의 새 버전이 준비되었습니다.",
    updateNow: "업데이트",
  },
  vi: {
    title: "Trò chơi xếp chữ",
    won: "Số ván thắng:",
    mistakesLabel: "Lỗi:",
    unscramble: "Sắp xếp lại 5 từ",
    instructions: 'Kéo các chữ cái vào các ô bên dưới. Chữ trong các ô <span class="circle-key"></span> có vòng tròn sẽ tạo thành từ cuối cùng.',
    finalJumble: "Từ cuối cùng",
    hint: "Gợi ý",
    newGame: "Ván mới",
    enterName: "Ghi tên vào bảng điểm cao",
    highScore: "Điểm cao mới!",
    yourName: "Nhập tên của bạn",
    save: "Lưu",
    saving: "Đang lưu…",
    cancel: "Hủy",
    name: "Tiếng Việt", code: "vi",
    start: () => "Giải cả 5 từ để mở từ cuối cùng.",
    progress: n => `Đã giải ${n} trên ${PUZZLE_COUNT} từ.`,
    allSolved: () => "Đã giải cả 5 từ! Giờ hãy sắp xếp từ cuối cùng.",
    solved: w => `Chính xác: ${w}!`,
    summary: (w, m, h) => `Bạn đã giải “${w}” với ${m} lỗi và ${h} gợi ý.`,
    saved: name => `Đã lưu! Giỏi lắm, ${name}.`,
    updateReady: "Đã có phiên bản mới của trò chơi.",
    updateNow: "Cập nhật",
  },
  id: {
    title: "Permainan Acak Kata",
    won: "Menang:",
    mistakesLabel: "Salah:",
    unscramble: "Susun ulang 5 kata",
    instructions: 'Seret huruf ke kotak di bawahnya. Huruf di kotak <span class="circle-key"></span> yang dilingkari membentuk kata terakhir.',
    finalJumble: "Kata terakhir",
    hint: "Petunjuk",
    newGame: "Permainan baru",
    enterName: "Masukkan nama untuk skor tertinggi",
    highScore: "Skor tertinggi!",
    yourName: "Masukkan namamu",
    save: "Simpan",
    saving: "Menyimpan…",
    cancel: "Batal",
    name: "Bahasa Indonesia", code: "id",
    start: () => "Pecahkan kelima kata untuk membuka kata terakhir.",
    progress: n => `${n} dari ${PUZZLE_COUNT} kata terpecahkan.`,
    allSolved: () => "Kelima kata terpecahkan! Sekarang susun kata terakhir.",
    solved: w => `Benar: ${w}!`,
    summary: (w, m, h) => `Kamu memecahkan “${w}” dengan ${m} kesalahan dan ${h} petunjuk.`,
    saved: name => `Tersimpan! Hebat, ${name}.`,
    updateReady: "Versi baru permainan sudah siap.",
    updateNow: "Perbarui",
  },
  tl: {
    title: "Laro ng Ginulong Salita",
    won: "Panalo:",
    mistakesLabel: "Mali:",
    unscramble: "Ayusin ang 5 salita",
    instructions: 'I-drag ang mga titik sa mga kahon sa ibaba. Ang mga titik sa mga kahong <span class="circle-key"></span> may bilog ang bubuo sa huling salita.',
    finalJumble: "Huling salita",
    hint: "Pahiwatig",
    newGame: "Bagong laro",
    enterName: "Ilagay ang pangalan sa high score",
    highScore: "Bagong high score!",
    yourName: "Ilagay ang iyong pangalan",
    save: "I-save",
    saving: "Sine-save…",
    cancel: "Kanselahin",
    name: "Tagalog", code: "tl",
    start: () => "Lutasin ang 5 salita para mabuksan ang huling salita.",
    progress: n => `${n} sa ${PUZZLE_COUNT} salita ang nalutas.`,
    allSolved: () => "Nalutas ang lahat ng 5 salita! Ayusin na ang huling salita.",
    solved: w => `Tama: ${w}!`,
    summary: (w, m, h) => `Nalutas mo ang “${w}” na may ${m} mali at ${h} pahiwatig.`,
    saved: name => `Na-save! Magaling, ${name}.`,
    updateReady: "May bagong bersyon ng laro.",
    updateNow: "I-update",
  },
  it: {
    title: "Generatore di parole mescolate",
    won: "Partite vinte:",
    mistakesLabel: "Errori:",
    unscramble: "Riordina le 5 parole",
    instructions: 'Trascina le lettere nelle caselle sotto. Le lettere nelle caselle <span class="circle-key"></span> cerchiate formano la parola finale.',
    finalJumble: "Parola finale",
    hint: "Aiuto",
    newGame: "Nuova partita",
    enterName: "Inserisci il nome per il record",
    highScore: "Nuovo record!",
    yourName: "Inserisci il tuo nome",
    save: "Salva",
    saving: "Salvataggio…",
    cancel: "Annulla",
    name: "Italiano", code: "it",
    start: () => "Risolvi le 5 parole per sbloccare la parola finale.",
    progress: n => `${n} parol${n === 1 ? "a risolta" : "e risolte"} su ${PUZZLE_COUNT}.`,
    allSolved: () => "Tutte e 5 le parole sono risolte! Ora riordina la parola finale.",
    solved: w => `Esatto: ${w}!`,
    summary: (w, m, h) =>
      `Hai risolto “${w}” con ${m} error${m === 1 ? "e" : "i"} e ${h} aiut${h === 1 ? "o" : "i"}.`,
    saved: name => `Salvato! Ben fatto, ${name}.`,
    updateReady: "È pronta una nuova versione del gioco.",
    updateNow: "Aggiorna",
  },
  fa: {
    title: "بازی کلمات درهم",
    won: "بردها:",
    mistakesLabel: "اشتباه‌ها:",
    unscramble: "۵ کلمه را مرتب کن",
    instructions: 'حروف را به خانه‌های پایین بکش. حروف خانه‌های <span class="circle-key"></span> دایره‌دار کلمهٔ آخر را می‌سازند.',
    finalJumble: "کلمهٔ آخر",
    hint: "راهنما",
    newGame: "بازی جدید",
    enterName: "نامت را برای امتیاز برتر وارد کن",
    highScore: "امتیاز برتر!",
    yourName: "نامت را وارد کن",
    save: "ذخیره",
    saving: "در حال ذخیره…",
    cancel: "لغو",
    name: "فارسی", code: "fa", dir: "rtl",
    start: () => "هر ۵ کلمه را حل کن تا کلمهٔ آخر باز شود.",
    progress: n => `${n.toLocaleString("fa-IR")} از ${PUZZLE_COUNT.toLocaleString("fa-IR")} کلمه حل شد.`,
    allSolved: () => "هر ۵ کلمه حل شد! حالا کلمهٔ آخر را مرتب کن.",
    solved: w => `درست است: ⁨${w}⁩!`,
    summary: (w, m, h) => `«⁨${w}⁩» را حل کردی — اشتباه: ${m.toLocaleString("fa-IR")}، راهنما: ${h.toLocaleString("fa-IR")}.`,
    saved: name => `ذخیره شد! آفرین ⁨${name}⁩.`,
    updateReady: "نسخهٔ جدید بازی آماده است.",
    updateNow: "به‌روزرسانی",
  },
  he: {
    title: "משחק מילים מבולבלות",
    won: "ניצחונות:",
    mistakesLabel: "טעויות:",
    unscramble: "סדרו את 5 המילים",
    instructions: 'גררו את האותיות לתיבות שלמטה. האותיות בתיבות המסומנות בעיגול <span class="circle-key"></span> יוצרות את המילה האחרונה.',
    finalJumble: "המילה האחרונה",
    hint: "רמז",
    newGame: "משחק חדש",
    enterName: "הכניסו שם לטבלת השיאים",
    highScore: "שיא חדש!",
    yourName: "הכניסו את שמכם",
    save: "שמירה",
    saving: "שומר…",
    cancel: "ביטול",
    name: "עברית", code: "he", dir: "rtl",
    start: () => "פתרו את כל 5 המילים כדי לפתוח את המילה האחרונה.",
    progress: n => `נפתרו ${n} מתוך ${PUZZLE_COUNT} מילים.`,
    allSolved: () => "כל 5 המילים נפתרו! עכשיו סדרו את המילה האחרונה.",
    solved: w => `נכון: ⁨${w}⁩!`,
    summary: (w, m, h) => `פתרתם את ״⁨${w}⁩״ — טעויות: ${m}, רמזים: ${h}.`,
    saved: name => `נשמר! כל הכבוד, ⁨${name}⁩.`,
    updateReady: "גרסה חדשה של המשחק מוכנה.",
    updateNow: "עדכון",
  },
  el: {
    title: "Ανακατεμένες λέξεις",
    won: "Νίκες:",
    mistakesLabel: "Λάθη:",
    unscramble: "Βάλε σε σειρά τις 5 λέξεις",
    instructions: 'Σύρε τα γράμματα στα κουτιά από κάτω. Τα γράμματα στα κυκλωμένα κουτιά <span class="circle-key"></span> σχηματίζουν την τελική λέξη.',
    finalJumble: "Τελική λέξη",
    hint: "Βοήθεια",
    newGame: "Νέο παιχνίδι",
    enterName: "Γράψε το όνομά σου στο ρεκόρ",
    highScore: "Νέο ρεκόρ!",
    yourName: "Γράψε το όνομά σου",
    save: "Αποθήκευση",
    saving: "Αποθήκευση…",
    cancel: "Άκυρο",
    name: "Ελληνικά", code: "el",
    start: () => "Λύσε και τις 5 λέξεις για να ξεκλειδώσεις την τελική λέξη.",
    progress: n => `Λύθηκαν ${n} από ${PUZZLE_COUNT} λέξεις.`,
    allSolved: () => "Λύθηκαν και οι 5 λέξεις! Τώρα βάλε σε σειρά την τελική λέξη.",
    solved: w => `Σωστά: ${w}!`,
    summary: (w, m, h) => `Έλυσες το «${w}» με ${m} λάθη και ${h} βοήθειες.`,
    saved: name => `Αποθηκεύτηκε! Μπράβο, ${name}.`,
    updateReady: "Μια νέα έκδοση του παιχνιδιού είναι έτοιμη.",
    updateNow: "Ενημέρωση",
  },
};

// High score list: [button + heading, close button, when the list is empty, game saved without a name,
// clear button, "are you sure?" question].
const LIST_TEXT = {
  en: ["High scores", "Close", "No high scores yet.", "(no name)", "Clear scores", "Delete all high scores? This can't be undone."],
  zh: ["高分榜", "关闭", "还没有高分记录。", "（未留名）", "清除记录", "删除所有高分记录？此操作无法撤销。"],
  ar: ["أفضل النتائج", "إغلاق", "لا توجد نتائج بعد.", "(بدون اسم)", "مسح النتائج", "هل تريد حذف كل النتائج؟ لا يمكن التراجع عن ذلك."],
  es: ["Récords", "Cerrar", "Todavía no hay récords.", "(sin nombre)", "Borrar récords", "¿Borrar todos los récords? No se puede deshacer."],
  fr: ["Meilleurs scores", "Fermer", "Aucun score pour l’instant.", "(sans nom)", "Effacer les scores", "Effacer tous les scores ? Impossible d’annuler."],
  pt: ["Recordes", "Fechar", "Ainda não há recordes.", "(sem nome)", "Apagar recordes", "Apagar todos os recordes? Isso não pode ser desfeito."],
  de: ["Bestenliste", "Schließen", "Noch keine Einträge.", "(ohne Namen)", "Liste löschen", "Alle Einträge löschen? Das kann nicht rückgängig gemacht werden."],
  ru: ["Рекорды", "Закрыть", "Рекордов пока нет.", "(без имени)", "Очистить", "Удалить все рекорды? Это нельзя отменить."],
  hi: ["उच्च स्कोर", "बंद करें", "अभी कोई उच्च स्कोर नहीं।", "(बिना नाम)", "स्कोर मिटाएँ", "सभी उच्च स्कोर मिटाएँ? इसे वापस नहीं किया जा सकता।"],
  ja: ["ハイスコア", "閉じる", "まだ記録がありません。", "（名前なし）", "記録を消去", "すべての記録を消去しますか？元に戻せません。"],
  ko: ["최고 기록", "닫기", "아직 기록이 없습니다.", "(이름 없음)", "기록 지우기", "모든 기록을 지울까요? 되돌릴 수 없습니다."],
  vi: ["Bảng điểm cao", "Đóng", "Chưa có điểm cao nào.", "(không tên)", "Xóa điểm", "Xóa tất cả điểm cao? Không thể hoàn tác."],
  id: ["Skor tertinggi", "Tutup", "Belum ada skor.", "(tanpa nama)", "Hapus skor", "Hapus semua skor? Tindakan ini tidak bisa dibatalkan."],
  tl: ["Mga high score", "Isara", "Wala pang high score.", "(walang pangalan)", "Burahin", "Burahin ang lahat ng high score? Hindi na ito maibabalik."],
  it: ["Record", "Chiudi", "Ancora nessun record.", "(senza nome)", "Cancella record", "Cancellare tutti i record? Non si può annullare."],
  fa: ["امتیازهای برتر", "بستن", "هنوز امتیازی ثبت نشده.", "(بدون نام)", "پاک کردن امتیازها", "همه امتیازها پاک شود؟ این کار برگشت‌پذیر نیست."],
  he: ["טבלת השיאים", "סגירה", "עדיין אין שיאים.", "(ללא שם)", "מחיקת השיאים", "למחוק את כל השיאים? אי אפשר לבטל."],
  el: ["Ρεκόρ", "Κλείσιμο", "Δεν υπάρχουν ακόμα ρεκόρ.", "(χωρίς όνομα)", "Διαγραφή", "Διαγραφή όλων των ρεκόρ; Δεν αναιρείται."],
};
for (const [id, [highScores, close, noScores, noName, clearScores, clearConfirm]] of Object.entries(LIST_TEXT)) {
  Object.assign(TEXT[id], { highScores, close, noScores, noName, clearScores, clearConfirm });
}

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
  document.documentElement.dir = t("dir") || "ltr"; // Arabic reads right to left
  document.title = t("title");
  document.querySelectorAll("[data-t]").forEach(n => { n.textContent = t(n.dataset.t); });
  document.querySelectorAll("[data-t-html]").forEach(n => { n.innerHTML = t(n.dataset.tHtml); });
  langSelect.value = lang;
  if (lastMessage) setMessage(lastMessage.key, lastMessage.args, lastMessage.kind);
  if (game && !els.scoreModal.hidden) els.scoreSummary.textContent = summaryText();
  if (!els.listModal.hidden) renderScoreList();
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
    // Every finished game goes on the list straight away; entering a name later
    // just fills in the name on this same entry.
    game.entry = {
      id: `${Date.now()}-${rand(1e9)}`, name: "",
      word: game.final.word, mistakes: game.mistakes, hints: game.hints,
      date: new Date().toISOString(),
    };
    saveHighScore(game.entry);
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
    const list = loadHighScores().filter(s => !entry.id || s.id !== entry.id); // replace, not duplicate
    list.push(entry);
    // Best games first: fewest mistakes, then fewest hints.
    list.sort((a, b) => a.mistakes - b.mistakes || a.hints - b.hints);
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(list.slice(0, 100)));
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

/* ---------- high score list ---------- */

function loadHighScores() {
  try { return JSON.parse(localStorage.getItem(HIGH_SCORE_KEY) || "[]"); } catch (e) { return []; }
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(t("code")); } catch (e) { return ""; }
}

// One row per saved game: name, date, and the word with its mistakes and hints.
function renderScoreList() {
  const list = loadHighScores();
  els.scoreList.innerHTML = "";
  els.listEmpty.hidden = list.length > 0;
  els.listClear.hidden = !list.length;
  list.forEach(s => {
    const li = document.createElement("li");
    const top = document.createElement("div");
    top.className = "score-top";
    const name = document.createElement("strong");
    name.textContent = s.name || t("noName");
    if (!s.name) name.className = "no-name";
    const date = document.createElement("span");
    date.className = "score-date";
    date.textContent = formatDate(s.date);
    top.append(name, date);
    const detail = document.createElement("div");
    detail.className = "score-detail";
    detail.textContent = t("summary")(s.word, s.mistakes, s.hints);
    li.append(top, detail);
    els.scoreList.appendChild(li);
  });
}

function openScoreList() {
  renderScoreList();
  els.listModal.hidden = false;
  els.scoreList.scrollTop = 0;
}

function closeScoreList() { els.listModal.hidden = true; }

els.scoresBtn.addEventListener("click", openScoreList);
els.listClose.addEventListener("click", closeScoreList);
els.listClear.addEventListener("click", () => {
  if (!confirm(t("clearConfirm"))) return;
  try { localStorage.removeItem(HIGH_SCORE_KEY); } catch (e) {}
  renderScoreList();
});
els.listModal.addEventListener("click", e => { if (e.target === els.listModal) closeScoreList(); });

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
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-CBC", iv }, aesKey, buf.subarray(36, n - 32)));
    const unzip = async bytes =>
      JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text());
    // Version 2 ("WJP2"): a small table, then separately compressed parts, so each
    // extra part is only unpacked when it is needed (keeps memory low on phones).
    if (String.fromCharCode(...plain.subarray(0, 4)) !== "WJP2") return await unzip(plain);
    const headLen = new DataView(plain.buffer, plain.byteOffset + 4, 4).getUint32(0, true);
    const head = JSON.parse(new TextDecoder().decode(plain.subarray(8, 8 + headLen)));
    const part = ([start, len]) => plain.subarray(8 + headLen + start, 8 + headLen + start + len);
    const pack = await unzip(part(head.core));
    pack.langs = Object.keys(head.langs);
    pack.loadLang = code => (head.langs[code] ? unzip(part(head.langs[code])) : Promise.resolve(null));
    return pack;
  } catch (e) {
    return null;
  }
}

function showPack(pack) {
  inPack = true; // never reload for an update while the bonus pack is open
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(n => n.remove());
  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: pack.css }));
  document.body.className = "";
  document.body.innerHTML = pack.html;
  self.PACK = {
    index: pack.index, books: pack.books, booksByLang: pack.booksByLang || {},
    langs: pack.langs || [], loadLang: pack.loadLang || (() => Promise.resolve(null)), lang,
  };
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

  game.entry.name = name; // the game was already saved when it was won
  saveHighScore(game.entry);
  setMessage("saved", [name], "win");
});

// Start fresh (drop any leftover #... from the address).
/* ---------- automatic updates ---------- */
// iPhone home-screen apps are usually resumed rather than restarted, so check for
// a new version every time the app is opened or brought back to the front.
// When the new version has been downloaded: if no game is in progress, reload
// straight away; otherwise show an "Update" bar so a game isn't lost.

let inPack = false;

function gameUntouched() {
  return game && !game.done && game.solvedCount === 0 && game.mistakes === 0 && game.hints === 0 &&
    !document.querySelector(".slot.filled") && els.scoreModal.hidden && els.listModal.hidden && !drag;
}

function showUpdateBar() {
  if (document.getElementById("update-bar")) return;
  const bar = document.createElement("div");
  bar.id = "update-bar";
  bar.className = "update-bar";
  const text = document.createElement("span");
  text.dataset.t = "updateReady";
  text.textContent = t("updateReady");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.t = "updateNow";
  btn.textContent = t("updateNow");
  btn.addEventListener("click", () => location.reload());
  bar.append(text, btn);
  document.body.appendChild(bar);
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  let controlled = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!controlled) { controlled = true; return; } // first install, not an update
    if (reloading || inPack) return;
    if (gameUntouched()) { reloading = true; location.reload(); }
    else showUpdateBar();
  });
  const checkForUpdate = () => {
    navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {});
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
  window.addEventListener("pageshow", e => { if (e.persisted) checkForUpdate(); });
}

if (location.hash) history.replaceState(null, "", location.pathname + location.search);
applyLanguage();
newGame();
