# SL-ON — Next Steps (as of 2026-06-14)

## State of the repo

Branch: **master**  
Last commit: `a84e1f8` — "Ground all 81 places: coordinates, azimuths, web URLs"

The pexeso minigame is fully wired:
- All content lives in `pexeso/data/places.csv` (81 places, 9 rounds)
- CSV is loaded at runtime via `fetch()` — no build step
- Each place card shows Street View and Web link buttons if the columns are filled
- README section 11 has full maintenance instructions

---

## Priority 1 — Verify coordinates on your machine

Google Maps is blocked in the cloud environment, so coordinate verification must happen locally.

```bash
git pull origin master
cd path/to/SL-ON
npm install playwright
npx playwright install chromium
node pexeso/tools/verify-coords.js
```

This saves a Street View screenshot per place to `pexeso/tools/coord-check/<id>.png`  
and prints a URL table.

**To fix a wrong location:**
1. Open `pexeso/data/places.csv` in Excel (File → Import → UTF-8)
2. Edit `lat`, `lng`, and/or `azimuth` for the offending row
3. Save as CSV UTF-8
4. `git add pexeso/data/places.csv && git commit -m "fix coords: <id>" && git push`

How to find correct coordinates and azimuth from Google Maps Street View:
- Navigate to the spot in Street View
- Copy URL — it contains `@<lat>,<lng>,3a,…,<azimuth>h`
- The number before `h` is the azimuth (compass heading the camera faces)

---

## Priority 2 — Fill in missing web URLs (46 places have none)

Open `pexeso/data/places.csv`, find rows where `web` is empty.  
Places most likely to have websites you can search for:

| id | name | hint |
|----|------|------|
| `kulturni-dum` | Kulturní dům | try staryliskovec.cz or KJM |
| `sokolovna` | Sokolovna | TJ Sokol Starý Lískovec |
| `kostel` | Kostel sv. Jana | farnost Bosonohy / arcibrno.cz |
| `ms` | Mateřská škola | hledej na staryliskovec.cz |
| `zdravotni-stredisko` | Zdravotní středisko | hledej provozovatele |
| `delika-lahudky` | Delika Lahůdky | hledej na firmy.cz |
| `stk-jihlavska` | STK Jihlavská | hledej STK Brno Jihlavská |
| `sady-druzstvo` | Sady Ševčík | hledej bytové družstvo |

---

## Priority 3 — Add real photos

Photos go in `pexeso/assets/<category>/` (e.g. `pexeso/assets/nature/park-pod-sidlistem.jpg`).  
Then set the `photo` column in the CSV to the filename (e.g. `park-pod-sidlistem.jpg`).  
Recommended: 800×600 px JPG, < 200 KB.

Categories used: `nature`, `culture`, `streets`, `civic`, `business`, `artarch`, `transport`, `sport`

---

## Priority 4 — Content & campaign

- `assets/people/` — add candidate photos and fill bios in `index.html`
- News section — replace placeholder posts with real campaign updates
- Newsletter — pick an email tool (Mailchimp / Ecomail / Substack) and set `newsletterAction` in `index.html`
- QR code in `pexeso/pamphlet.html` — update URL before printing

---

## Priority 5 — Polish before launch

- **Dev banner** — find `dev_banner` in `index.html` translations and set it to `""` to hide it
- **Bebas Neue diacritics** — section headings (Pirátské Listy etc.) show wrong glyphs for Czech letters; replace font or use a subset that includes diacritics
- **OG / social preview** — set real `og:image` and `og:description` in `<head>`

---

## File map (quick reference)

| File | What to edit |
|------|-------------|
| `pexeso/data/places.csv` | ★ All pexeso content — open in Excel |
| `pexeso/tools/verify-coords.js` | Playwright Street View checker — run locally |
| `pexeso/assets/` | Drop photos here |
| `index.html` | Main campaign page (candidates, news, newsletter) |
| `assets/people/` | Candidate photos |
| `README.md` | Section 11 = full pexeso maintenance guide |
