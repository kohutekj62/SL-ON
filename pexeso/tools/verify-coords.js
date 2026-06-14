#!/usr/bin/env node
/**
 * verify-coords.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Opens Google Street View for every place in places.csv,
 * takes a screenshot, and saves it to ./coord-check/<id>.png.
 *
 * Run this on your OWN machine (Google must be reachable):
 *
 *   npm install playwright csv-parse
 *   node pexeso/tools/verify-coords.js
 *
 * Output folder: pexeso/tools/coord-check/<id>.png
 *
 * After reviewing the screenshots:
 *   - If a location looks wrong, update lat/lng/azimuth directly in
 *     pexeso/data/places.csv (open in Excel, save as CSV UTF-8).
 *   - Commit and push.
 *
 * How to read the Street View URL:
 *   https://www.google.com/maps?layer=c&cbll=<lat>,<lng>&cbp=12,<azimuth>,0,0,0
 *
 *   lat/lng  = decimal degrees (WGS-84)
 *   azimuth  = compass heading in degrees (0=north, 90=east, 180=south, 270=west)
 *
 * You can also open any place manually by pasting the URL from the 'streetViewUrl'
 * column in the summary report that this script prints at the end.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── 1. Parse the CSV without an external lib (same logic as index.html) ──────

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i <= text.length; i++) {
    const ch = i < text.length ? text[i] : '\n';
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQ = false; }
      else { cell += ch; }
    } else {
      if (ch === '"')      { inQ = true; }
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') {
        row.push(cell);
        if (row.some(c => c)) rows.push(row);
        row = []; cell = '';
      } else if (ch !== '\r') { cell += ch; }
    }
  }
  return rows;
}

// ── 2. Load CSV and build a list of places with coordinates ──────────────────

const csvPath = path.join(__dirname, '../data/places.csv');
const raw     = fs.readFileSync(csvPath, 'utf8');
const rows    = parseCSV(raw);
const hdr     = rows[0];
const col     = {};
hdr.forEach((h, i) => { col[h.trim()] = i; });

const places = rows.slice(1)
  .filter(r => r[col.lat] && r[col.lng])           // skip rows without coords
  .map(r => ({
    id:       r[col.id],
    name_cs:  r[col.name_cs],
    lat:      parseFloat(r[col.lat]),
    lng:      parseFloat(r[col.lng]),
    azimuth:  r[col.azimuth] ? Number(r[col.azimuth]) : 0,  // 0 = north if not set
    web:      r[col.web] || null,
    round_cs: r[col.round_cs],
  }));

console.log(`Found ${places.length} places with coordinates.`);

// ── 3. Take screenshots with Playwright ──────────────────────────────────────

const outDir = path.join(__dirname, 'coord-check');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  // Playwright is loaded lazily so the script doesn't crash if it's not installed yet.
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.error('playwright not installed. Run: npm install playwright');
    console.error('Then run: npx playwright install chromium');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    // Remove the line below if you installed playwright normally (npm install playwright && npx playwright install chromium)
    // executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', // server-only path
  });

  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  const report = [];   // for the summary table at the end

  for (const place of places) {
    const url = `https://www.google.com/maps?layer=c&cbll=${place.lat},${place.lng}&cbp=12,${place.azimuth},0,0,0`;
    const imgPath = path.join(outDir, `${place.id}.png`);

    process.stdout.write(`  ${place.id.padEnd(30)} `);

    try {
      // networkidle gives Street View time to load tiles
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

      // Extra wait for the 3-D tiles to paint
      await page.waitForTimeout(3000);

      await page.screenshot({ path: imgPath, type: 'png' });
      process.stdout.write(`✓  ${imgPath}\n`);
    } catch (err) {
      process.stdout.write(`✗  ${err.message}\n`);
    }

    report.push({ id: place.id, name_cs: place.name_cs, lat: place.lat, lng: place.lng, azimuth: place.azimuth, streetViewUrl: url, web: place.web });
  }

  await browser.close();

  // ── 4. Print a summary table and save a JSON report ────────────────────────

  const jsonPath = path.join(outDir, '_report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nReport saved to ${jsonPath}`);
  console.log('\nOpen the images in coord-check/ to check each location.');
  console.log('To fix a coordinate, edit pexeso/data/places.csv directly.\n');

  // Print a handy URL table
  console.log('id'.padEnd(32) + 'Street View URL');
  console.log('─'.repeat(120));
  for (const r of report) {
    console.log(r.id.padEnd(32) + r.streetViewUrl);
  }
})();
