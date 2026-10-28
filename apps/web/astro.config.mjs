import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  vite: {
    // D-1 (ADR-0001): HTTPS en desarrollo para que Safari acepte la cookie `Secure`.
    plugins: [tailwindcss(), basicSsl()],
    server: {
      // C-7: el front llama a `/api/...` en su mismo origen; sin CORS.
      proxy: { '/api': 'http://localhost:3000' },
    },
  },
});
