"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { exportState, parseImport, useApp } from "@/lib/store";
import { Button, Notice } from "./ui";

export function BackupButtons({ allowExport = true }: { allowExport?: boolean }) {
  const { state, replaceAll, toast } = useApp();
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  function download() {
    const url = URL.createObjectURL(exportState(state));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ielts-academy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup diunduh.");
  }
  async function restore(f: File) {
    setErr(null);
    try {
      const next = parseImport(await f.text());
      if (state.profile && !confirm("Progres di perangkat ini akan diganti dengan isi backup. Lanjutkan?")) return;
      // Keep this device's API key; backups never contain it.
      await replaceAll({ ...next, settings: { ...next.settings, apiKey: state.settings.apiKey } });
      toast("Backup dipulihkan.");
      router.replace(next.profile?.onboardedAt ? "/dashboard" : "/onboarding");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "File tidak valid.");
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {allowExport && <Button onClick={download}>⬇ Unduh backup</Button>}
        <Button variant="secondary" onClick={() => file.current?.click()}>⬆ Pulihkan dari file</Button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
      </div>
      {err && <Notice tone="danger" className="mt-3">{err}</Notice>}
    </div>
  );
}
