/**
 * db:validate — post-import sanity checks
 *
 * Verifies the DB contains expected data after an import.
 * Exits with code 1 if any check fails.
 */
import { sqlite } from '../client.js';

type Row = Record<string, unknown>;

let errors = 0;
let checks = 0;

function check(condition: boolean, message: string): void {
  checks++;
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    errors++;
  } else {
    console.log(`  ✓ ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Run checks
// ---------------------------------------------------------------------------
console.log('Running post-import validation...\n');

// -- Faction counts --
const factionCount = (sqlite.prepare('SELECT COUNT(*) as n FROM factions').get() as Row).n as number;
check(factionCount === 9, `9 factions imported (got ${factionCount})`);

// -- Unit counts --
const unitCount = (sqlite.prepare('SELECT COUNT(*) as n FROM units').get() as Row).n as number;
check(unitCount > 300, `> 300 units imported (got ${unitCount})`);
console.log(`    (${unitCount} units total)`);

// -- Every unit has at least one stat field populated --
const noStats = sqlite.prepare(`
  SELECT id, faction_id FROM units
  WHERE stats IS NULL AND profiles IS NULL AND stats_by_model IS NULL
`).all() as Row[];
check(noStats.length === 0, `All units have at least one stat field (stats/profiles/stats_by_model)`);
if (noStats.length > 0) {
  for (const u of noStats) console.error(`    Missing stats: ${u.faction_id}/${u.id}`);
}

// -- Army compositions --
const compCount = (sqlite.prepare('SELECT COUNT(*) as n FROM army_compositions').get() as Row).n as number;
check(compCount >= 9, `≥ 9 army compositions imported (got ${compCount})`);

const rulesCount = (sqlite.prepare('SELECT COUNT(*) as n FROM composition_rules').get() as Row).n as number;
check(rulesCount > 0, `composition_rules populated (got ${rulesCount})`);

// -- Magic items --
const itemCount = (sqlite.prepare('SELECT COUNT(*) as n FROM magic_items').get() as Row).n as number;
check(itemCount > 100, `> 100 magic items imported (got ${itemCount})`);

const globalItems = (sqlite.prepare("SELECT COUNT(*) as n FROM magic_items WHERE faction_id = 'global'").get() as Row).n as number;
check(globalItems > 0, `Global magic items imported (got ${globalItems})`);

// -- Lores --
const loreCount = (sqlite.prepare('SELECT COUNT(*) as n FROM lores').get() as Row).n as number;
check(loreCount > 0, `Lores imported (got ${loreCount})`);

const spellCount = (sqlite.prepare('SELECT COUNT(*) as n FROM spells').get() as Row).n as number;
check(spellCount > 0, `Spells imported (got ${spellCount})`);

// -- Faction upgrades --
const upgradeCount = (sqlite.prepare('SELECT COUNT(*) as n FROM faction_upgrades').get() as Row).n as number;
check(upgradeCount > 0, `Faction upgrades imported (got ${upgradeCount})`);

// -- Orphan check: every unit's faction_id exists in factions --
const orphanUnits = sqlite.prepare(`
  SELECT u.id, u.faction_id FROM units u
  LEFT JOIN factions f ON u.faction_id = f.id
  WHERE f.id IS NULL
`).all() as Row[];
check(orphanUnits.length === 0, `No orphan units (faction_id references valid faction)`);

// -- Orphan check: every spell's lore_key exists in lores --
const orphanSpells = sqlite.prepare(`
  SELECT s.id, s.lore_key FROM spells s
  LEFT JOIN lores l ON s.lore_key = l.lore_key
  WHERE l.lore_key IS NULL
`).all() as Row[];
check(orphanSpells.length === 0, `No orphan spells (lore_key references valid lore)`);
if (orphanSpells.length > 0) {
  for (const s of orphanSpells.slice(0, 5)) console.error(`    Orphan spell: ${s.id} in lore ${s.lore_key}`);
}

// -- Wizard units must reference valid lore keys --
const unitRows = sqlite.prepare(`SELECT id, faction_id, magic FROM units WHERE magic IS NOT NULL`).all() as Row[];
let invalidLoreRefs = 0;
for (const u of unitRows) {
  const magic = JSON.parse(u.magic as string) as { lores?: string[] };
  for (const loreKey of magic.lores ?? []) {
    const exists = sqlite.prepare('SELECT 1 FROM lores WHERE lore_key = ?').get(loreKey);
    if (!exists) {
      console.error(`    Unknown lore ref: ${u.faction_id}/${u.id} → "${loreKey}"`);
      invalidLoreRefs++;
    }
  }
}
check(invalidLoreRefs === 0, `All wizard unit lore references resolve to known lores`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${checks - errors}/${checks} checks passed.`);
if (errors > 0) {
  console.error(`\n${errors} validation error(s). Fix the DB before exporting.`);
  process.exit(1);
} else {
  console.log('All checks passed. DB is ready for export.');
}
