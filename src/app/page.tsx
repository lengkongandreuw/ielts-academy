"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { LinkButton } from "@/components/ui";

const FEATURES = [
  ["🧭 Diagnostic Test", "Ukur grammar, vocabulary, reading, writing, dan speaking awal Anda."],
  ["🗺️ Perjalanan 112 Hari", "Roadmap 16 minggu: Foundation → IELTS Skills → Band Improvement → Exam Prep."],
  ["⚡ XP, Streak & Badge", "Tantangan harian, level, dan badge membuat belajar setiap hari lebih seru."],
  ["✍️ Writing & Speaking", "Latihan dengan timer, rekaman suara, rubrik IELTS, dan contoh jawaban."],
  ["🛠️ Error Log Personal", "Kesalahan berulang dicatat dan diubah menjadi latihan ulang."],
  ["🤖 AI Tutor (opsional)", "Pakai API key Claude Anda sendiri untuk tutor & evaluasi esai."],
];

export default function Landing() {
  const { state, ready } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (ready && state.profile?.onboardedAt) router.replace("/dashboard");
  }, [ready, state.profile, router]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="flex items-center gap-2 font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-fg">IA</span> IELTS Academy
      </header>
      <section className="mt-14 max-w-2xl sm:mt-20">
        <p className="text-sm font-medium text-primary">IELTS Academic · Target Band 7.0</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Belajar IELTS sedikit demi sedikit, setiap hari.</h1>
        <p className="mt-4 text-lg text-muted">Mulai dari diagnostic, ikuti pelajaran harian, kumpulkan XP, dan lihat kemampuan Anda naik menuju Band 7.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/onboarding">Mulai belajar</LinkButton>
          <LinkButton href="/onboarding#restore" variant="secondary">Pulihkan dari backup</LinkButton>
        </div>
        <p className="mt-4 text-sm text-muted">Gratis, tanpa akun. Progres tersimpan di browser perangkat ini — gunakan fitur backup untuk pindah perangkat.</p>
      </section>
      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(([t, d]) => (
          <div key={t} className="rounded-xl bg-surface p-5 ring-1 ring-line/70">
            <p className="font-medium">{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
      <p className="mt-16 text-xs text-muted">IELTS Academy tidak berafiliasi dengan penyelenggara IELTS. Semua estimasi skor bersifat simulasi dan bukan skor IELTS resmi. Materi ditulis sendiri untuk platform ini.</p>
    </main>
  );
}
