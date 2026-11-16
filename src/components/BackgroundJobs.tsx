"use client";
// Runs AI evaluations queued anywhere in the app (writing & speaking), and resumes them after a reload.
import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { aiReady, evaluateSpeaking, evaluateWriting } from "@/lib/ai";
import { applySpeakingFeedback, applyWritingEvaluation, failWriting } from "@/lib/engine";

const running = new Set<string>();

export function BackgroundJobs() {
  const { state, update, toast } = useApp();
  const ready = aiReady(state.settings);

  useEffect(() => {
    for (const w of Object.values(state.writings)) {
      if (w.status !== "evaluating" || running.has(w.id)) continue;
      if (!ready) {
        update((s) => failWriting(s, w.id, "AI belum diaktifkan. Masukkan API key di Pengaturan, atau gunakan review mandiri."));
        continue;
      }
      running.add(w.id);
      evaluateWriting(state.settings, w)
        .then(({ evaluation, confidence }) => {
          update((s) => applyWritingEvaluation(s, w.id, evaluation, confidence));
          toast("✍️ Feedback esai sudah siap");
        })
        .catch((e) => update((s) => failWriting(s, w.id, e instanceof Error ? e.message : "Evaluasi gagal.")))
        .finally(() => running.delete(w.id));
    }
    for (const r of Object.values(state.recordings)) {
      if (r.status !== "evaluating" || running.has(r.id)) continue;
      if (!ready) {
        update((s) => { Object.assign(s.recordings[r.id], { status: "saved", error: "AI belum diaktifkan." }); });
        continue;
      }
      running.add(r.id);
      evaluateSpeaking(state.settings, r)
        .then((fb) => {
          update((s) => applySpeakingFeedback(s, r.id, fb));
          toast("🎤 Feedback speaking sudah siap");
        })
        .catch((e) => update((s) => { Object.assign(s.recordings[r.id], { status: "failed", error: e instanceof Error ? e.message : "Gagal." }); }))
        .finally(() => running.delete(r.id));
    }
  }, [state.writings, state.recordings, state.settings, ready, update, toast]);

  return null;
}
