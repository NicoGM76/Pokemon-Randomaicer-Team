/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { SavedTeam } from '../domain/teams/types';
import { LocalStorageTeamRepository } from '../storage/LocalStorageTeamRepository';
import { loadAdventureDraft } from '../adventure/adventureDraft';
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
});
