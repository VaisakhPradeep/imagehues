# Image Hues

Natural, fresh color palettes extracted from beautiful photos. Click any swatch to copy its hex code.

**Live site:** [imagehues.com](https://imagehues.com)

## Stack

- [Astro](https://astro.build) — static site generator
- [Tailwind CSS](https://tailwindcss.com) — utility-first CSS framework
- Custom palette extraction algorithm using [sharp](https://sharp.pixelplumbing.com/) (build time)
- PaletteExtract — browser-side palette extraction for user-uploaded images
- GitHub Actions — build & deploy to GitHub Pages

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

### Other commands

```bash
npm run build           # Production build (palettes + Astro → dist/)
npm run preview         # Preview the production build
npm run build:palettes  # Regenerate palette data only
```

### Environment variables

Copy `.env.example` to `.env` and set your GA4 Measurement ID:

```bash
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Project structure

```
src/          Astro pages, layout, styles
public/       Static assets (images, JS, palettes data)
scripts/      Build scripts (palette precomputation)
dist/         Production output (generated — do not edit)
```

## Deploy

Pushes to `main` trigger the **Deploy to GitHub Pages** workflow automatically.

Production also needs the `PUBLIC_GA_MEASUREMENT_ID` repository variable set in GitHub → Settings → Actions → Variables.

## License

MIT
