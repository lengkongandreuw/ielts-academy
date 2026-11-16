// Light gamification: XP, levels, badges. Pure functions (unit-tested).
import type { AppState } from "./types";

export const XP = {
  exerciseFirstTry: 10,
  exerciseRetry: 4,
  lessonComplete: 50,
  lessonMastered: 25,
  assessmentSubmit: 30,
  assessmentCorrect: 2,
  writingSubmit: 40,
  speakingSubmit: 30,
  vocabReview: 3,
  challenge: 40,
  diagnostic: 100,
};

const TITLES = ["Starter", "Explorer", "Learner", "Achiever", "Scholar", "Strategist", "Expert", "Band Hunter", "Master", "IELTS Legend"];

/** Level n needs 100·n·(n−1)/2 XP in total (100, 300, 600, 1000 …). */
export function levelFor(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, title: TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))], into: xp - cur, need: next - cur, progress: (xp - cur) / (next - cur) };
}
export const xpForLevel = (n: number) => (100 * n * (n - 1)) / 2;

export type Badge = { id: string; name: string; desc: string; icon: string; test: (s: AppState, streak: number) => boolean };

const completedLessons = (s: AppState) => Object.values(s.lessons).filter((l) => l.status === "completed" || l.status === "needs_review");
const weekDone = (s: AppState, w: number) => Array.from({ length: 7 }, (_, d) => `W${String(w).padStart(2, "0")}D${String(d + 1).padStart(2, "0")}`).every((id) => ["completed", "needs_review"].includes(s.lessons[id]?.status ?? ""));

export const BADGES: Badge[] = [
  { id: "first-step", name: "Langkah Pertama", desc: "Menyelesaikan profil belajar", icon: "🚀", test: (s) => !!s.profile?.onboardedAt },
  { id: "diagnostic", name: "Kenali Diri", desc: "Menyelesaikan Diagnostic Test", icon: "🧭", test: (s) => Object.values(s.sessions).some((x) => x.kind === "diagnostic" && x.status === "submitted") },
  { id: "first-lesson", name: "Hari Pertama", desc: "Menyelesaikan lesson pertama", icon: "📘", test: (s) => completedLessons(s).length >= 1 },
  { id: "perfect", name: "Sempurna", desc: "Skor 100% di sebuah lesson", icon: "💯", test: (s) => Object.values(s.lessons).some((l) => l.score === 100) },
  { id: "streak-3", name: "Mulai Konsisten", desc: "Belajar 3 hari berturut-turut", icon: "🔥", test: (_s, st) => st >= 3 },
  { id: "streak-7", name: "Seminggu Penuh", desc: "Belajar 7 hari berturut-turut", icon: "🔥", test: (_s, st) => st >= 7 },
  { id: "streak-30", name: "Kebiasaan Juara", desc: "Belajar 30 hari berturut-turut", icon: "🏆", test: (_s, st) => st >= 30 },
  { id: "week-1", name: "Minggu 1 Tuntas", desc: "Menyelesaikan semua lesson Week 1", icon: "✅", test: (s) => weekDone(s, 1) },
  { id: "phase-1", name: "Fondasi Kuat", desc: "Menyelesaikan Phase 1 (Week 1–4)", icon: "🧱", test: (s) => [1, 2, 3, 4].every((w) => weekDone(s, w)) },
  { id: "phase-2", name: "Paham Format IELTS", desc: "Menyelesaikan Phase 2 (Week 5–8)", icon: "🎯", test: (s) => [5, 6, 7, 8].every((w) => weekDone(s, w)) },
  { id: "first-essay", name: "Penulis Pemula", desc: "Mengirim esai pertama", icon: "✍️", test: (s) => Object.values(s.writings).some((w) => w.status !== "draft") },
  { id: "rewrite", name: "Tulis Ulang", desc: "Merevisi esai setelah feedback", icon: "🔁", test: (s) => Object.values(s.writings).some((w) => w.revision > 1 && w.status !== "draft") },
  { id: "first-speaking", name: "Berani Bicara", desc: "Merekam jawaban speaking pertama", icon: "🎤", test: (s) => Object.keys(s.recordings).length > 0 },
  { id: "first-mock", name: "Simulasi Ujian", desc: "Menyelesaikan mock test pertama", icon: "⏱️", test: (s) => Object.values(s.sessions).some((x) => (x.kind === "mock" || x.kind === "mini") && x.status === "submitted") },
  { id: "vocab-25", name: "Kolektor Kata", desc: "25 review kosakata", icon: "🗂️", test: (s) => Object.values(s.vocab).reduce((a, v) => a + v.reps, 0) >= 25 },
  { id: "vocab-master", name: "Kata Dikuasai", desc: "10 kosakata mastered", icon: "🧠", test: (s) => Object.values(s.vocab).filter((v) => v.mastered).length >= 10 },
  { id: "fixer", name: "Pemburu Kesalahan", desc: "5 kesalahan berstatus resolved", icon: "🛠️", test: (s) => Object.values(s.errors).filter((e) => e.reviewStatus === "resolved").length >= 5 },
  { id: "challenger", name: "Penantang Harian", desc: "Menyelesaikan 5 tantangan harian", icon: "⚡", test: (s) => Object.keys(s.game.challenges).filter((d) => s.sessions[s.game.challenges[d]]?.status === "submitted").length >= 5 },
  { id: "xp-1000", name: "1000 XP", desc: "Mengumpulkan 1000 XP", icon: "⭐", test: (s) => s.game.xp >= 1000 },
];

/** Returns ids of badges newly earned in this state. */
export function newBadges(s: AppState, streak: number): string[] {
  return BADGES.filter((b) => !s.game.badges[b.id] && b.test(s, streak)).map((b) => b.id);
}
