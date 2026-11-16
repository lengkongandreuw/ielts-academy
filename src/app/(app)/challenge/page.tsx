"use client";
import { useRouter } from "next/navigation";
import { useAction, useApp } from "@/lib/store";
import { startChallenge, todayKey } from "@/lib/engine";
import { Button, Card, LinkButton, PageHeader } from "@/components/ui";

export default function Challenge() {
  const { state } = useApp();
  const act = useAction();
  const router = useRouter();
  const sid = state.game.challenges[todayKey()];
  const s = sid ? state.sessions[sid] : undefined;
  const history = Object.entries(state.game.challenges).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  function go() {
    const id = act((d) => startChallenge(d));
    if (id) router.push(`/test/?id=${id}`);
  }
  return (
    <div className="fade-in">
      <PageHeader title="⚡ Daily Challenge" subtitle="5 soal cepat setiap hari dari materi yang sudah terbuka — topik yang sering salah muncul lebih dulu." />
      <Card className="text-center">
        {s?.status === "submitted" ? (
          <>
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-lg font-semibold">Tantangan hari ini selesai: {s.result!.objective.correct}/{s.result!.objective.total} benar</p>
            <p className="text-sm text-muted">Kembali besok untuk tantangan baru dan jaga streak Anda.</p>
            <LinkButton href={`/test/?id=${s.id}`} variant="secondary" className="mt-4">Lihat pembahasan</LinkButton>
          </>
        ) : (
          <>
            <p className="text-4xl">⚡</p>
            <p className="mt-2 text-lg font-semibold">Siap? 5 soal, sekitar 3 menit.</p>
            <p className="text-sm text-muted">Hadiah: +40 XP, ditambah +2 XP per jawaban benar.</p>
            <Button className="mt-4" onClick={go}>{s ? "Lanjutkan" : "Mulai tantangan"}</Button>
          </>
        )}
      </Card>
      {history.length > 0 && (
        <Card className="mt-4">
          <p className="mb-2 text-sm font-semibold">Riwayat 14 hari</p>
          <ul className="flex flex-wrap gap-2">
            {history.map(([d, id]) => {
              const r = state.sessions[id]?.result;
              return (
                <li key={d} className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs">
                  <span className="text-muted">{d.slice(5)}</span> {r ? `${r.objective.correct}/${r.objective.total}` : "–"}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
