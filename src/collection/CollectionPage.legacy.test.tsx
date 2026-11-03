/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CollectionPage from './CollectionPage';
import { COLLECTION_DRAFT_KEY, loadCollectionDraft } from './collectionDraft';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('collection draft compatibility after evolution engine upgrade', () => {
  it('keeps old saved teams but clearly invites regeneration with the new logic', () => {
    const first = render(<CollectionPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Generar colección' }));
    const previous = loadCollectionDraft();
    expect(previous?.result?.teams.length).toBe(2);
    first.unmount();

    // Simulate a V2.0/old V2.1 collection without a result engine marker.
    localStorage.setItem(COLLECTION_DRAFT_KEY, JSON.stringify({
      version: 1,
      value: { config: previous!.config, result: previous!.result }
    }));

    render(<CollectionPage />);
    expect(screen.getByText(/Resultado generado con lógica anterior/)).toBeTruthy();
    expect(screen.getByText('2 equipos. Una sola colección.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Regenerar desbloqueados' }));
    expect(screen.queryByText(/Resultado generado con lógica anterior/)).toBeNull();
    expect(loadCollectionDraft()?.result?.teams.length).toBe(2);
  });
});
