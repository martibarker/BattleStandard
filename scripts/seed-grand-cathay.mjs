/**
 * Seeds the Grand Cathay army list into the DB.
 * Sources:
 *   1. Arcane Journal — Armies of Grand Cathay (main AJ)
 *   2. Arcane Journal — Dawn of the Storm Dragon (Jade Fleet AoI)
 *   3. Arcane Journal — The Breaching of the Great Bastion (Updated Grand Army + Warriors of Wind & Field AoI)
 *
 * Usage: node scripts/seed-grand-cathay.mjs
 * After running: npm run db:export
 */
import Database from 'better-sqlite3';
const db = new Database('db/battlestandard.sqlite');

const FACTION = 'grand-cathay';
const SOURCE_AJ = 'arcane_journal';

// ── Clean existing data ───────────────────────────────────────────────────────
db.prepare("DELETE FROM units WHERE faction_id = ?").run(FACTION);
db.prepare("DELETE FROM magic_items WHERE faction_id = ?").run(FACTION);
db.prepare("DELETE FROM faction_upgrades WHERE faction_id = ?").run(FACTION);
db.prepare("DELETE FROM spells WHERE faction_id = ?").run(FACTION);
db.prepare("DELETE FROM lores WHERE faction_id = ?").run(FACTION);
db.prepare("DELETE FROM composition_rules WHERE faction_id = ?").run(FACTION);
db.prepare("DELETE FROM army_compositions WHERE faction_id = ?").run(FACTION);
db.prepare("DELETE FROM factions WHERE id = ?").run(FACTION);

// ── Faction row ───────────────────────────────────────────────────────────────
db.prepare(`INSERT INTO factions (id, name, publication, sources, extra_data) VALUES (?, ?, ?, ?, ?)`).run(
  FACTION,
  'Grand Cathay',
  'forces_of_fantasy',
  JSON.stringify([
    'Arcane Journal — Armies of Grand Cathay',
    'Arcane Journal — Dawn of the Storm Dragon',
    'Arcane Journal — The Breaching of the Great Bastion',
  ]),
  JSON.stringify({
    _key_order: [
      'id','name','sources','army_compositions','units',
      'magic_items','lore_of_yang','lore_of_yin',
    ],
  })
);

// ── Army Compositions ─────────────────────────────────────────────────────────
const insertComp = db.prepare(
  `INSERT INTO army_compositions (id, faction_id, name, source, sort_order) VALUES (?, ?, ?, ?, ?)`
);
insertComp.run('grand_army_gc', FACTION, 'Grand Cathay — Grand Army', SOURCE_AJ, 0);
insertComp.run('dawn_storm_dragon_gc', FACTION, 'Jade Fleet — Army of Infamy', SOURCE_AJ, 1);
// breaching_great_bastion_gc was the original "Updated Grand Army" composition.
// FAQ v1.5.2 page 4 folds these rules into grand_army_gc as the new default — no separate composition needed.
insertComp.run('warriors_wind_field_gc', FACTION, 'Warriors of Wind & Field — Army of Infamy', SOURCE_AJ, 2);

// ── Composition rules ─────────────────────────────────────────────────────────
const insertRule = db.prepare(`INSERT INTO composition_rules
  (composition_id, faction_id, category, limit_type, limit_value, unit_ids, character_unit_ids, general_unit_ids, notes, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let ruleSort = 0;
function rule(compId, category, limitType, limitValue, unitIds, charIds, genIds, notes) {
  insertRule.run(
    compId, FACTION, category, limitType, limitValue,
    unitIds ? JSON.stringify(unitIds) : null,
    charIds ? JSON.stringify(charIds) : null,
    genIds  ? JSON.stringify(genIds)  : null,
    notes ?? null,
    ruleSort++
  );
}

// ── grand_army_gc (Updated Grand Army — replaces original GA, FAQ v1.5.2 p4) ──
rule('grand_army_gc', 'characters', 'max_percent', 50, null, null, null,
  '0-1 Cathayan Dragon per 1,000 pts; 0-1 Shugengan Lord, Gate Master, Lord Magistrate or Supreme Astromancer per 1,000 pts; Shugengan, Gate Keepers, Strategists and Astromancers as desired');
rule('grand_army_gc', 'characters', 'max_per_1000_pts', 1,
  ['miao_ying_gc'], null, null, '0-1 Cathayan Dragon per 1,000 pts');
rule('grand_army_gc', 'characters', 'max_per_1000_pts', 1,
  ['shugengan_lord_gc','gate_master_gc','lord_magistrate_gc','astromancers_gc'], null, null,
  '0-1 Shugengan Lord, Gate Master, Lord Magistrate or Supreme Astromancer per 1,000 pts');
rule('grand_army_gc', 'core', 'min_percent', 25, null, null, null, 'Jade Warriors and Peasant Levy');
rule('grand_army_gc', 'core', 'conditional', 1,
  ['jade_lancers_gc'], null, ['gate_master_gc','gate_keeper_gc'],
  'If your General is a Gate Master or Gate Keeper, 0-1 unit of Jade Lancers may be taken as a Core choice');
rule('grand_army_gc', 'special', 'max_percent', 50, null, null, null,
  'Jade Lancers, Crane Gunner Teams and Iron Hail Gunners; 0-2 war machines per 1,000 pts');
rule('grand_army_gc', 'special', 'max_per_1000_pts', 2,
  ['cathayan_grand_cannon_gc','fire_rain_rocket_battery_gc'], null, null,
  '0-2 war machines (Cathayan Grand Cannon and Fire Rain Rocket Batteries combined) per 1,000 pts');
rule('grand_army_gc', 'special', 'conditional', 1,
  ['cathayan_sentinel_gc'], null, ['shugengan_lord_gc','shugengan_general_gc'],
  'If your General is a Shugengan Lord or Shugengan, 0-1 Cathayan Sentinel may be taken as a Special choice');
rule('grand_army_gc', 'special', 'conditional', 1,
  ['sky_lanterns_gc'], null, ['lord_magistrate_gc','strategist_gc'],
  'If your General is a Lord Magistrate or Strategist, 0-1 Sky Lantern may be taken as a Special choice');
rule('grand_army_gc', 'rare', 'max_percent', 25, null, null, null, 'Sky Lanterns and Cathayan Sentinels');
rule('grand_army_gc', 'rare', 'max_per_1000_pts', 1,
  ['cathayan_sentinel_gc'], null, null, '0-1 Cathayan Sentinel per 1,000 pts');
rule('grand_army_gc', 'mercenaries', 'max_percent', 20, null, null, null, null);
rule('grand_army_gc', 'allies', 'max_percent', 25, null, null, null,
  'A single allied contingent from: any Grand Cathay Army of Infamy; Dwarfen Mountain Holds; Empire of Man; Kingdom of Bretonnia (Uneasy); Wood Elf Realms (Uneasy); High Elf Realms (Uneasy). A Gate Keeper may be upgraded to Battle Standard Bearer for +25 pts (magic standard: no points limit).');

// ── dawn_storm_dragon_gc (Jade Fleet) ────────────────────────────────────────
rule('dawn_storm_dragon_gc', 'characters', 'max_percent', 50, null, null, null,
  'Miao Ying the Storm Dragon; 0-1 Shugengan Lord or Lord Magistrate per 1,000 pts; Shugengan, Gate Masters, Gate Keepers and Strategists as desired');
rule('dawn_storm_dragon_gc', 'characters', 'max_per_1000_pts', 1,
  ['shugengan_lord_gc','lord_magistrate_gc'], null, null,
  '0-1 Shugengan Lord or Lord Magistrate per 1,000 pts');
rule('dawn_storm_dragon_gc', 'core', 'min_percent', 25, null, null, null, 'Jade Warriors');
rule('dawn_storm_dragon_gc', 'core', 'conditional', 1,
  ['jade_lancers_gc'], null, null,
  '0-1 unit of Jade Lancers per 1,000 pts may be taken as a Core choice');
rule('dawn_storm_dragon_gc', 'special', 'max_percent', 50, null, null, null,
  'Jade Lancers; 0-3 war machines per 1,000 pts');
rule('dawn_storm_dragon_gc', 'special', 'max_per_1000_pts', 3,
  ['cathayan_grand_cannon_gc','fire_rain_rocket_battery_gc'], null, null,
  '0-3 war machines (Cathayan Grand Cannon and Fire Rain Rocket Batteries combined) per 1,000 pts');
rule('dawn_storm_dragon_gc', 'rare', 'max_percent', 25, null, null, null, 'Sky Lanterns and Cathayan Sentinels');
rule('dawn_storm_dragon_gc', 'rare', 'max_per_1000_pts', 1,
  ['cathayan_sentinel_gc'], null, null, '0-1 Cathayan Sentinel per 1,000 pts');
// Jade Fleet mercenaries: up to 35%, Empire of Man models only; not subject to Misbehaving Mercenaries
rule('dawn_storm_dragon_gc', 'mercenaries', 'max_percent', 35, null, null, null,
  'Empire of Man mercenaries only (Captain of the Empire, Master Mage, Priest of Sigmar/Ulric; State Troops, State Missile Troops, Free Company Militia, Empire Archers; 0-1 Pistoliers or Outriders per 1,000 pts). Not subject to the Misbehaving Mercenaries rules.');

// ── warriors_wind_field_gc ────────────────────────────────────────────────────
rule('warriors_wind_field_gc', 'characters', 'max_percent', 50, null, null, null,
  '0-1 Lord Magistrate, Gate Master or Supreme Astromancer per 1,000 pts; Shugengan, Gate Keepers, Strategists and Astromancers as desired');
rule('warriors_wind_field_gc', 'characters', 'max_per_1000_pts', 1,
  ['lord_magistrate_gc','gate_master_gc','astromancers_gc'], null, null,
  '0-1 Lord Magistrate, Gate Master or Supreme Astromancer per 1,000 pts');
rule('warriors_wind_field_gc', 'core', 'min_percent', 25, null, null, null,
  '1+ unit of Peasant Levy; Iron Hail Gunners; 0-1 unit of Jade Warriors per 1,000 pts may be taken as a Core choice');
rule('warriors_wind_field_gc', 'core', 'max_per_1000_pts', 1,
  ['jade_warriors_gc'], null, null,
  '0-1 unit of Jade Warriors per 1,000 pts may be taken as a Core choice');
rule('warriors_wind_field_gc', 'special', 'max_percent', 50, null, null, null,
  'Jade Warriors (Special), Crane Gunner Teams and Sky Lanterns; 0-2 war machines per 1,000 pts; 0-1 Jade Lancers as a Special choice');
rule('warriors_wind_field_gc', 'special', 'max_per_1000_pts', 2,
  ['cathayan_grand_cannon_gc','fire_rain_rocket_battery_gc'], null, null,
  '0-2 war machines per 1,000 pts');
rule('warriors_wind_field_gc', 'special', 'max_count', 1,
  ['jade_lancers_gc'], null, null, '0-1 unit of Jade Lancers may be taken as a Special choice');
rule('warriors_wind_field_gc', 'rare', 'max_percent', 25, null, null, null, 'Cathayan Sentinels');
rule('warriors_wind_field_gc', 'rare', 'max_per_1000_pts', 1,
  ['cathayan_sentinel_gc'], null, null, '0-1 Cathayan Sentinel per 1,000 pts');
rule('warriors_wind_field_gc', 'mercenaries', 'max_percent', 20, null, null, null,
  'Includes Badlands Ogre Bulls (see Arcane Journal — Orc & Goblin Tribes)');

// ── Unit helpers ──────────────────────────────────────────────────────────────
const insertUnit = db.prepare(`INSERT INTO units
  (id, faction_id, name, source, category, list_category, list_category_overrides, troop_type, base_size, unit_size,
   points, armour_value, stats, profiles, equipment, equipment_by_model, special_rules,
   options, command, weapon_profiles, magic, notes, is_named_character, source_page, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let unitSort = 0;
function unit(id, name, category, listCat, troopType, baseSize, unitSize, points,
              { av=null, lcOverrides=null, stats=null, profiles=null, eq=null, eqByModel=null,
                sr=[], options=null, command=null, wp=null,
                magic=null, notes=null, isNamed=false, page=null } = {}) {
  insertUnit.run(
    id, FACTION, name, SOURCE_AJ, category, listCat,
    lcOverrides ? JSON.stringify(lcOverrides) : null,
    troopType, baseSize, unitSize, points, av,
    stats    ? JSON.stringify(stats)    : null,
    profiles ? JSON.stringify(profiles) : null,
    eq && typeof eq === 'object' && !Array.isArray(eq)
      ? JSON.stringify(eq) : (eq ? JSON.stringify(eq) : JSON.stringify([])),
    eqByModel ? JSON.stringify(eqByModel) : null,
    JSON.stringify(sr),
    options ? JSON.stringify(options) : null,
    command ? JSON.stringify(command) : null,
    wp      ? JSON.stringify(wp)      : null,
    magic   ? JSON.stringify(magic)   : null,
    notes   ? JSON.stringify(notes)   : null,
    isNamed ? 1 : null,
    page,
    unitSort++
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTERS
// ═══════════════════════════════════════════════════════════════════════════

// Miao Ying, the Storm Dragon (p20 main AJ; page 26 of backup)
// Two-form character: Human Form and Dragon Form (Transformation of the Dragon)
unit('miao_ying_gc', 'Miao Ying, the Storm Dragon', 'character', 'characters',
  'Heavy infantry (character)', '50 x 50 mm (Human Form), 100 x 150 mm (Dragon Form)', '1', 465, {
  isNamed: true,
  page: 26,
  lcOverrides: { warriors_wind_field_gc: null },
  profiles: [
    { name: 'Human Form', profile: { M:4, WS:7, BS:5, S:4, T:4, W:3, I:7, A:4, Ld:10 } },
    { name: 'Dragon Form', profile: { M:8, WS:8, BS:3, S:7, T:8, W:7, I:1, A:6, Ld:10 } },
  ],
  eq: [
    'Human Form: Talons of the Storm, heavy armour',
    'Dragon Form: Draconic scales (counts as full plate armour)',
  ],
  sr: [
    'celestial_forged_armour_5',
    'disdain_of_the_dragons',
    'hatred_all_enemies', // Hatred (Warriors of Chaos & Daemonic models) — using closest match
    'mastery_of_the_storm_winds',
    'mastery_of_the_elemental_winds',
    'stubborn',
    'supreme_matriarch_of_nan_gau',
    'transformation_of_the_dragon',
    'will_of_the_dragons',
    'wrath_of_the_storm',
  ],
  magic: { wizard_level: 4, lores: ['battle_magic','elementalism','high_magic'] },
  notes: [
    'In Human Form: Rallying Cry; Fly (9), Large Target, Stomp Attacks (D6), Swiftstride, Terror apply in Dragon Form only.',
    'In Dragon Form Miao Ying is a Level 2 Wizard equal to her current Level of Wizardry per turn.',
    'Miao Ying knows 4 spells from Battle Magic, Elementalism, or High Magic. In her Dragon Form she may also replace them with spells from the Lore of Yang or Lore of Yin.',
    'Talons of the Storm (Human Form): Combat, S, AP-1, Strike First. Dragon Fire: N/A, S4, AP-1, Breath Weapon, Flaming Attacks.',
    'Supreme Matriarch of Nan-Gau: Miao Ying is the army General if included. 0-1 unit of Jade Warriors and 0-1 unit of Jade Lancers in her army may be upgraded to Celestial Guard with +4 pts/model modifier.',
    'Disdain of the Dragons: Enemy models that wish to issue a challenge within Miao Ying\'s Command range must first make a Leadership test using their own Leadership. +1 modifier to die if Miao Ying is in Human Form, +2 if Dragon Form. Challenges from Miao Ying cannot be refused.',
    'Wrath of the Storm: All units of Jade Warriors and Jade Lancers included in an army led by Miao Ying gain the Hatred (Warriors of Chaos models) special rule.',
  ],
  wp: [
    { name: 'Talons of the Storm (Human)', range: 'Combat', S: 'S', AP: '-1', special_rules: ['strike_first'] },
    { name: 'Dragon Fire', range: 'N/A', S: '4', AP: '-1', special_rules: ['breath_weapon','flaming_attacks'] },
  ],
});

// Shugengan Lords of the Celestial Host (p25 main AJ; p30-31 backup)
// Monstrous creature characters — always ride Great Spirit Longma
unit('shugengan_lord_gc', 'Shugengan Lord', 'character', 'characters',
  'Monstrous creature (character)', '60 x 100 mm', '1', 220, {
  page: 25,
  profiles: [
    { name: 'Shugengan Lord', profile: { M:'-', WS:6, BS:3, S:4, T:5, W:3, I:6, A:4, Ld:9 } },
    { name: 'Great Spirit Longma', profile: { M:8, WS:5, BS:'-', S:5, T:4, W:4, I:3, A:3, Ld:'-' }, is_mount: true },
  ],
  eqByModel: {
    rider: ['Hand weapon', 'Iron talons', 'Light armour'],
    mount: ['Crown of horns'],
  },
  sr: [
    'armoured_hide_1',
    'celestial_forged_armour_5',
    'counter_charge',
    'feat_fly_9', // Impact Hits (D3+1) from the rider, Fly (9) from Great Spirit Longma
    'impact_hits_d3_plus_1',
    'mastery_of_the_elemental_winds',
    'swiftstride',
    'will_of_the_dragons',
  ],
  magic: { wizard_level: 2, lores: ['battle_magic','elementalism','illusion','high_magic'] },
  options: [
    { description: 'Must choose one of the following special rules', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Lore of Yang', cost: 0, scope: 'per_unit' },
        { description: 'Lore of Yin', cost: 0, scope: 'per_unit' },
      ]},
    { description: 'Celestial Blade (see p.48)', cost: 6, scope: 'per_unit', category: 'weapon' },
    { description: 'Cathayan lance (see p.48)', cost: 4, scope: 'per_unit', category: 'weapon' },
    { description: 'Dragon fire pistol (see p.48)', cost: 4, scope: 'per_unit', category: 'weapon' },
    { description: 'Replace light armour with heavy armour', cost: 4, scope: 'per_unit', category: 'armour' },
    { description: 'Be a Level 3 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Be a Level 4 Wizard', cost: 60, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  notes: [
    'Iron talons: Combat, S, AP-1, Strike First. Crown of horns: Combat, S, AP-1, Armour Bane (1).',
    'Armoured Hide: counts as 5+ Celestial Forged Armour (included in sr). Great Spirit Longma grants the Shugengan will of the Dragon, Mastery of the Elemental Winds, Swiftstride.',
    'Fly (9) applies in Dragon Form only — not applicable to Shugengan Lords.',
  ],
  wp: [
    { name: 'Iron talons', range: 'Combat', S: 'S', AP: '-1', special_rules: ['strike_first'] },
    { name: 'Crown of horns', range: 'Combat', S: 'S', AP: '-1', special_rules: ['armour_bane_1'] },
  ],
});

unit('shugengan_general_gc', 'Shugengan General', 'character', 'characters',
  'Monstrous creature (character)', '60 x 100 mm', '1', 145, {
  page: 25,
  profiles: [
    { name: 'Shugengan General', profile: { M:'-', WS:5, BS:3, S:4, T:5, W:2, I:5, A:3, Ld:8 } },
    { name: 'Great Spirit Longma', profile: { M:8, WS:5, BS:'-', S:5, T:4, W:4, I:3, A:3, Ld:'-' }, is_mount: true },
  ],
  eqByModel: {
    rider: ['Hand weapon', 'Iron talons', 'Light armour'],
    mount: ['Crown of horns'],
  },
  sr: [
    'armoured_hide_1',
    'celestial_forged_armour_5',
    'counter_charge',
    'impact_hits_d3_plus_1',
    'mastery_of_the_elemental_winds',
    'swiftstride',
    'will_of_the_dragons',
  ],
  magic: { wizard_level: 1, lores: ['battle_magic','elementalism','illusion','high_magic'] },
  options: [
    { description: 'Must choose one of the following special rules', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Lore of Yang', cost: 0, scope: 'per_unit' },
        { description: 'Lore of Yin', cost: 0, scope: 'per_unit' },
      ]},
    { description: 'Be a Level 2 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  notes: [
    'Iron talons: Combat, S, AP-1, Strike First. Crown of horns: Combat, S, AP-1, Armour Bane (1).',
  ],
  wp: [
    { name: 'Iron talons', range: 'Combat', S: 'S', AP: '-1', special_rules: ['strike_first'] },
    { name: 'Crown of horns', range: 'Combat', S: 'S', AP: '-1', special_rules: ['armour_bane_1'] },
  ],
});

// Gate Masters of the Celestial Cities (p26 main AJ; p31 backup)
unit('gate_master_gc', 'Gate Master', 'character', 'characters',
  'Heavy infantry (character)', '25 x 25 mm', '1', 80, {
  page: 26,
  stats: { M:4, WS:7, BS:4, S:4, T:3, W:3, I:4, A:3, Ld:9 },
  eq: ['Hand weapon', 'Heavy armour', 'Shield'],
  sr: ['harmony_of_stone_and_steel', 'will_of_the_dragons'],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Celestial Blade (see p.48)', cost: 6, scope: 'per_unit' },
        { description: 'Cathayan lance (if appropriately mounted, see p.48)', cost: 4, scope: 'per_unit' },
      ]},
    { description: 'Mount on a Cathayan Warhorse (+16 pts)', cost: 16, scope: 'per_unit', category: 'special' },
    { description: 'Battle Standard Bearer (+25 pts, one per army)', cost: 25, scope: 'per_unit', category: 'special',
      notes: 'In addition to their usual magic item allowance, a Battle Standard Bearer may purchase a single magic standard with no points limit.' },
    { description: 'Purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  notes: ['Harmony of Stone & Steel: A unit joined by a character with this special rule may re-roll any failed Leadership test when attempting to reform after running down a foe, when attempting to redirect a charge, or when making a Restraint test.'],
});

unit('gate_keeper_gc', 'Gate Keeper', 'character', 'characters',
  'Heavy infantry (character)', '25 x 25 mm', '1', 45, {
  page: 26,
  stats: { M:4, WS:6, BS:4, S:4, T:3, W:2, I:4, A:2, Ld:8 },
  eq: ['Hand weapon', 'Heavy armour', 'Shield'],
  sr: ['harmony_of_stone_and_steel', 'will_of_the_dragons'],
  options: [
    { description: 'Purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
});

// Magistrates of Grand Cathay (p27 main AJ; p33 backup)
unit('lord_magistrate_gc', 'Lord Magistrate', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 65, {
  page: 27,
  stats: { M:4, WS:5, BS:4, S:3, T:3, W:2, I:4, A:2, Ld:9 },
  eq: ['Hand weapon', 'Light armour'],
  sr: ['grand_strategist', 'harmony_of_stone_and_steel', 'will_of_the_dragons'],
  options: [
    { description: 'Gunpowder bombs (see p.48)', cost: 5, scope: 'per_unit', category: 'weapon' },
    { description: 'Dragon fire bombs (see p.48)', cost: 10, scope: 'per_unit', category: 'weapon' },
    { description: 'Mount on a Sky Lantern (see p.30)', cost: 0, scope: 'per_unit', category: 'special',
      notes: 'See Sky Lantern page for details.' },
    { description: 'Purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  notes: [
    'Grand Strategist: Magistrates are adept at outwitting their enemies, both across the negotiating table and on the battlefield. Unless this character is fleeing, all friendly units within their Command range, except your General, can use this character\'s Leadership characteristic instead of their own. In addition, once per turn a friendly unit that wins a round of combat whilst within this character\'s Command range may choose to Fall Back in Good Order rather than making a follow up or pursuit move.',
  ],
});

unit('strategist_gc', 'Strategist', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 40, {
  page: 27,
  stats: { M:4, WS:4, BS:3, S:3, T:3, W:2, I:3, A:1, Ld:9 },
  eq: ['Hand weapon', 'Light armour'],
  sr: ['grand_strategist', 'harmony_of_stone_and_steel', 'will_of_the_dragons'],
  options: [
    { description: 'Gunpowder bombs (see p.48)', cost: 5, scope: 'per_unit', category: 'weapon' },
    { description: 'Mount on a Sky Lantern (see p.30)', cost: 0, scope: 'per_unit', category: 'special',
      notes: 'See Sky Lantern page for details.' },
    { description: 'Purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
});

// Astromancers of the Celestial Court (Breaching AJ p44/47)
unit('astromancers_gc', 'Astromancers of the Celestial Court', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 125, {
  page: 44,
  lcOverrides: { dawn_storm_dragon_gc: null },
  profiles: [
    { name: 'Supreme Astromancer', profile: { M:4, WS:3, BS:3, S:3, T:3, W:3, I:3, A:2, Ld:8 } },
    { name: 'Astromancer', profile: { M:4, WS:3, BS:3, S:3, T:3, W:2, I:3, A:1, Ld:8 }, champion_cost: 0 },
  ],
  eq: ['Hand weapon'],
  sr: ['magical_attacks'],
  magic: { wizard_level: 3, lores: ['battle_magic','elementalism','high_magic','illusion'] },
  options: [
    { description: 'Must choose one of the following special rules', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Lore of Yang', cost: 0, scope: 'per_unit' },
        { description: 'Lore of Yin', cost: 0, scope: 'per_unit' },
      ]},
    { description: 'Mount on a Cathayan horse', cost: 16, scope: 'per_unit', category: 'special' },
    { description: 'Supreme Astromancer: Upgrade to Level 4 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Supreme Astromancer: Purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
    { description: 'Astromancer: Points cost 65 pts (use as a hero-tier Wizard)', cost: -60, scope: 'per_unit', category: 'special',
      notes: 'An Astromancer is a Level 1 Wizard for 65 pts. Upgrade to Level 2 for +30 pts. Magic items up to 50 pts.' },
  ],
  notes: [
    'Supreme Astromancer: Level 3 Wizard, 125 pts. Upgrade to Level 4 for +30 pts. Purchase magic items up to 100 pts.',
    'Astromancer: Level 1 Wizard, 65 pts. Upgrade to Level 2 for +30 pts. Purchase magic items up to 50 pts.',
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// CORE
// ═══════════════════════════════════════════════════════════════════════════

// Jade Warriors (p28 main AJ; p32 backup)
unit('jade_warriors_gc', 'Jade Warriors', 'infantry', 'core',
  'Heavy infantry', '25 x 25 mm', '5+', 8, {
  page: 28,
  lcOverrides: { warriors_wind_field_gc: 'special' },
  profiles: [
    { name: 'Jade Warrior', profile: { M:4, WS:4, BS:3, S:3, T:3, W:1, I:3, A:1, Ld:8 } },
    { name: 'Jade Officer', profile: { M:4, WS:4, BS:3, S:3, T:3, W:1, I:3, A:2, Ld:8 }, is_champion: true, champion_cost: 6 },
  ],
  eq: ['Hand weapons', 'Heavy armour'],
  sr: ['close_order', 'defensive_stance', 'detachment', 'regimental_unit', 'will_of_the_dragons'],
  command: [
    { role: 'champion', name: 'Jade Officer', cost_per_unit: 6 },
    { role: 'standard_bearer', cost_per_unit: 6 },
    { role: 'musician', cost_per_unit: 4 },
  ],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Halberds', cost: 0, scope: 'per_unit' },
        { description: 'Shields', cost: 0, scope: 'per_unit' },
      ]},
    { description: 'Have the Drilled special rule', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Have the Stubborn special rule', cost: 2, scope: 'per_model', category: 'special' },
    { description: 'Jade Officer may purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
    { description: 'Purchase a magic standard worth up to', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
    { description: '0-1 unit per 1,000 pts may be upgraded to Celestial Guard (if led by Miao Ying)', cost: 4, scope: 'per_model', category: 'special',
      notes: 'Celestial Guard option only available if Miao Ying is the army\'s General.' },
  ],
  notes: [
    'Defensive Stance: Unless it charged during the preceding Movement phase or counts as having charged this turn, a unit with this special rule may re-roll any Armour Save rolls of a natural 1 made during the Combat phase.',
    'Regimental Unit: A Jade Warriors unit may form a Detachment as long as the unit does not have the Skirmishers special rule.',
  ],
});

// Jade Lancers (p29 main AJ; p35 backup)
unit('jade_lancers_gc', 'Jade Lancers', 'cavalry', 'special',
  'Heavy cavalry', '30 x 60 mm', '5+', 20, {
  page: 29,
  profiles: [
    { name: 'Jade Lancer', profile: { M:'-', WS:4, BS:3, S:3, T:3, W:1, I:3, A:1, Ld:8 } },
    { name: 'Jade Lancer Officer', profile: { M:'-', WS:4, BS:3, S:3, T:3, W:1, I:3, A:2, Ld:8 }, is_champion: true, champion_cost: 6 },
    { name: 'Cathayan Warhorse', profile: { M:7, WS:3, BS:'-', S:3, T:4, W:'-', I:3, A:1, Ld:'-' }, is_mount: true },
  ],
  eqByModel: {
    rider: ['Hand weapons', 'Cathayan lance (see p.48)', 'Heavy armour', 'Shield'],
    mount: ['Iron-shod hooves (counts as a hand weapon)', 'Barding'],
  },
  sr: ['cathayan_cataphracts', 'close_order', 'counter_charge', 'horde', 'swiftstride', 'will_of_the_dragons'],
  command: [
    { role: 'champion', name: 'Jade Lancer Officer', cost_per_unit: 6 },
    { role: 'standard_bearer', cost_per_unit: 6 },
    { role: 'musician', cost_per_unit: 6 },
  ],
  options: [
    { description: 'Have the Ambushers special rule (0-1 per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Have the Drilled special rule', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Have the Stubborn special rule', cost: 2, scope: 'per_model', category: 'special' },
    { description: 'Jade Lancer Officer may purchase magic items up to a total of', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
    { description: 'Purchase a magic standard worth up to', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
    { description: '0-1 unit per 1,000 pts may be upgraded to Celestial Guard (if led by Miao Ying)', cost: 4, scope: 'per_model', category: 'special',
      notes: 'Celestial Guard option only available if Miao Ying is the army\'s General.' },
  ],
  notes: [
    'Cathayan Cataphracts: Jade Lancers are trained to fight with long cavalry spears, bringing the heavily armoured bulk of their warhorses and the weight of their numbers to bear in crushing charges that grind the enemy underfoot. When a unit in which the majority of models have this special rule makes a follow up move, the unit counts as having charged during the next turn.',
  ],
  wp: [
    { name: 'Cathayan lance', range: 'Combat', S: 'S+1', AP: '-1', special_rules: ['armour_bane_1','fight_in_extra_rank'], notes: 'Cavalry, monster or chariot troop types only. Strength and Armour Piercing modifiers apply only against enemy models the wielder charged that turn.' },
    { name: 'Iron-shod hooves', range: 'Combat', S: 'S', AP: '-', special_rules: [] },
  ],
});

// Peasant Levy (Breaching AJ p48)
unit('peasant_levy_gc', 'Peasant Levy', 'infantry', 'core',
  'Regular infantry', '25 x 25 mm', '10+', 4, {
  page: 48,
  lcOverrides: { dawn_storm_dragon_gc: null },
  profiles: [
    { name: 'Peasant Soldier', profile: { M:4, WS:2, BS:3, S:3, T:3, W:1, I:3, A:1, Ld:5 } },
    { name: 'Peasant Elder', profile: { M:4, WS:2, BS:4, S:3, T:3, W:1, I:3, A:2, Ld:6 }, is_champion: true, champion_cost: 8 },
  ],
  eq: ['Hand weapons'],
  sr: ['close_order', 'horde', 'warband'],
  command: [
    { role: 'champion', name: 'Peasant Elder', cost_per_unit: 8 },
    { role: 'standard_bearer', cost_per_unit: 5 },
    { role: 'musician', cost_per_unit: 5 },
  ],
  options: [
    { description: 'Weapon upgrade (entire unit)', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Long spears', cost: 0, scope: 'per_unit' },
        { description: 'Warbows', cost: 0, scope: 'per_unit' },
      ]},
    { description: 'Light armour', cost: 1, scope: 'per_model', category: 'armour' },
    { description: 'Replace Close Order with Skirmishers', cost: 0, scope: 'per_unit', category: 'special' },
    { description: 'Ambushers (0-1 unit per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special' },
  ],
  notes: [
    'Long spear: Combat, S, -, Fight in Extra Rank, Strike First. Models whose troop type is "infantry" only. A model wielding a long spear cannot make a supporting attack during a turn in which it charged. Strike First applies only against charging enemy units.',
  ],
  wp: [
    { name: 'Long spear', range: 'Combat', S: 'S', AP: '-', special_rules: ['fight_in_extra_rank','strike_first'], notes: 'Infantry only. Cannot support-attack in a turn it charged. Strike First applies only against chargers.' },
    { name: 'Warbow', range: '30"', S: '3', AP: '-', special_rules: [] },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL
// ═══════════════════════════════════════════════════════════════════════════

// Crane Gunner Teams (Breaching AJ p49)
unit('crane_gunner_teams_gc', 'Crane Gunner Teams', 'infantry', 'special',
  'Regular infantry', '25 x 50 mm', '3-8', 16, {
  page: 49,
  lcOverrides: { dawn_storm_dragon_gc: null },
  profiles: [
    { name: 'Crane Gunner Team', profile: { M:4, WS:3, BS:3, S:3, T:3, W:2, I:3, A:2, Ld:7 } },
  ],
  eq: ['Hand weapons', 'Crane gun (see below)', 'Light armour', 'Tower shield (see below)'],
  sr: ['open_order'],
  options: [
    { description: 'Ambushers (0-1 unit per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Reserve Move', cost: 2, scope: 'per_model', category: 'special' },
  ],
  notes: [
    'Tower Shield: A tower shield improves its wielder\'s armour value by 3 (rather than the usual 1) against attacks made by enemy models within the wielder\'s front arc. However, a tower shield offers no protection against attacks from the wielder\'s flank or rear arcs.',
    'Crane gun: 36", S6, AP-2, Armour Bane (2), Cumbersome, Move or Shoot.',
  ],
  wp: [
    { name: 'Crane gun', range: '36"', S: '6', AP: '-2', special_rules: ['armour_bane_2','move_or_shoot'], notes: 'Cumbersome.' },
  ],
});

// Iron Hail Gunners (Breaching AJ p50)
unit('iron_hail_gunners_gc', 'Iron Hail Gunners', 'infantry', 'special',
  'Regular infantry', '25 x 25 mm', '4-12', 12, {
  page: 50,
  lcOverrides: { dawn_storm_dragon_gc: null, warriors_wind_field_gc: 'core' },
  profiles: [
    { name: 'Iron Hail Gunner', profile: { M:4, WS:3, BS:3, S:3, T:3, W:1, I:3, A:1, Ld:7 } },
    { name: 'Marksman', profile: { M:4, WS:3, BS:4, S:3, T:3, W:1, I:3, A:1, Ld:7 }, is_champion: true, champion_cost: 6 },
  ],
  eq: ['Hand weapons', 'Iron hail gun (see below)', 'Light armour'],
  sr: ['open_order', 'skirmishers'],
  command: [
    { role: 'champion', name: 'Marksman', cost_per_unit: 6 },
  ],
  options: [
    { description: 'Gunpowder bombs', cost: 2, scope: 'per_model', category: 'weapon' },
  ],
  notes: [
    'Iron hail gun: 12", S3, AP-1, Move & Shoot, Multiple Shots (D3). A model armed with an iron hail gun suffers no negative modifiers for firing at long range, for using the Multiple Shots (D3) special rule, or whilst making a Stand & Shoot charge reaction.',
    'Gunpowder bombs: 9", S3, AP-, Armour Bane (1), Move & Shoot, Quick Shot. If the roll To Hit is successful, a gunpowder bomb causes D3 hits to the target enemy unit, rather than the usual one.',
  ],
  wp: [
    { name: 'Iron hail gun', range: '12"', S: '3', AP: '-1', special_rules: ['move_or_shoot','multiple_shots_d3'], notes: 'No negative modifiers for long range, Multiple Shots, or Stand & Shoot.' },
    { name: 'Gunpowder bombs', range: '9"', S: '3', AP: '-', special_rules: ['armour_bane_1','move_or_shoot','quick_shot'], notes: 'Causes D3 hits on successful roll To Hit.' },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL / RARE — WAR MACHINES & MONSTERS
// ═══════════════════════════════════════════════════════════════════════════

// Sky Lanterns (p30-31 main AJ; p36 backup)
unit('sky_lanterns_gc', 'Sky Lanterns', 'war_machine', 'rare',
  'Heavy chariot', '100 x 100 mm', '1', 135, {
  page: 30,
  av: '4+',
  profiles: [
    { name: 'Sky Lantern', profile: { M:1, WS:'-', BS:'-', S:'-', T:4, W:7, I:'-', A:'-', Ld:8 } },
    { name: 'Lantern Gunners (x4)', profile: { M:'-', WS:3, BS:5, S:'-', T:'-', W:'-', I:'-', A:'-', Ld:'-' } },
    { name: 'Commander', profile: { M:'-', WS:3, BS:5, S:'-', T:'-', W:'-', I:3, A:2, Ld:8 }, is_champion: true, champion_cost: 15 },
  ],
  eq: { crew: ['Hand weapons'], mount: [] },
  sr: [
    'close_order', 'disengage_sky_lantern', 'eye_of_the_dragon', 'feigned_flight',
    'fire_and_flee', 'flammable', 'fly_8', 'heavenly_beacon', 'large_target', 'reserve_move',
    'scouts',
  ],
  options: [
    { description: 'Lantern Gunners and Commander must take one of the following weapons', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Sky Lantern Crane Guns (see below)', cost: 0, scope: 'per_unit' },
        { description: 'Iron hail guns and gunpowder bombs (see opposite)', cost: 0, scope: 'per_unit' },
      ]},
    { description: 'Dragon fire bombs (see p.48)', cost: 20, scope: 'per_unit', category: 'weapon' },
    { description: 'Sky Lantern bombs (see opposite)', cost: 15, scope: 'per_unit', category: 'weapon' },
  ],
  notes: [
    'Crane gun: 12", S3, AP-, Move & Shoot, Multiple Shots (D3). Cumbersome.',
    'Sky Lantern crane gun: 12", S?, AP-, Move & Shoot, Multiple Shots (D3).',
    'Sky Lantern bomb: Bombardment, d3+1 templates; see rules.',
    'Eye of the Dragon: Friendly models whose weapons shoot using the Bombardment special rule can shoot using this model\'s line of sight rather than their own.',
    'Disengage: In the face of overwhelming aggression, a Sky Lantern can easily disengage, climbing to the heavens before attacking once more. Should this model lose a round of combat it may attempt to disengage by making a Leadership test. If passed, this model may Fall Back in Good Order rather than Give Ground. Enemy units can follow up as if this model had given ground, moving 2" directly towards this model, but cannot pursue it. However, if this test is failed, this model is unable to disengage and must Give Ground as normal. In addition, should it win a round of combat, this model may choose to Fall Back in Good Order rather than making a follow up or pursuit move.',
    'Heavenly Beacon: Brightly coloured and illuminated from within, Sky Lanterns act as both a beacon and a rallying point for the forces of the Celestial Dragon. Unless this model is fleeing, friendly units within 12" of it may re-roll any failed Panic or Rally test. Whilst this model is on the battlefield, unless it is fleeing, a friendly unit with the Ambushers special rule that is held in reserve arrives this turn as reinforcements or is delayed. A Lord Magistrate or Strategist mounted on a Sky Lantern has a Command range of 15".',
    'Character Mount: A Sky Lantern may be included in your army as a character\'s mount. If so, its points are added to that of its rider.',
  ],
  wp: [
    { name: 'Sky Lantern crane gun', range: '12"', S: '3', AP: '-', special_rules: ['move_or_shoot','multiple_shots_d3'], notes: 'Cumbersome.' },
    { name: 'Sky Lantern iron hail gun', range: '12"', S: '3', AP: '-1', special_rules: ['move_or_shoot','multiple_shots_d3'] },
    { name: 'Sky Lantern gun bombs', range: '9"', S: '3', AP: '-', special_rules: ['armour_bane_1','move_or_shoot','quick_shot'], notes: 'Causes D3 hits.' },
    { name: 'Dragon fire bombs', range: '9"', S: '3', AP: '-1', special_rules: ['flaming_attacks','move_or_shoot','quick_shot'] },
    { name: 'Sky Lantern bombs', range: 'Bombardment', S: '5', AP: '-3', special_rules: ['bombardment','multiple_wounds_d3_plus_1'], notes: 'd3+1 blast templates.' },
  ],
});

// Cathayan Sentinel (p32-33 main AJ; p38 backup)
unit('cathayan_sentinel_gc', 'Cathayan Sentinel', 'monster', 'rare',
  'Behemoth', '100 x 150 mm', '1', 230, {
  page: 32,
  profiles: [
    { name: 'Cathayan Sentinel', profile: { M:6, WS:5, BS:1, S:6, T:6, W:6, I:3, A:3, Ld:10 } },
  ],
  eq: ['Hand weapon', 'Great blade (see below)', 'Terracotta armour (counts as heavy armour)'],
  sr: [
    'close_order', 'immune_to_psychology', 'implacable',
    'large_target', 'stomp_attacks_d3_plus_1', 'terror', 'tinmen_borri', 'unbreakable',
  ],
  options: [
    { description: 'Sentinel upgrade (choose one)', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Terracotta Sentinel (free — Regeneration (6+))', cost: 0, scope: 'per_unit' },
        { description: 'Jade Sentinel (+20 pts — knows a single spell)', cost: 20, scope: 'per_unit' },
        { description: 'Obsidian Sentinel (+25 pts — Magic Resistance (-2))', cost: 25, scope: 'per_unit' },
        { description: 'Granite Sentinel (+35 pts — Immune to Multiple Wounds; 5+ Ward vs unsaved wounds)', cost: 35, scope: 'per_unit' },
        { description: 'Warpstone Sentinel (+40 pts — Magical Attacks; Toughness -1 on Warpstone contact)', cost: 40, scope: 'per_unit' },
      ]},
  ],
  notes: [
    'Implacable: Once given orders, a Cathayan Sentinel will not falter in its duty, relentlessly carrying out its last commands until the task is complete. Once per game during a turn in which it was charged, this model may choose not to Give Ground should it lose a round of combat. In addition, once per game this model may re-roll its Charge roll.',
    'Great Blade: This weapon has two profiles. The wielder must choose which profile the soldier will use at the start of each round of combat. Scything blow: Combat, S5, AP-2, Armour Bane (1), Extra Attacks (+2D3), Strike Last. Deadly strike: Combat, S+1, AP-4, Killing Blow, Monster Slayer, Multiple Wounds (D3).',
    'Terracotta Sentinel: Regeneration (6+). Jade Sentinel: knows a single spell (chosen by controlling player) before armies are deployed from Battle Magic or Elementalism Lore of Magic; may cast as a Bound spell with a Power Level of 3. Obsidian Sentinel: Magic Resistance (-2); any enemy Wizard that wishes to cast a spell within 12" of one or more Obsidian Sentinels must first make a Leadership test; if failed, Wizard\'s Casting roll suffers a -3 modifier. Granite Sentinel: Immune to Multiple Wounds; if a Granite Sentinel suffers an unsaved wound from an attack with this special rule, it loses a single Wound. Warpstone Sentinel: Magical Attacks; whilst in base contact with one or more Warpstone Sentinels, enemy units suffer a -1 modifier to their Toughness characteristic (to minimum of 1).',
  ],
  wp: [
    { name: 'Scything blow', range: 'Combat', S: '5', AP: '-2', special_rules: ['armour_bane_1','extra_attacks_d6','strike_last'], notes: 'Extra Attacks: +2D3. Each round choose this or Deadly Strike.' },
    { name: 'Deadly strike', range: 'Combat', S: 'S+1', AP: '-4', special_rules: ['killing_blow','monster_slayer','multiple_wounds_d3_plus_1'] },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// WAR MACHINES
// ═══════════════════════════════════════════════════════════════════════════

// Cathayan Grand Cannon (p34 main AJ)
unit('cathayan_grand_cannon_gc', 'Cathayan Grand Cannon', 'war_machine', 'special',
  'War machine', '60 x 100 mm (war machine); 25 x 25 mm (crew)', '1', 130, {
  page: 34,
  profiles: [
    { name: 'Grand Cannon', profile: { M:'-', WS:'-', BS:'-', S:'-', T:'-', W:7, I:'-', A:'-', Ld:7 } },
    { name: 'Cathayan Artillery Crew (x3)', profile: { M:4, WS:3, BS:3, S:3, T:3, W:1, I:3, A:1, Ld:7 } },
  ],
  eq: { crew: ['Hand weapons', 'Light armour'], mount: ['Grand cannon (see below)'] },
  sr: ['skirmishers'],
  options: [
    { description: 'Ogre Loader upgrade (see Ogre Artillery Crew)', cost: 35, scope: 'per_unit', category: 'special',
      notes: 'See Ogre Artillery Crew entry. Crew of any war machine joined by an Ogre Loader gains +1 to Movement and the Stubborn special rule.' },
  ],
  notes: [
    'Grand cannon: 48", S10, AP-5, Armour Bane (3), Cannon Fire, Cumbersome, Move or Shoot; Multiple Wounds (D3+1), Thunderous Impact.',
    'Thunderous Impact: Until your next Start of Turn sub-phase, any unit (friend or foe) that was within 5" of the model struck when a Cathayan grand cannon shoots suffers a D10 modifier to its Movement characteristic and cannot use the Swiftstride special rule.',
    'This weapon uses the Black Powder Misfire table.',
  ],
  wp: [
    { name: 'Grand cannon', range: '48"', S: '10', AP: '-5', special_rules: ['armour_bane_3_pump_wagon_impact_hits_only','cannon_fire','move_or_shoot','multiple_wounds_d3_plus_1','thunderous_impact'], notes: 'Cumbersome. Uses Black Powder Misfire table. Armour Bane (3).' },
  ],
});

// Fire Rain Rocket Battery (p35 main AJ)
unit('fire_rain_rocket_battery_gc', 'Fire Rain Rocket Battery', 'war_machine', 'special',
  'War machine', '60 x 100 mm (war machine); 25 x 25 mm (crew)', '1', 100, {
  page: 35,
  profiles: [
    { name: 'Fire Rain Rocket', profile: { M:'-', WS:'-', BS:'-', S:'-', T:'-', W:5, I:'-', A:'-', Ld:7 } },
    { name: 'Cathayan Artillery Crew (x3)', profile: { M:4, WS:3, BS:3, S:3, T:3, W:1, I:3, A:1, Ld:7 } },
  ],
  eq: { crew: ['Hand weapons', 'Light armour'], mount: ['Fire rain rocket launcher (see below)'] },
  sr: ['skirmishers'],
  options: [
    { description: 'Ogre Loader upgrade (see Ogre Artillery Crew)', cost: 35, scope: 'per_unit', category: 'special' },
  ],
  notes: [
    'Bastion rockets: 12-48", S4, AP-1+3, Armour Bane (1+3), Bombardment, Harrowing Attack, Multiple Wounds (D3). Uses Black Powder Misfire table. Scatter d6" as a stone thrower.',
    'Rocket battery: 12-48", S4, AP-1, Armour Bane (1), Bombardment, Cumbersome, Move or Shoot, Wailing Spirits. Uses Black Powder Misfire table. Scatter d6" as stone thrower.',
    'Each turn, a Fire Rain Rocket Battery can fire one of these two different types of rocket. Roll before firing which type is launched.',
    'Rocket Battery special rules — Wailing Spirits: Any unit that suffers one or more unsaved wounds from this weapon must make a Panic test as if it had taken heavy casualties.',
    'Harrowing Attack: Any unit that suffers one or more wounds from Bastion rockets must make a Dangerous Terrain test.',
  ],
  wp: [
    { name: 'Bastion rockets', range: '12-48"', S: '4', AP: '-1', special_rules: ['armour_bane_1','bombardment','multiple_wounds_d3_plus_1'], notes: 'Additionally AP-3 and Armour Bane (+2) bonus. Scatter 6" as stone thrower. Harrowing Attack.' },
    { name: 'Rocket battery', range: '12-48"', S: '4', AP: '-1', special_rules: ['armour_bane_1','bombardment','move_or_shoot'], notes: 'Cumbersome. Scatter 6" as stone thrower. Wailing Spirits.' },
  ],
});

// Ogre Artillery Crew (p36 main AJ; p43 backup — character/mercenary)
unit('ogre_artillery_crew_gc', 'Ogre Artillery Crew', 'character', 'mercenaries',
  'Monstrous infantry', '40 x 40 mm', '1', 35, {
  page: 36,
  stats: { M:4, WS:3, BS:4, S:4, T:4, W:2, I:3, A:2, Ld:8 },
  eq: ['Hand weapon', 'Light armour'],
  sr: ['enough_for_everyone', 'mercenary_crew', 'stubborn'],
  options: [
    { description: 'Gunpowder bombs (see p.48)', cost: 8, scope: 'per_unit', category: 'weapon' },
  ],
  notes: [
    'Enough for Everyone: Ogres are used to sharing their weapons and, when they make gunpowder bombs for themselves, they make sure to bring enough for their friends. If an Ogre Loader is equipped with gunpowder bombs, the crew of the war machine that the Ogre Loader has joined is also equipped with gunpowder bombs.',
    'Mercenary Crew: An Ogre Loader is a special type of character that can be taken as an upgrade to accompany a Cathayan war machine. During deployment, position an Ogre Loader with its war machine, as you would a character that has joined a unit. Once placed, an Ogre Loader cannot leave its war machine.',
    'The crew of any war machine joined by an Ogre Loader gains a +1 modifier to its Movement characteristic and the Stubborn special rule. Once per game, a Fire Rain Rocket Battery or Cathayan Grand Cannon that includes an Ogre Loader may fire twice during the Shooting phase, or re-roll a single Artillery dice.',
  ],
});

// ── Verify counts ─────────────────────────────────────────────────────────────
const unitCount = db.prepare('SELECT COUNT(*) as n FROM units WHERE faction_id = ?').get(FACTION);
console.log(`Units inserted: ${unitCount.n}`);

// ═══════════════════════════════════════════════════════════════════════════
// LORES & SPELLS
// ═══════════════════════════════════════════════════════════════════════════
const insertLore = db.prepare(
  `INSERT INTO lores (lore_key, faction_id, name, source, sort_order) VALUES (?, ?, ?, ?, ?)`
);
const insertSpell = db.prepare(
  `INSERT INTO spells (id, lore_key, faction_id, name, type, casting_value, range, mark, effect, is_signature, remains_in_play, sort_order)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

let spellSort = 0;
function spell(id, loreKey, name, type, cv, range, effect, { isSig=false, rip=false, mark=null } = {}) {
  insertSpell.run(id, loreKey, FACTION, name, type, String(cv), range, mark, effect, isSig ? 1 : 0, rip ? 1 : 0, spellSort++);
}

// Lore of Yang
insertLore.run('lore_of_yang', FACTION, 'Lore of Yang', SOURCE_AJ, 0);

spell('yang_constellation_dragon', 'lore_of_yang',
  'Constellation of the Dragon', 'Magic Missile', '7/11+', '18"',
  'If cast with 7+: target enemy unit suffers D3 Strength 3 hits, each with AP of -1. If cast with 11+: the target enemy unit suffers 2D6+2 Strength 4 hits, each with an AP of -1.',
  { isSig: true });

spell('yang_great_bastion', 'lore_of_yang',
  'Great Bastion', 'Enchantment', '9+', '12"',
  'Remains in Play. The target friendly unit gains D6 Wounds. In addition, every model within the front rank of an enemy unit that ends its move in base contact with the target unit whilst this spell is in play must make a Dangerous Terrain test. Any Wounds lost are counted as unsaved wounds inflicted by the enchantment when calculating combat resolution. Any Wounds lost due to this spell are removed from the target unit when this spell ends.',
  { rip: true });

spell('yang_might_heaven_earth', 'lore_of_yang',
  'Might of Heaven & Earth', 'Enchantment', '9/12+', 'Self',
  'If cast with 9+: the caster and any unit they have joined gain +1 modifier to their Weapon Skill and Strength characteristics (to a maximum of 10), and gain the Flaming Attacks special rule. If cast with 12+: all friendly units within the caster\'s Command range that are within the caster\'s unit also gain this modifier (to a maximum of 10) and gain the Flaming Attacks special rule. This spell lasts until the end of the turn.');

// Lore of Yin
insertLore.run('lore_of_yin', FACTION, 'Lore of Yin', SOURCE_AJ, 1);

spell('yin_spirits_wind_shadow', 'lore_of_yin',
  'Spirits of Wind & Shadow', 'Hex', '10+', '15"',
  'Until your next Start of Turn sub-phase, the target enemy unit becomes subject to the Random Movement (D6) special rule.',
  { isSig: true });

spell('yin_accursed_mirror', 'lore_of_yin',
  'Accursed Mirror', 'Hex', '9+', '15"',
  'Until your next Start of Turn sub-phase, any rolls To Hit of a natural 1 made by the target enemy unit during either the Shooting phase or the Combat phase result in a Strength 3 hit with an AP of -1, which must be resolved against the target enemy unit. This spell may target any enemy unit not engaged in combat.');

spell('yin_ancestral_warriors', 'lore_of_yin',
  'Ancestral Warriors', 'Assailment', '7/11+', 'Combat',
  'If cast with 7+: a single enemy unit engaged in combat suffers 2D3 Strength 2 hits, each with an AP of -1. If cast with 11+: the target enemy unit suffers 2D6 Strength 4 hits, each with an AP of -1. This spell has the Armour Bane (2) special rule.');

// ── Verify spells ─────────────────────────────────────────────────────────────
const spellCount = db.prepare('SELECT COUNT(*) as n FROM spells WHERE faction_id = ?').get(FACTION);
console.log(`Spells inserted: ${spellCount.n}`);

// ═══════════════════════════════════════════════════════════════════════════
// MAGIC ITEMS
// ═══════════════════════════════════════════════════════════════════════════
const insertItem = db.prepare(`INSERT INTO magic_items
  (id, faction_id, name, category, points, source, description, rules_text, restrictions,
   single_use, is_shield, extremely_common, grants_rules, weapon_profile, armour_profile, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let itemSort = 0;
function item(id, name, cat, pts, desc, rulesText, {
  restrictions=null, singleUse=null, isShield=null, extremelyCommon=null,
  grantsRules=null, wp=null, ap=null,
} = {}) {
  insertItem.run(
    id, FACTION, name, cat, pts, SOURCE_AJ,
    desc, rulesText ?? null, restrictions ?? null,
    singleUse ? 1 : null,
    isShield ? 1 : null,
    extremelyCommon ? 1 : null,
    grantsRules ? JSON.stringify(grantsRules) : null,
    wp ? JSON.stringify(wp) : null,
    ap ? JSON.stringify(ap) : null,
    itemSort++
  );
}

// ── Magic Weapons (main AJ) ───────────────────────────────────────────────────
item('monkey_kings_wisdom', 'The Monkey King\'s Wisdom', 'magic_weapon', 75,
  'A huge and ornate club, studded with jewels and wrapped with precious metals, the Monkey King\'s Wisdom is a huge and brutal weapon.',
  'Combat, S10, AP-4, Magical Attacks, Multiple Wounds (D3), Requires Two Hands, Strike Last.',
  { wp: { name: "The Monkey King's Wisdom", range: 'Combat', S: '10', AP: '-4', special_rules: ['magical_attacks','multiple_wounds_d3_plus_1','strike_last'], notes: 'Requires Two Hands.' } });

item('jade_blade_great_fleet', 'Jade Blade of the Great Fleet', 'magic_weapon', 70,
  'The Jade Blade is an ancient weapon fashioned from the fang of a Lumbrean sea monster. Imbued with the monster\'s regenerative powers, it continually heals its wielder.',
  'Combat, S+2, AP-2, Armour Bane (1), Magical Attacks. The wielder of the Jade Blade of the Great Fleet gains the Regeneration (5+) special rule.',
  { wp: { name: 'Jade Blade of the Great Fleet', range: 'Combat', S: 'S+2', AP: '-2', special_rules: ['armour_bane_1','magical_attacks','regeneration_5'], notes: 'Wielder gains Regeneration (5+).' } });

item('spirit_longma_spear', 'Spirit Longma Spear', 'magic_weapon', 25,
  'Made from the horn of the Great Spirit Longma Tian Wu and able to pierce any armour, heroes of Cathay carry this spear into battle with pride.',
  'Combat, S+1, AP-3, Armour Bane (1), Magical Attacks. Models whose troop type is "cavalry", "monster" or "chariot" only. The Spirit Longma Spear\'s Strength and Armour Piercing modifiers apply only during a turn in which the wielder charged.',
  { restrictions: 'Cavalry, monster or chariot troop types only',
    wp: { name: 'Spirit Longma Spear', range: 'Combat', S: 'S+1', AP: '-3', special_rules: ['armour_bane_1','magical_attacks'], notes: 'S and AP bonuses apply only in a turn the wielder charged.' } });

item('sun_and_moon_blades', 'Sun & Moon Blades', 'magic_weapon', 20,
  'According to legend, the blade of the Sun brings enlightenment, whilst the blade of the Moon brings only death.',
  'Combat, S+1, AP-1, Extra Attacks (1), Magical Attacks, Requires Two Hands. Notes: If the wielder of the Sun & Moon Blades is struck with a Killing Blow, roll a Die. On a roll of 4+, the Killing Blow is parried and the Killing Rune is discarded with no further effect.',
  { wp: { name: 'Sun & Moon Blades', range: 'Combat', S: 'S+1', AP: '-1', special_rules: ['magical_attacks'], notes: 'Extra Attacks (+1). Requires Two Hands. On a KB roll, roll a Die: 4+ parries the KB.' } });

// ── Magic Armour (main AJ) ────────────────────────────────────────────────────
item('armour_of_the_warbird', 'The Armour of the Warbird', 'magic_armour', 45,
  'The wearer of the Armour of the Warbird takes to the skies to strike at their enemies from above.',
  'The bearer gains a suit of heavy armour. In addition, the bearer gains the Counter Charge, Fly (9), and Swiftstride special rules. However, the bearer cannot join a unit.',
  { restrictions: 'Regular infantry or heavy cavalry troop types only',
    grantsRules: ['counter_charge','fly_9','swiftstride'],
    ap: { armour_value: 'Heavy armour (5+)', special_rules: ['counter_charge','fly_9','swiftstride'] } });

item('shield_of_nan_gau', 'Shield of Nan-Gau', 'magic_armour', 20,
  'Carved from a section of the Great Bastion, the Shield of Nan-Gau is a massive stone and iron shield.',
  'The Shield of Nan-Gau is a shield. In addition, during a turn in which its bearer was charged, the Shield of Nan-Gau improves its bearer\'s armour value by 2 (to a maximum of 2+).',
  { isShield: true, ap: { armour_value: 'Shield', special_rules: [], notes: 'Armour value improves by 2 (max 2+) during the turn the bearer was charged.' } });

// ── Talismans (main AJ) ───────────────────────────────────────────────────────
item('crystal_of_kunlan', 'Crystal of Kunlan', 'talisman', 35,
  'The crystals that grow in the peaks of Kunlan unleash enormous energy when struck.',
  'The bearer of this talisman is given a 5+ Ward save against any wounds suffered. In addition, if a natural 6 is rolled when the Ward save is made, every model in base contact with the bearer suffers a Strength 3 hit with an AP of "-". These attacks have the Flaming Attacks special rule.');

item('crown_of_jade', 'Crown of Jade', 'talisman', 20,
  'Hostile magic recoils from the wearer of this gleaming crown of office.',
  'The Crown of Jade gives its bearer a 4+ Ward save against any wounds suffered that were caused by a Magic Missile, Magical Vortex, or an Assailment spell.');

// ── Enchanted Items (main AJ) ─────────────────────────────────────────────────
item('maw_shard', 'Maw Shard', 'enchanted_item', 50,
  'Some have travelled to the broken lands around the Great Maw and brought back strange objects — among them the Maw Shard, an extra-worldly artefact.',
  'If an enemy Wizard rolls a natural double when making a Casting roll whilst within 18" of the bearer of the Maw Shard, the spell is miscast, regardless of the casting result.');

item('alchemists_mask', 'Alchemist\'s Mask', 'enchanted_item', 35,
  'Created in the House of Secrets of Shang Yang, this mysterious mask gifts the wearer with the alchemical secrets of the Iron Dragon.',
  'The wearer of the Alchemist\'s Mask can cast the Plague of Rust spell (from the Lore of Elementalism, page 327 of the Warhammer: the Old World rulebook) as a Bound spell, with a Power Level of 1.');

item('spirit_lantern', 'Spirit Lantern', 'enchanted_item', 25,
  'The ghostly light of a Spirit Lantern reveals the denizens of the underworld and lays bare their weaknesses.',
  'A model carrying a Spirit Lantern causes Terror. In addition, a model carrying a Spirit Lantern may re-roll any natural 6 to Wound of a natural 1 against enemy models that are Daemonic or Undead.',
  { grantsRules: ['terror'] });

// ── Arcane Items (main AJ) ────────────────────────────────────────────────────
item('cloak_of_po_mei', 'Cloak of Po Mei', 'arcane_item', 50,
  'This enchanted cloak grants its wearer exceptional magical strength and mastery over one of the Elemental Winds.',
  'In addition to their randomly generated spells, the wearer of the Cloak of Po Mei knows all three spells from the Lore of Yin or the Lore of Yang (chosen by their controlling player). However, they can only cast a number of spells equal to their Level of Wizardry per turn.');

item('guardian_feng_shi_bo', 'Guardian Feng Shi Bo', 'arcane_item', 35,
  'Feng Shi Bo are elemental familiars summoned by Cathayan Wizards. Most often, these earthbound spirits guard their masters, protecting them from harm.',
  'Any enemy model that directs its attacks against the owner of a Guardian Feng Shi Bo during the Combat phase suffers a -1 modifier to its rolls To Hit.');

item('learned_feng_shi_bo', 'Learned Feng Shi Bo', 'arcane_item', 15,
  'Some Wizards create Feng Shi Bo to aid them with their scholarly studies, tasking the spirits with remembering obscure lore.',
  'The owner of a Learned Feng Shi Bo knows one more spell (chosen in the usual way) than is normal for their Level of Wizardry. Note that this does not increase the Wizard\'s Level. However, they can only cast a number of spells equal to their Level of Wizardry per turn.');

// ── Magic Standards (main AJ) ─────────────────────────────────────────────────
item('standard_of_wei_jin', 'Standard of Wei-Jin', 'magic_standard', 60,
  'The banner of the Dragon Emperor inspires all Cathayan soldiers who gaze upon it, while spreading disorder and panic in their foes.',
  'A unit carrying the Standard of Wei-Jin suffers a -1 modifier to the Leadership characteristic of all enemy units within 12" of the model carrying the standard when making a Feat, Panic or Terror test.');

item('icon_of_heavenly_fury', 'Icon of Heavenly Fury', 'magic_standard', 45,
  'The banners are the realm of the Celestial Dragon, and those that would encroach upon his domain must face his wrath.',
  'Single use. During the Command sub-phase of their turn, if they are not engaged in combat, the bearer of this banner may attempt to use it by making a Leadership test (using their own unmodified Leadership). If this test is passed, until your next Start of Turn sub-phase enemy units cannot use the Fly (X) special rule.',
  { singleUse: true });

item('dragons_eye_runner', 'Dragon\'s Eye Runner', 'magic_standard', 30,
  'Under the scrutiny of the Celestial Dragons, enemy Wizards falter.',
  'When an enemy Wizard chooses a unit carrying the Dragon\'s Eye Runner as the target of a spell, roll a D6. On a 4+, the Wizard\'s controlling player must choose another target. If there is no other visible target in range, the spell cannot be cast.');

item('banner_of_the_bastion', 'Banner of the Bastion', 'magic_standard', 25,
  'Those fortunate enough to fight beneath this venerable banner must be as solid and unwavering as the Great Bastion itself.',
  'A unit carrying the Banner of the Bastion gains the Shieldwall special rule.',
  { grantsRules: ['shieldwall'] });

// ── Magic Weapons (Dawn of the Storm Dragon) ──────────────────────────────────
item('sword_of_reason', 'The Sword of Reason', 'magic_weapon', 65,
  'This great blade is sometimes wielded by Yuan Bo when his duties require him to enforce the Celestial Dragon\'s will upon the unruly.',
  'Combat, S+2, AP-, Killing Blow, Magical Attacks. Notes: The wielder of the Sword of Reason strikes a Killing Blow if they roll a natural 5 or 6 when making a roll To Wound, rather than the usual 6.',
  { wp: { name: 'The Sword of Reason', range: 'Combat', S: 'S+2', AP: '-', special_rules: ['killing_blow','magical_attacks'], notes: 'KB on 5 or 6 To Wound (not the usual 6 only).' } });

item('brazen_blade', 'The Brazen Blade', 'magic_weapon', 50,
  'Crafted in the forges of Nan-Gau, this unusual weapon carves deep wounds that no magic can heal.',
  'Combat, S+4, AP-1, Magical Attacks, Multiple Wounds (2). Enemy models cannot make Regeneration saves against an attack made with the Brazen Blade. If the wielder rolls a natural 6 when making a Ward save or Regeneration save, they roll again.',
  { wp: { name: 'The Brazen Blade', range: 'Combat', S: 'S+4', AP: '-1', special_rules: ['magical_attacks','multiple_wounds_2'], notes: 'Enemy cannot make Regeneration saves. Wielder must re-roll natural 6s on Ward/Regen saves.' } });

item('wrath_of_xen_yang', 'The Wrath of Xen Yang', 'magic_weapon', 45,
  'Supposedly once wielded by the Celestial Dragon himself, this long and elegant spear burns with Dragon fire.',
  'Combat, S+1, AP-, Flaming Attacks, Magical Attacks. Enemy models cannot make Regeneration saves against an attack made with this weapon.',
  { wp: { name: 'The Wrath of Xen Yang', range: 'Combat', S: 'S+1', AP: '-', special_rules: ['flaming_attacks','magical_attacks'], notes: 'Enemy cannot make Regeneration saves against this weapon.' } });

item('sword_of_nan_gau', 'The Sword of Nan-Gau', 'magic_weapon', 35,
  'This shimmering blade strikes with a life of its own, seeking any weakness in the armour of those that serve the Ruinous Powers.',
  'Combat, S, AP-, Hatred (Warriors of Chaos), Magical Attacks.',
  { wp: { name: 'The Sword of Nan-Gau', range: 'Combat', S: 'S', AP: '-', special_rules: ['magical_attacks'], notes: 'Hatred (Warriors of Chaos).' } });

// ── Magic Armour (Dawn of the Storm Dragon) ───────────────────────────────────
item('jade_armour_of_beichai', 'Jade Armour of Beichai', 'magic_armour', 40,
  'Crafted in secret in the city of Beichai, this jade armour flows from within with unwholesome power.',
  'The Jade Armour of Beichai is a suit of full plate armour. In addition, the bearer of the Jade Armour has a 5+ Ward save against any wound suffered, and gains the Magic Resistance (-2) special rule.',
  { ap: { armour_value: '4+ (full plate)', special_rules: ['magic_resistance_2'] } });

item('mantle_of_heaven', 'The Mantle of Heaven', 'magic_armour', 20,
  'Woven from silk harvested from the slopes of Kunlan, the wearer of these robes is filled with a measure of the Celestial Dragon\'s essence.',
  'Models whose troop type is "cavalry" or "monster" only. The Mantle of Heaven may be worn with other armour. The wearer of the Mantle of Heaven improves their armour value by 2 (to a maximum of 2+) against non-magical shooting attacks.',
  { restrictions: 'Cavalry or monster troop types only' });

// ── Talismans (Dawn of the Storm Dragon) ─────────────────────────────────────
item('sigil_of_smoke_and_powder', 'Sigil of Smoke & Powder', 'talisman', 35,
  'Clouds of gunpowder smoke hang about the bearer of this blackened sigil, obscuring them from the enemy\'s sight.',
  'Any enemy model that targets this character or any unit they have joined during the Shooting phase suffers an additional -1 To Hit modifier.');

item('vermilion_quills', 'Vermilion Quills', 'talisman', 25,
  'Great heroes of Grand Cathay are awarded tokens of favour in the form of a Vermilion warlord\'s tail feather, tokens which are said to bless the bearer with unrivalled fortune.',
  '0-1 per model. Single Use. The bearer of a Vermilion Quill (but not any failed role To Hit or To Wound) made during the Combat phase can re-roll once per game, any natural double when making a Casting roll.',
  { singleUse: true });

// ── Magic Standards (Dawn of the Storm Dragon) ────────────────────────────────
item('banner_of_dragons_wrath', 'Banner of the Dragon\'s Wrath', 'magic_standard', 45,
  'Those that march to war beneath the Banner of the Dragon\'s Wrath descend upon the foe with the fury of Li Dao, the Fire Dragon.',
  'A unit carrying a Banner of the Dragon\'s Wrath gains the Flaming Attacks and Impact Hits (1) special rules.',
  { grantsRules: ['flaming_attacks','impact_hits_1'] });

item('jade_banner', 'The Jade Banner', 'magic_standard', 40,
  'Carved from pure jade by Cathay\'s finest artisans, this ancient banner fills the heart of a Jade Warrior with pride.',
  'When calculating combat resolution, a unit carrying the Grand Banner of Supremacy may claim an additional honour of +2 combat result points.');

item('shroud_of_shiyama', 'Shroud of Shiyama', 'magic_standard', 25,
  'The spectral presence of Shiyama, the Spirit Dragon, lingers about those that fight beneath this silken standard crafted in her memory.',
  'A unit carrying the Shroud of Shiyama gains the Fear special rule. If they already have Fear, they instead gain the Terror special rule.',
  { grantsRules: ['fear'] });

item('banner_of_xen_wun', 'The Banner of Xen Wun', 'magic_standard', 15,
  'Those that would fight beneath this venerable banner must be as solid and unwavering as the Great Bastion itself.',
  'Enemy units that wish to declare a Stand & Shoot or Fire & Flee charge reaction against a unit carrying the Banner of Xen Wun must first make a Leadership test. If this test is failed, they must Hold instead.');

// ── Enchanted Items (Dawn of the Storm Dragon) ────────────────────────────────
item('ring_of_jet', 'Ring of Jet', 'enchanted_item', 30,
  'Carved from jasjet jet quarried from the banks of the Dragon River, the Ring of Jet is infused with the power of Shiyama, allowing its wielder to summon ancestral spirits.',
  '0-1 per model. The wielder of the Ring of Jet can cast the Unquiet Spirits spell from the Lore of Necromancy (page 333 of the Warhammer: the Old World rulebook) as a Bound spell, with a Power Level of 1.',
  { restrictions: '0-1 per model' });

item('golden_lion', 'Golden Lion', 'enchanted_item', 25,
  'Jade Lions are revered in Cathay for their bravery, and golden amulets carved into their likeness inspire great courage.',
  'The bearer of the Golden Lion and their unit may re-roll any failed Fear, Panic, Rally or Terror test.');

item('fires_of_nan_gau', 'The Fires of Nan-Gau', 'enchanted_item', 20,
  'Cunningly crafted by the artificers of Nan-Gau, these earthenware jars contain the fiery of the city\'s forges, ready to be unleashed upon Cathay\'s enemies.',
  '0-1 per model. Single Use. The Fires of Nan-Gau is a breath weapon with the following profile: N/A, S4, AP-2, Breath Weapon, Flaming Attacks, Magical Attacks.',
  { singleUse: true, restrictions: '0-1 per model' });

// ── Arcane Items (Dawn of the Storm Dragon) ───────────────────────────────────
item('clockwork_compass', 'Clockwork Compass', 'arcane_item', 50,
  'This finely wrought clockwork mechanism emulates the properties of the Wu Xing compass in Wei-Jin. When correctly used, it can temporarily still the Winds of Magic.',
  'Single use. The bearer may use this item instead of making a Wizardly dispel attempt. If they do so, the spell is automatically dispelled with no Dispel roll required. In addition, all Remains in Play spells currently in play are dispelled, including spells cast by friendly Wizards.',
  { singleUse: true });

item('seal_of_xing_po', 'Seal of Xing Po', 'arcane_item', 35,
  'The bearer of a Seal of Xing Po has studied the elemental winds for decades, mastering the Winds of Yin and Yang.',
  '0-1 per model. If you wish, the bearer of a Seal of Xing Po may discard two of their randomly generated spells (rather than the usual one) and instead select two signature spells from either the Lore of Yang or the Lore of Yin (determined by which of those two special rules they have).',
  { restrictions: '0-1 per model' });

item('scrolls_of_wei_jin', 'Scrolls of Wei-Jin', 'arcane_item', 10,
  'Fortunate enough to study in the Elemental Winds in the heart of the Celestial City, these scholars carry with them many arcane scrolls, heavy with knowledge.',
  'The bearer of the Scrolls of Wei-Jin knows one more spell (chosen in the usual way) than is normal for their Level of Wizardry. However, they can only cast a number of spells equal to their Level of Wizardry per turn.');

// ── Armoury entries (not magic items, listed in p43 main AJ for reference) ────
// These are just common weapons noted in the book; they're referenced in unit entries above.
// Not stored as magic items — they're regular weapon profile options.

console.log(`\nGrand Cathay seed complete.`);
console.log(`Compositions: ${db.prepare('SELECT COUNT(*) as n FROM army_compositions WHERE faction_id = ?').get(FACTION).n}`);
console.log(`Composition rules: ${db.prepare('SELECT COUNT(*) as n FROM composition_rules WHERE faction_id = ?').get(FACTION).n}`);
console.log(`Units: ${db.prepare('SELECT COUNT(*) as n FROM units WHERE faction_id = ?').get(FACTION).n}`);
console.log(`Spells: ${db.prepare('SELECT COUNT(*) as n FROM spells WHERE faction_id = ?').get(FACTION).n}`);
console.log(`Magic items: ${db.prepare('SELECT COUNT(*) as n FROM magic_items WHERE faction_id = ?').get(FACTION).n}`);
