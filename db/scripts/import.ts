/**
 * db:import — seed the SQLite DB from existing faction JSONs + magic-items.json
 *
 * Idempotent: clears all tables and repopulates in a single transaction.
 * Run after any change to the JSON source files to sync the DB.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { sqlite, db } from '../client.js';
import {
  factions,
  units,
  armyCompositions,
  compositionRules,
  magicItems,
  factionUpgrades,
  lores,
  spells,
} from '../schema.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../src/data');
const FACTIONS_DIR = path.join(DATA_DIR, 'factions');

// ---------------------------------------------------------------------------
// Constants: classify faction-level extra keys
// ---------------------------------------------------------------------------

/** Keys whose arrays contain spell objects (type, casting_value, effect, etc.) */
const LORE_KEYS = new Set([
  'prayers_of_sigmar',
  'prayers_of_ulric',
  'lore_of_gork',
  'lore_of_mork',
  'lore_of_troll_magic',
  'lore_of_chaos',
  'lore_of_saphery',
  'lore_of_athel_loren',
  'lore_of_the_wilds',
  'lore_of_beasts',
  'lore_of_primal_magic',
  'lore_of_nehekhara',
  'lore_of_the_lady',
]);

/** Display names for each faction lore key */
const LORE_NAMES: Record<string, string> = {
  prayers_of_sigmar: 'Prayers of Sigmar',
  prayers_of_ulric: 'Prayers of Ulric',
  lore_of_gork: 'Lore of Gork',
  lore_of_mork: 'Lore of Mork',
  lore_of_troll_magic: 'Lore of Troll Magic',
  lore_of_chaos: 'Lore of Chaos',
  lore_of_saphery: 'Lore of Saphery',
  lore_of_athel_loren: 'Lore of Athel Loren',
  lore_of_the_wilds: 'Lore of the Wilds',
  lore_of_beasts: 'Lore of Beasts (Beastmen)',
  lore_of_primal_magic: 'Lore of Primal Magic',
  lore_of_nehekhara: 'Lore of Nehekhara',
  lore_of_the_lady: "Lore of the Lady",
};

/** Faction-specific lore source publication */
const LORE_SOURCES: Record<string, string> = {
  prayers_of_sigmar: 'forces_of_fantasy',
  prayers_of_ulric: 'forces_of_fantasy',
  lore_of_gork: 'ravening_hordes',
  lore_of_mork: 'ravening_hordes',
  lore_of_troll_magic: 'arcane_journal',
  lore_of_chaos: 'ravening_hordes',
  lore_of_saphery: 'forces_of_fantasy',
  lore_of_athel_loren: 'forces_of_fantasy',
  lore_of_the_wilds: 'arcane_journal',
  lore_of_beasts: 'ravening_hordes',
  lore_of_primal_magic: 'arcane_journal',
  lore_of_nehekhara: 'ravening_hordes',
  lore_of_the_lady: 'forces_of_fantasy',
};

/** Keys whose arrays contain upgrade/item objects (knightly virtues, runic items, etc.) */
const UPGRADE_KEYS = new Set([
  'knightly_virtues',
  'chivalrous_vows',
  'elven_honours',
  'gifts_of_chaos',
  'chaos_mutations',
  'runic_items',
  'forest_sprites',
]);

/** How upgrade_type is derived from the faction key */
const UPGRADE_TYPE_MAP: Record<string, string> = {
  knightly_virtues: 'knightly_virtue',
  chivalrous_vows: 'chivalrous_vow',
  elven_honours: 'elven_honour',
  gifts_of_chaos: 'gift_of_chaos',
  chaos_mutations: 'chaos_mutation',
  runic_items: 'runic_item',
  forest_sprites: 'forest_sprite',
};

/** Global lore keys referenced in unit magic.lores[] but not in any faction JSON */
const GLOBAL_LORE_NAMES: Record<string, string> = {
  battle_magic: 'Battle Magic',
  daemonology: 'Daemonology',
  dark_magic: 'Dark Magic',
  elementalism: 'Elementalism',
  high_magic: 'High Magic',
  illusion: 'Illusion',
  necromancy: 'Necromancy',
  waaagh_magic: "Waaagh! Magic",
};

// ---------------------------------------------------------------------------
// Standard top-level faction keys (never go into extra_data)
// ---------------------------------------------------------------------------
const STANDARD_KEYS = new Set([
  'id', 'name', 'sources', 'publication', 'army_compositions', 'units', 'magic_items',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type RawFaction = Record<string, unknown>;
type RawUnit = Record<string, unknown>;
type RawComposition = Record<string, unknown>;
type RawRule = Record<string, unknown>;
type RawItem = Record<string, unknown>;
type RawSpell = Record<string, unknown>;
type RawUpgrade = Record<string, unknown>;

function j(v: unknown): string | null {
  return v !== undefined && v !== null ? JSON.stringify(v) : null;
}

function bool(v: unknown): number | null {
  if (v === true) return 1;
  if (v === false) return 0;
  return null;
}

// ---------------------------------------------------------------------------
// Main import
// ---------------------------------------------------------------------------
const FACTION_FILES = [
  'kingdom-of-bretonnia.json',
  'empire-of-man.json',
  'dwarfen-mountain-holds.json',
  'wood-elf-realms.json',
  'high-elf-realms.json',
  'orc-and-goblin-tribes.json',
  'warriors-of-chaos.json',
  'beastmen-brayherds.json',
  'tomb-kings-of-khemri.json',
];

const importAll = sqlite.transaction(() => {
  // -- 1. Clear tables (reverse FK order) --
  sqlite.prepare('DELETE FROM spells').run();
  sqlite.prepare('DELETE FROM lores').run();
  sqlite.prepare('DELETE FROM faction_upgrades').run();
  sqlite.prepare('DELETE FROM magic_items').run();
  sqlite.prepare('DELETE FROM composition_rules').run();
  sqlite.prepare('DELETE FROM army_compositions').run();
  sqlite.prepare('DELETE FROM units').run();
  sqlite.prepare('DELETE FROM factions').run();

  let totalUnits = 0;
  let totalItems = 0;
  let totalSpells = 0;
  let totalUpgrades = 0;

  // -- 2. Import each faction JSON --
  for (const file of FACTION_FILES) {
    const raw: RawFaction = require(path.join(FACTIONS_DIR, file));

    // Build _key_order (full top-level key list, minus publication which is always last)
    const allKeys = Object.keys(raw).filter((k) => k !== 'publication');
    // extra_data stores _key_order + non-standard/non-lore/non-upgrade key values
    const extraDataObj: Record<string, unknown> = { _key_order: allKeys };
    for (const key of allKeys) {
      if (!STANDARD_KEYS.has(key) && !LORE_KEYS.has(key) && !UPGRADE_KEYS.has(key)) {
        extraDataObj[key] = raw[key];
      }
    }

    // Insert faction
    db.insert(factions).values({
      id: raw.id as string,
      name: raw.name as string,
      publication: raw.publication as string,
      sources: JSON.stringify(raw.sources),
      extra_data: JSON.stringify(extraDataObj),
    }).run();

    const factionId = raw.id as string;

    // -- Units --
    const unitList = (raw.units as RawUnit[]) ?? [];
    for (let i = 0; i < unitList.length; i++) {
      const u = unitList[i];
      db.insert(units).values({
        id: u.id as string,
        faction_id: factionId,
        name: u.name as string,
        source: u.source as string | null ?? null,
        category: u.category as string,
        list_category: u.list_category as string | null ?? null,
        list_category_overrides: j(u.list_category_overrides),
        troop_type: u.troop_type as string | null ?? null,
        base_size: u.base_size as string | null ?? null,
        unit_size: u.unit_size as string | null ?? null,
        points: u.points as number | null ?? null,
        armour_value: u.armour_value as string | null ?? null,
        is_named_character: bool(u.is_named_character),
        magic: j(u.magic),
        stats: j(u.stats),
        profiles: j(u.profiles),
        stats_by_model: j(u.stats_by_model),
        equipment: j(u.equipment),
        equipment_by_model: j(u.equipment_by_model),
        special_rules: JSON.stringify(u.special_rules ?? []),
        special_rules_by_model: j(u.special_rules_by_model),
        options: j(u.options),
        command: j(u.command),
        weapon_profiles: j(u.weapon_profiles),
        notes: j(u.notes),
        notes_rules: j(u.notes_rules),
        magic_standard: u.magic_standard as number | null ?? null,
        mount_stats: j(u.mount_stats),
        stats_mount: j(u.stats_mount),
        stats_crew: j(u.stats_crew),
        mount: j(u.mount),
        availability: j(u.availability),
        sort_order: i,
      }).run();
    }
    totalUnits += unitList.length;

    // -- Army compositions + composition rules --
    const compList = (raw.army_compositions as RawComposition[]) ?? [];
    for (let ci = 0; ci < compList.length; ci++) {
      const comp = compList[ci];
      db.insert(armyCompositions).values({
        id: comp.id as string,
        faction_id: factionId,
        name: comp.name as string,
        source: comp.source as string | null ?? null,
        special_abilities: j(comp.special_abilities),
        grants_rules: j(comp.grants_rules),
        sub_orders: j(comp.sub_orders),
        sort_order: ci,
      }).run();

      const ruleList = (comp.rules as RawRule[]) ?? [];
      for (let ri = 0; ri < ruleList.length; ri++) {
        const rule = ruleList[ri];
        db.insert(compositionRules).values({
          composition_id: comp.id as string,
          faction_id: factionId,
          category: rule.category as string | null ?? null,
          limit_type: rule.limit_type as string | null ?? null,
          limit_value: rule.limit_value as number | null ?? null,
          eligible_unit_ids: j(rule.eligible_unit_ids),
          unit_ids: j(rule.unit_ids),
          character_unit_ids: j(rule.character_unit_ids),
          general_unit_ids: j(rule.general_unit_ids),
          grants_rules: j(rule.grants_rules),
          notes: rule.notes as string | null ?? null,
          sort_order: ri,
        }).run();
      }
    }

    // -- Magic items --
    const itemList = (raw.magic_items as RawItem[]) ?? [];
    for (let ii = 0; ii < itemList.length; ii++) {
      const item = itemList[ii];
      db.insert(magicItems).values({
        id: item.id as string,
        faction_id: factionId,
        name: item.name as string,
        category: item.category as string | null ?? null,
        points: item.points as number | null ?? null,
        source: item.source as string | null ?? null,
        description: (item.description ?? item.effect) as string | null ?? null,
        rules_text: item.rules_text as string | null ?? null,
        restrictions: item.restrictions as string | null ?? null,
        single_use: bool(item.single_use),
        is_shield: bool(item.is_shield),
        extremely_common: bool(item.extremely_common),
        grants_rules: j(item.grants_rules),
        weapon_profile: j(item.weapon_profile),
        armour_profile: j(item.armour_profile),
        sort_order: ii,
      }).run();
    }
    totalItems += itemList.length;

    // -- Faction lores + spells --
    let loreSortOrder = 0;
    for (const key of allKeys) {
      if (!LORE_KEYS.has(key)) continue;
      const spellList = (raw[key] as RawSpell[]) ?? [];
      // Skip empty lore arrays (other factions inherit these keys as empty stubs)
      if (spellList.length === 0) continue;

      db.insert(lores).values({
        lore_key: key,
        name: LORE_NAMES[key] ?? key,
        faction_id: factionId,
        source: LORE_SOURCES[key] ?? null,
        sort_order: loreSortOrder++,
      }).run();

      for (let si = 0; si < spellList.length; si++) {
        const spell = spellList[si];
        db.insert(spells).values({
          id: spell.id as string,
          lore_key: key,
          faction_id: factionId,
          name: spell.name as string,
          type: spell.type as string | null ?? null,
          casting_value: spell.casting_value !== undefined ? String(spell.casting_value) : null,
          range: spell.range as string | null ?? null,
          mark: spell.mark as string | null ?? null,
          effect: spell.effect as string | null ?? null,
          is_signature: bool(spell.is_signature),
          remains_in_play: bool(spell.remains_in_play),
          number: null,
          flavour: null,
          duration: null,
          sort_order: si,
        }).run();
      }
      totalSpells += spellList.length;
    }

    // -- Faction upgrades --
    for (const key of allKeys) {
      if (!UPGRADE_KEYS.has(key)) continue;
      const upgradeType = UPGRADE_TYPE_MAP[key] ?? key;
      const upgradeList = (raw[key] as RawUpgrade[]) ?? [];
      // Skip empty upgrade arrays (other factions inherit these keys as empty stubs)
      if (upgradeList.length === 0) continue;

      for (let ui = 0; ui < upgradeList.length; ui++) {
        const upg = upgradeList[ui];
        db.insert(factionUpgrades).values({
          id: upg.id as string,
          faction_id: factionId,
          upgrade_type: upgradeType,
          name: upg.name as string,
          points: upg.points as number | null ?? null,
          category: upg.category as string | null ?? null,
          source: upg.source as string | null ?? null,
          restrictions: upg.restrictions as string | null ?? null,
          availability: upg.availability as string | null ?? null,
          description: upg.description as string | null ?? null,
          effect: upg.effect as string | null ?? null,
          extra_data: j((() => {
            // Store any non-standard fields in extra_data
            const std = new Set(['id','name','points','category','source','restrictions','availability','description','effect']);
            const extra: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(upg)) {
              if (!std.has(k)) extra[k] = v;
            }
            return Object.keys(extra).length ? extra : null;
          })()),
          sort_order: ui,
        }).run();
      }
      totalUpgrades += upgradeList.length;
    }

    console.log(`  ✓ ${factionId}: ${unitList.length} units, ${compList.length} compositions`);
  }

  // -- 3. Global magic items from magic-items.json --
  const globalItemsRaw = require(path.join(DATA_DIR, 'magic-items.json')) as { magic_items: RawItem[] };
  for (let ii = 0; ii < globalItemsRaw.magic_items.length; ii++) {
    const item = globalItemsRaw.magic_items[ii];
    db.insert(magicItems).values({
      id: item.id as string,
      faction_id: 'global',
      name: item.name as string,
      category: item.category as string | null ?? null,
      points: item.points as number | null ?? null,
      source: item.source as string | null ?? null,
      description: (item.description ?? item.effect) as string | null ?? null,
      rules_text: item.rules_text as string | null ?? null,
      restrictions: item.restrictions as string | null ?? null,
      single_use: bool(item.single_use),
      is_shield: bool(item.is_shield),
      extremely_common: bool(item.extremely_common),
      grants_rules: j(item.grants_rules),
      weapon_profile: j(item.weapon_profile),
      armour_profile: j(item.armour_profile),
      sort_order: ii,
    }).run();
  }
  totalItems += globalItemsRaw.magic_items.length;

  // -- 4. Global lore metadata from lores.json --
  // Seed entries for global lore keys referenced in unit magic.lores[] but not
  // covered by faction lore arrays. Spell data lives in lores.json (used by
  // General's Adjutant directly) — we store metadata only here.
  const loresJsonRaw = require(path.join(DATA_DIR, 'lores.json')) as Array<{ id: string; name: string }>;
  const META_IDS = new Set(['spell-categories-lores', 'spells-and-spell-generation']);

  // Get all lore_keys already inserted (faction-specific lores)
  const existingLoreKeys = new Set(
    sqlite.prepare('SELECT lore_key FROM lores').all().map((r: Record<string, unknown>) => r.lore_key as string),
  );

  let globalLoreSortOrder = 0;
  for (const entry of loresJsonRaw) {
    if (META_IDS.has(entry.id)) continue;
    // Convert kebab-case to snake_case
    const snakeKey = entry.id.replace(/-/g, '_');
    if (existingLoreKeys.has(snakeKey)) continue; // already imported from faction JSON

    // Only seed if this is a lore we know about (referenced in unit data or globally useful)
    if (GLOBAL_LORE_NAMES[snakeKey] !== undefined || Object.keys(GLOBAL_LORE_NAMES).includes(snakeKey)) {
      db.insert(lores).values({
        lore_key: snakeKey,
        name: GLOBAL_LORE_NAMES[snakeKey] ?? entry.name,
        faction_id: 'global',
        source: 'rulebook',
        sort_order: globalLoreSortOrder++,
      }).run();
    }
  }

  return { totalUnits, totalItems, totalSpells, totalUpgrades };
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
console.log('Importing faction data into battlestandard.sqlite...');
const result = importAll();
console.log(`\nImport complete:`);
console.log(`  ${FACTION_FILES.length} factions`);
console.log(`  ${result.totalUnits} units`);
console.log(`  ${result.totalItems} magic items`);
console.log(`  ${result.totalSpells} spells`);
console.log(`  ${result.totalUpgrades} faction upgrades`);
