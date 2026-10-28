import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Pokemon-Randomaicer-Team/',
  plugins: [react()],
  test: {
    environment: 'node'
  }
});
