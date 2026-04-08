/**
 * Seeds the Dark Elves Legends Army List into the DB.
 * Source: warhammertheoldworld_legends_darkelves_eng_24.09
 *
 * Usage: node scripts/seed-dark-elves.mjs
 * After running: npm run db:export
 */
import Database from 'better-sqlite3';
const db = new Database('db/battlestandard.sqlite');

const FACTION = 'dark-elves';
const SOURCE = 'legends';

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
  'Dark Elves',
  SOURCE,
  JSON.stringify(['Dark Elves Legacy Army List']),
  JSON.stringify({
    _key_order: [
      'id','name','sources','army_compositions','units',
      'magic_items','lore_of_naggaroth',
    ],
  })
);

// ── Army Composition ──────────────────────────────────────────────────────────
db.prepare(`INSERT INTO army_compositions (id, faction_id, name, source, sort_order) VALUES (?, ?, ?, ?, ?)`).run(
  'grand_army_de', FACTION, 'Dark Elves — Grand Army', SOURCE, 0
);

const insertRule = db.prepare(`INSERT INTO composition_rules
  (composition_id, faction_id, category, limit_type, limit_value, unit_ids, character_unit_ids, general_unit_ids, notes, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let ruleSort = 0;
function rule(category, limitType, limitValue, unitIds, charIds, genIds, notes) {
  insertRule.run(
    'grand_army_de', FACTION, category, limitType, limitValue,
    unitIds ? JSON.stringify(unitIds) : null,
    charIds ? JSON.stringify(charIds) : null,
    genIds  ? JSON.stringify(genIds)  : null,
    notes ?? null,
    ruleSort++
  );
}

rule('characters', 'max_percent', 50, null, null, null,
  '0-1 Dreadlord or Supreme Sorceress per 1,000 pts; Dark Elf Masters, Sorceresses, High Beastmasters, Death Hags, Khainite Assassins as desired; 0-1 Cauldron of Blood per 1,000 pts (Death Hag mount)');
rule('characters', 'max_per_1000_pts', 1,
  ['dark_elf_dreadlord','dark_elf_supreme_sorceress'], null, null,
  '0-1 Dark Elf Dreadlord or Supreme Sorceress per 1,000 points');
rule('characters', 'max_per_1000_pts', 1,
  ['cauldron_of_blood'], null, null,
  '0-1 Cauldron of Blood per 1,000 points (taken as a mount for a Death Hag)');
rule('core', 'min_percent', 25, null, null, null,
  'Dark Elf Warriors, Repeater Crossbowmen, Black Ark Corsairs and Dark Riders; if army includes 1+ Death Hags, 0-1 unit of Witch Elves may be taken as Core');
rule('core', 'conditional', 1,
  ['witch_elves'], null, ['death_hag'],
  'If your army includes one or more Death Hags, 0-1 unit of Witch Elves may be taken as a Core choice');
rule('special', 'max_percent', 50, null, null, null,
  'Har Ganeth Executioners, Witch Elves, Dark Elf Shades, Harpies; 0-1 Black Guard per Noble; 0-1 Cold One Knights per 1,000 pts; 0-2 Scourgerunner/Cold One Chariots per 1,000 pts; if General is High Beastmaster, 0-1 War Hydra or Kharibdyss as Special');
rule('special', 'max_per_character', 1,
  ['black_guard_of_naggarond'], ['dark_elf_dreadlord','dark_elf_master'], null,
  '0-1 unit of Black Guard of Naggarond per Dark Elf Noble (Master or Dreadlord) taken');
rule('special', 'max_per_1000_pts', 1,
  ['cold_one_knights_de'], null, null,
  '0-1 unit of Cold One Knights per 1,000 points');
rule('special', 'max_per_1000_pts', 2,
  ['scourgerunner_chariots','cold_one_chariots_de'], null, null,
  '0-2 Scourgerunner Chariots or Cold One Chariots (combined) per 1,000 points');
rule('special', 'conditional', 1,
  ['war_hydra','kharibdyss'], null, ['high_beastmaster'],
  'If your General is a High Beastmaster, 0-1 War Hydra or Kharibdyss may be taken as a Special choice');
rule('rare', 'max_percent', 25, null, null, null,
  'Sisters of Slaughter, Bloodwrack Shrines, War Hydras, Kharibdyss, Bloodwrack Medusas; 0-1 Doomfire Warlocks per 1,000 pts; 0-2 Reaper Bolt Throwers per 1,000 pts');
rule('rare', 'max_per_1000_pts', 1,
  ['doomfire_warlocks'], null, null,
  '0-1 unit of Doomfire Warlocks per 1,000 points');
rule('rare', 'max_per_1000_pts', 2,
  ['reaper_bolt_thrower'], null, null,
  '0-2 Reaper Bolt Throwers per 1,000 points');
rule('mercenaries', 'max_percent', 20, null, null, null, null);

// ── Unit helpers ──────────────────────────────────────────────────────────────
const insertUnit = db.prepare(`INSERT INTO units
  (id, faction_id, name, source, category, list_category, troop_type, base_size, unit_size,
   points, armour_value, stats, profiles, equipment, equipment_by_model, special_rules,
   options, command, weapon_profiles, magic, notes, is_named_character, source_page, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let unitSort = 0;
function unit(id, name, category, listCat, troopType, baseSize, unitSize, points,
              { av=null, stats=null, profiles=null, eq=null, eqByModel=null,
                sr=[], options=null, command=null, wp=null,
                magic=null, notes=null, isNamed=false, page=null } = {}) {
  insertUnit.run(
    id, FACTION, name, SOURCE, category, listCat, troopType, baseSize, unitSize, points, av,
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

// Dark Elf Dreadlord (p3)
unit('dark_elf_dreadlord', 'Dark Elf Dreadlord', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 130, {
  stats: {M:5,WS:7,BS:7,S:4,T:3,W:3,I:6,A:4,Ld:10},
  eq: ['Hand weapon','light armour'],
  sr: ['eternal_hatred','hatred_high_elves','murderous','strike_first'],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapon', cost: 3, scope: 'per_unit' },
        { description: 'Great weapon', cost: 4, scope: 'per_unit' },
        { description: 'Halberd', cost: 3, scope: 'per_unit' },
        { description: 'Lance (if appropriately mounted)', cost: 4, scope: 'per_unit' },
      ]},
    { description: 'Ranged weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Repeater crossbow', cost: 6, scope: 'per_unit' },
        { description: 'Repeater handbow', cost: 5, scope: 'per_unit' },
        { description: 'Brace of repeater handbows', cost: 10, scope: 'per_unit' },
      ]},
    { description: 'Shield', cost: 2, scope: 'per_unit', category: 'armour' },
    { description: 'Armour upgrade', cost: 0, scope: 'per_unit', category: 'armour',
      choices: [
        { description: 'Heavy armour', cost: 3, scope: 'per_unit' },
        { description: 'Full plate armour', cost: 6, scope: 'per_unit' },
      ]},
    { description: 'Mount', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Dark Steed (+14 pts)', cost: 14, scope: 'per_unit' },
        { description: 'Cold One (+18 pts)', cost: 18, scope: 'per_unit' },
        { description: 'Cold One Chariot (see p.16)', cost: 125, scope: 'per_unit' },
        { description: 'Black Dragon (see p.18)', cost: 280, scope: 'per_unit' },
        { description: 'Manticore (see p.19)', cost: 130, scope: 'per_unit' },
      ]},
    { description: 'Sea Dragon Cloak', cost: 4, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  notes: ['*Eternal Hatred and Strike First do not apply to this model\'s mount (should it have one).'],
  page: 3,
});

// Dark Elf Master (p3)
unit('dark_elf_master', 'Dark Elf Master', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 70, {
  stats: {M:5,WS:6,BS:6,S:4,T:3,W:2,I:5,A:3,Ld:9},
  eq: ['Hand weapon','light armour'],
  sr: ['eternal_hatred','hatred_high_elves','murderous','strike_first'],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapon', cost: 3, scope: 'per_unit' },
        { description: 'Great weapon', cost: 4, scope: 'per_unit' },
        { description: 'Halberd', cost: 3, scope: 'per_unit' },
        { description: 'Lance (if appropriately mounted)', cost: 4, scope: 'per_unit' },
      ]},
    { description: 'Ranged weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Repeater crossbow', cost: 6, scope: 'per_unit' },
        { description: 'Repeater handbow', cost: 5, scope: 'per_unit' },
        { description: 'Brace of repeater handbows', cost: 10, scope: 'per_unit' },
      ]},
    { description: 'Shield', cost: 2, scope: 'per_unit', category: 'armour' },
    { description: 'Armour upgrade', cost: 0, scope: 'per_unit', category: 'armour',
      choices: [
        { description: 'Heavy armour', cost: 3, scope: 'per_unit' },
        { description: 'Full plate armour', cost: 6, scope: 'per_unit' },
      ]},
    { description: 'Mount', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Dark Steed (+14 pts)', cost: 14, scope: 'per_unit' },
        { description: 'Cold One (+18 pts)', cost: 18, scope: 'per_unit' },
        { description: 'Cold One Chariot (see p.16)', cost: 125, scope: 'per_unit' },
      ]},
    { description: 'Battle Standard Bearer', cost: 25, scope: 'per_unit', category: 'special',
      notes: 'One Dark Elf Master per army only. May purchase a single magic standard with no points limit.' },
    { description: 'Sea Dragon Cloak', cost: 4, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  notes: ['*Eternal Hatred and Strike First do not apply to this model\'s mount (should it have one).'],
  page: 3,
});

// Dark Elf Supreme Sorceress (p4)
unit('dark_elf_supreme_sorceress', 'Dark Elf Supreme Sorceress', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 150, {
  stats: {M:5,WS:4,BS:4,S:3,T:3,W:3,I:5,A:2,Ld:8},
  eq: ['Hand weapon'],
  sr: ['elven_reflexes','eternal_hatred','hatred_high_elves','hekartis_blessing','lore_of_naggaroth','murderous'],
  magic: { wizard_level: 3, lores: ['battle_magic','daemonology','dark_magic','elementalism','illusion'] },
  options: [
    { description: 'Mount', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Dark Steed (+14 pts)', cost: 14, scope: 'per_unit' },
        { description: 'Cold One (+18 pts)', cost: 18, scope: 'per_unit' },
        { description: 'Dark Pegasus (+35 pts)', cost: 35, scope: 'per_unit' },
        { description: 'Black Dragon (see p.18)', cost: 280, scope: 'per_unit' },
      ]},
    { description: 'Upgrade to Level 4 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  page: 4,
});

// Dark Elf Sorceress (p4)
unit('dark_elf_sorceress', 'Dark Elf Sorceress', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 75, {
  stats: {M:5,WS:4,BS:4,S:3,T:3,W:2,I:4,A:1,Ld:8},
  eq: ['Hand weapon'],
  sr: ['elven_reflexes','eternal_hatred','hatred_high_elves','hekartis_blessing','lore_of_naggaroth','murderous'],
  magic: { wizard_level: 1, lores: ['battle_magic','daemonology','dark_magic','elementalism','illusion'] },
  options: [
    { description: 'Mount', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Dark Steed (+14 pts)', cost: 14, scope: 'per_unit' },
        { description: 'Cold One (+18 pts)', cost: 18, scope: 'per_unit' },
        { description: 'Dark Pegasus (+35 pts)', cost: 35, scope: 'per_unit' },
      ]},
    { description: 'Upgrade to Level 2 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  page: 4,
});

// High Beastmaster (p5)
unit('high_beastmaster', 'High Beastmaster', 'character', 'characters',
  'Regular infantry (character)', '(as mount)', '1', 75, {
  stats: {M:'-',WS:7,BS:7,S:4,T:3,W:3,I:5,A:3,Ld:9},
  eq: ['Hand weapon','whip','light armour'],
  sr: ['eternal_hatred','goad_beast','hatred_high_elves','murderous','strike_first'],
  options: [
    { description: 'Cavalry spear', cost: 2, scope: 'per_unit', category: 'weapon' },
    { description: 'Repeater crossbow', cost: 6, scope: 'per_unit', category: 'weapon' },
    { description: 'Shield', cost: 2, scope: 'per_unit', category: 'armour' },
    { description: 'Replace light armour with heavy armour', cost: 3, scope: 'per_unit', category: 'armour',
      replaces: 'light armour' },
    { description: 'Mount (required)', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Scourgerunner Chariot (see p.16)', cost: 85, scope: 'per_unit' },
        { description: 'Manticore (see p.19)', cost: 130, scope: 'per_unit' },
      ]},
    { description: 'Sea Dragon Cloak', cost: 4, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 75, category: 'special' },
  ],
  notes: ['Must be mounted on a Scourgerunner Chariot or Manticore.',
          '*Goad Beast, Hatred (High Elves), and Strike First do not apply to this model\'s mount.'],
  page: 5,
});

// Death Hag (p6)
unit('death_hag', 'Death Hag', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 70, {
  stats: {M:5,WS:6,BS:6,S:4,T:3,W:2,I:7,A:3,Ld:8},
  eq: ['Two hand weapons'],
  sr: ['eternal_hatred','frenzy','hatred_all_enemies','loner','murderous','poisoned_attacks','strike_first'],
  options: [
    { description: 'Gift of Khaine', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Cry of War', cost: 15, scope: 'per_unit' },
        { description: 'Rune of Khaine', cost: 10, scope: 'per_unit' },
        { description: 'Witchbrew', cost: 20, scope: 'per_unit' },
      ]},
    { description: 'Mount on Cauldron of Blood (see p.15)', cost: 150, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 75, category: 'special' },
  ],
  notes: ['Gifts of Khaine — Cry of War: enemy units within Command range suffer -1 Ld whilst this character is not fleeing. Rune of Khaine: has Extra Attacks (+D3). Witchbrew: this character, mount and joined unit cannot lose the Frenzy rule.'],
  page: 6,
});

// Khainite Assassin (p7)
unit('khainite_assassin', 'Khainite Assassin', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 80, {
  stats: {M:5,WS:8,BS:7,S:4,T:3,W:2,I:7,A:3,Ld:8},
  eq: ['Hand weapon','throwing weapons'],
  sr: ['eternal_hatred','hatred_all_enemies','hidden','immune_to_psychology','murderous','strike_first'],
  options: [
    { description: 'Additional hand weapon', cost: 3, scope: 'per_unit', category: 'weapon' },
    { description: 'Repeater handbow', cost: 5, scope: 'per_unit', category: 'weapon' },
    { description: 'Forbidden poison', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Black Lotus', cost: 5, scope: 'per_unit' },
        { description: 'Dark Venom', cost: 15, scope: 'per_unit' },
        { description: 'Manbane', cost: 15, scope: 'per_unit' },
      ]},
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  notes: ['Cannot be the army General.',
          'Forbidden Poisons — Black Lotus: enemy characters suffer -1 Ld for remainder of game per unsaved wound. Dark Venom: has Killing Blow. Manbane: rolls To Wound of 4+ always succeed regardless of Toughness.'],
  page: 7,
});

// ── Character Mounts ──────────────────────────────────────────────────────────

// Dark Steed (character mount, p8)
unit('dark_steed_de', 'Dark Steed', 'mount', null,
  'Light cavalry', '30 x 60 mm', '1', 14, {
  profiles: [
    { name: 'Dark Steed', profile: {M:9,WS:3,BS:'-',S:3,T:'-',W:'-',I:4,A:1,Ld:'-'} },
  ],
  eq: ['Hooves (counts as hand weapon)'],
  sr: ['fast_cavalry','swiftstride'],
  page: 8,
});

// Cold One character mount (p8)
unit('cold_one_de', 'Cold One', 'mount', null,
  'Heavy cavalry', '30 x 60 mm', '1', 18, {
  profiles: [
    { name: 'Cold One', profile: {M:7,WS:3,BS:'-',S:4,T:'-',W:2,I:2,A:'-',Ld:'-'} },
  ],
  eq: ['Claws and teeth (counts as hand weapon)'],
  sr: ['armour_bane_1_cold_one_only','armoured_hide_1','fear','first_charge','stupidity','swiftstride'],
  notes: ['A character mounted on a Cold One has +1 Toughness.'],
  page: 8,
});

// Dark Pegasus (Sorceress mount only, p8)
unit('dark_pegasus', 'Dark Pegasus', 'mount', null,
  'Monstrous cavalry', '40 x 60 mm', '1', 35, {
  profiles: [
    { name: 'Dark Pegasus', profile: {M:8,WS:3,BS:'-',S:4,T:'-',W:'-',I:4,A:3,Ld:'-'} },
  ],
  eq: ['Hooves (counts as hand weapon)'],
  sr: ['armour_bane_1_dark_pegasus_only','counter_charge','first_charge','fly_10','swiftstride'],
  notes: ['A character mounted on a Dark Pegasus has +1 Wound. Available to Sorceresses only.'],
  page: 8,
});

// Black Dragon (Dreadlord or Supreme Sorceress only, p18)
unit('black_dragon_de', 'Black Dragon', 'mount', null,
  'Behemoth', '60 x 100 mm', '1', 280, {
  profiles: [
    { name: 'Black Dragon', profile: {M:6,WS:6,BS:'-',S:7,T:'-',W:'-',I:4,A:6,Ld:'-'} },
  ],
  eq: ['Wicked claws','serrated maw','noxious breath','draconic scales (counts as full plate armour)'],
  sr: ['close_order','fly_10','hatred_high_elves','large_target','stomp_attacks_d6','swiftstride','terror'],
  wp: [
    { name: 'Wicked claws', range: 'Combat', S: 'S', AP: '-2', special_rules: [] },
    { name: 'Serrated maw', range: 'Combat', S: 'S', AP: '-',
      special_rules: ['Armour Bane (2)','Multiple Wounds (2)'],
      notes: 'In combat, this model must make one of its attacks each turn with this weapon.' },
    { name: 'Noxious breath', range: 'N/A', S: '4', AP: 'N/A',
      special_rules: ['Breath Weapon'],
      notes: 'Until your next Start of Turn sub-phase, every model in a unit that suffers one or more unsaved wounds from this weapon suffers a -1 modifier to their Weapon Skill (to a minimum of 1). No armour save is permitted against wounds caused by this weapon (Ward and Regeneration saves can be attempted as normal).' },
  ],
  notes: ['A character mounted on a Black Dragon has +3 Toughness and +6 Wounds.',
          'Character mount only. Dreadlord or Supreme Sorceress only.'],
  page: 18,
});

// Manticore (Dreadlord or High Beastmaster only, p19)
unit('manticore_de', 'Manticore', 'mount', null,
  'Monstrous creature', '60 x 100 mm', '1', 130, {
  profiles: [
    { name: 'Manticore', profile: {M:6,WS:5,BS:'-',S:5,T:'-',W:'-',I:5,A:4,Ld:'-'} },
  ],
  eq: ['Wicked claws','scaly skin (counts as heavy armour)'],
  sr: ['close_order','fly_9','large_target','stomp_attacks_d3','swiftstride','terror','wilful_beast'],
  wp: [
    { name: 'Wicked claws', range: 'Combat', S: 'S', AP: '-2', special_rules: [] },
    { name: 'Venomous tail', range: 'Combat', S: 'S', AP: '-',
      special_rules: ['Poisoned Attacks','Strike First'],
      notes: 'Optional upgrade (+15 pts). In combat, this model must make one of its attacks each turn with this weapon.' },
  ],
  options: [
    { description: 'Venomous tail', cost: 15, scope: 'per_unit', category: 'special' },
  ],
  notes: ['A character mounted on a Manticore has +1 Toughness and +4 Wounds.',
          'Character mount only. Dreadlord or High Beastmaster only.',
          'Wilful Beast: each Start of Turn sub-phase, make a Leadership test (unmodified). If failed, rider loses control — mount has Frenzy until next Start of Turn sub-phase.'],
  page: 19,
});

// Cauldron of Blood (Death Hag mount, p15)
unit('cauldron_of_blood', 'Cauldron of Blood', 'mount', null,
  'Heavy chariot', '60 x 100 mm', '1', 150, {
  av: '4+',
  profiles: [
    { name: 'Cauldron of Blood', profile: {M:2,WS:'-',BS:'-',S:5,T:5,W:5,I:'-',A:'-',Ld:'-'} },
    { name: 'Witch Elf Crew (x2)', profile: {M:'-',WS:4,BS:4,S:3,T:'-',W:'-',I:5,A:1,Ld:9}, is_mount: false },
  ],
  eq: { crew: ['Two hand weapons'] },
  sr: ['close_order','dragged_along','elven_reflexes','frenzy','hatred_high_elves',
       'impact_hits_d6_plus_1','large_target','magic_resistance_minus_1','murderous',
       'poisoned_attacks','terror'],
  notes: ['Blessings of Khaine (Bound spell, Power Level 2): Casting Value 9+. Range: Self. Until next Start of Turn, every friendly Death Hag, unit of Witch Elves or Sisters of Slaughter within Command range gains one of: Fury of Khaine (Furious Charge), Strength of Khaine (Cleaving Blow), or Bloodshield of Khaine (5+ Ward save against any wounds).',
          'Character mount only. Death Hag only. Points added to Death Hag\'s total.'],
  page: 15,
});

// ═══════════════════════════════════════════════════════════════════════════
// CORE
// ═══════════════════════════════════════════════════════════════════════════

// Dark Elf Warriors (p9)
unit('dark_elf_warriors', 'Dark Elf Warriors', 'infantry', 'core',
  'Regular infantry', '25 x 25 mm', '10+', 8, {
  profiles: [
    { name: 'Dark Elf Warrior', profile: {M:5,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8} },
  ],
  eq: ['Hand weapons','light armour','shields'],
  sr: ['close_order','elven_reflexes','hatred_high_elves','martial_prowess'],
  options: [
    { description: 'Take thrusting spears', cost: 1, scope: 'per_model', category: 'weapon' },
    { description: 'Veteran rule (0-1 unit per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Lordling', cost_per_unit: 5 },
    { role: 'standard_bearer', cost_per_unit: 5 },
    { role: 'musician', cost_per_unit: 5 },
  ],
  page: 9,
});

// Repeater Crossbowmen (p9)
unit('repeater_crossbowmen', 'Repeater Crossbowmen', 'infantry', 'core',
  'Regular infantry', '25 x 25 mm', '10+', 11, {
  profiles: [
    { name: 'Repeater Crossbowman', profile: {M:5,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8} },
  ],
  eq: ['Hand weapons','repeater crossbows','light armour'],
  sr: ['close_order','elven_reflexes','hatred_high_elves','martial_prowess'],
  options: [
    { description: 'Take shields', cost: 1, scope: 'per_model', category: 'armour' },
    { description: 'Veteran rule (0-1 unit per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Lordling', cost_per_unit: 5 },
    { role: 'standard_bearer', cost_per_unit: 5 },
    { role: 'musician', cost_per_unit: 5 },
  ],
  page: 9,
});

// Black Ark Corsairs (p10)
unit('black_ark_corsairs', 'Black Ark Corsairs', 'infantry', 'core',
  'Regular infantry', '25 x 25 mm', '10+', 11, {
  profiles: [
    { name: 'Corsair', profile: {M:5,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8} },
  ],
  eq: ['Hand weapons','light armour'],
  sr: ['elven_reflexes','hatred_high_elves','move_through_cover','open_order','sea_dragon_cloak'],
  options: [
    { description: 'Unit weapon choice (required)', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapons (free)', cost: 0, scope: 'per_unit' },
        { description: 'Repeater handbows (free)', cost: 0, scope: 'per_unit' },
      ]},
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Reaver', cost_per_unit: 6 },
    { role: 'standard_bearer', cost_per_unit: 6 },
    { role: 'musician', cost_per_unit: 6 },
  ],
  page: 10,
});

// Dark Riders (p13)
unit('dark_riders', 'Dark Riders', 'cavalry', 'core',
  'Light cavalry', '30 x 60 mm', '5+', 16, {
  profiles: [
    { name: 'Dark Rider', profile: {M:9,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8} },
    { name: 'Dark Steed', profile: {M:9,WS:3,BS:'-',S:3,T:'-',W:'-',I:4,A:1,Ld:'-'}, is_mount: true },
  ],
  eqByModel: {
    rider: ['Hand weapons','cavalry spears','light armour'],
    mount: ['Hooves (counts as hand weapons)'],
  },
  sr: ['elven_reflexes','fast_cavalry','hatred_high_elves','open_order','skirmishers','swiftstride'],
  options: [
    { description: 'Repeater crossbows', cost: 2, scope: 'per_model', category: 'weapon' },
    { description: 'Shields', cost: 1, scope: 'per_model', category: 'armour' },
    { description: 'Fire & Flee rule (0-1 unit per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Scouts rule (0-1 unit per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Herald', cost_per_unit: 6 },
    { role: 'standard_bearer', cost_per_unit: 6 },
    { role: 'musician', cost_per_unit: 6 },
  ],
  page: 13,
});

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL
// ═══════════════════════════════════════════════════════════════════════════

// Black Guard of Naggarond (p10)
unit('black_guard_of_naggarond', 'Black Guard of Naggarond', 'infantry', 'special',
  'Regular infantry', '25 x 25 mm', '10+', 15, {
  profiles: [
    { name: 'Black Guard', profile: {M:5,WS:5,BS:4,S:3,T:3,W:1,I:5,A:1,Ld:9} },
  ],
  eq: ['Hand weapons','dread halberds','full plate armour'],
  sr: ['close_order','elven_reflexes','eternal_hatred','hatred_high_elves',
       'immune_to_psychology','martial_prowess','stubborn'],
  wp: [
    { name: 'Dread halberd', range: 'Combat', S: 'S+1', AP: '-1',
      special_rules: ['Armour Bane (1)','Fight in Extra Rank','Requires Two Hands'],
      notes: 'A model wielding a dread halberd cannot make a supporting attack during a turn in which it charged.' },
  ],
  options: [
    { description: 'Drilled rule', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
    { description: 'Tower Master may purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Tower Master', cost_per_unit: 7 },
    { role: 'standard_bearer', cost_per_unit: 7 },
    { role: 'musician', cost_per_unit: 7 },
  ],
  notes: ['0-1 unit per Dark Elf Noble (Dreadlord or Master) taken.'],
  page: 10,
});

// Har Ganeth Executioners (p11)
unit('har_ganeth_executioners', 'Har Ganeth Executioners', 'infantry', 'special',
  'Regular infantry', '25 x 25 mm', '10+', 15, {
  profiles: [
    { name: 'Executioner', profile: {M:5,WS:5,BS:4,S:4,T:3,W:1,I:5,A:1,Ld:9} },
  ],
  eq: ['Hand weapons','Har Ganeth greatswords','heavy armour'],
  sr: ['close_order','elven_reflexes','hatred_high_elves','murderous','veteran'],
  wp: [
    { name: 'Har Ganeth greatsword', range: 'Combat', S: 'S+2', AP: '-1',
      special_rules: ['Cleaving Blow','Requires Two Hands'] },
  ],
  options: [
    { description: 'Drilled rule', cost: 2, scope: 'per_model', category: 'special' },
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
    { description: 'Draich Master may purchase magic items', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Draich Master', cost_per_unit: 6 },
    { role: 'standard_bearer', cost_per_unit: 6 },
    { role: 'musician', cost_per_unit: 6 },
  ],
  page: 11,
});

// Dark Elf Shades (p11)
unit('dark_elf_shades', 'Dark Elf Shades', 'infantry', 'special',
  'Regular infantry', '25 x 25 mm', '5+', 15, {
  profiles: [
    { name: 'Shade', profile: {M:5,WS:5,BS:5,S:3,T:3,W:1,I:5,A:1,Ld:8} },
  ],
  eq: ['Hand weapons','repeater crossbows'],
  sr: ['elven_reflexes','evasive','hatred_high_elves','move_through_cover','scouts','skirmishers'],
  options: [
    { description: 'Unit weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapons', cost: 1, scope: 'per_model' },
        { description: 'Great weapons', cost: 2, scope: 'per_model' },
      ]},
    { description: 'Light armour', cost: 1, scope: 'per_model', category: 'armour' },
    { description: 'Ambushers rule (0-1 in army)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Chariot Runners rule (0-1 in army)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Veteran rule (0-1 in army)', cost: 1, scope: 'per_model', category: 'special' },
    { description: 'Bloodshade may purchase magic items', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Bloodshade', cost_per_unit: 6 },
  ],
  page: 11,
});

// Witch Elves (p12) — Special by default; Core if Death Hags present (see composition rule)
unit('witch_elves', 'Witch Elves', 'infantry', 'special',
  'Regular infantry', '25 x 25 mm', '10+', 11, {
  profiles: [
    { name: 'Witch Elf', profile: {M:5,WS:4,BS:4,S:3,T:3,W:1,I:5,A:1,Ld:8} },
  ],
  eq: ['Two hand weapons'],
  sr: ['close_order','elven_reflexes','frenzy','hatred_high_elves','horde','loner','murderous','poisoned_attacks'],
  options: [
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Hag', cost_per_unit: 7 },
    { role: 'standard_bearer', cost_per_unit: 7 },
    { role: 'musician', cost_per_unit: 7 },
  ],
  notes: ['If your army includes one or more Death Hags, 0-1 unit of Witch Elves may be taken as a Core choice.'],
  page: 12,
});

// Harpies (p12)
unit('harpies', 'Harpies', 'infantry', 'special',
  'Regular infantry', '25 x 25 mm', '5+', 11, {
  profiles: [
    { name: 'Harpy', profile: {M:5,WS:3,BS:0,S:3,T:3,W:1,I:5,A:2,Ld:6} },
  ],
  eq: ['Claws (counts as hand weapons)'],
  sr: ['fly_10','move_through_cover','scouts','skirmishers','swiftstride'],
  page: 12,
});

// Cold One Knights (p13)
unit('cold_one_knights_de', 'Cold One Knights', 'cavalry', 'special',
  'Heavy cavalry', '30 x 60 mm', '5+', 31, {
  profiles: [
    { name: 'Cold One Knight', profile: {M:7,WS:5,BS:4,S:4,T:4,W:1,I:5,A:1,Ld:9} },
    { name: 'Cold One', profile: {M:7,WS:3,BS:'-',S:4,T:'-',W:'-',I:2,A:2,Ld:'-'}, is_mount: true },
  ],
  eqByModel: {
    rider: ['Hand weapons','lances','heavy armour','shields'],
    mount: ['Claws and teeth (counts as hand weapons)'],
  },
  sr: ['armour_bane_1_cold_one_only','armoured_hide_1','close_order','elven_reflexes',
       'fear','first_charge','hatred_high_elves','stupidity','swiftstride'],
  options: [
    { description: 'Replace heavy armour with full plate armour', cost: 4, scope: 'per_model',
      category: 'armour', replaces: 'heavy armour' },
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
    { description: 'Dread Knight may purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Dread Knight', cost_per_unit: 7 },
    { role: 'standard_bearer', cost_per_unit: 7 },
    { role: 'musician', cost_per_unit: 7 },
  ],
  notes: ['0-1 unit per 1,000 points.'],
  page: 13,
});

// Scourgerunner Chariots (p16) — also character mount for High Beastmaster
unit('scourgerunner_chariots', 'Scourgerunner Chariots', 'cavalry', 'special',
  'Light chariot', '50 x 100 mm', '1-3', 85, {
  av: '5+',
  profiles: [
    { name: 'Scourgerunner Chariot', profile: {M:9,WS:'-',BS:'-',S:4,T:4,W:4,I:'-',A:'-',Ld:'-'} },
    { name: 'Beastmaster Crew (x2)', profile: {M:'-',WS:4,BS:4,S:3,T:'-',W:'-',I:'-',A:4,Ld:8} },
    { name: 'Dark Steed (x2)', profile: {M:9,WS:3,BS:'-',S:3,T:'-',W:'-',I:4,A:1,Ld:'-'}, is_mount: true },
  ],
  eqByModel: {
    crew: ['Hand weapons','cavalry spears','repeater crossbows'],
    mount: ['Hooves (counts as hand weapons)'],
  },
  sr: ['elven_reflexes','hatred_high_elves','impact_hits_d6','open_order','sea_dragon_cloak','swiftstride'],
  wp: [
    { name: 'Ravager harpoon', range: '24"', S: '6', AP: '-3',
      special_rules: ['Cumbersome','Multiple Wounds (D3)','Ponderous'],
      notes: 'During the Shooting phase, one of the Beastmaster Crew may fire this weapon instead of their repeater crossbow.' },
  ],
  notes: ['May also be taken as a character mount for the High Beastmaster (points added to rider\'s total).',
          '0-2 Scourgerunner Chariots or Cold One Chariots (combined) per 1,000 points.'],
  page: 16,
});

// Cold One Chariots (p16) — also character mount for Dark Elf Dreadlord/Master
unit('cold_one_chariots_de', 'Cold One Chariots', 'cavalry', 'special',
  'Heavy chariot', '50 x 100 mm', '1', 125, {
  av: '4+',
  profiles: [
    { name: 'Cold One Chariot', profile: {M:7,WS:'-',BS:'-',S:5,T:5,W:4,I:'-',A:'-',Ld:'-'} },
    { name: 'Knight Charioteer (x2)', profile: {M:'-',WS:5,BS:4,S:4,T:'-',W:'-',I:'-',A:5,Ld:9} },
    { name: 'Cold One (x2)', profile: {M:7,WS:3,BS:'-',S:4,T:'-',W:'-',I:2,A:2,Ld:'-'}, is_mount: true },
  ],
  eqByModel: {
    crew: ['Hand weapons','cavalry spears','repeater crossbows'],
    mount: ['Claws and teeth (counts as hand weapons)'],
  },
  sr: ['armour_bane_1_cold_one_only','close_order','elven_reflexes','fear',
       'first_charge','hatred_high_elves','impact_hits_d6_plus_1','stupidity'],
  notes: ['May also be taken as a character mount for a Dreadlord or Master (points added to rider\'s total).',
          '0-2 Scourgerunner Chariots or Cold One Chariots (combined) per 1,000 points.'],
  page: 16,
});

// ═══════════════════════════════════════════════════════════════════════════
// RARE
// ═══════════════════════════════════════════════════════════════════════════

// Sisters of Slaughter (p12)
unit('sisters_of_slaughter', 'Sisters of Slaughter', 'infantry', 'rare',
  'Regular infantry', '25 x 25 mm', '10+', 17, {
  profiles: [
    { name: 'Sister of Slaughter', profile: {M:5,WS:5,BS:4,S:3,T:3,W:1,I:6,A:2,Ld:9} },
  ],
  eq: ['Hand weapons','lash & buckler'],
  sr: ['dance_of_death','elven_reflexes','hatred_high_elves','impetuous','loner','murderous','open_order'],
  wp: [
    { name: 'Lash & buckler', range: 'Combat', S: 'S', AP: '-1',
      special_rules: ['Armour Bane (1)','Fight in Extra Rank','Requires Two Hands'],
      notes: 'A model equipped with a lash & buckler improves its armour value by 1.' },
  ],
  options: [
    { description: 'Purchase a magic standard', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Hag', cost_per_unit: 7 },
    { role: 'standard_bearer', cost_per_unit: 7 },
    { role: 'musician', cost_per_unit: 7 },
  ],
  notes: ['Dance of Death: if this unit makes a successful charge, the charge target suffers -1 to its Maximum Rank Bonus until the end of the Combat phase of that turn.'],
  page: 12,
});

// Doomfire Warlocks (p14)
unit('doomfire_warlocks', 'Doomfire Warlocks', 'cavalry', 'rare',
  'Light cavalry', '30 x 60 mm', '5+', 22, {
  profiles: [
    { name: 'Doomfire Warlock', profile: {M:9,WS:4,BS:4,S:4,T:3,W:1,I:5,A:1,Ld:8} },
    { name: 'Dark Steed', profile: {M:9,WS:3,BS:'-',S:3,T:'-',W:'-',I:4,A:1,Ld:'-'}, is_mount: true },
  ],
  eqByModel: {
    rider: ['Hand weapons'],
    mount: ['Hooves (counts as hand weapons)'],
  },
  sr: ['cursed_coven','dark_runes','elven_reflexes','fast_cavalry',
       'hatred_high_elves','open_order','poisoned_attacks','swiftstride'],
  options: [
    { description: 'Master (champion) may purchase magic items', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Master', cost_per_unit: 6 },
  ],
  notes: ['0-1 unit per 1,000 points.',
          'Poisoned Attacks applies to Warlocks and Master only, not mounts.',
          'Cursed Coven: unit knows one spell from Dark Magic or Daemonology and may cast it as a Bound spell (Power Level 2 with US 10+ and Master; PL 1 with Master and US 9 or less; PL 0 otherwise).',
          'Dark Runes: 5+ Ward save against wounds caused by non-magical enemy attacks.'],
  page: 14,
});

// Bloodwrack Shrine (p17)
unit('bloodwrack_shrine', 'Bloodwrack Shrine', 'cavalry', 'rare',
  'Heavy chariot', '60 x 100 mm', '1', 175, {
  av: '4+',
  profiles: [
    { name: 'Bloodwrack Shrine', profile: {M:2,WS:'-',BS:'-',S:5,T:5,W:5,I:'-',A:'-',Ld:'-'} },
    { name: 'Shrinekeeper (x2)', profile: {M:'-',WS:4,BS:4,S:3,T:'-',W:'-',I:'-',A:5,Ld:8} },
    { name: 'Bloodwrack Medusa', profile: {M:'-',WS:5,BS:5,S:4,T:'-',W:'-',I:5,A:3,Ld:'-'} },
  ],
  eqByModel: {
    crew: ['Cavalry spears','cavalry spear and petrifying gaze (Medusa)'],
    mount: [],
  },
  sr: ['close_order','dragged_along','elven_reflexes','frenzy','hatred_high_elves',
       'impact_hits_d6_plus_1','large_target','magic_resistance_minus_1','murderous',
       'poisoned_attacks','stony_stare','terror'],
  wp: [
    { name: 'Petrifying gaze', range: '18"', S: '2', AP: 'N/A',
      special_rules: ['Magical Attacks','Multiple Wounds (D3)'],
      notes: 'When making a roll To Wound for an attack made with this weapon, substitute the target\'s Toughness with its Initiative. No armour save is permitted against wounds caused by this weapon (Ward and Regeneration saves can be attempted as normal).' },
  ],
  notes: ['Stony Stare: at the start of each Combat phase, enemy models in base contact must make an Initiative test. If failed, they suffer D3 Strength 2 hits, no armour save permitted.'],
  page: 17,
});

// War Hydra (p20)
unit('war_hydra', 'War Hydra', 'monster', 'rare',
  'Behemoth', '60 x 100 mm (Hydra), 25 x 25 mm (Handlers)', '1', 200, {
  av: '5+',
  profiles: [
    { name: 'War Hydra', profile: {M:6,WS:4,BS:0,S:5,T:5,W:5,I:3,A:2,Ld:6} },
    { name: 'Beastmaster Handlers (x2)', profile: {M:6,WS:4,BS:'-',S:3,T:'-',W:'-',I:4,A:1,Ld:8} },
  ],
  eqByModel: {
    crew: ['Hand weapons','whips'],
    mount: ['Wicked claws','serrated maws','fiery breath'],
  },
  sr: ['close_order','extra_attacks_remaining_wounds','immune_to_psychology',
       'large_target','monster_handlers','regeneration_5plus','stomp_attacks_d3','terror'],
  wp: [
    { name: 'Wicked claws', range: 'Combat', S: 'S', AP: '-2', special_rules: [] },
    { name: 'Serrated maws', range: 'Combat', S: 'S', AP: '-',
      special_rules: ['Armour Bane (1)','Multiple Wounds (2)'],
      notes: 'In combat, this model must make each attack granted by the Extra Attacks (+remaining Wounds) special rule with this weapon.' },
    { name: 'Fiery breath', range: 'N/A', S: '*', AP: '-1',
      special_rules: ['Breath Weapon','Flaming Attacks'],
      notes: 'The Strength characteristic of this weapon is equal to this model\'s remaining Wounds.' },
  ],
  notes: ['If General is a High Beastmaster, may be taken as a Special choice (0-1).'],
  page: 20,
});

// Kharibdyss (p21)
unit('kharibdyss', 'Kharibdyss', 'monster', 'rare',
  'Behemoth', '60 x 100 mm (Kharibdyss), 25 x 25 mm (Handlers)', '1', 195, {
  av: '5+',
  profiles: [
    { name: 'Kharibdyss', profile: {M:6,WS:5,BS:0,S:7,T:5,W:5,I:3,A:5,Ld:6} },
    { name: 'Beastmaster Handlers (x2)', profile: {M:6,WS:4,BS:'-',S:3,T:'-',W:'-',I:4,A:1,Ld:8} },
  ],
  eqByModel: {
    crew: ['Hand weapons','whips'],
    mount: ['Cavernous maw','writhing tentacles'],
  },
  sr: ['abyssal_howl','close_order','immune_to_psychology','large_target',
       'monster_handlers','stomp_attacks_d3_plus_1','terror'],
  wp: [
    { name: 'Cavernous maw', range: 'Combat', S: 'S', AP: '-2',
      special_rules: ['Armour Bane (1)','Killing Blow'],
      notes: 'In combat, this model must make one of its attacks each turn with this weapon.' },
    { name: 'Writhing tentacles', range: 'Combat', S: 'S', AP: '-2',
      special_rules: ['Poisoned Attacks'] },
  ],
  notes: ['If General is a High Beastmaster, may be taken as a Special choice (0-1).',
          'Abyssal Howl: whilst within 6" of this model, enemy units suffer -1 to their Leadership (minimum 2, not cumulative).'],
  page: 21,
});

// Bloodwrack Medusa (standalone, p20)
unit('bloodwrack_medusa', 'Bloodwrack Medusa', 'monster', 'rare',
  'Monstrous creature', '40 x 40 mm', '1', 85, {
  profiles: [
    { name: 'Bloodwrack Medusa', profile: {M:7,WS:5,BS:5,S:4,T:4,W:4,I:5,A:3,Ld:7} },
  ],
  eq: ['Hand weapon','petrifying gaze','light armour'],
  sr: ['close_order','elven_reflexes','fear','frenzy','hatred_high_elves',
       'magic_resistance_minus_1','murderous','poisoned_attacks','stony_stare'],
  wp: [
    { name: 'Petrifying gaze', range: '18"', S: '2', AP: 'N/A',
      special_rules: ['Magical Attacks','Multiple Wounds (D3)'],
      notes: 'When making a roll To Wound for an attack made with this weapon, substitute the target\'s Toughness with its Initiative. No armour save is permitted against wounds caused by this weapon (Ward and Regeneration saves can be attempted as normal).' },
  ],
  notes: ['Stony Stare: at the start of each Combat phase, enemy models in base contact must make an Initiative test. If failed, they suffer D3 Strength 2 hits, no armour save permitted.'],
  page: 20,
});

// Reaper Bolt Thrower (p21)
unit('reaper_bolt_thrower', 'Reaper Bolt Thrower', 'war_machine', 'rare',
  'War machine', '50 x 50 mm (machine), 25 x 25 mm (crew)', '1', 80, {
  profiles: [
    { name: 'Reaper Bolt Thrower', profile: {M:'-',WS:'-',BS:'-',S:6,T:2,W:'-',I:'-',A:'-',Ld:'-'} },
    { name: 'Dark Elf Crew', profile: {M:5,WS:4,BS:4,S:3,T:3,W:2,I:4,A:2,Ld:8} },
  ],
  eqByModel: {
    crew: ['Repeater bolt thrower','hand weapons','light armour'],
    mount: [],
  },
  sr: ['elven_reflexes','hatred_high_elves','skirmishers'],
  notes: ['0-2 per 1,000 points.'],
  page: 21,
});

console.log(`Inserted ${unitSort} units`);

// ═══════════════════════════════════════════════════════════════════════════
// MAGIC ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const insertItem = db.prepare(`INSERT INTO magic_items
  (id, faction_id, name, category, source, points, description, rules_text,
   restrictions, single_use, is_shield, extremely_common, grants_rules,
   weapon_profile, armour_profile, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let itemSort = 0;
function item(id, name, category, points,
              { desc='', rules=null, restrictions=null, singleUse=false, isShield=false,
                extremelyCommon=false, grantsRules=null, wp=null, ap=null } = {}) {
  insertItem.run(
    id, FACTION, name, category, SOURCE, points, desc, rules,
    restrictions, singleUse ? 1 : 0, isShield ? 1 : 0,
    extremelyCommon ? 1 : 0,
    grantsRules ? JSON.stringify(grantsRules) : null,
    wp  ? JSON.stringify(wp)  : null,
    ap  ? JSON.stringify(ap)  : null,
    itemSort++
  );
}

// ── Magic Weapons ─────────────────────────────────────────────────────────────
item('executioners_axe', "Executioner's Axe", 'magic_weapon', 70, {
  desc: 'A single blow from this huge, black-bladed weapon can cut any opponent in half.',
  wp: { name: "Executioner's Axe", range: 'Combat', S: 'S', AP: '-2',
    special_rules: ['Killing Blow','Magical Attacks','Strike Last'],
    notes: 'When making a roll To Wound for a hit caused with the Executioner\'s Axe, a roll of 2+ is always a success, regardless of the target\'s Toughness.' },
});

item('sword_of_ruin_de', 'Sword of Ruin', 'magic_weapon', 65, {
  desc: 'The wickedly sharp edge of the Sword of Ruin can cleave through armour as if it were air.',
  wp: { name: 'Sword of Ruin', range: 'Combat', S: 'S', AP: '*',
    special_rules: ['Magical Attacks'],
    notes: 'No armour, Ward or Regeneration saves are permitted against wounds caused by the Sword of Ruin.' },
});

item('lifetaker_de', 'Lifetaker', 'magic_weapon', 35, {
  desc: 'Finely fashioned from blackest steel, Lifetaker fires bolts dipped in the venom of a Black Dragon.',
  wp: { name: 'Lifetaker', range: '24"', S: '3', AP: '-1',
    special_rules: ['Armour Bane (1)','Magical Attacks','Multiple Shots (D3+1)','Poisoned Attacks'] },
});

item('whip_of_agony', 'Whip of Agony', 'magic_weapon', 30, {
  desc: 'An heirloom of the feared Beastlords of clan Rakarth, the Whip of Agony inflicts enduring torment upon its victims.',
  restrictions: 'High Beastmasters only.',
  wp: { name: 'Whip of Agony', range: 'Combat', S: 'S+1', AP: '-1',
    special_rules: ['Magical Attacks','Strike First'],
    notes: 'Any enemy model that suffers one or more unsaved wounds from the Whip of Agony suffers a -1 modifier to its Toughness characteristic (to a minimum of 1) for the remainder of the game.' },
});

// ── Magic Armour ──────────────────────────────────────────────────────────────
item('shield_of_ghrond', 'Shield of Ghrond', 'magic_armour', 40, {
  desc: 'The Daemon-faced Shield of Ghrond consumes the strength of the enemy\'s attacks.',
  rules: 'This item is a shield. In addition, all attacks directed against its bearer suffer a -1 modifier to their Strength characteristic (to a minimum of 1).',
  isShield: true,
});

item('blood_armour', 'Blood Armour', 'magic_armour', 30, {
  desc: "When anointed with the blood of the foe, this armour becomes ever more endurable.",
  rules: "The Blood Armour is a suit of armour that gives its wearer an armour value of 5+. For each unsaved wound the wearer inflicts, this armour value is improved by 1, to a maximum of 2+.",
  restrictions: "Models whose troop type is 'infantry' or 'cavalry' only.",
});

// ── Talismans ──────────────────────────────────────────────────────────────────
item('pendant_of_khaeleth', 'Pendant of Khaeleth', 'talisman', 40, {
  desc: 'The protection offered by this amulet grows to match the power of an enemy\'s attack.',
  rules: 'The Pendant of Khaeleth gives its bearer a 5+ Ward save against any wounds suffered that were caused by an attack with a Strength of 4 or lower, and a 4+ Ward save against any wounds suffered that were caused by an attack with a Strength of 5 or higher.',
});

item('pearl_of_infinite_bleakness', 'Pearl of Infinite Bleakness', 'talisman', 15, {
  desc: 'Swirled with red and black veins, this magical pearl emits a soul-numbing aura.',
  rules: 'The bearer of the Pearl of Infinite Bleakness and any unit they have joined gains the Immune to Psychology special rule.',
  grantsRules: ['immune_to_psychology'],
});

// ── Enchanted Items ────────────────────────────────────────────────────────────
item('black_dragon_egg', 'Black Dragon Egg', 'enchanted_item', 35, {
  desc: 'When a Black Dragon egg is eaten, the properties of the Dragon are temporarily passed on.',
  rules: 'Single use. During the Command sub-phase of their turn, the bearer of a Black Dragon Egg can consume it. Until the end of that turn, the model has a Toughness characteristic of 6 (which cannot be improved further) and gains noxious breath (see Black Dragon, p.18).',
  singleUse: true,
});

item('hydras_tooth', "Hydra's Tooth", 'enchanted_item', 30, {
  desc: 'Fangs are taken from the maw of a slain Hydra and crafted into deadly throwing weapons.',
  rules: 'This weapon can target a specific model within the target unit, such as a champion or a character.',
  wp: { name: "Hydra's Tooth", range: '9"', S: 'S', AP: '-3',
    special_rules: ['Magical Attacks','Move & Shoot','Quick Shot'] },
});

item('the_guiding_eye', 'The Guiding Eye', 'enchanted_item', 25, {
  desc: 'Set in black iron, this oval ruby grants mystical sight to the wearer.',
  rules: 'Single use. The bearer of the Guiding Eye and any unit they have joined may re-roll any failed rolls To Hit made during the Shooting phase.',
  singleUse: true,
});

// ── Arcane Items ──────────────────────────────────────────────────────────────
item('black_staff_de', 'Black Staff', 'arcane_item', 55, {
  desc: 'A Black Staff is the talisman of the High Mistresses of the Convent of Sorceresses.',
  rules: 'The bearer of the Black Staff may use it when attempting to cast a spell. If they do so, roll an extra D6 when making the Casting roll and discard the lowest result. However, if a double 1 is rolled on any two of the dice rolled, the spell is miscast.',
});

item('focus_familiar_de', 'Focus Familiar', 'arcane_item', 10, {
  desc: 'The Wizard channels their spells through the eyes of an arcane homunculus.',
  rules: 'Single use. Place a marker completely within 12" of the owner. The range and all effects of the spell are measured from this marker, rather than from the owner. If the spell requires a line of sight, this is determined from the marker (which has a 360° vision arc).',
  singleUse: true,
  extremelyCommon: true,
});

item('tome_of_furion', 'Tome of Furion', 'arcane_item', 15, {
  desc: 'Furion of Clar Karond inscribed his knowledge onto sheets of flayed skin.',
  rules: 'The bearer of the Tome of Furion knows one more spell (chosen in the usual way) than is normal for their Level of Wizardry.',
});

// ── Magic Standards ────────────────────────────────────────────────────────────
item('banner_of_nagarythe', 'Banner of Nagarythe', 'magic_standard', 65, {
  desc: 'The personal banner of the Dread-King proclaims his reign over the Elven Kingdoms.',
  rules: 'A unit carrying the Banner of Nagarythe gains the Stubborn special rule. In addition, when calculating its combat result, the unit may claim an additional bonus of +1 combat result point.',
  grantsRules: ['stubborn'],
});

item('standard_of_slaughter', 'Standard of Slaughter', 'magic_standard', 40, {
  desc: 'Anointed with the blood of an Ulthuan Elf, this banner exudes a sense of bitter determination.',
  rules: 'When calculating its combat result during a turn in which it charged, a unit carrying the Standard of Slaughter may claim an additional bonus of +D3 combat result points.',
});

item('banner_of_har_ganeth', 'Banner of Har Ganeth', 'magic_standard', 25, {
  desc: 'Under the influence of this ancient banner, warriors strike with deadly precision.',
  rules: 'A unit carrying the Banner of Har Ganeth improves the Armour Piercing characteristic of its combat weapons by 1.',
});

item('cold_blooded_banner', 'Cold-Blooded Banner', 'magic_standard', 20, {
  desc: 'Those that march beneath this Cold One blood-soaked banner display a steely discipline.',
  rules: 'Single use. A unit carrying the Cold-Blooded Banner may use it when making any test against its Leadership characteristic, including a Break test. When it does, it may roll an extra D6 and discard the highest result.',
  singleUse: true,
});

console.log(`Inserted ${itemSort} magic items`);

// ═══════════════════════════════════════════════════════════════════════════
// LORE OF NAGGAROTH
// ═══════════════════════════════════════════════════════════════════════════

// Add lore entry (the spells are bonus replacements, not a standalone lore)
db.prepare(`INSERT INTO lores (lore_key, faction_id, name, sort_order) VALUES (?, ?, ?, ?)`)
  .run('lore_of_naggaroth', FACTION, 'Lore of Naggaroth', 1);

const insertSpell = db.prepare(`INSERT INTO spells
  (id, faction_id, lore_key, name, type, casting_value, range, effect, is_signature, remains_in_play, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let spellSort = 0;
function spell(id, name, type, castingValue, range, effect, { isSig=false, rip=false } = {}) {
  insertSpell.run(
    id, FACTION, 'lore_of_naggaroth', name, type, castingValue, range, effect,
    isSig ? 1 : 0, rip ? 1 : 0, spellSort++
  );
}

// A Wizard with 'Lore of Naggaroth' may discard a randomly generated spell and
// choose either the signature spell of their chosen Lore, or one of these:
spell('cursing_word', 'Cursing Word', 'Hex', '9+', '12"',
  'Remains in play. The target enemy unit suffers a -1 modifier to either its Weapon Skill or its Ballistic Skill characteristic (chosen by the casting Wizard\'s controlling player, to a minimum of 1). If this spell is cast, the effects of any other Hex previously cast on the target unit immediately expire.',
  { rip: true });

spell('black_horror', 'Black Horror', 'Magical Vortex', '9+', '18"',
  'Remains in play. Place a large (5") blast template so that its central hole is within 18" of the caster. Whilst in play, the template is treated as dangerous terrain. The template moves 2D6" in a random direction during every Start of Turn sub-phase. Any enemy unit the moving template touches or moves over must immediately make D6 Strength tests. For each test that is failed, the unit loses a single Wound.',
  { rip: true });

console.log(`Inserted ${spellSort} Lore of Naggaroth spells`);

// ── Verification ─────────────────────────────────────────────────────────────
console.log('\n── Verification ──');
const unitCount = db.prepare("SELECT COUNT(*) AS n FROM units WHERE faction_id = ?").get(FACTION).n;
const itemCount = db.prepare("SELECT COUNT(*) AS n FROM magic_items WHERE faction_id = ?").get(FACTION).n;
const spellCount = db.prepare("SELECT COUNT(*) AS n FROM spells WHERE faction_id = ?").get(FACTION).n;
const ruleCount = db.prepare("SELECT COUNT(*) AS n FROM composition_rules WHERE faction_id = ?").get(FACTION).n;
console.log(`Units: ${unitCount} | Items: ${itemCount} | Spells: ${spellCount} | Composition rules: ${ruleCount}`);

console.log('\nDone. Run: npm run db:export');
