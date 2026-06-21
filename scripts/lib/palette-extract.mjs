function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const chroma = max - min;
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

  return [h, s, l, chroma];
}

function quantizeChannel(value, binSize) {
  return Math.min(255, Math.round(value / binSize) * binSize);
}

function effectiveSaturation(saturation, lightness, chroma) {
  return chroma >= 0.08 && lightness > 0.07 && lightness < 0.93 ? saturation : 0;
}

function salienceWeight(saturation, lightness, chroma) {
  const saturationWeight = effectiveSaturation(saturation, lightness, chroma);
  const midtoneWeight = Math.max(0.35, 1 - Math.abs(lightness - 0.55) * 0.9);
  return (1 + saturationWeight * 3.5) * midtoneWeight;
}

function paletteScore(candidate) {
  const presence = Math.log(candidate.count + 1);
  const midtoneWeight = Math.max(0.35, 1 - Math.abs(candidate.lightness - 0.55));
  return presence * (1 + candidate.effectiveSaturation * 2.2) * midtoneWeight;
}

function colorDistance(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  );
}

function hueDistance(a, b) {
  const distance = Math.abs(a - b);
  return Math.min(distance, 1 - distance);
}

function accentScore(candidate) {
  const lightnessWeight = Math.max(0.08, 1 - Math.abs(candidate.lightness - 0.5) * 1.7);
  return Math.log(candidate.count + 2) * (candidate.effectiveSaturation ** 1.1) * lightnessWeight;
}

function selectPalette(candidates, count, minDistance, totalCount) {
  const selected = [];
  const usableCandidates = candidates
    .filter((candidate) => candidate.lightness >= 0.025 && candidate.lightness <= 0.98)
    .sort((a, b) => b.score - a.score);

  function addCandidate(candidate, distance = minDistance, maxSameHue = 1) {
    if (!candidate || selected.length >= count) {
      return false;
    }

    if (selected.some((selectedCandidate) =>
      colorDistance(candidate.rgb, selectedCandidate.rgb) < distance
    )) {
      return false;
    }

    if (candidate.effectiveSaturation > 0.1) {
      const sameHueCount = selected.filter((selectedCandidate) =>
        selectedCandidate.effectiveSaturation > 0.1 &&
        hueDistance(candidate.hue, selectedCandidate.hue) < 0.08
      ).length;

      if (sameHueCount >= maxSameHue) {
        return false;
      }
    }

    selected.push(candidate);
    return true;
  }

  const meaningfulCount = (ratio) => Math.max(4, totalCount * ratio);
  const neutralCandidates = usableCandidates.filter((candidate) =>
    candidate.effectiveSaturation < 0.1
  );
  const accentCandidates = usableCandidates
    .filter((candidate) => candidate.effectiveSaturation >= 0.18 && candidate.count >= 1)
    .sort((a, b) => accentScore(b) - accentScore(a));
  const lightCandidates = neutralCandidates
    .filter((candidate) => candidate.lightness > 0.76 && candidate.count >= meaningfulCount(0.004))
    .sort((a, b) => (b.count - a.count) || (b.score - a.score));
  const darkCandidates = neutralCandidates
    .filter((candidate) => candidate.lightness < 0.26 && candidate.count >= meaningfulCount(0.004))
    .sort((a, b) => (b.count - a.count) || (b.score - a.score));
  const midNeutralCandidates = neutralCandidates
    .filter((candidate) =>
      candidate.lightness >= 0.26 &&
      candidate.lightness <= 0.76 &&
      candidate.count >= meaningfulCount(0.002)
    )
    .sort((a, b) => (b.count - a.count) || (b.score - a.score));

  addCandidate(accentCandidates[0]);
  addCandidate(lightCandidates[0]);
  addCandidate(darkCandidates[0]);

  for (const candidate of accentCandidates.slice(1)) {
    if (addCandidate(candidate)) {
      break;
    }
  }

  addCandidate(midNeutralCandidates[0]);

  while (selected.length < count) {
    let bestCandidate = null;
    let bestScore = -1;

    for (const candidate of usableCandidates) {
      if (selected.some((selectedCandidate) =>
        colorDistance(candidate.rgb, selectedCandidate.rgb) < Math.max(26, minDistance - 9)
      )) {
        continue;
      }

      const sameHueCount = selected.filter((selectedCandidate) =>
        candidate.effectiveSaturation > 0.1 &&
        selectedCandidate.effectiveSaturation > 0.1 &&
        hueDistance(candidate.hue, selectedCandidate.hue) < 0.08
      ).length;

      if (sameHueCount >= 1) {
        continue;
      }

      const diversity = selected.length === 0
        ? 1
        : Math.min(...selected.map((selectedCandidate) => Math.max(
          candidate.effectiveSaturation > 0.1 && selectedCandidate.effectiveSaturation > 0.1
            ? hueDistance(candidate.hue, selectedCandidate.hue)
            : 0,
          Math.abs(candidate.lightness - selectedCandidate.lightness)
        )));
      const neutralBonus = candidate.effectiveSaturation < 0.1 ? 0.8 : 0;
      const candidateScore = candidate.score * (1 + diversity * 1.6) + neutralBonus;

      if (candidateScore > bestScore) {
        bestCandidate = candidate;
        bestScore = candidateScore;
      }
    }

    if (!addCandidate(bestCandidate, 0)) {
      break;
    }
  }

  if (selected.length < count) {
    for (const candidate of usableCandidates) {
      if (selected.length >= count) {
        break;
      }

      addCandidate(candidate, Math.max(22, minDistance - 13), 2);
    }
  }

  if (selected.length < count) {
    for (const candidate of usableCandidates) {
      if (selected.length >= count) {
        break;
      }

      if (selected.some((selectedCandidate) =>
        colorDistance(candidate.rgb, selectedCandidate.rgb) < 12
      )) {
        continue;
      }

      selected.push(candidate);
    }
  }

  return selected.map((candidate) => candidate.rgb);
}

export function extractPaletteFromPixels(data, width, height, quality, count) {
  const bins = new Map();
  const binSize = 20;
  let sampledPixels = 0;

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

      const [, saturation, lightness, chroma] = rgbToHsl(r, g, b);
      const weight = salienceWeight(saturation, lightness, chroma);
      sampledPixels += 1;
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
        existing.lightnessSum += lightness * weight;
        existing.chromaSum += chroma * weight;
        existing.count += 1;
      } else {
        bins.set(key, {
          weight,
          r: r * weight,
          g: g * weight,
          b: b * weight,
          wSum: weight,
          saturationSum: saturation * weight,
          lightnessSum: lightness * weight,
          chromaSum: chroma * weight,
          count: 1,
        });
      }
    }
  }

  const candidates = Array.from(bins.values())
    .map((bin) => {
      const rgb = [
        Math.round(bin.r / bin.wSum),
        Math.round(bin.g / bin.wSum),
        Math.round(bin.b / bin.wSum),
      ];
      const [hue, saturation, lightness, chroma] = rgbToHsl(...rgb);

      return {
        rgb,
        hue,
        weight: bin.weight,
        count: bin.count,
        saturation,
        lightness,
        chroma,
        effectiveSaturation: effectiveSaturation(saturation, lightness, chroma),
      };
    })
    .map((candidate) => ({
      ...candidate,
      score: paletteScore(candidate),
    }))
    .sort((a, b) => b.score - a.score);

  return selectPalette(candidates, count, 35, sampledPixels);
}
