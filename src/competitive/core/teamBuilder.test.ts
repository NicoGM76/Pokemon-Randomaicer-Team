import { describe, expect, it } from 'vitest';
import type { Pokemon } from '../../domain/pokemon/types';
import { createManualSet, generateCompetitiveTeam, regenerateCompetitiveSlot } from './teamBuilder';
import { SAMPLE_TEMPLATES } from './templates';

const roster = [...new Set(SAMPLE_TEMPLATES.map(template => template.pokemonId))].map(id => ({
  id, name: 'pokemon-' + id, types: ['normal'], introducedGeneration: 9,
  evolutionFamilyId: String(id), specialTags: [], isPseudoLegendary: false,
  isFossil: false, isStarter: false,
  stats: { hp: 80, attack: 100, defense: 90, specialAttack: 80, specialDefense: 85, speed: 90 }
})) as Pokemon[];

describe('V2.1 educational team builder', () => {
  it.each(['singles', 'doubles'] as const)('generates six unique species for %s', format => {
    const team = generateCompetitiveTeam(format, roster, undefined, () => 0.42);
    expect(team).toHaveLength(6);
    expect(team.every(Boolean)).toBe(true);
    expect(new Set(team.map(member => member?.pokemonId)).size).toBe(6);
    for (const member of team) {
      expect(member?.moves).toHaveLength(4);
      expect(member?.evs).toBeDefined();
      expect(member?.ivs).toBeDefined();
    }
    if (format === 'doubles') {
      expect(new Set(team.map(member => member?.item)).size).toBe(6);
    }
  });

  it('preserves a locked manual Pokemon during regeneration', () => {
    const fixed = { ...createManualSet(roster[0]), locked: true };
    const team = generateCompetitiveTeam('singles', roster, [fixed, null, null, null, null, null], () => 0.1);
    expect(team[0]).toEqual(fixed);
    const again = generateCompetitiveTeam('singles', roster, team, () => 0.9);
    expect(again[0]).toEqual(fixed);
    expect(new Set(again.filter(Boolean).map(member => member!.pokemonId)).size).toBe(6);
  });

  it('rerolls one unlocked slot without touching other members', () => {
    const team = generateCompetitiveTeam('doubles', roster, undefined, () => 0.2);
    const before = team[0];
    const rerolled = regenerateCompetitiveSlot('doubles', roster, team, 0, () => 0.9);
    expect(rerolled[0]?.pokemonId).not.toBe(before?.pokemonId);
    expect(rerolled.slice(1)).toEqual(team.slice(1));
    expect(new Set(rerolled.filter(Boolean).map(member => member!.item)).size).toBe(6);
    if (before) {
      const locked = [{ ...before, locked: true }, ...team.slice(1)];
      expect(regenerateCompetitiveSlot('doubles', roster, locked, 0)).toEqual(locked);
    }
  });

  it('creates blank editable moves rather than inventing legality for arbitrary Pokemon', () => {
    const manual = createManualSet(roster[0]);
    expect(manual.moves).toEqual(['', '', '', '']);
    expect(manual.ivs.speed).toBe(31);
    expect(Object.values(manual.evs).reduce((sum, count) => sum + count, 0)).toBeLessThanOrEqual(510);
    expect(manual.templateId).toBeUndefined();
  });
});
