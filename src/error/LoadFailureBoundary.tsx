import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  scope: 'app' | 'matchups';
}
interface State { failed: boolean }

/**
 * Lazy route/chunk failures can happen if GitHub Pages replaces assets while
 * an older browser tab is still open. Keep a recovery action on screen rather
 * than letting one render error unmount the entire application.
 */
export default class LoadFailureBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No private user or saved-team data is logged.
    console.error('No se pudo renderizar un módulo de Pokémon Adventure', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    const isMeta = this.props.scope === 'matchups';
    const title = isMeta ? 'No se pudo abrir el análisis de matchups' : 'La aplicación no se pudo mostrar';
    const description = isMeta
      ? 'El módulo competitivo no terminó de cargar. Tu equipo sigue guardado y el editor puede continuar.'
      : 'Una actualización de la página o un módulo que no cargó correctamente puede causar este problema.';
    const failure = (
      <div className="app-load-error" role="alert">
        <h2>{title}</h2>
        <p>{description}</p>
        <p>Recarga la página para obtener los archivos de la versión más reciente. No es necesario borrar tus equipos.</p>
        <button type="button" onClick={() => window.location.reload()}>Recargar página</button>
      </div>
    );
    return isMeta
      ? <section className="comp-meta-panel" aria-label="Estado del módulo de matchups">{failure}</section>
      : <main className="page">{failure}</main>;
  }
}
