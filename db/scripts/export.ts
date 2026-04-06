/**
 * db:export — regenerate faction JSONs + magic-items.json from the SQLite DB
 *
 * Reads canonical DB state → writes src/data/factions/*.json and
 * src/data/magic-items.json. Run after editing data in Drizzle Studio.
 * lores.json is NOT touched — it is managed separately.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { sqlite } from '../client.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../src/data');
const FACTIONS_DIR = path.join(DATA_DIR, 'factions');

// ---------------------------------------------------------------------------
// Constants (must match import.ts)
// ---------------------------------------------------------------------------
const LORE_KEYS = new Set([
  'prayers_of_sigmar', 'prayers_of_ulric',
  'lore_of_gork', 'lore_of_mork', 'lore_of_troll_magic',
  'lore_of_chaos',
  'lore_of_saphery',
  'lore_of_athel_loren', 'lore_of_the_wilds',
  'lore_of_beasts', 'lore_of_primal_magic',
  'lore_of_nehekhara',
  'lore_of_the_lady',
]);

const UPGRADE_KEYS = new Set([
  'knightly_virtues', 'chivalrous_vows', 'elven_honours',
  'gifts_of_chaos', 'chaos_mutations', 'runic_items', 'forest_sprites',
]);

const UPGRADE_KEY_MAP: Record<string, string> = {
  knightly_virtue: 'knightly_virtues',
  chivalrous_vow: 'chivalrous_vows',
  elven_honour: 'elven_honours',
  gift_of_chaos: 'gifts_of_chaos',
  chaos_mutation: 'chaos_mutations',
  runic_item: 'runic_items',
  forest_sprite: 'forest_sprites',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;

/** Remove keys whose value is null or undefined */
function omitNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) result[k] = v;
  }
  return result;
}

function parseJ<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function intToBool(n: number | null | undefined): boolean | undefined {
  if (n === 1) return true;
  if (n === 0) return false;
  return undefined;
}

// ---------------------------------------------------------------------------
// Reconstruct a spell object from a DB row (for faction JSON lore arrays)
// Only emits fields that were in the original faction JSON format
// ---------------------------------------------------------------------------
function spellRowToFactionFormat(row: Row): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    id: row.id,
    name: row.name,
  };
  if (row.type != null) obj.type = row.type;
  // casting_value: try to parse back to integer if it looks like one
  if (row.casting_value != null) {
    const parsed = Number(row.casting_value);
    obj.casting_value = !isNaN(parsed) && String(parsed) === row.casting_value ? parsed : row.casting_value;
  }
  if (row.range != null) obj.range = row.range;
  if (row.mark != null) obj.mark = row.mark;
  if (row.effect != null) obj.effect = row.effect;
  if (row.is_signature != null) obj.is_signature = Boolean(row.is_signature);
  if (row.remains_in_play === 1) obj.remains_in_play = true;
  return obj;
}

// ---------------------------------------------------------------------------
// Reconstruct an upgrade object from a DB row
// ---------------------------------------------------------------------------
function upgradeRowToObj(row: Row): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: row.id,
    name: row.name,
  };
  if (row.points != null) base.points = row.points;
  if (row.category != null) base.category = row.category;
  if (row.source != null) base.source = row.source;
  if (row.restrictions != null) base.restrictions = row.restrictions;
  if (row.availability != null) base.availability = row.availability;
  if (row.description != null) base.description = row.description;
  if (row.effect != null) base.effect = row.effect;
  // Merge any extra_data fields back
  const extra = parseJ<Record<string, unknown>>(row.extra_data as string, {});
  return { ...base, ...extra };
}

// ---------------------------------------------------------------------------
// Reconstruct a unit object from a DB row
// ---------------------------------------------------------------------------
function unitRowToObj(row: Row): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    id: row.id,
    name: row.name,
  };
  if (row.source != null) obj.source = row.source;
  obj.category = row.category;
  if (row.list_category != null) obj.list_category = row.list_category;
  if (row.list_category_overrides != null) obj.list_category_overrides = parseJ(row.list_category_overrides as string, null);
  if (row.troop_type != null) obj.troop_type = row.troop_type;
  if (row.base_size != null) obj.base_size = row.base_size;
  if (row.unit_size != null) obj.unit_size = row.unit_size;
  if (row.points != null) obj.points = row.points;
  if (row.armour_value != null) obj.armour_value = row.armour_value;
  if (row.is_named_character != null) obj.is_named_character = Boolean(row.is_named_character);
  if (row.magic != null) obj.magic = parseJ(row.magic as string, null);
  if (row.stats != null) obj.stats = parseJ(row.stats as string, null);
  if (row.profiles != null) obj.profiles = parseJ(row.profiles as string, null);
  if (row.stats_by_model != null) obj.stats_by_model = parseJ(row.stats_by_model as string, null);
  obj.equipment = parseJ(row.equipment as string, []);
  if (row.equipment_by_model != null) obj.equipment_by_model = parseJ(row.equipment_by_model as string, null);
  obj.special_rules = parseJ(row.special_rules as string, []);
  if (row.special_rules_by_model != null) obj.special_rules_by_model = parseJ(row.special_rules_by_model as string, null);
  if (row.options != null) obj.options = parseJ(row.options as string, null);
  if (row.command != null) obj.command = parseJ(row.command as string, null);
  if (row.weapon_profiles != null) obj.weapon_profiles = parseJ(row.weapon_profiles as string, null);
  if (row.notes != null) obj.notes = parseJ(row.notes as string, null);
  if (row.notes_rules != null) obj.notes_rules = parseJ(row.notes_rules as string, null);
  if (row.magic_standard != null) obj.magic_standard = row.magic_standard;
  if (row.mount_stats != null) obj.mount_stats = parseJ(row.mount_stats as string, null);
  if (row.stats_mount != null) obj.stats_mount = parseJ(row.stats_mount as string, null);
  if (row.stats_crew != null) obj.stats_crew = parseJ(row.stats_crew as string, null);
  if (row.mount != null) obj.mount = parseJ(row.mount as string, null);
  if (row.availability != null) obj.availability = parseJ(row.availability as string, null);
  return obj;
}

// ---------------------------------------------------------------------------
// Reconstruct a composition object (with its rules) from DB rows
// ---------------------------------------------------------------------------
function buildComposition(
  compRow: Row,
  ruleRows: Row[],
): Record<string, unknown> {
  const rules = ruleRows.map((r) => {
    const rule: Record<string, unknown> = {};
    if (r.category != null) rule.category = r.category;
    if (r.limit_type != null) rule.limit_type = r.limit_type;
    if (r.limit_value != null) rule.limit_value = r.limit_value;
    if (r.eligible_unit_ids != null) rule.eligible_unit_ids = parseJ(r.eligible_unit_ids as string, null);
    if (r.unit_ids != null) rule.unit_ids = parseJ(r.unit_ids as string, null);
    if (r.character_unit_ids != null) rule.character_unit_ids = parseJ(r.character_unit_ids as string, null);
    if (r.general_unit_ids != null) rule.general_unit_ids = parseJ(r.general_unit_ids as string, null);
    if (r.grants_rules != null) rule.grants_rules = parseJ(r.grants_rules as string, null);
    if (r.notes != null) rule.notes = r.notes;
    return rule;
  });

  const comp: Record<string, unknown> = {
    id: compRow.id,
    name: compRow.name,
  };
  if (compRow.source != null) comp.source = compRow.source;
  if (compRow.special_abilities != null) comp.special_abilities = parseJ(compRow.special_abilities as string, []);
  if (compRow.grants_rules != null) comp.grants_rules = parseJ(compRow.grants_rules as string, null);
  if ((compRow as Record<string, unknown>).sub_orders != null) comp.sub_orders = parseJ((compRow as Record<string, unknown>).sub_orders as string, null);
  comp.rules = rules;
  return omitNulls(comp) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Reconstruct a magic item object from a DB row
// ---------------------------------------------------------------------------
function itemRowToObj(row: Row): Record<string, unknown> {
  const obj: Record<string, unknown> = { id: row.id, name: row.name };
  if (row.category != null) obj.category = row.category;
  if (row.points != null) obj.points = row.points;
  if (row.source != null) obj.source = row.source;
  if (row.description != null) obj.description = row.description;
  if (row.rules_text != null) obj.rules_text = row.rules_text;
  if (row.restrictions != null) obj.restrictions = row.restrictions;
  if (intToBool(row.single_use as number) !== undefined) obj.single_use = intToBool(row.single_use as number);
  if (intToBool(row.is_shield as number) !== undefined) obj.is_shield = intToBool(row.is_shield as number);
  if (intToBool(row.extremely_common as number) !== undefined) obj.extremely_common = intToBool(row.extremely_common as number);
  if (row.grants_rules != null) obj.grants_rules = parseJ(row.grants_rules as string, null);
  if (row.weapon_profile != null) obj.weapon_profile = parseJ(row.weapon_profile as string, null);
  if (row.armour_profile != null) obj.armour_profile = parseJ(row.armour_profile as string, null);
  return obj;
}

// ---------------------------------------------------------------------------
// Export one faction
// ---------------------------------------------------------------------------
function exportFaction(factionRow: Row): void {
  const factionId = factionRow.id as string;
  const extraData = parseJ<Record<string, unknown>>(factionRow.extra_data as string, {});
  const keyOrder: string[] = (extraData._key_order as string[] | undefined) ?? [];

  // Query all related data
  const unitRows = sqlite
    .prepare('SELECT * FROM units WHERE faction_id = ? ORDER BY sort_order')
    .all(factionId) as Row[];

  const compRows = sqlite
    .prepare('SELECT * FROM army_compositions WHERE faction_id = ? ORDER BY sort_order')
    .all(factionId) as Row[];

  const allRuleRows = sqlite
    .prepare('SELECT * FROM composition_rules WHERE faction_id = ? ORDER BY sort_order')
    .all(factionId) as Row[];

  const itemRows = sqlite
    .prepare('SELECT * FROM magic_items WHERE faction_id = ? ORDER BY sort_order')
    .all(factionId) as Row[];

  const spellRowsByLore = new Map<string, Row[]>();
  const loreSpellRows = sqlite
    .prepare('SELECT * FROM spells WHERE faction_id = ? ORDER BY sort_order')
    .all(factionId) as Row[];
  for (const row of loreSpellRows) {
    const key = row.lore_key as string;
    if (!spellRowsByLore.has(key)) spellRowsByLore.set(key, []);
    spellRowsByLore.get(key)!.push(row);
  }

  const upgradeRowsByType = new Map<string, Row[]>();
  const upgradeRows = sqlite
    .prepare('SELECT * FROM faction_upgrades WHERE faction_id = ? ORDER BY sort_order')
    .all(factionId) as Row[];
  for (const row of upgradeRows) {
    const type = row.upgrade_type as string;
    if (!upgradeRowsByType.has(type)) upgradeRowsByType.set(type, []);
    upgradeRowsByType.get(type)!.push(row);
  }

  // Build composition lookup
  const rulesByComp = new Map<string, Row[]>();
  for (const rule of allRuleRows) {
    const cid = rule.composition_id as string;
    if (!rulesByComp.has(cid)) rulesByComp.set(cid, []);
    rulesByComp.get(cid)!.push(rule);
  }

  // Build the output object in canonical key order
  const out: Record<string, unknown> = {};

  for (const key of keyOrder) {
    if (key === 'id') { out.id = factionRow.id; continue; }
    if (key === 'name') { out.name = factionRow.name; continue; }
    if (key === 'sources') { out.sources = parseJ(factionRow.sources as string, []); continue; }
    if (key === 'army_compositions') {
      out.army_compositions = compRows.map((c) =>
        buildComposition(c, rulesByComp.get(c.id as string) ?? []),
      );
      continue;
    }
    if (key === 'units') {
      out.units = unitRows.map(unitRowToObj);
      continue;
    }
    if (key === 'magic_items') {
      out.magic_items = itemRows.map(itemRowToObj);
      continue;
    }
    if (LORE_KEYS.has(key)) {
      out[key] = (spellRowsByLore.get(key) ?? []).map(spellRowToFactionFormat);
      continue;
    }
    if (UPGRADE_KEYS.has(key)) {
      // Derive upgrade_type from key
      const upgradeType = Object.entries(UPGRADE_KEY_MAP).find(([, v]) => v === key)?.[0];
      if (upgradeType) {
        out[key] = (upgradeRowsByType.get(upgradeType) ?? []).map(upgradeRowToObj);
      } else {
        out[key] = extraData[key] ?? [];
      }
      continue;
    }
    // Other keys from extra_data
    if (key in extraData) {
      out[key] = extraData[key];
    }
  }
  // publication is always last
  out.publication = factionRow.publication;

  const outPath = path.join(FACTIONS_DIR, `${factionId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Export magic-items.json
// ---------------------------------------------------------------------------
function exportGlobalMagicItems(): void {
  const rows = sqlite
    .prepare("SELECT * FROM magic_items WHERE faction_id = 'global' ORDER BY sort_order")
    .all() as Row[];

  const out = { magic_items: rows.map(itemRowToObj) };
  const outPath = path.join(DATA_DIR, 'magic-items.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('Exporting DB → JSON files...');

const factionRows = sqlite
  .prepare('SELECT * FROM factions ORDER BY rowid')
  .all() as Row[];

for (const factionRow of factionRows) {
  exportFaction(factionRow);
  console.log(`  ✓ ${factionRow.id}.json`);
}

exportGlobalMagicItems();
console.log('  ✓ magic-items.json');

console.log(`\nExport complete: ${factionRows.length + 1} files written.`);
