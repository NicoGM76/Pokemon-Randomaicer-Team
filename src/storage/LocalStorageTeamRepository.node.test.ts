// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageTeamRepository } from './LocalStorageTeamRepository';

class MemoryStorage {
  map = new Map();
  getItem(k){ return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k,v){ this.map.set(k, String(v)); }
  removeItem(k){ this.map.delete(k); }
}

const team = id => ({
  id,
  name: `Team ${id}`,
  createdAt: '2026-10-23',
  gameId: 'g',
  config: {
    gameId: 'g',
    enabledContentPacks: ['base'],
    teamSize: 1,
    stage: 'main_story',
    mode: 'random',
    allowedMethods: ['wild'],
    allowTradeEvolution: false,
    starterRule: 'allow',
    legendaryRule: 'allow'
  },
  team: []
});

test('saves lists and replaces team by id', () => {
  const s = new MemoryStorage();
  const r = new LocalStorageTeamRepository(s);
  r.save(team('1'));
  r.save(team('2'));
  r.save({ ...team('1'), name: 'Updated' });
  const all = r.getAll();
  assert.equal(all.length, 2);
  assert.equal(all.find(x => x.id === '1').name, 'Updated');
});

test('deletes a saved team', () => {
  const s = new MemoryStorage();
  const r = new LocalStorageTeamRepository(s);
  r.save(team('1'));
  r.save(team('2'));
  r.delete('1');
  assert.deepEqual(r.getAll().map(x => x.id), ['2']);
});

test('malformed storage is handled defensively', () => {
  const s = new MemoryStorage();
  s.setItem('patg:saved-teams:v1', 'not json');
  const r = new LocalStorageTeamRepository(s);
  assert.deepEqual(r.getAll(), []);
});

test('falls back to memory when browser localStorage access is denied', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('localStorage denied');
    }
  });

  try {
    const r = new LocalStorageTeamRepository();
    r.save(team('1'));
    assert.deepEqual(r.getAll().map(x => x.id), ['1']);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
