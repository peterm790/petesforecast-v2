import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/',
  server: {
    proxy: {
      '/cf-polars': {
        target: 'https://data.offshoreweatherrouting.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cf-polars/, '/polars')
      }
    }
  },
  resolve: {
    alias: {
      '@menu_bar': fileURLToPath(new URL('./src/menu_bar', import.meta.url)),
      '@time_slider': fileURLToPath(new URL('./src/time_slider', import.meta.url)),
    },
  },
});

