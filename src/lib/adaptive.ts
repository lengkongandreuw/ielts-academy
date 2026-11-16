// Pure adaptive-learning logic (no DB). Unit-tested.

export const SKILLS = ["grammar", "vocabulary", "listening", "reading", "writing", "speaking"] as const;
export type Skill = (typeof SKILLS)[number];
export const IELTS_SKILLS = ["listening", "reading", "writing", "speaking"] as const;

export type SkillProfileInput = Partial<Record<Skill, number | null>>;

export const MASTERY_THRESHOLD = 70; // % accuracy for a lesson to count as mastered
export const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type Allocation = { skill: Skill; minutes: number; weight: number; reason: string }[];

export function allocateTime(
  profile: SkillProfileInput,
  targetBand: number,
  hoursPerDay: number,
  recurringBySkill: Partial<Record<Skill, number>> = {},
): Allocation {
  const total = Math.max(30, Math.round(hoursPerDay * 60));
  const raw = SKILLS.map((skill) => {
    const v = profile[skill];
    let weight = 1;
    let reason: string;
    if (v === null || v === undefined) {
      weight = 1.2;
      reason = "Belum ada bukti penilaian — perlu latihan untuk diukur.";
    } else if (skill === "grammar" || skill === "vocabulary") {
      const gap = Math.max(0, (85 - v) / 20);
      weight = 1 + gap;
      reason = v >= 85 ? `Mastery ${Math.round(v)}% — pertahankan.` : `Mastery ${Math.round(v)}% di bawah 85%.`;
    } else {
      const gap = Math.max(0, targetBand - v);
      weight = 1 + gap * 0.9;
      reason = gap > 0 ? `Estimasi ${v} — selisih ${gap.toFixed(1)} dari target ${targetBand}.` : `Estimasi ${v} sudah memenuhi target.`;
    }
    const rec = recurringBySkill[skill] ?? 0;
    if (rec > 0) {
      weight += Math.min(1, rec * 0.1);
      reason += ` ${rec} kesalahan berulang.`;
    }
    return { skill, weight, reason };
  });
  const sum = raw.reduce((a, b) => a + b.weight, 0);
  const minShare = 0.08;
  // Guarantee each skill a minimum share so no skill is dropped entirely.
  let alloc = raw.map((r) => ({ ...r, share: Math.max(minShare, r.weight / sum) }));
  const shareSum = alloc.reduce((a, b) => a + b.share, 0);
  alloc = alloc.map((a) => ({ ...a, share: a.share / shareSum }));
  return alloc.map((a) => ({
    skill: a.skill,
    weight: Math.round(a.weight * 100) / 100,
    minutes: Math.max(5, Math.round((a.share * total) / 5) * 5),
    reason: a.reason,
  }));
}

export type LessonMeta = {
  id: string;
  dayIndex: number;
  skill: string;
  topicTag?: string | null;
  cefr?: string | null;
  prerequisites: string[];
  title: string;
};
export type ProgressMeta = { status: string; score: number | null };
export type LessonState = "locked" | "available" | "in_progress" | "completed" | "needs_review";

export function lessonState(
  lesson: LessonMeta,
  progress: Record<string, ProgressMeta | undefined>,
  startLevel?: string | null,
): LessonState {
  const p = progress[lesson.id];
  if (p?.status === "completed") return p.score !== null && p.score < MASTERY_THRESHOLD ? "needs_review" : "completed";
  if (p?.status === "needs_review") return "needs_review";
  if (p?.status === "in_progress") return "in_progress";
  const prereqsDone = lesson.prerequisites.every((id) => {
    const s = progress[id]?.status;
    return s === "completed" || s === "needs_review";
  });
  if (prereqsDone) return "available";
  // Placement: foundation lessons below the learner's diagnosed level open early.
  if (startLevel && lesson.cefr) {
    const li = CEFR_ORDER.indexOf(lesson.cefr);
    const ui = CEFR_ORDER.indexOf(startLevel);
    if (li >= 0 && ui >= 0 && li < ui) return "available";
  }
  return "locked";
}

export type Recommendation = {
  kind: "lesson" | "remedial" | "review" | "practice" | "diagnostic" | "vocab";
  title: string;
  reason: string;
  href: string;
  priority: number; // higher first
};

export type RecurringError = { category: string; skill: string; skillTag: string | null; count: number };

export function buildRecommendations(input: {
  hasDiagnostic: boolean;
  lessons: LessonMeta[];
  progress: Record<string, ProgressMeta | undefined>;
  startLevel?: string | null;
  profile: SkillProfileInput;
  targetBand: number;
  recurring: RecurringError[];
  dueVocab: number;
  lowReadingTypes: string[];
}): Recommendation[] {
  const recs: Recommendation[] = [];
  if (!input.hasDiagnostic) {
    recs.push({
      kind: "diagnostic",
      title: "Kerjakan Diagnostic Test",
      reason: "Rencana belajar personal disusun dari hasil diagnostic.",
      href: "/diagnostic",
      priority: 100,
    });
  }
  const states = input.lessons.map((l) => ({ l, s: lessonState(l, input.progress, input.startLevel) }));
  const next = states.find((x) => x.s === "in_progress") ?? states.find((x) => x.s === "available");
  if (next) {
    recs.push({
      kind: "lesson",
      title: `Day ${next.l.dayIndex}: ${next.l.title}`,
      reason: next.s === "in_progress" ? "Lanjutkan pelajaran terakhir." : "Pelajaran berikutnya di roadmap.",
      href: `/learn/${next.l.id}`,
      priority: 90,
    });
  }
  for (const r of input.recurring.slice(0, 3)) {
    // Only point to a lesson the learner can open; otherwise offer targeted tutor practice.
    const target = r.skillTag ? states.find((x) => x.l.topicTag === r.skillTag && x.s !== "locked")?.l : undefined;
    recs.push({
      kind: "remedial",
      title: target ? `Ulangi: ${target.title}` : `Latihan ulang: ${r.category}`,
      reason: `Kesalahan "${r.category}" muncul ${r.count}×.`,
      href: target ? `/learn/${target.id}` : `/tutor?mode=practice&topic=${encodeURIComponent(r.skillTag ?? r.category)}`,
      priority: 70 + Math.min(15, r.count),
    });
  }
  for (const { l } of states.filter((x) => x.s === "needs_review").slice(0, 2)) {
    recs.push({
      kind: "review",
      title: `Review: ${l.title}`,
      reason: `Skor di bawah ${MASTERY_THRESHOLD}% — selesai belum berarti dikuasai.`,
      href: `/learn/${l.id}`,
      priority: 65,
    });
  }
  if (input.dueVocab > 0) {
    recs.push({
      kind: "vocab",
      title: `Review ${input.dueVocab} kosakata`,
      reason: "Jadwal spaced repetition hari ini.",
      href: "/learn/vocabulary",
      priority: 60,
    });
  }
  for (const t of input.lowReadingTypes.slice(0, 1)) {
    recs.push({
      kind: "practice",
      title: `Latihan Reading: ${t}`,
      reason: "Akurasi tipe soal ini masih rendah.",
      href: "/practice/reading",
      priority: 55,
    });
  }
  const p = input.profile;
  if (p.writing !== null && p.writing !== undefined && p.writing < input.targetBand - 0.5) {
    recs.push({
      kind: "practice",
      title: "Writing Task 2 + revisi",
      reason: `Estimasi Writing ${p.writing} masih jauh dari target ${input.targetBand}.`,
      href: "/practice/writing",
      priority: 58,
    });
  }
  // One entry per destination, keeping the highest-priority reason.
  const seen = new Set<string>();
  return recs.sort((a, b) => b.priority - a.priority).filter((r) => (seen.has(r.href) ? false : (seen.add(r.href), true)));
}

export type Readiness = "insufficient_data" | "foundation" | "improving" | "near_target" | "target_met";
export const READINESS_LABEL: Record<Readiness, string> = {
  insufficient_data: "Insufficient Data",
  foundation: "Foundation Building",
  improving: "Improving",
  near_target: "Near Target",
  target_met: "Practice Target Met",
};

/** history: recent estimated bands per IELTS skill, newest first. */
export function readiness(history: Partial<Record<(typeof IELTS_SKILLS)[number], number[]>>, target: number): Readiness {
  const recent: number[] = [];
  for (const s of IELTS_SKILLS) {
    const h = history[s];
    if (!h || h.length === 0) return "insufficient_data";
    const last = h.slice(0, 3);
    recent.push(last.reduce((a, b) => a + b, 0) / last.length);
  }
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const enoughEvidence = IELTS_SKILLS.every((s) => (history[s]?.length ?? 0) >= 2);
  if (avg >= target && enoughEvidence && Math.min(...recent) >= target - 0.5) return "target_met";
  if (avg >= target - 0.5) return "near_target";
  if (avg >= target - 1.5) return "improving";
  return "foundation";
}

/** Mastery of a skill from accuracy history (0..100), recency-weighted. */
export function masteryFrom(accuracies: number[]): number | null {
  if (accuracies.length === 0) return null;
  let wsum = 0;
  let sum = 0;
  accuracies.slice(0, 10).forEach((a, i) => {
    const w = Math.pow(0.8, i);
    wsum += w;
    sum += a * w;
  });
  return Math.round((sum / wsum) * 10) / 10;
}
