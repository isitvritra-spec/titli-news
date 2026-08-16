"use client";

import { useSyncExternalStore } from "react";

/**
 * A device-only bookmark list — no accounts on web, so this is plain
 * localStorage rather than a server-synced preference. Mirrors the role
 * apps/mobile/lib/savedCards.ts plays there, just backed by a browser API
 * instead of AsyncStorage/React Query. useSyncExternalStore (not useState +
 * useEffect) so every SaveButton/ShareButton on a feed page reacts to a
 * toggle anywhere else on the same page, and the `storage` event covers
 * changes made in another tab.
 */
const STORAGE_KEY = "titli-saved-cards";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedIds: string[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Stable array reference unless the underlying storage value changed — required for useSyncExternalStore to avoid re-render loops. */
function getSnapshot(): string[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    cachedIds = raw ? JSON.parse(raw) : EMPTY;
  } catch {
    cachedIds = EMPTY;
  }
  return cachedIds;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function writeIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) callback();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSavedCardIds(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useToggleSaved() {
  return (id: string) => {
    const current = getSnapshot();
    const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    writeIds(next);
  };
}
