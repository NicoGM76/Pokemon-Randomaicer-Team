import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import pokemonCatalog from '../data/generated/pokemon.json';
import { useLocale } from '../i18n/LocaleProvider';
import type { Locale } from '../i18n/LocaleProvider';
import { pokemonAbilityName, pokemonMoveName, pokemonNatureName } from '../i18n/pokemonTerms';
import { itemDisplay } from './assist/items';
import type { Pokemon } from '../domain/pokemon/types';
import { analyzeCompetitiveTeam } from './core/analysis';
import PokemonSpeciesPicker from './PokemonSpeciesPicker';
import { baseArtworkUrl, memberArtworkUrl, memberDisplayName } from './memberArtwork';
import { createManualSet, generateCompetitiveTeam, regenerateCompetitiveSlot } from './core/teamBuilder';
import GuidedSetEditor from './assist/GuidedSetEditor';
import { getTrainingRules, pointsFor } from './core/trainingRules';
import LoadFailureBoundary from '../error/LoadFailureBoundary';
import { roleLabels, statKeys, statLabels } from './core/types';
import type {
  CompetitiveEnvironment, CompetitiveFormat, CompetitivePokemonSet, CompetitiveTeam, CompetitiveWorkspace
} from './core/types';
import { validateCompetitiveTeam } from './core/validation';
import {
  loadCompetitiveDraft, removeUnknownPokemon, saveCompetitiveDraft
} from './competitiveDraft';
import './competitive.css';

const MetaInsightsPanel = lazy(() => import('./meta/MetaInsightsPanel'));

const pokemon = pokemonCatalog as unknown as Pokemon[];
const sortedPokemon = [...pokemon].sort((a, b) => a.id - b.id);
const lookup = new Map(pokemon.map(entry => [entry.id, entry]));
const knownIds = new Set(lookup.keys());

function niceName(name: string): string {
  return name.split('-').map(part => part.length ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}

const pokemonOptions = sortedPokemon.map(entry => (
  <option key={entry.id} value={entry.id}>#{entry.id} · {niceName(entry.name)}</option>
));

function formatTitle(format: CompetitiveFormat): string {
  return format === 'singles' ? 'Singles 6v6' : 'Dobles estilo VGC';
}

function showText(team: CompetitiveTeam, environment: CompetitiveEnvironment, locale: Locale): string {
  return team.filter((member): member is CompetitivePokemonSet => member !== null).map(member => {
    const entry = lookup.get(member.pokemonId);
    const assigned = pointsFor(member, environment);
    const evs = statKeys.filter(stat => assigned[stat] > 0)
      .map(stat => assigned[stat] + ' ' + statLabels[stat]).join(' / ');
    const ivs = statKeys.filter(stat => member.ivs[stat] !== 31)
      .map(stat => member.ivs[stat] + ' ' + statLabels[stat]).join(' / ');
    return [
      (entry ? niceName(entry.name) : '#' + member.pokemonId) + (member.item ? ' @ ' + itemDisplay(member.item, locale) : ''),
      'Habilidad: ' + pokemonAbilityName(member.ability, locale),
      (environment === 'champions' ? 'PC: ' : 'EVs: ') + evs,
      ...(environment === 'mainline' && ivs ? ['IVs: ' + ivs] : []),
      ...(member.formId ? ['Forma: ' + member.formId] : []),
      ...(environment === 'mainline' && member.teraType ? ['Tipo Tera: ' + member.teraType] : []),
      pokemonNatureName(member.nature, locale) + ' (naturaleza)',
      ...member.moves.filter(Boolean).map(move => '- ' + pokemonMoveName(move, locale))
    ].join('\n');
  }).join('\n\n');
}

export default function CompetitiveLandingPage() {
  const { t, locale } = useLocale();
  const [workspace, setWorkspace] = useState<CompetitiveWorkspace>(() =>
    removeUnknownPokemon(loadCompetitiveDraft(), knownIds)
  );
  const [notice, setNotice] = useState('');
  const [showMeta, setShowMeta] = useState(false);
  const format = workspace.format;
  const environment = workspace.environmentByFormat?.[format]
    ?? (format === 'singles' ? 'mainline' : 'champions');
  const training = getTrainingRules(environment);
  const metaMatchesEnvironment =
    (format === 'singles' && environment === 'mainline')
    || (format === 'doubles' && environment === 'champions');
  const team = workspace.teams[format];
  const member = team[workspace.selectedSlot];
  const chosenPokemon = member ? lookup.get(member.pokemonId) : null;
  const completed = team.filter(Boolean).length;
  const analysis = useMemo(() => analyzeCompetitiveTeam(team, pokemon), [team]);
  const issues = useMemo(() => validateCompetitiveTeam(format, team, environment), [format, team, environment]);

  useEffect(() => {
    saveCompetitiveDraft(workspace);
  }, [workspace]);

  function updateTeam(update: (current: CompetitiveTeam) => CompetitiveTeam): void {
    setWorkspace(previous => ({
      ...previous,
      teams: { ...previous.teams, [previous.format]: update(previous.teams[previous.format]) }
    }));
  }

  function editMember(update: (current: CompetitivePokemonSet) => CompetitivePokemonSet): void {
    updateTeam(current => current.map((set, index) => index === workspace.selectedSlot && set
      ? { ...update(set), templateId: undefined }
      : set));
  }

  function changePokemon(id: number): void {
    const entry = lookup.get(id);
    updateTeam(current => current.map((set, index) =>
      index === workspace.selectedSlot ? (entry ? createManualSet(entry) : null) : set
    ));
    setNotice(entry ? 'Set nuevo: completa movimientos, habilidad y objeto.' : 'Espacio vacío.');
  }

  function generate(): void {
    updateTeam(current => generateCompetitiveTeam(format, pokemon, current));
    setNotice('Ejemplo educativo generado. Comprueba legalidad antes de usarlo en una competición.');
  }

  function reroll(): void {
    if (member?.locked) return;
    const next = regenerateCompetitiveSlot(format, pokemon, team, workspace.selectedSlot);
    if (next === team) {
      setNotice('No quedan alternativas de ejemplo compatibles con los demás miembros.');
    } else {
      updateTeam(() => next);
      setNotice('Espacio regenerado sin cambiar los demás.');
    }
  }

  async function copy(): Promise<void> {
    const text = showText(team, environment, locale);
    if (!text) {
      setNotice('Primero añade algún Pokémon.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Equipo copiado como texto. Los datos y la legalidad no están verificados.');
    } catch {
      setNotice('No se pudo copiar automáticamente. Comprueba los permisos del navegador.');
    }
  }

  function reset(): void {
    if (typeof window.confirm === 'function' && !window.confirm('¿Vaciar los seis espacios de este formato?')) return;
    updateTeam(() => [null, null, null, null, null, null]);
    setNotice('Formato vaciado. El otro formato conserva sus Pokémon.');
  }

  return (
    <main className="page competitive-workspace">
      <section className="hero competitive-hero">
        <div className="section-kicker">V2 · COMPETITIVO</div>
        <h1>Tu laboratorio competitivo</h1>
        <p className="hero-copy">Genera un equipo de ejemplo, cambia lo que quieras y descubre por qué cada pieza importa. Aquí se aprende construyendo.</p>
      </section>

      <section className="comp-toolbar" aria-label="Configuración competitiva">
        <div className="comp-format-switch" aria-label="Formato">
          <button type="button" aria-pressed={format === 'singles'} className={format === 'singles' ? 'active' : ''}
            onClick={() => setWorkspace(previous => ({ ...previous, format: 'singles', selectedSlot: 0 }))}>Singles 6v6</button>
          <button type="button" aria-pressed={format === 'doubles'} className={format === 'doubles' ? 'active' : ''}
            onClick={() => setWorkspace(previous => ({ ...previous, format: 'doubles', selectedSlot: 0 }))}>Dobles estilo VGC</button>
        </div>
        <label className="comp-learn-toggle">
          <input type="checkbox" checked={workspace.showLearning}
            onChange={event => setWorkspace(previous => ({ ...previous, showLearning: event.target.checked }))} />
          Explicaciones para aprender
        </label>
      </section>

      <section className="comp-environment" aria-label="Juego competitivo de referencia">
        <div>
          <span className="section-kicker">REGLAS SEGÚN EL JUEGO</span>
          <p className="comp-subdued">Singles y Dobles son formatos. El videojuego determina los puntos de entrenamiento y mecánicas permitidas.</p>
        </div>
        <div className="comp-environment-buttons">
          <button type="button" aria-pressed={environment === 'mainline'}
            className={environment === 'mainline' ? 'is-active' : ''}
            onClick={() => setWorkspace(previous => ({
              ...previous,
              environmentByFormat: {
                singles: previous.environmentByFormat?.singles ?? 'mainline',
                doubles: previous.environmentByFormat?.doubles ?? 'champions',
                [previous.format]: 'mainline'
              }
            }))}>Saga principal · Escarlata/Púrpura</button>
          <button type="button" aria-pressed={environment === 'champions'}
            className={environment === 'champions' ? 'is-active' : ''}
            onClick={() => setWorkspace(previous => ({
              ...previous,
              environmentByFormat: {
                singles: previous.environmentByFormat?.singles ?? 'mainline',
                doubles: previous.environmentByFormat?.doubles ?? 'champions',
                [previous.format]: 'champions'
              }
            }))}>Pokémon Champions</button>
        </div>
        <small className="comp-environment-rules">
          {training.label}: máximo {training.statMax} por estadística y {training.totalMax} en total.
          {training.canTera ? ' Tera disponible; no hay Megaevolución.' : ' Mega disponible; no hay Tera ni ajuste manual de IVs.'}
        </small>
      </section>

      <div className="comp-disclaimer" role="note">
        <strong>Laboratorio educativo, no validador de torneos.</strong>
        {' '}La edición y las recomendaciones son orientativas. No se certifica legalidad por torneo, regulación, objeto, forma o set. {environment === 'champions'
          ? 'Pokémon Champions tiene sus propias reglas de puntos, mecánicas y listas de especies.'
          : 'Escarlata/Púrpura usa EVs, IVs y tipo Tera; la generación de sets sigue siendo didáctica.'}
      </div>

      <section className="comp-actions">
        <div>
          <span className="section-kicker">{formatTitle(format).toUpperCase()}</span>
          <h2>Tu equipo de trabajo</h2>
          <p className="comp-subdued">{t('Cada formato conserva su propio borrador en este navegador.')}</p>
        </div>
        <div className="comp-buttons">
          <button type="button" className="primary" onClick={generate}>Generar equipo de ejemplo</button>
          <button type="button" className="secondary" onClick={copy}>Copiar texto</button>
          <button type="button" className="secondary" onClick={reset}>Vaciar formato</button>
        </div>
      </section>

      <section className="comp-roster" aria-label="Tus seis Pokémon">
        <div className="comp-roster-head">
          <h2>Plantilla de seis</h2>
          <span className="mini-badge">{completed} / 6 Pokémon</span>
        </div>
        <div className="comp-roster-grid">
          {team.map((set, index) => {
            const entry = set ? lookup.get(set.pokemonId) : null;
            const visibleName = entry ? memberDisplayName(entry.id, entry.name, set?.formId) : '';
            return (
              <article key={index} className={workspace.selectedSlot === index ? 'comp-slot selected' : 'comp-slot'}>
                <button type="button" className="comp-slot-main" aria-label={'Editar espacio ' + (index + 1)}
                  onClick={() => setWorkspace(previous => ({ ...previous, selectedSlot: index }))}>
                  <span className="comp-slot-top"><span>ESPACIO {index + 1}</span>{set?.locked ? '🔒' : '◇'}</span>
                  {entry
                    ? <img key={entry.id + ':' + (set?.formId ?? 'base')}
                        src={memberArtworkUrl(entry.id, set?.formId)} alt="" loading="lazy"
                        onError={event => {
                          const fallback = baseArtworkUrl(entry.id);
                          if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
                        }}/>
                    : <div className="comp-empty-art" aria-hidden="true">＋</div>}
                  <strong>{entry ? visibleName : 'Añadir Pokémon'}</strong>
                  <small>{set ? roleLabels[set.role] : 'Selecciona este espacio'}</small>
                </button>
                {set && <button type="button" className="comp-lock"
                  aria-label={(set.locked ? 'Desbloquear ' : 'Bloquear ') + (index + 1)}
                  onClick={() => updateTeam(current => current.map((value, position) =>
                    position === index && value ? { ...value, locked: !value.locked } : value))}>
                  {set.locked ? '▣ Bloqueado' : '▢ Bloquear'}
                </button>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="comp-meta-launch">
        <div>
          <span className="section-kicker">V2.2 · DATOS DEL METAGAME</span>
          <h2>Descubre qué se juega y prepara respuestas</h2>
          <p className="comp-subdued">Consulta estadísticas mensuales reales y compara tipos con tu equipo. Este módulo se carga solo cuando lo abres.</p>
        </div>
        <button type="button" className={showMeta ? 'secondary' : 'primary'}
          aria-expanded={showMeta} aria-controls="competitive-meta-panel"
          onClick={() => setShowMeta(previous => !previous)}>
          {showMeta ? 'Ocultar metagame' : 'Ver metagame y matchups'}
        </button>
      </section>
      {showMeta && <div id="competitive-meta-panel">
        {!metaMatchesEnvironment ? (
          <div className="comp-disclaimer" role="note">
            No hay un snapshot verificado de metagame para esta combinación de formato y juego.
            Los datos OU disponibles corresponden a Singles de saga principal y los datos Reg M-C
            a Dobles de Pokémon Champions. No se mezclarán estadísticas de juegos distintos.
          </div>
        ) : (
          <LoadFailureBoundary scope="matchups">
            <Suspense fallback={<p className="comp-subdued" role="status">Preparando estadísticas competitivas…</p>}>
              <MetaInsightsPanel key={format + environment} format={format} pokemon={pokemon}
                teamIds={team.filter((slot): slot is CompetitivePokemonSet => slot !== null).map(slot => slot.pokemonId)}
                showLearning={workspace.showLearning} />
            </Suspense>
          </LoadFailureBoundary>
        )}
      </div>}

      <div className="comp-main-grid">
        <section className="config-card comp-editor" aria-label="Editor del miembro">
          <div className="comp-panel-heading">
            <div><span className="section-kicker">EDITOR MANUAL</span><h2>Espacio {workspace.selectedSlot + 1}</h2></div>
            <button type="button" className="secondary" disabled={Boolean(member?.locked)} onClick={reroll}>⟳ Regenerar espacio</button>
          </div>

          <PokemonSpeciesPicker
            selectionKey={format + '-' + workspace.selectedSlot}
            pokemon={sortedPokemon}
            selectedId={member?.pokemonId ?? null}
            onSelect={changePokemon}
            options={pokemonOptions}
          />

          {!member ? (
            <div className="comp-editor-empty">
              <h3>Este espacio está libre</h3>
              <p>Puedes elegir cualquier Pokémon del catálogo para construirlo desde cero, o generar seis ejemplos de golpe.</p>
            </div>
          ) : chosenPokemon ? (
            <GuidedSetEditor key={format + '-' + workspace.selectedSlot}
              member={member} pokemon={chosenPokemon} format={format}
              environment={environment} showLearning={workspace.showLearning}
              onEdit={editMember} />
          ) : (
            <p className="comp-subdued">Pokémon no encontrado en el catálogo.</p>
          )}
        </section>

        <aside className="comp-insights">
          <section className="summary-card comp-insight">
            <span className="section-kicker">LECTURA DEL EQUIPO</span>
            <h2>Análisis inicial</h2>
            <p className="comp-subdued">Solo estadísticas base, roles y afinidades de tipo. No considera habilidades, objetos, clima ni cálculos de daño.</p>
            <div className="comp-metric"><strong>{analysis.filledSlots}/6</strong><span>Pokémon configurados</span></div>
            <div className="comp-metric"><strong>{analysis.uniqueTypes}</strong><span>Tipos distintos en el equipo</span></div>
            <h3>Distribución de roles</h3>
            <div className="comp-role-list">
              {Object.entries(analysis.roleCounts).filter(([, count]) => count > 0).map(([role, count]) =>
                <div key={role}><span>{roleLabels[role as keyof typeof roleLabels]}</span><strong>{count}</strong></div>)}
              {analysis.filledSlots === 0 && <p className="comp-subdued">Añade miembros para visualizar roles.</p>}
            </div>
            <h3>Debilidades compartidas</h3>
            {analysis.sharedWeaknesses.length ? (
              <div className="comp-weaknesses">{analysis.sharedWeaknesses.slice(0, 6).map(entry =>
                <span key={entry.type}>{niceName(entry.type)} · {entry.count}</span>)}</div>
            ) : <p className="comp-subdued">Sin dos debilidades compartidas detectadas, o faltan miembros.</p>}
            {workspace.showLearning && <p className="comp-small-note">Una debilidad compartida significa que varios miembros reciben daño supereficaz del mismo tipo. No determina por sí sola quién gana un combate.</p>}
          </section>

          <section className="summary-card comp-insight">
            <span className="section-kicker">REVISA ANTES DE JUGAR</span>
            <h2>Chequeo del equipo</h2>
            {issues.length === 0
              ? <p className="comp-good">Sin errores básicos detectados. Esto NO certifica legalidad de competición.</p>
              : <>
                <p className="comp-subdued">{issues.filter(issue => issue.severity === 'error').length} errores y {issues.filter(issue => issue.severity === 'warning').length} avisos.</p>
                <ul className="comp-issues">{issues.slice(0, 9).map((issue, index) =>
                  <li key={index} className={issue.severity === 'error' ? 'is-error' : ''}>
                    {issue.slot === undefined ? '' : 'Espacio ' + (issue.slot + 1) + ': '}{issue.message}
                  </li>)}</ul>
                {issues.length > 9 && <small>+ {issues.length - 9} avisos adicionales. Revisa los sets.</small>}
              </>}
          </section>
        </aside>
      </div>
      {notice && <p className="comp-notice" role="status">{notice}</p>}
    </main>
  );
}
