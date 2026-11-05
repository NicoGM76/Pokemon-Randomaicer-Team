import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleProvider';
import games from '../data/curated/games.json';
import pokemonCatalog from '../data/generated/pokemon.json';
import type { Pokemon } from '../domain/pokemon/types';
import type { GenerationResult, SavedTeam } from '../domain/teams/types';
import { saveAdventureDraft } from '../adventure/adventureDraft';
import { LocalStorageTeamRepository } from '../storage/LocalStorageTeamRepository';
import {
  SavedCompetitiveTeamRepository, restoreCompetitiveTeam, type SavedCompetitiveTeam
} from '../competitive/savedCompetitiveTeams';
import { baseArtworkUrl, memberArtworkUrl, memberDisplayName } from '../competitive/memberArtwork';

const pokemon = pokemonCatalog as unknown as Pokemon[];
const pokemonById = new Map(pokemon.map(entry => [entry.id, entry]));

function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function resultFromSaved(team: SavedTeam): GenerationResult {
  return {
    team: team.team,
    requestedSize: team.config.teamSize,
    generatedSize: team.team.length,
    complete: team.team.length === team.config.teamSize,
    validation: { valid: true, issues: [] },
    warnings: []
  };
}

export default function SavedTeamsPage() {
  const { locale, t } = useLocale();
  const repository = useMemo(() => new LocalStorageTeamRepository(), []);
  const competitiveRepository = useMemo(() => new SavedCompetitiveTeamRepository(), []);
  const navigate = useNavigate();
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(() => repository.getAll());
  const [competitiveTeams, setCompetitiveTeams] = useState<SavedCompetitiveTeam[]>(
    () => competitiveRepository.getAll()
  );
  const [notice, setNotice] = useState('');

  const loadSaved = (saved: SavedTeam) => {
    saveAdventureDraft({
      config: saved.config,
      result: resultFromSaved(saved),
      notice: `Equipo “${saved.name}” cargado.`
    });
    navigate('/adventure');
  };

  const loadCompetitive = (saved: SavedCompetitiveTeam) => {
    restoreCompetitiveTeam(saved);
    navigate('/competitive');
  };

  const deleteCompetitive = (id: string) => {
    if (!competitiveRepository.delete(id)) {
      setNotice('No se pudo eliminar el equipo competitivo de este navegador.');
      return;
    }
    setCompetitiveTeams(competitiveRepository.getAll());
    setNotice('Equipo competitivo eliminado.');
  };

  const deleteSaved = (id: string) => {
    repository.delete(id);
    setSavedTeams(repository.getAll());
  };

  return (
    <main className="page saved-page">
      <div className="section-kicker">TU MOCHILA DE EQUIPOS</div>
      <h1>{t('Mis equipos')}</h1>
      <p className="hero-copy">{t('Guardados en este navegador. Puedes volver a cualquiera cuando quieras.')}</p>
      {savedTeams.length === 0 && competitiveTeams.length === 0 ? (
        <div className="empty-state">
          <span>◇</span>
          <h2>{t('Aún no guardaste equipos')}</h2>
          <p>Genera un equipo en Aventura o configura uno en Competitivo y pulsa «Guardar equipo».</p>
          <div className="saved-actions saved-empty-actions">
            <button className="primary" onClick={() => navigate('/adventure')}>{t('Ir al generador')}</button>
            <button className="secondary" onClick={() => navigate('/competitive')}>Ir a Competitivo</button>
          </div>
        </div>
      ) : <>
        {savedTeams.length > 0 && <section aria-label="Equipos de Aventura guardados">
          <h2 className="saved-section-heading">Aventura y generación</h2>
          <div className="saved-grid">
            {savedTeams.map(saved => (
              <article className="saved-card" key={saved.id}>
                <div>
                  <span className="mini-badge">{saved.config.mode === 'adventure' ? 'Aventura' : saved.config.mode === 'random' ? 'Full Random' : 'Personalizado'}</span>
                  <h2>{saved.name}</h2>
                  <p>{games.find(game => game.id === saved.gameId)?.name ?? saved.gameId}</p>
                </div>
                <div className="saved-sprites">
                  {saved.team.slice(0, 6).map(slot => (
                    <img key={slot.candidate.candidateKey} src={spriteUrl(slot.candidate.resolvedPokemon.id)} alt="" />
                  ))}
                </div>
                <small>{new Date(saved.createdAt).toLocaleDateString(locale)} · {saved.team.length} compañeros</small>
                <div className="saved-actions">
                  <button className="secondary" onClick={() => loadSaved(saved)}>Cargar</button>
                  <button className="danger" onClick={() => deleteSaved(saved.id)}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </section>}
        {competitiveTeams.length > 0 && <section aria-label="Equipos competitivos guardados">
          <h2 className="saved-section-heading">Competitivo</h2>
          <div className="saved-grid">
            {competitiveTeams.map(saved => (
              <article className="saved-card" key={saved.id}>
                <div>
                  <span className="mini-badge">{saved.format === 'singles' ? 'Singles 6v6' : 'Dobles VGC'}</span>
                  <h2>{saved.name}</h2>
                  <p>{saved.environment === 'champions' ? 'Pokémon Champions · 66 PC' : 'Escarlata/Púrpura · EVs e IVs'}</p>
                </div>
                <div className="saved-sprites">
                  {saved.team.map((slot, index) => {
                    if (!slot) return null;
                    const entry = pokemonById.get(slot.pokemonId);
                    return <img key={index} src={memberArtworkUrl(slot.pokemonId, slot.formId)}
                      title={entry ? memberDisplayName(slot.pokemonId, entry.name, slot.formId) : '#' + slot.pokemonId}
                      alt="" onError={event => {
                        const fallback = baseArtworkUrl(slot.pokemonId);
                        if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
                      }}/>;
                  })}
                </div>
                <small>{new Date(saved.createdAt).toLocaleDateString(locale)} · {saved.team.filter(Boolean).length} / 6 Pokémon</small>
                <div className="saved-actions">
                  <button className="secondary" onClick={() => loadCompetitive(saved)}>Cargar</button>
                  <button className="danger" onClick={() => deleteCompetitive(saved.id)}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        </section>}
      </>}
      {notice && <p className="saved-feedback" role="status">{notice}</p>}
    </main>
  );
}
