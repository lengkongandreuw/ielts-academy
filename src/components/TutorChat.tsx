"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { aiReady, tutorReply } from "@/lib/ai";
import { uid } from "@/lib/engine";
import { Button, Notice, Rich, cx, inputCls } from "./ui";

export const MODES = [
  { id: "explain", label: "Explain", desc: "Menjelaskan konsep/grammar" },
  { id: "practice", label: "Practice", desc: "Latihan satu soal per giliran" },
  { id: "correction", label: "Correction", desc: "Koreksi kalimat Anda + alasan" },
  { id: "socratic", label: "Socratic", desc: "Dibimbing menemukan jawaban sendiri" },
  { id: "examiner", label: "Examiner", desc: "Simulasi IELTS tanpa bantuan" },
] as const;

export function TutorChat({ conversationId, mode, lessonId, onConversation, autoStart, compact }: {
  conversationId: string | null; mode: string; lessonId?: string | null; onConversation?: (id: string) => void; autoStart?: string | null; compact?: boolean;
}) {
  const { state, update } = useApp();
  const [conv, setConv] = useState<string | null>(conversationId);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const msgs = conv ? state.tutor[conv]?.messages ?? [] : [];
  const ready = aiReady(state.settings);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), [msgs.length, busy]);

  async function send(message: string) {
    if (!message.trim() || busy) return;
    setError(null);
    setText("");
    let id = conv;
    const at = new Date().toISOString();
    const next = update((s) => {
      if (!id || !s.tutor[id]) {
        id = uid();
        s.tutor[id] = { id, title: message.slice(0, 60), mode, lessonId: lessonId ?? null, messages: [], updatedAt: at };
      }
      s.tutor[id].messages.push({ role: "user", content: message, at });
      s.tutor[id].updatedAt = at;
      return s;
    });
    if (id !== conv) {
      setConv(id);
      onConversation?.(id!);
    }
    setBusy(true);
    try {
      const c = next.tutor[id!];
      const reply = await tutorReply(next, c.mode, c.lessonId, c.messages.map((m) => ({ role: m.role, content: m.content })));
      update((s) => {
        s.tutor[id!].messages.push({ role: "assistant", content: reply || "(tidak ada jawaban)", at: new Date().toISOString() });
        s.tutor[id!].updatedAt = new Date().toISOString();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghubungi AI.");
      update((s) => { s.tutor[id!].messages.pop(); });
      setText(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoStart && ready && !started.current) {
      started.current = true;
      send(autoStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, ready]);

  if (!ready)
    return (
      <Notice tone="warning">
        <strong>AI Tutor belum aktif.</strong> Masukkan API key Claude Anda di <Link href="/settings#ai" className="font-medium text-primary underline">Pengaturan</Link>. Key hanya disimpan di browser ini.
      </Notice>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cx("flex-1 space-y-3 overflow-y-auto", compact && "max-h-[55vh]")} aria-live="polite">
        {msgs.length === 0 && !busy && <p className="py-6 text-center text-sm text-muted">Tulis pertanyaan Anda. Contoh: “Kapan saya pakai present perfect?”</p>}
        {msgs.map((m, i) => (
          <div key={i} className={cx("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "ml-auto bg-primary text-primary-fg" : "bg-surface-2")}>
            {m.role === "assistant" ? <Rich text={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
          </div>
        ))}
        {busy && <div className="w-28 animate-pulse rounded-2xl bg-surface-2 px-4 py-2.5 text-sm text-muted">Tutor mengetik…</div>}
        <div ref={end} />
      </div>
      {error && <Notice tone="danger" className="mt-3">{error}</Notice>}
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <label htmlFor="tutor-input" className="sr-only">Pesan untuk tutor</label>
        <textarea id="tutor-input" rows={2} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          className={cx(inputCls, "h-auto flex-1 resize-none py-2")}
          placeholder={mode === "examiner" ? "Jawab dalam bahasa Inggris… (ketik 'selesai' untuk mengakhiri)" : "Tulis pesan… (Enter untuk kirim)"} disabled={busy} />
        <Button type="submit" disabled={busy || !text.trim()} className="self-end">Kirim</Button>
      </form>
    </div>
  );
}
