"use client";
import { useApp } from "@/lib/store";
import { ProfileForm } from "@/components/ProfileForm";
import { BackupButtons } from "@/components/Backup";
import { Logo } from "@/components/AppShell";

export default function Onboarding() {
  const { ready } = useApp();
  if (!ready) return null;
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8"><Logo /></div>
      <p className="eyebrow text-primary">Langkah 1 dari 2 · Profil belajar</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Halo! Mari atur target Anda.</h1>
      <p className="mt-1 text-sm text-muted">Target dan waktu belajar memengaruhi rencana harian. Semua bisa diubah nanti di Pengaturan.</p>
      <div className="mt-6 rounded-2xl bg-surface p-6 ring-1 ring-line">
        <ProfileForm mode="onboarding" />
      </div>
      <div id="restore" className="mt-6 rounded-2xl bg-surface p-6 ring-1 ring-line">
        <p className="font-medium">Sudah pernah belajar di perangkat lain?</p>
        <p className="mb-3 mt-1 text-sm text-muted">Pulihkan progres dari file backup (.json) yang Anda unduh di Pengaturan.</p>
        <BackupButtons allowExport={false} />
      </div>
    </main>
  );
}
