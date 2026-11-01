/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalDraftStore } from './LocalDraftStore';

interface TestDraft {
  game: string;
  size: number;
}

beforeEach(() => {
  localStorage.clear();
});

describe('LocalDraftStore', () => {
  it('saves and restores a draft with the expected version', () => {
    const store = new LocalDraftStore<TestDraft>('draft:test', 2);
    store.save({ game: 'scarlet', size: 6 });

    expect(store.load()).toEqual({ game: 'scarlet', size: 6 });
    expect(JSON.parse(localStorage.getItem('draft:test')!)).toEqual({
      version: 2,
      value: { game: 'scarlet', size: 6 }
    });
  });

  it('rejects drafts from another version', () => {
    localStorage.setItem('draft:test', JSON.stringify({ version: 1, value: { game: 'red', size: 3 } }));
    const store = new LocalDraftStore<TestDraft>('draft:test', 2);

    expect(store.load()).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    localStorage.setItem('draft:test', '{bad-json');
    const store = new LocalDraftStore<TestDraft>('draft:test', 1);

    expect(() => store.load()).not.toThrow();
    expect(store.load()).toBeNull();
  });

  it('clears the persisted draft', () => {
    const store = new LocalDraftStore<TestDraft>('draft:test', 1);
    store.save({ game: 'white', size: 6 });
    store.clear();

    expect(store.load()).toBeNull();
    expect(localStorage.getItem('draft:test')).toBeNull();
  });
});
