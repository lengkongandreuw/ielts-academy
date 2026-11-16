// All learner data lives in this one object, persisted in the browser (IndexedDB).
import type { SnapshotQuestion } from "./scoring";
import type { Recommendation, Allocation, Readiness } from "./adaptive";

export type Profile = {
  fullName: string;
  targetBand: number;
  examType: "academic" | "general";
  currentLevel: string;
  studyHoursPerDay: number;
  preferredTime: string;
  targetExamDate: string | null;
  priorExperience: string;
  priorScore: number | null;
  audioRetentionDays: number;
  createdAt: string;
  onboardedAt: string | null;
};

export type SkillProfile = {
  grammar: number | null;
  vocabulary: number | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  startLevel: string | null;
};

export type Snapshot = { skill: string; value: number; source: string; sourceId?: string; at: string };

export type Checked = { correct: boolean; attempts: number };
export type LessonProgress = {
  status: "in_progress" | "completed" | "needs_review";
  currentBlock: number;
  answers: Record<string, string | number>;
  checked: Record<string, Checked>;
  notes: string;
  score: number | null;
  timeSpentSec: number;
  lessonVersion: number;
  startedAt: string;
  completedAt: string | null;
};

export type PassageSnap = { id: string; title: string; body: string };
export type ListeningSnap = { id: string; title: string; section: number; file: string; durationSec: number | null; transcript: string };

export type AssessmentResult = {
  objective: import("./scoring").ObjectiveResult;
  sections: Record<"grammar" | "vocabulary" | "reading" | "listening", { correct: number; total: number; accuracy: number } | null>;
  bands: { reading: number | null; listening: number | null };
  notAssessed: string[];
  startLevel: string | null;
  note: string;
};

export type AssessmentSession = {
  id: string;
  kind: "diagnostic" | "practice" | "mini" | "mock" | "challenge";
  section: "all" | "reading" | "listening";
  mode: "learning" | "exam";
  refId: string | null;
  status: "in_progress" | "submitted";
  questions: SnapshotQuestion[]; // frozen copy: later content edits never change old results
  passages: PassageSnap[];
  listening: ListeningSnap[];
  notAssessed: string[];
  timeLimitSec: number | null;
  startedAt: string;
  submittedAt: string | null;
  answers: Record<string, string | number>;
  flagged: string[];
  result: AssessmentResult | null;
};

export type WritingStatus = "draft" | "evaluating" | "evaluated" | "failed" | "self_reviewed";
export type WritingSubmission = {
  id: string;
  promptId: string;
  prompt: { taskType: string; title: string; prompt: string; imageData?: string | null; imageAlt?: string; minWords: number; timeLimitMin: number; version: number };
  rootId: string | null;
  revision: number;
  text: string;
  wordCount: number;
  timeSpentSec: number;
  context: string; // practice | diagnostic | mock:<id> | lesson
  status: WritingStatus;
  evaluation: unknown | null;
  selfCheck: Record<string, boolean> | null;
  confidence: "normal" | "low" | null;
  error: string | null;
  createdAt: string;
  submittedAt: string | null;
};

export type SpeakingRecording = {
  id: string;
  promptId: string;
  prompt: { part: number; topic: string; prompt: string; bullets: string[] };
  hasAudio: boolean;
  mimeType: string | null;
  durationSec: number | null;
  transcript: string;
  context: string;
  status: "saved" | "evaluating" | "evaluated" | "failed";
  feedback: unknown | null;
  selfCheck: Record<string, boolean> | null;
  error: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export type ErrorRecord = {
  id: string; // signature
  lessonId: string | null;
  sourceType: "lesson" | "assessment" | "writing" | "speaking" | "vocab" | "challenge";
  sourceId: string | null;
  skill: string;
  questionId: string | null;
  userAnswer: string;
  expected: string;
  category: string;
  skillTag: string | null;
  explanation: string;
  reviewStatus: "open" | "reviewing" | "resolved";
  recurrenceCount: number;
  correctStreak: number;
  createdAt: string;
  lastSeenAt: string;
};

export type UserVocab = { word: string; step: number; reps: number; lapses: number; dueAt: string; lastReviewedAt: string | null; mastered: boolean; addedAt: string };

export type StudyPlan = { version: number; trigger: string; allocation: Allocation; items: Recommendation[]; readiness: Readiness; at: string };

export type TutorMessage = { role: "user" | "assistant"; content: string; at: string };
export type TutorConversation = { id: string; title: string; mode: string; lessonId: string | null; messages: TutorMessage[]; updatedAt: string };

export type MockRecord = { id: string; sessionId: string; writingId: string | null; speakingId: string | null; status: "in_progress" | "submitted"; startedAt: string; submittedAt: string | null };

export type GameState = {
  xp: number;
  badges: Record<string, string>; // badge id → unlocked at
  challenges: Record<string, string>; // date → session id
  log: { at: string; xp: number; reason: string }[];
};

export type Settings = {
  apiKey: string; // never exported
  model: string;
  theme: "system" | "light" | "dark";
  sound: boolean;
};

export type AppState = {
  version: 1;
  profile: Profile | null;
  skill: SkillProfile;
  snapshots: Snapshot[];
  lessons: Record<string, LessonProgress>;
  sessions: Record<string, AssessmentSession>;
  writings: Record<string, WritingSubmission>;
  recordings: Record<string, SpeakingRecording>;
  errors: Record<string, ErrorRecord>;
  vocab: Record<string, UserVocab>;
  plans: StudyPlan[];
  tutor: Record<string, TutorConversation>;
  activity: Record<string, { minutes: number; items: number }>;
  mocks: Record<string, MockRecord>;
  game: GameState;
  settings: Settings;
};

export const emptyState = (): AppState => ({
  version: 1,
  profile: null,
  skill: { grammar: null, vocabulary: null, listening: null, reading: null, writing: null, speaking: null, startLevel: null },
  snapshots: [],
  lessons: {},
  sessions: {},
  writings: {},
  recordings: {},
  errors: {},
  vocab: {},
  plans: [],
  tutor: {},
  activity: {},
  mocks: {},
  game: { xp: 0, badges: {}, challenges: {}, log: [] },
  settings: { apiKey: "", model: "claude-opus-5-5", theme: "dark", sound: true },
});
