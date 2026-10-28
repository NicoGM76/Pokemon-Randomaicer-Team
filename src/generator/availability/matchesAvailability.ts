import type { Availability, ContentPack } from '../../domain/games/types';
import type { GeneratorConfig } from '../../domain/teams/types';

function progressAllows(pack: ContentPack, config: GeneratorConfig): boolean {
  switch (pack.unlockCondition ?? 'none') {
    case 'none':
    case 'early_story':
      return true;
    case 'main_story_completed':
    case 'postgame':
      return config.stage === 'postgame' || config.stage === 'all';
  }
}

export function matchesAvailability(
  rule: Availability,
  config: GeneratorConfig,
  contentPacks: ContentPack[]
): boolean {
  if (rule.gameId !== config.gameId) return false;
  if (!config.allowedMethods.includes(rule.method)) return false;
  if (config.stage !== 'all' && rule.stage !== config.stage) return false;
  if (!config.enabledContentPacks.includes(rule.contentPackId)) return false;

  const pack = contentPacks.find(item => item.id === rule.contentPackId);
  if (!pack || pack.gameId !== config.gameId) return false;

  for (const dependency of pack.requiredContentPacks ?? []) {
    if (!config.enabledContentPacks.includes(dependency)) return false;
  }

  return progressAllows(pack, config);
}
