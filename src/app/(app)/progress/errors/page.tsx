"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { LESSON_BY_ID } from "@/lib/content";
import { Badge, Card, Empty, LinkButton, PageHeader, cx } from "@/components/ui";

const SOURCE: Record<string, string> = { lesson: "Lesson", assessment: "Tes", writing: "Writing", speaking: "Speaking", vocab: "Kosakata", challenge: "Daily Challenge" };

export default function Errors() {
  const { state, update } = useApp();
  const [filter, setFilter] = useState<"open" | "recurring" | "resolved" | "all">("open");
  const [skill, setSkill] = useState("all");
  const all = Object.values(state.errors);
  const skills = Array.from(new Set(all.map((e) => e.skill)));
  const list = all
    .filter((e) => (filter === "all" ? true : filter === "resolved" ? e.reviewStatus === "resolved" : filter === "recurring" ? e.recurrenceCount >= 2 && e.reviewStatus !== "resolved" : e.reviewStatus !== "resolved"))
    .filter((e) => skill === "all" || e.skill === skill)
    .sort((a, b) => b.recurrenceCount - a.recurrenceCount || +new Date(b.lastSeenAt) - +new Date(a.lastSeenAt));

  return (
    <div className="fade-in">
      <PageHeader title="Error Log" subtitle="Setiap kesalahan penting dicatat. Jawab benar 3× berturut-turut pada topik yang sama → otomatis resolved." />
      <div className="mb-4 flex flex-wrap gap-2">
        {([["open", "Belum dikuasai"], ["recurring", "Berulang"], ["resolved", "Resolved"], ["all", "Semua"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={cx("rounded-full px-4 py-1.5 text-sm", filter === k ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>{l}</button>
        ))}
        <select aria-label="Filter skill" value={skill} onChange={(e) => setSkill(e.target.value)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
          <option value="all">Semua skill</option>
          {skills.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {list.length === 0 ? (
        <Empty title={filter === "resolved" ? "Belum ada kesalahan yang resolved" : "Tidak ada kesalahan di sini 🎉"}>Kesalahan dari lesson, tes, writing, dan speaking akan muncul di sini.</Empty>
      ) : (
        <div className="space-y-3">
          {list.map((e) => {
            const lesson = e.lessonId ? LESSON_BY_ID.get(e.lessonId) : e.skillTag ? [...LESSON_BY_ID.values()].find((l) => l.topicTag === e.skillTag) : undefined;
            return (
              <Card key={e.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{e.category}</Badge>
                  {e.recurrenceCount >= 2 && <Badge tone="warning">Berulang {e.recurrenceCount}×</Badge>}
                  {e.reviewStatus === "resolved" ? <Badge tone="success">Resolved</Badge> : e.reviewStatus === "reviewing" ? <Badge>Sedang dilatih ({e.correctStreak}/3)</Badge> : null}
                  <span className="ml-auto text-xs text-muted">{SOURCE[e.sourceType]} · {new Date(e.lastSeenAt).toLocaleDateString("id-ID")}</span>
                </div>
                <p className="mt-2 text-sm"><span className="text-danger line-through">{e.userAnswer}</span> → <span className="font-medium text-success">{e.expected}</span></p>
                <p className="mt-1 text-sm text-muted">{e.explanation}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LinkButton size="sm" variant="secondary" href={`/tutor/?error=${encodeURIComponent(e.id)}`}>🤖 Explain my mistake</LinkButton>
                  {lesson && <LinkButton size="sm" variant="secondary" href={`/learn/${lesson.id}`}>📘 Ulangi: {lesson.title.slice(0, 32)}</LinkButton>}
                  {e.reviewStatus !== "resolved" && <button className="text-xs text-muted hover:text-fg" onClick={() => update((s) => { s.errors[e.id].reviewStatus = "resolved"; })}>Tandai sudah paham</button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-6 text-xs text-muted">Catatan: hanya jawaban yang jelas salah yang dicatat — variasi redaksi yang tetap benar tidak dihitung sebagai kesalahan. Latihan tambahan bisa dibuat di <Link href="/tutor/?mode=practice" className="text-primary underline">AI Tutor</Link>.</p>
    </div>
  );
}
