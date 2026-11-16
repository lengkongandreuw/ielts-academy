// Lightweight accessible SVG charts (no dependencies). Every chart has a text alternative.
import { Empty } from "./ui";

export function Bars({ data, unit = "", height = 140, label }: { data: { label: string; value: number }[]; unit?: string; height?: number; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.every((d) => d.value === 0)) return <Empty title="Belum ada data">Data akan muncul setelah Anda mulai belajar.</Empty>;
  return (
    <figure aria-label={label}>
      <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.label} className="group flex h-full flex-1 flex-col justify-end">
            <div className="relative w-full rounded-t-md bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}>
              <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-muted opacity-0 group-hover:opacity-100">
                {d.value}
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function HBars({ data, max = 100, unit = "%", label }: { data: { label: string; value: number; sub?: string }[]; max?: number; unit?: string; label: string }) {
  if (data.length === 0) return <Empty title="Belum ada data" />;
  return (
    <ul className="space-y-2.5" aria-label={label}>
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{d.label}</span>
            <span className="tabular-nums text-muted">
              {d.value}
              {unit}
              {d.sub ? ` · ${d.sub}` : ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (d.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const COLORS = ["#2f6fde", "#d9822b", "#2a9d6f", "#b5479a", "#6b7280", "#c0352b"];

export function Lines({ series, min = 0, max = 9, label, unit = "" }: { series: { name: string; points: { at: string; value: number }[] }[]; min?: number; max?: number; label: string; unit?: string }) {
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) return <Empty title="Belum ada riwayat skor">Kerjakan diagnostic, latihan, atau mock test untuk melihat perkembangan.</Empty>;
  const times = all.map((p) => +new Date(p.at));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times, t0 + 1);
  const W = 600;
  const H = 180;
  const x = (t: number) => 30 + ((t - t0) / (t1 - t0)) * (W - 50);
  const y = (v: number) => H - 20 - ((v - min) / (max - min)) * (H - 40);
  const ticks = max <= 9 ? [0, 3, 5, 7, 9] : [0, 25, 50, 75, 100];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label}. ${series.map((s) => `${s.name}: ${s.points.map((p) => p.value + unit).join(", ")}`).join("; ")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={30} x2={W - 10} y1={y(t)} y2={y(t)} stroke="var(--border)" />
            <text x={4} y={y(t) + 4} fontSize={10} fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {series.map((s, i) => (
          <g key={s.name}>
            <polyline fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} points={s.points.map((p) => `${x(+new Date(p.at))},${y(p.value)}`).join(" ")} />
            {s.points.map((p, j) => (
              <circle key={j} cx={x(+new Date(p.at))} cy={y(p.value)} r={3.5} fill={COLORS[i % COLORS.length]}>
                <title>{`${s.name}: ${p.value}${unit} (${new Date(p.at).toLocaleDateString("id-ID")})`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
