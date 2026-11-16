"use client";
// Browser persistence (IndexedDB) + React context. All learner data stays on this device.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { current, isDraft, produce } from "immer";
import { emptyState, type AppState } from "./types";
import { EngineError, settleBadges } from "./engine";
import { BADGES } from "./game";

const DB_NAME = "ielts-academy";
const STATE_KEY = "state";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("kv");
      req.result.createObjectStore("blobs");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idb<T>(store: "kv" | "blobs", mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result as T);
    tx.onerror = () => reject(tx.error);
  });
}
export const blobStore = {
  put: (id: string, b: Blob) => idb<void>("blobs", "readwrite", (s) => s.put(b, id)),
  get: (id: string) => idb<Blob | undefined>("blobs", "readonly", (s) => s.get(id)),
  del: (id: string) => idb<void>("blobs", "readwrite", (s) => s.delete(id)),
  clear: () => idb<void>("blobs", "readwrite", (s) => s.clear()),
};

/** Fill in fields added in newer versions so old saves keep working. */
export function migrate(raw: unknown): AppState {
  const base = emptyState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppState>;
  return { ...base, ...r, skill: { ...base.skill, ...r.skill }, game: { ...base.game, ...r.game }, settings: { ...base.settings, ...r.settings }, version: 1 };
}

type Toast = { id: number; text: string; kind: "xp" | "badge" | "error" | "info" };
type Ctx = {
  state: AppState;
  ready: boolean;
  /** Apply an engine mutation. Returns the mutation's return value; throws EngineError with a learner-friendly message. */
  update: <T>(fn: (draft: AppState) => T) => T;
  toast: (text: string, kind?: Toast["kind"]) => void;
  replaceAll: (s: AppState) => Promise<void>;
  storageError: string | null;
};
const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

let audioCtx: AudioContext | null = null;
function chime(high: boolean) {
  try {
    audioCtx ??= new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = high ? 880 : 660;
    g.gain.setValueAtTime(0.08, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.26);
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const ref = useRef(state);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);

  const toast = useCallback((text: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "badge" ? 5000 : 2600);
  }, []);

  const persist = useCallback(async () => {
    try {
      await idb("kv", "readwrite", (s) => s.put(ref.current, STATE_KEY));
      channel.current?.postMessage("saved");
      setStorageError(null);
    } catch {
      setStorageError("Gagal menyimpan ke penyimpanan browser. Pastikan tidak dalam mode private dan ruang penyimpanan cukup.");
    }
  }, []);

  const schedule = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, 250);
  }, [persist]);

  const load = useCallback(async () => {
    try {
      const raw = await idb<unknown>("kv", "readonly", (s) => s.get(STATE_KEY));
      const s = migrate(raw);
      ref.current = s;
      setState(s);
      document.documentElement.dataset.theme = s.settings.theme === "system" ? "" : s.settings.theme;
      if (s.settings.theme === "system") delete document.documentElement.dataset.theme;
    } catch {
      setStorageError("Penyimpanan browser tidak tersedia. Progres tidak akan tersimpan.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
    try {
      channel.current = new BroadcastChannel("ielts-academy");
      channel.current.onmessage = () => load(); // another tab saved → reload
    } catch {}
    const flush = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        persist();
      }
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      channel.current?.close();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [load, persist]);

  const update = useCallback(<T,>(fn: (d: AppState) => T): T => {
    let out!: T;
    const before = ref.current;
    const next = produce(before, (d) => {
      const r = fn(d as AppState);
      // Never let an immer draft escape (it is revoked after produce).
      out = (isDraft(r) ? current(r) : r) as T;
      settleBadges(d as AppState);
    });
    if (next !== before) {
      ref.current = next;
      setState(next);
      schedule();
      // Rewards feedback
      const gained = next.game.xp - before.game.xp;
      const unlocked = Object.keys(next.game.badges).filter((b) => !before.game.badges[b]);
      if (gained > 0) toast(`+${gained} XP`, "xp");
      for (const b of unlocked) {
        const meta = BADGES.find((x) => x.id === b);
        if (meta) toast(`${meta.icon} Badge baru: ${meta.name}`, "badge");
      }
      if (next.settings.sound && (gained > 0 || unlocked.length)) chime(unlocked.length > 0);
    }
    return out;
  }, [schedule, toast]);

  const replaceAll = useCallback(async (s: AppState) => {
    ref.current = s;
    setState(s);
    await persist();
  }, [persist]);

  return (
    <AppCtx.Provider value={{ state, ready, update, toast, replaceAll, storageError }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`fade-in rounded-full px-4 py-2 text-sm font-medium shadow-lg ${t.kind === "xp" ? "bg-primary text-primary-fg" : t.kind === "badge" ? "bg-warning-soft text-fg ring-1 ring-warning" : t.kind === "error" ? "bg-danger text-white" : "bg-surface text-fg ring-1 ring-line"}`}>
            {t.text}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}

/** Run an engine action and turn EngineErrors into a toast. Returns undefined on failure. */
export function useAction() {
  const { update, toast } = useApp();
  return useCallback(<T,>(fn: (d: AppState) => T): T | undefined => {
    try {
      return update(fn);
    } catch (e) {
      toast(e instanceof EngineError ? e.message : "Terjadi kesalahan.", "error");
      if (!(e instanceof EngineError)) console.error(e);
      return undefined;
    }
  }, [update, toast]);
}

export function exportState(s: AppState) {
  const data = { ...s, settings: { ...s.settings, apiKey: "" } }; // the API key never leaves the device
  return new Blob([JSON.stringify({ app: "ielts-academy", exportedAt: new Date().toISOString(), data }, null, 1)], { type: "application/json" });
}

export function parseImport(text: string): AppState {
  const j = JSON.parse(text);
  if (j?.app !== "ielts-academy" || !j.data || typeof j.data !== "object") throw new Error("File bukan backup IELTS Academy.");
  return migrate(j.data);
}
