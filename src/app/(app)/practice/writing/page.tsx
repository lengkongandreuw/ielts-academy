"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAction, useApp } from "@/lib/store";
import { createWriting } from "@/lib/engine";
import { WRITING_LIST } from "@/lib/content";
import { writingStatusLabel } from "@/lib/selectors";
import { Badge, Button, Card, Empty, PageHeader, cx } from "@/components/ui";

const TYPES = [["all", "Semua"], ["paragraph", "Paragraph"], ["task1", "Task 1"], ["task2", "Task 2"]] as const;

function WritingList() {
  const { state } = useApp();
  const act = useAction();
  const router = useRouter();
  const sp = useSearchParams();
  const type = sp.get("type") ?? "all";
  const prompts = WRITING_LIST.filter((p) => p.usage !== "mock" && (type === "all" || p.taskType === type));
  const history = Object.values(state.writings).filter((w) => !w.context.startsWith("mock:")).sort((a, b) => +new Date(b.submittedAt ?? b.createdAt) - +new Date(a.submittedAt ?? a.createdAt));
  const start = (id: string) => {
    const wid = act((s) => createWriting(s, id, "practice"));
    if (wid) router.push(`/practice/writing/edit/?id=${wid}`);
  };
  return (
    <div className="fade-in">
      <PageHeader title="Writing Practice" subtitle="Tulis dengan timer dan autosave, lalu dapatkan feedback rubrik IELTS dan tulis ulang." />
      <div className="mb-5 flex flex-wrap gap-2">
        {TYPES.map(([k, l]) => (
          <Link key={k} href={`/practice/writing/${k === "all" ? "" : `?type=${k}`}`} className={cx("rounded-full px-4 py-1.5 text-sm", type === k ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>{l}</Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {prompts.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{p.title}</p>
              <Badge tone="primary">{p.taskType === "task1" ? "Task 1" : p.taskType === "task2" ? "Task 2" : "Paragraph"}</Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{p.prompt.split("\n")[0]}</p>
            <p className="mt-2 text-xs text-muted">Min. {p.minWords} kata · {p.timeLimitMin} menit</p>
            <Button className="mt-4" onClick={() => start(p.id)}>Tulis</Button>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-base font-semibold">Riwayat esai</h2>
      {history.length === 0 ? (
        <Empty title="Belum ada esai">Esai yang Anda tulis akan muncul di sini, lengkap dengan revisinya.</Empty>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {history.map((w) => (
              <li key={w.id}>
                <Link href={`/practice/writing/edit/?id=${w.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{w.prompt.title}{w.revision > 1 ? ` · revisi ${w.revision}` : ""}</p>
                    <p className="text-xs text-muted">{w.wordCount} kata · {new Date(w.submittedAt ?? w.createdAt).toLocaleDateString("id-ID")}</p>
                  </div>
                  <Badge tone={w.status === "evaluated" ? "success" : w.status === "failed" ? "danger" : "neutral"}>{writingStatusLabel(w.status)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <WritingList />
    </Suspense>
  );
}
