/** @vitest-environment jsdom */
import { lazy, Suspense } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import LoadFailureBoundary from './LoadFailureBoundary';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function RenderFailure(): never {
  throw new Error('Error de renderizado simulado');
}

describe('recoverable lazy module rendering', () => {
  it('shows a reload action instead of a blank app after a route throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<LoadFailureBoundary scope="app"><RenderFailure /></LoadFailureBoundary>);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'La aplicación no se pudo mostrar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeTruthy();
    expect(screen.getByText(/No es necesario borrar tus equipos/)).toBeTruthy();
  });

  it('contains a broken matchup and keeps the surrounding editor available', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<>
      <h1>Tu laboratorio competitivo</h1>
      <LoadFailureBoundary scope="matchups"><RenderFailure /></LoadFailureBoundary>
      <button>Guardar equipo</button>
    </>);
    expect(screen.getByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'No se pudo abrir el análisis de matchups' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar equipo' })).toBeTruthy();
  });

  it('catches rejected lazy imports such as an outdated chunk after deployment', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const RejectedChunk = lazy(async () => { throw new Error('Failed to fetch dynamically imported module'); });
    render(<LoadFailureBoundary scope="matchups">
      <Suspense fallback={<p>Cargando módulo…</p>}><RejectedChunk /></Suspense>
    </LoadFailureBoundary>);
    expect(await screen.findByRole('heading', { name: 'No se pudo abrir el análisis de matchups' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeTruthy();
  });
});
