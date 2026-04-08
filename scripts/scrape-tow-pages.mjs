/**
 * Scrapes tow.whfb.app/unit/{slug} for each unit to get exact source book + page number.
 * Reads pageReference and association from __NEXT_DATA__ JSON.
 *
 * Usage: node scripts/scrape-tow-pages.mjs
 */

import Database from 'better-sqlite3';

const db = new Database('db/battlestandard.sqlite');

const ABBREV_MAP = {
  'FoF': 'forces_of_fantasy',
  'RH':  'ravening_hordes',
  'AJ':  'arcane_journal',
};

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchUnit(name) {
  const slug = toSlug(name);
  const url = `https://tow.whfb.app/unit/${slug}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 BattleStandard/1.0 (fan project; page-reference lookup)' },
    });
    if (!res.ok) return { slug, found: false, status: res.status };

    const html = await res.text();
    const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (!ndMatch) return { slug, found: false, reason: 'no __NEXT_DATA__' };

    const json = JSON.parse(ndMatch[1]);
    const fields = json.props?.pageProps?.entry?.fields;
    if (!fields) return { slug, found: true, pageRef: null, reason: 'no entry.fields' };

    const pageReference = fields.pageReference;
    // Book abbreviation from first association with FoF/RH/AJ abbreviation
    const assoc = fields.association ?? [];
    const bookAbbrev = assoc.find(a => ABBREV_MAP[a.fields?.abbreviation])?.fields?.abbreviation ?? null;
    const sourceBook = bookAbbrev ? ABBREV_MAP[bookAbbrev] : null;

    return { slug, found: true, pageReference, sourceBook };
  } catch (e) {
    return { slug, found: false, error: e.message };
  }
}

const units = db.prepare('SELECT id, name, faction_id, source FROM units ORDER BY faction_id, name').all();
const updateStmt = db.prepare('UPDATE units SET source_page = ?, source = ? WHERE id = ?');

let updated = 0;
let notFound = 0;
let noRef = 0;
const failures = [];

for (const unit of units) {
  const result = await fetchUnit(unit.name);

  if (!result.found) {
    notFound++;
    failures.push(`NOT FOUND [${result.status ?? result.error ?? result.reason}]: ${unit.name} → ${result.slug}`);
    await new Promise(r => setTimeout(r, 250));
    continue;
  }

  if (!result.pageReference) {
    noRef++;
    failures.push(`NO REF: ${unit.name} → ${result.slug}`);
    await new Promise(r => setTimeout(r, 250));
    continue;
  }

  const dbSource = result.sourceBook ?? unit.source;
  updateStmt.run(result.pageReference, dbSource, unit.id);
  updated++;

  const changed = dbSource !== unit.source ? ` [source: ${unit.source}→${dbSource}]` : '';
  console.log(`✓ ${unit.name} → p.${result.pageReference}${changed}`);

  await new Promise(r => setTimeout(r, 200));
}

console.log(`\nDone. Updated: ${updated} | Not found: ${notFound} | No ref: ${noRef}`);
if (failures.length) {
  console.log('\nFailures / missing:');
  failures.forEach(f => console.log(' ', f));
}
