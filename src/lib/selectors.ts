// Derived views of AppState for dashboard & analytics. Pure.
import type { AppState } from "./types";
import { computePlan, lessonStates, streakOf, todayKey } from "./engine";
import { LESSONS, LESSON_META } from "./content";
import { overallBand } from "./scoring";

export function lastNDays(n: number) {
  const out: string[] = [];
  const t = new Date(todayKey() + "T00:00:00Z");
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(t);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export const assessmentTitle = (kind: string, section: string) =>
  ({ diagnostic: "Diagnostic Test", mock: "Full Mock Test", mini: "Mini Test", challenge: "Daily Challenge" })[kind] ?? `${section === "reading" ? "Reading" : "Listening"} Practice`;

export const writingStatusLabel = (s: string) =>
  ({ draft: "Draft", evaluating: "Sedang dievaluasi AI", evaluated: "Dievaluasi AI", failed: "Evaluasi gagal", self_reviewed: "Review mandiri" })[s] ?? s;

export function currentLesson(s: AppState) {
  const st = lessonStates(s);
  const m = LESSON_META.find((l) => st[l.id] === "in_progress") ?? LESSON_META.find((l) => st[l.id] === "available");
  return m ? { ...m, state: st[m.id] } : null;
}

export function dashboard(s: AppState) {
  const plan = computePlan(s);
  const st = lessonStates(s);
  const completed = Object.values(st).filter((x) => x === "completed" || x === "needs_review").length;
  const current = currentLesson(s);
  const week = current ? Math.ceil(current.dayIndex / 7) : 16;
  const phase = week <= 4 ? "English Foundation" : week <= 8 ? "IELTS Skills" : week <= 12 ? "Band Improvement" : "Exam Preparation";
  const today = s.activity[todayKey()] ?? { minutes: 0, items: 0 };
  const sk = s.skill;
  const recent = [
    ...Object.entries(s.lessons).map(([id, p]) => {
      const l = LESSONS.find((x) => x.id === id);
      return { kind: "Lesson", title: `Day ${l?.dayIndex}: ${l?.title}`, at: p.completedAt ?? p.startedAt, href: `/learn/${id}`, meta: p.status === "completed" ? `Selesai · ${p.score ?? "–"}%` : p.status === "needs_review" ? `Perlu review · ${p.score}%` : "Sedang berjalan" };
    }),
    ...Object.values(s.sessions).filter((x) => x.status === "submitted").map((x) => ({ kind: "Tes", title: assessmentTitle(x.kind, x.section), at: x.submittedAt!, href: `/test/?id=${x.id}`, meta: `${x.result?.objective.accuracy ?? 0}% benar` })),
    ...Object.values(s.writings).filter((w) => w.status !== "draft").map((w) => ({ kind: "Writing", title: w.prompt.title, at: w.submittedAt ?? w.createdAt, href: `/practice/writing/edit/?id=${w.id}`, meta: writingStatusLabel(w.status) })),
    ...Object.values(s.recordings).map((r) => ({ kind: "Speaking", title: `Part ${r.prompt.part}: ${r.prompt.topic}`, at: r.createdAt, href: `/practice/speaking/?r=${r.id}`, meta: r.status === "evaluated" ? "Feedback AI" : "Tersimpan" })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8);
  return {
    target: s.profile?.targetBand ?? 7,
    estimates: { listening: sk.listening, reading: sk.reading, writing: sk.writing, speaking: sk.speaking },
    mastery: { grammar: sk.grammar, vocabulary: sk.vocabulary },
    overall: overallBand(sk),
    readiness: plan.readiness,
    hasDiagnostic: Object.values(s.sessions).some((x) => x.kind === "diagnostic" && x.status === "submitted"),
    current,
    curriculum: { completed, total: LESSONS.length, week, phase },
    today: { ...today, goalMinutes: Math.round((s.profile?.studyHoursPerDay ?? 1) * 60) },
    allocation: plan.allocation,
    recommendations: plan.items.slice(0, 6),
    streak: streakOf(s),
    last7: lastNDays(7).map((d) => ({ date: d, minutes: Math.round(s.activity[d]?.minutes ?? 0) })),
    weaknesses: Object.values(s.errors).filter((e) => e.reviewStatus !== "resolved").sort((a, b) => b.recurrenceCount - a.recurrenceCount || +new Date(b.lastSeenAt) - +new Date(a.lastSeenAt)).slice(0, 5),
    recent,
    challengeDone: !!s.game.challenges[todayKey()] && s.sessions[s.game.challenges[todayKey()]]?.status === "submitted",
  };
}

export function progress(s: AppState) {
  const series: Record<string, { at: string; value: number }[]> = {};
  for (const x of s.snapshots) (series[x.skill] ??= []).push({ at: x.at, value: x.value });
  const byType: Record<string, { correct: number; total: number }> = {};
  for (const x of Object.values(s.sessions)) {
    if (!x.result) continue;
    for (const [k, v] of Object.entries(x.result.objective.byType)) {
      byType[k] ??= { correct: 0, total: 0 };
      byType[k].correct += v.correct;
      byType[k].total += v.total;
    }
  }
  const days = lastNDays(56);
  const weekly = Array.from({ length: 8 }, (_, w) => {
    const slice = days.slice(w * 7, w * 7 + 7);
    return { label: slice[0].slice(5), minutes: Math.round(slice.reduce((a, d) => a + (s.activity[d]?.minutes ?? 0), 0)) };
  });
  const vocab = Object.values(s.vocab);
  const vocabStats = { total: vocab.length, mastered: vocab.filter((v) => v.mastered).length, learning: vocab.filter((v) => !v.mastered && v.reps > 0).length, fresh: vocab.filter((v) => v.reps === 0).length };
  const errCats: Record<string, { open: number; resolved: number; occurrences: number }> = {};
  for (const e of Object.values(s.errors)) {
    errCats[e.category] ??= { open: 0, resolved: 0, occurrences: 0 };
    errCats[e.category][e.reviewStatus === "resolved" ? "resolved" : "open"]++;
    errCats[e.category].occurrences += e.recurrenceCount;
  }
  const mocks = Object.values(s.mocks)
    .filter((m) => m.status === "submitted")
    .map((m) => ({ ...mockScores(s, m.id), at: m.submittedAt!, id: m.id }))
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const minis = Object.values(s.sessions).filter((x) => x.kind === "mini" && x.status === "submitted").map((x) => ({ id: x.id, at: x.submittedAt!, accuracy: x.result!.objective.accuracy, reading: x.result!.bands.reading }));
  return { series, byType, weekly, vocabStats, errCats, mocks, minis, plans: s.plans };
}

/** Component estimates for a full mock. Overall only when all four have evidence. */
export function mockScores(s: AppState, mockId: string) {
  const m = s.mocks[mockId];
  const sess = m ? s.sessions[m.sessionId] : undefined;
  const w = m?.writingId ? s.writings[m.writingId] : undefined;
  const r = m?.speakingId ? s.recordings[m.speakingId] : undefined;
  const writing = w?.status === "evaluated" && w.confidence === "normal" ? ((w.evaluation as { overall?: number | null })?.overall ?? null) : null;
  // Speaking needs audio-based pronunciation scoring, which this app cannot do → never a full speaking band.
  const speaking: number | null = null;
  const speakingPartial = r?.status === "evaluated" ? ((r.feedback as { partialBand?: number | null })?.partialBand ?? null) : null;
  const listening = sess?.result?.bands.listening ?? null;
  const reading = sess?.result?.bands.reading ?? null;
  return { listening, reading, writing, speaking, speakingPartial, overall: overallBand({ listening, reading, writing, speaking }) };
}
