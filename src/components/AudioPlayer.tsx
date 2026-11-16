"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Notice } from "./ui";

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/**
 * Learning mode: seek, replay and speed control.
 * Exam mode: no seeking, no speed change, plays through once. The position is remembered,
 * so a reload or interruption resumes where it stopped instead of restarting or skipping.
 */
export function AudioPlayer({ src, storageKey, exam }: { src: string; storageKey: string; exam: boolean }) {
  const a = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [rate, setRate] = useState(1);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && a.current) {
        a.current.currentTime = saved.t ?? 0;
        setT(saved.t ?? 0);
        setEnded(!!saved.ended);
      }
    } catch {}
  }, [storageKey]);

  const remember = (patch: { t?: number; ended?: boolean }) => {
    try {
      const prev = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...patch }));
    } catch {}
  };

  function toggle() {
    const el = a.current;
    if (!el) return;
    if (el.paused) {
      if (ended && exam) return;
      if (ended) {
        el.currentTime = 0;
        setEnded(false);
      }
      el.playbackRate = exam ? 1 : rate;
      el.play().catch(() => setFailed(true));
    } else {
      el.pause();
      if (exam) setPaused(true);
    }
  }

  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <audio
        ref={a}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          setT(e.currentTarget.currentTime);
          if (Math.floor(e.currentTarget.currentTime) % 3 === 0) remember({ t: e.currentTarget.currentTime });
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
          remember({ ended: true, t: 0 });
        }}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <Notice tone="warning">Audio tidak dapat dimuat. Pastikan file audio ada di folder <code>public/audio/</code> dan koneksi stabil.</Notice>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={toggle} disabled={exam && ended} aria-label={playing ? "Jeda" : "Putar"}>
              {playing ? "❚❚ Pause" : ended ? (exam ? "Selesai" : "↺ Ulangi") : t > 0 ? "▶ Lanjut" : "▶ Play"}
            </Button>
            <span className="font-mono text-xs tabular-nums text-muted">{fmt(t)} / {dur ? fmt(dur) : "–:––"}</span>
            {!exam && (
              <select aria-label="Kecepatan" value={rate} onChange={(e) => { const r = Number(e.target.value); setRate(r); if (a.current) a.current.playbackRate = r; }} className="ml-auto rounded-md border border-line bg-surface px-2 py-1 text-xs">
                {[0.75, 0.9, 1, 1.25].map((r) => <option key={r} value={r}>{r}×</option>)}
              </select>
            )}
          </div>
          {exam ? (
            <div className="mt-2 h-1.5 rounded-full bg-line" aria-hidden><div className="h-full rounded-full bg-primary" style={{ width: dur ? `${(t / dur) * 100}%` : "0%" }} /></div>
          ) : (
            <input type="range" min={0} max={dur || 0} step={0.5} value={t} aria-label="Posisi audio" className="mt-2 w-full accent-[var(--primary)]"
              onChange={(e) => { if (a.current) a.current.currentTime = Number(e.target.value); }} />
          )}
          <p className="mt-2 text-xs text-muted">
            {exam
              ? ended ? "Audio sudah diputar. Seperti di ujian, audio tidak bisa diulang." : paused ? "Audio dijeda (gangguan). Lanjutkan sesegera mungkin — di ujian asli audio tidak berhenti." : "Mode ujian: audio diputar sekali, tidak bisa dipercepat atau digeser."
              : "Mode belajar: boleh diulang, digeser, dan diatur kecepatannya."}
          </p>
        </>
      )}
    </div>
  );
}
