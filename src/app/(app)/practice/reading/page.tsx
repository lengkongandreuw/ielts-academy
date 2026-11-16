"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useApp } from "@/lib/store";
import { startSession } from "@/lib/engine";
import { PASSAGE_LIST } from "@/lib/content";
import { Badge, Button, Card, PageHeader, cx } from "@/components/ui";

const TYPE_LABEL: Record<string, string> = { mcq: "Multiple Choice", tfng: "T/F/NG", ynng: "Y/N/NG", completion: "Completion", matching: "Matching", short: "Short Answer" };
const MODES = [["learning", "Belajar (tanpa timer)"], ["timed", "Dengan timer"], ["exam", "Kondisi ujian"]] as const;

export default function ReadingPractice() {
  const { state } = useApp();
  const act = useAction();
  const router = useRouter();
  const [mode, setMode] = useState<"learning" | "timed" | "exam">("learning");
  const list = PASSAGE_LIST.filter((p) => p.usage === "practice");
  function start(id: string) {
    const sid = act((s) => startSession(s, { kind: "practice", section: "reading", refId: id, mode: mode === "exam" ? "exam" : "learning", timed: mode !== "learning" }, [], true));
    if (sid) router.push(`/test/?id=${sid}`);
  }
  return (
    <div className="fade-in">
      <PageHeader title="Reading Practice" subtitle="Passage di kiri, soal di kanan. Gunakan highlight untuk menandai kata kunci." />
      <div className="mb-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Mode latihan">
        {MODES.map(([k, l]) => (
          <button key={k} role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={cx("rounded-full px-4 py-1.5 text-sm", mode === k ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>{l}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((p) => {
          const attempts = Object.values(state.sessions).filter((s) => s.refId === p.id && s.status === "submitted");
          const best = attempts.length ? Math.max(...attempts.map((a) => a.result!.objective.accuracy)) : null;
          const open = Object.values(state.sessions).find((s) => s.refId === p.id && s.status === "in_progress");
          const types = Array.from(new Set(p.questions.map((q) => TYPE_LABEL[q.type])));
          return (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{p.title}</p>
                <Badge>{p.cefr}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{p.questions.length} soal · {p.timeLimitMin} menit · {types.join(", ")}</p>
              <p className="mt-2 text-xs text-muted">{attempts.length ? `Dikerjakan ${attempts.length}× · terbaik ${best}%` : "Belum dikerjakan"}</p>
              <div className="mt-4 flex gap-2">
                {open && <Button variant="secondary" onClick={() => router.push(`/test/?id=${open.id}`)}>Lanjutkan</Button>}
                <Button onClick={() => start(p.id)}>{attempts.length ? "Kerjakan lagi" : "Mulai"}</Button>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">Passage untuk mock test dan diagnostic tersedia di halaman masing-masing.</p>
    </div>
  );
}
