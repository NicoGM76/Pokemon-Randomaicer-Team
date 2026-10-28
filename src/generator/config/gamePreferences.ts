export function defaultOnlyCurrentGeneration(gameId: string, generation: number): boolean {
  if (generation <= 1) return false;
  return gameId === 'black' || gameId === 'white';
}
