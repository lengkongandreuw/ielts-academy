// Pure assessment logic — no DB, fully unit-tested.

export type QuestionType = "mcq" | "tfng" | "ynng" | "completion" | "matching" | "short";

export type SnapshotQuestion = {
  id: string;
  version: number;
  section: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  answer: unknown; // mcq/matching: number index; tfng/ynng: label; completion/short: string[] accepted
  explanation: string;
  evidence?: string | null;
  group?: string | null; // passage or listening set id
  skillTag: string;
  cefr: string;
  difficulty: number;
};

export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Returns true/false, or null when the question was left unanswered. */
export function isCorrect(q: Pick<SnapshotQuestion, "type" | "answer">, given: unknown): boolean | null {
  if (given === null || given === undefined || given === "") return null;
  switch (q.type) {
    case "mcq":
    case "matching":
      return Number(given) === Number(q.answer);
    case "tfng":
    case "ynng":
      return String(given).toUpperCase() === String(q.answer).toUpperCase();
    case "completion":
    case "short": {
      const accepted = (Array.isArray(q.answer) ? q.answer : [q.answer]).map((a) => normalizeText(String(a)));
      const g = normalizeText(String(given));
      if (!g) return null;
      return accepted.includes(g);
    }
    default:
      return false;
  }
}

export type ObjectiveResult = {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number; // 0..100
  byType: Record<string, { correct: number; total: number }>;
  byTag: Record<string, { correct: number; total: number }>;
  bySection: Record<string, { correct: number; total: number }>;
  items: { id: string; correct: boolean | null; given: unknown }[];
};

export function scoreObjective(questions: SnapshotQuestion[], answers: Record<string, unknown>): ObjectiveResult {
  const r: ObjectiveResult = {
    total: questions.length,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    accuracy: 0,
    byType: {},
    byTag: {},
    bySection: {},
    items: [],
  };
  const bump = (m: Record<string, { correct: number; total: number }>, k: string, c: boolean) => {
    m[k] ??= { correct: 0, total: 0 };
    m[k].total++;
    if (c) m[k].correct++;
  };
  for (const q of questions) {
    const given = answers[q.id];
    const c = isCorrect(q, given);
    if (c === null) r.unanswered++;
    else if (c) r.correct++;
    else r.incorrect++;
    bump(r.byType, q.type, c === true);
    bump(r.byTag, q.skillTag, c === true);
    bump(r.bySection, q.section, c === true);
    r.items.push({ id: q.id, correct: c, given });
  }
  r.accuracy = r.total ? Math.round((r.correct / r.total) * 1000) / 10 : 0;
  return r;
}

/** Strip answer keys before sending a snapshot to the browser. */
export function publicQuestion(q: SnapshotQuestion) {
  const { answer: _a, explanation: _e, evidence: _ev, ...rest } = q;
  void _a; void _e; void _ev;
  return rest;
}

// ───────────── Band conversion & rounding ─────────────

export type BandRow = { min: number; band: number };

// Commonly published approximate conversion for a 40-question Academic Reading test.
// Configurable in DB (BandTable); this is only the default.
export const DEFAULT_READING_TABLE: BandRow[] = [
  { min: 39, band: 9 }, { min: 37, band: 8.5 }, { min: 35, band: 8 }, { min: 33, band: 7.5 },
  { min: 30, band: 7 }, { min: 27, band: 6.5 }, { min: 23, band: 6 }, { min: 19, band: 5.5 },
  { min: 15, band: 5 }, { min: 13, band: 4.5 }, { min: 10, band: 4 }, { min: 8, band: 3.5 },
  { min: 6, band: 3 }, { min: 4, band: 2.5 }, { min: 0, band: 0 },
];
export const DEFAULT_LISTENING_TABLE: BandRow[] = [
  { min: 39, band: 9 }, { min: 37, band: 8.5 }, { min: 35, band: 8 }, { min: 32, band: 7.5 },
  { min: 30, band: 7 }, { min: 26, band: 6.5 }, { min: 23, band: 6 }, { min: 18, band: 5.5 },
  { min: 16, band: 5 }, { min: 13, band: 4.5 }, { min: 10, band: 4 }, { min: 8, band: 3.5 },
  { min: 6, band: 3 }, { min: 4, band: 2.5 }, { min: 0, band: 0 },
];

/** Minimum questions before a raw score may be converted to an estimated band. */
export const MIN_QUESTIONS_FOR_BAND = 10;

/**
 * Converts a raw score to an estimated band by scaling to 40 questions.
 * Returns null when the test is too short to support a band estimate.
 */
export function rawToBand(correct: number, total: number, table: BandRow[]): number | null {
  if (total < MIN_QUESTIONS_FOR_BAND) return null;
  const scaled = Math.round((correct / total) * 40);
  const sorted = [...table].sort((a, b) => b.min - a.min);
  return sorted.find((r) => scaled >= r.min)?.band ?? 0;
}

/** IELTS overall rounding: mean of four, .25 → up to .5, .75 → up to next whole band. */
export function roundIeltsBand(x: number): number {
  const whole = Math.floor(x);
  const frac = x - whole;
  if (frac < 0.25) return whole;
  if (frac < 0.75) return whole + 0.5;
  return whole + 1;
}

/** Overall only when all four skills have evidence. */
export function overallBand(s: {
  listening: number | null | undefined;
  reading: number | null | undefined;
  writing: number | null | undefined;
  speaking: number | null | undefined;
}): number | null {
  const v = [s.listening, s.reading, s.writing, s.speaking];
  if (v.some((x) => x === null || x === undefined)) return null;
  const mean = (v as number[]).reduce((a, b) => a + b, 0) / 4;
  return roundIeltsBand(mean);
}

export const roundHalf = (x: number) => Math.round(x * 2) / 2;

export function countWords(text: string): number {
  const m = text.trim().match(/[A-Za-z0-9'’-]+/g);
  return m ? m.length : 0;
}

/** Map grammar/vocab mastery accuracy to a CEFR-ish starting level (not an IELTS band). */
export function levelFromDiagnostic(perLevel: Record<string, { correct: number; total: number }>): string {
  const order = ["A1", "A2", "B1", "B2", "C1"];
  let level = "A1";
  for (const l of order) {
    const s = perLevel[l];
    if (!s || s.total === 0) continue;
    if (s.correct / s.total >= 0.6) level = l;
    else break;
  }
  return level;
}
