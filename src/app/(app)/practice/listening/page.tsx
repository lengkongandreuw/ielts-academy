"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useApp } from "@/lib/store";
import { startSession } from "@/lib/engine";
import { loadListening, type ListeningSet } from "@/lib/content";
import { Badge, Button, Card, Empty, PageHeader, cx } from "@/components/ui";

export default function ListeningPractice() {
  const { state } = useApp();
  const act = useAction();
  const router = useRouter();
  const [sets, setSets] = useState<ListeningSet[] | null>(null);
  const [exam, setExam] = useState(false);
  useEffect(() => {
    loadListening().then(setSets);
  }, []);
  const practice = (sets ?? []).filter((s) => s.usage === "practice");
  function start(id: string) {
    const sid = act((s) => startSession(s, { kind: "practice", section: "listening", refId: id, mode: exam ? "exam" : "learning" }, sets ?? [], true));
    if (sid) router.push(`/test/?id=${sid}`);
  }
  return (
    <div className="fade-in">
      <PageHeader title="Listening Practice" subtitle="Mode belajar: audio boleh diulang & diperlambat, transcript muncul setelah submit. Mode ujian: audio diputar sekali." />
      {sets === null ? (
        <p className="text-sm text-muted">Memuat daftar audio…</p>
      ) : practice.length === 0 ? (
        <Empty title="Content Unavailable — audio belum tersedia">
          Materi Listening sedang disiapkan. Skor Listening tidak dihitung sampai audio tersedia, dan Anda tetap bisa melanjutkan materi lain.
        </Empty>
      ) : (
        <>
          <div className="mb-5 flex gap-2" role="radiogroup" aria-label="Mode">
            <button role="radio" aria-checked={!exam} onClick={() => setExam(false)} className={cx("rounded-full px-4 py-1.5 text-sm", !exam ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>Mode belajar</button>
            <button role="radio" aria-checked={exam} onClick={() => setExam(true)} className={cx("rounded-full px-4 py-1.5 text-sm", exam ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>Mode ujian</button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {practice.map((l) => {
              const attempts = Object.values(state.sessions).filter((s) => s.refId === l.id && s.status === "submitted");
              return (
                <Card key={l.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{l.title}</p>
                    <Badge>Part {l.section}</Badge>
                  </div>
                  {l.description && <p className="mt-1 text-sm text-muted">{l.description}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {l.questions.length} soal{l.durationSec ? ` · ${Math.round(l.durationSec / 60)} menit audio` : ""} · {attempts.length ? `dikerjakan ${attempts.length}×` : "belum dikerjakan"}
                  </p>
                  <Button className="mt-4" onClick={() => start(l.id)}>Mulai</Button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
