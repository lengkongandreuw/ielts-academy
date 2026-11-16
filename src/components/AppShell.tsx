"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { levelFor } from "@/lib/game";
import { streakOf } from "@/lib/engine";
import { BackgroundJobs } from "./BackgroundJobs";
import { useEffect, useState } from "react";
import { cx } from "./ui";

type Item = { href: string; label: string; icon: string };
const NAV: { title?: string; items: Item[] }[] = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
      { href: "/challenge", label: "Daily Challenge", icon: "M13 2L4 14h7l-1 8 9-12h-7z" },
    ],
  },
  {
    title: "My Learning",
    items: [
      { href: "/learn", label: "Curriculum Roadmap", icon: "M4 6h16M4 12h10M4 18h7" },
      { href: "/learn/vocabulary", label: "Vocabulary Review", icon: "M5 4h10l4 4v12H5zM9 12h6M9 16h6" },
      { href: "/diagnostic", label: "Diagnostic Test", icon: "M9 5h6M8 3h8v4H8zM6 7h12v14H6z" },
    ],
  },
  {
    title: "IELTS Practice",
    items: [
      { href: "/practice/reading", label: "Reading", icon: "M4 5h7v14H4zM13 5h7v14h-7z" },
      { href: "/practice/listening", label: "Listening", icon: "M4 14v-2a8 8 0 0116 0v2M4 14h3v6H4zM17 14h3v6h-3z" },
      { href: "/practice/writing", label: "Writing", icon: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4" },
      { href: "/practice/speaking", label: "Speaking", icon: "M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4" },
      { href: "/practice/mock", label: "Mock Tests", icon: "M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" },
    ],
  },
  { title: "Support", items: [{ href: "/tutor", label: "AI Tutor", icon: "M4 5h16v11H8l-4 4zM8 10h8" }] },
  {
    title: "My Progress",
    items: [
      { href: "/progress", label: "Skill Analytics", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
      { href: "/progress/errors", label: "Error Log", icon: "M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" },
      { href: "/achievements", label: "Achievements", icon: "M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" },
    ],
  },
  { items: [{ href: "/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 000 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" }] },
];
const MOBILE: Item[] = [NAV[0].items[0], NAV[0].items[1], NAV[1].items[0], NAV[3].items[0], NAV[4].items[0]];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state } = useApp();
  const lv = levelFor(state.game.xp);
  const streak = streakOf(state);
  const name = state.profile?.fullName ?? "";
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("ia-sidebar") === "1");
    } catch {}
  }, []);
  useEffect(() => setDrawer(false), [path]);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("ia-sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };
  const active = (href: string) => (href === "/learn" ? path === "/learn" || /^\/learn\/W\d/.test(path) : href === "/progress" ? path === "/progress" : path === href || path.startsWith(href + "/"));
  const groups = NAV;

  const nav = (compact: boolean) => (
    <nav aria-label="Navigasi utama" className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
      {groups.map((g, i) => (
        <div key={i}>
          {g.title && !compact && <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  title={compact ? it.label : undefined}
                  aria-current={active(it.href) ? "page" : undefined}
                  className={cx("flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors", active(it.href) ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-fg", compact && "justify-center")}
                >
                  <Icon d={it.icon} />
                  {!compact && <span className="truncate">{it.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <BackgroundJobs />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Lewati ke konten
      </a>
      {/* Desktop sidebar */}
      <aside className={cx("sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface md:flex", collapsed ? "w-[68px]" : "w-60")}>
        <div className={cx("flex h-14 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-fg">IA</span>
          {!collapsed && <span className="font-semibold">IELTS Academy</span>}
        </div>
        {nav(collapsed)}
        <div className="border-t border-line p-3">
          {!collapsed && (
            <Link href="/achievements" className="mb-2 block rounded-lg px-2 py-1.5 hover:bg-surface-2">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-xs text-muted">Lv {lv.level} · {lv.title} · 🔥 {streak}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${lv.progress * 100}%` }} /></div>
            </Link>
          )}
          <button onClick={toggle} className="w-full rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-2" aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}>
            {collapsed ? "»" : "« Ciutkan"}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="font-semibold">IELTS Academy</span>
              <button onClick={() => setDrawer(false)} className="rounded p-2 text-muted" aria-label="Tutup menu">
                ✕
              </button>
            </div>
            {nav(false)}
            <div className="border-t border-line p-3 text-sm text-muted">{name} · Lv {lv.level} · {state.game.xp} XP</div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur md:hidden">
          <button onClick={() => setDrawer(true)} className="-ml-2 rounded p-2" aria-label="Buka menu">
            <Icon d="M4 6h16M4 12h16M4 18h16" />
          </button>
          <span className="font-semibold">IELTS Academy</span>
          <Link href="/achievements" className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Lv {lv.level} · 🔥{streak}</Link>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
        <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface md:hidden">
          {MOBILE.map((it) => (
            <Link key={it.href} href={it.href} aria-current={active(it.href) ? "page" : undefined} className={cx("flex flex-col items-center gap-0.5 py-2 text-[10px]", active(it.href) ? "text-primary" : "text-muted")}>
              <Icon d={it.icon} />
              {it.label.split(" ")[0]}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
