import { useEffect, useMemo, useState } from 'react';
import pokemonCatalog from '../data/generated/pokemon.json';
import type { Pokemon, PokemonStats } from '../domain/pokemon/types';
import { analyzeCompetitiveTeam } from './core/analysis';
import { createManualSet, generateCompetitiveTeam, regenerateCompetitiveSlot } from './core/teamBuilder';
import { SAMPLE_TEMPLATES } from './core/templates';
import {
  natureEffects, roleDescriptions, roleLabels, statKeys, statLabels
} from './core/types';
import type {
  CompetitiveFormat, CompetitivePokemonSet, CompetitiveTeam, CompetitiveWorkspace, StatKey
} from './core/types';
import { validateCompetitiveTeam } from './core/validation';
import {
  loadCompetitiveDraft, removeUnknownPokemon, saveCompetitiveDraft
} from './competitiveDraft';
import './competitive.css';

const pokemon = pokemonCatalog as unknown as Pokemon[];
const sortedPokemon = [...pokemon].sort((a, b) => a.id - b.id);
const lookup = new Map(pokemon.map(entry => [entry.id, entry]));
const knownIds = new Set(lookup.keys());

function niceName(name: string): string {
  return name.split('-').map(part => part.length ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}

function spriteUrl(id: number): string {
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + id + '.png';
}

function formatTitle(format: CompetitiveFormat): string {
  return format === 'singles' ? 'Singles 6v6' : 'Dobles estilo VGC';
}

function showText(team: CompetitiveTeam): string {
  return team.filter((member): member is CompetitivePokemonSet => member !== null).map(member => {
    const entry = lookup.get(member.pokemonId);
    const evs = statKeys.filter(stat => member.evs[stat] > 0)
      .map(stat => member.evs[stat] + ' ' + statLabels[stat]).join(' / ');
    const ivs = statKeys.filter(stat => member.ivs[stat] !== 31)
      .map(stat => member.ivs[stat] + ' ' + statLabels[stat]).join(' / ');
    return [
      (entry ? niceName(entry.name) : '#' + member.pokemonId) + (member.item ? ' @ ' + member.item : ''),
      'Ability: ' + member.ability,
      'EVs: ' + evs,
      ...(ivs ? ['IVs: ' + ivs] : []),
      member.nature + ' Nature',
      ...member.moves.filter(Boolean).map(move => '- ' + move)
    ].join('\n');
  }).join('\n\n');
}

export default function CompetitiveLandingPage() {
  const [workspace, setWorkspace] = useState<CompetitiveWorkspace>(() =>
    removeUnknownPokemon(loadCompetitiveDraft(), knownIds)
  );
  const [notice, setNotice] = useState('');
  const [showIvs, setShowIvs] = useState(false);
  const format = workspace.format;
  const team = workspace.teams[format];
  const member = team[workspace.selectedSlot];
  const chosenPokemon = member ? lookup.get(member.pokemonId) : null;
  const completed = team.filter(Boolean).length;
  const analysis = useMemo(() => analyzeCompetitiveTeam(team, pokemon), [team]);
  const issues = useMemo(() => validateCompetitiveTeam(format, team), [format, team]);
  const sample = member?.templateId ? SAMPLE_TEMPLATES.find(template => template.id === member.templateId) : undefined;

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
    const text = showText(team);
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

  function editStat(which: 'evs' | 'ivs', stat: StatKey, value: string): void {
    const numeric = Number(value);
    editMember(current => ({
      ...current,
      [which]: { ...current[which], [stat]: Number.isFinite(numeric) ? numeric : 0 } as PokemonStats
    }));
  }

  const natureEffect = member ? natureEffects[member.nature] : undefined;
  const natureDescription = !natureEffect || !natureEffect[0] || !natureEffect[1]
    ? 'Esta naturaleza no modifica estadísticas.'
    : 'Sube ' + statLabels[natureEffect[0]] + ' y baja ' + statLabels[natureEffect[1]] + '.';

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

      <div className="comp-disclaimer" role="note">
        <strong>Laboratorio educativo, no validador de torneos.</strong>
        {' '}Los sets son ejemplos editables. Todavía no verificamos legalidad de movimientos, habilidades, formas, tiers o reglamentos vigentes. {format === 'doubles' ? 'En VGC se registran hasta 6 Pokémon y normalmente se eligen 4 para cada combate; las regulaciones cambian.' : 'Singles libre 6v6 no equivale a legalidad comprobada en OU.'}
      </div>

      <section className="comp-actions">
        <div>
          <span className="section-kicker">{formatTitle(format).toUpperCase()}</span>
          <h2>Tu equipo de trabajo</h2>
          <p className="comp-subdued">Cada formato conserva su propio borrador en este navegador.</p>
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
            return (
              <article key={index} className={workspace.selectedSlot === index ? 'comp-slot selected' : 'comp-slot'}>
                <button type="button" className="comp-slot-main" aria-label={'Editar espacio ' + (index + 1)}
                  onClick={() => setWorkspace(previous => ({ ...previous, selectedSlot: index }))}>
                  <span className="comp-slot-top"><span>ESPACIO {index + 1}</span>{set?.locked ? '🔒' : '◇'}</span>
                  {entry
                    ? <img src={spriteUrl(entry.id)} alt="" loading="lazy" />
                    : <div className="comp-empty-art" aria-hidden="true">＋</div>}
                  <strong>{entry ? niceName(entry.name) : 'Añadir Pokémon'}</strong>
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

      <div className="comp-main-grid">
        <section className="config-card comp-editor" aria-label="Editor del miembro">
          <div className="comp-panel-heading">
            <div><span className="section-kicker">EDITOR MANUAL</span><h2>Espacio {workspace.selectedSlot + 1}</h2></div>
            <button type="button" className="secondary" disabled={Boolean(member?.locked)} onClick={reroll}>⟳ Regenerar espacio</button>
          </div>

          <label className="comp-field">Pokémon del espacio seleccionado
            <select value={member?.pokemonId ?? ''} onChange={event => changePokemon(Number(event.target.value))}>
              <option value="">Vacío, elige una especie</option>
              {sortedPokemon.map(entry => <option key={entry.id} value={entry.id}>#{entry.id} · {niceName(entry.name)}</option>)}
            </select>
          </label>

          {!member ? (
            <div className="comp-editor-empty">
              <h3>Este espacio está libre</h3>
              <p>Puedes elegir cualquier Pokémon del catálogo para construirlo desde cero, o generar seis ejemplos de golpe.</p>
            </div>
          ) : (
            <>
              <div className="comp-two-fields">
                <label className="comp-field">Rol
                  <select value={member.role} onChange={event =>
                    editMember(previous => ({ ...previous, role: event.target.value as CompetitivePokemonSet['role'] }))}>
                    {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="comp-field">Naturaleza
                  <select value={member.nature} onChange={event =>
                    editMember(previous => ({ ...previous, nature: event.target.value }))}>
                    {Object.keys(natureEffects).map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
                <label className="comp-field">Habilidad
                  <input value={member.ability} placeholder="Escribe una habilidad"
                    onChange={event => editMember(previous => ({ ...previous, ability: event.target.value }))} />
                </label>
                <label className="comp-field">Objeto equipado
                  <input value={member.item} placeholder="Ej. Leftovers"
                    onChange={event => editMember(previous => ({ ...previous, item: event.target.value }))} />
                </label>
              </div>

              <h3 className="comp-mini-heading">Movimientos</h3>
              <div className="comp-two-fields">
                {member.moves.map((move, index) => (
                  <label className="comp-field" key={index}>Movimiento {index + 1}
                    <input value={move} placeholder="Escribe un movimiento"
                      onChange={event => editMember(previous => ({
                        ...previous,
                        moves: previous.moves.map((value, i) =>
                          i === index ? event.target.value : value
                        ) as CompetitivePokemonSet['moves']
                      }))} />
                  </label>
                ))}
              </div>
              <h3 className="comp-mini-heading">EVs <small>{statKeys.reduce((sum, stat) => sum + member.evs[stat], 0)} / 510</small></h3>
              <div className="comp-stat-grid">
                {statKeys.map(stat => (
                  <label className="comp-field" key={stat}>{statLabels[stat]}
                    <input aria-label={'EV ' + statLabels[stat]} type="number" min="0" max="252" step="1"
                      value={member.evs[stat]} onChange={event => editStat('evs', stat, event.target.value)} />
                  </label>
                ))}
              </div>

              <button type="button" className="comp-subheading-toggle" aria-expanded={showIvs}
                onClick={() => setShowIvs(value => !value)}>
                {showIvs ? '▾ Ocultar IVs' : '▸ Ajustar IVs (0 a 31)'}
              </button>
              {showIvs && <div className="comp-stat-grid">
                {statKeys.map(stat => (
                  <label className="comp-field" key={stat}>{statLabels[stat]}
                    <input aria-label={'IV ' + statLabels[stat]} type="number" min="0" max="31" step="1"
                      value={member.ivs[stat]} onChange={event => editStat('ivs', stat, event.target.value)} />
                  </label>
                ))}
              </div>}

              {workspace.showLearning && <div className="comp-lesson">
                <span className="section-kicker">¿POR QUÉ ESTA CONFIGURACIÓN?</span>
                <p><strong>Rol:</strong> {roleDescriptions[member.role]}</p>
                <p><strong>Naturaleza:</strong> {natureDescription}</p>
                <p><strong>EVs:</strong> distribuyen entrenamiento entre estadísticas. Máximo 252 por estadística y 510 total. No siempre conviene gastar todo en Velocidad.</p>
                <p><strong>IVs:</strong> potencial individual de 0 a 31. Un valor bajo a veces es intencional, por ejemplo en Trick Room.</p>
                {sample && <p><strong>Ejemplo:</strong> {sample.lesson}</p>}
                {chosenPokemon && <p><strong>Stats base:</strong> {statKeys.map(stat =>
                  statLabels[stat] + ' ' + chosenPokemon.stats[stat]).join(' · ')}</p>}
              </div>}
            </>
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
