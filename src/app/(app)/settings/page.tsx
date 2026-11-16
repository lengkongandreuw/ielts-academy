"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { blobStore, useApp } from "@/lib/store";
import { emptyState } from "@/lib/types";
import { MODELS, aiReady, testKey } from "@/lib/ai";
import { ProfileForm } from "@/components/ProfileForm";
import { BackupButtons } from "@/components/Backup";
import { Badge, Button, Card, Field, Notice, PageHeader, SectionTitle, cx, inputCls } from "@/components/ui";

export default function Settings() {
  const { state, update, replaceAll, toast } = useApp();
  const router = useRouter();
  const [key, setKey] = useState(state.settings.apiKey);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState<null | "run" | "ok" | string>(null);

  function setTheme(t: "system" | "light" | "dark") {
    update((s) => { s.settings.theme = t; });
    try { if (t === "system") localStorage.removeItem("ia-theme"); else localStorage.setItem("ia-theme", t); } catch {}
    if (t === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }
  async function saveKey() {
    update((s) => { s.settings.apiKey = key.trim(); });
    if (!key.trim()) return toast("API key dihapus. Fitur AI dinonaktifkan.");
    setTesting("run");
    try {
      await testKey({ ...state.settings, apiKey: key.trim() });
      setTesting("ok");
    } catch (e) {
      setTesting(e instanceof Error ? e.message : "Gagal");
    }
  }
  async function wipe() {
    if (!confirm("Hapus SEMUA progres, esai, rekaman, dan pengaturan di perangkat ini? Ini tidak bisa dibatalkan. Unduh backup dulu jika perlu.")) return;
    await blobStore.clear().catch(() => {});
    await replaceAll(emptyState());
    try { localStorage.clear(); } catch {}
    router.replace("/");
  }

  return (
    <div className="fade-in space-y-4">
      <PageHeader title="Settings" />
      <Card>
        <SectionTitle>Profil & target</SectionTitle>
        <ProfileForm mode="settings" />
      </Card>

      <Card id="ai">
        <SectionTitle action={aiReady(state.settings) ? <Badge tone="success">Aktif</Badge> : <Badge>Nonaktif</Badge>}>AI Tutor & evaluasi (opsional)</SectionTitle>
        <p className="text-sm text-muted">Fitur AI memakai <strong>API key Claude milik Anda sendiri</strong> (buat di console.anthropic.com). Key hanya disimpan di browser ini, tidak ikut backup, dan hanya dikirim langsung ke api.anthropic.com. Biaya pemakaian ditagih ke akun API Anda. Tanpa key, semua fitur lain tetap berfungsi.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="API key" htmlFor="key">
            <div className="flex gap-2">
              <input id="key" type={show ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" spellCheck={false} className={inputCls} />
              <Button variant="ghost" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan key" : "Tampilkan key"}>{show ? "🙈" : "👁"}</Button>
            </div>
          </Field>
          <div className="flex items-end"><Button onClick={saveKey} disabled={testing === "run"}>{testing === "run" ? "Menguji…" : "Simpan & uji"}</Button></div>
        </div>
        {testing === "ok" && <Notice tone="success" className="mt-3">API key berfungsi. AI Tutor dan evaluasi aktif.</Notice>}
        {testing && testing !== "ok" && testing !== "run" && <Notice tone="danger" className="mt-3">{testing}</Notice>}
        <Field label="Model" htmlFor="model">
          <select id="model" className={cx(inputCls, "mt-1 max-w-md")} value={state.settings.model} onChange={(e) => update((s) => { s.settings.model = e.target.value; })}>
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>
        <p className="mt-3 text-xs text-muted">Privasi: yang dikirim ke AI hanya teks yang relevan (pertanyaan Anda, esai, transkrip speaking, ringkasan profil & kesalahan). Rekaman audio tidak pernah dikirim.</p>
      </Card>

      <Card>
        <SectionTitle>Tampilan & suara</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {([["system", "Ikuti sistem"], ["light", "Terang"], ["dark", "Gelap"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTheme(k)} className={cx("rounded-full px-4 py-1.5 text-sm", state.settings.theme === k ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted")}>{l}</button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[var(--primary)]" checked={state.settings.sound} onChange={(e) => update((s) => { s.settings.sound = e.target.checked; })} />
          Bunyi singkat saat mendapat XP / badge
        </label>
        <p className="mt-3 text-sm text-muted">Mikrofon: izin diminta saat Anda pertama kali merekam di Speaking Practice. Ubah izin lewat ikon gembok di address bar browser.</p>
      </Card>

      <Card id="backup">
        <SectionTitle>Backup & pindah perangkat</SectionTitle>
        <p className="mb-3 text-sm text-muted">Semua progres tersimpan di browser ini. Unduh backup secara berkala, lalu pulihkan di perangkat/browser lain. Rekaman audio tidak ikut dalam backup.</p>
        <BackupButtons />
      </Card>

      <Card>
        <SectionTitle>Privacy & data</SectionTitle>
        <p className="text-sm text-muted">Data Anda tidak dikirim ke server mana pun — tidak ada akun dan tidak ada database online. Anda bisa menghapus rekaman satu per satu di halaman Speaking, atau menghapus semuanya di sini.</p>
        <Button variant="danger" className="mt-3" onClick={wipe}>Hapus semua data di perangkat ini</Button>
      </Card>
    </div>
  );
}
