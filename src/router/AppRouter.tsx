import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './AppShell';

const AdventurePage = lazy(() => import('../App'));
const CollectionPage = lazy(() => import('../collection/CollectionPage'));
const CompetitiveLandingPage = lazy(() => import('../competitive/CompetitiveLandingPage'));

function RouteLoading() {
  return (
    <main className="page route-loading" aria-live="polite">
      <div className="section-kicker">CARGANDO</div>
      <p>Preparando esta sección…</p>
    </main>
  );
}

export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/adventure" replace />} />
            <Route path="/adventure" element={<AdventurePage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/competitive" element={<CompetitiveLandingPage />} />
            <Route path="/saved" element={<Navigate to="/adventure" replace />} />
            <Route path="*" element={<Navigate to="/adventure" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
