"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useApp } from "@/lib/store";
import { setAnswer as setAns, submitSession, toggleFlag as toggleF } from "@/lib/engine";
import { audioUrl } from "@/lib/content";
import type { AssessmentSession } from "@/lib/types";
import { Badge, Button, Card, Notice, OFFICIAL_NOTE, cx, inputCls } from "./ui";
import { AudioPlayer } from "./AudioPlayer";

type Q = AssessmentSession["questions"][number];

const TYPE_LABEL: Record<string, string> = { mcq: "Multiple Choice", tfng: "True/False/Not Given", ynng: "Yes/No/Not Given", completion: "Completion", matching: "Matching", short: "Short Answer" };
const SECTION_LABEL: Record<string, string> = { grammar: "Grammar", vocabulary: "Vocabulary", reading: "Reading", listening: "Listening" };

type HL = { p: number; s: number; e: number };

export function AssessmentRunner({ id, backHref, backLabel, onSubmitted }: { id: string; backHref: string; backLabel: string; onSubmitted?: () => void }) {
  const { state } = useApp();
  const act = useAction();
  const s = state.sessions[id];
  const submitted = s.status === "submitted";
  const qs = s.questions;
  const answers = s.answers;
  const flagged = new Set(s.flagged);
  const [idx, setIdx] = useState(0);
  const [mobileTab, setMobileTab] = useState<"passage" | "questions">(s.passages.length || s.listening.length ? "passage" : "questions");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hl, setHl] = useState<HL[]>([]);
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const LS = `ia-test-${s.id}`;

  const exam = s.mode === "exam";
  const deadline = s.timeLimitSec ? +new Date(s.startedAt) + s.timeLimitSec * 1000 : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (submitted) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [submitted]);

  const setAnswer = (qid: string, v: string | number) => !submitted && act((d) => setAns(d, id, qid, v));
  const toggleFlag = (qid: string) => act((d) => toggleF(d, id, qid));

  const doSubmit = useCallback(() => {
    setBusy(true);
    setError(null);
    const r = act((d) => submitSession(d, id));
    setBusy(false);
    setConfirm(false);
    if (r) {
      window.scrollTo({ top: 0 });
      onSubmitted?.();
    } else setError("Gagal mengirim jawaban.");
  }, [act, id, onSubmitted]);

  const remaining = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (!submitted && remaining === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      doSubmit();
    }
  }, [remaining, submitted, doSubmit]);

  const answeredCount = qs.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const itemResult = useMemo(() => Object.fromEntries((s.result?.objective.items ?? []).map((i) => [i.id, i.correct])), [s.result]);
  const anyMedia = s.passages.length > 0 || s.listening.length > 0;

  // Group passage text by question → which passage it belongs to (for multi-passage tests).
  const passageOf = (qid: string) => qs.find((q) => q.id === qid)?.group ?? undefined;
  const currentQ = qs[idx];
  const activePassage = currentQ ? s.passages.find((p) => p.id === passageOf(currentQ.id)) ?? null : null;
  const visiblePassages = activePassage ? [activePassage] : currentQ?.section === "reading" ? s.passages : [];
  const activeListening = currentQ?.section === "listening" ? s.listening.find((l) => l.id === currentQ.group) ?? s.listening[0] : null;
  // Only split the screen when the current question actually has a passage or audio.
  const hasPassage = anyMedia && (visiblePassages.length > 0 || !!activeListening);
  const evidence = evidenceFor ? qs.find((q) => q.id === evidenceFor)?.evidence ?? null : null;

  function addHighlight() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const para = (range.startContainer.parentElement as HTMLElement | null)?.closest("[data-para]") as HTMLElement | null;
    if (!para || !para.contains(range.endContainer)) return;
    const pre = document.createRange();
    pre.selectNodeContents(para);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end = start + range.toString().length;
    setHl((h) => [...h, { p: Number(para.dataset.para), s: start, e: end }]);
    sel.removeAllRanges();
  }

  const Timer = () =>
    remaining !== null ? (
      <span className={cx("rounded-md px-2 py-1 font-mono text-sm tabular-nums", remaining < 300 ? "bg-danger-soft text-danger" : "bg-surface-2")} aria-live={remaining < 60 ? "assertive" : "off"} aria-label="Sisa waktu">
        ⏱ {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
      </span>
    ) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 bg-bg/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="text-sm text-muted hover:text-fg">← {backLabel}</Link>
          <Badge tone={exam ? "warning" : "primary"}>{exam ? "Exam mode" : "Learning mode"}</Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {!submitted && <span className="text-muted">{answeredCount}/{qs.length} dijawab</span>}
          {!submitted && <Timer />}
          {!submitted && <Button size="sm" onClick={() => setConfirm(true)}>Submit</Button>}
        </div>
      </header>

      {error && <Notice tone="danger" className="m-4">{error}</Notice>}
      {s.notAssessed.includes("listening") && s.kind !== "practice" && (
        <Notice tone="neutral" className="mx-4 mt-4">Listening: <strong>Content Unavailable</strong> — audio belum diunggah, sehingga bagian ini <strong>Not Assessed</strong> dan tidak diberi skor.</Notice>
      )}

      {submitted && s.result && <ResultSummary s={s} />}

      {qs.length === 0 ? (
        <div className="p-8"><Notice tone="warning">Tes ini tidak memiliki soal yang tersedia.</Notice></div>
      ) : (
        <>
          {hasPassage && (
            <div className="flex border-b border-line md:hidden" role="tablist">
              {(["passage", "questions"] as const).map((t) => (
                <button key={t} role="tab" aria-selected={mobileTab === t} onClick={() => setMobileTab(t)} className={cx("flex-1 py-2.5 text-sm", mobileTab === t ? "border-b-2 border-primary font-medium text-primary" : "text-muted")}>
                  {t === "passage" ? "Passage / Audio" : "Questions"}
                </button>
              ))}
            </div>
          )}
          <div className={cx("grid flex-1", hasPassage && "md:grid-cols-2")}>
            {hasPassage && (
              <section aria-label="Passage" className={cx("min-w-0 border-line p-4 md:sticky md:top-[52px] md:h-[calc(100dvh-52px)] md:overflow-y-auto md:border-r md:p-6", mobileTab !== "passage" && "hidden md:block")}>
                {activeListening && (
                  <div className="mb-6">
                    <p className="mb-2 text-sm font-semibold">Listening Part {activeListening.section}: {activeListening.title}</p>
                    <AudioPlayer src={audioUrl(activeListening.file)} storageKey={`${LS}-audio-${activeListening.id}`} exam={exam && !submitted} durationHint={activeListening.durationSec} />
                    {submitted && activeListening.transcript && (
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-primary">Tampilkan transcript</summary>
                        <p className="mt-2 whitespace-pre-wrap text-muted">{activeListening.transcript}</p>
                      </details>
                    )}
                  </div>
                )}
                {visiblePassages.map((p) => (
                  <article key={p.id}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold">{p.title}</h2>
                      {!submitted && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="secondary" onClick={addHighlight} title="Pilih teks lalu klik untuk menandai">🖍 Highlight</Button>
                          {hl.length > 0 && <Button size="sm" variant="ghost" onClick={() => setHl([])}>Hapus</Button>}
                        </div>
                      )}
                    </div>
                    <div ref={passageRef} className="space-y-3 leading-7">
                      {p.body.split(/\n\n+/).map((para, i) => (
                        <p key={i} data-para={i}>{renderPara(para, hl.filter((h) => h.p === i), evidence)}</p>
                      ))}
                    </div>
                  </article>
                ))}
                {visiblePassages.length === 0 && !activeListening && <p className="text-sm text-muted">Soal ini tidak memakai passage.</p>}
              </section>
            )}

            <section aria-label="Questions" className={cx("min-w-0 p-4 md:p-6", hasPassage && mobileTab !== "questions" && "hidden md:block")}>
              {/* Question navigation */}
              <nav aria-label="Navigasi soal" className="mb-4 flex flex-wrap gap-1.5">
                {qs.map((q, i) => {
                  const a = answers[q.id] !== undefined && answers[q.id] !== "";
                  const r = itemResult[q.id];
                  return (
                    <button key={q.id} onClick={() => setIdx(i)} aria-label={`Soal ${i + 1}${a ? ", dijawab" : ""}${flagged.has(q.id) ? ", ditandai" : ""}`} aria-current={i === idx}
                      className={cx("relative size-10 rounded-xl text-sm font-bold tabular-nums transition-all",
                        i === idx && "ring-2 ring-primary",
                        submitted ? (r === true ? "bg-success-soft text-success" : r === false ? "bg-danger-soft text-danger" : "bg-surface-2 text-muted") : a ? "btn-brand text-white" : "neu-sm text-fg/80")}>
                      {i + 1}
                      {flagged.has(q.id) && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warning" />}
                    </button>
                  );
                })}
              </nav>

              {currentQ && (
                <QuestionCard key={currentQ.id} n={idx + 1} q={currentQ} value={answers[currentQ.id]} submitted={submitted} correct={itemResult[currentQ.id]} flagged={flagged.has(currentQ.id)}
                  onFlag={() => toggleFlag(currentQ.id)} onAnswer={(v) => setAnswer(currentQ.id, v)} onEvidence={() => { setEvidenceFor(currentQ.id); setMobileTab("passage"); }} />
              )}
              <div className="mt-4 flex justify-between">
                <Button variant="secondary" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>← Sebelumnya</Button>
                {idx < qs.length - 1 ? <Button variant="secondary" onClick={() => setIdx((i) => i + 1)}>Berikutnya →</Button> : !submitted ? <Button onClick={() => setConfirm(true)}>Submit</Button> : <span />}
              </div>
            </section>
          </div>
        </>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <Card className="w-full max-w-sm">
            <p id="confirm-title" className="font-semibold">Kirim jawaban?</p>
            <p className="mt-2 text-sm text-muted">{answeredCount}/{qs.length} soal dijawab{flagged.size ? `, ${flagged.size} ditandai untuk dicek ulang` : ""}. Setelah dikirim, jawaban tidak bisa diubah.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)} autoFocus>Kembali</Button>
              <Button onClick={doSubmit} disabled={busy}>{busy ? "Mengirim…" : "Ya, kirim"}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function renderPara(text: string, hls: HL[], evidence: string | null) {
  // Build marks from user highlights + evidence span.
  const marks: { s: number; e: number; cls: string }[] = hls.map((h) => ({ s: h.s, e: h.e, cls: "hl" }));
  if (evidence) {
    const at = text.toLowerCase().indexOf(evidence.toLowerCase());
    if (at >= 0) marks.push({ s: at, e: at + evidence.length, cls: "evidence" });
  }
  if (marks.length === 0) return text;
  const bounds = Array.from(new Set([0, text.length, ...marks.flatMap((m) => [m.s, m.e])])).filter((b) => b >= 0 && b <= text.length).sort((a, b) => a - b);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i], b = bounds[i + 1];
    const m = marks.filter((x) => x.s <= a && x.e >= b);
    const seg = text.slice(a, b);
    out.push(m.length ? <mark key={i} className={m.some((x) => x.cls === "evidence") ? "evidence" : "hl"}>{seg}</mark> : seg);
  }
  return out;
}

function QuestionCard({ n, q, value, submitted, correct, flagged, onFlag, onAnswer, onEvidence }: {
  n: number; q: Q; value: string | number | undefined; submitted: boolean; correct: boolean | null | undefined; flagged: boolean;
  onFlag: () => void; onAnswer: (v: string | number) => void; onEvidence: () => void;
}) {
  const labels = q.type === "tfng" ? ["TRUE", "FALSE", "NOT GIVEN"] : q.type === "ynng" ? ["YES", "NO", "NOT GIVEN"] : null;
  const name = `q-${q.id}`;
  const correctText = submitted ? (q.type === "mcq" || q.type === "matching" ? q.options[Number(q.answer)] : Array.isArray(q.answer) ? (q.answer as string[]).join(" / ") : String(q.answer)) : "";
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge>{SECTION_LABEL[q.section] ?? q.section}</Badge>
          <Badge>{TYPE_LABEL[q.type] ?? q.type}</Badge>
        </div>
        {!submitted && (
          <button onClick={onFlag} aria-pressed={flagged} className={cx("rounded-md px-2 py-1 text-xs", flagged ? "bg-warning-soft text-warning" : "text-muted hover:bg-surface-2")}>
            {flagged ? "★ Ditandai" : "☆ Tandai"}
          </button>
        )}
      </div>
      <fieldset>
        <legend className="mb-3 font-medium"><span className="text-muted">{n}.</span> {q.prompt}</legend>
        {labels ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {labels.map((l) => (
              <label key={l} data-selected={value === l} className={cx("choice flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-4 py-3 text-sm font-extrabold tracking-wide", submitted && "pointer-events-none")}>
                <input type="radio" name={name} className="sr-only" checked={value === l} onChange={() => onAnswer(l)} disabled={submitted} />
                {l}
              </label>
            ))}
          </div>
        ) : q.type === "mcq" || q.type === "matching" ? (
          <div className="grid gap-3">
            {q.options.map((o, i) => {
              const sel = value !== undefined && value !== "" && Number(value) === i;
              return (
                <label key={i} data-selected={sel} className={cx("choice flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold", submitted && "pointer-events-none")}>
                  <input type="radio" name={name} checked={sel} onChange={() => onAnswer(i)} disabled={submitted} className="sr-only" />
                  <span className={cx("grid size-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold", sel ? "btn-brand text-white" : "neu-inset text-muted")}>{String.fromCharCode(65 + i)}</span>
                  {o}
                </label>
              );
            })}
          </div>
        ) : (
          <input aria-label={`Jawaban soal ${n}`} className={inputCls} value={value ?? ""} onChange={(e) => onAnswer(e.target.value)} disabled={submitted} placeholder="Ketik jawabanmu di sini…" maxLength={120} />
        )}
      </fieldset>
      {submitted && (
        <div className="mt-4 space-y-2 rounded-lg bg-surface-2 p-3 text-sm">
          <p>
            {correct === true ? <Badge tone="success">✓ Benar</Badge> : correct === false ? <Badge tone="danger">✗ Salah</Badge> : <Badge>Tidak dijawab</Badge>}{" "}
            {correct !== true && <span>Jawaban benar: <strong>{correctText}</strong></span>}
          </p>
          {q.explanation && <p className="text-muted">{q.explanation}</p>}
          {q.evidence && <button onClick={onEvidence} className="text-primary underline">Tunjukkan bukti di teks</button>}
        </div>
      )}
    </Card>
  );
}

function ResultSummary({ s }: { s: AssessmentSession }) {
  const r = s.result!;
  const o = r.objective;
  return (
    <div className="border-b border-line bg-surface p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-primary">Hasil</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-4">
          <div><p className="text-xs text-muted">Skor mentah</p><p className="text-2xl font-semibold tabular-nums">{o.correct}/{o.total}</p><p className="text-xs text-muted">{o.accuracy}% · {o.unanswered} kosong</p></div>
          {Object.entries(r.sections).filter(([, v]) => v).map(([k, v]) => (
            <div key={k}><p className="text-xs text-muted">{SECTION_LABEL[k]}</p><p className="text-2xl font-semibold tabular-nums">{v!.accuracy}%</p><p className="text-xs text-muted">{v!.correct}/{v!.total} benar</p></div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(["reading", "listening"] as const).map((k) =>
            r.sections[k] ? (
              <Badge key={k} tone={r.bands[k] !== null ? "primary" : "neutral"}>
                {SECTION_LABEL[k]} band: {r.bands[k] !== null ? r.bands[k]!.toFixed(1) : "belum bisa diestimasi (soal < 10)"}
              </Badge>
            ) : null,
          )}
          {r.notAssessed.map((k) => <Badge key={k}>{SECTION_LABEL[k] ?? k}: Not Assessed</Badge>)}
          {r.startLevel && <Badge tone="success">Level awal: {r.startLevel}</Badge>}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {Object.entries(o.byType).map(([t, v]) => <span key={t}>{TYPE_LABEL[t] ?? t}: {v.correct}/{v.total}</span>)}
        </div>
        <p className="mt-3 text-xs text-muted">{OFFICIAL_NOTE} Klik nomor soal untuk melihat pembahasan. Kesalahan otomatis masuk ke Error Log.</p>
      </div>
    </div>
  );
}
