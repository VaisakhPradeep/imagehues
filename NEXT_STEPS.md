# Image Hues — What To Do Next

This doc covers how to run, deploy, and continue building the site after the Phase 1 fixes and Phase 2 Astro migration.

---

## Current state (as of Phase 2)

The site is now an **Astro static site** that builds to `dist/` and deploys via **GitHub Actions**.

| What | Where |
|---|---|
| Pages | `src/pages/` (`index`, `about/`, `favourites/`) |
| Shared layout (nav, SEO, analytics) | `src/layouts/BaseLayout.astro` |
| Styles (Sass source) | `src/styles/style.sass` |
| Client JS (favourites, palettes, migration) | `public/js/` |
| Images + data | `public/images/`, `public/unsplash_images/`, `public/urls.json` |
| Precomputed palettes | `public/data/palettes.json` (generated) |
| URL migration map | `public/js/url-map.js` (generated) |
| Production output | `dist/` (do not edit by hand) |

**Existing users are protected:**
- Favourites still use `localStorage` key `imageHueUrl`
- `migrate.js` runs once per browser and maps old Unsplash URLs → local image paths
- Old bookmarks (`/about.html`, `/favourites.html`) redirect to the new URLs

---

## Immediate checklist (do these before going live)

### 1. Install dependencies (first time only)

```bash
cd /Users/vaisakh/vasp/imagehues/imagehues
npm install
```

### 2. Test locally

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) and verify:

- [ ] Home page loads image cards with color swatches
- [ ] Clicking a swatch copies the hex code
- [ ] Heart add/remove works
- [ ] `/favourites/` shows saved palettes
- [ ] `/about/` loads correctly
- [ ] Nav highlights the active page

Optional production preview:

```bash
npm run build
npm run preview
```

### 3. Switch GitHub Pages to GitHub Actions

**This is required.** The site no longer deploys by pushing raw HTML to the repo root. It now deploys the `dist/` folder built by CI.

1. Go to [github.com/VaisakhPradeep/imagehues/settings/pages](https://github.com/VaisakhPradeep/imagehues/settings/pages)
2. Under **Build and deployment → Source**, select **GitHub Actions**
3. Save

### 4. Push to `main`

Commit and push all changes. The workflow in `.github/workflows/deploy.yml` will:

1. Install dependencies
2. Run `npm run build` (palettes + Astro)
3. Deploy `dist/` to GitHub Pages

Monitor the run at: **GitHub repo → Actions → Deploy to GitHub Pages**

After deploy, verify live:

- [ ] [https://imagehues.com/](https://imagehues.com/)
- [ ] [https://imagehues.com/favourites/](https://imagehues.com/favourites/)
- [ ] [https://imagehues.com/about/](https://imagehues.com/about/)
- [ ] [https://imagehues.com/sitemap-index.xml](https://imagehues.com/sitemap-index.xml)
- [ ] [https://imagehues.com/robots.txt](https://imagehues.com/robots.txt)

### 5. Set up GA4 (recommended)

Universal Analytics (UA) is sunset. The site **falls back to your old UA tag** until you add a GA4 ID.

**Locally**

1. Copy `.env.example` → `.env`
2. Replace the placeholder:

```bash
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**On GitHub (for production builds)**

1. Repo → **Settings → Secrets and variables → Actions → Variables**
2. Add variable: `PUBLIC_GA_MEASUREMENT_ID` = your `G-XXXXXXXXXX` ID
3. Push any commit (or re-run the deploy workflow) to rebuild with GA4

To create a GA4 property: [https://analytics.google.com](https://analytics.google.com) → Admin → Create Property → Web stream → copy Measurement ID.

---

## Day-to-day development

### Start dev server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

This runs two steps:
1. `build:palettes` — extracts colors from images (skips if already up to date)
2. `astro build` — compiles pages + Sass into `dist/`

### Rebuild palettes only

Run this after adding or changing images in `public/unsplash_images/`:

```bash
npm run build:palettes
```

To force-skip palette generation (e.g. quick Astro-only rebuild):

```bash
SKIP_PALETTE_BUILD=1 npm run build
```

---

## Project structure guide

```
imagehues/
├── src/
│   ├── layouts/BaseLayout.astro   # Shared <head>, nav, scripts, global Sass
│   ├── pages/
│   │   ├── index.astro            # Home
│   │   ├── about/index.astro
│   │   └── favourites/index.astro
│   └── styles/style.sass
├── public/                        # Copied as-is into dist/
│   ├── js/                        # Client-side logic
│   ├── images/
│   ├── unsplash_images/           # 1,374 local images
│   ├── data/palettes.json         # Generated — commit after palette builds
│   ├── urls.json
│   └── CNAME                      # imagehues.com
├── scripts/build-palettes.mjs     # Precomputes palettes + url-map
├── .github/workflows/deploy.yml
├── astro.config.mjs
└── package.json
```

### Common edits

| Task | Edit this |
|---|---|
| Change page content | `src/pages/*.astro` |
| Change nav / meta / analytics | `src/layouts/BaseLayout.astro` |
| Change styles | `src/styles/style.sass` |
| Change palette / favourites logic | `public/js/main.js`, `public/js/favourites.js` |
| Change favourites migration | `public/js/migrate.js` |
| Add a new static page | Create `src/pages/your-page/index.astro` |
| Add redirect from old URL | Add `public/your-page.html` with meta refresh (see `about.html`) |

---

## Phase 3 — Recommended next features

These are the highest-impact items for SEO and growth:

### 1. Individual palette pages (SEO)

Generate pages like `/palette/img42/` with:
- Pre-rendered colors in HTML (crawlable by Google)
- Unique title, description, canonical URL
- JSON-LD structured data

**Approach:** Add `src/pages/palette/[id].astro` and generate pages from `palettes.json` at build time (Astro `getStaticPaths`).

### 2. Category / landing pages

Examples:
- `/palettes/nature/`
- `/palettes/warm-tones/`

Tag images in `palettes.json` during the build script, then generate index pages from tags.

### 3. OG images per palette

Generate a small preview image per palette (image + 4 swatches) for better social sharing.

### 4. Performance

- Add `loading="lazy"` to image cards
- Add explicit `width` / `height` on images to reduce layout shift

### 5. Favourites improvements

- Export favourites as JSON / CSS variables
- Shareable link (would need backend or encoded URL — larger scope)

### 6. Remove UA fallback

Once GA4 is confirmed working, remove the legacy `UA-120902603-2` fallback from `BaseLayout.astro`.

---

## Existing users — what to expect

| Scenario | What happens |
|---|---|
| User has favourites saved | Still loads from `localStorage` on first visit |
| Favourites used old Unsplash URLs | Auto-migrated to `/unsplash_images/imgN.jpg` |
| User bookmarked `/favourites.html` | Redirects to `/favourites/` |
| User had corrupted multi-save data (old bug) | Migration dedupes by URL; may need to re-favourite if colors were wrong |
| Hearts on home page for old saves | Work after migration (URL normalization) |

Migration runs **once** per browser. It does not delete favourites.

---

## Troubleshooting

### `npm run build` is slow

Palette extraction runs on ~1,374 images (~15–20s). Subsequent builds skip if images haven't changed.

### Images don't load locally

Check paths use `/unsplash_images/img0.jpg` (not `./` or `../`). The build copies `public/unsplash_images/` into `dist/`.

### GitHub Actions deploy fails

- Confirm Pages source is set to **GitHub Actions** (not "Deploy from branch")
- Check the Actions log for npm or build errors
- Ensure `package-lock.json` is committed

### Favourites empty after deploy

Favourites are **per-browser** (`localStorage`). They won't appear on a different device or browser — this is expected.

### Styles look wrong

Edit `src/styles/style.sass`, not `public/styles/`. The old `style.css` at repo root was removed; Sass compiles at build time.

### GA4 not tracking

- Confirm `PUBLIC_GA_MEASUREMENT_ID` is set in GitHub Actions variables
- Re-run the deploy workflow after adding the variable
- Check GA4 Realtime view after visiting the live site

---

## Quick reference

```bash
npm install          # First-time setup
npm run dev          # Local dev server (port 4321)
npm run build        # Full production build
npm run preview      # Preview dist/ locally
npm run build:palettes  # Regenerate palettes + url-map only
```

**Deploy:** Push to `main` → GitHub Actions builds and deploys automatically (after Pages source is set to GitHub Actions).

**Domain:** `public/CNAME` contains `imagehues.com` — no change needed if DNS is already pointed at GitHub Pages.

---

## Suggested order of work

1. ✅ Phase 1 — Bug fixes (done)
2. ✅ Phase 2 — Astro + palettes + migration (done)
3. **Deploy to production** (checklist above)
4. **Set up GA4**
5. Phase 3 — Palette detail pages + SEO landing pages
6. Phase 3 — Category pages, OG images, performance

If you want help starting Phase 3, the best first step is individual palette pages generated from `palettes.json`.
