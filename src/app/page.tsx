"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { BASE_PATH } from "@/lib/content";
import { Icon, TopNav } from "@/components/AppShell";
import { cx } from "@/components/ui";

const HERO_MASK = "radial-gradient(ellipse 58% 70% at 50% 40%, #000 38%, rgba(0,0,0,.6) 60%, transparent 82%)";

const CARDS = [
  { href: "/diagnostic", title: "Diagnostic Test", desc: "Ukur kemampuan awal Anda", icon: "M5 20V10M10 20V4M15 20v-7M20 20v-4" },
  { href: "/learn", title: "Rencana 112 Hari", desc: "Roadmap menuju Band 7.0", icon: "M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z" },
  { href: "/practice", title: "Latihan IELTS", desc: "Listening · Reading · Writing · Speaking", icon: "M13 2L4 14h7l-1 8 9-12h-7z" },
  { href: "/progress", title: "Progress", desc: "Pantau perkembangan Anda", icon: "M3 17l6-6 4 4 8-8M15 7h6v6" },
];

export default function Landing() {
  const { state, ready } = useApp();
  const onboarded = ready && !!state.profile?.onboardedAt;
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <TopNav
        active="home"
        right={
          <Link href={onboarded ? "/settings" : "/onboarding"} aria-label={onboarded ? "Profil" : "Mulai"} className="grid size-10 place-items-center rounded-full bg-surface-2 ring-1 ring-line hover:ring-primary/60">
            <Icon d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" className="size-5" />
          </Link>
        }
      />

      <main className="relative mx-auto max-w-6xl px-4 md:px-8">
        <section className="relative grid items-center gap-6 pt-6 md:min-h-[600px] md:grid-cols-[1.05fr_1fr] md:pt-0">
          {/* Portrait: the KV photo, its orange backdrop melting into the dark page */}
          <div className="pointer-events-none relative order-first -mx-4 h-[420px] sm:h-[480px] md:absolute md:inset-y-0 md:right-[-6%] md:order-none md:mx-0 md:h-auto md:w-[62%]" aria-hidden>
            <div className="absolute left-1/2 top-[45%] h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(255,106,0,.55), rgba(255,106,0,0))" }} />
            <picture>
              <source media="(max-width: 767px)" srcSet={`${BASE_PATH}/images/putra-hero-640.webp`} />
              <img
                src={`${BASE_PATH}/images/putra-hero.webp`}
                alt=""
                className="relative h-full w-full object-cover object-[50%_15%]"
                style={{ maskImage: HERO_MASK, WebkitMaskImage: HERO_MASK }}
              />
            </picture>
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg to-transparent" />
          </div>

          <div className="relative z-10 -mt-24 md:mt-0 md:py-24">
            <p className="eyebrow text-fg/80">
              IELTS Academic <span className="mx-2 text-muted">·</span> <span className="text-brand">Target Band 7.0</span>
            </p>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-[4.2rem]">
              Belajar IELTS
              <br />
              secara <span className="text-brand" style={{ textShadow: "0 0 40px var(--glow)" }}>personal.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Rencana belajar terstruktur, latihan interaktif, dan evaluasi cerdas—semua dalam satu platform.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={onboarded ? "/dashboard" : "/onboarding"} className="btn-brand inline-flex h-14 items-center gap-3 rounded-2xl px-8 text-base font-bold text-white">
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 001.5.86l12.5-7.5a1 1 0 000-1.72L8.5 3.64A1 1 0 007 4.5z" /></svg>
                Mulai Belajar
              </Link>
              <Link href={onboarded ? "/dashboard" : "/onboarding#restore"} className="inline-flex h-14 items-center rounded-2xl bg-surface/90 px-8 text-base font-bold text-fg ring-1 ring-line backdrop-blur hover:ring-primary/60">
                Lanjutkan Progres
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">Gratis · tanpa akun · progres tersimpan di perangkat Anda</p>
          </div>
        </section>

        <section aria-label="Fitur" className="relative z-10 grid gap-4 pb-12 pt-8 sm:grid-cols-2 lg:grid-cols-4 md:pt-0">
          {CARDS.map((c, i) => (
            <Link key={c.href} href={c.href}
              className={cx("group flex items-end justify-between gap-3 rounded-2xl bg-surface/90 p-6 ring-1 backdrop-blur transition-all hover:-translate-y-0.5", i === 0 ? "ring-brand" : "ring-line hover:ring-primary/60")}>
              <div>
                <Icon d={c.icon} className="size-7 text-primary" />
                <p className="mt-4 text-lg font-bold">{c.title}</p>
                <p className="mt-1 text-sm text-muted">{c.desc}</p>
              </div>
              <span className="mb-6 text-fg/80 transition-transform group-hover:translate-x-1">
                <Icon d="M5 12h14M13 6l6 6-6 6" className="size-5" />
              </span>
            </Link>
          ))}
        </section>

        <footer className="border-t border-line/60 py-8 text-xs leading-relaxed text-muted">
          IELTS Academy tidak berafiliasi dengan penyelenggara IELTS. Semua estimasi skor bersifat simulasi dan bukan skor IELTS resmi. Materi ditulis sendiri untuk platform ini.
        </footer>
      </main>
    </div>
  );
}
