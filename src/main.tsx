import React from 'react';
import ReactDOM from 'react-dom/client';
import RootApp from './RootApp';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('No se encontró el elemento #root en index.html');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
