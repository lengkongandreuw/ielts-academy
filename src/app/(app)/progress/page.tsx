"use client";
import { useApp } from "@/lib/store";
import { progress } from "@/lib/selectors";
import { READINESS_LABEL } from "@/lib/adaptive";
import { computePlan } from "@/lib/engine";
import { Bars, HBars, Lines } from "@/components/charts";
import { BandValue, Card, Empty, OFFICIAL_NOTE, PageHeader, SectionTitle, Stat } from "@/components/ui";

const TYPE_LABEL: Record<string, string> = { mcq: "Multiple Choice", tfng: "True/False/Not Given", ynng: "Yes/No/Not Given", completion: "Completion", matching: "Matching", short: "Short Answer" };
const SKILL: Record<string, string> = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking", speaking_partial: "Speaking (parsial)", grammar: "Grammar", vocabulary: "Vocabulary" };

export default function Progress() {
  const { state } = useApp();
  const p = progress(state);
  const plan = computePlan(state);
  const band = ["listening", "reading", "writing", "speaking_partial"].filter((k) => p.series[k]?.length).map((k) => ({ name: SKILL[k], points: p.series[k] }));
  const mastery = ["grammar", "vocabulary"].filter((k) => p.series[k]?.length).map((k) => ({ name: SKILL[k], points: p.series[k] }));

  return (
    <div className="fade-in space-y-4">
      <PageHeader title="Skill Analytics" subtitle={`Readiness: ${READINESS_LABEL[plan.readiness]} — dihitung dari beberapa hasil terbaru, bukan satu skor terbaik.`} />
      <div className="grid gap-4 sm:grid-cols-4">
        {(["listening", "reading", "writing", "speaking"] as const).map((k) => (
          <Card key={k}><Stat label={SKILL[k]} value={<BandValue value={state.skill[k]} />} sub="estimasi saat ini" /></Card>
        ))}
      </div>
      <p className="text-xs text-muted">{OFFICIAL_NOTE}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><SectionTitle>Skill performance over time (band)</SectionTitle><Lines series={band} label="Riwayat estimasi band" /></Card>
        <Card><SectionTitle>Grammar & vocabulary mastery (%)</SectionTitle><Lines series={mastery} max={100} unit="%" label="Riwayat mastery" /></Card>
        <Card>
          <SectionTitle>Accuracy by question type</SectionTitle>
          <HBars label="Akurasi per tipe soal" data={Object.entries(p.byType).map(([k, v]) => ({ label: TYPE_LABEL[k] ?? k, value: Math.round((v.correct / v.total) * 100), sub: `${v.correct}/${v.total}` }))} />
        </Card>
        <Card><SectionTitle>Weekly study time</SectionTitle><Bars label="Menit belajar per minggu" unit=" mnt" data={p.weekly.map((w) => ({ label: w.label, value: w.minutes }))} /></Card>
        <Card>
          <SectionTitle>Vocabulary mastery</SectionTitle>
          {p.vocabStats.total === 0 ? <Empty title="Belum ada kosakata" /> : (
            <HBars label="Status kosakata" max={p.vocabStats.total} unit="" data={[{ label: "Mastered", value: p.vocabStats.mastered }, { label: "Sedang dipelajari", value: p.vocabStats.learning }, { label: "Belum direview", value: p.vocabStats.fresh }]} />
          )}
        </Card>
        <Card>
          <SectionTitle>Repeated mistakes by category</SectionTitle>
          <HBars label="Kesalahan per kategori" unit="×" max={Math.max(1, ...Object.values(p.errCats).map((c) => c.occurrences))} data={Object.entries(p.errCats).sort((a, b) => b[1].occurrences - a[1].occurrences).slice(0, 8).map(([k, v]) => ({ label: k, value: v.occurrences, sub: `${v.resolved} resolved` }))} />
        </Card>
      </div>

      <Card>
        <SectionTitle>Mock test score history</SectionTitle>
        {p.mocks.length === 0 && p.minis.length === 0 ? <Empty title="Belum ada mock test" /> : (
          <Lines label="Riwayat skor mock" series={[
            ...(p.mocks.some((m) => m.reading !== null) ? [{ name: "Reading (full mock)", points: p.mocks.filter((m) => m.reading !== null).map((m) => ({ at: m.at, value: m.reading! })) }] : []),
            ...(p.mocks.some((m) => m.overall !== null) ? [{ name: "Overall", points: p.mocks.filter((m) => m.overall !== null).map((m) => ({ at: m.at, value: m.overall! })) }] : []),
            ...(p.minis.some((m) => m.reading !== null) ? [{ name: "Reading (mini)", points: p.minis.filter((m) => m.reading !== null).map((m) => ({ at: m.at, value: m.reading! })) }] : []),
          ]} />
        )}
      </Card>

      <Card>
        <SectionTitle>Rencana belajar & alasannya</SectionTitle>
        {p.plans.length === 0 ? <Empty title="Belum ada riwayat rencana" /> : (
          <ul className="space-y-3 text-sm">
            {p.plans.slice(0, 4).map((pl) => (
              <li key={pl.version} className="rounded-lg bg-surface-2 p-3">
                <p className="font-medium">Versi {pl.version} · {new Date(pl.at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} <span className="text-xs text-muted">(dipicu: {pl.trigger})</span></p>
                <ul className="mt-1 list-disc pl-5 text-muted">{pl.items.slice(0, 3).map((it, i) => <li key={i}>{it.title} — {it.reason}</li>)}</ul>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
