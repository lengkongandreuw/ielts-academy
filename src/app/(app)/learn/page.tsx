"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { computePlan, lessonStates } from "@/lib/engine";
import { LESSON_META, PHASES, WEEKS } from "@/lib/content";
import type { LessonState } from "@/lib/adaptive";
import { Badge, Card, PageHeader, Progress, cx } from "@/components/ui";

const SKILL_ICON: Record<string, string> = { grammar: "G", vocabulary: "V", reading: "R", listening: "L", writing: "W", speaking: "S", review: "↺", assessment: "★" };
const NODE: Record<LessonState, string> = {
  locked: "bg-surface-2 text-muted ring-line",
  available: "bg-surface text-primary ring-primary",
  in_progress: "bg-primary text-primary-fg ring-primary animate-pulse",
  completed: "bg-success text-white ring-success",
  needs_review: "bg-warning text-white ring-warning",
};
const LABEL: Record<LessonState, string> = { locked: "Terkunci", available: "Tersedia", in_progress: "Sedang berjalan", completed: "Selesai", needs_review: "Perlu review" };

export default function Roadmap() {
  const { state } = useApp();
  const st = lessonStates(state);
  const plan = computePlan(state);
  const done = Object.values(st).filter((x) => x === "completed" || x === "needs_review").length;
  const currentId = LESSON_META.find((l) => st[l.id] === "in_progress")?.id ?? LESSON_META.find((l) => st[l.id] === "available")?.id;
  const currentWeek = currentId ? Number(currentId.slice(1, 3)) : 16;
  const personal = plan.items.filter((r) => r.kind === "remedial" || r.kind === "review");

  return (
    <div className="fade-in">
      <PageHeader title="Perjalanan 112 Hari" subtitle={`${done}/112 lesson selesai · Week ${currentWeek}`} />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-medium">Rencana dasar</p>
          <p className="mt-1 text-sm text-muted">
            Lesson terbuka satu per satu setelah lesson sebelumnya selesai{state.skill.startLevel ? `. Materi foundation di bawah level ${state.skill.startLevel} (hasil diagnostic) sudah dibuka lebih awal` : ""}.
          </p>
          <Progress value={(done / 112) * 100} className="mt-3" label="Progres kurikulum" />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
            {(Object.keys(LABEL) as LessonState[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5"><span className={cx("size-3 rounded-full ring-2", NODE[k].replace("animate-pulse", ""))} />{LABEL[k]}</span>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-sm font-medium">Penyesuaian personal</p>
          {personal.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Belum ada. Review dan latihan ulang akan muncul di sini berdasarkan kesalahan dan skor Anda.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {personal.map((r, i) => (
                <li key={i}><Link href={r.href} className="text-primary hover:underline">{r.title}</Link> <span className="text-muted">— {r.reason}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-8">
        {PHASES.map((p) => (
          <section key={p.id} aria-labelledby={`ph-${p.id}`}>
            <h2 id={`ph-${p.id}`} className="text-lg font-semibold">Phase {p.order}: {p.title}</h2>
            <p className="mb-3 text-sm text-muted">{p.description}</p>
            <div className="space-y-3">
              {WEEKS.filter((w) => w.phaseId === p.id).map((w) => {
                const wl = LESSON_META.filter((l) => Math.ceil(l.dayIndex / 7) === w.number);
                const wd = wl.filter((l) => st[l.id] === "completed" || st[l.id] === "needs_review").length;
                const allLocked = wl.every((l) => st[l.id] === "locked");
                return (
                  <Card key={w.id} className={cx("p-4", w.number === currentWeek && "ring-2 ring-primary/50")}>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Week {w.number}: {w.title}</p>
                        <p className="text-xs text-muted">{w.focus}</p>
                      </div>
                      {wd === 7 ? <Badge tone="success">Tuntas ✓</Badge> : <span className="text-xs tabular-nums text-muted">{wd}/7</span>}
                    </div>
                    {/* Path of 7 day-nodes */}
                    <ol className="relative flex items-center justify-between gap-1" aria-label={`Week ${w.number}`}>
                      <span className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-line" aria-hidden />
                      {wl.map((l) => {
                        const s = st[l.id];
                        const node = (
                          <span className={cx("relative grid size-9 place-items-center rounded-full text-xs font-bold ring-2 sm:size-10", NODE[s])}>{s === "completed" ? "✓" : SKILL_ICON[l.skill] ?? "•"}</span>
                        );
                        return (
                          <li key={l.id} className="relative">
                            {s === "locked" ? (
                              <span title={`Day ${l.dayIndex}: ${l.title} (terkunci)`} aria-label={`Day ${l.dayIndex}: ${l.title}, terkunci`}>{node}</span>
                            ) : (
                              <Link href={`/learn/${l.id}`} title={`Day ${l.dayIndex}: ${l.title}`} aria-label={`Day ${l.dayIndex}: ${l.title}, ${LABEL[s]}`} className="block transition-transform hover:scale-110">{node}</Link>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                    {!allLocked && (
                      <details className="mt-3 text-sm" open={w.number === currentWeek}>
                        <summary className="cursor-pointer text-xs text-muted">Daftar lesson</summary>
                        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                          {wl.map((l) => (
                            <li key={l.id} className="flex items-center gap-2">
                              <span className="w-9 shrink-0 text-xs text-muted">D{l.dayIndex}</span>
                              {st[l.id] === "locked" ? <span className="truncate text-muted">{l.title}</span> : <Link href={`/learn/${l.id}`} className="truncate hover:text-primary">{l.title}</Link>}
                              {state.lessons[l.id]?.score != null && <span className="ml-auto text-xs text-muted">{state.lessons[l.id].score}%</span>}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
