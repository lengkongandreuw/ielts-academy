"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { savePlan } from "@/lib/engine";
import type { Profile } from "@/lib/types";
import { Button, Field, inputCls, Notice } from "./ui";

const BANDS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

const defaults = (): Profile => ({
  fullName: "", targetBand: 7, examType: "academic", currentLevel: "unknown", studyHoursPerDay: 1, preferredTime: "evening",
  targetExamDate: null, priorExperience: "none", priorScore: null, audioRetentionDays: 30, createdAt: new Date().toISOString(), onboardedAt: null,
});

export function ProfileForm({ mode }: { mode: "onboarding" | "settings" }) {
  const router = useRouter();
  const { state, update, toast } = useApp();
  const [v, setV] = useState<Profile>(() => state.profile ?? defaults());
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof Profile>(k: K, val: Profile[K]) => setV((s) => ({ ...s, [k]: val }));
  const general = v.examType === "general";

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!v.fullName.trim()) return setErr("Nama wajib diisi.");
    setErr(null);
    update((s) => {
      s.profile = { ...v, fullName: v.fullName.trim(), priorScore: v.priorExperience === "taken" ? v.priorScore : null, onboardedAt: v.onboardedAt ?? new Date().toISOString() };
      savePlan(s, mode === "onboarding" ? "onboarding" : "settings");
    });
    if (mode === "onboarding") router.replace("/diagnostic");
    else toast("Pengaturan tersimpan. Rencana belajar diperbarui.");
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {err && <Notice tone="danger">{err}</Notice>}
      <Field label="Nama panggilan" htmlFor="fullName">
        <input id="fullName" className={inputCls} value={v.fullName} onChange={(e) => set("fullName", e.target.value)} required autoComplete="name" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Target band IELTS" htmlFor="targetBand">
          <select id="targetBand" className={inputCls} value={v.targetBand} onChange={(e) => set("targetBand", Number(e.target.value))}>
            {BANDS.map((b) => <option key={b} value={b}>{b.toFixed(1)}</option>)}
          </select>
        </Field>
        <Field label="Jenis tes" htmlFor="examType">
          <select id="examType" className={inputCls} value={v.examType} onChange={(e) => set("examType", e.target.value as Profile["examType"])}>
            <option value="academic">IELTS Academic</option>
            <option value="general">IELTS General Training</option>
          </select>
        </Field>
      </div>
      {general && (
        <Notice tone="warning">
          <strong>General Training belum tersedia.</strong> Semua materi dan soal saat ini disusun untuk IELTS Academic. Pilih Academic untuk melanjutkan.
        </Notice>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Level bahasa Inggris saat ini" htmlFor="currentLevel" hint="Diagnostic tetap disarankan.">
          <select id="currentLevel" className={inputCls} value={v.currentLevel} onChange={(e) => set("currentLevel", e.target.value)}>
            <option value="unknown">Belum tahu</option>
            <option value="A1">A1 — Pemula</option>
            <option value="A2">A2 — Dasar</option>
            <option value="B1">B1 — Menengah</option>
            <option value="B2">B2 — Menengah atas</option>
            <option value="C1">C1 — Mahir</option>
          </select>
        </Field>
        <Field label="Waktu belajar per hari" htmlFor="hours">
          <select id="hours" className={inputCls} value={v.studyHoursPerDay} onChange={(e) => set("studyHoursPerDay", Number(e.target.value))}>
            {[0.5, 1, 1.5, 2, 3, 4].map((h) => <option key={h} value={h}>{h} jam</option>)}
          </select>
        </Field>
        <Field label="Waktu belajar favorit" htmlFor="preferredTime">
          <select id="preferredTime" className={inputCls} value={v.preferredTime} onChange={(e) => set("preferredTime", e.target.value)}>
            <option value="morning">Pagi</option>
            <option value="afternoon">Siang</option>
            <option value="evening">Sore/Malam</option>
            <option value="night">Larut malam</option>
          </select>
        </Field>
        <Field label="Tanggal ujian (opsional)" htmlFor="examDate">
          <input id="examDate" type="date" className={inputCls} value={v.targetExamDate ?? ""} onChange={(e) => set("targetExamDate", e.target.value || null)} />
        </Field>
        <Field label="Pengalaman IELTS" htmlFor="prior">
          <select id="prior" className={inputCls} value={v.priorExperience} onChange={(e) => set("priorExperience", e.target.value)}>
            <option value="none">Belum pernah belajar IELTS</option>
            <option value="studied">Pernah belajar, belum tes</option>
            <option value="taken">Sudah pernah tes</option>
          </select>
        </Field>
        {v.priorExperience === "taken" && (
          <Field label="Skor overall terakhir" htmlFor="priorScore">
            <input id="priorScore" type="number" min={0} max={9} step={0.5} className={inputCls} value={v.priorScore ?? ""} onChange={(e) => set("priorScore", e.target.value ? Number(e.target.value) : null)} />
          </Field>
        )}
      </div>
      {mode === "settings" && (
        <Field label="Simpan rekaman speaking selama" htmlFor="retention" hint="Rekaman otomatis terhapus setelah periode ini. Anda juga bisa menghapusnya kapan saja.">
          <select id="retention" className={inputCls} value={v.audioRetentionDays} onChange={(e) => set("audioRetentionDays", Number(e.target.value))}>
            {[7, 30, 90, 365].map((d) => <option key={d} value={d}>{d} hari</option>)}
          </select>
        </Field>
      )}
      <Button type="submit" disabled={mode === "onboarding" && general} className="w-full sm:w-auto">
        {mode === "onboarding" ? "Lanjut ke Diagnostic Test →" : "Simpan profil"}
      </Button>
    </form>
  );
}
