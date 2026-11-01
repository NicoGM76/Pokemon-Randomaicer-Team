/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RootApp from '../RootApp';

afterEach(() => {
  cleanup();
  window.location.hash = '';
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

    expect(await screen.findByText('Competitivo')).toBeTruthy();
    expect(await screen.findByText(/V2/i)).toBeTruthy();
  });
});
