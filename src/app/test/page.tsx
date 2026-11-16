"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { AssessmentRunner } from "@/components/AssessmentRunner";
import { Empty, LinkButton } from "@/components/ui";

const BACK: Record<string, [string, string]> = {
  diagnostic: ["/diagnostic", "Diagnostic"],
  practice: ["/practice/reading", "Latihan"],
  mini: ["/practice/mock", "Mock Tests"],
  mock: ["/practice/mock", "Mock Tests"],
  challenge: ["/dashboard", "Dashboard"],
};

function TestInner() {
  const { state, ready } = useApp();
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const s = state.sessions[id];
  useEffect(() => {
    if (ready && !state.profile?.onboardedAt) router.replace("/onboarding");
  }, [ready, state.profile, router]);
  if (!ready) return <p className="p-8 text-sm text-muted">Memuat…</p>;
  if (!s) return <div className="p-8"><Empty title="Tes tidak ditemukan" action={<LinkButton href="/dashboard">Ke dashboard</LinkButton>}>Tes ini mungkin dibuat di perangkat lain.</Empty></div>;
  const mock = Object.values(state.mocks).find((m) => m.sessionId === id);
  const [href, label] = mock ? [`/practice/mock/run/?id=${mock.id}`, "Mock Test"] : s.kind === "practice" && s.section === "listening" ? ["/practice/listening", "Listening"] : BACK[s.kind];
  return <AssessmentRunner id={id} backHref={href} backLabel={label} onSubmitted={mock ? () => router.push(`/practice/mock/run/?id=${mock.id}`) : undefined} />;
}

export default function TestPage() {
  return (
    <Suspense>
      <TestInner />
    </Suspense>
  );
}
