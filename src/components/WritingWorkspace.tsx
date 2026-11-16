"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAction, useApp } from "@/lib/store";
import { analyzeWriting, reviseWriting, saveWriting, submitWriting, writingChain } from "@/lib/engine";
import { aiReady, type WritingEvaluation } from "@/lib/ai";
import { countWords } from "@/lib/scoring";
import { RUBRICS } from "@/lib/content";
import { MODEL_ANSWERS } from "../../content/model-answers";
import { Badge, Button, Card, Empty, LinkButton, Notice, OFFICIAL_NOTE, cx } from "./ui";

const CRIT: Record<string, string> = { TR: "Task Achievement / Response", CC: "Coherence & Cohesion", LR: "Lexical Resource", GRA: "Grammatical Range & Accuracy" };

export function WritingWorkspace({ id }: { id: string }) {
  const { state } = useApp();
  const act = useAction();
  const router = useRouter();
  const w = state.writings[id];
  const [text, setText] = useState(w?.text ?? "");
  const [confirm, setConfirm] = useState(false);
  const [compare, setCompare] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const draft = w?.status === "draft";
  const mock = w?.context.startsWith("mock:") ? state.mocks[w.context.slice(5)] : undefined;
  const hideFeedback = !!mock && mock.status !== "submitted";
  const ready = aiReady(state.settings);

  // Timer & time tracking while drafting.
  useEffect(() => {
    if (!draft) return;
    const iv = setInterval(() => {
      setNow(Date.now());
      if (Date.now() - tick.current > 30_000 && document.visibilityState === "visible") {
        const sec = Math.round((Date.now() - tick.current) / 1000);
        tick.current = Date.now();
        act((s) => saveWriting(s, id, s.writings[id].text, sec));
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [draft, id, act]);

  if (!w) return <Empty title="Esai tidak ditemukan" action={<LinkButton href="/practice/writing">Kembali</LinkButton>}>Esai ini mungkin dibuat di perangkat lain.</Empty>;

  const onChange = (v: string) => {
    setText(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => act((s) => saveWriting(s, id, v)), 600);
  };
  const elapsed = w.timeSpentSec + (draft ? Math.round((now - tick.current) / 1000) : 0);
  const remaining = w.prompt.timeLimitMin * 60 - elapsed;
  const words = draft ? countWords(text) : w.wordCount;
  const chain = writingChain(state, id);
  const model = MODEL_ANSWERS[w.promptId];
  const ev = w.status === "evaluated" ? (w.evaluation as WritingEvaluation) : null;

  function submit(withAi: boolean) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    act((s) => {
      saveWriting(s, id, text, Math.round((Date.now() - tick.current) / 1000));
      submitWriting(s, id, withAi);
    });
    setConfirm(false);
    window.scrollTo({ top: 0 });
  }
  function revise() {
    const nid = act((s) => reviseWriting(s, id));
    if (nid) router.push(`/practice/writing/edit/?id=${nid}`);
  }

  return (
    <div className="fade-in space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Link href={mock ? `/practice/mock/run/?id=${mock.id}` : "/practice/writing"} className="hover:text-fg">← {mock ? "Mock Test" : "Writing"}</Link>
        <Badge tone="primary">{w.prompt.taskType === "task1" ? "Task 1" : w.prompt.taskType === "task2" ? "Task 2" : "Paragraph"}</Badge>
        {w.revision > 1 && <Badge>Revisi {w.revision}</Badge>}
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{w.prompt.title}</h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Soal</p>
          <p className="whitespace-pre-line text-sm leading-6">{w.prompt.prompt}</p>
          {w.prompt.imageData && <div className="mt-4 rounded-lg bg-surface-2 p-3 text-fg" dangerouslySetInnerHTML={{ __html: w.prompt.imageData }} />}
        </Card>

        <div className="space-y-4">
          {draft ? (
            <Card>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className={cx("tabular-nums", words < w.prompt.minWords ? "text-warning" : "text-success")}>{words} / {w.prompt.minWords} kata</span>
                <span className={cx("rounded-md px-2 py-0.5 font-mono tabular-nums", remaining < 0 ? "bg-danger-soft text-danger" : remaining < 300 ? "bg-warning-soft text-warning" : "bg-surface-2")} aria-label="Sisa waktu">
                  ⏱ {remaining < 0 ? "+" : ""}{String(Math.floor(Math.abs(remaining) / 60)).padStart(2, "0")}:{String(Math.abs(remaining) % 60).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted">💾 Autosave</span>
              </div>
              <label htmlFor="essay" className="sr-only">Esai Anda</label>
              <textarea id="essay" value={text} onChange={(e) => onChange(e.target.value)} rows={18} spellCheck={false}
                className="w-full resize-y rounded-lg border border-line bg-surface p-3 text-[15px] leading-7 focus:border-primary focus:outline-none" placeholder="Mulai menulis di sini… Pisahkan paragraf dengan baris kosong." />
              <p className="mt-1 text-xs text-muted">Spell-check browser dimatikan, seperti di ujian.{remaining < 0 && " Waktu habis — di ujian asli Anda harus berhenti menulis."}</p>
              <div className="mt-3 flex justify-end"><Button onClick={() => setConfirm(true)} disabled={words < 20}>Submit</Button></div>
            </Card>
          ) : (
            <Card>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Esai Anda · {w.wordCount} kata · {Math.round(w.timeSpentSec / 60)} menit</p>
              <Annotated text={w.text} corrections={!hideFeedback && ev ? ev.corrections : []} />
            </Card>
          )}

          {hideFeedback && !draft && <Notice tone="neutral">Feedback disembunyikan sampai seluruh mock test selesai, seperti ujian sungguhan.</Notice>}

          {!hideFeedback && w.status === "evaluating" && <Notice tone="primary"><span className="animate-pulse">⏳ AI sedang mengevaluasi esai Anda (±1 menit)… Anda boleh membuka halaman lain; evaluasi berlanjut saat halaman ini dibuka lagi.</span></Notice>}
          {!hideFeedback && w.status === "failed" && (
            <Notice tone="danger">
              {w.error} <span className="mt-2 flex gap-2">
                {ready && <Button size="sm" onClick={() => act((s) => submitWriting(s, id, true))}>Coba lagi</Button>}
                <Button size="sm" variant="secondary" onClick={() => act((s) => submitWriting(s, id, false))}>Review mandiri</Button>
              </span>
            </Notice>
          )}
          {!hideFeedback && ev && <AiFeedback ev={ev} low={w.confidence === "low"} />}
          {!hideFeedback && w.status === "self_reviewed" && <SelfReview id={id} />}

          {!draft && !hideFeedback && (w.status === "evaluated" || w.status === "self_reviewed") && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Langkah berikutnya: tulis ulang 🔁</p>
                  <p className="text-sm text-muted">Revisi esai yang sama berdasarkan feedback. Versi sebelumnya tetap tersimpan.</p>
                </div>
                <div className="flex gap-2">
                  {chain.length > 1 && <Button variant="secondary" onClick={() => setCompare((c) => !c)}>{compare ? "Tutup" : "Bandingkan versi"}</Button>}
                  <Button onClick={revise}>Tulis ulang</Button>
                </div>
              </div>
              {chain.length > 1 && (
                <ol className="mt-4 flex flex-wrap gap-2 text-xs">
                  {chain.map((v) => (
                    <li key={v.id}>
                      <Link href={`/practice/writing/edit/?id=${v.id}`} className={cx("rounded-full px-3 py-1", v.id === id ? "bg-primary text-primary-fg" : "bg-surface-2")}>
                        v{v.revision} · {v.wordCount} kata{v.status === "evaluated" && (v.evaluation as WritingEvaluation).overall !== null ? ` · ${(v.evaluation as WritingEvaluation).overall}` : ""}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
              {compare && chain.length > 1 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[chain[0], chain[chain.length - 1]].map((v) => (
                    <div key={v.id} className="rounded-lg bg-surface-2 p-3">
                      <p className="mb-2 text-xs font-semibold text-muted">Versi {v.revision} · {v.wordCount} kata</p>
                      <p className="whitespace-pre-wrap text-sm leading-6">{v.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {!draft && !hideFeedback && model && (
            <details className="rounded-2xl bg-surface p-5 ring-1 ring-line">
              <summary className="cursor-pointer font-medium">📄 Contoh jawaban model</summary>
              <p className="mt-2 text-xs text-muted">{model.note} Ini salah satu cara menjawab yang baik — bukan satu-satunya jawaban benar.</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{model.text}</p>
            </details>
          )}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="wc-title">
          <Card className="w-full max-w-md">
            <p id="wc-title" className="font-semibold">Kirim esai?</p>
            <p className="mt-2 text-sm text-muted">{words} kata. Setelah dikirim, esai tidak bisa diubah — tapi Anda bisa membuat revisi.</p>
            {words < w.prompt.minWords && <Notice tone="warning" className="mt-3">Esai di bawah {w.prompt.minWords} kata. Di ujian, ini menurunkan skor Task Achievement/Response.</Notice>}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)} autoFocus>Kembali</Button>
              <Button variant={ready ? "secondary" : "primary"} onClick={() => submit(false)}>Kirim · review mandiri</Button>
              {ready && <Button onClick={() => submit(true)}>Kirim · evaluasi AI</Button>}
            </div>
            {!ready && <p className="mt-3 text-xs text-muted">Ingin estimasi band dari AI? Aktifkan dengan API key Anda di <Link href="/settings#ai" className="text-primary underline">Pengaturan</Link>.</p>}
          </Card>
        </div>
      )}
    </div>
  );
}

function Annotated({ text, corrections }: { text: string; corrections: { original: string; corrected: string; explanation: string }[] }) {
  if (!corrections.length) return <p className="whitespace-pre-wrap text-[15px] leading-7">{text}</p>;
  const marks: { s: number; e: number; c: (typeof corrections)[number] }[] = [];
  for (const c of corrections) {
    const at = text.indexOf(c.original);
    if (at >= 0 && !marks.some((m) => at < m.e && at + c.original.length > m.s)) marks.push({ s: at, e: at + c.original.length, c });
  }
  marks.sort((a, b) => a.s - b.s);
  const out: React.ReactNode[] = [];
  let pos = 0;
  marks.forEach((m, i) => {
    out.push(text.slice(pos, m.s));
    out.push(<mark key={i} className="rounded bg-danger-soft px-0.5 text-fg underline decoration-danger decoration-wavy underline-offset-4" title={`→ ${m.c.corrected}\n${m.c.explanation}`}>{text.slice(m.s, m.e)}</mark>);
    pos = m.e;
  });
  out.push(text.slice(pos));
  return <p className="whitespace-pre-wrap text-[15px] leading-7">{out}</p>;
}

function AiFeedback({ ev, low }: { ev: WritingEvaluation; low: boolean }) {
  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Evaluasi AI</p>
          <p className="text-3xl font-semibold tabular-nums">{ev.overall !== null ? ev.overall.toFixed(1) : "—"}</p>
          <p className="text-xs text-muted">{ev.isBandTask ? "Estimasi band tugas" : "Latihan paragraf — tidak dikonversi ke band IELTS"}</p>
        </div>
        <Badge>{ev.evaluator.replace("ai:", "")} · {ev.rubricVersion}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted">{OFFICIAL_NOTE}</p>
      {low && <Notice tone="warning" className="mt-3">Confidence rendah: tulisan terlalu pendek, bukan tugas IELTS penuh, atau tidak sesuai soal. Estimasi ini tidak dipakai untuk profil Writing Anda.</Notice>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ev.criteria.map((c) => (
          <div key={c.key} className="rounded-lg bg-surface-2 p-3">
            <div className="flex justify-between text-sm"><span className="font-medium">{CRIT[c.key]}</span><span className="tabular-nums font-semibold">{c.band.toFixed(1)}</span></div>
            <p className="mt-1 text-xs text-muted">{c.comment}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm">{ev.summary}</p>
      {ev.priorityMistakes.length > 0 && (
        <div className="mt-4"><p className="text-sm font-semibold">🎯 Prioritas perbaikan</p><ul className="mt-1 list-disc pl-5 text-sm">{ev.priorityMistakes.map((m) => <li key={m}>{m}</li>)}</ul></div>
      )}
      {ev.corrections.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold">✏️ Koreksi ({ev.corrections.length})</p>
          <ul className="mt-2 space-y-2">
            {ev.corrections.map((c, i) => (
              <li key={i} className="rounded-lg border border-line p-3 text-sm">
                <Badge tone="neutral">{c.category}</Badge>
                <p className="mt-1"><span className="text-danger line-through">{c.original}</span> → <span className="font-medium text-success">{c.corrected}</span></p>
                <p className="text-muted">{c.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {ev.vocabulary.length > 0 && (
        <div className="mt-4"><p className="text-sm font-semibold">📚 Saran kosakata</p><ul className="mt-1 space-y-1 text-sm">{ev.vocabulary.map((v, i) => <li key={i}><span className="text-muted">{v.original}</span> → <strong>{v.suggestion}</strong> — {v.reason}</li>)}</ul></div>
      )}
      <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
        <div><p className="font-semibold">Analisis tugas</p><p className="text-muted">{ev.taskAnalysis}</p></div>
        <div><p className="font-semibold">Coherence</p><p className="text-muted">{ev.coherenceFeedback}</p></div>
      </div>
      {ev.improvements.length > 0 && <div className="mt-4 text-sm"><p className="font-semibold">Saran</p><ul className="list-disc pl-5">{ev.improvements.map((m) => <li key={m}>{m}</li>)}</ul></div>}
      {ev.revisedExample.original && (
        <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-semibold">Contoh perbaikan kalimat</p>
          <p className="mt-1 text-muted">{ev.revisedExample.original}</p>
          <p className="mt-1">→ {ev.revisedExample.revised}</p>
        </div>
      )}
      {ev.droppedCorrections > 0 && <p className="mt-3 text-xs text-muted">{ev.droppedCorrections} koreksi AI dibuang karena tidak merujuk ke teks Anda secara persis.</p>}
    </Card>
  );
}

function SelfReview({ id }: { id: string }) {
  const { state, update } = useApp();
  const w = state.writings[id];
  const a = analyzeWriting(w.text, w.prompt.minWords, w.prompt.taskType);
  const rubric = RUBRICS.find((r) => r.id === "writing-v1")!;
  const check = w.selfCheck ?? {};
  const ready = aiReady(state.settings);
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Review mandiri</p>
      <p className="mt-1 text-sm text-muted">Tanpa AI, sistem tidak memberi estimasi band. Gunakan analisis otomatis dan checklist rubrik di bawah, lalu bandingkan dengan contoh jawaban model.</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {a.checks.map((c, i) => <li key={i} className="flex gap-2"><span>{c.ok ? "✅" : "⚠️"}</span><span>{c.text}</span></li>)}
      </ul>
      <p className="mt-5 text-sm font-semibold">Checklist rubrik (Band 7)</p>
      <ul className="mt-2 space-y-2">
        {rubric.criteria.map((c) => (
          <li key={c.key}>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 text-sm hover:bg-surface-2">
              <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" checked={!!check[c.key]} onChange={(e) => update((s) => { s.writings[id].selfCheck = { ...(s.writings[id].selfCheck ?? {}), [c.key]: e.target.checked }; })} />
              <span><strong>{c.name}</strong><span className="block text-muted">{c.band7}</span></span>
            </label>
          </li>
        ))}
      </ul>
      {ready && <Button className="mt-4" variant="secondary" onClick={() => update((s) => { s.writings[id].status = "evaluating"; })}>Minta evaluasi AI</Button>}
    </Card>
  );
}
