import { useMemo, useState } from 'react';
import { loadDataset } from '../data/loadDataset';
import type { CollectionConfig, CollectionEntryConfig, CollectionResult } from '../domain/collections/types';
import type { GeneratorConfig } from '../domain/teams/types';
import { generateCollection } from '../generator/collection/generateCollection';
import { regenerateCollectionTeam } from '../generator/collection/regenerateCollectionTeam';

const dataset = loadDataset();

const roman: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX' };

function basePackFor(gameId: string): string {
  return dataset.contentPacks.find(pack => pack.gameId === gameId && pack.type === 'base')?.id ?? '';
}

function defaultGameForGeneration(generation: number): string {
  return dataset.games.find(game => game.generation === generation)?.id ?? dataset.games[0]?.id ?? '';
}

function makeGenerator(gameId: string, teamSize = 6): GeneratorConfig {
  return {
    gameId,
    enabledContentPacks: [basePackFor(gameId)].filter(Boolean),
    teamSize,
    stage: 'all',
    mode: 'adventure',
    allowedMethods: ['wild', 'gift', 'evolution'],
    allowTradeEvolution: false,
    starterRule: 'allow',
    legendaryRule: 'exclude'
  };
}

function makeEntry(generation: number, id: string): CollectionEntryConfig {
  const gameId = defaultGameForGeneration(generation);
  return {
    id,
    label: `Generación ${roman[generation] ?? generation}`,
    targetGeneration: generation,
    generator: makeGenerator(gameId),
    allowBonus: true
  };
}

function initialConfig(): CollectionConfig {
  return {
    entries: [makeEntry(1, 'collection-1'), makeEntry(2, 'collection-2')],
    avoidRepeatedSpecies: true,
    avoidRepeatedFamilies: true,
    maxBonusPerTeam: 1
  };
}

function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function nextEntryId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `collection-${Date.now()}-${Math.random()}`;
}

export default function CollectionPage() {
  const [config, setConfig] = useState<CollectionConfig>(initialConfig);
  const [result, setResult] = useState<CollectionResult | null>(null);
  const generations = useMemo(() => [...new Set(dataset.games.map(game => game.generation))].sort((a, b) => a - b), []);

  const updateEntry = (id: string, updater: (entry: CollectionEntryConfig) => CollectionEntryConfig) => {
    setConfig(previous => ({
      ...previous,
      entries: previous.entries.map(entry => entry.id === id ? updater(entry) : entry)
    }));
    setResult(null);
  };

  const changeTargetGeneration = (id: string, generation: number) => {
    const gameId = defaultGameForGeneration(generation);
    updateEntry(id, entry => ({
      ...entry,
      label: `Generación ${roman[generation] ?? generation}`,
      targetGeneration: generation,
      generator: makeGenerator(gameId, entry.generator.teamSize)
    }));
  };

  const changeGame = (id: string, gameId: string) => {
    updateEntry(id, entry => ({
      ...entry,
      generator: {
        ...entry.generator,
        gameId,
        enabledContentPacks: [basePackFor(gameId)].filter(Boolean)
      }
    }));
  };

  const addEntry = () => {
    if (config.entries.length >= 9) return;
    const used = new Set(config.entries.map(entry => entry.targetGeneration));
    const generation = generations.find(value => !used.has(value)) ?? generations[0] ?? 1;
    setConfig(previous => ({ ...previous, entries: [...previous.entries, makeEntry(generation, nextEntryId())] }));
    setResult(null);
  };

  const removeEntry = (id: string) => {
    if (config.entries.length <= 2) return;
    setConfig(previous => ({ ...previous, entries: previous.entries.filter(entry => entry.id !== id) }));
    setResult(null);
  };

  const generateAll = () => {
    setResult(generateCollection(dataset, config, result ?? undefined));
  };

  const toggleTeamLock = (entryId: string) => {
    setResult(previous => previous ? {
      ...previous,
      teams: previous.teams.map(team => team.entryId === entryId ? { ...team, locked: !team.locked } : team)
    } : previous);
  };

  const toggleMemberLock = (entryId: string, index: number) => {
    setResult(previous => previous ? {
      ...previous,
      teams: previous.teams.map(team => team.entryId === entryId ? {
        ...team,
        team: team.team.map((slot, slotIndex) => slotIndex === index ? { ...slot, locked: !slot.locked } : slot)
      } : team)
    } : previous);
  };

  const rerollTeam = (entryId: string) => {
    if (!result) return;
    setResult(regenerateCollectionTeam(dataset, config, result, entryId));
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◉</span>
          <span><strong>Pokémon Adventure</strong><small>COLECCIÓN MULTIRREGIÓN</small></span>
        </div>
        <span className="header-note">V1 · reto de equipos coordinados</span>
      </header>

      <main className="page">
        <section className="hero">
          <div className="section-kicker">UNA COLECCIÓN · MUCHAS AVENTURAS</div>
          <h1>Arma todos tus equipos como una sola estrategia.</h1>
          <p className="hero-copy">Elige la generación o región objetivo y el juego que jugarás. El motor reparte las familias entre todos los equipos para evitar repetir siempre a los mismos favoritos.</p>
        </section>

        <section className="config-card" style={{ marginBottom: 24 }}>
          <div className="config-title"><h2>Reglas globales</h2><span>COLECCIÓN</span></div>
          <div className="config-content">
            <div className="custom-checks">
              <label className="custom-check"><input type="checkbox" checked={config.avoidRepeatedSpecies} onChange={event => { setConfig({ ...config, avoidRepeatedSpecies: event.target.checked }); setResult(null); }} /><span>No repetir Pokémon entre equipos</span></label>
              <label className="custom-check"><input type="checkbox" checked={config.avoidRepeatedFamilies} onChange={event => { setConfig({ ...config, avoidRepeatedFamilies: event.target.checked }); setResult(null); }} /><span>No repetir familias evolutivas</span></label>
            </div>
            <small>Las evoluciones posteriores cuentan por la generación de origen de su línea. Cada equipo puede usar como máximo 1 bonus si lo necesita.</small>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 16 }}>
          {config.entries.map((entry, index) => (
            <section className="config-card" key={entry.id}>
              <div className="config-title">
                <h2>Equipo {index + 1} · {entry.label}</h2>
                {config.entries.length > 2 && <button className="danger" onClick={() => removeEntry(entry.id)}>Eliminar</button>}
              </div>
              <div className="config-content">
                <div className="field-grid">
                  <label>Región / generación objetivo
                    <select value={entry.targetGeneration} onChange={event => changeTargetGeneration(entry.id, Number(event.target.value))}>
                      {generations.map(generation => <option value={generation} key={generation}>Generación {roman[generation] ?? generation}</option>)}
                    </select>
                  </label>
                  <label>Juego que jugarás
                    <select value={entry.generator.gameId} onChange={event => changeGame(entry.id, event.target.value)}>
                      {dataset.games.map(game => <option value={game.id} key={game.id}>{game.name} · Gen {roman[game.generation] ?? game.generation}</option>)}
                    </select>
                  </label>
                </div>
                <div className="field-grid">
                  <label>Nombre del equipo
                    <input value={entry.label} onChange={event => updateEntry(entry.id, value => ({ ...value, label: event.target.value }))} />
                  </label>
                  <label>Tamaño
                    <select value={entry.generator.teamSize} onChange={event => updateEntry(entry.id, value => ({ ...value, generator: { ...value.generator, teamSize: Number(event.target.value) } }))}>
                      {[1, 2, 3, 4, 5, 6].map(size => <option value={size} key={size}>{size}</option>)}
                    </select>
                  </label>
                </div>
                <label className="custom-check"><input type="checkbox" checked={entry.allowBonus} onChange={event => updateEntry(entry.id, value => ({ ...value, allowBonus: event.target.checked }))} /><span>Permitir 1 Pokémon bonus si hace falta</span></label>
              </div>
            </section>
          ))}
        </div>

        <div className="generate-row">
          <button className="secondary" disabled={config.entries.length >= 9} onClick={addEntry}>＋ Añadir equipo</button>
          <button className="primary large" onClick={generateAll}>⤨ {result ? 'Regenerar colección' : 'Generar colección'}</button>
        </div>

        {result && <section className="team-section">
          <div className={result.complete ? 'result-badge success' : 'result-badge warning'}>{result.complete ? 'COLECCIÓN LISTA' : 'COLECCIÓN PARCIAL'}</div>
          <div className="result-heading">
            <div><h1>{result.teams.length} equipos. Una sola colección.</h1><p className="hero-copy">Los bloqueos sobreviven a las regeneraciones y las familias ocupadas quedan reservadas globalmente.</p></div>
          </div>

          <div className="summary-card" style={{ marginBottom: 20 }}>
            <h3>Resumen global</h3>
            <p><b>{result.totalPokemon} Pokémon</b><small>{result.teams.length} equipos · {result.bonusesUsed} bonus usados</small></p>
            <p><b>{result.duplicateSpecies} especies repetidas</b><small>{result.duplicateFamilies} familias repetidas</small></p>
          </div>

          {result.warnings.length > 0 && <div className="data-warning" style={{ marginBottom: 18 }}>⚠ <span>{result.warnings.join(' ')}</span></div>}

          <div style={{ display: 'grid', gap: 24 }}>
            {result.teams.map(team => {
              const game = dataset.games.find(item => item.id === team.gameId);
              return <section className="config-card" key={team.entryId}>
                <div className="config-title">
                  <div><h2>{team.label}</h2><span>{game?.name ?? team.gameId} · Gen objetivo {roman[team.targetGeneration] ?? team.targetGeneration} · {team.team.length} miembros</span></div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="secondary" onClick={() => toggleTeamLock(team.entryId)}>{team.locked ? '▣ Equipo bloqueado' : '▢ Bloquear equipo'}</button>
                    <button className="secondary" disabled={team.locked} onClick={() => rerollTeam(team.entryId)}>⟳ Regenerar región</button>
                  </div>
                </div>

                <div className="pokemon-grid">
                  {team.team.map((slot, index) => {
                    const pokemon = slot.candidate.resolvedPokemon;
                    const isBonus = team.bonusCandidateKeys.includes(slot.candidate.candidateKey);
                    return <article className={slot.locked ? 'pokemon-card locked' : 'pokemon-card'} key={`${slot.candidate.candidateKey}-${index}`}>
                      <div className="card-number">N.º {String(pokemon.id).padStart(4, '0')}<span>{isBonus ? '★ BONUS' : ''}</span></div>
                      <div className="pokemon-art"><img src={spriteUrl(pokemon.id)} alt={pokemon.name} loading="lazy" /></div>
                      <h2>{pokemon.name}</h2>
                      <span className="form-label">Familia: {slot.candidate.evolutionFamilyId}</span>
                      <div className="card-footer"><button disabled={team.locked} onClick={() => toggleMemberLock(team.entryId, index)}>{slot.locked ? '▣ Bloqueado' : '▢ Bloquear'}</button></div>
                    </article>;
                  })}
                </div>
              </section>;
            })}
          </div>
        </section>}
      </main>

      <footer><span>Proyecto fan · Pokémon pertenece a sus respectivos propietarios.</span><span>V1 · colección multirregión</span></footer>
    </div>
  );
}
