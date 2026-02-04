import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ariaria2021.github.io',
  integrations: [react()],
  output: 'static',
});
