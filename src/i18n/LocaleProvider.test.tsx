/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RootApp from '../RootApp';
import { LocaleProvider, useLocale } from './LocaleProvider';

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
});

function LocaleHarness() {
  const { locale, setLocale, t } = useLocale();
  return <div>
    <button onClick={() => setLocale('es-ES')}>Cambiar a España</button>
    <button onClick={() => setLocale('es-419')}>Cambiar a Latinoamérica</button>
    <span data-testid="locale">{locale}</span>
    <span data-testid="translated">{t('Elige tu juego, marca tus límites y descubre a tus próximos compañeros.')}</span>
  </div>;
}

describe('global locale', () => {
  it('uses shared Spanish regional variants and persists the choice', () => {
    const view = render(<LocaleProvider><LocaleHarness /></LocaleProvider>);
    expect(screen.getByTestId('locale').textContent).toBe('es-419');
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a España' }));
    expect(screen.getByTestId('locale').textContent).toBe('es-ES');
    expect(screen.getByTestId('translated').textContent).toContain('Escoge tu juego');
    view.unmount();
    render(<LocaleProvider><LocaleHarness /></LocaleProvider>);
    expect(screen.getByTestId('locale').textContent).toBe('es-ES');
  });

  it('offers a global language switch and localizes Adventure and Saved across navigation', async () => {
    window.location.hash = '#/adventure';
    render(<RootApp />);
    const switcher = await screen.findByRole('combobox', { name: 'Idioma de la página' });
    fireEvent.change(switcher, { target: { value: 'es-ES' } });
    expect(await screen.findByText(/Escoge tu juego, fija tus límites/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Equipos guardados' })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Equipos guardados' }));
    expect(await screen.findByText('Todavía no has guardado equipos')).toBeTruthy();
    expect((screen.getByRole('combobox', { name: 'Idioma de la página' }) as HTMLSelectElement).value).toBe('es-ES');
  });

  it('applies regional variation to collection and competitive sections too', async () => {
    localStorage.setItem('pokemon-team-generator:locale', 'es-ES');
    window.location.hash = '#/collection';
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Organiza toda tu colección' })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Competitivo' }));
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expect(screen.getByText(/cada formato mantiene un borrador/i)).toBeTruthy();
  });
});
