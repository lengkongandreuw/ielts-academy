// Bundled, original course content + the runtime-loaded listening manifest.
import { buildCurriculum } from "../../content/curriculum";
import { DIAGNOSTIC_GV, PASSAGES, WRITING_PROMPTS, SPEAKING_PROMPTS, RUBRICS } from "../../content/bank";
import { VOCAB } from "../../content/vocabulary";
import type { SnapshotQuestion } from "./scoring";
import type { LessonMeta } from "./adaptive";

export const CONTENT_VERSION = 1;
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const built = buildCurriculum();
export const PHASES = built.phases;
export const WEEKS = built.weeks;
export const LESSONS = built.lessons;
export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

export const LESSON_META: LessonMeta[] = LESSONS.map((l) => ({
  id: l.id,
  dayIndex: l.dayIndex,
  skill: l.skill,
  topicTag: l.topicTag,
  cefr: (l.completionRules.cefr as string) ?? null,
  prerequisites: l.prerequisites,
  title: l.title,
}));

const CEFR_DIFF: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };

export const DIAGNOSTIC_QUESTIONS: SnapshotQuestion[] = DIAGNOSTIC_GV.map((q, i) => ({
  id: `DIAG-GV-${String(i + 1).padStart(2, "0")}`,
  version: CONTENT_VERSION,
  section: q.section,
  type: q.type,
  prompt: q.prompt,
  options: q.options ?? [],
  answer: q.answer,
  explanation: q.explanation,
  evidence: null,
  group: null,
  skillTag: q.skillTag,
  cefr: q.cefr,
  difficulty: CEFR_DIFF[q.cefr] ?? 3,
}));

export type Passage = { id: string; title: string; body: string; topic: string; cefr: string; difficulty: number; timeLimitMin: number; usage: string; questions: SnapshotQuestion[] };
export const PASSAGE_LIST: Passage[] = PASSAGES.map((p) => ({
  id: p.key,
  title: p.title,
  body: p.body,
  topic: p.topic,
  cefr: p.cefr,
  difficulty: p.difficulty,
  timeLimitMin: p.timeLimitMin,
  usage: p.usage,
  questions: p.questions.map((q, i) => ({
    id: `${p.key}-Q${String(i + 1).padStart(2, "0")}`,
    version: CONTENT_VERSION,
    section: "reading",
    type: q.type,
    prompt: q.prompt,
    options: q.options ?? [],
    answer: q.answer,
    explanation: q.explanation,
    evidence: q.evidence || null,
    group: p.key,
    skillTag: q.skillTag,
    cefr: p.cefr,
    difficulty: p.difficulty,
  })),
}));

export type WritingPrompt = (typeof WRITING_PROMPTS)[number] & { id: string; modelAnswer?: string };
export const WRITING_LIST: WritingPrompt[] = WRITING_PROMPTS.map((w) => ({ ...w, id: w.key }));

export type SpeakingPrompt = { id: string; part: number; topic: string; prompt: string; bullets: string[]; prepSec: number; speakSec: number; usage: string };
export const SPEAKING_LIST: SpeakingPrompt[] = SPEAKING_PROMPTS.map((s, i) => ({
  id: `SP-${String(i + 1).padStart(2, "0")}`,
  part: s.part,
  topic: s.topic,
  prompt: s.prompt,
  bullets: s.bullets ?? [],
  prepSec: s.prepSec ?? 0,
  speakSec: s.speakSec,
  usage: s.usage,
}));

export type VocabEntry = { word: string; partOfSpeech: string; meaning: string; example: string; collocations: string[]; cefr: string; topic: string };
export const VOCAB_LIST: VocabEntry[] = Object.entries(VOCAB).flatMap(([topic, list]) =>
  list.map(([word, partOfSpeech, meaning, example, collocations, cefr]) => ({ word, partOfSpeech, meaning, example, collocations, cefr, topic })),
);
export const VOCAB_BY_WORD = new Map(VOCAB_LIST.map((v) => [v.word, v]));
export { RUBRICS };

// ───────────── Listening (audio added later by the course owner) ─────────────

export type ListeningSet = {
  id: string;
  title: string;
  description?: string;
  section: number;
  file: string; // file name inside public/audio/
  usage: "practice" | "diagnostic" | "mock";
  difficulty?: number;
  durationSec?: number | null;
  transcript?: string;
  questions: { type: SnapshotQuestion["type"]; prompt: string; options?: string[]; answer: unknown; explanation?: string; skillTag?: string }[];
};

let manifest: Promise<ListeningSet[]> | null = null;

/** Loads public/audio/listening.json. Missing or empty file = no listening content (Content Unavailable). */
export function loadListening(): Promise<ListeningSet[]> {
  manifest ??= fetch(`${BASE_PATH}/audio/listening.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : { sets: [] }))
    .then((j: { sets?: ListeningSet[] }) => (Array.isArray(j.sets) ? j.sets.filter((s) => s.id && s.file && s.questions?.length) : []))
    .catch(() => []);
  return manifest;
}

export const audioUrl = (file: string) => `${BASE_PATH}/audio/${encodeURIComponent(file)}`;

export function listeningQuestions(set: ListeningSet): SnapshotQuestion[] {
  return set.questions.map((q, i) => ({
    id: `${set.id}-Q${String(i + 1).padStart(2, "0")}`,
    version: CONTENT_VERSION,
    section: "listening",
    type: q.type,
    prompt: q.prompt,
    options: q.options ?? [],
    answer: q.answer,
    explanation: q.explanation ?? "",
    evidence: null,
    group: set.id,
    skillTag: q.skillTag ?? "listening",
    cefr: "B1",
    difficulty: set.difficulty ?? 2,
  }));
}
