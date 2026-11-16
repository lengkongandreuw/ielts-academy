"use client";
import { useEffect, useState } from "react";
import { TutorChat, MODES } from "./TutorChat";

export function TutorPanel({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const [mode, setMode] = useState("explain");
  const [key, setKey] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="AI Tutor">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-surface p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold">AI Tutor · lesson {lessonId}</p>
          <button onClick={onClose} className="rounded p-2 text-muted hover:bg-surface-2" aria-label="Tutup">✕</button>
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          {MODES.filter((m) => m.id !== "examiner").map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setKey((k) => k + 1); }} title={m.desc}
              className={`rounded-full px-3 py-1 text-xs ${mode === m.id ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"}`}>{m.label}</button>
          ))}
        </div>
        <TutorChat key={key} conversationId={null} lessonId={lessonId} mode={mode} compact />
      </div>
    </div>
  );
}
