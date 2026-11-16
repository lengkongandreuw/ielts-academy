"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { state, ready } = useApp();
  const router = useRouter();
  const onboarded = !!state.profile?.onboardedAt;
  useEffect(() => {
    if (ready && !onboarded) router.replace("/onboarding");
  }, [ready, onboarded, router]);
  if (!ready || !onboarded)
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted" role="status">
        Memuat progres…
      </div>
    );
  return <AppShell>{children}</AppShell>;
}
