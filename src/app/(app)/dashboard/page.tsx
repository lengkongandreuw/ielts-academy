"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { dashboard } from "@/lib/selectors";
import { levelFor } from "@/lib/game";
import { dueVocab } from "@/lib/engine";
import { READINESS_LABEL } from "@/lib/adaptive";
import { Bars } from "@/components/charts";
import { Badge, BandValue, Card, Icon, LinkButton, Metric, OFFICIAL_NOTE, Progress, SectionTitle, Tile } from "@/components/ui";

const SKILL: Record<string, string> = { grammar: "Grammar", vocabulary: "Vocabulary", listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
const I = {
  play: "M7 4.5v15a1 1 0 001.5.86l12.5-7.5a1 1 0 000-1.72L8.5 3.64A1 1 0 007 4.5z",
  fire: "M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-4 3 0-3-1-5-3-7 0 4-3 6-3 11 0 5 3 9 7 9z",
  star: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  cards: "M4 7h12v13H4zM8 4h12v13",
  book: "M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z",
  chat: "M4 5h16v11H9l-5 4zM8 10h8",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01",
  compass: "M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5z",
};

export default function Dashboard() {
  const { state } = useApp();
  const d = dashboard(state);
  const lv = levelFor(state.game.xp);
  const first = (state.profile?.fullName ?? "").split(" ")[0];
  const pct = Math.round((d.curriculum.completed / Math.max(1, d.curriculum.total)) * 100);
  const due = dueVocab(state).length;
  const hour = new Date().getHours();
  const hello = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base text-muted">{hello},</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {first || "Teman"}! <span className="inline-block origin-[70%_70%] animate-[wave_1.6s_ease-in-out_2]" aria-hidden>👋</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">🔥 {d.streak} hari</Badge>
          <Badge tone="primary">⭐ Level {lv.level}</Badge>
          <Badge tone="primary">🎯 Target {d.target.toFixed(1)}</Badge>
        </div>
      </div>

      {/* One main action */}
      {d.hasDiagnostic ? (
        d.current && (
          <Link href={`/learn/${d.current.id}`} className="group rise neu neu-press ring-brand relative block overflow-hidden rounded-[28px] p-6 sm:p-8"
            style={{ background: "radial-gradient(520px 220px at 100% 0%, color-mix(in srgb, var(--primary) 26%, transparent), transparent 70%), var(--raised)" }}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="eyebrow text-amber">Pelajaran hari ini · Day {d.current.dayIndex}</p>
                <p className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{d.current.title}</p>
                <p className="mt-1 text-sm text-muted">Week {d.curriculum.week} · {d.curriculum.phase}</p>
                <Progress value={pct} showValue className="mt-5 max-w-sm" label="Progres kurikulum" />
              </div>
              <span className="btn-brand pulse-ring grid size-20 shrink-0 place-items-center self-end rounded-full text-white sm:self-auto">
                <svg viewBox="0 0 24 24" className="ml-1 size-8" fill="currentColor" aria-hidden><path d={I.play} /></svg>
                <span className="sr-only">{d.current.state === "in_progress" ? "Lanjutkan" : "Mulai"}</span>
              </span>
            </div>
          </Link>
        )
      ) : (
        <Link href="/diagnostic" className="group rise neu neu-press ring-brand block rounded-[28px] p-6 sm:p-8">
          <p className="eyebrow text-amber">Langkah pertama</p>
          <p className="mt-2 text-2xl font-extrabold sm:text-3xl">Kenali kemampuanmu dulu 🧭</p>
          <p className="mt-1 max-w-lg text-muted">Kerjakan Diagnostic Test supaya rencana belajarmu pas. Santai saja — ini bukan ujian.</p>
          <span className="btn-brand mt-5 inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-bold text-white">Mulai Diagnostic →</span>
        </Link>
      )}

      {/* Stat widgets */}
      <div className="stagger grid gap-4 sm:grid-cols-3">
        <Metric icon={I.fire} label="Hari beruntun" value={`${d.streak}`} sub={d.streak ? "Pertahankan besok!" : "Belajar hari ini untuk memulai"} />
        <Metric icon={I.star} label={`Level ${lv.level} · ${lv.title}`} value={`${state.game.xp} XP`} sub={`${lv.need - lv.into} XP lagi ke level ${lv.level + 1}`} />
        <Metric icon={I.target} label="Hari ini" value={`${Math.round(d.today.minutes)} / ${d.today.goalMinutes} mnt`} sub={`${d.today.items} aktivitas selesai`} />
      </div>

      {/* Activities */}
      <section>
        <SectionTitle>Mau belajar apa sekarang?</SectionTitle>
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile href="/challenge" icon={I.bolt} title="Daily Challenge" desc={d.challengeDone ? "Selesai hari ini ✓" : "5 soal cepat · +40 XP"} active={!d.challengeDone} />
          <Tile href="/learn/vocabulary" icon={I.cards} title="Kosakata" desc="Flashcard harian" badge={due ? <Badge tone="primary">{due}</Badge> : undefined} />
          <Tile href="/practice" icon={I.book} title="Latihan IELTS" desc="Reading · Listening · Writing · Speaking" />
          <Tile href="/tutor" icon={I.chat} title="Tanya Tutor" desc="Bingung? Tanya saja" />
        </div>
      </section>

      {/* Mistakes to fix */}
      {d.weaknesses.length > 0 && (
        <section>
          <SectionTitle action={<Link href="/progress/errors" className="text-sm font-bold text-primary">Semua →</Link>}>Yuk, perbaiki kesalahan ini 🛠️</SectionTitle>
          <div className="stagger grid gap-3 md:grid-cols-3">
            {d.weaknesses.slice(0, 3).map((w) => (
              <Card key={w.id} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="danger">{w.category}</Badge>
                  {w.recurrenceCount > 1 && <span className="text-xs font-bold text-muted">{w.recurrenceCount}×</span>}
                </div>
                <p className="mt-3 text-sm"><span className="text-coral line-through">{w.userAnswer}</span></p>
                <p className="text-sm font-bold text-success">✓ {w.expected}</p>
                <LinkButton href={`/tutor/?error=${encodeURIComponent(w.id)}`} variant="secondary" size="sm" className="mt-4 w-full">Jelaskan ke saya</LinkButton>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Details for older learners / parents */}
      <details className="group neu rounded-3xl p-6 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">
          <span className="flex items-center gap-2.5"><Icon d={I.compass} className="size-5 text-primary" /> Lihat detail kemampuan</span>
          <span className="flex items-center gap-2 text-sm text-muted">
            Readiness: {READINESS_LABEL[d.readiness]}
            <Icon d="M6 9l6 6 6-6" className="size-5 transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="fade-in mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["listening", "reading", "writing", "speaking"] as const).map((s) => (
              <div key={s} className="neu-inset rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted">{SKILL[s]}</p>
                <p className="mt-1 text-xl font-extrabold tabular-nums"><BandValue value={d.estimates[s]} /></p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["grammar", "vocabulary"] as const).map((s) => (
              <div key={s}>
                <div className="mb-2 flex justify-between text-sm font-semibold"><span>{SKILL[s]} mastery</span><span className="text-muted">{d.mastery[s] !== null ? `${Math.round(d.mastery[s]!)}%` : "Not Assessed"}</span></div>
                <Progress value={d.mastery[s] ?? 0} label={`${SKILL[s]} mastery`} />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold">Menit belajar 7 hari</p>
              <Bars label="Menit belajar per hari" unit=" mnt" data={d.last7.map((x) => ({ label: new Date(x.date + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "short" }), value: x.minutes }))} />
            </div>
            <div>
              <p className="mb-3 text-sm font-bold">Alokasi waktu harian (adaptif)</p>
              <ul className="space-y-2 text-sm">
                {d.allocation.map((a) => (
                  <li key={a.skill} className="flex justify-between" title={a.reason}><span>{SKILL[a.skill]}</span><span className="font-semibold tabular-nums text-muted">{a.minutes} mnt</span></li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted">{OFFICIAL_NOTE} Overall band baru muncul bila keempat skill sudah dinilai.</p>
        </div>
      </details>
    </div>
  );
}
