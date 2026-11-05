import { useEffect, useMemo, useState } from 'react';
import type { Pokemon, PokemonStats } from '../../domain/pokemon/types';
import { useLocale } from '../../i18n/LocaleProvider';
import { pokemonAbilityName, pokemonMoveName, pokemonNatureName } from '../../i18n/pokemonTerms';
import { SAMPLE_TEMPLATES } from '../core/templates';
import { natureEffects, roleDescriptions, roleLabels, statKeys, statLabels } from '../core/types';
import type { CompetitiveEnvironment, CompetitiveFormat, CompetitivePokemonSet, StatKey } from '../core/types';
import { applyFormSelection, getTrainingRules, megaOptions, MEGA_STONES, MEGA_Z_TYPES, maxAssignablePoints, pointsFor, TERA_TYPES, withStatValue } from '../core/trainingRules';
import { getPokemonProfile, type PokemonAssistProfile } from './pokemonProfile';
import { ITEM_CATALOG, itemDisplay } from './items';
import SearchAssistInput from './SearchAssistInput';

interface Props {
  member: CompetitivePokemonSet;
  pokemon: Pokemon;
  format: CompetitiveFormat;
  environment: CompetitiveEnvironment;
  showLearning: boolean;
  onEdit: (update: (current: CompetitivePokemonSet) => CompetitivePokemonSet) => void;
}

function name(value: string) {
  return value.split('-').map(part => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}
function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function GuidedSetEditor({
  member, pokemon, format, environment, showLearning, onEdit
}: Props) {
  const { locale, t } = useLocale();
  const [profile, setProfile] = useState<PokemonAssistProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [showIvs, setShowIvs] = useState(false);

  useEffect(() => {
    let active = true;
    setProfile(null);
    setProfileStatus('loading');
    void getPokemonProfile(pokemon.id, member.formId).then(data => {
      if (active) { setProfile(data); setProfileStatus('ready'); }
    }).catch(() => {
      if (active) setProfileStatus('error');
    });
    return () => { active = false; };
  }, [pokemon.id, member.formId]);

  // Auto-fill the only available ability after each species/form profile loads.
  // Guard against stale responses when switching slots or Mega forms quickly.
  useEffect(() => {
    if (profileStatus !== 'ready' || !profile ||
        profile.pokemonId !== pokemon.id || profile.formId !== member.formId ||
        profile.abilities.length !== 1) return;

    const onlyAbility = profile.abilities[0];
    if (norm(member.ability) === norm(onlyAbility)) return;
    onEdit(previous => previous.pokemonId === pokemon.id &&
      previous.formId === member.formId
      ? { ...previous, ability: name(onlyAbility) }
      : previous);
  }, [profile, profileStatus, pokemon.id, member.formId, member.ability, onEdit]);

  const training = getTrainingRules(environment);
  const points = pointsFor(member, environment);
  const total = statKeys.reduce((sum, stat) => sum + points[stat], 0);
  const sample = member.templateId
    ? SAMPLE_TEMPLATES.find(template => template.id === member.templateId)
    : undefined;

  const mega = member.formId ? MEGA_STONES[member.formId] : undefined;
  const selectedZTypes = member.formId ? MEGA_Z_TYPES[member.formId] : undefined;
  const currentAbility = profile?.abilities.find(ability => norm(ability) === norm(member.ability));
  const abilityChoice = !member.ability ? '' : currentAbility ?? '__unknown__';
  const extraVarieties = (profile?.availableVarieties ?? [])
    .filter(value => value !== pokemon.name && !value.includes('mega') && !value.includes('gmax'))
    .slice(0,20);

  const itemOptions = useMemo(() => ITEM_CATALOG.map(item => ({
    id: item.id, label: itemDisplay(item.id, locale)
  })),[locale]);

  const moveOptions = useMemo(() => {
    const suggestions = profile?.scarletVioletMoves ?? [];
    const relevant = SAMPLE_TEMPLATES.filter(template => template.pokemonId === pokemon.id && template.format === format)
      .flatMap(template => template.moves);
    return suggestions.map(move => {
      const text = name(move);
      return { id: text, label: pokemonMoveName(move, locale), priority: relevant.some(v => norm(v) === norm(move)) ? 1 : 0 };
    }).sort((a,b) => b.priority-a.priority || a.label.localeCompare(b.label));
  },[profile, pokemon.id, format, locale]);

  const [up,down] = natureEffects[member.nature] ?? [null,null];
  const natureDescription = !up || !down
    ? 'Esta naturaleza no modifica estadísticas.'
    : 'Sube ' + statLabels[up] + ' y baja ' + statLabels[down] + '.';

  function updatePoints(stat: StatKey, raw: string) {
    const numeric = Number(raw);
    const value = Number.isFinite(numeric) ? numeric : 0;
    onEdit(previous => withStatValue(previous, stat, value, environment));
  }
  function updateIV(stat: StatKey, raw: string) {
    const numeric = Number(raw);
    const value = Number.isFinite(numeric) ? numeric : 0;
    onEdit(previous => ({
      ...previous,
      ivs: { ...previous.ivs, [stat]: value } as PokemonStats
    }));
  }

  return (
    <>
      <div className="comp-two-fields">
        <label className="comp-field">Rol
          <select value={member.role} onChange={event =>
            onEdit(prev => ({ ...prev, role: event.target.value as CompetitivePokemonSet['role'] }))}>
            {Object.entries(roleLabels).map(([value,label]) =>
              <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="comp-field">Naturaleza
          <select value={member.nature} onChange={event =>
            onEdit(prev => ({ ...prev, nature: event.target.value }))}>
            {Object.keys(natureEffects).map(value =>
              <option key={value} value={value}>{pokemonNatureName(value, locale)}</option>)}
          </select>
        </label>
      </div>

      <div className={training.canTera ? 'comp-two-fields' : 'comp-two-fields comp-form-only'}>
        <label className="comp-field">Forma del Pokémon
          <select aria-label="Forma del Pokémon" value={member.formId ?? ''}
            onChange={event => onEdit(prev => applyFormSelection(prev,event.target.value,environment))}>
            <option value="">Forma habitual</option>
            {megaOptions(pokemon.id,environment).map(option => (
              <option key={option.id} value={option.id}>{option.label} · {option.stone}</option>
            ))}
            {extraVarieties.filter(v => v !== pokemon.name).map(id => (
              <option key={id} value={id}>{name(id)} · forma de referencia</option>
            ))}
          </select>
        </label>

        {training.canTera ? (
          <label className="comp-field">Tipo Tera
            <select aria-label="Tipo Tera" value={member.teraType ?? ''}
              onChange={event => onEdit(prev => ({
                ...prev, teraType: event.target.value as CompetitivePokemonSet['teraType'] || undefined
              }))}>
              <option value="">Sin asignar</option>
              {TERA_TYPES.map(type => <option key={type} value={type}>{name(type)}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <div className="comp-two-fields">
        <label className="comp-field">Habilidad
          <select aria-label="Habilidad" value={profileStatus === 'ready' ? abilityChoice : ''}
            disabled={profileStatus !== 'ready' || profile?.abilities.length === 1}
            onChange={event => onEdit(prev => ({
              ...prev, ability: name(event.target.value)
            }))}>
            <option value="">
              {profileStatus === 'loading' ? 'Cargando habilidades…'
                : profileStatus === 'error' ? 'No se pudo comprobar esta especie'
                  : 'Selecciona una habilidad'}
            </option>
            {abilityChoice === '__unknown__' && <option value="__unknown__" disabled>
              {member.ability} (no coincide con esta especie)
            </option>}
            {profile?.abilities.map(ability => <option key={ability} value={ability}>
              {pokemonAbilityName(ability, locale) === ability ? name(ability) : pokemonAbilityName(ability, locale)}
            </option>)}
          </select>
          {profileStatus === 'ready' && profile?.abilities.length === 1 &&
            <small className="comp-assist-hint">Habilidad única asignada automáticamente.</small>}
        </label>
        <SearchAssistInput label="Objeto equipado"
          value={mega ? member.item : itemDisplay(member.item,locale)}
          options={itemOptions} placeholder="Busca: res, Restos, Life Orb…"
          disabled={Boolean(mega)}
          onChange={value => onEdit(prev => ({ ...prev, item:value }))}
          hint={mega ? 'La megapiedra se asigna y bloquea automáticamente.'
            : 'El catálogo ofrece objetos frecuentes. Los no incluidos requieren verificación.'}/>
      </div>
      <p className="comp-assist-source" role="status">
        {profileStatus === 'loading'
          ? 'Consultando habilidades y movimientos de PokéAPI…'
          : profileStatus === 'error'
            ? 'Datos de especie no disponibles. Conservamos tu set, pero no podemos verificar habilidad ni movimientos.'
            : selectedZTypes
              ? (mega?.label ?? 'Megaevolución Z') + ': forma y habilidad curadas para Champions. Tipo: ' +
                selectedZTypes.map(type => ({
                  dark: 'Siniestro', ghost: 'Fantasma', dragon: 'Dragón',
                  fighting: 'Lucha', steel: 'Acero'
                } as Record<string, string>)[type] ?? name(type)).join(' / ') +
                '. Los movimientos sugeridos proceden de Escarlata/Púrpura y no certifican legalidad en Champions.'
              : environment === 'mainline'
                ? 'Habilidades de esta especie y movimientos registrados para Escarlata/Púrpura según PokéAPI. No incluye validación de reglamentos.'
                : 'Habilidades de la especie según PokéAPI. Los movimientos recomendados usan referencias de Escarlata/Púrpura, NO una lista legal certificada de Champions.'}
      </p>

      <h3 className="comp-mini-heading">Movimientos</h3>
      {profileStatus === 'ready' && profile?.movesFromBaseSpecies &&
        <p className="comp-assist-hint">Esta Mega no tiene movimientos registrados para Escarlata/Púrpura.
          Se sugieren los de su especie base como referencia didáctica, no como legalidad confirmada de Champions.</p>}
      {profileStatus === 'ready' && profile?.scarletVioletMoves.length === 0 &&
        <p className="comp-assist-hint">No hay movimientos verificados de Escarlata/Púrpura para sugerir.
          Puedes escribir un movimiento manualmente; su legalidad no se ha comprobado.</p>}
      <div className="comp-two-fields">
        {member.moves.map((move,index) => (
          <SearchAssistInput key={index}
            label={'Movimiento ' + (index+1)} value={move}
            options={moveOptions} placeholder="Escribe para buscar movimientos"
            displayValue={value => pokemonMoveName(value, locale)}
            onChange={value => onEdit(prev => ({
              ...prev,
              moves: prev.moves.map((old,i) => i===index ? value : old) as CompetitivePokemonSet['moves']
            }))}
            hint={index===0 && profileStatus === 'ready'
              ? 'Sugerencias por especie; los primeros resultados priorizan ejemplos didácticos.'
              : undefined}/>
        ))}
      </div>

      <h3 className="comp-mini-heading">{training.label} <small>{total} / {training.totalMax}</small></h3>
      <p className="comp-assist-hint" role="status">
        {total >= training.totalMax
          ? total > training.totalMax
            ? 'El reparto supera el máximo. Reduce puntos para corregirlo.'
            : 'Límite alcanzado. Reduce una estadística para subir otra.'
          : 'Disponibles: ' + (training.totalMax - total) + ' ' + training.label + '.'}
      </p>
      <div className="comp-stat-grid">
        {statKeys.map(stat => (
          <label className="comp-field" key={stat}>{statLabels[stat]}
            <input aria-label={training.label + ' ' + statLabels[stat]}
              type="number" min="0" max={maxAssignablePoints(member, stat, environment)} step="1"
              value={points[stat]} onChange={event => updatePoints(stat,event.target.value)} />
          </label>
        ))}
      </div>

      {training.usesIVs &&
        <>
          <button type="button" className="comp-subheading-toggle" aria-expanded={showIvs}
            onClick={() => setShowIvs(value => !value)}>
            {showIvs ? '▾ Ocultar IVs' : '▸ Ajustar IVs (0 a 31)'}
          </button>
          {showIvs && <div className="comp-stat-grid">
            {statKeys.map(stat => (
              <label className="comp-field" key={stat}>{statLabels[stat]}
                <input aria-label={'IV ' + statLabels[stat]} type="number"
                  min="0" max="31" step="1" value={member.ivs[stat]}
                  onChange={event => updateIV(stat,event.target.value)} />
              </label>
            ))}
          </div>}
        </>}

      {showLearning && <div className="comp-lesson">
        <span className="section-kicker">¿POR QUÉ ESTA CONFIGURACIÓN?</span>
        <p><strong>Rol:</strong> {roleDescriptions[member.role]}</p>
        <p><strong>Naturaleza:</strong> {natureDescription}</p>
        <p><strong>{training.label}:</strong> {environment === 'mainline'
          ? 'Hasta 252 por estadística y 510 en total. Cada 4 EVs iniciales aportan el primer punto al nivel 50.'
          : 'Hasta 32 por estadística y 66 puntos en total. Este reparto no elimina tus EVs guardados para la saga principal.'}</p>
        {training.usesIVs && <p><strong>IVs:</strong> valores individuales de 0 a 31.</p>}
        {!training.usesIVs && <p><strong>IVs:</strong> Champions los considera al máximo y no los ajustas manualmente.</p>}
        {sample && <p><strong>Ejemplo:</strong> {sample.lesson}</p>}
        <p><strong>{t('Estadísticas base')}:</strong> {statKeys.map(stat =>
          statLabels[stat] + ' ' + pokemon.stats[stat]).join(' · ')}</p>
      </div>}
    </>
  );
}
