"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useApp } from "@/lib/store";
import { startMock, startSession } from "@/lib/engine";
import { loadListening } from "@/lib/content";
import { mockScores } from "@/lib/selectors";
import { BandValue, Button, Card, Empty, Notice, PageHeader } from "@/components/ui";

export default function Mock() {
  const { state } = useApp();
  const act = useAction();
  const router = useRouter();
  const minis = Object.values(state.sessions).filter((s) => s.kind === "mini").sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  const mocks = Object.values(state.mocks).sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  const openMini = minis.find((m) => m.status === "in_progress");
  const openMock = mocks.find((m) => m.status === "in_progress");

  function mini() {
    const id = openMini?.id ?? act((s) => startSession(s, { kind: "mini" }, [], true));
    if (id) router.push(`/test/?id=${id}`);
  }
  async function full() {
    const sets = await loadListening();
    const id = act((s) => startMock(s, sets));
    if (id) router.push(`/practice/mock/run/?id=${id}`);
  }

  return (
    <div className="fade-in space-y-4">
      <PageHeader title="Mock Tests" subtitle="Simulasi berwaktu dalam kondisi ujian. Feedback baru muncul setelah tes selesai." />
      <Notice tone="neutral">Semua hasil adalah simulasi, bukan skor IELTS resmi. Overall band hanya dihitung bila Listening, Reading, Writing, dan Speaking semuanya dinilai.</Notice>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="font-semibold">⏱ Mini Test</p>
          <p className="mt-1 text-sm text-muted">1 passage reading + 10 soal grammar/vocabulary. ±30 menit.</p>
          <Button className="mt-4" onClick={mini}>{openMini ? "Lanjutkan" : "Mulai Mini Test"}</Button>
        </Card>
        <Card>
          <p className="font-semibold">🏁 Full Mock Test</p>
          <p className="mt-1 text-sm text-muted">Listening (jika audio tersedia) + 3 passage Reading + Writing Task 2 + Speaking Part 2. ±2,5 jam.</p>
          <Button className="mt-4" onClick={full}>{openMock ? "Lanjutkan" : "Mulai Full Mock"}</Button>
        </Card>
      </div>

      <h2 className="pt-4 text-base font-semibold">Riwayat</h2>
      {mocks.length === 0 && minis.length === 0 ? <Empty title="Belum ada mock test">Skor tersimpan di sini agar Anda bisa membandingkan antar tes.</Empty> : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr className="border-b border-line"><th className="px-4 py-2 font-medium">Tes</th><th className="px-2 py-2 font-medium">Tanggal</th><th className="px-2 py-2 font-medium">L</th><th className="px-2 py-2 font-medium">R</th><th className="px-2 py-2 font-medium">W</th><th className="px-2 py-2 font-medium">S</th><th className="px-2 py-2 font-medium">Overall</th></tr></thead>
            <tbody>
              {mocks.map((m) => {
                const sc = mockScores(state, m.id);
                return (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-2"><Link href={`/practice/mock/run/?id=${m.id}`} className="text-primary hover:underline">Full Mock</Link>{m.status === "in_progress" && " (berjalan)"}</td>
                    <td className="px-2 py-2 text-muted">{new Date(m.startedAt).toLocaleDateString("id-ID")}</td>
                    {[sc.listening, sc.reading, sc.writing, sc.speaking].map((v, i) => <td key={i} className="px-2 py-2 tabular-nums"><BandValue value={m.status === "submitted" ? v : null} notAssessedLabel="–" /></td>)}
                    <td className="px-2 py-2 font-semibold tabular-nums"><BandValue value={m.status === "submitted" ? sc.overall : null} notAssessedLabel="–" /></td>
                  </tr>
                );
              })}
              {minis.map((x) => (
                <tr key={x.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2"><Link href={`/test/?id=${x.id}`} className="text-primary hover:underline">Mini Test</Link>{x.status === "in_progress" && " (berjalan)"}</td>
                  <td className="px-2 py-2 text-muted">{new Date(x.startedAt).toLocaleDateString("id-ID")}</td>
                  <td className="px-2 py-2">–</td>
                  <td className="px-2 py-2 tabular-nums">{x.result ? `${x.result.objective.accuracy}%` : "–"}</td>
                  <td className="px-2 py-2">–</td><td className="px-2 py-2">–</td><td className="px-2 py-2">–</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
