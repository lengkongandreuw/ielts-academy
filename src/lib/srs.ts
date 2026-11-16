// Simple spaced repetition: ladder 1 → 3 → 7 → 14 → 30 days.

export const LADDER_DAYS = [1, 3, 7, 14, 30];
export type Recall = "again" | "hard" | "good" | "easy";

export type SrsState = { step: number; reps: number; lapses: number; mastered: boolean };

export function nextReview(state: SrsState, recall: Recall, now = new Date()) {
  let step = state.step;
  let lapses = state.lapses;
  if (recall === "again") {
    step = 0;
    lapses++;
  } else if (recall === "hard") {
    step = Math.max(0, step); // stay on the same step
  } else if (recall === "good") {
    step = Math.min(LADDER_DAYS.length - 1, step + 1);
  } else {
    step = Math.min(LADDER_DAYS.length - 1, step + 2);
  }
  // "again" is reviewed again within the same session window (10 minutes).
  const ms = recall === "again" ? 10 * 60_000 : LADDER_DAYS[step] * 864e5;
  const mastered = step === LADDER_DAYS.length - 1 && recall !== "hard" && lapses <= 2;
  return {
    step,
    reps: state.reps + 1,
    lapses,
    mastered,
    dueAt: new Date(now.getTime() + ms),
  };
}
