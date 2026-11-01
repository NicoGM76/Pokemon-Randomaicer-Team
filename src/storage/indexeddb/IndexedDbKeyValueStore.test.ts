import { afterEach, describe, expect, it, vi } from 'vitest';
import { IndexedDbKeyValueStore } from './IndexedDbKeyValueStore';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('IndexedDbKeyValueStore', () => {
  it('exposes the async key-value API', () => {
    const store = new IndexedDbKeyValueStore('pokemon-test', 'cache');
    expect(typeof store.get).toBe('function');
    expect(typeof store.set).toBe('function');
    expect(typeof store.delete).toBe('function');
  });

  it('fails closed when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const store = new IndexedDbKeyValueStore('pokemon-test', 'cache');

    await expect(store.get('meta')).resolves.toBeNull();
    await expect(store.set('meta', { version: 1 })).resolves.toBe(false);
    await expect(store.delete('meta')).resolves.toBe(false);
  });
});
