// Learning engine: every function mutates an (immer) draft of AppState. No DOM, no network → unit-testable.
import { current, isDraft } from "immer";
import type { AppState, AssessmentResult, AssessmentSession, ErrorRecord, LessonProgress, WritingSubmission } from "./types";
import { allocateTime, buildRecommendations, lessonState, masteryFrom, readiness, IELTS_SKILLS, type LessonState, type Skill } from "./adaptive";
import { DEFAULT_LISTENING_TABLE, DEFAULT_READING_TABLE, countWords, isCorrect, levelFromDiagnostic, rawToBand, scoreObjective, type SnapshotQuestion } from "./scoring";
import { nextReview, type Recall } from "./srs";
import { XP, newBadges } from "./game";
import { DIAGNOSTIC_QUESTIONS, LESSONS, LESSON_BY_ID, LESSON_META, PASSAGE_LIST, WRITING_LIST, SPEAKING_LIST, VOCAB_BY_WORD, listeningQuestions, type ListeningSet } from "./content";
import type { Exercise, LessonBlock } from "../../content/types";

export class EngineError extends Error {}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const nowIso = () => new Date().toISOString();

// ───────────── Activity, streak, XP ─────────────

/** Calendar day in Asia/Jakarta (UTC+7) — the audience is Indonesian. */
export const todayKey = (d = new Date()) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);

export function recordActivity(s: AppState, minutes: number, items = 1) {
  const k = todayKey();
  const a = (s.activity[k] ??= { minutes: 0, items: 0 });
  a.minutes = Math.round((a.minutes + Math.max(0, minutes)) * 10) / 10;
  a.items += items;
}

export function computeStreak(dates: string[], today = todayKey()): number {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date(today + "T00:00:00Z");
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1); // today not done yet keeps yesterday's streak alive
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}
export const streakOf = (s: AppState) => computeStreak(Object.entries(s.activity).filter(([, a]) => a.minutes > 0 || a.items > 0).map(([d]) => d));

export function award(s: AppState, xp: number, reason: string) {
  if (xp <= 0) return;
  s.game.xp += xp;
  s.game.log.push({ at: nowIso(), xp, reason });
  if (s.game.log.length > 200) s.game.log.splice(0, s.game.log.length - 200);
}

/** Run after every update: unlock badges whose conditions are now met. */
export function settleBadges(s: AppState) {
  for (const id of newBadges(s, streakOf(s))) s.game.badges[id] = nowIso();
}

// ───────────── Error log ─────────────

export type ErrorInput = Omit<ErrorRecord, "id" | "reviewStatus" | "recurrenceCount" | "correctStreak" | "createdAt" | "lastSeenAt">;

export function logError(s: AppState, e: ErrorInput) {
  const id = [e.skill, e.category, e.skillTag ?? e.questionId ?? e.expected].join("|").toLowerCase();
  const prev = s.errors[id];
  const t = nowIso();
  if (prev) {
    Object.assign(prev, { recurrenceCount: prev.recurrenceCount + 1, correctStreak: 0, reviewStatus: "open", lastSeenAt: t, userAnswer: e.userAnswer, expected: e.expected, explanation: e.explanation, sourceId: e.sourceId, lessonId: e.lessonId ?? prev.lessonId });
  } else {
    s.errors[id] = { ...e, id, reviewStatus: "open", recurrenceCount: 1, correctStreak: 0, createdAt: t, lastSeenAt: t };
  }
}

/** Three correct answers in a row on a previously failed tag resolves the error. */
export function recordCorrectOnTag(s: AppState, skill: string, tag: string) {
  for (const e of Object.values(s.errors)) {
    if (e.skill !== skill || e.skillTag !== tag || e.reviewStatus === "resolved") continue;
    e.correctStreak++;
    e.reviewStatus = e.correctStreak >= 3 ? "resolved" : "reviewing";
  }
}

// ───────────── Skill profile ─────────────

export function updateSkill(s: AppState, skill: Skill | "speaking_partial", value: number, source: string, sourceId?: string) {
  s.snapshots.push({ skill, value, source, sourceId, at: nowIso() });
  if (skill === "speaking_partial") return; // tracked separately, never an IELTS component score
  const hist = s.snapshots.filter((x) => x.skill === skill).reverse();
  if (skill === "grammar" || skill === "vocabulary") {
    s.skill[skill] = masteryFrom(hist.map((x) => x.value)) ?? value;
  } else {
    const last = hist.slice(0, 3);
    s.skill[skill] = Math.round((last.reduce((a, b) => a + b.value, 0) / last.length) * 2) / 2;
  }
}

// ───────────── Lessons ─────────────

const progressMap = (s: AppState) => Object.fromEntries(Object.entries(s.lessons).map(([k, v]) => [k, { status: v.status, score: v.score }]));

export function lessonStates(s: AppState): Record<string, LessonState> {
  const pm = progressMap(s);
  return Object.fromEntries(LESSON_META.map((m) => [m.id, lessonState(m, pm, s.skill.startLevel)]));
}

function ensureLesson(s: AppState, id: string): LessonProgress {
  const st = lessonStates(s)[id];
  if (!st) throw new EngineError("Lesson tidak ditemukan.");
  if (st === "locked") throw new EngineError("Lesson masih terkunci. Selesaikan lesson sebelumnya terlebih dahulu.");
  return (s.lessons[id] ??= { status: "in_progress", currentBlock: 0, answers: {}, checked: {}, notes: "", score: null, timeSpentSec: 0, lessonVersion: 1, startedAt: nowIso(), completedAt: null });
}

export function saveLessonProgress(s: AppState, id: string, patch: { answer?: [string, string | number]; notes?: string; currentBlock?: number; addSeconds?: number }) {
  const p = ensureLesson(s, id);
  if (patch.answer) p.answers[patch.answer[0]] = patch.answer[1];
  if (patch.notes !== undefined) p.notes = patch.notes.slice(0, 20000);
  if (patch.currentBlock !== undefined) p.currentBlock = patch.currentBlock;
  if (patch.addSeconds) {
    const add = Math.min(600, Math.max(0, patch.addSeconds));
    p.timeSpentSec += add;
    recordActivity(s, add / 60, 0);
  }
}

const answerText = (e: Exercise) => (e.type === "mcq" ? e.options[Number(e.answer)] : (e.answer as string[])[0]);

export function checkExercise(s: AppState, lessonId: string, exerciseId: string, answer: string | number) {
  const lesson = LESSON_BY_ID.get(lessonId);
  const ex = lesson?.exercises.find((e) => e.id === exerciseId);
  if (!lesson || !ex) throw new EngineError("Soal tidak ditemukan.");
  const p = ensureLesson(s, lessonId);
  const prev = p.checked[exerciseId];
  if (prev?.correct || (prev && prev.attempts >= 2)) return { correct: prev.correct, attempts: prev.attempts, revealed: true, xp: 0 };
  const correct = isCorrect({ type: ex.type, answer: ex.answer }, answer) === true;
  const attempts = (prev?.attempts ?? 0) + 1;
  p.checked[exerciseId] = { correct, attempts };
  p.answers[exerciseId] = answer;
  const skill = lesson.skill === "review" || lesson.skill === "assessment" ? "grammar" : lesson.skill;
  let xp = 0;
  if (!correct && attempts === 1) {
    logError(s, { lessonId, sourceType: "lesson", sourceId: lessonId, skill, questionId: exerciseId, userAnswer: ex.type === "mcq" ? ex.options[Number(answer)] ?? String(answer) : String(answer), expected: answerText(ex), category: ex.category, skillTag: ex.skillTag, explanation: ex.explanation });
  } else if (correct) {
    if (attempts === 1) recordCorrectOnTag(s, skill, ex.skillTag);
    xp = attempts === 1 ? XP.exerciseFirstTry : XP.exerciseRetry;
    award(s, xp, "Jawaban benar");
  }
  return { correct, attempts, revealed: correct || attempts >= 2, xp };
}

export const revealExercise = (e: Exercise) => ({ explanation: e.explanation, answerText: answerText(e) });

export function completeLesson(s: AppState, id: string) {
  const lesson = LESSON_BY_ID.get(id)!;
  const p = ensureLesson(s, id);
  const rules = lesson.completionRules as { minScore?: number; requireDiagnostic?: boolean };
  if (rules.requireDiagnostic && !Object.values(s.sessions).some((x) => x.kind === "diagnostic" && x.status === "submitted"))
    throw new EngineError("Selesaikan Diagnostic Test terlebih dahulu.");
  const unchecked = lesson.exercises.filter((e) => !p.checked[e.id]);
  if (unchecked.length) throw new EngineError(`Masih ada ${unchecked.length} latihan yang belum dicek.`);
  // Mastery is measured on first attempts: finishing a lesson does not automatically mean mastery.
  const first = lesson.exercises.filter((e) => p.checked[e.id]?.correct && p.checked[e.id].attempts === 1).length;
  const score = lesson.exercises.length ? Math.round((first / lesson.exercises.length) * 1000) / 10 : null;
  const status = score !== null && score < (rules.minScore ?? 70) ? "needs_review" : "completed";
  const firstTime = !p.completedAt;
  p.status = status;
  p.score = score;
  p.completedAt = nowIso();
  recordActivity(s, 0, 1);
  if (firstTime) {
    award(s, XP.lessonComplete, `Lesson ${id} selesai`);
    if (status === "completed" && score !== null && score >= 90) award(s, XP.lessonMastered, "Bonus mastery");
  }
  if (score !== null && (lesson.skill === "grammar" || lesson.skill === "vocabulary")) updateSkill(s, lesson.skill, score, "lesson", id);
  const vb = lesson.blocks.find((b) => b.type === "vocab") as { words: string[] } | undefined;
  if (vb) addVocab(s, vb.words);
  const plan = savePlan(s, "lesson");
  return { status, score, next: plan.items[0] ?? null };
}

// ───────────── Vocabulary (spaced repetition) ─────────────

export function addVocab(s: AppState, words: string[]) {
  for (const w of words) {
    if (!VOCAB_BY_WORD.has(w) || s.vocab[w]) continue;
    s.vocab[w] = { word: w, step: 0, reps: 0, lapses: 0, dueAt: nowIso(), lastReviewedAt: null, mastered: false, addedAt: nowIso() };
  }
}

export function reviewVocab(s: AppState, word: string, recall: Recall) {
  const v = s.vocab[word];
  if (!v) throw new EngineError("Kosakata tidak ditemukan.");
  const n = nextReview(v, recall);
  Object.assign(v, { ...n, dueAt: n.dueAt.toISOString(), lastReviewedAt: nowIso() });
  const entry = VOCAB_BY_WORD.get(word)!;
  if (recall === "again") logError(s, { lessonId: null, sourceType: "vocab", sourceId: null, skill: "vocabulary", questionId: null, userAnswer: "(lupa)", expected: word, category: "Vocabulary", skillTag: `word:${word}`, explanation: `${word} = ${entry.meaning}` });
  else if (recall !== "hard") recordCorrectOnTag(s, "vocabulary", `word:${word}`);
  recordActivity(s, 0.4, 1);
  award(s, XP.vocabReview, "Review kosakata");
  const reviewed = Object.values(s.vocab).filter((x) => x.reps > 0);
  // Evidence-based vocabulary mastery: share of reviewed words recalled well (every 5th review).
  if (reviewed.length >= 5 && reviewed.reduce((a, x) => a + x.reps, 0) % 5 === 0)
    updateSkill(s, "vocabulary", Math.round((reviewed.filter((x) => x.step >= 2 || x.mastered).length / reviewed.length) * 100), "vocab-review");
}

export const dueVocab = (s: AppState, at = new Date()) => Object.values(s.vocab).filter((v) => new Date(v.dueAt) <= at).sort((a, b) => b.lapses - a.lapses || +new Date(a.dueAt) - +new Date(b.dueAt));

// ───────────── Assessments ─────────────

export type StartOpts = { kind: AssessmentSession["kind"]; section?: AssessmentSession["section"]; refId?: string; mode?: "learning" | "exam"; timed?: boolean };

/** Resumes an unfinished session of the same kind/ref instead of creating a duplicate. */
export function startSession(s: AppState, o: StartOpts, listening: ListeningSet[] = [], forceNew = false): string {
  const section = o.section ?? "all";
  const existing = Object.values(s.sessions).find((x) => x.kind === o.kind && x.section === section && x.refId === (o.refId ?? null) && x.status === "in_progress");
  if (existing && !forceNew) return existing.id;

  const qs: SnapshotQuestion[] = [];
  const passages: AssessmentSession["passages"] = [];
  const lsnaps: AssessmentSession["listening"] = [];
  const notAssessed: string[] = [];
  let limit: number | null = null;
  const addPassage = (id: string) => {
    const p = PASSAGE_LIST.find((x) => x.id === id);
    if (!p) throw new EngineError("Passage tidak ditemukan.");
    passages.push({ id: p.id, title: p.title, body: p.body });
    qs.push(...p.questions);
    return p;
  };
  const addListening = (usage: string, id?: string) => {
    const sets = listening.filter((l) => (id ? l.id === id : l.usage === usage)).slice(0, usage === "mock" ? 4 : 1);
    if (!sets.length) {
      notAssessed.push("listening");
      return;
    }
    for (const l of sets) {
      lsnaps.push({ id: l.id, title: l.title, section: l.section, file: l.file, durationSec: l.durationSec ?? null, transcript: l.transcript ?? "" });
      qs.push(...listeningQuestions(l));
    }
  };

  if (o.kind === "diagnostic") {
    qs.push(...DIAGNOSTIC_QUESTIONS);
    addPassage(PASSAGE_LIST.find((p) => p.usage === "diagnostic")!.id);
    addListening("diagnostic");
  } else if (o.kind === "practice" && section === "reading") {
    const p = addPassage(o.refId!);
    if (o.timed || o.mode === "exam") limit = p.timeLimitMin * 60;
  } else if (o.kind === "practice" && section === "listening") {
    addListening("practice", o.refId);
    if (!lsnaps.length) throw new EngineError("Content Unavailable: audio untuk latihan ini belum tersedia.");
  } else if (o.kind === "mini") {
    const p = addPassage(PASSAGE_LIST.find((x) => x.usage === "mock")!.id);
    qs.push(...DIAGNOSTIC_QUESTIONS.filter((q) => q.difficulty >= 3).slice(0, 10));
    limit = p.timeLimitMin * 60 + 10 * 60;
  } else if (o.kind === "mock") {
    addListening("mock");
    for (const p of PASSAGE_LIST.filter((x) => x.usage !== "diagnostic").slice(0, 3)) addPassage(p.id);
    limit = 60 * 60 + (lsnaps.length ? 40 * 60 : 0);
  } else if (o.kind === "challenge") {
    qs.push(...challengeQuestions(s));
  } else throw new EngineError("Jenis tes tidak dikenal.");

  const id = uid();
  s.sessions[id] = {
    id, kind: o.kind, section, mode: o.kind === "mock" || o.kind === "mini" ? "exam" : o.mode ?? "learning", refId: o.refId ?? null,
    status: "in_progress", questions: structuredClone(qs), passages, listening: lsnaps, notAssessed, timeLimitSec: limit,
    startedAt: nowIso(), submittedAt: null, answers: {}, flagged: [], result: null,
  };
  return id;
}

export function setAnswer(s: AppState, id: string, qid: string, v: string | number) {
  const x = s.sessions[id];
  if (!x || x.status !== "in_progress") throw new EngineError("Tes sudah dikumpulkan.");
  x.answers[qid] = v;
}
export function toggleFlag(s: AppState, id: string, qid: string) {
  const x = s.sessions[id];
  if (!x || x.status !== "in_progress") return;
  x.flagged = x.flagged.includes(qid) ? x.flagged.filter((q) => q !== qid) : [...x.flagged, qid];
}

const CAT: Record<string, string> = { grammar: "Grammar", vocabulary: "Vocabulary", reading: "Reading interpretation", listening: "Listening comprehension" };

/** Idempotent: a second submit returns the stored result. */
export function submitSession(s: AppState, id: string): AssessmentResult {
  const x = s.sessions[id];
  if (!x) throw new EngineError("Sesi tidak ditemukan.");
  if (x.status === "submitted" && x.result) return isDraft(x.result) ? current(x.result) : x.result;
  const objective = scoreObjective(x.questions, x.answers);
  const sec = (k: string) => {
    const t = x.questions.filter((q) => q.section === k).length;
    const c = objective.bySection[k]?.correct ?? 0;
    return t ? { correct: c, total: t, accuracy: Math.round((c / t) * 1000) / 10 } : null;
  };
  const sections = { grammar: sec("grammar"), vocabulary: sec("vocabulary"), reading: sec("reading"), listening: sec("listening") };
  const bands = {
    reading: sections.reading ? rawToBand(sections.reading.correct, sections.reading.total, DEFAULT_READING_TABLE) : null,
    listening: sections.listening ? rawToBand(sections.listening.correct, sections.listening.total, DEFAULT_LISTENING_TABLE) : null,
  };
  let startLevel: string | null = null;
  if (x.kind === "diagnostic") {
    const per: Record<string, { correct: number; total: number }> = {};
    for (const q of x.questions.filter((q) => q.section === "grammar" || q.section === "vocabulary")) {
      per[q.cefr] ??= { correct: 0, total: 0 };
      per[q.cefr].total++;
      if (objective.items.find((i) => i.id === q.id)?.correct) per[q.cefr].correct++;
    }
    startLevel = levelFromDiagnostic(per);
    s.skill.startLevel = startLevel;
  }
  for (const q of x.questions) {
    const it = objective.items.find((i) => i.id === q.id)!;
    if (it.correct === false) {
      const opt = q.type === "mcq" || q.type === "matching";
      logError(s, {
        lessonId: null, sourceType: x.kind === "challenge" ? "challenge" : "assessment", sourceId: id, skill: q.section, questionId: q.id,
        userAnswer: opt ? q.options[Number(it.given)] ?? String(it.given) : String(it.given),
        expected: opt ? q.options[Number(q.answer)] : Array.isArray(q.answer) ? String(q.answer[0]) : String(q.answer),
        category: CAT[q.section] ?? "Grammar", skillTag: q.skillTag, explanation: q.explanation,
      });
    } else if (it.correct) recordCorrectOnTag(s, q.section, q.skillTag);
  }
  // Skill profile only changes with real evidence.
  if (sections.grammar && sections.grammar.total >= 5) updateSkill(s, "grammar", sections.grammar.accuracy, x.kind, id);
  if (sections.vocabulary && sections.vocabulary.total >= 5) updateSkill(s, "vocabulary", sections.vocabulary.accuracy, x.kind, id);
  if (bands.reading !== null) updateSkill(s, "reading", bands.reading, x.kind, id);
  if (bands.listening !== null) updateSkill(s, "listening", bands.listening, x.kind, id);

  const minutes = (Date.now() - +new Date(x.startedAt)) / 60000;
  recordActivity(s, Math.min(minutes, 240), 1);
  award(s, x.kind === "diagnostic" ? XP.diagnostic : x.kind === "challenge" ? XP.challenge : XP.assessmentSubmit, x.kind === "challenge" ? "Tantangan harian" : "Tes selesai");
  award(s, objective.correct * XP.assessmentCorrect, "Jawaban benar");

  const result: AssessmentResult = { objective, sections, bands, notAssessed: x.notAssessed, startLevel, note: "Estimasi simulasi — bukan skor IELTS resmi." };
  x.status = "submitted";
  x.submittedAt = nowIso();
  x.result = result;
  savePlan(s, x.kind === "diagnostic" ? "diagnostic" : "assessment");
  return result;
}

// ───────────── Daily challenge ─────────────

function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 100000) / 100000;
}

/** 5 questions: recurring-error topics first, then unlocked lessons, then diagnostic bank. Same set all day. */
export function challengeQuestions(s: AppState, date = todayKey()): SnapshotQuestion[] {
  const rnd = seeded(date + (s.profile?.createdAt ?? ""));
  const states = lessonStates(s);
  const openTags = new Set(Object.values(s.errors).filter((e) => e.reviewStatus !== "resolved").map((e) => e.skillTag));
  const pool: SnapshotQuestion[] = [];
  for (const l of LESSONS) {
    if (states[l.id] === "locked") continue;
    for (const e of l.exercises) {
      pool.push({ id: `CH-${e.id}`, version: 1, section: l.skill === "vocabulary" ? "vocabulary" : "grammar", type: e.type, prompt: e.prompt, options: e.options, answer: e.answer, explanation: e.explanation, evidence: null, group: null, skillTag: e.skillTag, cefr: (l.completionRules.cefr as string) ?? "B1", difficulty: 2 });
    }
  }
  if (pool.length < 5) pool.push(...DIAGNOSTIC_QUESTIONS.map((q) => ({ ...q, id: `CH-${q.id}` })));
  const scored = pool.map((q) => ({ q, k: (openTags.has(q.skillTag) ? 1 : 0) + rnd() }));
  scored.sort((a, b) => b.k - a.k);
  const seen = new Set<string>();
  const out: SnapshotQuestion[] = [];
  for (const { q } of scored) {
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
    if (out.length === 5) break;
  }
  return out;
}

export function startChallenge(s: AppState) {
  const d = todayKey();
  const existing = s.game.challenges[d];
  if (existing && s.sessions[existing]) return existing;
  const id = startSession(s, { kind: "challenge", refId: d }, [], true);
  s.game.challenges[d] = id;
  return id;
}

// ───────────── Writing ─────────────

export function createWriting(s: AppState, promptId: string, context = "practice") {
  const p = WRITING_LIST.find((w) => w.id === promptId);
  if (!p) throw new EngineError("Soal writing tidak ditemukan.");
  const draft = Object.values(s.writings).find((w) => w.promptId === promptId && w.context === context && w.status === "draft" && !w.rootId);
  if (draft) return draft.id;
  const id = uid();
  s.writings[id] = {
    id, promptId, rootId: null, revision: 1, text: "", wordCount: 0, timeSpentSec: 0, context, status: "draft", evaluation: null, selfCheck: null, confidence: null, error: null, createdAt: nowIso(), submittedAt: null,
    prompt: { taskType: p.taskType, title: p.title, prompt: p.prompt, imageData: "imageData" in p ? (p.imageData as string) : null, imageAlt: "imageData" in p ? /aria-label="([^"]+)"/.exec(p.imageData as string)?.[1] : undefined, minWords: p.minWords, timeLimitMin: p.timeLimitMin, version: 1 },
  };
  return id;
}

export function reviseWriting(s: AppState, parentId: string) {
  const parent = s.writings[parentId];
  if (!parent) throw new EngineError("Esai tidak ditemukan.");
  const rootId = parent.rootId ?? parent.id;
  const open = Object.values(s.writings).find((w) => w.rootId === rootId && w.status === "draft");
  if (open) return open.id;
  const chain = writingChain(s, parentId);
  const id = uid();
  s.writings[id] = { ...structuredClone(parent), id, rootId, revision: chain[chain.length - 1].revision + 1, status: "draft", evaluation: null, selfCheck: null, confidence: null, error: null, createdAt: nowIso(), submittedAt: null, timeSpentSec: 0 };
  return id;
}

export const writingChain = (s: AppState, id: string): WritingSubmission[] => {
  const w = s.writings[id];
  if (!w) return [];
  const root = w.rootId ?? w.id;
  return Object.values(s.writings).filter((x) => x.id === root || x.rootId === root).sort((a, b) => a.revision - b.revision);
};

export function saveWriting(s: AppState, id: string, text: string, addSeconds = 0) {
  const w = s.writings[id];
  if (!w) throw new EngineError("Esai tidak ditemukan.");
  if (w.status !== "draft") throw new EngineError("Esai sudah dikirim. Buat revisi untuk mengubahnya.");
  w.text = text.slice(0, 20000);
  w.wordCount = countWords(text);
  if (addSeconds) {
    w.timeSpentSec += Math.min(600, addSeconds);
    recordActivity(s, Math.min(600, addSeconds) / 60, 0);
  }
}

/** Submits an essay. With AI → status "evaluating" (caller runs the evaluation); without → self review. */
export function submitWriting(s: AppState, id: string, withAi: boolean) {
  const w = s.writings[id];
  if (!w) throw new EngineError("Esai tidak ditemukan.");
  if (w.status === "draft") {
    if (countWords(w.text) < 20) throw new EngineError("Tulisan terlalu pendek (minimal 20 kata).");
    w.submittedAt = nowIso();
    recordActivity(s, 0, 1);
    award(s, XP.writingSubmit, "Esai dikirim");
  } else if (!(w.status === "failed" || w.status === "self_reviewed")) return;
  w.status = withAi ? "evaluating" : "self_reviewed";
  w.error = null;
}

// ───────────── Plan ─────────────

export function lowReadingTypes(s: AppState) {
  const agg: Record<string, { c: number; t: number }> = {};
  for (const x of Object.values(s.sessions)) {
    if (x.status !== "submitted" || !x.result) continue;
    for (const q of x.questions.filter((q) => q.section === "reading")) {
      const it = x.result.objective.items.find((i) => i.id === q.id);
      agg[q.type] ??= { c: 0, t: 0 };
      agg[q.type].t++;
      if (it?.correct) agg[q.type].c++;
    }
  }
  const L: Record<string, string> = { mcq: "Multiple Choice", tfng: "True/False/Not Given", ynng: "Yes/No/Not Given", completion: "Sentence Completion", matching: "Matching", short: "Short Answer" };
  return Object.entries(agg).filter(([, v]) => v.t >= 3 && v.c / v.t < 0.6).sort((a, b) => a[1].c / a[1].t - b[1].c / b[1].t).map(([k]) => L[k] ?? k);
}

export function recurringErrors(s: AppState) {
  return Object.values(s.errors)
    .filter((e) => e.reviewStatus !== "resolved" && e.recurrenceCount >= 2)
    .sort((a, b) => b.recurrenceCount - a.recurrenceCount || +new Date(b.lastSeenAt) - +new Date(a.lastSeenAt))
    .map((e) => ({ category: e.category, skill: e.skill, skillTag: e.skillTag, count: e.recurrenceCount }));
}

export function skillHistory(s: AppState) {
  const h: Record<string, number[]> = {};
  for (const x of [...s.snapshots].reverse()) if ([...IELTS_SKILLS, "speaking_partial"].includes(x.skill)) (h[x.skill] ??= []).push(x.value);
  // Readiness is a status (not a score) and may use the transcript-only speaking estimate.
  if (!h.speaking && h.speaking_partial) h.speaking = h.speaking_partial;
  delete h.speaking_partial;
  return h;
}

export function computePlan(s: AppState) {
  const target = s.profile?.targetBand ?? 7;
  const recurring = recurringErrors(s);
  const recBySkill: Partial<Record<Skill, number>> = {};
  for (const r of recurring) recBySkill[r.skill as Skill] = (recBySkill[r.skill as Skill] ?? 0) + 1;
  const sp = { grammar: s.skill.grammar, vocabulary: s.skill.vocabulary, listening: s.skill.listening, reading: s.skill.reading, writing: s.skill.writing, speaking: s.skill.speaking };
  return {
    allocation: allocateTime(sp, target, s.profile?.studyHoursPerDay ?? 2, recBySkill),
    items: buildRecommendations({
      hasDiagnostic: Object.values(s.sessions).some((x) => x.kind === "diagnostic" && x.status === "submitted"),
      lessons: LESSON_META,
      progress: progressMap(s),
      startLevel: s.skill.startLevel,
      profile: sp,
      targetBand: target,
      recurring,
      dueVocab: dueVocab(s).length,
      lowReadingTypes: lowReadingTypes(s),
    }),
    readiness: readiness(skillHistory(s), target),
  };
}

/** Stores a plan version with its reasons so the learner can see why the plan changed. */
export function savePlan(s: AppState, trigger: string) {
  const p = computePlan(s);
  const plan = { version: (s.plans[0]?.version ?? 0) + 1, trigger, allocation: p.allocation, items: p.items, readiness: p.readiness, at: nowIso() };
  s.plans.unshift(plan);
  s.plans.splice(10);
  return plan;
}

// ───────────── Misc ─────────────

export function lessonBlocks(id: string): LessonBlock[] {
  return LESSON_BY_ID.get(id)?.blocks ?? [];
}

export const speakingPrompt = (id: string) => SPEAKING_LIST.find((p) => p.id === id);

/** Delete speaking recordings past their retention date (audio blobs are deleted by the store). */
export function expiredRecordings(s: AppState, at = new Date()) {
  return Object.values(s.recordings).filter((r) => r.hasAudio && r.expiresAt && new Date(r.expiresAt) < at).map((r) => r.id);
}

// ───────────── Applying AI results ─────────────

type WEval = { overall: number | null; isBandTask: boolean; corrections: { original: string; corrected: string; category: string; explanation: string }[] };

export function applyWritingEvaluation(s: AppState, id: string, evaluation: WEval, confidence: "normal" | "low") {
  const w = s.writings[id];
  if (!w) return;
  w.status = "evaluated";
  w.evaluation = evaluation;
  w.confidence = confidence;
  w.error = null;
  for (const c of evaluation.corrections.slice(0, 8))
    logError(s, { lessonId: null, sourceType: "writing", sourceId: id, skill: c.category === "Vocabulary" ? "vocabulary" : c.category === "Grammar" ? "grammar" : "writing", questionId: null, userAnswer: c.original, expected: c.corrected, category: c.category, skillTag: null, explanation: c.explanation });
  // Only full IELTS tasks of adequate length update the Writing estimate.
  if (evaluation.isBandTask && evaluation.overall !== null && confidence === "normal") updateSkill(s, "writing", evaluation.overall, "writing", id);
  savePlan(s, "writing");
}

export function failWriting(s: AppState, id: string, message: string) {
  const w = s.writings[id];
  if (w) Object.assign(w, { status: "failed", error: message });
}

export function addRecording(s: AppState, r: { id: string; promptId: string; hasAudio: boolean; mimeType: string | null; durationSec: number | null; transcript: string; context: string }) {
  const p = speakingPrompt(r.promptId);
  if (!p) throw new EngineError("Soal speaking tidak ditemukan.");
  const days = s.profile?.audioRetentionDays ?? 30;
  s.recordings[r.id] = {
    ...r, prompt: { part: p.part, topic: p.topic, prompt: p.prompt, bullets: p.bullets }, status: "saved", feedback: null, selfCheck: null, error: null,
    createdAt: nowIso(), expiresAt: r.hasAudio ? new Date(Date.now() + days * 864e5).toISOString() : null,
  };
  recordActivity(s, (r.durationSec ?? 60) / 60 + 2, 1);
  award(s, XP.speakingSubmit, "Speaking direkam");
  if (r.context.startsWith("mock:") && s.mocks[r.context.slice(5)]) s.mocks[r.context.slice(5)].speakingId = r.id;
}

type SFeedback = { partialBand: number | null; words: number; corrections: { original: string; corrected: string; explanation: string }[] };
export function applySpeakingFeedback(s: AppState, id: string, fb: SFeedback) {
  const r = s.recordings[id];
  if (!r) return;
  Object.assign(r, { status: "evaluated", feedback: fb, error: null });
  for (const c of fb.corrections.slice(0, 5))
    logError(s, { lessonId: null, sourceType: "speaking", sourceId: id, skill: "speaking", questionId: null, userAnswer: c.original, expected: c.corrected, category: "Grammar", skillTag: null, explanation: c.explanation });
  // Transcript-only estimate (3 of 4 criteria): kept separate, never used for an Overall band.
  if (fb.partialBand !== null && fb.words >= 25) updateSkill(s, "speaking_partial", fb.partialBand, "speaking", id);
}

// ───────────── Writing analysis without AI (objective text metrics, not a band) ─────────────

const LINKERS = ["however", "moreover", "furthermore", "in addition", "therefore", "as a result", "consequently", "although", "whereas", "while", "on the other hand", "for example", "for instance", "in conclusion", "firstly", "secondly", "finally", "because", "since", "despite", "overall"];

export function analyzeWriting(text: string, minWords: number, taskType: string) {
  const words = countWords(text);
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length;
  const sentences = text.split(/[.!?]+(?:\s|$)/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length > 2);
  const avgLen = sentences.length ? Math.round(words / sentences.length) : 0;
  const lower = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  const linkers = LINKERS.filter((l) => lower.includes(` ${l} `) || lower.includes(` ${l},`));
  const counts: Record<string, number> = {};
  for (const w of text.toLowerCase().match(/[a-z']{5,}/g) ?? []) counts[w] = (counts[w] ?? 0) + 1;
  const repeated = Object.entries(counts).filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w, c]) => `${w} (${c}×)`);
  const checks = [
    { ok: words >= minWords, text: words >= minWords ? `Panjang memenuhi minimal ${minWords} kata (${words}).` : `Kurang dari ${minWords} kata (${words}) — di ujian ini menurunkan Task Achievement/Response.` },
    { ok: taskType === "paragraph" ? paragraphs >= 1 : paragraphs >= (taskType === "task1" ? 3 : 4), text: `${paragraphs} paragraf${taskType === "task2" ? " (disarankan 4–5: intro, 2–3 body, conclusion)" : taskType === "task1" ? " (disarankan 3–4: intro, overview, 2 body)" : ""}.` },
    { ok: linkers.length >= 3, text: linkers.length ? `Linking words: ${linkers.join(", ")}.` : "Belum ada linking words — tambahkan untuk Coherence & Cohesion." },
    { ok: avgLen >= 10 && avgLen <= 28, text: `Rata-rata ${avgLen} kata per kalimat${avgLen > 28 ? " — beberapa kalimat mungkin terlalu panjang" : avgLen < 10 ? " — variasikan dengan kalimat kompleks" : ""}.` },
    { ok: repeated.length === 0, text: repeated.length ? `Kata yang sering diulang: ${repeated.join(", ")} — coba sinonim/parafrase.` : "Tidak ada pengulangan kata yang berlebihan." },
  ];
  if (taskType === "task1") checks.push({ ok: /\boverall\b|\bin general\b|\bit is clear\b/i.test(text), text: /\boverall\b|\bin general\b|\bit is clear\b/i.test(text) ? "Ada kalimat overview." : "Tidak ditemukan overview (mis. “Overall, …”) — wajib untuk Task 1." });
  if (taskType === "task2") checks.push({ ok: /\b(i (strongly |completely |partly )?(agree|disagree|believe|think)|in my (view|opinion))\b/i.test(text), text: /\b(i (strongly |completely |partly )?(agree|disagree|believe|think)|in my (view|opinion))\b/i.test(text) ? "Posisi/opini Anda dinyatakan." : "Posisi belum jelas — nyatakan opini di introduction." });
  return { words, paragraphs, sentences: sentences.length, avgLen, linkers, repeated, checks };
}

// ───────────── Full mock test ─────────────

export const MOCK_WRITING = "t2-traffic";
export const MOCK_SPEAKING = "SP-08";

export function startMock(s: AppState, listening: ListeningSet[]) {
  const open = Object.values(s.mocks).find((m) => m.status === "in_progress");
  if (open) return open.id;
  const id = uid();
  const sessionId = startSession(s, { kind: "mock" }, listening, true);
  s.mocks[id] = { id, sessionId, writingId: null, speakingId: null, status: "in_progress", startedAt: nowIso(), submittedAt: null };
  s.mocks[id].writingId = createWriting(s, MOCK_WRITING, `mock:${id}`);
  return id;
}

/** Finishes the whole mock: scores L/R, sends the essay (AI if available), unlocks all feedback. */
export function submitMock(s: AppState, id: string, withAi: boolean) {
  const m = s.mocks[id];
  if (!m || m.status === "submitted") return;
  if (s.sessions[m.sessionId]?.status === "in_progress") submitSession(s, m.sessionId);
  const w = m.writingId ? s.writings[m.writingId] : undefined;
  if (w?.status === "draft" && countWords(w.text) >= 20) submitWriting(s, w.id, withAi);
  const r = m.speakingId ? s.recordings[m.speakingId] : undefined;
  if (withAi && r && r.status === "saved" && r.transcript.trim()) r.status = "evaluating";
  m.status = "submitted";
  m.submittedAt = nowIso();
}
