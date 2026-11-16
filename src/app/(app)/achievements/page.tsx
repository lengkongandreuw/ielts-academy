"use client";
import { useApp } from "@/lib/store";
import { BADGES, levelFor, xpForLevel } from "@/lib/game";
import { streakOf } from "@/lib/engine";
import { Card, PageHeader, Progress, SectionTitle, cx } from "@/components/ui";

export default function Achievements() {
  const { state } = useApp();
  const lv = levelFor(state.game.xp);
  const unlocked = BADGES.filter((b) => state.game.badges[b.id]);
  return (
    <div className="fade-in space-y-4">
      <PageHeader title="Achievements" subtitle="XP, level, dan badge dari setiap langkah belajar Anda." />
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-primary text-3xl font-bold text-primary-fg">{lv.level}</div>
        <div className="flex-1">
          <p className="text-lg font-semibold">Level {lv.level} · {lv.title}</p>
          <p className="text-sm text-muted">{state.game.xp} XP total · {lv.need - lv.into} XP lagi menuju level {lv.level + 1} ({xpForLevel(lv.level + 1)} XP) · 🔥 streak {streakOf(state)} hari</p>
          <Progress value={lv.progress * 100} className="mt-3" label="Progres level" />
        </div>
      </Card>
      <Card>
        <SectionTitle>Badges ({unlocked.length}/{BADGES.length})</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => {
            const at = state.game.badges[b.id];
            return (
              <li key={b.id} className={cx("flex items-center gap-3 rounded-xl p-3 ring-1", at ? "bg-warning-soft ring-warning/40" : "bg-surface-2 opacity-60 ring-line")}>
                <span className={cx("text-3xl", !at && "grayscale")} aria-hidden>{b.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-muted">{b.desc}</p>
                  {at && <p className="text-[11px] text-muted">Didapat {new Date(at).toLocaleDateString("id-ID")}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card>
        <SectionTitle>Cara mendapat XP</SectionTitle>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {[["Jawaban benar (percobaan pertama)", 10], ["Jawaban benar (percobaan kedua)", 4], ["Menyelesaikan lesson", 50], ["Bonus lesson ≥ 90%", 25], ["Daily challenge", 40], ["Menyelesaikan tes/mock", 30], ["Mengirim esai", 40], ["Merekam speaking", 30], ["Review 1 kosakata", 3], ["Diagnostic test", 100]].map(([k, v]) => (
            <li key={k as string} className="flex justify-between rounded-md px-2 py-1 odd:bg-surface-2"><span>{k}</span><span className="font-medium">+{v}</span></li>
          ))}
        </ul>
      </Card>
      {state.game.log.length > 0 && (
        <Card>
          <SectionTitle>Riwayat XP terbaru</SectionTitle>
          <ul className="space-y-1 text-sm">
            {[...state.game.log].reverse().slice(0, 15).map((l, i) => (
              <li key={i} className="flex justify-between"><span className="text-muted">{l.reason} · {new Date(l.at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</span><span className="font-medium text-primary">+{l.xp}</span></li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
