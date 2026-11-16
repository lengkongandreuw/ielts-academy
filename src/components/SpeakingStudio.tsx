"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { blobStore, useApp } from "@/lib/store";
import { addRecording, expiredRecordings, uid } from "@/lib/engine";
import { SPEAKING_LIST, type SpeakingPrompt } from "@/lib/content";
import { aiReady, type SpeakingFeedback } from "@/lib/ai";
import { countWords } from "@/lib/scoring";
import type { SpeakingRecording } from "@/lib/types";
import { Badge, Button, Card, Empty, Notice, OFFICIAL_NOTE, PageHeader, cx, inputCls } from "./ui";

type Phase = "idle" | "prep" | "recording" | "review";
type SR = { start(): void; stop(): void; abort(): void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
const getSR = (): (new () => SR) | null => (typeof window === "undefined" ? null : ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => SR) | null) ?? null;

const SELF = [
  ["FC", "Saya berbicara terus tanpa jeda panjang dan ide saya berurutan."],
  ["LR", "Saya memakai beberapa kata/kolokasi yang tepat untuk topik ini."],
  ["GRA", "Saya mencoba kalimat kompleks (because, although, if…)."],
  ["P", "Saat mendengar rekaman, ucapan saya jelas (bunyi akhir -s/-ed terdengar)."],
];

export function SpeakingStudio() {
  const { state, update } = useApp();
  const sp = useSearchParams();
  const context = sp.get("context") ?? "practice";
  const partFilter = sp.get("part");
  const [prompt, setPrompt] = useState<SpeakingPrompt | null>(() => SPEAKING_LIST.find((p) => p.id === sp.get("prompt")) ?? null);
  const [openRec, setOpenRec] = useState<string | null>(sp.get("r"));

  // Retention policy: delete expired audio.
  useEffect(() => {
    const ids = expiredRecordings(state);
    if (!ids.length) return;
    ids.forEach((id) => blobStore.del(id).catch(() => {}));
    update((s) => ids.forEach((id) => { s.recordings[id].hasAudio = false; }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const history = Object.values(state.recordings).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const prompts = SPEAKING_LIST.filter((p) => p.usage !== "mock" && (!partFilter || String(p.part) === partFilter));

  return (
    <div className="fade-in">
      <PageHeader title="Speaking Practice" subtitle="Rekam jawaban, dengarkan kembali, dan perbaiki. Part 1: interview · Part 2: cue card · Part 3: discussion." />
      {prompt ? (
        <Recorder key={prompt.id} prompt={prompt} context={context} onBack={() => setPrompt(null)} onSaved={(id) => { setPrompt(null); setOpenRec(id); }} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {[null, "1", "2", "3"].map((p) => (
              <Link key={p ?? "all"} href={`/practice/speaking/${p ? `?part=${p}` : ""}`} className={cx("rounded-full px-4 py-1.5 text-sm", partFilter === p || (!partFilter && !p) ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>{p ? `Part ${p}` : "Semua"}</Link>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {prompts.map((p) => (
              <button key={p.id} onClick={() => setPrompt(p)} className="rounded-2xl bg-surface p-4 text-left ring-1 ring-line transition-colors hover:ring-primary">
                <div className="flex items-center justify-between gap-2"><Badge tone="primary">Part {p.part}</Badge><span className="text-xs text-muted">{p.prepSec ? `${p.prepSec}s persiapan · ` : ""}{p.speakSec}s</span></div>
                <p className="mt-2 font-medium">{p.prompt}</p>
                <p className="text-xs text-muted">{p.topic}</p>
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 mt-8 text-base font-semibold">Rekaman saya</h2>
      {history.length === 0 ? <Empty title="Belum ada rekaman" /> : (
        <div className="space-y-3">
          {history.map((r) => <RecordingCard key={r.id} r={r} open={openRec === r.id} onToggle={() => setOpenRec(openRec === r.id ? null : r.id)} />)}
        </div>
      )}
      <p className="mt-6 text-xs text-muted">Privasi: rekaman hanya disimpan di browser ini, otomatis terhapus setelah {state.profile?.audioRetentionDays ?? 30} hari (atur di Pengaturan), dan tidak pernah diunggah. Jika evaluasi AI aktif, hanya <em>transkrip teks</em> yang dikirim ke AI.</p>
    </div>
  );
}

function Recorder({ prompt, context, onBack, onSaved }: { prompt: SpeakingPrompt; context: string; onBack: () => void; onSaved: (id: string) => void }) {
  const { state, update } = useApp();
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const sr = useRef<SR | null>(null);
  const started = useRef(0);
  const duration = useRef(0);
  const SRClass = getSR();

  useEffect(() => () => { stream.current?.getTracks().forEach((t) => t.stop()); sr.current?.abort(); if (url) URL.revokeObjectURL(url); }, [url]);

  useEffect(() => {
    if (phase !== "prep" && phase !== "recording") return;
    if (left <= 0) {
      if (phase === "prep") beginRecording();
      else stop();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left]);

  async function start() {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError("Browser ini tidak mendukung perekaman suara. Gunakan Chrome, Edge, atau Safari terbaru.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError("Akses mikrofon ditolak atau mikrofon tidak ditemukan. Izinkan mikrofon lewat ikon gembok di address bar, lalu coba lagi.");
      return;
    }
    if (prompt.prepSec) { setPhase("prep"); setLeft(prompt.prepSec); } else beginRecording();
  }

  function beginRecording() {
    const s = stream.current!;
    const chunks: Blob[] = [];
    const mr = new MediaRecorder(s);
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = () => {
      const b = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
      setBlob(b);
      setUrl(URL.createObjectURL(b));
      s.getTracks().forEach((t) => t.stop());
    };
    rec.current = mr;
    mr.start();
    started.current = Date.now();
    if (SRClass) {
      const r = new SRClass();
      r.lang = "en-US";
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e) => {
        let fin = "";
        let tmp = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) fin += e.results[i][0].transcript + " ";
          else tmp += e.results[i][0].transcript;
        }
        if (fin) setTranscript((t) => (t + " " + fin).replace(/\s+/g, " ").trim());
        setInterim(tmp);
      };
      r.onerror = () => {};
      try { r.start(); sr.current = r; } catch {}
    }
    setPhase("recording");
    setLeft(prompt.speakSec);
  }

  function stop() {
    duration.current = Math.round((Date.now() - started.current) / 1000);
    if (rec.current?.state === "recording") rec.current.stop();
    sr.current?.stop();
    setInterim("");
    setPhase("review");
  }

  async function save() {
    const id = uid();
    let hasAudio = false;
    if (blob) {
      try { await blobStore.put(id, blob); hasAudio = true; } catch { /* storage full → keep transcript only */ }
    }
    update((s) => {
      addRecording(s, { id, promptId: prompt.id, hasAudio, mimeType: blob?.type ?? null, durationSec: manual ? null : duration.current || null, transcript: transcript.trim(), context });
      // In a mock test, feedback waits until the whole mock is submitted.
      if (aiReady(s.settings) && transcript.trim() && !context.startsWith("mock:")) s.recordings[id].status = "evaluating";
    });
    onSaved(id);
  }

  return (
    <Card>
      <button onClick={onBack} className="text-sm text-muted hover:text-fg">← Pilih soal lain</button>
      <div className="mt-3 flex items-center gap-2"><Badge tone="primary">Part {prompt.part}</Badge><span className="text-xs text-muted">{prompt.topic}</span></div>
      <p className="mt-2 text-lg font-semibold">{prompt.prompt}</p>
      {prompt.bullets.length > 0 && (
        <div className="mt-2 rounded-lg bg-surface-2 p-3 text-sm"><p className="text-muted">You should say:</p><ul className="list-disc pl-5">{prompt.bullets.map((b) => <li key={b}>{b}</li>)}</ul></div>
      )}

      {micError && (
        <Notice tone="warning" className="mt-4">
          {micError}
          <span className="mt-2 block">Alternatif: ucapkan jawaban dengan suara keras sambil menghitung waktu, lalu <button className="font-medium text-primary underline" onClick={() => { setManual(true); setPhase("review"); }}>ketik jawaban Anda</button> untuk dicek.</span>
        </Notice>
      )}

      <div className="mt-5">
        {phase === "idle" && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={start}>🎤 Mulai {prompt.prepSec ? `(persiapan ${prompt.prepSec} detik)` : "merekam"}</Button>
            <span className="text-xs text-muted">Durasi bicara: {prompt.speakSec} detik. Browser akan meminta izin mikrofon.</span>
          </div>
        )}
        {phase === "prep" && (
          <div className="rounded-lg bg-warning-soft p-4 text-center">
            <p className="text-sm">Waktu persiapan — tulis kata kunci, bukan kalimat.</p>
            <p className="font-mono text-3xl tabular-nums">{left}s</p>
            <Button size="sm" variant="secondary" className="mt-2" onClick={() => setLeft(0)}>Mulai bicara sekarang</Button>
          </div>
        )}
        {phase === "recording" && (
          <div className="rounded-lg bg-danger-soft p-4 text-center" aria-live="polite">
            <p className="flex items-center justify-center gap-2 text-sm font-medium"><span className="size-2.5 animate-pulse rounded-full bg-danger" /> Merekam…</p>
            <p className="font-mono text-3xl tabular-nums">{left}s</p>
            {SRClass && <p className="mt-2 text-left text-sm text-muted">{transcript} <span className="opacity-60">{interim}</span></p>}
            <Button size="sm" className="mt-3" onClick={stop}>■ Selesai</Button>
          </div>
        )}
        {phase === "review" && (
          <div className="space-y-3">
            {url && <audio controls src={url} className="w-full" />}
            <label htmlFor="tr" className="block text-sm font-medium">Transkrip {SRClass && !manual ? "(otomatis — perbaiki jika ada salah dengar)" : ""}</label>
            {!SRClass && !manual && <p className="text-xs text-muted">Transkrip otomatis tidak didukung browser ini (gunakan Chrome/Edge). Ketik ulang jawaban Anda jika ingin feedback AI.</p>}
            <textarea id="tr" rows={5} className={cx(inputCls, "h-auto py-2")} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Transkrip jawaban Anda…" />
            <p className="text-xs text-muted">{countWords(transcript)} kata{duration.current && !manual ? ` · ${duration.current} detik · ${Math.round((countWords(transcript) / duration.current) * 60)} kata/menit` : ""}</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={!blob && !transcript.trim()}>Simpan{aiReady(state.settings) && transcript.trim() ? " & minta feedback AI" : ""}</Button>
              <Button variant="secondary" onClick={() => { setPhase("idle"); setBlob(null); setTranscript(""); setManual(false); }}>Rekam ulang</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function RecordingCard({ r, open, onToggle }: { r: SpeakingRecording; open: boolean; onToggle: () => void }) {
  const { update } = useApp();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!open || !r.hasAudio) return;
    let u: string | null = null;
    blobStore.get(r.id).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [open, r.hasAudio, r.id]);
  const fb = r.status === "evaluated" ? (r.feedback as SpeakingFeedback) : null;
  const del = async () => {
    if (!confirm("Hapus rekaman ini secara permanen?")) return;
    await blobStore.del(r.id).catch(() => {});
    update((s) => { delete s.recordings[r.id]; });
  };
  return (
    <Card className="p-4">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Part {r.prompt.part}: {r.prompt.prompt}</p>
          <p className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}{r.durationSec ? ` · ${r.durationSec}s` : ""}</p>
        </div>
        <Badge tone={r.status === "evaluated" ? "success" : r.status === "failed" ? "danger" : "neutral"}>{r.status === "evaluated" ? "Feedback AI" : r.status === "evaluating" ? "Dievaluasi…" : r.status === "failed" ? "Gagal" : "Tersimpan"}</Badge>
      </button>
      {open && (
        <div className="mt-4 space-y-3 text-sm">
          {r.hasAudio ? (url ? <audio controls src={url} className="w-full" /> : <p className="text-muted">Memuat audio…</p>) : <p className="text-xs text-muted">Audio tidak tersimpan (atau sudah dihapus sesuai kebijakan retensi).</p>}
          {r.transcript && <p className="rounded-lg bg-surface-2 p-3 italic">“{r.transcript}”</p>}
          {r.error && <Notice tone="warning">{r.error}</Notice>}
          {fb ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-4">
                {fb.criteria.map((c) => <div key={c.key} className="rounded-lg bg-surface-2 p-2.5"><p className="text-xs text-muted">{c.key === "FC" ? "Fluency & Coherence" : c.key === "LR" ? "Lexical Resource" : "Grammar"}</p><p className="font-semibold">{c.band.toFixed(1)}</p></div>)}
                <div className="rounded-lg bg-surface-2 p-2.5"><p className="text-xs text-muted">Pronunciation</p><p className="font-medium text-muted">Not Assessed</p></div>
              </div>
              <p className="text-xs text-muted">{OFFICIAL_NOTE} Pronunciation butuh analisis audio, sedangkan AI di sini hanya membaca transkrip — jadi tidak dinilai.{fb.wpm ? ` Kecepatan: ${fb.wpm} kata/menit.` : ""}</p>
              <p>{fb.summary}</p>
              {fb.criteria.map((c) => <p key={c.key} className="text-muted"><strong className="text-fg">{c.key}:</strong> {c.comment}</p>)}
              {fb.corrections.length > 0 && <ul className="space-y-1">{fb.corrections.map((c, i) => <li key={i}><span className="text-danger line-through">{c.original}</span> → <span className="text-success">{c.corrected}</span> <span className="text-muted">— {c.explanation}</span></li>)}</ul>}
              {fb.betterAnswer && <div className="rounded-lg bg-primary-soft p-3"><p className="font-medium">Contoh jawaban yang lebih baik</p><p className="mt-1">{fb.betterAnswer}</p></div>}
              {fb.tips.length > 0 && <ul className="list-disc pl-5">{fb.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
            </div>
          ) : r.status !== "evaluating" && (
            <div>
              <p className="font-medium">Cek mandiri</p>
              <ul className="mt-2 space-y-1.5">
                {SELF.map(([k, t]) => (
                  <li key={k}><label className="flex gap-2"><input type="checkbox" className="accent-[var(--primary)]" checked={!!r.selfCheck?.[k]} onChange={(e) => update((s) => { s.recordings[r.id].selfCheck = { ...(s.recordings[r.id].selfCheck ?? {}), [k]: e.target.checked }; })} />{t}</label></li>
                ))}
              </ul>
              {r.transcript && <Button size="sm" variant="secondary" className="mt-3" onClick={() => update((s) => { s.recordings[r.id].status = "evaluating"; s.recordings[r.id].error = null; })}>Minta feedback AI</Button>}
            </div>
          )}
          <button onClick={del} className="text-xs text-danger hover:underline">Hapus rekaman</button>
        </div>
      )}
    </Card>
  );
}
