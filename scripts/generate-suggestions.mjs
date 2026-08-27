import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const palettesPath = path.join(__dirname, '..', 'public', 'data', 'palettes.json');
const outputPath = path.join(__dirname, '..', 'src', 'data', 'paletteSuggestions.ts');

// Conservative color analysis helpers
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function analyzePalette(colors) {
  const rgbs = colors.map(c => hexToRgb(c.hex)).filter(Boolean);
  const hsls = rgbs.map(rgb => rgbToHsl(rgb.r, rgb.g, rgb.b));
  
  // Count dominant hues
  const blues = hsls.filter(hsl => hsl.h >= 180 && hsl.h <= 240 && hsl.s > 20).length;
  const greens = hsls.filter(hsl => hsl.h >= 80 && hsl.h <= 160 && hsl.s > 20).length;
  const oranges = hsls.filter(hsl => hsl.h >= 15 && hsl.h <= 45 && hsl.s > 30).length;
  const reds = hsls.filter(hsl => (hsl.h >= 345 || hsl.h <= 15) && hsl.s > 30).length;
  const yellows = hsls.filter(hsl => hsl.h >= 45 && hsl.h <= 70 && hsl.s > 30).length;
  const purples = hsls.filter(hsl => hsl.h >= 270 && hsl.h <= 330 && hsl.s > 20).length;
  const pinks = hsls.filter(hsl => hsl.h >= 300 && hsl.h <= 345 && hsl.s > 20 && hsl.l > 40).length;
  const teals = hsls.filter(hsl => hsl.h >= 160 && hsl.h <= 200 && hsl.s > 20).length;
  
  // Lightness analysis
  const avgLightness = hsls.reduce((sum, hsl) => sum + hsl.l, 0) / hsls.length;
  const hasBrights = hsls.some(hsl => hsl.l > 75);
  const hasDarks = hsls.some(hsl => hsl.l < 25);
  const highContrast = hasBrights && hasDarks;
  
  // Saturation analysis  
  const avgSaturation = hsls.reduce((sum, hsl) => sum + hsl.s, 0) / hsls.length;
  const highSat = avgSaturation > 50;
  const lowSat = avgSaturation < 30;
  
  return {
    blues, greens, oranges, reds, yellows, purples, pinks, teals,
    avgLightness, avgSaturation, highContrast, highSat, lowSat,
    hasBrights, hasDarks, total: colors.length
  };
}

function suggestCategories(analysis) {
  const suggestions = [];
  
  // VERY conservative suggestions based on strong color patterns
  
  // Ocean: dominant blues with saturation
  if (analysis.blues >= 2 && analysis.avgSaturation > 30) {
    if (analysis.teals >= 1) {
      suggestions.push('Ocean');
    } else if (analysis.blues >= 3) {
      suggestions.push('Ocean');
    }
  }
  
  // Sunset: oranges + purples/pinks or reds
  if (analysis.oranges >= 2 && (analysis.purples >= 1 || analysis.pinks >= 1 || analysis.reds >= 1)) {
    suggestions.push('Sunset');
  }
  
  // Golden hour: warm yellows + oranges without strong purples
  if (analysis.yellows >= 2 && analysis.oranges >= 1 && analysis.purples === 0 && analysis.avgLightness > 50) {
    suggestions.push('Golden hour');
  }
  
  // Forest: dominant greens
  if (analysis.greens >= 3 && analysis.avgSaturation > 25) {
    suggestions.push('Forest');
  }
  
  // Autumn: oranges/reds/yellows with muted tones
  if ((analysis.oranges + analysis.reds + analysis.yellows) >= 3 && analysis.avgSaturation < 60 && analysis.avgLightness < 70) {
    suggestions.push('Autumn');
  }
  
  // Desert: oranges/yellows without blues or greens
  if ((analysis.oranges >= 2 || analysis.yellows >= 2) && analysis.blues === 0 && analysis.greens === 0 && analysis.avgSaturation > 20) {
    suggestions.push('Desert');
  }
  
  // Beach: requires both sandy tones and blues - very specific
  if (analysis.blues >= 1 && analysis.oranges >= 1 && analysis.yellows >= 1 && analysis.avgLightness > 55) {
    suggestions.push('Beach');
  }
  
  // Tropical: vibrant greens + blues
  if (analysis.greens >= 2 && analysis.blues >= 1 && analysis.avgSaturation > 40) {
    suggestions.push('Tropical');
  }
  
  // Dusk: purples without oranges
  if (analysis.purples >= 2 && analysis.oranges === 0 && analysis.avgLightness < 55) {
    suggestions.push('Dusk');
  }
  
  // Aurora: purples/blues in dark palette
  if ((analysis.purples >= 2 || analysis.blues >= 2) && analysis.avgLightness < 40 && analysis.greens >= 1) {
    suggestions.push('Aurora');
  }
  
  // Fog: low saturation, mid lightness
  if (analysis.lowSat && analysis.avgLightness > 60 && analysis.avgLightness < 85) {
    suggestions.push('Fog');
  }
  
  // Wildflower: multiple bright saturated colors (very diverse palette)
  const colorDiversity = [analysis.blues, analysis.greens, analysis.oranges, analysis.reds, analysis.yellows, analysis.pinks].filter(c => c >= 1).length;
  if (colorDiversity >= 4 && analysis.avgSaturation > 45) {
    suggestions.push('Wildflower');
  }
  
  return suggestions;
}

async function main() {
  console.log('Loading palettes...');
  const palettes = JSON.parse(await readFile(palettesPath, 'utf8'));
  
  const suggestions = {};
  let analyzed = 0;
  let withSuggestions = 0;
  
  for (const [imageUrl, colors] of Object.entries(palettes)) {
    const match = imageUrl.match(/img(\d+)\.jpg$/);
    if (!match) continue;
    
    const id = match[1];
    const analysis = analyzePalette(colors);
    const cats = suggestCategories(analysis);
    
    if (cats.length > 0) {
      suggestions[id] = cats;
      withSuggestions++;
    }
    
    analyzed++;
    if (analyzed % 200 === 0) {
      console.log(`Analyzed ${analyzed} palettes, ${withSuggestions} with suggestions...`);
    }
  }
  
  console.log(`\nComplete: ${analyzed} palettes analyzed`);
  console.log(`Suggestions generated for: ${withSuggestions} palettes`);
  console.log(`Empty (conservative skip): ${analyzed - withSuggestions} palettes`);
  
  // Category breakdown
  const categoryCount = {};
  for (const cats of Object.values(suggestions)) {
    for (const cat of cats) {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }
  
  console.log('\nSuggestion breakdown:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
  
  const output = `// AI-generated palette scene suggestions
// Generated from color analysis of palettes.json
// Method: Conservative hue/saturation/lightness pattern matching
// Coverage: ${withSuggestions}/${analyzed} palettes (${Math.round(withSuggestions/analyzed*100)}%)
// Empty is intentional - quality over coverage

export const PALETTE_SUGGESTIONS: Record<string, string[]> = ${JSON.stringify(suggestions, null, 2)};
`;
  
  await writeFile(outputPath, output, 'utf8');
  console.log(`\nWrote suggestions to ${outputPath}`);
}

main().catch(console.error);
