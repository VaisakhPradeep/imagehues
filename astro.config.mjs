import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://imagehues.com';

export default defineConfig({
  site,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/about.html') && !page.includes('/favourites.html'),
    }),
  ],
  build: {
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
