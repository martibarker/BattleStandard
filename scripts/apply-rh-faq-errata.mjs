/**
 * Applies Ravening Hordes FAQ & Errata (v1.2, Jan 2025) corrections to the DB.
 *
 * Changes:
 *   Ravening Hordes core:
 *   - Gigantic Spider: +move_through_cover
 *   - Night Goblin Mobs: fanatic option already correct in DB — errata note only
 *   - Chaos Steed: +counter_charge
 *   - Hellcannon: base size clarification note (already correct in DB)
 *   - Gifts of Chaos / Chaos Mutations: rule text clarification — errata note only
 *
 *   AJ Orc & Goblin Tribes:
 *   - Badlands Ogre Bulls: Crusher champion cost 6→7
 *
 *   AJ Warriors of Chaos:
 *   - Skin Wolves: base size 40x40mm→50x50mm, +fear
 *   - Warpfire Dragon: +close_order
 *
 *   Magic items:
 *   - 'Eadbuttin' 'At: add "0-1 per model." restriction
 *
 * Usage: node scripts/apply-rh-faq-errata.mjs
 * After running: npm run db:export
 */

import Database from 'better-sqlite3';

const db = new Database('db/battlestandard.sqlite');

const FAQ_URL = 'https://assets.warhammer-community.com/eng_28-01_warhammer_the_old_world_faq_and_errata_ravening_hordes-jrpaxmw1gz-5cb3elwsoq.pdf';

// ── Helper: add/merge errata note ────────────────────────────────────────────

function addErrata(id, note) {
  const row = db.prepare('SELECT errata FROM units WHERE id = ?').get(id);
  if (!row) { console.error('NOT FOUND:', id); return; }
  const errata = row.errata ? JSON.parse(row.errata) : [];
  errata.push({ ...note, faq_url: FAQ_URL });
  db.prepare('UPDATE units SET errata = ? WHERE id = ?').run(JSON.stringify(errata), id);
}

function addSpecialRule(id, rule) {
  const row = db.prepare('SELECT special_rules FROM units WHERE id = ?').get(id);
  if (!row) { console.error('NOT FOUND:', id); return; }
  const sr = row.special_rules ? JSON.parse(row.special_rules) : [];
  if (!sr.includes(rule)) {
    sr.push(rule);
    db.prepare('UPDATE units SET special_rules = ? WHERE id = ?').run(JSON.stringify(sr), id);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RAVENING HORDES CORE
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Orcs & Goblins ──');

addSpecialRule('gigantic_spider', 'move_through_cover');
addErrata('gigantic_spider', { type: 'rule', note: 'Added Move Through Cover special rule (RH FAQ v1.2)' });
console.log('✓ Gigantic Spider: +move_through_cover');

// Night Goblin Mobs fanatic option: already correct in DB (per_n_models: 10, max_count: 3)
addErrata('night_goblin_mobs', { type: 'rule', note: 'Fanatic option clarified: 0-1 per 10 Night Goblins, max 3 per unit (RH FAQ v1.2)' });
console.log('✓ Night Goblin Mobs: fanatic option already correct — errata note added');

console.log('\n── Warriors of Chaos ──');

addSpecialRule('chaos_steed', 'counter_charge');
addErrata('chaos_steed', { type: 'rule', note: 'Added Counter Charge special rule (RH FAQ v1.2)' });
console.log('✓ Chaos Steed: +counter_charge');

// Hellcannon base size: already "100 x 150 mm" in DB — add clarification note
addErrata('hellcannon', { type: 'rule', note: 'Base size clarified: 100×150mm (Hellcannon), 25×25mm (Chaos Dwarf Handlers) (RH FAQ v1.2)' });
console.log('✓ Hellcannon: base size clarification note added');

// ════════════════════════════════════════════════════════════════════════════
// AJ ORC & GOBLIN TRIBES
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── AJ Orcs & Goblins ──');

// Badlands Ogre Bulls: Crusher champion cost 6→7
const ogre = db.prepare("SELECT command FROM units WHERE id = 'badlands_ogre_bulls'").get();
if (ogre) {
  const command = JSON.parse(ogre.command);
  const crusher = command.find(c => c.name === 'Crusher' || c.role === 'champion');
  if (crusher) {
    const oldCost = crusher.cost_per_unit;
    crusher.cost_per_unit = 7;
    db.prepare('UPDATE units SET command = ? WHERE id = ?').run(JSON.stringify(command), 'badlands_ogre_bulls');
    addErrata('badlands_ogre_bulls', { type: 'points', note: `Crusher (champion) upgrade cost corrected ${oldCost}→7 pts (RH FAQ v1.2)` });
    console.log(`✓ Badlands Ogre Bulls: Crusher cost ${oldCost}→7`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AJ WARRIORS OF CHAOS
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── AJ Warriors of Chaos ──');

// Skin Wolves: base size 40x40mm → 50x50mm, add Fear
db.prepare("UPDATE units SET base_size = '50 x 50 mm' WHERE id = 'skin_wolves'").run();
addSpecialRule('skin_wolves', 'fear');
addErrata('skin_wolves', { type: 'stat', note: 'Base size corrected 40×40mm→50×50mm; added Fear special rule (RH FAQ v1.2)' });
console.log('✓ Skin Wolves: base 40→50mm, +fear');

// Warpfire Dragon: add Close Order
addSpecialRule('warpfire_dragon', 'close_order');
addErrata('warpfire_dragon', { type: 'rule', note: 'Added Close Order special rule (RH FAQ v1.2)' });
console.log('✓ Warpfire Dragon: +close_order');

// ════════════════════════════════════════════════════════════════════════════
// MAGIC ITEMS
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Magic Items ──');

// 'Eadbuttin' 'At: add "0-1 per model." restriction
const ei = db.prepare("SELECT restrictions, rules_text FROM magic_items WHERE id = 'eadbuttin_at'").get();
if (ei) {
  const newRulesText = "0-1 per model. " + (ei.rules_text ?? '');
  db.prepare("UPDATE magic_items SET rules_text = ? WHERE id = 'eadbuttin_at'").run(newRulesText);
  console.log("✓ 'Eadbuttin' 'At: prepended '0-1 per model.' to rules_text");
}

// ════════════════════════════════════════════════════════════════════════════
// Verification
// ════════════════════════════════════════════════════════════════════════════

console.log('\n── Verification ──');
const unitIds = [
  'gigantic_spider', 'night_goblin_mobs', 'chaos_steed', 'hellcannon',
  'badlands_ogre_bulls', 'skin_wolves', 'warpfire_dragon',
];
for (const id of unitIds) {
  const u = db.prepare('SELECT id, name, base_size, special_rules, errata FROM units WHERE id = ?').get(id);
  if (!u) { console.log('MISSING:', id); continue; }
  const errataCount = u.errata ? JSON.parse(u.errata).length : 0;
  console.log(`✓ ${u.name}: base=${u.base_size} errata=${errataCount}`);
}

const eadCheck = db.prepare("SELECT rules_text FROM magic_items WHERE id = 'eadbuttin_at'").get();
console.log("'Eadbuttin' 'At rules_text:", eadCheck?.rules_text);

console.log('\nDone. Run: npm run db:export');
