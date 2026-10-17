"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { isOwnerToken, isUuid } from "@/lib/ids";

const STORAGE_KEY = "hearth.v1";
const LIST_LIMIT = 300;

type Store = {
  clientId: string;
  savedIds: string[];
  prayedIds: string[];
  owned: Record<string, string>;
};

type BrowserStoreValue = {
  ready: boolean;
  savedIds: string[];
  ownedIds: string[];
  isSaved: (id: string) => boolean;
  isPrayed: (id: string) => boolean;
  isOwned: (id: string) => boolean;
  ownerToken: (id: string) => string | null;
  toggleSaved: (id: string) => void;
  markPrayed: (id: string) => void;
  rememberOwned: (id: string, token: string) => boolean;
  ensureClientId: () => string;
};

const EMPTY_STORE: Store = {
  clientId: "",
  savedIds: [],
  prayedIds: [],
  owned: {},
};

const BrowserStoreContext = createContext<BrowserStoreValue | null>(null);

const listeners = new Set<() => void>();
let memoryOverride: Store | null = null;
let snapshot: Store = EMPTY_STORE;
let snapshotRaw: string | null | undefined;

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && isUuid(item) && !ids.includes(item)) ids.push(item);
  }
  return ids.slice(0, LIST_LIMIT);
}

function parseStore(raw: string): Store {
  try {
    const parsed = JSON.parse(raw) as Partial<Store>;
    const owned: Record<string, string> = {};
    if (parsed.owned && typeof parsed.owned === "object") {
      for (const [id, token] of Object.entries(parsed.owned)) {
        if (isUuid(id) && typeof token === "string" && isOwnerToken(token)) {
          owned[id] = token;
        }
      }
    }
    return {
      clientId:
        typeof parsed.clientId === "string" && isUuid(parsed.clientId) ? parsed.clientId : "",
      savedIds: uniqueIds(parsed.savedIds),
      prayedIds: uniqueIds(parsed.prayedIds),
      owned,
    };
  } catch {
    return EMPTY_STORE;
  }
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStore(store: Store): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

function getSnapshot(): Store {
  if (memoryOverride) return memoryOverride;
  const raw = readRaw();
  if (raw === snapshotRaw) return snapshot;
  snapshotRaw = raw;
  snapshot = raw ? parseStore(raw) : EMPTY_STORE;
  return snapshot;
}

function getServerSnapshot(): Store {
  return EMPTY_STORE;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    memoryOverride = null;
    snapshotRaw = undefined;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emptySubscribe() {
  return () => {};
}

function currentStore(): Store {
  return memoryOverride ?? getSnapshot();
}

function commit(next: Store): boolean {
  const ok = writeStore(next);
  if (ok) {
    memoryOverride = null;
    snapshot = next;
    snapshotRaw = readRaw();
  } else {
    memoryOverride = next;
  }
  emit();
  return ok;
}

function ensureClientId(): string {
  const base = currentStore();
  if (base.clientId) return base.clientId;
  const next = { ...base, clientId: crypto.randomUUID() };
  commit(next);
  return next.clientId;
}

export function BrowserStoreProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const savedIds = store.savedIds;
  const ownedIds = Object.keys(store.owned).reverse();

  const value = useMemo<BrowserStoreValue>(
    () => ({
      ready,
      savedIds,
      ownedIds,
      isSaved: (id) => savedIds.includes(id),
      isPrayed: (id) => store.prayedIds.includes(id),
      isOwned: (id) => Boolean(store.owned[id]),
      ownerToken: (id) => store.owned[id] ?? null,
      toggleSaved: (id) => {
        if (!isUuid(id)) return;
        const base = currentStore();
        const has = base.savedIds.includes(id);
        commit({
          ...base,
          savedIds: has
            ? base.savedIds.filter((savedId) => savedId !== id)
            : [id, ...base.savedIds].slice(0, LIST_LIMIT),
        });
      },
      markPrayed: (id) => {
        if (!isUuid(id)) return;
        const base = currentStore();
        if (base.prayedIds.includes(id)) return;
        commit({ ...base, prayedIds: [...base.prayedIds, id].slice(-LIST_LIMIT) });
      },
      rememberOwned: (id, token) => {
        if (!isUuid(id) || !isOwnerToken(token)) return false;
        const base = currentStore();
        return commit({ ...base, owned: { ...base.owned, [id]: token } });
      },
      ensureClientId,
    }),
    [ownedIds, ready, savedIds, store],
  );

  return <BrowserStoreContext.Provider value={value}>{children}</BrowserStoreContext.Provider>;
}

export function useBrowserStore(): BrowserStoreValue {
  const context = useContext(BrowserStoreContext);
  if (!context) {
    throw new Error("useBrowserStore must be used within BrowserStoreProvider");
  }
  return context;
}
