// Content format shared by seed data, JSON import and the admin CMS.
// All content in /content is original material written for IELTS Academy.

/** [prompt, options, answer, explanation]. answer = option index, or string[] of accepted answers when options is empty. */
export type Ex = [string, string[], number | string[], string];

export type Topic = {
  tag: string;
  title: string;
  skill: "grammar" | "vocabulary" | "reading" | "listening" | "writing" | "speaking" | "exam";
  cefr: string;
  minutes: number;
  objectives: string[];
  explain: string; // Indonesian theory (paragraphs separated by blank line)
  structure?: [string, string][];
  examples: [string, string][]; // [English, Indonesian note]
  mistakes?: [string, string, string][]; // [wrong, right, why]
  tip?: string;
  exercises: Ex[];
  /** Links the lesson to a practice activity. */
  task?: { kind: "reading" | "writing" | "speaking" | "listening" | "mock" | "diagnostic" | "vocab"; ref?: string; body: string };
  vocab?: string[]; // vocabulary words introduced
};

export type LessonBlock =
  | { type: "theory"; title: string; body: string }
  | { type: "structure"; rows: [string, string][] }
  | { type: "examples"; items: { en: string; note: string }[] }
  | { type: "mistakes"; items: { wrong: string; right: string; why: string }[] }
  | { type: "tip"; body: string }
  | { type: "practice"; title: string; guided: boolean; exerciseIds: string[] }
  | { type: "task"; kind: string; ref?: string; body: string }
  | { type: "vocab"; words: string[] }
  | { type: "summary"; points: string[] };

export type Exercise = {
  id: string;
  type: "mcq" | "completion";
  prompt: string;
  options: string[];
  answer: number | string[];
  explanation: string;
  hint?: string;
  skillTag: string;
  category: string;
};
