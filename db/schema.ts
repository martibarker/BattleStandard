import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

// ---------------------------------------------------------------------------
// factions
// ---------------------------------------------------------------------------
export const factions = sqliteTable('factions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  publication: text('publication').notNull(), // "forces_of_fantasy" | "ravening_hordes"
  sources: text('sources').notNull(), // JSON string[]
  // Stores: _key_order (full top-level key order minus publication) plus
  // any non-standard, non-lore, non-upgrade faction keys (e.g. knightly_orders,
  // special_rules_index, wood_elf_kindreds). Lore and upgrade arrays are stored
  // in their dedicated tables but listed in _key_order for export ordering.
  extra_data: text('extra_data').notNull(),
});

// ---------------------------------------------------------------------------
// units
// ---------------------------------------------------------------------------
export const units = sqliteTable('units', {
  id: text('id').notNull(),
  faction_id: text('faction_id').notNull().references(() => factions.id),
  name: text('name').notNull(),
  source: text('source'), // "forces_of_fantasy" | "arcane_journal" etc.
  category: text('category').notNull(), // "character" | "infantry" | "cavalry" etc.
  list_category: text('list_category'),
  list_category_overrides: text('list_category_overrides'), // JSON
  troop_type: text('troop_type'),
  base_size: text('base_size'),
  unit_size: text('unit_size'),
  points: integer('points'),
  armour_value: text('armour_value'),
  is_named_character: integer('is_named_character'), // 0/1
  magic: text('magic'), // JSON {wizard_level, lores[]} | null
  stats: text('stats'), // JSON flat stat object | null
  profiles: text('profiles'), // JSON ProfileEntry[] | null
  stats_by_model: text('stats_by_model'), // JSON StatsByModel[] | null
  equipment: text('equipment'), // JSON (string[] | rider/mount | crew/mount)
  equipment_by_model: text('equipment_by_model'), // JSON [{model, equipment[]}] | null
  special_rules: text('special_rules'), // JSON string[]
  special_rules_by_model: text('special_rules_by_model'), // JSON | null
  options: text('options'), // JSON RawOption[] | null — stored un-normalised
  command: text('command'), // JSON CommandUpgrade[] | null
  weapon_profiles: text('weapon_profiles'), // JSON WeaponProfile[] | null
  notes: text('notes'), // JSON string[] | null
  notes_rules: text('notes_rules'), // JSON string[] | null — rules notes (Warriors of Chaos)
  // Additional stat fields used by some factions
  magic_standard: integer('magic_standard'), // max magic standard points (Dwarfs infantry units)
  mount_stats: text('mount_stats'), // JSON — named character mount stats
  stats_mount: text('stats_mount'), // JSON — cavalry mount stats (Warriors of Chaos)
  stats_crew: text('stats_crew'), // JSON — chariot crew stats (Warriors of Chaos)
  mount: text('mount'), // JSON — named character's specific mount (name + stats)
  availability: text('availability'), // JSON string[] — availability restrictions
  sort_order: integer('sort_order').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.id, t.faction_id] }),
}));

// ---------------------------------------------------------------------------
// army_compositions
// ---------------------------------------------------------------------------
export const armyCompositions = sqliteTable('army_compositions', {
  id: text('id').notNull(),
  faction_id: text('faction_id').notNull().references(() => factions.id),
  name: text('name').notNull(),
  source: text('source'), // "ravening_hordes" | "arcane_journal" etc.
  special_abilities: text('special_abilities'), // JSON string[] | null
  // JSON [{categories: string[], unit_ids: string[], rules: string[]}] | null
  // Army-wide deployment rule grants from this list selection (e.g. whole army gains Vanguard)
  grants_rules: text('grants_rules'),
  // JSON SubOrder[] | null — knightly order / sub-list selections
  sub_orders: text('sub_orders'),
  sort_order: integer('sort_order').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.id, t.faction_id] }),
}));

// ---------------------------------------------------------------------------
// composition_rules  (one row per restriction within a composition)
// ---------------------------------------------------------------------------
export const compositionRules = sqliteTable('composition_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  composition_id: text('composition_id').notNull(),
  faction_id: text('faction_id').notNull(),
  category: text('category'), // "characters"|"core"|"special"|"rare"|"mercenaries"|"allies"
  limit_type: text('limit_type'), // "max_percent"|"min_percent"|"max_per_character"|"max_per_1000_pts"
  limit_value: integer('limit_value'),
  eligible_unit_ids: text('eligible_unit_ids'), // JSON string[] | null
  unit_ids: text('unit_ids'), // JSON string[] | null — specific units targeted
  character_unit_ids: text('character_unit_ids'), // JSON string[] | null
  general_unit_ids: text('general_unit_ids'), // JSON string[] | null — for 'conditional' rules
  // JSON string[] | null — deployment/special rules granted to eligible units
  // e.g. ["ambushers"], ["scouts"], ["vanguard"]
  grants_rules: text('grants_rules'),
  notes: text('notes'),
  sort_order: integer('sort_order').notNull(),
});

// ---------------------------------------------------------------------------
// magic_items
// ---------------------------------------------------------------------------
export const magicItems = sqliteTable('magic_items', {
  id: text('id').notNull(),
  faction_id: text('faction_id').notNull(), // faction id or "global"
  name: text('name').notNull(),
  category: text('category'),
  points: integer('points'),
  source: text('source'),
  description: text('description'),
  rules_text: text('rules_text'),
  restrictions: text('restrictions'),
  single_use: integer('single_use'), // 0/1
  is_shield: integer('is_shield'), // 0/1
  extremely_common: integer('extremely_common'), // 0/1
  // JSON string[] | null — special rules this item grants (includes deployment rules)
  grants_rules: text('grants_rules'),
  weapon_profile: text('weapon_profile'), // JSON | null
  armour_profile: text('armour_profile'), // JSON | null
  sort_order: integer('sort_order').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.id, t.faction_id] }),
}));

// ---------------------------------------------------------------------------
// faction_upgrades  (knightly virtues, elven honours, runic items, etc.)
// ---------------------------------------------------------------------------
export const factionUpgrades = sqliteTable('faction_upgrades', {
  id: text('id').notNull(),
  faction_id: text('faction_id').notNull().references(() => factions.id),
  upgrade_type: text('upgrade_type').notNull(), // "knightly_virtue"|"elven_honour"|"runic_item" etc.
  name: text('name').notNull(),
  points: integer('points'),
  category: text('category'), // for runic items: "runic_weapon"|"runic_armour" etc.
  source: text('source'),
  restrictions: text('restrictions'),
  availability: text('availability'),
  description: text('description'),
  effect: text('effect'), // forest sprites use "effect" instead of "description"
  extra_data: text('extra_data'), // JSON catch-all for upgrade-type-specific fields
  sort_order: integer('sort_order').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.id, t.faction_id] }),
}));

// ---------------------------------------------------------------------------
// lores  (one row per lore of magic — global rulebook + faction-specific)
// ---------------------------------------------------------------------------
export const lores = sqliteTable('lores', {
  lore_key: text('lore_key').primaryKey(), // e.g. "lore_of_fire", "lore_of_gork"
  name: text('name').notNull(), // display name: "Lore of Fire", "Lore of Gork"
  faction_id: text('faction_id').notNull(), // "global" for rulebook lores; faction id for army-specific
  source: text('source'), // "rulebook"|"forces_of_fantasy"|"ravening_hordes"|"arcane_journal"
  sort_order: integer('sort_order').notNull(),
});

// ---------------------------------------------------------------------------
// spells  (one row per spell, linked to a lore)
// ---------------------------------------------------------------------------
export const spells = sqliteTable('spells', {
  id: text('id').notNull(),
  lore_key: text('lore_key').notNull().references(() => lores.lore_key),
  faction_id: text('faction_id').notNull(), // mirrors lores.faction_id for query convenience
  name: text('name').notNull(),
  type: text('type'), // "Hex"|"Enchantment"|"Augment"|"Assailment"|"Missile" etc.
  casting_value: text('casting_value'), // stored as text to support "7+/9+" dual values
  range: text('range'),
  mark: text('mark'), // Warriors of Chaos mark (e.g. "Mark of Chaos Undivided")
  effect: text('effect'),
  is_signature: integer('is_signature'), // 0/1
  remains_in_play: integer('remains_in_play'), // 0/1 — needed by General's Adjutant turn tracker
  // Rich fields from lores.json — populated when doing the lores.json reconciliation
  number: integer('number'), // spell number within lore (0 = signature)
  flavour: text('flavour'), // flavour text from lores.json
  duration: text('duration'), // duration notes from lores.json
  sort_order: integer('sort_order').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.id, t.lore_key] }),
}));
