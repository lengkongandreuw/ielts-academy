import { describe, expect, it } from "vitest";
import { countWords, isCorrect, levelFromDiagnostic, overallBand, rawToBand, roundIeltsBand, scoreObjective, DEFAULT_READING_TABLE, type SnapshotQuestion } from "../src/lib/scoring";

const q = (id: string, type: SnapshotQuestion["type"], answer: unknown, options: string[] = []): SnapshotQuestion => ({ id, version: 1, section: "reading", type, prompt: "", options, answer, explanation: "", skillTag: "t", cefr: "B1", difficulty: 2 });

describe("isCorrect", () => {
  it("scores mcq by index", () => {
    expect(isCorrect(q("a", "mcq", 1), 1)).toBe(true);
    expect(isCorrect(q("a", "mcq", 1), "1")).toBe(true);
    expect(isCorrect(q("a", "mcq", 1), 0)).toBe(false);
  });
  it("treats empty as unanswered", () => {
    expect(isCorrect(q("a", "mcq", 1), "")).toBeNull();
    expect(isCorrect(q("a", "completion", ["x"]), undefined)).toBeNull();
  });
  it("scores T/F/NG case-insensitively", () => {
    expect(isCorrect(q("a", "tfng", "NOT GIVEN"), "not given")).toBe(true);
    expect(isCorrect(q("a", "tfng", "FALSE"), "TRUE")).toBe(false);
  });
  it("normalises completion answers and accepts alternatives", () => {
    const c = q("a", "completion", ["twenty", "20"]);
    expect(isCorrect(c, " Twenty ")).toBe(true);
    expect(isCorrect(c, "20")).toBe(true);
    expect(isCorrect(c, "twelve")).toBe(false);
    // Hyphen vs space is not treated as a mistake.
    expect(isCorrect(q("a", "completion", ["air-filled tyres"]), "Air filled tyres")).toBe(true);
  });
});

describe("scoreObjective", () => {
  it("counts correct / incorrect / unanswered and groups by type", () => {
    const qs = [q("1", "mcq", 0), q("2", "tfng", "TRUE"), q("3", "completion", ["cost"])];
    const r = scoreObjective(qs, { "1": 0, "2": "FALSE" });
    expect(r).toMatchObject({ total: 3, correct: 1, incorrect: 1, unanswered: 1 });
    expect(r.byType.tfng).toEqual({ correct: 0, total: 1 });
    expect(r.accuracy).toBeCloseTo(33.3);
  });
});

describe("bands", () => {
  it("refuses a band for tests shorter than 10 questions", () => {
    expect(rawToBand(6, 6, DEFAULT_READING_TABLE)).toBeNull();
  });
  it("scales raw scores to 40 questions", () => {
    expect(rawToBand(40, 40, DEFAULT_READING_TABLE)).toBe(9);
    expect(rawToBand(30, 40, DEFAULT_READING_TABLE)).toBe(7);
    expect(rawToBand(9, 12, DEFAULT_READING_TABLE)).toBe(7); // 9/12 → 30/40
  });
  it("applies IELTS overall rounding", () => {
    expect(roundIeltsBand(6.125)).toBe(6);
    expect(roundIeltsBand(6.25)).toBe(6.5);
    expect(roundIeltsBand(6.625)).toBe(6.5);
    expect(roundIeltsBand(6.75)).toBe(7);
  });
  it("gives no overall unless all four skills are assessed", () => {
    expect(overallBand({ listening: 7, reading: 6.5, writing: 6, speaking: null })).toBeNull();
    expect(overallBand({ listening: 7, reading: 6.5, writing: 6, speaking: 6 })).toBe(6.5);
  });
});

describe("misc", () => {
  it("counts words", () => {
    expect(countWords("It's a well-known fact, isn't it?")).toBe(6);
    expect(countWords("   ")).toBe(0);
  });
  it("derives a start level from per-level accuracy", () => {
    expect(levelFromDiagnostic({ A1: { correct: 4, total: 4 }, A2: { correct: 3, total: 4 }, B1: { correct: 1, total: 4 } })).toBe("A2");
    expect(levelFromDiagnostic({ A1: { correct: 1, total: 4 } })).toBe("A1");
  });
});
