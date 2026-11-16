"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { dashboard } from "@/lib/selectors";
import { levelFor } from "@/lib/game";
import { READINESS_LABEL } from "@/lib/adaptive";
import { Badge, BandValue, Card, Empty, LinkButton, Notice, OFFICIAL_NOTE, Progress, SectionTitle, Stat } from "@/components/ui";
import { Bars } from "@/components/charts";

const SKILL_LABEL: Record<string, string> = { grammar: "Grammar", vocabulary: "Vocabulary", listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };

export default function Dashboard() {
  const { state } = useApp();
  const d = dashboard(state);
  const lv = levelFor(state.game.xp);
  const name = state.profile?.fullName ?? "";
  const pct = Math.round((d.curriculum.completed / Math.max(1, d.curriculum.total)) * 100);
  const todayPct = Math.round((d.today.minutes / Math.max(1, d.today.goalMinutes)) * 100);
  const primary = d.recommendations[0];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Selamat datang kembali{name ? `, ${name.split(" ")[0]}` : ""}</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Dashboard</h1>
        </div>
        <Badge tone={d.readiness === "target_met" ? "success" : d.readiness === "insufficient_data" ? "neutral" : "primary"}>Readiness: {READINESS_LABEL[d.readiness]}</Badge>
      </div>

      {!d.hasDiagnostic && (
        <Notice tone="warning">
          Anda belum mengerjakan <strong>Diagnostic Test</strong>. Rencana belajar personal disusun dari hasilnya.{" "}
          <Link href="/diagnostic" className="font-medium text-primary underline">
            Mulai sekarang
          </Link>
        </Notice>
      )}

      {/* Primary action */}
      <Card className="relative flex flex-col gap-4 overflow-hidden ring-brand sm:flex-row sm:items-center sm:justify-between" style={{ background: "radial-gradient(600px 200px at 90% 0%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%), var(--surface)" }}>
        <div className="min-w-0">
          <p className="eyebrow text-primary">Today&apos;s Lesson</p>
          {d.current ? (
            <>
              <p className="mt-2 truncate text-xl font-extrabold sm:text-2xl">
                Day {d.current.dayIndex}: {d.current.title}
              </p>
              <p className="text-sm text-muted">
                Week {d.curriculum.week} · {d.curriculum.phase}
              </p>
            </>
          ) : (
            <p className="mt-1 text-lg font-semibold">Kurikulum selesai 🎉</p>
          )}
        </div>
        {d.current && (
          <LinkButton href={`/learn/${d.current.id}`} className="shrink-0">
            {d.current.state === "in_progress" ? "Lanjutkan belajar" : "Mulai lesson"}
          </LinkButton>
        )}
      </Card>

      <Link href="/challenge" className={`flex items-center justify-between gap-3 rounded-2xl p-4 ring-1 transition-colors ${d.challengeDone ? "bg-success-soft ring-success/30" : "bg-primary-soft ring-primary/40 hover:ring-primary"}`}>
        <div>
          <p className="font-semibold">⚡ Daily Challenge</p>
          <p className="text-sm text-muted">{d.challengeDone ? "Selesai hari ini. Kembali besok untuk tantangan baru!" : "5 soal cepat dari materi Anda · +40 XP"}</p>
        </div>
        <span className="text-sm font-medium">{d.challengeDone ? "✓" : "Mulai →"}</span>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Stat label="Target score" value={d.target.toFixed(1)} sub={<>Estimasi saat ini: {d.overall !== null ? d.overall.toFixed(1) : "belum tersedia"}</>} />
        </Card>
        <Card>
          <Stat label="Hari ini" value={`${d.today.minutes} mnt`} sub={`Target ${d.today.goalMinutes} mnt · ${d.today.items} aktivitas`} />
          <Progress value={todayPct} className="mt-3" label="Progres belajar hari ini" />
        </Card>
        <Card>
          <Stat label="Kurikulum" value={`${pct}%`} sub={`${d.curriculum.completed}/${d.curriculum.total} lesson · Week ${d.curriculum.week}`} />
          <Progress value={pct} className="mt-3" label="Progres kurikulum" />
        </Card>
        <Card>
          <Stat label="Learning streak" value={`🔥 ${d.streak} hari`} sub={`Lv ${lv.level} ${lv.title} · ${state.game.xp} XP`} />
          <Progress value={lv.progress * 100} className="mt-3" label="Progres level" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle action={<Link href="/progress" className="text-sm text-primary">Detail →</Link>}>Skill Performance</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(["listening", "reading", "writing", "speaking"] as const).map((s) => (
              <div key={s} className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-muted">{SKILL_LABEL[s]}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  <BandValue value={d.estimates[s]} />
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(["grammar", "vocabulary"] as const).map((s) => (
              <div key={s}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{SKILL_LABEL[s]} mastery</span>
                  <span className="tabular-nums text-muted">{d.mastery[s] !== null ? `${Math.round(d.mastery[s]!)}%` : "Not Assessed"}</span>
                </div>
                <Progress value={d.mastery[s] ?? 0} label={`${SKILL_LABEL[s]} mastery`} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            {OFFICIAL_NOTE} Overall band hanya ditampilkan bila keempat skill sudah dinilai. Grammar/vocabulary adalah mastery, bukan skor IELTS.
          </p>
        </Card>

        <Card>
          <SectionTitle>Rekomendasi</SectionTitle>
          {d.recommendations.length === 0 ? (
            <Empty title="Tidak ada rekomendasi" />
          ) : (
            <ul className="space-y-2">
              {d.recommendations.map((r, i) => (
                <li key={i}>
                  <Link href={r.href} className={`block rounded-lg p-3 transition-colors hover:bg-surface-2 ${r === primary ? "bg-primary-soft" : ""}`}>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted">{r.reason}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle>Waktu belajar 7 hari</SectionTitle>
          <Bars label="Menit belajar per hari" unit=" mnt" data={d.last7.map((x) => ({ label: new Date(x.date + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "short" }), value: x.minutes }))} />
        </Card>
        <Card>
          <SectionTitle action={<Link href="/progress/errors" className="text-sm text-primary">Error Log →</Link>}>Weaknesses</SectionTitle>
          {d.weaknesses.length === 0 ? (
            <Empty title="Belum ada kesalahan tercatat">Kesalahan dari latihan akan muncul di sini.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {d.weaknesses.map((w) => (
                <li key={w.id} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{w.category}</span>
                    {w.recurrenceCount > 1 && <Badge tone="warning">{w.recurrenceCount}×</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted">
                    <span className="line-through">{w.userAnswer}</span> → {w.expected}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle>Alokasi waktu harian</SectionTitle>
          <ul className="space-y-1.5 text-sm">
            {d.allocation.map((a) => (
              <li key={a.skill} className="flex justify-between" title={a.reason}>
                <span>{SKILL_LABEL[a.skill]}</span>
                <span className="tabular-nums text-muted">{a.minutes} mnt</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Skill dengan selisih terbesar dari target mendapat waktu lebih banyak.</p>
        </Card>
      </div>

      <Card>
        <SectionTitle>Recent Activity</SectionTitle>
        {d.recent.length === 0 ? (
          <Empty title="Belum ada aktivitas" />
        ) : (
          <ul className="divide-y divide-line">
            {d.recent.map((r, i) => (
              <li key={i}>
                <Link href={r.href} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.kind} · {new Date(r.at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{r.meta}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
