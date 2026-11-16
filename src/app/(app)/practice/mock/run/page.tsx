"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useApp } from "@/lib/store";
import { MOCK_SPEAKING, submitMock } from "@/lib/engine";
import { aiReady } from "@/lib/ai";
import { mockScores } from "@/lib/selectors";
import { Badge, BandValue, Button, Card, Empty, LinkButton, Notice, OFFICIAL_NOTE, PageHeader } from "@/components/ui";

function Run() {
  const { state } = useApp();
  const act = useAction();
  const id = useSearchParams().get("id") ?? "";
  const [confirm, setConfirm] = useState(false);
  const m = state.mocks[id];
  if (!m) return <Empty title="Mock test tidak ditemukan" action={<LinkButton href="/practice/mock">Kembali</LinkButton>} />;
  const sess = state.sessions[m.sessionId];
  const w = m.writingId ? state.writings[m.writingId] : undefined;
  const r = m.speakingId ? state.recordings[m.speakingId] : undefined;
  const done = m.status === "submitted";
  const sc = mockScores(state, id);
  const lrDone = sess?.status === "submitted";

  const part = (title: string, desc: string, status: string, ok: boolean, href: string, cta: string) => (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{title} <Badge tone={ok ? "success" : "neutral"}>{status}</Badge></p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
      {!done || ok ? <LinkButton href={href} variant={ok ? "secondary" : "primary"}>{cta}</LinkButton> : null}
    </Card>
  );

  return (
    <div className="fade-in space-y-4">
      <PageHeader title="Full Mock Test" subtitle={`Dimulai ${new Date(m.startedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`} />
      {!done && <Notice tone="primary">Kerjakan bagian sesuai urutan ujian asli: Listening & Reading → Writing → Speaking. Feedback semua bagian baru terbuka setelah Anda menekan “Selesaikan mock test”.</Notice>}
      {sess?.notAssessed.includes("listening") && <Notice tone="neutral">Listening: <strong>Content Unavailable</strong> — audio mock belum tersedia, jadi Listening <strong>Not Assessed</strong> dan Overall band tidak dapat dihitung.</Notice>}

      {part("1. Listening & Reading", `${sess?.questions.length ?? 0} soal · ${Math.round((sess?.timeLimitSec ?? 0) / 60)} menit`, lrDone ? "Selesai" : "Belum", lrDone, `/test/?id=${m.sessionId}`, lrDone ? (done ? "Lihat pembahasan" : "Lihat") : "Kerjakan")}
      {part("2. Writing Task 2", "Min. 250 kata · 40 menit", w && w.status !== "draft" ? "Terkirim" : w?.wordCount ? `Draft ${w.wordCount} kata` : "Belum", !!w && w.status !== "draft", `/practice/writing/edit/?id=${m.writingId}`, w && w.status !== "draft" ? "Lihat" : "Tulis")}
      {part("3. Speaking Part 2", "1 menit persiapan · 2 menit bicara", r ? "Terekam" : "Belum", !!r, `/practice/speaking/?prompt=${MOCK_SPEAKING}&context=mock:${id}`, r ? "Rekam ulang" : "Rekam")}

      {!done ? (
        <div className="flex justify-end"><Button onClick={() => setConfirm(true)}>Selesaikan mock test</Button></div>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold">Hasil simulasi</h2>
          <p className="text-xs text-muted">{OFFICIAL_NOTE}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[["Listening", sc.listening], ["Reading", sc.reading], ["Writing", sc.writing], ["Speaking", sc.speaking]].map(([k, v]) => (
              <div key={k as string} className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">{k}</p><p className="text-xl font-semibold"><BandValue value={v as number | null} /></p></div>
            ))}
            <div className="rounded-lg bg-primary-soft p-3"><p className="text-xs text-muted">Overall</p><p className="text-xl font-semibold"><BandValue value={sc.overall} notAssessedLabel="Belum bisa" /></p></div>
          </div>
          <ul className="mt-4 space-y-1 text-xs text-muted">
            {sc.reading === null && <li>Reading: belum dikerjakan atau soal terlalu sedikit.</li>}
            {sc.writing === null && <li>Writing: estimasi band butuh evaluasi AI pada esai ≥ {Math.round(250 * 0.6)} kata{w?.status === "evaluating" ? " (sedang dievaluasi…)" : ""}.</li>}
            <li>Speaking: band penuh membutuhkan penilaian pronunciation dari audio, yang belum didukung.{sc.speakingPartial !== null ? ` Estimasi parsial (tanpa pronunciation): ${sc.speakingPartial.toFixed(1)}.` : ""}</li>
            {sc.overall === null && <li>Overall tidak dihitung karena tidak semua komponen dinilai — sistem tidak menebak skor.</li>}
          </ul>
        </Card>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="alertdialog" aria-modal="true">
          <Card className="w-full max-w-sm">
            <p className="font-semibold">Selesaikan mock test?</p>
            <p className="mt-2 text-sm text-muted">Bagian yang belum dikerjakan akan dinilai apa adanya (soal kosong dihitung salah). Esai draft ≥ 20 kata akan dikirim{aiReady(state.settings) ? " dan dievaluasi AI" : ""}.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)} autoFocus>Kembali</Button>
              <Button onClick={() => { act((s) => submitMock(s, id, aiReady(s.settings))); setConfirm(false); }}>Ya, selesaikan</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Run />
    </Suspense>
  );
}
