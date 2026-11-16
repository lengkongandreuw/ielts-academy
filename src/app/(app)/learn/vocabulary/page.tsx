"use client";
import { useState } from "react";
import { useAction, useApp } from "@/lib/store";
import { addVocab, dueVocab, reviewVocab } from "@/lib/engine";
import { VOCAB_BY_WORD, VOCAB_LIST } from "@/lib/content";
import { LADDER_DAYS, type Recall } from "@/lib/srs";
import { Badge, Button, Card, Empty, LinkButton, PageHeader, Progress, Stat } from "@/components/ui";

const RECALL: [Recall, string, string][] = [
  ["again", "Lupa", "Muncul lagi sebentar"],
  ["hard", "Sulit", "Jadwal tetap"],
  ["good", "Ingat", "Interval naik"],
  ["easy", "Mudah", "Interval naik 2 tingkat"],
];

export default function Vocabulary() {
  const { state } = useApp();
  const act = useAction();
  const [flip, setFlip] = useState(false);
  const [session, setSession] = useState(0);
  const due = dueVocab(state);
  const all = Object.values(state.vocab);
  const card = due[0];
  const entry = card ? VOCAB_BY_WORD.get(card.word) : undefined;
  const topics = Array.from(new Set(VOCAB_LIST.map((v) => v.topic)));

  function rate(r: Recall) {
    act((s) => reviewVocab(s, card.word, r));
    setFlip(false);
    setSession((n) => n + 1);
  }

  return (
    <div className="fade-in">
      <PageHeader title="Vocabulary Review" subtitle="Flashcard dengan spaced repetition: review setelah 1, 3, 7, 14, lalu 30 hari. Kata yang sering lupa muncul lebih sering." />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card className="p-4"><Stat label="Jatuh tempo" value={due.length} /></Card>
        <Card className="p-4"><Stat label="Di bank" value={all.length} /></Card>
        <Card className="p-4"><Stat label="Mastered" value={all.filter((v) => v.mastered).length} /></Card>
      </div>

      {all.length === 0 ? (
        <Empty title="Bank kosakata masih kosong" action={<LinkButton href="/learn">Ke roadmap</LinkButton>}>Kata baru otomatis masuk setelah Anda menyelesaikan lesson vocabulary. Atau tambahkan satu topik di bawah.</Empty>
      ) : card && entry ? (
        <div className="mx-auto max-w-lg">
          <button onClick={() => setFlip((f) => !f)} className="block w-full rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-line transition-transform hover:-translate-y-0.5" aria-label={flip ? "Kartu terbuka" : "Klik untuk membuka kartu"}>
            <p className="text-xs uppercase tracking-wide text-muted">{entry.topic} · {entry.partOfSpeech} · {entry.cefr}</p>
            <p className="mt-3 text-3xl font-semibold">{entry.word}</p>
            {flip ? (
              <div className="fade-in mt-4 space-y-2 text-sm">
                <p className="text-lg font-medium text-primary">{entry.meaning}</p>
                <p className="italic">{entry.example}</p>
                {entry.collocations.length > 0 && <p className="text-muted">Collocations: {entry.collocations.join(" · ")}</p>}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">Ingat artinya? Klik untuk membuka.</p>
            )}
          </button>
          {flip && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {RECALL.map(([k, l, d]) => (
                <Button key={k} variant={k === "again" ? "danger" : k === "good" ? "primary" : "secondary"} onClick={() => rate(k)} title={d}>{l}</Button>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-xs text-muted">{due.length} kartu tersisa · {session} direview sesi ini · tahap {card.step + 1}/{LADDER_DAYS.length}</p>
        </div>
      ) : (
        <Card className="text-center">
          <p className="text-3xl">✅</p>
          <p className="mt-2 font-semibold">Semua review hari ini selesai!</p>
          <p className="text-sm text-muted">Kartu berikutnya jatuh tempo {all.filter((v) => !v.mastered).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))[0] ? new Date(all.filter((v) => !v.mastered).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))[0].dueAt).toLocaleDateString("id-ID") : "—"}.</p>
        </Card>
      )}

      <Card className="mt-6">
        <p className="mb-3 text-sm font-semibold">Topik kosakata</p>
        <ul className="space-y-2">
          {topics.map((t) => {
            const words = VOCAB_LIST.filter((v) => v.topic === t);
            const have = words.filter((v) => state.vocab[v.word]).length;
            return (
              <li key={t} className="flex items-center gap-3 text-sm">
                <span className="w-28 capitalize">{t}</span>
                <Progress value={(have / words.length) * 100} className="flex-1" label={`Topik ${t}`} />
                <span className="w-12 text-right text-xs text-muted">{have}/{words.length}</span>
                {have < words.length ? <Button size="sm" variant="ghost" onClick={() => act((s) => addVocab(s, words.map((w) => w.word)))}>+ Tambah</Button> : <Badge tone="success">✓</Badge>}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
