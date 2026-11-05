/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { SavedTeam } from '../domain/teams/types';
import { LocalStorageTeamRepository } from '../storage/LocalStorageTeamRepository';
import { loadAdventureDraft } from '../adventure/adventureDraft';
import { createEmptyWorkspace, loadCompetitiveDraft, saveCompetitiveDraft } from '../competitive/competitiveDraft';
import { SavedCompetitiveTeamRepository, type SavedCompetitiveTeam } from '../competitive/savedCompetitiveTeams';
import SavedTeamsPage from './SavedTeamsPage';

const saved: SavedTeam = {
  id: 'saved-1',
  name: 'Teselia prueba',
  createdAt: '2026-11-01T00:00:00.000Z',
  gameId: 'black',
  config: {
    gameId: 'black', enabledContentPacks: ['black-base'], teamSize: 6, stage: 'all', mode: 'adventure',
    allowedMethods: ['wild'], allowTradeEvolution: false, starterRule: 'allow', legendaryRule: 'exclude'
  },
  team: []
};

beforeEach(() => {
  localStorage.clear();
  new LocalStorageTeamRepository().save(saved);
});

describe('SavedTeamsPage', () => {
  it('loads a saved team into the adventure draft and navigates to adventure', async () => {
    render(
      <MemoryRouter initialEntries={['/saved']}>
        <Routes>
          <Route path="/saved" element={<SavedTeamsPage />} />
          <Route path="/adventure" element={<div>Adventure route</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Cargar' }));

    expect(await screen.findByText('Adventure route')).toBeTruthy();
    const draft = loadAdventureDraft();
    expect(draft?.config.gameId).toBe('black');
    expect(draft?.notice).toContain('Teselia prueba');
  });
  it('lists both modes, restores a Champions double Mega set and does not touch the adventure saves', async () => {
    const set: NonNullable<SavedCompetitiveTeam['team'][number]> = {
      pokemonId: 448, formId: 'lucario-mega-z', role: 'special',
      nature: 'Timid', ability: 'Aura Guard', item: 'Lucarionite Z',
      moves: ['Aura Sphere', 'Flash Cannon', 'Dark Pulse', 'Protect'],
      evs: { hp: 4, attack: 0, defense: 0, specialAttack: 252, specialDefense: 0, speed: 252 },
      ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
      championsPoints: { hp: 2, attack: 0, defense: 0, specialAttack: 32, specialDefense: 0, speed: 32 },
      locked: true
    };
    const competitive: SavedCompetitiveTeam = {
      id: 'champions-1', name: 'Doble Mega Champions', createdAt: '2026-11-05T13:00:00Z',
      format: 'doubles', environment: 'champions',
      team: [set, null, null, null, null, null]
    };
    new SavedCompetitiveTeamRepository().save(competitive);
    const previous = createEmptyWorkspace();
    previous.teams.singles[0] = { ...set, pokemonId: 25, formId: undefined, locked: false };
    saveCompetitiveDraft(previous);

    const view = render(
      <MemoryRouter initialEntries={['/saved']}>
        <Routes>
          <Route path="/saved" element={<SavedTeamsPage />} />
          <Route path="/competitive" element={<div>Competitive route</div>} />
          <Route path="/adventure" element={<div>Adventure route</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Aventura y generación' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Competitivo' })).toBeTruthy();
    const adventureCard = screen.getByRole('article', { name: 'Equipo de aventura: Teselia prueba' });
    const competitiveCard = screen.getByRole('article', { name: 'Equipo competitivo: Doble Mega Champions' });
    expect(within(adventureCard).getByRole('button', { name: 'Cargar' })).toBeTruthy();
    expect(within(competitiveCard).getByText('Pokémon Champions · 66 PC')).toBeTruthy();
    expect(within(competitiveCard).getByRole('img', { hidden: true }).getAttribute('src')).toContain('/10310.png');

    fireEvent.click(within(competitiveCard).getByRole('button', { name: 'Cargar' }));
    expect(await screen.findByText('Competitive route')).toBeTruthy();
    const loaded = loadCompetitiveDraft();
    expect(loaded.format).toBe('doubles');
    expect(loaded.environmentByFormat?.doubles).toBe('champions');
    expect(loaded.teams.doubles[0]).toEqual(set);
    expect(loaded.teams.singles[0]?.pokemonId).toBe(25);
    expect(new LocalStorageTeamRepository().getAll()).toHaveLength(1);

    view.unmount();
    render(
      <MemoryRouter initialEntries={['/saved']}>
        <Routes><Route path="/saved" element={<SavedTeamsPage />} /></Routes>
      </MemoryRouter>
    );
    const again = screen.getByRole('article', { name: 'Equipo competitivo: Doble Mega Champions' });
    fireEvent.click(within(again).getByRole('button', { name: 'Eliminar' }));
    expect(screen.queryByRole('article', { name: 'Equipo competitivo: Doble Mega Champions' })).toBeNull();
    expect(screen.getByRole('article', { name: 'Equipo de aventura: Teselia prueba' })).toBeTruthy();
    expect(new SavedCompetitiveTeamRepository().getAll()).toHaveLength(0);
  });

});
