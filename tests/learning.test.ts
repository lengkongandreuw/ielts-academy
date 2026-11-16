import { describe, expect, it } from "vitest";
import { current, isDraft, produce } from "immer";
import { allocateTime, lessonState, readiness } from "../src/lib/adaptive";
import { nextReview } from "../src/lib/srs";
import { levelFor, newBadges } from "../src/lib/game";
import { emptyState, type AppState } from "../src/lib/types";
import * as E from "../src/lib/engine";
import { LESSONS, PASSAGE_LIST } from "../src/lib/content";

const onboarded = (): AppState =>
  produce(emptyState(), (s) => {
    s.profile = { fullName: "Putra", targetBand: 7, examType: "academic", currentLevel: "unknown", studyHoursPerDay: 2, preferredTime: "evening", targetExamDate: null, priorExperience: "none", priorScore: null, audioRetentionDays: 30, createdAt: "2026-01-01T00:00:00Z", onboardedAt: "2026-01-01T00:00:00Z" };
  });
const run = <T,>(s: AppState, fn: (d: AppState) => T): [AppState, T] => {
  let out!: T;
  const next = produce(s, (d) => {
    const r = fn(d);
    out = (isDraft(r) ? current(r) : r) as T;
  });
  return [next, out];
};

describe("curriculum", () => {
  it("has 112 lessons with unique ids and a linear prerequisite chain", () => {
    expect(LESSONS).toHaveLength(112);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(112);
    LESSONS.slice(1).forEach((l, i) => expect(l.prerequisites).toEqual([LESSONS[i].id]));
  });
  it("every MCQ answer points to an existing option", () => {
    for (const l of LESSONS) for (const e of l.exercises) if (e.type === "mcq") expect(e.options[e.answer as number], `${e.id}`).toBeDefined();
    for (const p of PASSAGE_LIST) for (const q of p.questions) if (q.type === "mcq" || q.type === "matching") expect(q.options[q.answer as number], q.id).toBeDefined();
  });
  it("reading evidence quotes appear in the passage", () => {
    for (const p of PASSAGE_LIST) for (const q of p.questions) if (q.evidence) expect(p.body.toLowerCase(), q.id).toContain(q.evidence.toLowerCase());
  });
});

describe("lesson states", () => {
  const meta = { id: "B", dayIndex: 2, skill: "grammar", cefr: "A2", prerequisites: ["A"], title: "" };
  it("locks until prerequisites are done", () => {
    expect(lessonState(meta, {})).toBe("locked");
    expect(lessonState(meta, { A: { status: "completed", score: 90 } })).toBe("available");
  });
  it("opens lower-level foundation lessons for stronger learners", () => {
    expect(lessonState(meta, {}, "B1")).toBe("available");
  });
  it("completion below mastery threshold means needs_review", () => {
    expect(lessonState(meta, { B: { status: "completed", score: 50 } })).toBe("needs_review");
  });
});

describe("engine: lessons & errors", () => {
  it("first lesson requires the diagnostic before completion", () => {
    const s = onboarded();
    expect(() => run(s, (d) => E.completeLesson(d, "W01D01"))).toThrow(/Diagnostic/);
  });
  it("checks exercises, logs errors, and measures mastery on first attempts", () => {
    let s = onboarded();
    [s] = run(s, (d) => {
      d.lessons.W01D01 = { status: "completed", currentBlock: 0, answers: {}, checked: {}, notes: "", score: null, timeSpentSec: 0, lessonVersion: 1, startedAt: "", completedAt: "x" };
    });
    const lesson = LESSONS[1];
    let wrongId = "";
    for (const [i, e] of lesson.exercises.entries()) {
      const right = e.type === "mcq" ? (e.answer as number) : (e.answer as string[])[0];
      const wrong = e.type === "mcq" ? ((e.answer as number) + 1) % e.options.length : "zzz";
      const [n] = run(s, (d) => E.checkExercise(d, lesson.id, e.id, i === 0 ? wrong : right));
      s = n;
      if (i === 0) {
        wrongId = e.id;
        [s] = run(s, (d) => E.checkExercise(d, lesson.id, e.id, right)); // retry succeeds
      }
    }
    expect(Object.values(s.errors).some((x) => x.questionId === wrongId)).toBe(true);
    const [after, res] = run(s, (d) => E.completeLesson(d, lesson.id));
    const expected = Math.round(((lesson.exercises.length - 1) / lesson.exercises.length) * 1000) / 10;
    expect(res.score).toBe(expected);
    expect(after.game.xp).toBeGreaterThan(0);
    expect(after.skill.grammar).not.toBeNull();
  });
  it("marks recurring errors and resolves after 3 correct in a row", () => {
    let s = onboarded();
    const err = { lessonId: null, sourceType: "lesson" as const, sourceId: null, skill: "grammar", questionId: "q", userAnswer: "He go", expected: "He goes", category: "Grammar", skillTag: "present-simple", explanation: "" };
    [s] = run(s, (d) => { E.logError(d, err); E.logError(d, err); });
    expect(Object.values(s.errors)[0].recurrenceCount).toBe(2);
    expect(E.recurringErrors(s)).toHaveLength(1);
    [s] = run(s, (d) => { E.recordCorrectOnTag(d, "grammar", "present-simple"); E.recordCorrectOnTag(d, "grammar", "present-simple"); E.recordCorrectOnTag(d, "grammar", "present-simple"); });
    expect(Object.values(s.errors)[0].reviewStatus).toBe("resolved");
  });
});

describe("engine: assessments", () => {
  it("diagnostic marks listening Not Assessed without audio and sets a start level", () => {
    let s = onboarded();
    const [s1, id] = run(s, (d) => E.startSession(d, { kind: "diagnostic" }, []));
    s = s1;
    const sess = s.sessions[id];
    expect(sess.notAssessed).toContain("listening");
    [s] = run(s, (d) => { for (const q of sess.questions) E.setAnswer(d, id, q.id, q.answer as string | number); });
    const [s2, r] = run(s, (d) => E.submitSession(d, id));
    expect(r.objective.accuracy).toBe(100);
    expect(r.bands.reading).toBeNull(); // only 6 reading questions
    expect(s2.skill.startLevel).toBe("C1");
    expect(s2.skill.listening).toBeNull();
    // idempotent
    const [s3, r2] = run(s2, (d) => E.submitSession(d, id));
    expect(r2).toEqual(r);
    expect(s3.game.xp).toBe(s2.game.xp);
  });
  it("resumes an in-progress session instead of duplicating", () => {
    const [s, a] = run(onboarded(), (d) => E.startSession(d, { kind: "practice", section: "reading", refId: "sleep-and-memory" }));
    const [, b] = run(s, (d) => E.startSession(d, { kind: "practice", section: "reading", refId: "sleep-and-memory" }));
    expect(a).toBe(b);
  });
  it("daily challenge gives 5 questions and is stable for the day", () => {
    const s = onboarded();
    expect(E.challengeQuestions(s, "2026-11-16")).toHaveLength(5);
    expect(E.challengeQuestions(s, "2026-11-16").map((q) => q.id)).toEqual(E.challengeQuestions(s, "2026-11-16").map((q) => q.id));
  });
});

describe("adaptive", () => {
  it("allocates more time to weaker IELTS skills without dropping any", () => {
    const a = allocateTime({ listening: 6.5, reading: 6, writing: 5, speaking: 5.5, grammar: 80, vocabulary: 80 }, 7, 2);
    const m = Object.fromEntries(a.map((x) => [x.skill, x.minutes]));
    expect(m.writing).toBeGreaterThan(m.listening);
    expect(m.speaking).toBeGreaterThan(m.reading);
    expect(Math.min(...a.map((x) => x.minutes))).toBeGreaterThan(0);
  });
  it("readiness needs evidence for all four skills", () => {
    expect(readiness({ listening: [7], reading: [7], writing: [7] }, 7)).toBe("insufficient_data");
    expect(readiness({ listening: [7, 7], reading: [7, 7], writing: [7, 7], speaking: [7, 7] }, 7)).toBe("target_met");
    expect(readiness({ listening: [5], reading: [5], writing: [5], speaking: [5] }, 7)).toBe("foundation");
  });
});

describe("srs & game", () => {
  it("moves up the 1-3-7-14-30 ladder and resets on lapse", () => {
    const t0 = new Date("2026-01-01T00:00:00Z");
    const a = nextReview({ step: 0, reps: 0, lapses: 0, mastered: false }, "good", t0);
    expect(a.step).toBe(1);
    expect((+a.dueAt - +t0) / 864e5).toBe(3);
    const b = nextReview({ step: 3, reps: 4, lapses: 0, mastered: false }, "again", t0);
    expect(b.step).toBe(0);
    expect(b.lapses).toBe(1);
  });
  it("levels and badges", () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(299).level).toBe(2);
    expect(newBadges(onboarded(), 0)).toContain("first-step");
    expect(newBadges(onboarded(), 7)).toEqual(expect.arrayContaining(["streak-3", "streak-7"]));
  });
  it("streak tolerates today not done yet", () => {
    expect(E.computeStreak(["2026-11-14", "2026-11-15"], "2026-11-16")).toBe(2);
    expect(E.computeStreak(["2026-11-14", "2026-11-16"], "2026-11-16")).toBe(1);
  });
});

describe("writing analysis without AI", () => {
  it("flags short essays and missing overview", () => {
    const a = E.analyzeWriting("The graph shows data. It rises.", 150, "task1");
    expect(a.checks[0].ok).toBe(false);
    expect(a.checks.find((c) => c.text.includes("overview"))?.ok).toBe(false);
  });
});
