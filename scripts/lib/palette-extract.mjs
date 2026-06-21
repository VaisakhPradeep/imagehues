function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  return [h, s, l];
}

function quantizeChannel(value, binSize) {
  return Math.min(255, Math.round(value / binSize) * binSize);
}

function salienceWeight(saturation, lightness) {
  const lightnessOk = lightness > 0.12 && lightness < 0.92;
  return (1 + saturation * 5) * (lightnessOk ? 1.2 : 0.6);
}

function colorDistance(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  );
}

function selectPalette(candidates, count, minDistance) {
  const selected = [];
  const minAccentWeight = Math.max(
    candidates[0]?.weight * 0.008 || 0,
    8
  );

  const accent = candidates
    .filter((candidate) => candidate.weight >= minAccentWeight)
    .sort((a, b) => b.saturation - a.saturation)[0];

  if (accent) {
    selected.push(accent.rgb);
  }

  for (const candidate of candidates) {
    if (selected.length >= count) {
      break;
    }

    if (selected.every((rgb) => colorDistance(rgb, candidate.rgb) >= minDistance)) {
      selected.push(candidate.rgb);
    }
  }

  if (selected.length < count) {
    for (const candidate of candidates) {
      if (selected.length >= count) {
        break;
      }

      if (!selected.some((rgb) =>
        rgb[0] === candidate.rgb[0] &&
        rgb[1] === candidate.rgb[1] &&
        rgb[2] === candidate.rgb[2]
      )) {
        selected.push(candidate.rgb);
      }
    }
  }

  return selected;
}

export function extractPaletteFromPixels(data, width, height, quality, count) {
  const bins = new Map();
  const binSize = 20;

  for (let y = 0; y < height; y += quality) {
    for (let x = 0; x < width; x += quality) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const alpha = data[index + 3];

      if (alpha !== undefined && alpha < 125) {
        continue;
      }

      const [, saturation, lightness] = rgbToHsl(r, g, b);
      const weight = salienceWeight(saturation, lightness);
      const qr = quantizeChannel(r, binSize);
      const qg = quantizeChannel(g, binSize);
      const qb = quantizeChannel(b, binSize);
      const key = (qr << 16) | (qg << 8) | qb;
      const existing = bins.get(key);

      if (existing) {
        existing.weight += weight;
        existing.r += r * weight;
        existing.g += g * weight;
        existing.b += b * weight;
        existing.wSum += weight;
        existing.saturationSum += saturation * weight;
      } else {
        bins.set(key, {
          weight,
          r: r * weight,
          g: g * weight,
          b: b * weight,
          wSum: weight,
          saturationSum: saturation * weight,
        });
      }
    }
  }

  const candidates = Array.from(bins.values())
    .map((bin) => ({
      rgb: [
        Math.round(bin.r / bin.wSum),
        Math.round(bin.g / bin.wSum),
        Math.round(bin.b / bin.wSum),
      ],
      weight: bin.weight,
      saturation: bin.saturationSum / bin.wSum,
    }))
    .sort((a, b) => b.weight - a.weight);

  return selectPalette(candidates, count, 35);
}
