"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp, useAction } from "@/lib/store";
import { createWriting, startSession } from "@/lib/engine";
import { loadListening } from "@/lib/content";
import { Badge, BandValue, Button, Card, LinkButton, Notice, OFFICIAL_NOTE, PageHeader } from "@/components/ui";

const TAG_LABEL: Record<string, string> = {
  "sentence-structure": "Struktur kalimat", "present-simple": "Present simple", "past-simple": "Past simple", "present-perfect": "Present perfect", articles: "Articles", countability: "Countable/uncountable",
  comparatives: "Comparatives", conditionals: "Conditionals", "passive-voice": "Passive voice", "linking-words": "Linking words", "relative-clauses": "Relative clauses", "grammar-range": "Struktur kompleks",
  "vocab-basic": "Kosakata dasar", "vocab-environment": "Kosakata lingkungan", "vocab-education": "Kosakata pendidikan", "vocab-academic": "Kosakata akademik", "lexical-resource": "Collocation",
  tfng: "True/False/Not Given", "reading-mcq": "Reading multiple choice", "reading-completion": "Reading completion",
};

export default function Diagnostic() {
  const { state } = useApp();
  const act = useAction();
  const router = useRouter();
  const sessions = Object.values(state.sessions).filter((s) => s.kind === "diagnostic").sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  const done = sessions.find((s) => s.status === "submitted");
  const open = sessions.find((s) => s.status === "in_progress");
  const writings = Object.values(state.writings).filter((w) => w.context === "diagnostic");
  const para = writings.find((w) => w.promptId === "para-hometown");
  const task2 = writings.find((w) => w.promptId === "t2-diag-online");
  const speaking = Object.values(state.recordings).find((r) => r.context === "diagnostic");

  async function startObjective() {
    const sets = await loadListening();
    const id = act((s) => startSession(s, { kind: "diagnostic" }, sets));
    if (id) router.push(`/test/?id=${id}`);
  }
  function startWriting(promptId: string) {
    const id = act((s) => createWriting(s, promptId, "diagnostic"));
    if (id) router.push(`/practice/writing/edit/?id=${id}`);
  }

  const r = done?.result;
  const tagStats = done ? Object.entries(r!.objective.byTag).filter(([, v]) => v.total >= 1) : [];
  const strengths = tagStats.filter(([, v]) => v.correct / v.total >= 0.99).map(([k]) => TAG_LABEL[k] ?? k);
  const weaknesses = tagStats.filter(([, v]) => v.correct / v.total < 0.5).map(([k]) => TAG_LABEL[k] ?? k);
  const writingBand = task2?.status === "evaluated" && task2.confidence === "normal" ? (task2.evaluation as { overall: number | null }).overall : null;
  const speakingPartial = speaking?.status === "evaluated" ? (speaking.feedback as { partialBand: number | null }).partialBand : null;

  const step = (n: number, title: string, desc: string, status: React.ReactNode, action: React.ReactNode) => (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{n}</span>
        <div>
          <p className="font-medium">{title} {status}</p>
          <p className="text-sm text-muted">{desc}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </Card>
  );

  return (
    <div className="fade-in space-y-4">
      <PageHeader title="Diagnostic Test" subtitle="Langkah 2 dari 2 — temukan titik awal Anda. Bukan ujian: tidak ada nilai lulus/gagal." />
      <Notice tone="primary">Kerjakan semampunya tanpa kamus. Jawaban tersimpan otomatis, Anda bisa berhenti dan melanjutkan kapan saja. Bagian yang belum dikerjakan akan ditandai <strong>Not Assessed</strong> — tidak ditebak.</Notice>

      {step(1, "Grammar, Vocabulary & Reading", "22 soal pilihan ganda (A1→C1) + 1 passage reading pendek. ±30–40 menit.",
        done ? <Badge tone="success">Selesai</Badge> : open ? <Badge tone="primary">Sedang berjalan</Badge> : null,
        done ? <LinkButton href={`/test/?id=${done.id}`} variant="secondary">Lihat pembahasan</LinkButton> : <Button onClick={startObjective}>{open ? "Lanjutkan" : "Mulai"}</Button>)}
      {step(2, "Writing: paragraf pendek", "Tulis 80–120 kata tentang kota asal Anda. ±20 menit.",
        para && para.status !== "draft" ? <Badge tone="success">Terkirim</Badge> : null,
        <Button variant={para && para.status !== "draft" ? "secondary" : "primary"} onClick={() => startWriting("para-hometown")}>{para ? (para.status === "draft" ? "Lanjutkan" : "Buka") : "Mulai"}</Button>)}
      {step(3, "Writing Task 2 (opsional)", "Untuk estimasi band Writing. Lewati jika masih pemula. ±40 menit.",
        task2 && task2.status !== "draft" ? <Badge tone="success">Terkirim</Badge> : <Badge>Opsional</Badge>,
        <Button variant="secondary" onClick={() => startWriting("t2-diag-online")}>{task2 ? (task2.status === "draft" ? "Lanjutkan" : "Buka") : "Mulai"}</Button>)}
      {step(4, "Speaking: perkenalan (opsional)", "Rekam jawaban 45 detik tentang diri Anda. Butuh mikrofon.",
        speaking ? <Badge tone="success">Terekam</Badge> : <Badge>Opsional</Badge>,
        <LinkButton href="/practice/speaking/?prompt=SP-01&context=diagnostic" variant="secondary">{speaking ? "Rekam ulang" : "Mulai"}</LinkButton>)}

      {done && r && (
        <Card>
          <h2 className="text-lg font-semibold">Profil kemampuan awal</h2>
          <p className="mb-4 text-sm text-muted">{OFFICIAL_NOTE} Grammar & vocabulary adalah mastery (%), bukan skor IELTS.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Grammar", r.sections.grammar ? `${r.sections.grammar.accuracy}%` : "Not Assessed"],
              ["Vocabulary", r.sections.vocabulary ? `${r.sections.vocabulary.accuracy}%` : "Not Assessed"],
              ["Reading", r.sections.reading ? `${r.sections.reading.correct}/${r.sections.reading.total} benar` : "Not Assessed"],
              ["Listening", r.sections.listening ? `${r.sections.listening.correct}/${r.sections.listening.total} benar` : "Not Assessed"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">{k}</p><p className="text-lg font-semibold">{v}</p></div>
            ))}
            <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">Writing (estimasi band)</p><p className="text-lg font-semibold"><BandValue value={writingBand} /></p>{!writingBand && <p className="text-xs text-muted">Perlu Task 2 + evaluasi AI</p>}</div>
            <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">Speaking</p><p className="text-lg font-semibold">{speakingPartial !== null ? `${speakingPartial.toFixed(1)}*` : "Not Assessed"}</p>{speakingPartial !== null && <p className="text-xs text-muted">*Parsial, tanpa pronunciation</p>}</div>
          </div>
          {r.sections.reading && r.bands.reading === null && <p className="mt-3 text-xs text-muted">Reading diagnostic hanya {r.sections.reading.total} soal — terlalu sedikit untuk estimasi band. Band reading akan muncul setelah latihan reading penuh.</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm font-medium">💪 Kekuatan</p><p className="text-sm text-muted">{strengths.length ? strengths.join(", ") : "Belum terlihat — terus berlatih!"}</p></div>
            <div><p className="text-sm font-medium">🎯 Perlu diperkuat</p><p className="text-sm text-muted">{weaknesses.length ? weaknesses.join(", ") : "Tidak ada kelemahan menonjol."}</p></div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg bg-primary-soft p-4">
            <div className="flex-1">
              <p className="font-medium">Level awal yang direkomendasikan: {r.startLevel}</p>
              <p className="text-sm text-muted">Overall band belum ditampilkan karena keempat skill belum dinilai secara memadai. Lesson foundation di bawah level ini sudah dibuka lebih awal.</p>
            </div>
            <LinkButton href="/learn/W01D01">Mulai Day 1 →</LinkButton>
          </div>
        </Card>
      )}
      {!done && <p className="text-sm text-muted">Selesai diagnostic? Lanjutkan ke <Link href="/dashboard" className="text-primary underline">dashboard</Link> untuk melihat rencana belajar Anda.</p>}
    </div>
  );
}
