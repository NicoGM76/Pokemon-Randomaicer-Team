import { useMemo, useState } from 'react';
import { loadDataset } from './data/loadDataset';
import type { AcquisitionMethod, AdventureStage } from './domain/games/types';
import type { GeneratorConfig, GeneratorMode, GenerationResult, RequiredOneRule, SavedTeam, TeamSlot } from './domain/teams/types';
import type { PokemonType } from './domain/pokemon/types';
import { generateTeam } from './generator/generateTeam';
import { buildCandidates } from './generator/candidates/buildCandidates';
import { regenerateSlot } from './generator/regeneration/regenerateSlot';
import { LocalStorageTeamRepository } from './storage/LocalStorageTeamRepository';

const dataset = loadDataset();
const repository = new LocalStorageTeamRepository();

const methodLabels: Record<AcquisitionMethod, string> = {
  wild: 'Captura', gift: 'Regalo', evolution: 'Evolución', trade: 'Intercambio',
  other_version: 'Otra versión', transfer: 'Transferencia', home: 'HOME'
};

const typeLabels: Record<PokemonType, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta', ice: 'Hielo',
  fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
};

const pokemonTypes = Object.keys(typeLabels) as PokemonType[];

function basePackFor(gameId: string): string {
  return dataset.contentPacks.find(pack => pack.gameId === gameId && pack.type === 'base')?.id ?? '';
}

function initialConfig(): GeneratorConfig {
  const firstGame = dataset.games.find(game => game.id === 'sword') ?? dataset.games[0];
  return {
    gameId: firstGame.id,
    enabledContentPacks: [basePackFor(firstGame.id)].filter(Boolean),
    teamSize: 6,
    stage: 'all',
    mode: 'adventure',
    allowedMethods: ['wild', 'gift', 'evolution'],
    allowTradeEvolution: false,
    starterRule: 'require_one',
    legendaryRule: 'exclude'
  };
}

function generationLabel(value: number): string {
  const romans: Record<number, string> = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X'};
  return romans[value] ?? String(value);
}

function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function mechanicFor(id: number): string | null {
  if ([812, 823, 834, 849, 892].includes(id)) return 'Gigamax';
  return null;
}

function acquisitionLabel(slot: TeamSlot): string {
  const method = slot.candidate.acquisitionOptions[0]?.method;
  return method ? methodLabels[method] : 'Disponible';
}

function App() {
  const [page, setPage] = useState<'generator' | 'saved'>('generator');
  const [config, setConfig] = useState<GeneratorConfig>(initialConfig);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(() => repository.getAll());
  const [notice, setNotice] = useState<string>('');

  const game = dataset.games.find(item => item.id === config.gameId) ?? dataset.games[0];
  const generations = [...new Set(dataset.games.map(item => item.generation))].sort((a, b) => a - b);
  const gamesForGeneration = dataset.games.filter(item => item.generation === game.generation);
  const contentPacks = dataset.contentPacks.filter(pack => pack.gameId === config.gameId);
  const availableCount = useMemo(() => buildCandidates(dataset, config).length, [config]);
  const gameAvailabilityRows = dataset.availability.filter(rule => rule.gameId === config.gameId).length;
  const hasGameData = gameAvailabilityRows > 0;

  const changeGame = (gameId: string) => {
    setConfig(previous => ({ ...previous, gameId, enabledContentPacks: [basePackFor(gameId)].filter(Boolean) }));
    setResult(null);
  };

  const changeGeneration = (generation: number) => {
    const next = dataset.games.find(item => item.generation === generation);
    if (next) changeGame(next.id);
  };

  const togglePack = (packId: string) => {
    const pack = dataset.contentPacks.find(item => item.id === packId);
    if (!pack || pack.type === 'base') return;
    setConfig(previous => ({
      ...previous,
      enabledContentPacks: previous.enabledContentPacks.includes(packId)
        ? previous.enabledContentPacks.filter(id => id !== packId)
        : [...previous.enabledContentPacks, packId]
    }));
    setResult(null);
  };

  const toggleMethod = (method: AcquisitionMethod) => {
    setConfig(previous => ({
      ...previous,
      allowedMethods: previous.allowedMethods.includes(method)
        ? previous.allowedMethods.filter(item => item !== method)
        : [...previous.allowedMethods, method]
    }));
    setResult(null);
  };

  const setMode = (mode: GeneratorMode) => {
    setConfig(previous => ({
      ...previous,
      mode,
      customRules: mode === 'custom' ? (previous.customRules ?? {
        mythicalRule: 'exclude', ultraBeastRule: 'exclude', paradoxRule: 'exclude',
        pseudoLegendaryRule: 'allow', fossilRule: 'allow'
      }) : previous.customRules
    }));
    setResult(null);
  };

  const runGenerator = () => {
    if (!hasGameData) {
      setNotice('Este juego ya está en el catálogo, pero su disponibilidad todavía no ha sido importada/curada.');
      return;
    }
    const generated = generateTeam(dataset, config, result?.team ?? []);
    setResult(generated);
    setNotice(generated.complete ? 'Equipo generado respetando tus reglas.' : `${generated.generatedSize}/${generated.requestedSize} disponibles con esta configuración.`);
    window.setTimeout(() => document.getElementById('team-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const generateAvailable = () => {
    const count = Math.min(config.teamSize, availableCount);
    const relaxedSize = { ...config, teamSize: Math.max(1, count) };
    const generated = generateTeam(dataset, relaxedSize);
    setResult({ ...generated, requestedSize: config.teamSize, complete: false });
    setNotice(`Se generaron ${generated.generatedSize}/${config.teamSize} sin relajar los demás filtros.`);
  };

  const toggleLock = (index: number) => {
    if (!result) return;
    setResult({ ...result, team: result.team.map((slot, i) => i === index ? { ...slot, locked: !slot.locked } : slot) });
  };

  const clearLocks = () => {
    if (!result) return;
    setResult({ ...result, team: result.team.map(slot => ({ ...slot, locked: false })) });
  };

  const rerollSlot = (index: number) => {
    if (!result) return;
    const candidates = buildCandidates(dataset, config);
    const next = regenerateSlot(result.team, index, candidates, config);
    if (!next.changed) {
      setNotice('No hay otra alternativa válida para ese espacio con las reglas actuales.');
      return;
    }
    setResult({ ...result, team: next.team });
    setNotice('Compañero regenerado.');
  };

  const copyTeam = async () => {
    if (!result) return;
    const text = result.team.map((slot, index) => `${index + 1}. ${slot.candidate.resolvedPokemon.name}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Equipo copiado al portapapeles.');
    } catch {
      setNotice('No se pudo acceder al portapapeles.');
    }
  };

  const saveTeam = () => {
    if (!result?.team.length) return;
    const suggested = `Equipo ${game.name}`;
    const name = window.prompt('Nombre del equipo', suggested)?.trim();
    if (!name) return;
    const saved: SavedTeam = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      gameId: config.gameId,
      config,
      team: result.team
    };
    repository.save(saved);
    setSavedTeams(repository.getAll());
    setNotice('Equipo guardado en este navegador.');
  };

  const loadSaved = (saved: SavedTeam) => {
    setConfig(saved.config);
    setResult({
      team: saved.team, requestedSize: saved.config.teamSize, generatedSize: saved.team.length,
      complete: saved.team.length === saved.config.teamSize, validation: { valid: true, issues: [] }, warnings: []
    });
    setPage('generator');
    setNotice(`Equipo “${saved.name}” cargado.`);
  };

  const deleteSaved = (id: string) => {
    repository.delete(id);
    setSavedTeams(repository.getAll());
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage('generator')}>
          <span className="brand-mark">◉</span>
          <span><strong>Pokémon Adventure</strong><small>TEAM GENERATOR</small></span>
        </button>
        <nav>
          <button className={page === 'generator' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('generator')}>Generador</button>
          <button className={page === 'saved' ? 'nav-pill active' : 'nav-pill'} onClick={() => setPage('saved')}>▱ Mis equipos</button>
        </nav>
        <span className="header-note">Sin cuentas. Solo aventura.</span>
      </header>

      {page === 'saved' ? (
        <main className="page saved-page">
          <div className="section-kicker">TU MOCHILA DE EQUIPOS</div>
          <h1>Mis equipos</h1>
          <p className="hero-copy">Guardados en este navegador. Puedes volver a cualquiera cuando quieras.</p>
          {savedTeams.length === 0 ? (
            <div className="empty-state"><span>◇</span><h2>Aún no guardaste equipos</h2><p>Genera una expedición y usa “Guardar equipo”.</p><button className="primary" onClick={() => setPage('generator')}>Ir al generador</button></div>
          ) : (
            <div className="saved-grid">
              {savedTeams.map(saved => (
                <article className="saved-card" key={saved.id}>
                  <div><span className="mini-badge">{saved.config.mode === 'adventure' ? 'Aventura' : saved.config.mode === 'random' ? 'Full Random' : 'Personalizado'}</span><h2>{saved.name}</h2><p>{dataset.games.find(g => g.id === saved.gameId)?.name ?? saved.gameId}</p></div>
                  <div className="saved-sprites">{saved.team.slice(0,6).map(slot => <img key={slot.candidate.candidateKey} src={spriteUrl(slot.candidate.resolvedPokemon.id)} alt="" />)}</div>
                  <small>{new Date(saved.createdAt).toLocaleDateString('es-CO')} · {saved.team.length} compañeros</small>
                  <div className="saved-actions"><button className="secondary" onClick={() => loadSaved(saved)}>Cargar</button><button className="danger" onClick={() => deleteSaved(saved.id)}>Eliminar</button></div>
                </article>
              ))}
            </div>
          )}
        </main>
      ) : (
        <main className="page">
          {!result ? (
            <>
              <section className="hero">
                <div className="section-kicker">EL PRÓXIMO VIAJE EMPIEZA AQUÍ</div>
                <h1>Tu aventura. Tus reglas.</h1>
                <p className="hero-copy">Elige tu juego, marca tus límites y descubre a tus próximos compañeros.</p>
              </section>

              <div className="mode-tabs">
                <button className={config.mode === 'adventure' ? 'active' : ''} onClick={() => setMode('adventure')}>◉ Aventura</button>
                <button className={config.mode === 'random' ? 'active' : ''} onClick={() => setMode('random')}>⤨ Full Random</button>
                <button className={config.mode === 'custom' ? 'active' : ''} onClick={() => setMode('custom')}>☷ Personalizado</button>
              </div>
              <p className="mode-help">{config.mode === 'adventure' ? 'Aventura · Compañeros que puedes conseguir en el juego elegido, con equilibrio moderado.' : config.mode === 'random' ? 'Full Random · Azar total dentro de todas tus reglas legales.' : 'Personalizado · Combina filtros avanzados para definir exactamente tu pool.'}</p>

              <div className="generator-layout">
                <section className="config-card">
                  <div className="config-title"><h2>Prepara tu expedición</h2><span>CONFIGURACIÓN GENERAL</span></div>
                  <details open className="mobile-group">
                    <summary>Juego y aventura</summary>
                    <div className="config-content">
                      <div className="field-grid">
                        <label>Generación<select value={game.generation} onChange={(e: { target: { value: string } }) => changeGeneration(Number(e.target.value))}>{generations.map(gen => <option key={gen} value={gen}>{generationLabel(gen)} · Generación {gen}</option>)}</select></label>
                        <label>Juego<select value={config.gameId} onChange={(e: { target: { value: string } }) => changeGame(e.target.value)}>{gamesForGeneration.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                      </div>

                      {contentPacks.length > 1 && <div className="field-block"><span className="field-label">Contenido</span><div className="chip-row">{contentPacks.map(pack => <label className={config.enabledContentPacks.includes(pack.id) ? 'check-chip checked' : 'check-chip'} key={pack.id}><input type="checkbox" checked={config.enabledContentPacks.includes(pack.id)} disabled={pack.type === 'base'} onChange={() => togglePack(pack.id)} /> {pack.name}</label>)}</div><small>Juego base siempre activo. Marca solo las expansiones que tengas.</small></div>}

                      <div className="field-block"><span className="field-label">Etapa de la aventura</span><div className="segmented">{([['main_story','Historia'],['postgame','Postgame'],['all','Todo']] as [AdventureStage,string][]).map(([value,label]) => <button key={value} className={config.stage === value ? 'active' : ''} onClick={() => {setConfig({...config,stage:value});setResult(null)}}>{label}</button>)}</div></div>
                      <div className="field-block"><span className="field-label">Equipo</span><div className="team-size">{[1,2,3,4,5,6].map(size => <button key={size} className={config.teamSize === size ? 'active' : ''} onClick={() => {setConfig({...config,teamSize:size});setResult(null)}}>{size}</button>)}</div><small>{config.teamSize} {config.teamSize === 1 ? 'compañero' : 'compañeros'}, una nueva historia.</small></div>
                    </div>
                  </details>

                  <details open className="mobile-group">
                    <summary>Métodos disponibles</summary>
                    <div className="config-content section-divider">
                      <div className="chip-row method-row">{(Object.keys(methodLabels) as AcquisitionMethod[]).map(method => <label key={method} className={config.allowedMethods.includes(method) ? 'check-chip checked' : 'check-chip'}><input type="checkbox" checked={config.allowedMethods.includes(method)} onChange={() => toggleMethod(method)} /> {methodLabels[method]}</label>)}</div>
                      <div className="toggle-line"><div><strong>Evolución por intercambio</strong><small>Permite evoluciones que necesitan un intercambio.</small></div><button className={config.allowTradeEvolution ? 'switch on' : 'switch'} onClick={() => {setConfig({...config,allowTradeEvolution:!config.allowTradeEvolution});setResult(null)}}><span /></button></div>
                    </div>
                  </details>

                  <details open className="mobile-group">
                    <summary>Opciones avanzadas</summary>
                    <div className="config-content section-divider">
                      <RuleSelector label="Inicial" value={config.starterRule} onChange={value => {setConfig({...config,starterRule:value});setResult(null)}} />
                      <RuleSelector label="Legendarios" value={config.legendaryRule} onChange={value => {setConfig({...config,legendaryRule:value});setResult(null)}} />

                      {config.mode === 'custom' && <div className="custom-panel">
                        <h3>Filtros personalizados</h3>
                        <div className="field-grid">
                          <label>Monotipo<select value={config.customRules?.monotype ?? ''} onChange={(e: { target: { value: string } }) => setConfig({...config,customRules:{...(config.customRules ?? {}),monotype:(e.target.value || undefined) as PokemonType | undefined}})}><option value="">Sin restricción</option>{pokemonTypes.map(type => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
                          <label>Máximo compartiendo tipo<select value={config.customRules?.maxSharedType ?? ''} onChange={(e: { target: { value: string } }) => setConfig({...config,customRules:{...(config.customRules ?? {}),maxSharedType:e.target.value ? Number(e.target.value) : undefined}})}><option value="">Sin límite</option>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
                        </div>
                        <div className="custom-checks">
                          <CheckOption label="Solo Pokémon de esta generación" checked={Boolean(config.customRules?.onlyCurrentGeneration)} onChange={checked => setConfig({...config,customRules:{...(config.customRules ?? {}),onlyCurrentGeneration:checked}})} />
                          <CheckOption label="Solo formas regionales" checked={Boolean(config.customRules?.onlyRegionalForms)} onChange={checked => setConfig({...config,customRules:{...(config.customRules ?? {}),onlyRegionalForms:checked}})} />
                          <CheckOption label="Permitir pseudo-legendarios" checked={config.customRules?.pseudoLegendaryRule !== 'exclude'} onChange={checked => setConfig({...config,customRules:{...(config.customRules ?? {}),pseudoLegendaryRule:checked ? 'allow' : 'exclude'}})} />
                          <CheckOption label="Permitir fósiles" checked={config.customRules?.fossilRule !== 'exclude'} onChange={checked => setConfig({...config,customRules:{...(config.customRules ?? {}),fossilRule:checked ? 'allow' : 'exclude'}})} />
                        </div>
                      </div>}
                    </div>
                  </details>
                </section>

                <aside className="journey-aside">
                  <div className="destination-card"><div className="destination-art"><span>DESTINO · GENERACIÓN {generationLabel(game.generation)}</span><div>✦</div></div><h2>Un mundo por recorrer.</h2><p>Cada partida puede empezar con compañeros distintos.</p></div>
                  <div className="summary-card"><h3>Tu punto de partida</h3><p><b>⚑ {game.name}</b><small>Juego base · Generación {generationLabel(game.generation)}</small></p><p><b>♧ {config.teamSize} compañeros</b><small>{config.starterRule === 'require_one' ? 'Un inicial' : 'Inicial libre'} · {config.legendaryRule === 'exclude' ? 'Sin legendarios' : 'Legendarios permitidos'}</small></p><p><b>◉ Modo {config.mode === 'adventure' ? 'Aventura' : config.mode === 'random' ? 'Full Random' : 'Personalizado'}</b><small>{availableCount} candidatos legales ahora</small></p></div>
                  {hasGameData ? <div className="respect-card">♢ <span>Tus filtros se respetan siempre. Si no hay suficientes Pokémon, tú decides cómo continuar.</span></div> : <div className="data-warning">⚠ <span><b>Datos de disponibilidad pendientes.</b> El juego está en el catálogo, pero aún necesita importar/curar su pool antes de generar.</span></div>}
                </aside>
              </div>

              <div className="generate-row"><span>{hasGameData ? 'Una selección nueva en cada aventura.' : 'Catálogo listo; disponibilidad del juego pendiente.'}</span><button className="primary large" disabled={!hasGameData} onClick={runGenerator}>⤨ Generar equipo</button></div>
            </>
          ) : (
            <TeamResult
              result={result} config={config} gameName={game.name} notice={notice}
              onBack={() => setResult(null)} onRegenerate={runGenerator} onCopy={copyTeam} onSave={saveTeam}
              onToggleLock={toggleLock} onRerollSlot={rerollSlot} onClearLocks={clearLocks}
              onGenerateAvailable={generateAvailable}
            />
          )}
        </main>
      )}

      <footer><span>Proyecto fan · Pokémon pertenece a sus respectivos propietarios.</span><span>Cada equipo, una nueva historia.</span></footer>
    </div>
  );
}

function RuleSelector({ label, value, onChange }: { label: string; value: RequiredOneRule; onChange: (value: RequiredOneRule) => void }) {
  return <div className="rule-selector"><span className="field-label">{label}</span><div className="segmented">{([['allow','Permitir'],['require_one','Requerir 1'],['exclude','Excluir']] as [RequiredOneRule,string][]).map(([rule,text]) => <button key={rule} className={value === rule ? 'active' : ''} onClick={() => onChange(rule)}>{text}</button>)}</div></div>;
}

function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="custom-check"><input type="checkbox" checked={checked} onChange={(e: { target: { checked: boolean } }) => onChange(e.target.checked)} /><span>{label}</span></label>;
}

function TeamResult(props: {
  result: GenerationResult; config: GeneratorConfig; gameName: string; notice: string;
  onBack: () => void; onRegenerate: () => void; onCopy: () => void; onSave: () => void;
  onToggleLock: (index: number) => void; onRerollSlot: (index: number) => void; onClearLocks: () => void; onGenerateAvailable: () => void;
}) {
  const { result, config, gameName } = props;
  const locked = result.team.filter(slot => slot.locked).length;
  return <section id="team-section" className="team-section">
    <div className={result.complete ? 'result-badge success' : 'result-badge warning'}>{result.complete ? `EXPEDICIÓN LISTA · ${result.generatedSize}/${result.requestedSize}` : `${result.generatedSize}/${result.requestedSize} DISPONIBLES`}</div>
    <div className="result-heading"><div><h1>{result.complete ? 'Seis compañeros. Mil historias.' : 'Tus reglas llegaron hasta aquí.'}</h1><p className="hero-copy">{result.complete ? 'Tu aventura. Tus reglas. Este es el equipo con el que empieza la próxima.' : 'No relajamos ningún filtro automáticamente. Tú decides cómo continuar.'}</p></div><button className="primary" onClick={props.onSave}>▱ Guardar equipo</button></div>

    {!result.complete && <div className="availability-warning"><div><strong>{result.generatedSize}/{result.requestedSize} disponibles</strong><span>con la configuración actual</span></div><div><button className="primary" onClick={props.onGenerateAvailable}>Generar con disponibles</button><button className="secondary" onClick={props.onBack}>Modificar filtros</button></div></div>}

    <div className="team-context"><div><b>{gameName}</b><span>{config.mode === 'adventure' ? 'Aventura' : config.mode === 'random' ? 'Full Random' : 'Personalizado'} · {config.teamSize} miembros</span></div><button className="secondary" onClick={props.onBack}>⌄ Modificar filtros</button></div>
    <div className="team-actions"><div><button className="secondary" onClick={props.onRegenerate}>⟳ Regenerar equipo</button><button className="secondary" onClick={props.onCopy}>▣ Copiar equipo</button></div><div><span className="mini-badge">{locked} bloqueado{locked === 1 ? '' : 's'}</span><button className="secondary" onClick={props.onClearLocks}>▱ Limpiar bloqueos</button></div></div>

    <div className="pokemon-grid">{result.team.map((slot, index) => <PokemonCard key={`${slot.candidate.candidateKey}-${index}`} slot={slot} index={index} onLock={props.onToggleLock} onReroll={props.onRerollSlot} />)}</div>
    {props.notice && <div className="team-note">ⓘ {props.notice}</div>}
  </section>;
}

function PokemonCard({ slot, index, onLock, onReroll }: { slot: TeamSlot; index: number; onLock: (index: number) => void; onReroll: (index: number) => void }) {
  const pokemon = slot.candidate.resolvedPokemon;
  const mechanic = mechanicFor(pokemon.id);
  return <article className={slot.locked ? 'pokemon-card locked' : 'pokemon-card'}>
    <div className="card-number">N.º {String(pokemon.id).padStart(4,'0')}<span>{slot.locked ? '▣' : '▢'}</span></div>
    <div className="pokemon-art"><img src={spriteUrl(pokemon.id)} alt={pokemon.name} loading="lazy" /></div>
    <h2>{pokemon.name}</h2>
    <span className="form-label">{slot.candidate.form?.name ?? 'Forma habitual'}</span>
    <div className="type-row">{pokemon.types.map(type => <span className={`type type-${type}`} key={type}>{typeLabels[type]}</span>)}</div>
    <div className="method-line">◈ {acquisitionLabel(slot)}</div>
    {mechanic && <div className="mechanic">✦ {mechanic}</div>}
    <div className="card-footer"><button onClick={() => onLock(index)}>{slot.locked ? '▣ Bloqueado' : '▢ Bloquear'}</button><button aria-label={`Regenerar ${pokemon.name}`} disabled={slot.locked} onClick={() => onReroll(index)}>⟳</button></div>
  </article>;
}

export default App;
