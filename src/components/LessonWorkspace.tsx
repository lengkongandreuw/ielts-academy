"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LessonBlock } from "../../content/types";
import { useAction, useApp } from "@/lib/store";
import { checkExercise, completeLesson, lessonStates, revealExercise, saveLessonProgress } from "@/lib/engine";
import { LESSON_BY_ID, LESSON_META, PHASES, VOCAB_BY_WORD, WEEKS } from "@/lib/content";
import { Badge, Button, Card, Confetti, Empty, LinkButton, Notice, Progress, Rich, cx, inputCls } from "./ui";
import { TutorPanel } from "./TutorPanel";

type Ex = { id: string; type: "mcq" | "completion"; prompt: string; options: string[]; category: string; result: { correct: boolean; attempts: number; explanation?: string; answerText?: string } | null };
type Vocab = { word: string; meaning: string; pos: string; example: string; collocations: string[] };

const BLOCK_LABEL: Record<string, string> = { theory: "Learn", structure: "Structure", examples: "Examples", mistakes: "Common Mistakes", tip: "Tip", practice: "Practice", task: "IELTS Task", vocab: "Vocabulary", summary: "Summary" };

function taskHref(kind: string, ref?: string) {
  switch (kind) {
    case "reading": return "/practice/reading";
    case "writing": return `/practice/writing/${ref ? `?type=${ref}` : ""}`;
    case "speaking": return `/practice/speaking/${ref ? `?part=${ref}` : ""}`;
    case "listening": return "/practice/listening";
    case "mock": return "/practice/mock";
    case "diagnostic": return "/diagnostic";
    case "vocab": return "/learn/vocabulary";
    case "errors": return "/progress/errors";
    default: return "/practice/reading";
  }
}

export function LessonView({ id }: { id: string }) {
  const { state } = useApp();
  const lesson = LESSON_BY_ID.get(id)!;
  const st = lessonStates(state)[id];
  if (st === "locked")
    return (
      <Empty title="Lesson ini masih terkunci 🔒" action={<LinkButton href="/learn">Kembali ke peta</LinkButton>}>
        Selesaikan lesson sebelumnya terlebih dahulu. Kurikulum disusun bertahap agar Anda tidak kewalahan.
      </Empty>
    );
  return <LessonWorkspace key={id} id={id} lessonState={st} vocab={vocabFor(lesson.blocks)} />;
}

function vocabFor(blocks: LessonBlock[]): Vocab[] {
  const vb = blocks.find((b) => b.type === "vocab") as { words: string[] } | undefined;
  return (vb?.words ?? []).map((w) => VOCAB_BY_WORD.get(w)).filter(Boolean).map((v) => ({ word: v!.word, meaning: v!.meaning, pos: v!.partOfSpeech, example: v!.example, collocations: v!.collocations }));
}

function LessonWorkspace({ id, lessonState: lstate, vocab }: { id: string; lessonState: string; vocab: Vocab[] }) {
  const { state, update } = useApp();
  const act = useAction();
  const L = LESSON_BY_ID.get(id)!;
  const week = WEEKS.find((w) => w.number === L.week)!;
  const lesson = { ...L, phase: PHASES.find((p) => p.id === week.phaseId)!.title };
  const blocks = L.blocks;
  const prog = state.lessons[id];
  const idx = LESSON_META.findIndex((m) => m.id === id);
  const data = { prev: idx > 0 ? LESSON_META[idx - 1].id : null, next: idx < LESSON_META.length - 1 ? LESSON_META[idx + 1].id : null, state: lstate };
  const [step, setStep] = useState(Math.min(prog?.currentBlock ?? 0, blocks.length - 1));
  const [answers, setAnswers] = useState<Record<string, string | number>>(prog?.answers ?? {});
  const [hints, setHints] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState(prog?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const busy: string | null = null;
  const [done, setDone] = useState<{ status: string; score: number | null; next: { title: string; href: string; reason: string } | null } | null>(null);
  const [showTutor, setShowTutor] = useState(false);
  const lastTick = useRef(Date.now());
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exs: Ex[] = L.exercises.map((e) => {
    const c = prog?.checked[e.id];
    const revealed = c && (c.correct || c.attempts >= 2);
    return { id: e.id, type: e.type, prompt: e.prompt, options: e.options, category: e.category, result: c ? { correct: c.correct, attempts: c.attempts, ...(revealed ? revealExercise(e) : {}) } : null };
  });

  // Study-time tracking while the tab is visible.
  useEffect(() => {
    const tick = () => {
      const sec = Math.min(120, Math.round((Date.now() - lastTick.current) / 1000));
      lastTick.current = Date.now();
      if (sec > 5) act((s) => saveLessonProgress(s, id, { addSeconds: sec }));
    };
    const iv = setInterval(() => document.visibilityState === "visible" ? tick() : (lastTick.current = Date.now()), 60_000);
    const onHide = () => document.visibilityState === "hidden" && tick();
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onHide); tick(); };
  }, [id, act]);

  const go = (i: number) => {
    const n = Math.max(0, Math.min(blocks.length - 1, i));
    setStep(n);
    act((s) => saveLessonProgress(s, id, { currentBlock: n }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function check(ex: Ex) {
    const a = answers[ex.id];
    if (a === undefined || a === "") return setHints((h) => ({ ...h, [ex.id]: "Pilih atau tulis jawaban terlebih dahulu." }));
    const r = act((s) => checkExercise(s, id, ex.id, a));
    if (r) setHints((h) => ({ ...h, [ex.id]: r.revealed ? "" : "Belum tepat. Baca lagi penjelasan di atas dan coba sekali lagi." }));
  }

  function complete() {
    setError(null);
    try {
      setDone(update((s) => completeLesson(s, id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyelesaikan lesson.");
    }
  }

  const checkedCount = exs.filter((e) => e.result).length;
  const total = exs.length;
  const block = blocks[step];
  const isLast = step === blocks.length - 1;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link href="/learn" className="hover:text-fg">
            Roadmap
          </Link>
          <span>/</span>
          <span>
            Week {lesson.week} · Day {lesson.dayIndex}
          </span>
          <Badge tone="primary">{lesson.phase}</Badge>
          {data.state === "needs_review" && <Badge tone="warning">Needs Review</Badge>}
          {data.state === "completed" && <Badge tone="success">Completed</Badge>}
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{lesson.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span>⏱ ±{lesson.estimatedMinutes} menit</span>
          <span>
            Latihan {checkedCount}/{total}
          </span>
          <span>💾 Tersimpan otomatis</span>
        </div>
        <Progress value={((step + 1) / blocks.length) * 100} className="mt-3" label="Progres lesson" />
      </div>

      {error && <Notice tone="danger" className="mb-4">{error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-4">
          {step === 0 && (
            <Card>
              <p className="text-sm font-semibold">Learning objectives</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {lesson.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card key={step} className="fade-in">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              {step + 1}. {BLOCK_LABEL[block.type]}
            </p>
            <BlockView block={block} exs={exs} answers={answers} hints={hints} busy={busy} vocab={vocab}
              onAnswer={(qid, v) => {
                setAnswers((a) => ({ ...a, [qid]: v }));
                act((s) => saveLessonProgress(s, id, { answer: [qid, v] }));
              }}
              onCheck={check}
            />
          </Card>

          <Confetti show={done?.status === "completed"} />
          {done && (
            <Notice tone={done.status === "completed" ? "success" : "warning"}>
              {done.status === "completed" ? (
                <>
                  <strong>Lesson selesai!</strong> Skor percobaan pertama: {done.score ?? "–"}%.
                </>
              ) : (
                <>
                  <strong>Lesson ditandai Needs Review.</strong> Skor percobaan pertama {done.score}% (di bawah 70%). Selesai belum berarti dikuasai — ulangi materi atau minta latihan tambahan ke AI Tutor.
                </>
              )}
              {done.next && (
                <span className="mt-2 block">
                  Berikutnya:{" "}
                  <Link href={done.next.href} className="font-medium text-primary underline">
                    {done.next.title}
                  </Link>{" "}
                  — {done.next.reason}
                </span>
              )}
            </Notice>
          )}

          {/* Navigation — sticky on mobile */}
          <div className="sticky bottom-16 z-10 -mx-4 flex items-center justify-between gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <Button variant="secondary" onClick={() => go(step - 1)} disabled={step === 0}>
              ← Previous
            </Button>
            {isLast ? (
              <Button onClick={complete} disabled={busy === "complete"}>
                {busy === "complete" ? "Menyimpan…" : data.state === "completed" || data.state === "needs_review" ? "Simpan ulang hasil" : "Complete Lesson"}
              </Button>
            ) : (
              <Button onClick={() => go(step + 1)}>Next →</Button>
            )}
          </div>
          <div className="flex justify-between text-sm">
            {data.prev ? <Link href={`/learn/${data.prev}`} className="text-muted hover:text-fg">« Lesson sebelumnya</Link> : <span />}
            {data.next && (data.state === "completed" || data.state === "needs_review") ? <Link href={`/learn/${data.next}`} className="text-muted hover:text-fg">Lesson berikutnya »</Link> : <span />}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-4">
            <p className="mb-2 text-sm font-semibold">Lesson outline</p>
            <ol className="space-y-0.5">
              {blocks.map((b, i) => {
                const ids = b.type === "practice" ? b.exerciseIds : [];
                const left = ids.filter((id) => !exs.find((e) => e.id === id)?.result).length;
                return (
                  <li key={i}>
                    <button onClick={() => go(i)} aria-current={i === step ? "step" : undefined} className={cx("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm", i === step ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2")}>
                      <span>
                        {i + 1}. {b.type === "practice" ? b.title : BLOCK_LABEL[b.type]}
                      </span>
                      {b.type === "practice" && <span className="text-xs">{left === 0 ? "✓" : `${left} sisa`}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>
          {vocab.length > 0 && (
            <Card className="p-4">
              <p className="mb-2 text-sm font-semibold">Related vocabulary</p>
              <ul className="space-y-1 text-sm">
                {vocab.slice(0, 6).map((v) => (
                  <li key={v.word}>
                    <span className="font-medium">{v.word}</span> <span className="text-muted">— {v.meaning}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-4">
            <label htmlFor="notes" className="mb-2 block text-sm font-semibold">
              Personal notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => {
                const v = e.target.value;
                setNotes(v);
                if (notesTimer.current) clearTimeout(notesTimer.current);
                notesTimer.current = setTimeout(() => act((s) => saveLessonProgress(s, id, { notes: v })), 500);
              }}
              rows={5}
              placeholder="Catatan Anda tersimpan otomatis…"
              className={cx(inputCls, "h-auto py-2")}
            />
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold">AI Tutor</p>
            <p className="mt-1 text-xs text-muted">Bingung dengan materi ini? Tutor memakai konteks lesson aktif.</p>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setShowTutor((s) => !s)}>
              {showTutor ? "Tutup tutor" : "Tanya tutor"}
            </Button>
          </Card>
        </aside>
      </div>
      {showTutor && <TutorPanel lessonId={lesson.id} onClose={() => setShowTutor(false)} />}
    </div>
  );
}

function BlockView({ block, exs, answers, hints, busy, vocab, onAnswer, onCheck }: {
  block: LessonBlock; exs: Ex[]; answers: Record<string, string | number>; hints: Record<string, string>; busy: string | null; vocab: Vocab[];
  onAnswer: (id: string, v: string | number) => void; onCheck: (ex: Ex) => void;
}) {
  switch (block.type) {
    case "theory":
      return (
        <>
          <h2 className="mb-3 text-lg font-semibold">{block.title}</h2>
          <Rich text={block.body} />
        </>
      );
    case "structure":
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {block.rows.map(([a, b]) => (
                <tr key={a} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left align-top font-medium">{a}</th>
                  <td className="py-2 font-mono text-[13px]">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "examples":
      return (
        <ul className="space-y-3">
          {block.items.map((x) => (
            <li key={x.en} className="rounded-lg bg-surface-2 p-3">
              <p className="font-medium">{x.en}</p>
              <p className="text-sm text-muted">{x.note}</p>
            </li>
          ))}
        </ul>
      );
    case "mistakes":
      return (
        <ul className="space-y-3">
          {block.items.map((m) => (
            <li key={m.wrong} className="rounded-lg border border-line p-3 text-sm">
              <p><span className="font-medium text-danger">✗ {m.wrong}</span></p>
              <p><span className="font-medium text-success">✓ {m.right}</span></p>
              <p className="mt-1 text-muted">{m.why}</p>
            </li>
          ))}
        </ul>
      );
    case "tip":
      return <Notice tone="primary"><Rich text={block.body} /></Notice>;
    case "vocab":
      return (
        <div>
          <p className="mb-3 text-sm text-muted">Kata-kata ini akan masuk ke bank kosakata pribadi Anda setelah lesson selesai.</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {vocab.map((v) => (
              <li key={v.word} className="rounded-lg bg-surface-2 p-3 text-sm">
                <p><span className="font-semibold">{v.word}</span> <span className="text-xs text-muted">({v.pos})</span></p>
                <p className="text-muted">{v.meaning}</p>
                <p className="mt-1 italic">{v.example}</p>
                {v.collocations.length > 0 && <p className="mt-1 text-xs text-muted">Collocations: {v.collocations.join(", ")}</p>}
              </li>
            ))}
          </ul>
        </div>
      );
    case "task":
      return (
        <div className="space-y-3">
          <p>{block.body}</p>
          <LinkButton href={taskHref(block.kind, block.ref)} variant="secondary">Buka aktivitas →</LinkButton>
        </div>
      );
    case "summary":
      return (
        <ul className="list-disc space-y-1 pl-5">
          {block.points.map((p) => <li key={p}>{p}</li>)}
        </ul>
      );
    case "practice": {
      const items = block.exerciseIds.map((id) => exs.find((e) => e.id === id)).filter(Boolean) as Ex[];
      return (
        <div className="space-y-5">
          <p className="text-sm text-muted">{block.guided ? "Latihan terbimbing: jika salah, Anda mendapat petunjuk dan satu kesempatan lagi." : "Latihan mandiri: kerjakan tanpa bantuan, lalu cek jawaban."}</p>
          {items.map((ex, n) => (
            <ExerciseItem key={ex.id} n={n + 1} ex={ex} value={answers[ex.id]} hint={hints[ex.id]} busy={busy === ex.id} onAnswer={(v) => onAnswer(ex.id, v)} onCheck={() => onCheck(ex)} />
          ))}
        </div>
      );
    }
  }
}

const CHEER = ["Hebat!", "Mantap!", "Keren!", "Tepat sekali!", "Luar biasa!"];

function ExerciseItem({ n, ex, value, hint, busy, onAnswer, onCheck }: { n: number; ex: Ex; value: string | number | undefined; hint?: string; busy: boolean; onAnswer: (v: string | number) => void; onCheck: () => void }) {
  const r = ex.result;
  const locked = !!r && (r.correct || r.attempts >= 2);
  const name = `ex-${ex.id}`;
  const picked = (i: number) => value !== undefined && value !== "" && Number(value) === i;
  const stateOf = (i: number) => (!r || !picked(i) ? undefined : r.correct ? "correct" : "wrong");
  return (
    <fieldset className="neu rounded-3xl p-5 sm:p-6">
      <legend className="sr-only">Soal {n}</legend>
      <p className="mb-4 flex gap-3 text-lg font-bold leading-snug">
        <span className="neu-inset grid size-8 shrink-0 place-items-center rounded-xl text-sm text-primary">{n}</span>
        <span>{ex.prompt}</span>
      </p>
      {ex.type === "mcq" ? (
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
          {ex.options.map((o, i) => (
            <label key={`${i}-${r?.attempts ?? 0}`} data-selected={picked(i)} data-state={stateOf(i)}
              className={cx("choice flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold", locked && "pointer-events-none")}>
              <input type="radio" name={name} className="sr-only" checked={picked(i)} onChange={() => onAnswer(i)} disabled={locked} />
              <span className={cx("grid size-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold", picked(i) ? "btn-brand text-white" : "neu-inset text-muted")}>{String.fromCharCode(65 + i)}</span>
              {o}
            </label>
          ))}
        </div>
      ) : (
        <input aria-label={`Jawaban soal ${n}`} className={cx(inputCls, r && !r.correct && !locked && "shake")} value={value ?? ""} onChange={(e) => onAnswer(e.target.value)} disabled={locked} onKeyDown={(e) => e.key === "Enter" && !locked && onCheck()} placeholder="Ketik jawabanmu di sini…" />
      )}
      {!locked && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={onCheck} disabled={busy || value === undefined || value === ""}>
            {busy ? "Mengecek…" : r ? "Coba lagi" : "Check Answer"}
          </Button>
          {hint && <p key={r?.attempts} className="fade-in text-sm font-semibold text-amber">💪 {hint}</p>}
        </div>
      )}
      {locked && r && (
        <div className={cx("pop mt-4 rounded-2xl p-4 text-sm ring-1", r.correct ? "bg-success/10 ring-success/35" : "bg-danger/10 ring-danger/35")} role="status">
          <p className="text-base font-extrabold">{r.correct ? `🎉 ${CHEER[n % CHEER.length]} ${r.attempts > 1 ? "Benar di percobaan kedua." : ""}` : "Belum tepat — tidak apa-apa, kita belajar dari sini."}</p>
          {!r.correct && <p className="mt-1">Jawaban benar: <strong className="text-success">{r.answerText}</strong></p>}
          {r.explanation && <p className="mt-1 text-muted">{r.explanation}</p>}
        </div>
      )}
    </fieldset>
  );
}
