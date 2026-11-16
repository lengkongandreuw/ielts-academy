"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Icon } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";

const ITEMS = [
  { href: "/practice/reading", title: "Reading", desc: "Passage + soal, highlight, timer, bukti jawaban", icon: "M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z", kind: "reading" },
  { href: "/practice/listening", title: "Listening", desc: "Mode belajar & mode ujian, transcript setelah submit", icon: "M4 14v-2a8 8 0 0116 0v2M4 14h3v6H4zM17 14h3v6h-3z", kind: "listening" },
  { href: "/practice/writing", title: "Writing", desc: "Task 1 & 2, timer, autosave, revisi, contoh jawaban", icon: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4", kind: "writing" },
  { href: "/practice/speaking", title: "Speaking", desc: "Rekam Part 1–3, transkrip otomatis, cek mandiri", icon: "M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4", kind: "speaking" },
  { href: "/practice/mock", title: "Mock Tests", desc: "Mini test & full mock dalam kondisi ujian", icon: "M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z", kind: "mock" },
  { href: "/challenge", title: "Daily Challenge", desc: "5 soal cepat setiap hari · +40 XP", icon: "M13 2L4 14h7l-1 8 9-12h-7z", kind: "challenge" },
];

export default function PracticeHub() {
  const { state } = useApp();
  const count = (kind: string) =>
    kind === "writing" ? Object.values(state.writings).filter((w) => w.status !== "draft").length
    : kind === "speaking" ? Object.keys(state.recordings).length
    : kind === "mock" ? Object.values(state.sessions).filter((s) => (s.kind === "mock" || s.kind === "mini") && s.status === "submitted").length
    : kind === "challenge" ? Object.values(state.sessions).filter((s) => s.kind === "challenge" && s.status === "submitted").length
    : Object.values(state.sessions).filter((s) => s.kind === "practice" && s.section === kind && s.status === "submitted").length;
  return (
    <div className="fade-in">
      <PageHeader title="Latihan IELTS" subtitle="Pilih skill yang ingin dilatih. Semua hasil masuk ke progres dan Error Log Anda." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => (
          <Link key={it.href} href={it.href} className="group flex flex-col justify-between gap-6 rounded-2xl bg-surface p-6 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-primary/60">
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary"><Icon d={it.icon} className="size-6" /></span>
              <span className="text-xs text-muted">{count(it.kind)}× selesai</span>
            </div>
            <div>
              <p className="text-lg font-bold">{it.title}</p>
              <p className="mt-1 text-sm text-muted">{it.desc}</p>
            </div>
            <span className="text-sm font-semibold text-primary">Mulai latihan →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
