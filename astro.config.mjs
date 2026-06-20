import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
  },
});
