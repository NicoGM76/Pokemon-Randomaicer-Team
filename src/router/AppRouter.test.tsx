/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RootApp from '../RootApp';

afterEach(() => {
  cleanup();
  window.location.hash = '';
  localStorage.clear();
});

describe('V2 route navigation', () => {
  it('opens the collection directly from its hash route', async () => {
    window.location.hash = '#/collection';
    render(<RootApp />);

    expect(await screen.findByText('UNA COLECCIÓN · MUCHAS AVENTURAS')).toBeTruthy();
  });

  it('opens the competitive landing directly from its hash route', async () => {
    window.location.hash = '#/competitive';
    render(<RootApp />);

    expect(await screen.findByRole('link', { name: 'Competitivo' })).toBeTruthy();
    expect(await screen.findByText('V2 · COMPETITIVO')).toBeTruthy();
  });

  it('writes section changes into the browser URL instead of component-only state', async () => {
    window.location.hash = '#/adventure';
    render(<RootApp />);
    expect(await screen.findByText('EL PRÓXIMO VIAJE EMPIEZA AQUÍ')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'Colección' }));
    await waitFor(() => expect(window.location.hash).toBe('#/collection'));
    expect(await screen.findByText('UNA COLECCIÓN · MUCHAS AVENTURAS')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'Guardados' }));
    await waitFor(() => expect(window.location.hash).toBe('#/saved'));
    expect(await screen.findByText('TU MOCHILA DE EQUIPOS')).toBeTruthy();
  });
});
