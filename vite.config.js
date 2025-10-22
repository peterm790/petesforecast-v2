import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/petesforecast-v2/',
  resolve: {
    alias: {
      '@menu_bar': fileURLToPath(new URL('./src/menu_bar', import.meta.url)),
      '@time_slider': fileURLToPath(new URL('./src/time_slider', import.meta.url)),
    },
  },
});


