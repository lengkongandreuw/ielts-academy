"use client";
// IELTS Academy design system — dark neuromorphic components.
import Link from "next/link";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btn = (v: BtnVariant = "primary", size: "sm" | "md" | "lg" = "md") =>
  cx(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-bold select-none disabled:pointer-events-none disabled:opacity-45",
    size === "sm" ? "h-9 px-4 text-sm" : size === "lg" ? "h-14 px-8 text-base" : "h-12 px-6 text-sm",
    v === "primary" && "btn-brand text-white",
    v === "secondary" && "neu-sm neu-press text-fg",
    v === "ghost" && "neu-press text-fg ring-1 ring-line hover:ring-primary/60",
    v === "danger" && "neu-press bg-danger-soft text-danger ring-1 ring-danger/30",
  );

export function Button({ variant, size, className, ...p }: ComponentProps<"button"> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return <button className={cx(btn(variant, size), className)} {...p} />;
}
export function LinkButton({ variant, size, className, ...p }: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return <Link className={cx(btn(variant, size), className)} {...p} />;
}

/** Raised neuromorphic card. `interactive` adds hover lift + press. */
export function Card({ className, interactive, ...p }: ComponentProps<"div"> & { interactive?: boolean }) {
  return <div className={cx("neu rounded-3xl p-6", interactive && "neu-press", className)} {...p} />;
}

export function SectionTitle({ children, action, icon }: { children: ReactNode; action?: ReactNode; icon?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-lg font-bold">
        {icon && <Icon d={icon} className="size-5 text-primary" />}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, emoji }: { title: string; subtitle?: ReactNode; action?: ReactNode; emoji?: string }) {
  return (
    <div className="rise mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {emoji && <span className="float inline-block" aria-hidden>{emoji}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-2xl text-base text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Icon({ d, className = "size-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("shrink-0", className)} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";
/** Chip / badge. */
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
        tone === "neutral" && "bg-surface-2 text-muted ring-line",
        tone === "primary" && "bg-primary/12 text-amber ring-primary/45",
        tone === "success" && "bg-success/10 text-success ring-success/35",
        tone === "warning" && "bg-warning/10 text-warning ring-warning/35",
        tone === "danger" && "bg-danger/10 text-danger ring-danger/35",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Inset track with an ember fill that animates in. */
export function Progress({ value, className, label, showValue }: { value: number; className?: string; label?: string; showValue?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(v));
    return () => cancelAnimationFrame(t);
  }, [v]);
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <div className="neu-inset h-3 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="bar-fill h-full rounded-full" style={{ width: `${w}%` }} />
      </div>
      {showValue && <span className="w-10 text-right text-sm font-bold tabular-nums">{Math.round(v)}%</span>}
    </div>
  );
}

export function Empty({ title, children, action, emoji = "🌱" }: { title: string; children?: ReactNode; action?: ReactNode; emoji?: string }) {
  return (
    <div className="neu-inset rounded-3xl p-8 text-center">
      <p className="float text-4xl" aria-hidden>{emoji}</p>
      <p className="mt-3 font-bold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "primary", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "fade-in rounded-2xl px-5 py-4 text-sm ring-1",
        tone === "primary" && "bg-primary/10 ring-primary/35",
        tone === "success" && "bg-success/10 ring-success/30",
        tone === "warning" && "bg-warning/10 ring-warning/30",
        tone === "danger" && "bg-danger/10 ring-danger/35",
        tone === "neutral" && "neu-inset ring-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Pressed-in input field. */
export const inputCls = "neu-inset h-12 w-full rounded-2xl border-0 px-4 text-[15px] text-fg placeholder:text-muted/70 outline-none transition-shadow focus:shadow-[inset_4px_4px_10px_var(--sh-dark),inset_-3px_-3px_8px_var(--sh-light),0_0_0_2px_var(--primary)]";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx("relative h-8 w-14 shrink-0 rounded-full transition-colors", checked ? "btn-brand" : "neu-inset")}>
      <span className={cx("absolute top-1 size-6 rounded-full bg-white shadow-md transition-all duration-300", checked ? "left-7" : "left-1 bg-surface-3")} />
    </button>
  );
}

/** Metric card from the design system (icon + label + big value + optional delta chip). */
export function Metric({ icon, label, value, sub, delta }: { icon: string; label: string; value: ReactNode; sub?: ReactNode; delta?: string }) {
  return (
    <div className="neu rise flex items-center gap-4 rounded-3xl p-5">
      <span className="neu-inset grid size-12 shrink-0 place-items-center rounded-2xl text-primary"><Icon d={icon} className="size-6" /></span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="flex items-baseline gap-2 text-2xl font-extrabold tabular-nums">
          {value}
          {delta && <span className="rounded-full bg-success/12 px-2 py-0.5 text-xs font-bold text-success">{delta}</span>}
        </p>
        {sub && <p className="truncate text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}

/** Legacy stat (kept for analytics pages). */
export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Big friendly tile used for main activities: icon top-left, arrow right. */
export function Tile({ href, icon, title, desc, active, badge }: { href: string; icon: string; title: string; desc?: string; active?: boolean; badge?: ReactNode }) {
  return (
    <Link href={href} className={cx("group neu neu-press relative flex min-h-[132px] flex-col justify-between gap-4 rounded-3xl p-5", active && "ring-brand")}>
      <div className="flex items-start justify-between">
        <span className={cx("grid size-12 place-items-center rounded-2xl text-primary", active ? "bg-primary/15" : "neu-inset")}><Icon d={icon} className="size-6" /></span>
        {badge}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-tight">{title}</p>
          {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
        </div>
        <Icon d="M5 12h14M13 6l6 6-6 6" className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}

/** Renders the lesson markdown subset: **bold**, *italic*, paragraphs, "- " lists. */
export function Rich({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\n+/);
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) =>
      part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : part,
    );
  return (
    <div className={cx("prose-lesson", className)}>
      {paras.map((p, i) => {
        const lines = p.split("\n");
        if (lines.every((l) => l.trim().startsWith("- ")))
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2))}</li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {inline(l)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Small celebration burst (pure CSS). */
export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const colors = ["#ff6a00", "#ffb347", "#ff7a5c", "#f5f5f5", "#5ee49a"];
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/3 z-[70]" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const r = 120 + (i % 5) * 30;
        return (
          <span key={i} className="absolute block size-2.5 rounded-sm"
            style={{ background: colors[i % colors.length], animation: `confetti 1.1s ease-out ${i * 8}ms forwards`, ["--dx" as string]: `${Math.cos(a) * r}px`, ["--dy" as string]: `${Math.sin(a) * r + 80}px`, ["--rot" as string]: `${i * 47}deg` }} />
        );
      })}
    </div>
  );
}

export const OFFICIAL_NOTE = "Estimasi non-resmi — bukan skor IELTS resmi.";

export function BandValue({ value, notAssessedLabel = "Not Assessed" }: { value: number | null | undefined; notAssessedLabel?: string }) {
  if (value === null || value === undefined) return <span className="text-base font-semibold text-muted">{notAssessedLabel}</span>;
  return <>{value.toFixed(1)}</>;
}
