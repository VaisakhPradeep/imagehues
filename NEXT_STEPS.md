# Image Hues — What To Do Next

This doc covers how to run, deploy, and continue building the site.

---

## Progress

| Step | Status |
|---|---|
| Phase 1 — Bug fixes | ✅ Done |
| Phase 2 — Astro migration | ✅ Done |
| Local `.env` with GA4 Measurement ID | ✅ Done |
| GitHub Actions variable `PUBLIC_GA_MEASUREMENT_ID` | ✅ Done |
| Switch GitHub Pages to GitHub Actions | ✅ Done |
| Rename `master` → `main` (local) | ✅ Done |
| Merge `feat/astro-foundation` into `main` | ✅ Done |
| Push `main` to GitHub & delete remote `master` | ⬜ **Do next** |
| Verify live site + GA4 tracking | ⬜ After push |
| Phase 3 — SEO pages & new features | ⬜ After go-live |

---

## What to do next (in order)

### 1. Push `main` to GitHub

Everything is merged locally on `main`. Push from your machine (must be authenticated as **VaisakhPradeep**):

```bash
cd /Users/vaisakh/vasp/imagehues/imagehues
git push -u origin main
git push origin --delete master   # remove old default branch on GitHub
```

Then set **main** as the default branch on GitHub: **Settings → General → Default branch → main**.

The **Deploy to GitHub Pages** workflow runs automatically on push to `main`.

Monitor: **GitHub repo → Actions → Deploy to GitHub Pages**

### 2. Verify production

After the workflow succeeds (green checkmark), confirm these URLs work:

- [ ] [https://imagehues.com/](https://imagehues.com/)
- [ ] [https://imagehues.com/favourites/](https://imagehues.com/favourites/)
- [ ] [https://imagehues.com/about/](https://imagehues.com/about/)
- [ ] [https://imagehues.com/sitemap-index.xml](https://imagehues.com/sitemap-index.xml)
- [ ] [https://imagehues.com/robots.txt](https://imagehues.com/robots.txt)

Functional checks:

- [ ] Home page loads image cards with color swatches
- [ ] Clicking a swatch copies the hex code
- [ ] Heart add/remove works
- [ ] Favourites page shows saved palettes (or empty state)
- [ ] Old bookmarks (`/about.html`, `/favourites.html`) redirect correctly

### 3. Confirm GA4 is tracking

1. Open [Google Analytics](https://analytics.google.com) → **ImageHues - GA4** property
2. Go to **Reports → Realtime**
3. Visit [https://imagehues.com](https://imagehues.com) in another tab
4. You should appear as an active user within ~30 seconds

To confirm the right tag is live, view page source on imagehues.com and search for your `G-` Measurement ID (not `UA-120902603-2`).

### 4. Clean up after GA4 is confirmed (optional)

Once Realtime shows visits correctly:

- Remove the legacy `UA-120902603-2` fallback from `src/layouts/BaseLayout.astro`
- Commit and deploy again

---

## Current architecture

The site is an **Astro static site** that builds to `dist/` and deploys via **GitHub Actions**.

| What | Where |
|---|---|
| Pages | `src/pages/` (`index`, `about/`, `favourites/`) |
| Shared layout (nav, SEO, analytics) | `src/layouts/BaseLayout.astro` |
| Styles (Sass source) | `src/styles/style.sass` |
| Client JS (favourites, palettes, migration) | `public/js/` |
| Images + data | `public/images/`, `public/unsplash_images/`, `public/urls.json` |
| Precomputed palettes | `public/data/palettes.json` (generated) |
| URL migration map | `public/js/url-map.js` (generated) |
| GA4 ID (local) | `.env` → `PUBLIC_GA_MEASUREMENT_ID` |
| GA4 ID (production) | GitHub → Settings → Actions → Variables |
| Production output | `dist/` (do not edit by hand) |

**Existing users are protected:**
- Favourites still use `localStorage` key `imageHueUrl`
- `migrate.js` runs once per browser and maps old Unsplash URLs → local image paths
- Old bookmarks (`/about.html`, `/favourites.html`) redirect to the new URLs

---

## Day-to-day development

### Start dev server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

### Production build

```bash
npm run build
```

This runs two steps:
1. `build:palettes` — extracts colors from images (skips if already up to date)
2. `astro build` — compiles pages + Sass into `dist/`

### Preview production build

```bash
npm run preview
```

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

Edit `src/styles/style.sass`, not `public/styles/`. Sass compiles at build time.

### GA4 not tracking after deploy

- Confirm `PUBLIC_GA_MEASUREMENT_ID` is set under **Settings → Actions → Variables** (repository variable, not environment)
- Re-run the **Deploy to GitHub Pages** workflow after adding the variable
- View page source on the live site — search for your `G-` ID
- Check GA4 **Reports → Realtime** while browsing the site

---

## Quick reference

```bash
npm install             # First-time setup
npm run dev             # Local dev server (port 4321)
npm run build           # Full production build
npm run preview         # Preview dist/ locally
npm run build:palettes  # Regenerate palettes + url-map only
```

**Deploy:** Merge to `main` → GitHub Actions builds and deploys automatically.

**Domain:** `public/CNAME` contains `imagehues.com` — no DNS change needed if already pointed at GitHub Pages.

---

## Roadmap summary

1. ✅ Phase 1 — Bug fixes
2. ✅ Phase 2 — Astro + palettes + migration
3. ✅ GA4 configured (local `.env` + GitHub variable)
4. ⬜ **Push `main` and go live** ← you are here
5. ⬜ Verify GA4 Realtime on live site
6. ⬜ Phase 3 — Palette detail pages + SEO landing pages
7. ⬜ Phase 3 — Category pages, OG images, performance

If you want help starting Phase 3, the best first step is individual palette pages generated from `palettes.json`.
