"use client";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { LESSON_BY_ID } from "@/lib/content";
import { TutorChat, MODES } from "./TutorChat";
import { Button, Card, PageHeader, cx } from "./ui";

export function TutorPage() {
  const { state, update } = useApp();
  const sp = useSearchParams();
  const lessonId = sp.get("lesson");
  const lesson = lessonId ? LESSON_BY_ID.get(lessonId) : undefined;
  const err = sp.get("error") ? state.errors[sp.get("error")!] : undefined;
  const autoStart = useMemo(() => {
    if (err) return `Tolong jelaskan kesalahan saya dan beri saya latihan serupa.\nKategori: ${err.category}\nJawaban saya: "${err.userAnswer}"\nJawaban yang benar: "${err.expected}"`;
    if (sp.get("topic")) return `Tolong buat latihan untuk saya, satu soal per giliran, tentang: ${sp.get("topic")}`;
    return null;
  }, [err, sp]);
  const initialMode = err ? "correction" : sp.get("topic") ? "practice" : sp.get("mode") ?? "explain";
  const [mode, setMode] = useState(MODES.some((m) => m.id === initialMode) ? initialMode : "explain");
  const [active, setActive] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const list = Object.values(state.tutor).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  const startNew = (m = mode) => { setMode(m); setActive(null); setChatKey((k) => k + 1); };
  const open = (id: string) => { setActive(id); setMode(state.tutor[id].mode); setChatKey((k) => k + 1); };

  return (
    <div className="fade-in">
      <PageHeader title="AI Tutor" subtitle={lesson ? `Konteks lesson: ${lesson.id} — ${lesson.title}` : "Tutor memakai profil kemampuan, kesalahan terbaru, dan lesson aktif Anda."} />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="p-3">
          <Button onClick={() => startNew()} className="mb-2 w-full">+ Percakapan baru</Button>
          <p className="px-1 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Riwayat</p>
          {list.length === 0 && <p className="px-1 text-sm text-muted">Belum ada percakapan.</p>}
          <ul className="max-h-[60vh] space-y-0.5 overflow-y-auto">
            {list.map((c) => (
              <li key={c.id} className="group flex items-center">
                <button onClick={() => open(c.id)} className={cx("min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm", active === c.id ? "bg-primary-soft text-primary" : "hover:bg-surface-2")}>
                  <span className="block truncate">{c.title}</span>
                  <span className="text-xs text-muted">{c.mode} · {new Date(c.updatedAt).toLocaleDateString("id-ID")}</span>
                </button>
                <button aria-label="Hapus percakapan" onClick={() => { update((s) => { delete s.tutor[c.id]; }); if (active === c.id) startNew(); }} className="px-2 text-xs text-muted opacity-0 hover:text-danger group-hover:opacity-100 focus:opacity-100">✕</button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex min-h-[60vh] flex-col">
          <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Mode tutor">
            {MODES.map((m) => (
              <button key={m.id} role="tab" aria-selected={mode === m.id} disabled={!!active && state.tutor[active]?.mode !== m.id} onClick={() => startNew(m.id)} title={m.desc}
                className={cx("rounded-full px-3 py-1 text-xs disabled:opacity-40", mode === m.id ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-fg")}>{m.label}</button>
            ))}
          </div>
          <p className="mb-3 text-xs text-muted">{MODES.find((m) => m.id === mode)?.desc}.{mode === "examiner" && " Tutor tidak memberi bantuan selama tes."}</p>
          <TutorChat key={chatKey} conversationId={active} mode={mode} lessonId={active ? state.tutor[active]?.lessonId : lessonId} autoStart={chatKey === 0 ? autoStart : null} onConversation={setActive} />
        </Card>
      </div>
    </div>
  );
}
