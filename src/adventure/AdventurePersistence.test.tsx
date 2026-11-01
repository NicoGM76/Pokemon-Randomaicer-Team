/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { loadAdventureDraft } from './adventureDraft';

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('Adventure persistence', () => {
  it('restores an in-progress configuration after the page remounts', async () => {
    const firstRender = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    await waitFor(() => expect(loadAdventureDraft()?.config.teamSize).toBe(3));

    firstRender.unmount();
    render(<App />);

    expect(screen.getByRole('button', { name: '3' }).className).toContain('active');
  });
});
