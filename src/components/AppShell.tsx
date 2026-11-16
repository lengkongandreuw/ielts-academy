"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { levelFor } from "@/lib/game";
import { dueVocab, streakOf, todayKey } from "@/lib/engine";
import { BackgroundJobs } from "./BackgroundJobs";
import { cx } from "./ui";

type Tab = { href: string; label: string };
type Section = { id: string; label: string; href: string; icon: string; match: RegExp; tabs?: Tab[] };

export const SECTIONS: Section[] = [
  { id: "home", label: "Home", href: "/dashboard", icon: "M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5", match: /^\/dashboard/ },
  {
    id: "learn", label: "Learn", href: "/learn", icon: "M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z",
    match: /^\/(learn|diagnostic|challenge)/,
    tabs: [
      { href: "/learn", label: "Roadmap" },
      { href: "/challenge", label: "Daily Challenge" },
      { href: "/learn/vocabulary", label: "Vocabulary" },
      { href: "/diagnostic", label: "Diagnostic" },
    ],
  },
  {
    id: "practice", label: "Practice", href: "/practice", icon: "M13 2L4 14h7l-1 8 9-12h-7z", match: /^\/practice/,
    tabs: [
      { href: "/practice", label: "Overview" },
      { href: "/practice/reading", label: "Reading" },
      { href: "/practice/listening", label: "Listening" },
      { href: "/practice/writing", label: "Writing" },
      { href: "/practice/speaking", label: "Speaking" },
      { href: "/practice/mock", label: "Mock Tests" },
    ],
  },
  {
    id: "progress", label: "Progress", href: "/progress", icon: "M3 17l6-6 4 4 8-8M15 7h6v6", match: /^\/(progress|achievements)/,
    tabs: [
      { href: "/progress", label: "Analytics" },
      { href: "/progress/errors", label: "Error Log" },
      { href: "/achievements", label: "Achievements" },
    ],
  },
  { id: "tutor", label: "AI Tutor", href: "/tutor", icon: "M4 5h16v11H9l-5 4zM8 10h8", match: /^\/tutor/ },
];

export function Icon({ d, className = "size-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("shrink-0", className)} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-bold">
      <span className="neu-sm grid size-11 place-items-center rounded-2xl text-base font-extrabold text-primary ring-[1.5px] ring-primary" style={{ boxShadow: "0 0 22px -6px var(--glow), 4px 4px 10px var(--sh-dark)" }}>IA</span>
      <span className="hidden text-lg sm:inline">IELTS Academy</span>
    </Link>
  );
}

/** Pill navigation like the KV guide. `active` = section id. */
export function TopNav({ active, right }: { active?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Logo />
        <nav aria-label="Navigasi utama" className="neu-inset hidden items-center gap-1 rounded-full p-1.5 md:flex">
          {SECTIONS.map((s) => (
            <Link key={s.id} href={s.href} aria-current={active === s.id ? "page" : undefined}
              className={cx("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all duration-300", active === s.id ? "btn-brand text-white" : "text-fg/75 hover:text-fg")}>
              <Icon d={s.icon} className="size-4" />
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open, close]);
  return ref;
}

function Notifications() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const items: { href: string; text: string }[] = [];
  const cid = state.game.challenges[todayKey()];
  if (!cid || state.sessions[cid]?.status !== "submitted") items.push({ href: "/challenge", text: "⚡ Daily Challenge hari ini belum dikerjakan" });
  const due = dueVocab(state).length;
  if (due) items.push({ href: "/learn/vocabulary", text: `🗂️ ${due} kosakata siap direview` });
  for (const w of Object.values(state.writings).filter((x) => x.status === "evaluated").slice(-2)) items.push({ href: `/practice/writing/edit/?id=${w.id}`, text: `✍️ Feedback esai: ${w.prompt.title}` });
  if (!Object.values(state.sessions).some((x) => x.kind === "diagnostic" && x.status === "submitted")) items.unshift({ href: "/diagnostic", text: "🧭 Selesaikan Diagnostic Test" });
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifikasi (${items.length})`} aria-expanded={open} className="neu-sm neu-press relative grid size-11 place-items-center rounded-2xl text-fg/85">
        <Icon d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" className="size-5" />
        {items.length > 0 && <span className="pop absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-extrabold text-white ring-2 ring-bg">{items.length}</span>}
      </button>
      {open && (
        <div className="neu rise absolute right-0 top-14 w-80 rounded-3xl p-3">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">Notifikasi</p>
          {items.length === 0 ? <p className="px-3 pb-3 text-sm text-muted">Semua beres untuk hari ini 🎉</p> : items.map((i) => (
            <Link key={i.href + i.text} href={i.href} onClick={() => setOpen(false)} className="block rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-surface-3">{i.text}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const lv = levelFor(state.game.xp);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Menu profil" aria-expanded={open} className="neu-sm neu-press grid size-11 place-items-center rounded-full text-fg/90">
        <Icon d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" className="size-5" />
      </button>
      {open && (
        <div className="neu rise absolute right-0 top-14 w-72 rounded-3xl p-3">
          <div className="px-3 py-2">
            <p className="font-semibold">{state.profile?.fullName}</p>
            <p className="text-xs text-muted">Lv {lv.level} · {lv.title} · {state.game.xp} XP · 🔥 {streakOf(state)}</p>
            <div className="neu-inset mt-2 h-2 rounded-full"><div className="bar-fill h-full rounded-full" style={{ width: `${lv.progress * 100}%` }} /></div>
          </div>
          {[["/achievements", "🏆 Achievements"], ["/settings", "⚙️ Settings"], ["/settings#backup", "💾 Backup progres"]].map(([h, l]) => (
            <Link key={h} href={h} onClick={() => setOpen(false)} className="block rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-surface-3">{l}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname().replace(/\/$/, "") || "/";
  const section = SECTIONS.find((s) => s.match.test(path)) ?? (path.startsWith("/settings") ? undefined : SECTIONS[0]);
  const tabActive = (href: string) => path === href || (href !== "/practice" && href !== "/learn" && href !== "/progress" && path.startsWith(href + "/"));

  return (
    <div className="flex min-h-dvh flex-col">
      <BackgroundJobs />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">Lewati ke konten</a>
      <TopNav active={section?.id} right={<><Notifications /><ProfileMenu /></>} />
      {section?.tabs && (
        <nav aria-label={`Menu ${section.label}`} className="mx-auto flex w-full max-w-6xl gap-3 overflow-x-auto px-4 pb-3 pt-2 md:px-8">
          {section.tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={tabActive(t.href) ? "page" : undefined}
              className={cx("whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all", tabActive(t.href) ? "bg-primary/12 text-amber ring-[1.5px] ring-primary/60" : "neu-sm neu-press text-fg/75")}>
              {t.label}
            </Link>
          ))}
        </nav>
      )}
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-4 md:px-8 md:pb-12 md:pt-6">{children}</main>
      <nav aria-label="Navigasi bawah" className="neu fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-3xl p-1.5 md:hidden">
        {SECTIONS.map((s) => (
          <Link key={s.id} href={s.href} aria-current={section?.id === s.id ? "page" : undefined} className={cx("flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold transition-all", section?.id === s.id ? "btn-brand text-white" : "text-muted")}>
            <Icon d={s.icon} className="size-5" />
            {s.label === "AI Tutor" ? "Tutor" : s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
