import type { PokemonStats, PokemonType } from '../../domain/pokemon/types';

export type CompetitiveFormat = 'singles' | 'doubles';
export type CompetitiveEnvironment = 'mainline' | 'champions';
export type CompetitiveRole = 'physical' | 'special' | 'wall' | 'support' | 'pivot' | 'speed_control';
export type StatKey = keyof PokemonStats;

export interface CompetitivePokemonSet {
  pokemonId: number;
  role: CompetitiveRole;
  nature: string;
  ability: string;
  item: string;
  moves: [string, string, string, string];
  evs: PokemonStats;
  ivs: PokemonStats;
  locked: boolean;
  templateId?: string;
  /** Champions PC are independent of mainline EVs, so switching never loses data. */
  championsPoints?: PokemonStats;
  formId?: string;
  teraType?: PokemonType;
}

export type CompetitiveTeam = (CompetitivePokemonSet | null)[];

export interface CompetitiveWorkspace {
  format: CompetitiveFormat;
  showLearning: boolean;
  selectedSlot: number;
  teams: Record<CompetitiveFormat, CompetitiveTeam>;
  environmentByFormat?: Record<CompetitiveFormat, CompetitiveEnvironment>;
}

export interface CompetitiveTemplate {
  id: string;
  format: CompetitiveFormat;
  pokemonId: number;
  role: CompetitiveRole;
  nature: string;
  ability: string;
  item: string;
  moves: [string, string, string, string];
  evs: Partial<PokemonStats>;
  ivs?: Partial<PokemonStats>;
  lesson: string;
}

export interface CompetitiveIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  slot?: number;
}

export const statKeys: StatKey[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
export const statLabels: Record<StatKey, string> = {
  hp: 'PS', attack: 'Ataque', defense: 'Defensa',
  specialAttack: 'At. Esp.', specialDefense: 'Def. Esp.', speed: 'Velocidad'
};
export const roleLabels: Record<CompetitiveRole, string> = {
  physical: 'Atacante físico', special: 'Atacante especial', wall: 'Muro defensivo',
  support: 'Apoyo', pivot: 'Pivote', speed_control: 'Control de velocidad'
};
export const roleDescriptions: Record<CompetitiveRole, string> = {
  physical: 'Presiona usando Ataque y movimientos físicos.',
  special: 'Presiona usando Ataque Especial y movimientos especiales.',
  wall: 'Aguanta golpes para proteger al resto del equipo.',
  support: 'Ayuda con estados, redirección, recuperación u otras herramientas.',
  pivot: 'Cambia el ritmo del combate y facilita entradas seguras.',
  speed_control: 'Modifica quién actúa primero con herramientas como Tailwind o Trick Room.'
};

export const natureEffects: Record<string, [StatKey | null, StatKey | null]> = {
  Hardy: [null, null], Lonely: ['attack', 'defense'], Brave: ['attack', 'speed'],
  Adamant: ['attack', 'specialAttack'], Naughty: ['attack', 'specialDefense'],
  Bold: ['defense', 'attack'], Docile: [null, null], Relaxed: ['defense', 'speed'],
  Impish: ['defense', 'specialAttack'], Lax: ['defense', 'specialDefense'],
  Timid: ['speed', 'attack'], Hasty: ['speed', 'defense'], Serious: [null, null],
  Jolly: ['speed', 'specialAttack'], Naive: ['speed', 'specialDefense'],
  Modest: ['specialAttack', 'attack'], Mild: ['specialAttack', 'defense'],
  Quiet: ['specialAttack', 'speed'], Bashful: [null, null],
  Rash: ['specialAttack', 'specialDefense'],
  Calm: ['specialDefense', 'attack'], Gentle: ['specialDefense', 'defense'],
  Sassy: ['specialDefense', 'speed'], Careful: ['specialDefense', 'specialAttack'],
  Quirky: [null, null]
};
