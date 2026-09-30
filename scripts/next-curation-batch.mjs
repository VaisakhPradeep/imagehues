#!/usr/bin/env node

import { readFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

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

/**
 * Generate a horizontal swatch PNG from 4 hex colors
 * @param {string[]} hexes - Array of 4 hex color strings
 * @param {string} outputPath - Path to write the PNG
 */
async function generateSwatch(hexes, outputPath) {
  const chipWidth = 80;
  const chipHeight = 48;
  const totalWidth = chipWidth * 4;
  
  // Create SVG with 4 color rectangles (320x48 total)
  const svg = `
    <svg width="${totalWidth}" height="${chipHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${chipWidth}" height="${chipHeight}" fill="${hexes[0] || '#cccccc'}" />
      <rect x="${chipWidth}" y="0" width="${chipWidth}" height="${chipHeight}" fill="${hexes[1] || '#cccccc'}" />
      <rect x="${chipWidth * 2}" y="0" width="${chipWidth}" height="${chipHeight}" fill="${hexes[2] || '#cccccc'}" />
      <rect x="${chipWidth * 3}" y="0" width="${chipWidth}" height="${chipHeight}" fill="${hexes[3] || '#cccccc'}" />
      <line x1="${chipWidth}" y1="0" x2="${chipWidth}" y2="${chipHeight}" stroke="#e0e0e0" stroke-width="1" />
      <line x1="${chipWidth * 2}" y1="0" x2="${chipWidth * 2}" y2="${chipHeight}" stroke="#e0e0e0" stroke-width="1" />
      <line x1="${chipWidth * 3}" y1="0" x2="${chipWidth * 3}" y2="${chipHeight}" stroke="#e0e0e0" stroke-width="1" />
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

async function main() {
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

  // Generate palette swatches for the batch
  // Swatches are written to data/swatches/ (not committed to git)
  const swatchesDir = join(ROOT, 'data', 'swatches');
  mkdirSync(swatchesDir, { recursive: true });

  // Generate swatches for all images in batch
  for (const item of batch) {
    const swatchPath = join(swatchesDir, `img${item.id}.png`);
    await generateSwatch(item.palette, swatchPath);
    item.swatchPath = `data/swatches/img${item.id}.png`;
  }

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
      console.log(`Swatch: ${item.swatchPath}`);
      console.log('');
    }
  } else {
    console.log(JSON.stringify(batch, null, 2));
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
