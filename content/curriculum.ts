import type { Exercise, LessonBlock, Topic } from "./types";
import { GRAMMAR_TOPICS } from "./topics-grammar";
import { SKILL_TOPICS } from "./topics-skills";

export const ALL_TOPICS: Topic[] = [...GRAMMAR_TOPICS, ...SKILL_TOPICS];
const byTag = new Map(ALL_TOPICS.map((t) => [t.tag, t]));

export const PHASES = [
  { id: "P1", order: 1, title: "English Foundation", description: "Grammar, vocabulary, basic listening & reading, basic speaking and writing." },
  { id: "P2", order: 2, title: "IELTS Skills", description: "IELTS question types, writing structure, speaking format, listening & reading strategies." },
  { id: "P3", order: 3, title: "Band Improvement", description: "Advanced practice, timed exercises, targeted corrections, fluency and writing improvement." },
  { id: "P4", order: 4, title: "Exam Preparation", description: "Full mock tests, score consistency, weakness correction, exam readiness." },
];

type Day = string; // "tag" or "tag:variant" or special: diagnostic | review | mock | targeted
const WEEKS: { title: string; focus: string; days: Day[] }[] = [
  { title: "Diagnostic & Sentence Basics", focus: "Kenali kemampuan awal dan kalimat dasar", days: ["diagnostic", "sentence-structure", "present-simple", "vocab-education", "past-simple", "writing-sentences", "review"] },
  { title: "Tenses, Articles & First Skills", focus: "Present perfect, articles, skimming, listening & speaking intro", days: ["present-perfect", "articles", "reading-skim-scan", "countability", "listening-intro", "speaking-intro", "review"] },
  { title: "Modals, Future & Comparisons", focus: "Modal, future forms, comparatives, T/F/NG", days: ["modals", "future-forms", "vocab-environment", "comparatives", "tfng", "writing-sentences:practice", "review"] },
  { title: "Complex Sentences", focus: "Conditionals, passive, relative clauses, cohesion", days: ["conditionals", "passive-voice", "relative-clauses", "linking-words", "vocab-technology", "listening-maps", "review"] },
  { title: "IELTS Writing & Reading Formats", focus: "Task 1 overview, Task 2 opinion, matching headings", days: ["tfng:practice", "task1-overview", "vocab-academic", "matching-headings", "speaking-intro:practice", "task2-opinion", "review"] },
  { title: "Completion, Charts & Cue Cards", focus: "Completion, Task 1 comparisons, Part 2", days: ["reading-completion", "task1-comparisons", "listening-academic", "paraphrasing", "speaking-part2", "task2-discussion", "review"] },
  { title: "Problem–Solution & Discussion", focus: "Reading MCQ, Task 2 problem–solution, Part 3", days: ["reading-mcq", "vocab-health", "task2-problem-solution", "listening-intro:timed", "speaking-part3", "exam-strategy", "review"] },
  { title: "Timed Skills Check", focus: "Latihan berwaktu dan mini test", days: ["matching-headings:timed", "task1-overview:timed", "vocab-work", "listening-academic:practice", "task2-opinion:timed", "mini", "review"] },
  { title: "Fluency & Grammatical Range", focus: "Part 2 practice, grammar range, coherence", days: ["speaking-part2:practice", "grammar-range", "coherence", "tfng:timed", "fluency", "task2-discussion:practice", "review"] },
  { title: "Lexical Precision", focus: "Collocations, pronunciation, Task 1 practice", days: ["speaking-part3:practice", "lexical-resource", "reading-completion:timed", "pronunciation", "task1-comparisons:practice", "paraphrasing:practice", "review"] },
  { title: "Accuracy Under Time", focus: "Grammar accuracy, timed reading, writing refinement", days: ["grammar-range:practice", "speaking-intro:sim", "reading-mcq:timed", "coherence:practice", "listening-maps:practice", "task2-problem-solution:timed", "review"] },
  { title: "Consolidation", focus: "Konsolidasi semua skill dan mini test", days: ["lexical-resource:practice", "speaking-part2:sim", "matching-headings:practice", "task1-overview:practice", "fluency:practice", "mini", "review"] },
  { title: "Mock Test 1", focus: "Simulasi penuh dan analisis", days: ["exam-strategy:practice", "mock", "reading-mcq:exam", "task2-opinion:exam", "speaking-part3:sim", "listening-academic:timed", "review"] },
  { title: "Mock Test 2", focus: "Konsistensi skor", days: ["targeted", "mock", "tfng:exam", "task1-comparisons:exam", "speaking-part2:sim", "grammar-range:practice", "review"] },
  { title: "Mock Test 3", focus: "Perbaikan kelemahan", days: ["targeted", "mock", "reading-completion:exam", "task2-discussion:exam", "speaking-part3:sim", "coherence:practice", "review"] },
  { title: "Final Readiness", focus: "Mock terakhir dan readiness assessment", days: ["targeted", "mock", "task2-problem-solution:exam", "speaking-intro:sim", "reading-mcq:exam", "lexical-resource:practice", "readiness"] },
];

const VARIANT: Record<string, { prefix: string; note: string; timed: boolean }> = {
  practice: { prefix: "Practice", note: "Sesi latihan ulang untuk memperkuat penguasaan.", timed: false },
  timed: { prefix: "Timed Practice", note: "Kerjakan dengan timer untuk membangun kecepatan.", timed: true },
  exam: { prefix: "Exam Conditions", note: "Kerjakan dalam kondisi ujian: berwaktu, tanpa bantuan.", timed: true },
  sim: { prefix: "Simulation", note: "Simulasi format IELTS tanpa bantuan tutor selama tes.", timed: true },
};

const phaseOf = (week: number) => (week <= 4 ? "P1" : week <= 8 ? "P2" : week <= 12 ? "P3" : "P4");

const CATEGORY: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading interpretation",
  listening: "Listening comprehension",
  writing: "Task response",
  speaking: "Fluency",
  exam: "Exam strategy",
};

export type BuiltLesson = {
  id: string;
  week: number;
  day: number;
  dayIndex: number;
  title: string;
  skill: string;
  topicTag: string | null;
  estimatedMinutes: number;
  objectives: string[];
  blocks: LessonBlock[];
  exercises: Exercise[];
  completionRules: Record<string, unknown>;
  prerequisites: string[];
};

function toExercises(id: string, t: Topic, start = 0, take?: number): Exercise[] {
  const list = take ? t.exercises.slice(start, start + take) : t.exercises.slice(start);
  return list.map(([prompt, options, answer, explanation], i) => ({
    id: `${id}-E${start + i + 1}`,
    type: options.length ? "mcq" : "completion",
    prompt,
    options,
    answer,
    explanation,
    skillTag: t.tag,
    category: t.skill === "grammar" ? t.title.split(":")[0] : CATEGORY[t.skill],
  }));
}

function topicLesson(id: string, t: Topic, variant?: string): Omit<BuiltLesson, "week" | "day" | "dayIndex" | "prerequisites"> {
  const v = variant ? VARIANT[variant] : undefined;
  const exercises = toExercises(id, t);
  const half = Math.ceil(exercises.length / 2);
  const blocks: LessonBlock[] = [];
  if (v) blocks.push({ type: "tip", body: v.note });
  blocks.push({ type: "theory", title: t.title, body: t.explain });
  if (t.structure) blocks.push({ type: "structure", rows: t.structure });
  blocks.push({ type: "examples", items: t.examples.map(([en, note]) => ({ en, note })) });
  if (t.mistakes?.length) blocks.push({ type: "mistakes", items: t.mistakes.map(([wrong, right, why]) => ({ wrong, right, why })) });
  if (t.tip && !v) blocks.push({ type: "tip", body: t.tip });
  if (t.vocab?.length) blocks.push({ type: "vocab", words: t.vocab });
  blocks.push({ type: "practice", title: "Guided Practice", guided: true, exerciseIds: exercises.slice(0, half).map((e) => e.id) });
  if (exercises.length > half)
    blocks.push({ type: "practice", title: "Independent Practice", guided: false, exerciseIds: exercises.slice(half).map((e) => e.id) });
  if (t.task) blocks.push({ type: "task", kind: t.task.kind, ref: t.task.ref, body: v ? `${t.task.body} ${v.note}` : t.task.body });
  blocks.push({ type: "summary", points: t.objectives });
  return {
    id,
    title: v ? `${v.prefix}: ${t.title}` : t.title,
    skill: t.skill === "exam" ? "assessment" : t.skill,
    topicTag: t.tag,
    estimatedMinutes: v ? Math.round(t.minutes * 0.8) : t.minutes,
    objectives: t.objectives,
    blocks,
    exercises,
    completionRules: { minScore: 70, cefr: t.cefr, timed: v?.timed ?? false, variant: variant ?? null },
  };
}

function specialLesson(id: string, kind: string, weekTopics: Topic[], week: number): Omit<BuiltLesson, "week" | "day" | "dayIndex" | "prerequisites"> {
  if (kind === "diagnostic") {
    return {
      id,
      title: "English Diagnostic",
      skill: "assessment",
      topicTag: null,
      estimatedMinutes: 120,
      objectives: ["Mengukur grammar & vocabulary awal", "Mengukur reading", "Menulis paragraf pendek untuk estimasi writing", "Menyusun rencana belajar personal"],
      blocks: [
        { type: "theory", title: "Selamat datang di IELTS Academy", body: "Hari pertama dimulai dengan **diagnostic test**. Tujuannya bukan memberi nilai, tetapi menemukan titik awal Anda agar rencana belajar sesuai kebutuhan.\n\nBagian yang belum bisa dinilai (misalnya Listening jika audio belum tersedia) akan ditandai **Not Assessed** — sistem tidak akan menebak skor." },
        { type: "task", kind: "diagnostic", body: "Mulai Diagnostic Test (±60–120 menit). Jawaban tersimpan otomatis, Anda bisa melanjutkan kapan saja." },
        { type: "summary", points: ["Diagnostic menentukan level awal", "Skor IELTS hanya diestimasi bila buktinya cukup"] },
      ],
      exercises: [],
      completionRules: { minScore: 0, requireDiagnostic: true },
    };
  }
  if (kind === "mock" || kind === "mini") {
    const full = kind === "mock";
    return {
      id,
      title: full ? `Full Mock Test (Week ${week})` : `Mini Test (Week ${week})`,
      skill: "assessment",
      topicTag: null,
      estimatedMinutes: full ? 180 : 60,
      objectives: full ? ["Simulasi Listening, Reading, Writing, Speaking", "Mengukur konsistensi skor", "Menganalisis kelemahan"] : ["Mengukur progres Reading & grammar", "Latihan dalam batas waktu"],
      blocks: [
        { type: "theory", title: full ? "Full Mock Test" : "Mini Test", body: full ? "Kerjakan semua komponen dalam kondisi ujian. Feedback baru muncul setelah tes selesai. Overall band **hanya** dihitung bila keempat komponen dinilai." : "Mini test berwaktu untuk mengukur progres. Hasilnya memperbarui profil kemampuan dan rencana belajar." },
        { type: "task", kind: "mock", ref: full ? "full" : "mini", body: full ? "Buka Mock Test → Full Mock." : "Buka Mock Test → Mini Test." },
        { type: "summary", points: ["Hasil simulasi bukan skor IELTS resmi", "Bandingkan hasil antar tes di halaman Progress"] },
      ],
      exercises: [],
      completionRules: { minScore: 0, requireTask: true },
    };
  }
  if (kind === "targeted") {
    return {
      id,
      title: "Targeted Review: My Mistakes",
      skill: "review",
      topicTag: null,
      estimatedMinutes: 90,
      objectives: ["Meninjau kesalahan berulang", "Latihan dari error log", "Menurunkan prioritas kesalahan yang sudah dikuasai"],
      blocks: [
        { type: "theory", title: "Belajar dari kesalahan", body: "Hari ini fokus pada kesalahan yang paling sering Anda lakukan. Buka **Error Log**, pilih kesalahan berulang, lalu minta AI Tutor membuat latihan khusus (mode *Practice*)." },
        { type: "task", kind: "errors", body: "Buka Error Log dan kerjakan latihan remedial." },
        { type: "summary", points: ["Kesalahan dengan 3 jawaban benar berturut-turut ditandai resolved"] },
      ],
      exercises: [],
      completionRules: { minScore: 0 },
    };
  }
  // review / readiness: pull 2 exercises from each topic of the week
  const exercises: Exercise[] = [];
  weekTopics.forEach((t) => {
    const ex = toExercises(id, t);
    const pick = [ex[ex.length - 1], ex[Math.floor(ex.length / 2)]].filter(Boolean);
    pick.forEach((e, i) => exercises.push({ ...e, id: `${id}-${t.tag}-${i + 1}` }));
  });
  const readinessDay = kind === "readiness";
  return {
    id,
    title: readinessDay ? "Readiness Assessment & Next Steps" : `Week ${week} Review & Mini Assessment`,
    skill: "review",
    topicTag: null,
    estimatedMinutes: 75,
    objectives: ["Mengulang materi minggu ini", "Mengukur mastery", "Memperbarui rencana belajar"],
    blocks: [
      { type: "theory", title: readinessDay ? "Readiness" : "Weekly Review", body: readinessDay ? "Bandingkan hasil mock test terakhir dengan target Anda di halaman Progress. Status readiness dihitung dari beberapa hasil terbaru, bukan satu skor terbaik." : "Review mingguan mencampur soal dari semua topik minggu ini. Skor di bawah 70% menandai topik untuk diulang (Needs Review)." },
      { type: "practice", title: "Mixed Review", guided: false, exerciseIds: exercises.map((e) => e.id) },
      { type: "summary", points: weekTopics.map((t) => t.title) },
    ],
    exercises,
    completionRules: { minScore: 70, weeklyReview: true },
  };
}

export function buildCurriculum() {
  const lessons: BuiltLesson[] = [];
  let prev: string | null = null;
  WEEKS.forEach((w, wi) => {
    const week = wi + 1;
    const weekTopics: Topic[] = [];
    w.days.forEach((d, di) => {
      const day = di + 1;
      const id = `W${String(week).padStart(2, "0")}D${String(day).padStart(2, "0")}`;
      const [tag, variant] = d.split(":");
      const t = byTag.get(tag);
      let base;
      if (t) {
        base = topicLesson(id, t, variant);
        weekTopics.push(t);
      } else {
        base = specialLesson(id, tag, weekTopics.filter((x) => x.exercises.length > 0), week);
      }
      lessons.push({ ...base, week, day, dayIndex: wi * 7 + day, prerequisites: prev ? [prev] : [] });
      prev = id;
    });
  });
  const weeks = WEEKS.map((w, i) => ({ id: `WK${String(i + 1).padStart(2, "0")}`, number: i + 1, phaseId: phaseOf(i + 1), title: w.title, focus: w.focus }));
  return { phases: PHASES, weeks, lessons };
}
