/**
 * Applies Forces of Fantasy FAQ & Errata (v1.5.2, Jan 2025) corrections to the DB.
 *
 * Changes:
 *   - Stats: Ld corrections for Empire characters, T for Flagellants, M for Dryads
 *   - Points: Wood Elf units, Araloth, Pegasus Knights, Battle Pilgrims, Royal Pegasus
 *   - Unit size: Rangers (5+ → 5-20), Questing Knights (5+ → 3+)
 *   - Special rules: State Troops (horde), White Lions (furious_charge),
 *                    Dryads (armour_bane_1), Pegasus Knights (remove lance_formation)
 *   - Adds 'errata' JSON column with structured errata notes
 *
 * After running: npm run db:export
 *
 * Usage: node scripts/apply-fof-faq-errata.mjs
 */

import Database from 'better-sqlite3';

const db = new Database('db/battlestandard.sqlite');

const FAQ_URL = 'https://assets.warhammer-community.com/eng_28-01_warhammer_the_old_world_faq_and_errata_forces_of_fantasy-i2x9zdjv39-wlwtl54hxm.pdf';

// ── 1. Add errata column if not present ─────────────────────────────────────

const cols = db.prepare('PRAGMA table_info(units)').all().map(c => c.name);
if (!cols.includes('errata')) {
  db.prepare('ALTER TABLE units ADD COLUMN errata TEXT').run();
  console.log('Added errata column to units');
}

// ── Helper: update flat stats JSON ──────────────────────────────────────────

function updateStats(id, changes) {
  const row = db.prepare('SELECT stats FROM units WHERE id = ?').get(id);
  if (!row) { console.error('NOT FOUND:', id); return; }
  const stats = row.stats ? JSON.parse(row.stats) : {};
  for (const [k, v] of Object.entries(changes)) {
    stats[k] = String(v);
  }
  db.prepare('UPDATE units SET stats = ? WHERE id = ?').run(JSON.stringify(stats), id);
}

// ── Helper: add errata note ──────────────────────────────────────────────────

function addErrata(id, note) {
  const row = db.prepare('SELECT errata FROM units WHERE id = ?').get(id);
  if (!row) { console.error('NOT FOUND:', id); return; }
  const errata = row.errata ? JSON.parse(row.errata) : [];
  errata.push({ ...note, faq_url: FAQ_URL });
  db.prepare('UPDATE units SET errata = ? WHERE id = ?').run(JSON.stringify(errata), id);
}

// ── Helper: update special rules ────────────────────────────────────────────

function addSpecialRule(id, rule) {
  const row = db.prepare('SELECT special_rules FROM units WHERE id = ?').get(id);
  if (!row) { console.error('NOT FOUND:', id); return; }
  const sr = row.special_rules ? JSON.parse(row.special_rules) : [];
  if (!sr.includes(rule)) {
    sr.push(rule);
    db.prepare('UPDATE units SET special_rules = ? WHERE id = ?').run(JSON.stringify(sr), id);
  }
}

function removeSpecialRule(id, rule) {
  const row = db.prepare('SELECT special_rules FROM units WHERE id = ?').get(id);
  if (!row) { console.error('NOT FOUND:', id); return; }
  const sr = row.special_rules ? JSON.parse(row.special_rules) : [];
  const filtered = sr.filter(r => r !== rule);
  if (filtered.length !== sr.length) {
    db.prepare('UPDATE units SET special_rules = ? WHERE id = ?').run(JSON.stringify(filtered), id);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EMPIRE — Stat corrections (Ld)
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Empire: Leadership corrections ──');

updateStats('general_of_the_empire', { Ld: 10 });
addErrata('general_of_the_empire', { type: 'stat', note: 'Ld corrected 9→10 (FoF FAQ v1.5.2)' });
console.log('✓ General of the Empire: Ld 9→10');

updateStats('captain_of_the_empire', { Ld: 9 });
addErrata('captain_of_the_empire', { type: 'stat', note: 'Ld corrected 8→9 (FoF FAQ v1.5.2)' });
console.log('✓ Captain of the Empire: Ld 8→9');

updateStats('lector_of_sigmar', { Ld: 9 });
addErrata('lector_of_sigmar', { type: 'stat', note: 'Ld corrected 8→9 (FoF FAQ v1.5.2)' });
console.log('✓ Lector of Sigmar: Ld 8→9');

updateStats('priest_of_sigmar', { Ld: 8 });
addErrata('priest_of_sigmar', { type: 'stat', note: 'Ld corrected 7→8 (FoF FAQ v1.5.2)' });
console.log('✓ Priest of Sigmar: Ld 7→8');

updateStats('high_priest_of_ulric', { Ld: 9 });
addErrata('high_priest_of_ulric', { type: 'stat', note: 'Ld corrected 8→9 (FoF FAQ v1.5.2)' });
console.log('✓ High Priest of Ulric: Ld 8→9');

updateStats('priest_of_ulric', { Ld: 8 });
addErrata('priest_of_ulric', { type: 'stat', note: 'Ld corrected 7→8 (FoF FAQ v1.5.2)' });
console.log('✓ Priest of Ulric: Ld 7→8');

// ── Flagellants: T correction ──────────────────────────────────────────────

updateStats('flagellants', { T: 4 });
addErrata('flagellants', { type: 'stat', note: 'T corrected 3→4 (FoF FAQ v1.5.2)' });
console.log('✓ Flagellants: T 3→4');

// ── State Troops: Horde special rule ──────────────────────────────────────

addSpecialRule('state_troops', 'horde');
addErrata('state_troops', { type: 'rule', note: 'Added Horde special rule (FoF FAQ v1.5.2)' });
console.log('✓ Empire State Troops: +horde');

// ── Hans von Lowenhacke: Ld correction ────────────────────────────────────

updateStats('general_hans_von_lowenhacke', { Ld: 10 });
addErrata('general_hans_von_lowenhacke', { type: 'stat', note: 'Ld corrected 9→10 (FoF FAQ v1.5.2)' });
console.log('✓ General Hans von Lowenhacke: Ld 9→10');

// ════════════════════════════════════════════════════════════════════════════
// BRETONNIA — Points and unit size corrections
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Bretonnia: Points and unit size corrections ──');

db.prepare('UPDATE units SET points = 6 WHERE id = ?').run('battle_pilgrims');
addErrata('battle_pilgrims', { type: 'points', note: 'Points corrected 8→6 per model (FoF FAQ v1.5.2)' });
console.log('✓ Battle Pilgrims: 8→6 pts');

db.prepare('UPDATE units SET points = 70 WHERE id = ?').run('royal_pegasus');
addErrata('royal_pegasus', { type: 'points', note: 'Points corrected 60→70 (FoF FAQ v1.5.2)' });
console.log('✓ Royal Pegasus: 60→70 pts');

db.prepare('UPDATE units SET points = 59 WHERE id = ?').run('pegasus_knights');
addErrata('pegasus_knights', { type: 'points', note: 'Points corrected 55→59 per model (FoF FAQ v1.5.2)' });
console.log('✓ Pegasus Knights: 55→59 pts');

db.prepare("UPDATE units SET unit_size = '3+' WHERE id = ?").run('questing_knights');
addErrata('questing_knights', { type: 'stat', note: 'Unit size corrected 5+→3+ (FoF FAQ v1.5.2)' });
console.log('✓ Questing Knights: 5+→3+');

removeSpecialRule('pegasus_knights', 'lance_formation');
addErrata('pegasus_knights', { type: 'rule', note: 'Removed Lance Formation (Pegasus Knights use Dispersed Formation, not Lance Formation) (FoF FAQ v1.5.2)' });
console.log('✓ Pegasus Knights: -lance_formation');

// ════════════════════════════════════════════════════════════════════════════
// HIGH ELVES — Special rule correction
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── High Elves: White Lions special rule correction ──');

// White Lions of Chrace (both FoF and AJ versions if distinct)
for (const id of ['white_lions_of_chrace', 'white_lions_cw_core']) {
  const row = db.prepare('SELECT id FROM units WHERE id = ?').get(id);
  if (!row) { console.log('(not found, skipping:', id, ')'); continue; }
  addSpecialRule(id, 'furious_charge');
  addErrata(id, { type: 'rule', note: 'Added Furious Charge special rule (FoF FAQ v1.5.2)' });
  console.log('✓', id, ': +furious_charge');
}

// ════════════════════════════════════════════════════════════════════════════
// WOOD ELVES — Points corrections and Dryad stat/rule fix
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Wood Elves: Points corrections ──');

db.prepare('UPDATE units SET points = 10 WHERE id = ?').run('glade-guard');
addErrata('glade-guard', { type: 'points', note: 'Points corrected 11→10 per model (FoF FAQ v1.5.2)' });
console.log('✓ Glade Guard: 11→10 pts');

db.prepare('UPDATE units SET points = 12 WHERE id = ?').run('eternal-guard');
addErrata('eternal-guard', { type: 'points', note: 'Points corrected 13→12 per model (FoF FAQ v1.5.2)' });
console.log('✓ Eternal Guard: 13→12 pts');

db.prepare('UPDATE units SET points = 17 WHERE id = ?').run('glade-riders');
addErrata('glade-riders', { type: 'points', note: 'Points corrected 18→17 per model (FoF FAQ v1.5.2)' });
console.log('✓ Glade Riders: 18→17 pts');

db.prepare('UPDATE units SET points = 22 WHERE id = ?').run('sisters-of-the-thorn');
addErrata('sisters-of-the-thorn', { type: 'points', note: 'Points corrected 24→22 per model (FoF FAQ v1.5.2)' });
console.log('✓ Sisters of the Thorn: 24→22 pts');

db.prepare('UPDATE units SET points = 26 WHERE id = ?').run('wild-riders');
addErrata('wild-riders', { type: 'points', note: 'Points corrected 27→26 per model (FoF FAQ v1.5.2)' });
console.log('✓ Wild Riders: 27→26 pts');

db.prepare('UPDATE units SET points = 150 WHERE id = ?').run('araloth-lord-of-talsyn');
addErrata('araloth-lord-of-talsyn', { type: 'points', note: 'Points corrected 170→150 (FoF FAQ v1.5.2)' });
console.log('✓ Araloth, Lord of Talsyn: 170→150 pts');

// ── Dryads: M and Armour Bane ─────────────────────────────────────────────

updateStats('dryads', { M: 6 });
addErrata('dryads', { type: 'stat', note: 'M corrected 5→6 (FoF FAQ v1.5.2)' });
console.log('✓ Dryads: M 5→6');

addSpecialRule('dryads', 'armour_bane_1');
addErrata('dryads', { type: 'rule', note: 'Added Armour Bane (1) special rule (FoF FAQ v1.5.2)' });
console.log('✓ Dryads: +armour_bane_1');

// ════════════════════════════════════════════════════════════════════════════
// DWARFS — Rangers unit size
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Dwarfs: Rangers unit size ──');

db.prepare("UPDATE units SET unit_size = '5-20' WHERE id = ?").run('rangers');
addErrata('rangers', { type: 'stat', note: 'Unit size corrected 5+→5-20 (FoF FAQ v1.5.2)' });
console.log('✓ Rangers: 5+→5-20');

// ════════════════════════════════════════════════════════════════════════════
// Verification
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Verification ──');
const affected = [
  'general_of_the_empire', 'captain_of_the_empire', 'lector_of_sigmar',
  'priest_of_sigmar', 'high_priest_of_ulric', 'priest_of_ulric',
  'flagellants', 'state_troops', 'general_hans_von_lowenhacke',
  'battle_pilgrims', 'royal_pegasus', 'pegasus_knights', 'questing_knights',
  'white_lions_of_chrace', 'white_lions_cw_core',
  'glade-guard', 'eternal-guard', 'glade-riders', 'sisters-of-the-thorn',
  'wild-riders', 'araloth-lord-of-talsyn', 'dryads', 'rangers',
];

for (const id of affected) {
  const u = db.prepare('SELECT id, name, points, unit_size, stats, special_rules, errata FROM units WHERE id = ?').get(id);
  if (!u) { console.log('MISSING:', id); continue; }
  const errataCount = u.errata ? JSON.parse(u.errata).length : 0;
  console.log(`✓ ${u.name}: pts=${u.points} size=${u.unit_size} errata=${errataCount}`);
}

console.log('\nDone. Run: npm run db:export');
