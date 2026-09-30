import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://imagehues.com';

const publicAltPalettePaths = [
  '/palette/10/',
  '/palette/15/',
  '/palette/23/',
  '/palette/55/',
  '/palette/60/',
  '/palette/113/',
  '/palette/118/',
  '/palette/239/',
];

const excludedPaths = [
  ...publicAltPalettePaths,
  '/favourites/',
];

export default defineConfig({
  site,
  integrations: [
    sitemap({
      filter: (page) => !excludedPaths.some(path => page.endsWith(path)),
    }),
  ],
  build: {
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
