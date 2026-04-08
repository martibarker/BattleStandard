/**
 * Applies Warhammer: The Old World Rulebook FAQ & Errata (v1.5.2, Jan 2025)
 * corrections to magic items in the DB.
 *
 * Corrections:
 *   - Ruby Ring of Ruin:   already 35 pts — errata note only
 *   - Ogre Blade:          already 75 pts — errata note only
 *   - Berserker Blade:     fix weapon profile special rule 'extra_attacks' → 'Extra Attacks (+1)'
 *   - Bedazzling Helm:     add infantry/cavalry restriction
 *
 * Usage: node scripts/apply-rulebook-faq-errata.mjs
 * After running: npm run db:export
 */

import Database from 'better-sqlite3';

const db = new Database('db/battlestandard.sqlite');

const FAQ_URL = 'https://assets.warhammer-community.com/eng_28-01_warhammer_the_old_world_faq_and_errata_rulebook-cypy1xqrht-t4jzdire13.pdf';

// Add errata column to magic_items if not present
const cols = db.prepare('PRAGMA table_info(magic_items)').all().map(c => c.name);
if (!cols.includes('errata')) {
  db.prepare('ALTER TABLE magic_items ADD COLUMN errata TEXT').run();
  console.log('Added errata column to magic_items');
}

function addItemErrata(id, note) {
  const row = db.prepare('SELECT errata FROM magic_items WHERE id = ?').get(id);
  if (!row) { console.error('NOT FOUND:', id); return; }
  const errata = row.errata ? JSON.parse(row.errata) : [];
  errata.push({ ...note, faq_url: FAQ_URL });
  db.prepare('UPDATE magic_items SET errata = ? WHERE id = ?').run(JSON.stringify(errata), id);
}

// ── Ruby Ring of Ruin: already correct ──────────────────────────────────────
addItemErrata('ruby-ring-of-ruin', { type: 'points', note: 'Points corrected (Rulebook FAQ v1.5.2); rule text updated' });
console.log('✓ Ruby Ring of Ruin: errata note added (already correct)');

// ── Ogre Blade: already correct ─────────────────────────────────────────────
addItemErrata('ogre-blade', { type: 'points', note: 'Points corrected to 75 (Rulebook FAQ v1.5.2)' });
console.log('✓ Ogre Blade: errata note added (already correct)');

// ── Berserker Blade: fix weapon profile special rule ─────────────────────────
const bb = db.prepare("SELECT weapon_profile FROM magic_items WHERE id = 'berserker-blade'").get();
if (bb?.weapon_profile) {
  const wp = JSON.parse(bb.weapon_profile);
  wp.special_rules = wp.special_rules.map(r => r === 'extra_attacks' ? 'Extra Attacks (+1)' : r);
  wp.notes = "The wielder of the Berserker Blade is Impetuous.";
  db.prepare("UPDATE magic_items SET weapon_profile = ? WHERE id = 'berserker-blade'").run(JSON.stringify(wp));
}
addItemErrata('berserker-blade', { type: 'rule', note: 'Weapon profile corrected: Extra Attacks (+1); notes added (Rulebook FAQ v1.5.2)' });
console.log('✓ Berserker Blade: weapon profile fixed');

// ── Bedazzling Helm: add restriction ─────────────────────────────────────────
db.prepare("UPDATE magic_items SET restrictions = ? WHERE id = 'bedazzling-helm'").run(
  "Models whose troop type is 'infantry' or 'cavalry' only."
);
addItemErrata('bedazzling-helm', { type: 'rule', note: "Restriction added: infantry/cavalry only (Rulebook FAQ v1.5.2)" });
console.log('✓ Bedazzling Helm: restriction added');

// ── Verification ─────────────────────────────────────────────────────────────
console.log('\n── Verification ──');
const ids = ['ruby-ring-of-ruin', 'ogre-blade', 'berserker-blade', 'bedazzling-helm'];
for (const id of ids) {
  const row = db.prepare('SELECT id, name, points, restrictions, weapon_profile, errata FROM magic_items WHERE id = ?').get(id);
  const errataCount = row.errata ? JSON.parse(row.errata).length : 0;
  const wp = row.weapon_profile ? JSON.parse(row.weapon_profile) : null;
  console.log(`✓ ${row.name}: pts=${row.points} restriction="${row.restrictions}" errata=${errataCount}${wp ? ' wp.sr=' + JSON.stringify(wp.special_rules) : ''}`);
}

console.log('\nDone. Run: npm run db:export');
