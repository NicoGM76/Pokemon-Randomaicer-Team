// @ts-nocheck
import type { EvolutionCondition } from '../domain/evolution/types';

export interface GeneratedSnapshot {
  pokemon: Array<{ id: number; name: string; [key: string]: unknown }>;
  forms: Array<{ id: string; pokemonId: number; [key: string]: unknown }>;
  evolutions: Array<{ fromId: number; toId: number; conditions: EvolutionCondition[] }>;
}

export interface UpdateReport {
  newSpecies: number[];
  newForms: string[];
  changedEvolutionChains: string[];
  unknownConditions: string[];
  curatedGaps: string[];
}

const stable = (value: unknown) => JSON.stringify(value);

export function buildUpdateReport(current: GeneratedSnapshot, incoming: GeneratedSnapshot): UpdateReport {
  const currentPokemon = new Set(current.pokemon.map(item => item.id));
  const currentForms = new Set(current.forms.map(item => item.id));
  const currentEvolutions = new Map(current.evolutions.map(item => [`${item.fromId}>${item.toId}`, stable(item.conditions)]));

  const changedEvolutionChains: string[] = [];
  for (const step of incoming.evolutions) {
    const key = `${step.fromId}>${step.toId}`;
    const before = currentEvolutions.get(key);
    if (before !== undefined && before !== stable(step.conditions)) changedEvolutionChains.push(key);
    if (before === undefined) changedEvolutionChains.push(key);
  }

  const newSpecies = incoming.pokemon.filter(item => !currentPokemon.has(item.id)).map(item => item.id).sort((a,b)=>a-b);
  const newForms = incoming.forms.filter(item => !currentForms.has(item.id)).map(item => item.id).sort();

  return {
    newSpecies,
    newForms,
    changedEvolutionChains: [...new Set(changedEvolutionChains)].sort(),
    unknownConditions: [],
    curatedGaps: [
      ...newSpecies.map(id => `availability:pokemon:${id}`),
      ...newForms.map(id => `form-review:${id}`)
    ]
  };
}

export function normalizeEvolutionDetail(detail: any): { conditions: EvolutionCondition[]; unknownConditions: string[] } {
  const conditions: EvolutionCondition[] = [];
  const unknownConditions: string[] = [];
  const trigger = detail?.trigger?.name;

  if (detail?.min_level != null) conditions.push({ type: 'level', minLevel: Number(detail.min_level) });
  if (detail?.item?.name) conditions.push({ type: 'item', itemId: detail.item.name });
  if (detail?.time_of_day === 'day' || detail?.time_of_day === 'night' || detail?.time_of_day === 'dusk') conditions.push({ type: 'time', value: detail.time_of_day });
  if (detail?.gender === 1) conditions.push({ type: 'gender', value: 'female' });
  if (detail?.gender === 2) conditions.push({ type: 'gender', value: 'male' });
  if (detail?.known_move?.name) conditions.push({ type: 'move_known', moveId: detail.known_move.name });

  if (trigger === 'trade') conditions.push({ type: 'trade' });
  else if (trigger === 'use-item') {
    if (!detail?.item?.name) unknownConditions.push('trigger:use-item-without-item');
  } else if (trigger === 'level-up' || trigger == null) {
    // Other structured fields above describe the level-up condition.
  } else {
    unknownConditions.push(`trigger:${trigger}`);
  }

  return { conditions, unknownConditions };
}
