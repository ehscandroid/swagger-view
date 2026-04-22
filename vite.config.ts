import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({// https://vite.dev/config/
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    // https: true,  // Enable HTTPS
    host: '0.0.0.0',
    port: 5682,
  }
});