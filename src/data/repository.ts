import { get, set, del } from 'idb-keyval';
import type { LogRepository } from './LogRepository';
import type { Log, LogPatch } from './types';

/**
 * Web/PWA repository backed by IndexedDB via idb-keyval.
 * On native we'll add `repository.native.ts` using expo-sqlite later; metro
 * will pick the right one via the platform extensions in metro.config.js.
 *
 * In-memory cache layered on top so render paths don't hit IDB on every read.
 */

const STORAGE_KEY = 'osheet:logs:v1';

let cache: Log[] | null = null;
let hydration: Promise<Log[]> | null = null;

async function hydrate(): Promise<Log[]> {
  if (cache !== null) return cache;
  if (hydration) return hydration;
  hydration = (async () => {
    try {
      const stored = (await get<Log[]>(STORAGE_KEY)) ?? [];
      cache = stored;
      return stored;
    } catch {
      cache = [];
      return [];
    }
  })();
  return hydration;
}

async function persist(): Promise<void> {
  if (!cache) return;
  await set(STORAGE_KEY, cache);
}

function newId(): string {
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const repository: LogRepository = {
  async list() {
    return hydrate();
  },

  async add(log) {
    const logs = await hydrate();
    const full = { ...log, id: log.id ?? newId(), ts: log.ts ?? Date.now() } as Log;
    cache = [...logs, full];
    await persist();
    return full;
  },

  async update(id, patch) {
    const logs = await hydrate();
    cache = logs.map((l) => (l.id === id ? ({ ...l, ...patch } as Log) : l));
    await persist();
  },

  async delete(id) {
    const logs = await hydrate();
    cache = logs.filter((l) => l.id !== id);
    await persist();
  },

  async clear() {
    cache = [];
    try {
      await del(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

export function getRepository(): LogRepository {
  return repository;
}

/** Test-only — resets the in-memory cache, does not touch storage. */
export function __resetCacheForTests() {
  cache = null;
  hydration = null;
}
