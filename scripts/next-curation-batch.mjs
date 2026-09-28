#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
let count = 20;
let format = 'json';

for (const arg of args) {
  if (arg.startsWith('--count=')) {
    count = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--format=markdown') {
    format = 'markdown';
  }
}

// Load curation picks (already locked images)
const picksPath = join(ROOT, 'data', 'curation-picks.json');
const picksData = JSON.parse(readFileSync(picksPath, 'utf-8'));
const lockedIds = new Set(Object.keys(picksData.picks));

// Load palette suggestions
const suggestionsPath = join(ROOT, 'data', 'palette-suggestions.json');
const suggestions = JSON.parse(readFileSync(suggestionsPath, 'utf-8'));

// Load palette hexes
const palettesPath = join(ROOT, 'public', 'data', 'palettes.json');
const palettesData = JSON.parse(readFileSync(palettesPath, 'utf-8'));

// Enumerate all images in public/unsplash_images/
const imagesDir = join(ROOT, 'public', 'unsplash_images');
const files = readdirSync(imagesDir);

// Extract image IDs and sort numerically
const imageIds = files
  .filter(f => f.startsWith('img') && f.endsWith('.jpg'))
  .map(f => {
    const match = f.match(/^img(\d+)\.jpg$/);
    return match ? parseInt(match[1], 10) : null;
  })
  .filter(id => id !== null)
  .sort((a, b) => a - b);

// Filter out already curated images
const uncuratedIds = imageIds.filter(id => !lockedIds.has(String(id)));

// Take the first N uncurated images
const nextBatch = uncuratedIds.slice(0, count);

// Build output
const batch = nextBatch.map(id => {
  const paletteKey = `/unsplash_images/img${id}.jpg`;
  const paletteColors = palettesData[paletteKey] || [];
  const hexes = paletteColors.map(c => c.hex);
  
  return {
    id: String(id),
    filename: `img${id}.jpg`,
    url: `https://raw.githubusercontent.com/VaisakhPradeep/imagehues/main/public/unsplash_images/img${id}.jpg`,
    suggested: suggestions[String(id)] || [],
    palette: hexes
  };
});

// Output in requested format
if (format === 'markdown') {
  for (const item of batch) {
    console.log(`**img${item.id}**`);
    console.log(`![img${item.id}](${item.url})`);
    const suggested = item.suggested.length > 0 
      ? item.suggested.join(', ') 
      : '(none)';
    console.log(`Suggested: ${suggested}`);
    const paletteStr = item.palette.length > 0
      ? item.palette.join(' · ')
      : '(none)';
    console.log(`Palette: ${paletteStr}`);
    console.log('');
  }
} else {
  console.log(JSON.stringify(batch, null, 2));
}
