export interface LevelCondition { type: 'level'; minLevel: number; }
export interface ItemCondition { type: 'item'; itemId: string; }
export interface TradeCondition { type: 'trade'; }
export interface FriendshipCondition { type: 'friendship'; minFriendship?: number; }
export interface TimeCondition { type: 'time'; value: 'day' | 'night' | 'dusk'; }
export interface GenderCondition { type: 'gender'; value: 'male' | 'female'; }
export interface MoveKnownCondition { type: 'move_known'; moveId: string; }
export interface GameCondition { type: 'game'; gameIds: string[]; }
export interface SpecialCondition { type: 'special'; conditionId: string; }

export type EvolutionCondition =
  | LevelCondition | ItemCondition | TradeCondition | FriendshipCondition
  | TimeCondition | GenderCondition | MoveKnownCondition | GameCondition | SpecialCondition;

export interface EvolutionStep {
  fromId: number;
  toId: number;
  conditions: EvolutionCondition[];
}

export interface ReachableEvolution {
  pokemonId: number;
  path: EvolutionStep[];
}
