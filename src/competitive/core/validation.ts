import { natureEffects, statKeys } from './types';
import { getTrainingRules, MEGA_STONES, pointsFor, TERA_TYPES } from './trainingRules';
import type { CompetitiveEnvironment, CompetitiveFormat, CompetitiveIssue, CompetitivePokemonSet, CompetitiveTeam } from './types';

export function validateCompetitiveTeam(
  format: CompetitiveFormat, team: CompetitiveTeam, environment: CompetitiveEnvironment = 'mainline'
): CompetitiveIssue[] {
  const rules = getTrainingRules(environment);
  const issues: CompetitiveIssue[] = [];
  const members = team.slice(0, 6).filter((slot): slot is CompetitivePokemonSet => slot !== null);
  if (members.length < 6) {
    issues.push({ code: 'incomplete_team', severity: 'warning',
      message: 'Equipo incompleto: ' + members.length + '/6 Pokémon.' });
  }

  const species = new Map<number, number>();
  const items = new Map<string, number>();
  team.slice(0, 6).forEach((member, slot) => {
    if (!member) return;
    if (!Number.isInteger(member.pokemonId) || member.pokemonId < 1) {
      issues.push({ code: 'invalid_species', severity: 'error', slot, message: 'La especie no es válida.' });
    }
    if (species.has(member.pokemonId)) {
      issues.push({ code: 'duplicate_species', severity: 'error', slot,
        message: 'No se puede repetir una especie dentro del equipo.' });
    } else species.set(member.pokemonId, slot);

    const item = member.item.trim().toLocaleLowerCase();
    if ((format === 'doubles' || environment === 'champions') && item) {
      if (items.has(item)) {
        issues.push({ code: 'duplicate_item', severity: 'error', slot,
          message: 'En Dobles no repitas el mismo objeto equipado.' });
      } else items.set(item, slot);
    }
    if (!item || !member.ability.trim()) {
      issues.push({ code: 'missing_details', severity: 'warning', slot,
        message: 'Completa objeto y habilidad. Su legalidad todavía no se comprueba.' });
    }
    if (!Object.prototype.hasOwnProperty.call(natureEffects, member.nature)) {
      issues.push({ code: 'invalid_nature', severity: 'error', slot, message: 'Naturaleza desconocida.' });
    }

    const points = pointsFor(member, environment);
    let pointsTotal = 0;
    for (const stat of statKeys) {
      const current = points[stat];
      if (!Number.isInteger(current) || current < 0 || current > rules.statMax) {
        issues.push({
          code: environment === 'mainline' ? 'ev_per_stat' : 'stat_per_stat',
          severity: 'error', slot,
          message: 'Cada ' + rules.label + ' debe ser un entero entre 0 y ' + rules.statMax + ' (' + stat + ').'
        });
      }
      if (Number.isFinite(current)) pointsTotal += current;
      if (rules.usesIVs) {
        const iv = member.ivs[stat];
        if (!Number.isInteger(iv) || iv < 0 || iv > 31) {
          issues.push({ code: 'iv_range', severity: 'error', slot,
            message: 'Cada IV debe ser un entero entre 0 y 31 (' + stat + ').' });
        }
      }
    }
    if (pointsTotal > rules.totalMax) {
      issues.push({
        code: environment === 'mainline' ? 'ev_total' : 'stat_total',
        severity: 'error', slot,
        message: rules.label + ' suman ' + pointsTotal + '/' + rules.totalMax + '.'
      });
    }

    const mega = member.formId ? MEGA_STONES[member.formId] : undefined;
    if (mega && (environment !== 'champions' || mega.pokemonId !== member.pokemonId)) {
      issues.push({ code: 'incompatible_mega', severity: 'error', slot,
        message: 'La forma Mega no corresponde a este Pokémon o a este juego.' });
    }
    if (mega && environment === 'champions' && item !== mega.stone.toLowerCase()) {
      issues.push({ code: 'mega_stone', severity: 'error', slot,
        message: 'Esta Megaevolución necesita llevar ' + mega.stone + '.' });
    }
    if (member.teraType && environment === 'mainline' && !TERA_TYPES.includes(member.teraType as typeof TERA_TYPES[number])) {
      issues.push({ code: 'invalid_tera_type', severity: 'error', slot,
        message: 'Tipo Tera no válido.' });
    }

    const moves = member.moves.map(move => move.trim()).filter(Boolean);
    if (moves.length < 4) {
      issues.push({ code: 'missing_moves', severity: 'warning', slot,
        message: 'Faltan movimientos (' + moves.length + '/4).' });
    }
    if (new Set(moves.map(move => move.toLocaleLowerCase())).size < moves.length) {
      issues.push({ code: 'duplicate_moves', severity: 'error', slot,
        message: 'Un Pokémon no puede repetir el mismo movimiento.' });
    }
  });
  return issues;
}
