import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { extractPaletteFromPixels } from './lib/palette-extract.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const paletteExtractPath = path.join(__dirname, 'lib', 'palette-extract.mjs');
const buildScriptPath = fileURLToPath(import.meta.url);
const imagesDir = path.join(publicDir, 'unsplash_images');
const dataDir = path.join(publicDir, 'data');
const urlsPath = path.join(publicDir, 'urls.json');

const SKIP = process.env.SKIP_PALETTE_BUILD === '1';
const palettesPath = path.join(dataDir, 'palettes.json');
const urlMapPath = path.join(publicDir, 'js', 'url-map.js');

async function shouldSkipPaletteBuild() {
  if (SKIP) {
    return true;
  }

  try {
    const [paletteStats, urlMapStats, extractStats, buildScriptStats] = await Promise.all([
      stat(palettesPath),
      stat(urlMapPath),
      stat(paletteExtractPath),
      stat(buildScriptPath),
    ]);
    const imageFiles = await readdir(imagesDir);
    let newestImageTime = 0;

    for (const file of imageFiles) {
      if (!/^img\d+\.jpg$/.test(file)) continue;
      const fileStats = await stat(path.join(imagesDir, file));
      newestImageTime = Math.max(newestImageTime, fileStats.mtimeMs);
    }

    return (
      paletteStats.mtimeMs > newestImageTime &&
      paletteStats.mtimeMs > extractStats.mtimeMs &&
      paletteStats.mtimeMs > buildScriptStats.mtimeMs &&
      urlMapStats.mtimeMs > newestImageTime
    );
  } catch {
    return false;
  }
}

function rgbToHex(r, g, b) {
  const toHex = (value) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizeLocalPath(index) {
  return `/unsplash_images/img${index}.jpg`;
}

async function buildUrlMap(urls) {
  const map = {};
  const limit = Math.min(urls.length, 1374);

  for (let i = 0; i < limit; i++) {
    map[urls[i]] = normalizeLocalPath(i);
    map[`./unsplash_images/img${i}.jpg`] = normalizeLocalPath(i);
    map[`../unsplash_images/img${i}.jpg`] = normalizeLocalPath(i);
  }

  await writeFile(
    urlMapPath,
    `window.IMAGEHUES_URL_MAP = ${JSON.stringify(map)};\n`,
    'utf8'
  );

  return map;
}

async function buildPalettes(imageFiles) {
  const palettes = {};
  let processed = 0;

  for (const file of imageFiles) {
    const match = file.match(/^img(\d+)\.jpg$/);
    if (!match) continue;

    const imagePath = path.join(imagesDir, file);
    const imageUrl = normalizeLocalPath(Number(match[1]));

    try {
      const { data, info } = await sharp(imagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const colors = extractPaletteFromPixels(data, info.width, info.height, 5, 4);
      palettes[imageUrl] = colors.map(([r, g, b]) => ({
        rgb: [r, g, b],
        hex: rgbToHex(r, g, b),
      }));
      processed += 1;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${imageFiles.length} palettes...`);
      }
    } catch (error) {
      console.warn(`Skipping ${file}: ${error.message}`);
    }
  }

  await writeFile(
    palettesPath,
    JSON.stringify(palettes),
    'utf8'
  );

  return processed;
}

async function main() {
  if (await shouldSkipPaletteBuild()) {
    console.log('Palette build skipped (already up to date).');
    return;
  }

  await mkdir(dataDir, { recursive: true });

  const urlsJson = JSON.parse(await readFile(urlsPath, 'utf8'));
  const urls = urlsJson[0].urls;
  await buildUrlMap(urls);
  console.log(`Built URL map for ${Math.min(urls.length, 1374)} images.`);

  const imageFiles = (await readdir(imagesDir))
    .filter((file) => /^img\d+\.jpg$/.test(file))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  const processed = await buildPalettes(imageFiles);
  console.log(`Built ${processed} precomputed palettes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
