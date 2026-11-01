import type { DraftEnvelope } from './types';

const memoryFallback = new Map<string, string>();

function browserStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const probe = '__pokemon_draft_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export class LocalDraftStore<T> {
  constructor(
    private readonly key: string,
    private readonly version: number
  ) {}

  load(): T | null {
    try {
      const storage = browserStorage();
      const raw = storage?.getItem(this.key) ?? memoryFallback.get(this.key) ?? null;
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<DraftEnvelope<T>> | null;
      if (!parsed || parsed.version !== this.version || !('value' in parsed)) return null;
      return parsed.value as T;
    } catch {
      return null;
    }
  }

  save(value: T): void {
    try {
      const raw = JSON.stringify({ version: this.version, value } satisfies DraftEnvelope<T>);
      const storage = browserStorage();
      if (storage) storage.setItem(this.key, raw);
      else memoryFallback.set(this.key, raw);
    } catch {
      // Draft persistence must never make the UI fail.
    }
  }

  clear(): void {
    try {
      const storage = browserStorage();
      storage?.removeItem(this.key);
    } catch {
      // Ignore unavailable browser storage.
    }
    memoryFallback.delete(this.key);
  }
}
