import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../i18n/LocaleProvider';
import games from '../data/curated/games.json';
import type { GenerationResult, SavedTeam } from '../domain/teams/types';
import { saveAdventureDraft } from '../adventure/adventureDraft';
import { LocalStorageTeamRepository } from '../storage/LocalStorageTeamRepository';

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
  const navigate = useNavigate();
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>(() => repository.getAll());

  const loadSaved = (saved: SavedTeam) => {
    saveAdventureDraft({
      config: saved.config,
      result: resultFromSaved(saved),
      notice: `Equipo “${saved.name}” cargado.`
    });
    navigate('/adventure');
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
      {savedTeams.length === 0 ? (
        <div className="empty-state">
          <span>◇</span>
          <h2>{t('Aún no guardaste equipos')}</h2>
          <p>{t('Genera una expedición y usa “Guardar equipo”.')}</p>
          <button className="primary" onClick={() => navigate('/adventure')}>{t('Ir al generador')}</button>
        </div>
      ) : (
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
      )}
    </main>
  );
}
