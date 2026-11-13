# marzooq.co.uk: site handbook

Context for any Claude session working on Marzooq Subhani's personal website. Read this before changing anything.

## What the site is

Personal site for Marzooq Subhani (final-year Maths and Philosophy, University of Bristol; from Cardiff). Four pages:

- **Home** (`/`): portrait (Brandon Hill, Bristol), bio with 3 hover notes, photo strip (3 featured photos), Now, featured writing from his Substack *Grounded*.
- **Photography** (`/photography/`): tabs for Personal work, Commissions, and Map (MapLibre/MapTiler map of where personal photos were taken). Lightbox with "View on map".
- **Shelf** (`/shelf/`): a bookcase. Three shelves (Philosophy and faith, Politics and power, Stories and wonder; groups in `_data/shelfGroups.json`), books in `_data/shelf.json` (editable in admin). Spines vary in size and take their colour from the cover (`spineOf` filter, jpeg-js); on desktop the shelves stand side by side (each as wide as its books); clicking a spine opens the book in a pop-up dialog, clicking the cover flips it to show his note on the back. `reading: true` adds an amber ribbon. Covers fetched from Open Library before each build into `src/images/covers/auto/` (git-ignored); `lookup: false` / `cover` / `olcover` (exact Open Library cover ID) / `isbn` / `spine` override. The Qur'an is first, with a typographic green cover. He chose this playful layout over cards and over a plain list (Nov 2026).
- **CV** (`/cv/`): "Right now" list (entries ticked `current`), then collapsible sections (Work, Research, Leadership and volunteering, Education, Speaking and writing, Skills and languages). Bullets show in full when a section opens (he likes that; no nested collapsing).

Blog stays on Substack: https://groundedbymarzooq.substack.com (also blog.marzooq.co.uk via Squarespace forwarding).

## Stack and hosting

- **Eleventy 3** static site, Nunjucks templates, content in JSON data files.
- **Repo:** `MarzooqIsHere/marzooq-site` (public), branch `main`.
  - **Quirk:** the site lives in a **`marzooq-site/` subfolder** of the repo. `.github/workflows/deploy.yml` sits at the repo root and runs with `working-directory: marzooq-site`. Don't move it without updating the workflow, the admin config paths and this file.
- **Hosting:** GitHub Pages via GitHub Actions (`Build and deploy` workflow). Triggers: push to `main`, daily cron (06:17 UTC, picks up new Substack posts), manual run. Builds swap in atomically; a failed build leaves the old site live.
- **Domain:** `marzooq.co.uk`, registered at **Squarespace** (DNS stays there).
  - A records `@` → 185.199.108.153 / .109.153 / .110.153 / .111.153
  - CNAME `www` → `marzooqishere.github.io` (www redirects to the apex)
  - TXT `@` → Google Search Console verification
  - TXT `mx._domainkey` + Mailgun MX records = **catch-all email forwarding (anything@marzooq.co.uk → his Gmail)**. Never touch MX/email records.
  - Squarespace forwarding rule `blog` → Substack (keep). The old apex → Substack forward was removed.
- HTTPS: GitHub Pages cert; "Enforce HTTPS" to be ticked once available (check this if not done).
- Cost: £0 hosting; only the domain renewal.

## Repo layout (inside `marzooq-site/`)

```
eleventy.config.js        filters: t (EN/CY), featuredPosts, currentEntries, mapPoints, json, dims (reads JPEG/PNG size for width/height)
src/_includes/base.njk    layout: head/meta/SEO/JSON-LD Person, nav, theme + language toggles, icon footer
src/index.njk             home (bio + tooltips in EN and CY)
src/photography.njk       tabs (arrow keys, #personal/#commissions/#map in URL), gallery, map panel, lightbox (prev/next, keys, swipe, "n / total")
src/cv.njk                CV page
src/404.njk, robots.njk, sitemap.njk, CNAME
src/_data/now.json        { updated, items[] }
src/_data/photos.json     personal[] {image, caption, location (GeoJSON string), featured}, commissions[] {image, caption}
src/_data/writing.json    featured[] {url, blurb}  (empty list = latest 3 posts)
src/_data/cv.json         { pdf, sections[] {id, title, title_cy, entries[] {title, org, dates, sub, current, bullets[]}} }
src/_data/substack.js     fetches the Substack RSS at build; falls back to substack_cache.json
src/_data/build.js        build id, used as ?v= cache-buster on site.css / site.js
src/assets/css/site.css   all styles (CSS variables for both themes)
src/assets/js/site.js     theme/lang toggles, tabs, lightbox, CV sections, lazy MapLibre map + map style
src/admin/                Sveltia CMS (index.html + config.yml)
src/images/personal/      personal-NN.jpg (1–23 so far)
src/images/commissions/   commission-NN.jpg
src/images/uploads/       where admin uploads land
src/files/                CV PDF goes here (currently none: link hidden while cv.pdf is "")
```

## Admin page (marzooq.co.uk/admin)

Sveltia CMS, GitHub backend, he signs in with a **fine-grained GitHub token** (only this repo, Contents read/write) stored in his browser. Nothing secret is in the repo. Paths in `config.yml` are prefixed `marzooq-site/` because of the subfolder. Editable: Now, Photography (incl. map-pin `location` widget and "Show on homepage"), Featured writing, CV (incl. `current` tick box, PDF upload). Each save commits to `main` and triggers a rebuild.

## Design system (agreed; don't drift)

- **Direction "Darkroom":** near-black warm background, film/darkroom feel, his photography's warm hazy edit style. Dark is the default; light mode exists.
- **Colours (dark):** bg `#16110E`, band `#1F1814`, text `#EFE4D6`, muted `#BCAE9E`, links beige `#D9C4A0`, accent amber `#D49568` (deliberately muted a few degrees), lines `#2E2621`.
  **Light:** bg `#EEE5D8`, band `#E4D8C6`, text `#2B1A1C`, muted `#5E4B47`, link `#6E4A2C`, amber `#8C421E`.
- **Three tones:** cream text, beige links, amber for "now"/interactive cues (labels, dates, +, Read →, selected tab underline, pins, hovers).
- **Type:** Cormorant Garamond (headings, titles) + Inter (body). He chose these. **No monospace/typewriter fonts** (he finds them AI-looking).
- **Layout:** editorial, magazine-like. Sections separated by space and full-width tonal **bands**, not by hairlines.
  - **No card UI** (filled rounded boxes), which he rejected as "clearly Claude". (The Shelf page is its own playful thing: real covers and spines, no hairline borders.)
  - **No hairline-list look** (he said it made everything melt together).
  - No pill buttons for CTAs; text links with → instead.
- Photos must be **sRGB** (he exports Adobe RGB from Lightroom; converting matters, or colours go flat). Web size ~2000px long edge, JPEG q80.
- Footer: "© Marzooq Subhani" + line icons (email, personal IG @marzooqishere, photography IG @mrzq.jpg, LinkedIn, Grounded, CV if PDF) with hover labels. Use generic line icons, not brand logos.
- External links (Substack, Instagram, LinkedIn) open in a new tab.
- Phones (≤600px): name + toggles on one row, nav links on one sideways-scrolling row below.
- Every <img> gets width/height (`| dims` for local files). Tap targets outside running text are ≥44px.

## Content rules

- Copy written on his behalf: **no em dashes**. Use commas, colons, brackets, full stops.
- Bio says "from Cardiff" (he asked not to name the area).
- Welsh (EN/CY toggle): **fixed text only** (nav, headings, bio, tooltips, buttons, section titles), via `{% t "English", "Cymraeg" %}`. Dynamic content (Now, captions, CV entries, blurbs) stays English. He's a learner ("Dysgwr ydw i" shown by the toggle); translations are drafts to be checked by a fluent speaker. Don't expand Welsh to everything (he decided it oversells his Welsh).
- Commissions copy: "Get in touch for a quote", with "Email me to book →" as a mailto link with a subject. No public rates.
- No phone number anywhere public. The Drive CV PDF has his phone and a retail-job statement, so it was not published; he needs a public PDF version.
- Commission photos are not pinned on the map (client privacy).

## Map

MapLibre GL 5.24.1 from unpkg, loaded lazily on first open, with **MapTiler** vector tiles (`tiles/v3`, OpenMapTiles schema). The style is written in `site.js` (`PALETTES` + `mapStyle()`), dark and light variants in the Darkroom palette, and swaps when the theme toggle changes. Fonts: MapTiler's Noto Sans glyphs.
- MapTiler key is in `site.js` (public by design, restricted to marzooq.co.uk origins in his MapTiler account). Free plan: non-commercial, MapTiler logo must show (bottom-left control), stops at 5k sessions/month.
- **Country borders only** (admin_level 2). He found province/state lines messy; don't add them back.
- Opens fitted to **all pins** (he chose this over a UK default).
- **Exact locations are wanted** (so people can see how a shot was laid out). Camera has no GPS; pins are set by hand in the admin location widget. Stored as GeoJSON strings `{"type":"Point","coordinates":[lng,lat]}`. Pins grouped by identical coordinates with a count badge.
- Testing: the sandbox can't reach MapTiler, and the key only works from marzooq.co.uk. Preview by opening the live page in the built-in browser and injecting the new map code with the JS tool; the pane's page is often `hidden`, so call `map.redraw()` in a loop before screenshotting.

## Photo details (EXIF): planned

Lightbox "Details +" link (closed by default) showing camera · focal length · aperture · shutter · ISO, plus a small locator map. The current 23 images have no EXIF (stripped at export). He'll re-export from Lightroom with Metadata "All Except Camera Raw Info" later; then the build reads EXIF. Any sRGB conversion must keep EXIF.

## SEO

Sitemap, robots.txt (disallows /admin), per-page `description` front matter, canonical + Open Graph + Twitter tags, JSON-LD Person on the home page (`sameAs`: Substack, both Instagrams, LinkedIn). Google Search Console verified via a DNS TXT record; sitemap submitted (check). Remaining growth is off-site: link marzooq.co.uk from his bios and profiles.

## Analytics, footer, print

- **GoatCounter** (privacy-friendly, no cookies) via the script at the end of `base.njk`, site code `marzooq` (https://marzooq.goatcounter.com). Dashboard is private to him. Not on /admin.
- Footer colophon: "Built in Bristol and Cardiff · updated <date>", date = last git commit (`_data/updated.js`), EN/CY.
- `@media print` in site.css: white page, nav/footer hidden, all CV sections expanded, `.print-only` name + contact line on /cv/.

## Link previews, alt text, small touches (Nov 2026)

- **Per-page share images**: `src/images/og/{home,photography,shelf,cv}.jpg` (1200×630, Darkroom style), picked by `ogImage:` front matter (default `home`). Made with `tools/og/gen.py` (Playwright + @fontsource fonts installed in /tmp/fonts); rerun and recommit if his roles or the hero photo change. The home card frames him as a hub (philosophy, writing, photographs, ResSoc, Cardiff).
- **Alt text**: `alt` on every entry in `photos.json` (Claude-written descriptions; no names of people in photos), editable in admin as "Description". Templates use alt + caption; lightbox copies the thumbnail's alt.
- **"Developing" fade-in**: `img.dev` (gallery, strip, 404) fades up from a dark sepia; `.js` class set in the head script so no-JS visitors see photos normally; respects reduced motion.
- **404**: random personal photo ("Frame 404 of 36"), light-leak overlay, "Develop another frame →" reroll, links to every section.
- **Kit and process**: collapsible section at the bottom of /photography/, from `_data/kit.json` (admin: "Kit (photography page)"). `.kit-body[hidden]` needs its own display:none (the grid rule overrides `hidden`).

## How to make changes (Claude sessions)

1. Attach the repo with `add_repo` (owner `MarzooqIsHere`, repo `marzooq-site`, access `push`), then clone. The Claude GitHub App is installed on this repo, so pushes work.
2. Pull first: he edits content via the admin page, so `src/_data/*.json` may have changed. Edit data files in place; never overwrite them from an old copy.
3. Build-check: `cd marzooq-site && npm ci && npx eleventy`, then remove `_site` and `node_modules` before committing.
4. For UI changes, screenshot with Playwright against a local server (`python3 -m http.server` in `_site`). The sandbox can't reach unpkg/MapTiler/Google Fonts; see the Map section for how to preview the map.
5. Commit to `main` and push. Check the run: `gh api repos/MarzooqIsHere/marzooq-site/actions/runs --jq '.workflow_runs[0]'`. Live about 1–2 minutes after the push.
6. Small changes go straight in. For a design overhaul, mock it up first (he likes seeing options on a Claude Design canvas before anything goes live).

## Open items (as of 11 Nov 2026)

- Photo EXIF: re-export, then build the Details panel.

- Tick **Enforce HTTPS** in GitHub Pages settings once the cert is issued.
- Public CV PDF (no phone, academic framing), then upload via admin.
- Telephone Fundraiser CV entry has no bullet points yet.
- Welsh translations need checking by a fluent speaker.
- Extended essay line in Now uses the working question from his academic CV; swap in a final title when he has one.
- Photo locations that were Claude's guesses and that he hasn't explicitly confirmed: Llyn Ogwen, Llanddwyn Beach, South Stack, Bristol Harbourside. He may drag these to the exact spot.
