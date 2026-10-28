import { useState } from 'react';
import App from './App';
import CollectionPage from './collection/CollectionPage';

export default function RootApp() {
  const [line, setLine] = useState<'individual' | 'collection'>('individual');

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 16px',
        background: '#07111f',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <button className={line === 'individual' ? 'primary' : 'secondary'} onClick={() => setLine('individual')}>Equipo individual</button>
        <button className={line === 'collection' ? 'primary' : 'secondary'} onClick={() => setLine('collection')}>🗃 Colección de equipos</button>
      </div>
      {line === 'individual' ? <App /> : <CollectionPage />}
    </>
  );
}
