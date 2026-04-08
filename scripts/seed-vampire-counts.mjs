/**
 * Seeds the Vampire Counts Legends Army List into the DB.
 * Source: warhammertheoldworld_legends_vampirecounts_eng_24.09
 *
 * Usage: node scripts/seed-vampire-counts.mjs
 * After running: npm run db:export
 */

import Database from 'better-sqlite3';
const db = new Database('db/battlestandard.sqlite');

const FACTION = 'vampire-counts';
const SOURCE = 'legends';

// ── Clean existing data for idempotency ───────────────────────────────────────
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
  'Vampire Counts',
  SOURCE,
  JSON.stringify(['Vampire Counts Legacy Army List']),
  JSON.stringify({
    _key_order: [
      'id','name','sources','army_compositions','units',
      'vampiric_powers','magic_items','lore_of_undeath',
    ],
  })
);

// ── Army Composition ──────────────────────────────────────────────────────────
db.prepare(`INSERT INTO army_compositions (id, faction_id, name, source, sort_order) VALUES (?, ?, ?, ?, ?)`).run(
  'grand_army_vc', FACTION, 'Vampire Counts — Grand Army', SOURCE, 0
);

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

const COMP = 'grand_army_vc';
rule(COMP, 'characters', 'max_percent', 50, null, null, null,
  '1+ Wizard; 0-1 Vampire Count/Master Necromancer/Strigoi Ghoul King per 1,000 pts; 0-1 Wight King/Tomb Banshee per 1,000 pts; Vampire Thralls, Necromantic Acolytes, Wight Lords and Cairn Wraiths as desired');
rule(COMP, 'characters', 'max_per_1000_pts', 1,
  ['vampire_count','master_necromancer','strigoi_ghoul_king'], null, null,
  '0-1 Vampire Count, Master Necromancer or Strigoi Ghoul King per 1,000 pts');
rule(COMP, 'characters', 'max_per_1000_pts', 1,
  ['wight_king','tomb_banshee'], null, null,
  '0-1 Wight King or Banshee per 1,000 pts');
rule(COMP, 'core', 'min_percent', 25, null, null, null,
  'Skeleton Warriors, Zombies, Crypt Ghouls, Bat Swarms and Dire Wolves; If army includes 1+ Wights, 0-1 unit of Grave Guard or Black Knights may be taken as a Core choice');
rule(COMP, 'core', 'max_per_character', 1,
  ['grave_guard','black_knights_vc'], ['wight_king','wight_lord'], null,
  '0-1 unit of Grave Guard or Black Knights as a Core choice per Wight King or Wight Lord in the army');
rule(COMP, 'special', 'max_percent', 50, null, null, null,
  '0-1 Grave Guard/Black Knights per 1,000 pts; 0-1 Crypt Horrors/Fell Bats per 1,000 pts; 0-3 Corpse Carts; 0-1 Spirit Hosts per Cairn Wraith or Tomb Banshee taken');
rule(COMP, 'special', 'max_per_1000_pts', 1,
  ['grave_guard'], null, null, '0-1 unit of Grave Guard per 1,000 pts');
rule(COMP, 'special', 'max_per_1000_pts', 1,
  ['black_knights_vc'], null, null, '0-1 unit of Black Knights per 1,000 pts');
rule(COMP, 'special', 'max_per_1000_pts', 1,
  ['crypt_horrors','fell_bats'], null, null, '0-1 unit of Crypt Horrors or Fell Bats per 1,000 pts');
rule(COMP, 'special', 'max_count', 3,
  ['corpse_cart'], null, null, '0-3 Corpse Carts');
rule(COMP, 'special', 'max_per_character', 1,
  ['spirit_hosts'], ['cairn_wraith','tomb_banshee'], null,
  '0-1 unit of Spirit Hosts per Cairn Wraith or Tomb Banshee taken');
rule(COMP, 'special', 'conditional', 1,
  ['vargheists'], null, ['strigoi_ghoul_king'],
  'If your General is a Strigoi Ghoul King, 0-1 unit of Vargheists may be taken as a Special choice');
rule(COMP, 'special', 'conditional', 1,
  ['terrorgheist'], null, ['strigoi_ghoul_king'],
  'If your General is a Strigoi Ghoul King, 0-1 Terrorgheist may be taken as a Special choice');
rule(COMP, 'rare', 'max_percent', 25, null, null, null,
  '0-1 Vargheists per 1,000 pts; 0-2 Black Coaches; 0-1 Terrorgheist or Varghulf per 1,000 pts; 0-1 Blood Knights per 1,000 pts; 0-1 Hexwraiths per Cairn Wraith or Tomb Banshee taken');
rule(COMP, 'rare', 'max_per_1000_pts', 1,
  ['vargheists'], null, null, '0-1 unit of Vargheists per 1,000 pts');
rule(COMP, 'rare', 'max_count', 2,
  ['black_coach'], null, null, '0-2 Black Coaches');
rule(COMP, 'rare', 'max_per_1000_pts', 1,
  ['terrorgheist','varghulf'], null, null, '0-1 Terrorgheist or Varghulf per 1,000 pts');
rule(COMP, 'rare', 'max_per_1000_pts', 1,
  ['blood_knights'], null, null, '0-1 unit of Blood Knights per 1,000 pts');
rule(COMP, 'rare', 'max_per_character', 1,
  ['hexwraiths'], ['cairn_wraith','tomb_banshee'], null,
  '0-1 unit of Hexwraiths per Cairn Wraith or Tomb Banshee taken');

// ── Unit insertion helpers ────────────────────────────────────────────────────
const insertUnit = db.prepare(`INSERT INTO units
  (id, faction_id, name, source, category, list_category, troop_type, base_size, unit_size,
   points, stats, profiles, equipment, equipment_by_model, special_rules, options, command,
   weapon_profiles, magic, notes, is_named_character, source_page, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let unitSort = 0;
function unit(id, name, category, listCat, troopType, baseSize, unitSize, points,
              { stats=null, profiles=null, equipment=null, equipByModel=null,
                sr=[], options=null, command=null, weaponProfiles=null,
                magic=null, notes=null, isNamed=false, page=null } = {}) {
  insertUnit.run(
    id, FACTION, name, SOURCE, category, listCat, troopType, baseSize, unitSize, points,
    stats   ? JSON.stringify(stats)   : null,
    profiles? JSON.stringify(profiles): null,
    equipment && typeof equipment === 'object' && !Array.isArray(equipment)
      ? JSON.stringify(equipment) : (equipment ? JSON.stringify(equipment) : JSON.stringify([])),
    equipByModel ? JSON.stringify(equipByModel) : null,
    JSON.stringify(sr),
    options ? JSON.stringify(options) : null,
    command ? JSON.stringify(command) : null,
    weaponProfiles ? JSON.stringify(weaponProfiles) : null,
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

// Vampire Count
unit('vampire_count', 'Vampire Count', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 160, {
  stats: {M:6,WS:7,BS:5,S:5,T:5,W:3,I:6,A:4,Ld:8},
  equipment: ['Hand weapon'],
  sr: ['dark_vitality','flammable','indomitable_2','lore_of_undeath','necromantic_undead','regeneration_5plus'],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapon', cost: 3, scope: 'per_unit' },
        { description: 'Great weapon', cost: 4, scope: 'per_unit' },
        { description: 'Lance (if appropriately mounted)', cost: 4, scope: 'per_unit' },
      ]},
    { description: 'Shield', cost: 2, scope: 'per_unit', category: 'armour' },
    { description: 'Armour upgrade', cost: 0, scope: 'per_unit', category: 'armour',
      choices: [
        { description: 'Light armour', cost: 3, scope: 'per_unit' },
        { description: 'Heavy armour', cost: 6, scope: 'per_unit' },
      ]},
    { description: 'Mount upgrade', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Nightmare', cost: 16, scope: 'per_unit' },
        { description: 'Coven Throne (see p.16)', cost: 210, scope: 'per_unit' },
        { description: 'Abyssal Terror (see p.22)', cost: 120, scope: 'per_unit' },
        { description: 'Zombie Dragon (see p.20)', cost: 215, scope: 'per_unit' },
      ]},
    { description: 'Wizard upgrade', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Level 1 Wizard', cost: 30, scope: 'per_unit' },
        { description: 'Level 2 Wizard', cost: 60, scope: 'per_unit' },
      ]},
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
    { description: 'Take Vampiric Powers', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  magic: { wizard_level: 0, lores: ['dark_magic', 'illusion', 'necromancy'] },
  page: 3,
});

// Vampire Thrall
unit('vampire_thrall', 'Vampire Thrall', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 75, {
  stats: {M:6,WS:6,BS:4,S:5,T:4,W:2,I:5,A:3,Ld:7},
  equipment: ['Hand weapon'],
  sr: ['banner_of_the_count','dark_vitality','flammable','indomitable_1','lore_of_undeath','necromantic_undead','regeneration_5plus'],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapon', cost: 3, scope: 'per_unit' },
        { description: 'Great weapon', cost: 4, scope: 'per_unit' },
        { description: 'Lance (if appropriately mounted)', cost: 4, scope: 'per_unit' },
      ]},
    { description: 'Shield', cost: 2, scope: 'per_unit', category: 'armour' },
    { description: 'Armour upgrade', cost: 0, scope: 'per_unit', category: 'armour',
      choices: [
        { description: 'Light armour', cost: 3, scope: 'per_unit' },
        { description: 'Heavy armour', cost: 6, scope: 'per_unit' },
      ]},
    { description: 'Mount (Nightmare)', cost: 16, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Nightmare', cost: 16, scope: 'per_unit' },
        { description: 'Coven Throne (see p.16)', cost: 210, scope: 'per_unit' },
      ]},
    { description: 'Level 1 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
    { description: 'Take Vampiric Powers', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  magic: { wizard_level: 0, lores: ['dark_magic', 'illusion', 'necromancy'] },
  page: 3,
});

// Master Necromancer
unit('master_necromancer', 'Master Necromancer', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 130, {
  stats: {M:4,WS:3,BS:3,S:3,T:4,W:3,I:3,A:2,Ld:8},
  equipment: ['Hand weapon'],
  sr: ['dark_vitality','indomitable_1','invocation_of_nehek','lore_of_undeath','necromantic_undead','regeneration_5plus'],
  options: [
    { description: 'Mount upgrade', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Nightmare', cost: 16, scope: 'per_unit' },
        { description: 'Mortis Engine (see p.17)', cost: 195, scope: 'per_unit' },
        { description: 'Abyssal Terror (see p.22)', cost: 120, scope: 'per_unit' },
        { description: 'Zombie Dragon (see p.20)', cost: 215, scope: 'per_unit' },
      ]},
    { description: 'Level 4 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  magic: { wizard_level: 3, lores: ['dark_magic', 'illusion', 'necromancy'] },
  page: 5,
});

// Necromantic Acolyte
unit('necromantic_acolyte', 'Necromantic Acolyte', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 60, {
  stats: {M:4,WS:3,BS:3,S:3,T:3,W:2,I:3,A:1,Ld:7},
  equipment: ['Hand weapon'],
  sr: ['dark_vitality','indomitable_1','invocation_of_nehek','lore_of_undeath','necromantic_undead','regeneration_5plus'],
  options: [
    { description: 'Mount upgrade', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Nightmare', cost: 16, scope: 'per_unit' },
        { description: 'Mortis Engine (see p.17)', cost: 195, scope: 'per_unit' },
      ]},
    { description: 'Level 2 Wizard', cost: 30, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  magic: { wizard_level: 1, lores: ['dark_magic', 'illusion', 'necromancy'] },
  page: 5,
});

// Strigoi Ghoul King
unit('strigoi_ghoul_king', 'Strigoi Ghoul King', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 145, {
  stats: {M:6,WS:6,BS:3,S:5,T:5,W:3,I:7,A:5,Ld:8},
  equipment: ['Hand weapon'],
  sr: ['dark_vitality','flammable','hatred_all_enemies','indomitable_1','lore_of_undeath','necromantic_undead','poisoned_attacks','regeneration_5plus','the_hunger'],
  options: [
    { description: 'Mount (Terrorgheist — see p.21)', cost: 185, scope: 'per_unit', category: 'special' },
    { description: 'Wizard upgrade', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Level 1 Wizard', cost: 30, scope: 'per_unit' },
        { description: 'Level 2 Wizard', cost: 60, scope: 'per_unit' },
      ]},
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 75, category: 'special' },
    { description: 'Take Vampiric Powers', cost: 0, scope: 'per_unit', max_points: 75, category: 'special' },
  ],
  magic: { wizard_level: 0, lores: ['battle_magic', 'dark_magic', 'necromancy'] },
  page: 6,
});

// Cairn Wraith
unit('cairn_wraith', 'Cairn Wraith', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 50, {
  stats: {M:6,WS:4,BS:0,S:3,T:3,W:3,I:2,A:2,Ld:6},
  equipment: ['Spectral scythe'],
  sr: ['ethereal','indomitable_1','necromantic_undead','regeneration_6plus','terror'],
  weaponProfiles: [
    { name: 'Spectral scythe', range: 'Combat', S: 'S', AP: 'N/A',
      special_rules: ['magical_attacks','multiple_wounds_d3'],
      notes: 'No armour save is permitted against wounds caused by this weapon (Ward and Regeneration saves can be attempted as normal).' },
  ],
  page: 6,
});

// Wight King
unit('wight_king', 'Wight King', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 85, {
  stats: {M:4,WS:5,BS:0,S:5,T:5,W:3,I:4,A:3,Ld:9},
  equipment: ['Hand weapon', 'Heavy armour'],
  sr: ['indomitable_1','killing_blow','necromantic_undead','regeneration_5plus'],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapon', cost: 3, scope: 'per_unit' },
        { description: 'Great weapon', cost: 4, scope: 'per_unit' },
        { description: 'Lance (if appropriately mounted)', cost: 4, scope: 'per_unit' },
      ]},
    { description: 'Shield', cost: 2, scope: 'per_unit', category: 'armour' },
    { description: 'Mount (Skeletal Steed)', cost: 14, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 100, category: 'special' },
  ],
  page: 7,
});

// Wight Lord
unit('wight_lord', 'Wight Lord', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 40, {
  stats: {M:4,WS:4,BS:0,S:5,T:4,W:2,I:4,A:2,Ld:8},
  equipment: ['Hand weapon', 'Heavy armour'],
  sr: ['killing_blow','necromantic_undead','regeneration_6plus','wight_banner'],
  options: [
    { description: 'Weapon upgrade', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Additional hand weapon', cost: 3, scope: 'per_unit' },
        { description: 'Great weapon', cost: 4, scope: 'per_unit' },
        { description: 'Lance (if appropriately mounted)', cost: 4, scope: 'per_unit' },
      ]},
    { description: 'Shield', cost: 2, scope: 'per_unit', category: 'armour' },
    { description: 'Mount (Skeletal Steed)', cost: 14, scope: 'per_unit', category: 'special' },
    { description: 'Purchase magic items', cost: 0, scope: 'per_unit', max_points: 50, category: 'special' },
  ],
  page: 7,
});

// Tomb Banshee
unit('tomb_banshee', 'Tomb Banshee', 'character', 'characters',
  'Regular infantry (character)', '25 x 25 mm', '1', 90, {
  stats: {M:6,WS:3,BS:0,S:3,T:3,W:2,I:3,A:1,Ld:6},
  equipment: ['Hand weapon'],
  sr: ['ethereal','indomitable_1','magical_attacks','necromantic_undead','regeneration_6plus','terror','wailing_dirge'],
  page: 7,
});

// ── Character Mounts ──────────────────────────────────────────────────────────

// Skeletal Steed (mount for Wight King/Lord)
unit('skeletal_steed_vc', 'Skeletal Steed', 'mount', null,
  'Heavy cavalry', '30 x 60 mm', '1', 14, {
  stats: {M:7,WS:2,BS:'-',S:3,T:'-',W:'-',I:2,A:1,Ld:'-'},
  equipment: ['Skeletal hooves (counts as a hand weapon)', 'Barding'],
  sr: ['first_charge','necromantic_undead','swiftstride'],
  page: 8,
});

// Nightmare (mount for Vampires and Necromancers)
unit('nightmare_vc', 'Nightmare', 'mount', null,
  'Heavy cavalry', '30 x 60 mm', '1', 16, {
  stats: {M:7,WS:3,BS:'-',S:4,T:'-',W:'-',I:2,A:1,Ld:'-'},
  equipment: ['Iron-shod hooves (counts as a hand weapon)', 'Barding'],
  sr: ['counter_charge','first_charge','necromantic_undead','swiftstride'],
  page: 8,
});

// Coven Throne (mount for Vampire Count/Thrall)
unit('coven_throne', 'Coven Throne', 'mount', null,
  'Heavy chariot', '50 x 100 mm', '1', 210, {
  profiles: [
    { name: 'Coven Throne', profile: {M:'-',WS:'-',BS:'-',S:5,T:5,W:5,I:'-',A:'-',Ld:'-'} },
    { name: 'Pallid Handmaidens (×2)', profile: {M:'-',WS:5,BS:3,S:'-',T:'-',W:'-',I:5,A:2,Ld:7} },
    { name: 'Spirit Horde', is_mount: true, profile: {M:6,WS:3,BS:0,S:3,T:'-',W:'-',I:1,A:'D6',Ld:'-'} },
  ],
  equipment: { crew: ['Hand weapons'], mount: ['Hand weapons', 'Lances'] },
  sr: ['close_order','dark_vitality','first_charge','fly_8','ghoulish_glamour','impact_hits_d6plus1','large_target','necromantic_undead','random_attacks','regeneration_6plus','scrying_pool'],
  notes: ['Armour Value 4+. Character Mount only — points added to rider.', 'Random Attacks applies to Spirit Horde only.'],
  page: 16,
});

// Mortis Engine (mount for Master Necromancer/Necromantic Acolyte)
unit('mortis_engine', 'Mortis Engine', 'mount', null,
  'Heavy chariot', '50 x 100 mm', '1', 195, {
  profiles: [
    { name: 'Mortis Engine', profile: {M:'-',WS:'-',BS:'-',S:5,T:5,W:5,I:'-',A:'-',Ld:'-'} },
    { name: 'Banshees (×3)', profile: {M:'-',WS:3,BS:0,S:3,T:'-',W:'-',I:'-',A:1,Ld:5} },
    { name: 'Spirit Horde', is_mount: true, profile: {M:6,WS:3,BS:0,S:3,T:'-',W:'-',I:1,A:'D6',Ld:'-'} },
  ],
  equipment: { crew: ['Hand weapons'], mount: ['Hand weapons', 'Lances'] },
  sr: ['accursed_reliquary','blasphemous_tome','close_order','dark_vitality','first_charge','fly_8','impact_hits_d6plus1','large_target','necromantic_undead','random_attacks','regeneration_6plus','wailing_dirge'],
  notes: ['Armour Value 4+. Character Mount only — points added to rider.', 'Random Attacks applies to Spirit Horde only.'],
  page: 17,
});

// Abyssal Terror (mount for Vampire Count and Master Necromancer)
unit('abyssal_terror', 'Abyssal Terror', 'mount', null,
  'Monstrous creature', '50 x 100 mm', '1', 120, {
  profiles: [
    { name: 'Abyssal Terror', profile: {M:6,WS:4,BS:'-',S:5,T:'(+1)',W:'(+4)',I:2,A:3,Ld:'-'},
      mount_grants: '+1 Toughness and +4 Wounds to rider' },
  ],
  equipment: ['Wicked claws', 'Poisonous tail', 'Scaly skin (counts as heavy armour)'],
  sr: ['close_order','fly_9','large_target','necromantic_undead','stomp_attacks_d3','swiftstride','terror'],
  weaponProfiles: [
    { name: 'Wicked claws', range: 'Combat', S: 'S', AP: '-2', special_rules: [] },
    { name: 'Poisonous tail', range: 'Combat', S: 'S', AP: '-', special_rules: ['poisoned_attacks','strike_first'],
      notes: 'This model may make one of its attacks each turn with this weapon.' },
  ],
  notes: ['Character Mount only — points added to rider.'],
  page: 22,
});

// Zombie Dragon (mount for Vampire Count and Master Necromancer)
unit('zombie_dragon_vc', 'Zombie Dragon', 'mount', null,
  'Behemoth', '100 x 150 mm', '1', 215, {
  profiles: [
    { name: 'Zombie Dragon', profile: {M:6,WS:4,BS:'-',S:6,T:'(+1)',W:'(+5)',I:2,A:5,Ld:'-'},
      mount_grants: '+1 Toughness and +5 Wounds to rider' },
  ],
  equipment: ['Wicked claws', 'Pestilential breath', 'Draconic scales (counts as full plate armour)'],
  sr: ['carrion_feeders','close_order','fly_9','large_target','necromantic_undead','stomp_attacks_d6','swiftstride','terror'],
  weaponProfiles: [
    { name: 'Wicked claws', range: 'Combat', S: 'S', AP: '-2', special_rules: [] },
    { name: 'Pestilential breath', range: 'N/A', S: '2', AP: '-3', special_rules: ['breath_weapon'] },
  ],
  notes: ['Character Mount only — points added to rider.'],
  page: 20,
});

// ═══════════════════════════════════════════════════════════════════════════
// CORE
// ═══════════════════════════════════════════════════════════════════════════

// Skeleton Warriors
unit('skeleton_warriors', 'Skeleton Warriors', 'infantry', 'core',
  'Regular infantry', '25 x 25 mm', '10+', 5, {
  profiles: [
    { name: 'Skeleton Warrior', profile: {M:4,WS:2,BS:2,S:3,T:3,W:1,I:2,A:1,Ld:5} },
    { name: 'Skeleton Champion', is_champion: true, champion_cost: 5, profile: {M:4,WS:2,BS:2,S:3,T:3,W:1,I:2,A:2,Ld:5} },
  ],
  equipment: ['Hand weapons', 'Light armour', 'Shields'],
  sr: ['close_order','horde','necromantic_undead','regeneration_6plus'],
  options: [
    { description: 'Thrusting spears', cost: 1, scope: 'per_model', category: 'weapon' },
  ],
  command: [
    { role: 'champion', name: 'Skeleton Champion', cost_per_unit: 5 },
    { role: 'standard_bearer', cost_per_unit: 5 },
    { role: 'musician', cost_per_unit: 5 },
  ],
  magic_standard: 50,
  page: 10,
});

// Zombies
unit('zombies', 'Zombies', 'infantry', 'core',
  'Regular infantry', '25 x 25 mm', '20-40', 3, {
  stats: {M:4,WS:2,BS:0,S:3,T:3,W:1,I:1,A:1,Ld:2},
  equipment: ['Hand weapons'],
  sr: ['close_order','horde','necromantic_undead','regeneration_6plus','the_newly_dead'],
  command: [
    { role: 'standard_bearer', cost_per_unit: 5 },
    { role: 'musician', cost_per_unit: 5 },
  ],
  page: 10,
});

// Crypt Ghouls
unit('crypt_ghouls', 'Crypt Ghouls', 'infantry', 'core',
  'Regular infantry', '25 x 25 mm', '10+', 9, {
  profiles: [
    { name: 'Crypt Ghoul', profile: {M:5,WS:3,BS:3,S:3,T:4,W:1,I:3,A:2,Ld:5} },
    { name: 'Crypt Ghast', is_champion: true, champion_cost: 6, profile: {M:5,WS:3,BS:3,S:4,T:4,W:1,I:3,A:3,Ld:5} },
  ],
  equipment: ['Hand weapons'],
  sr: ['move_through_cover','necromantic_undead','open_order','poisoned_attacks','regeneration_6plus','reserve_move','skirmishers'],
  command: [
    { role: 'champion', name: 'Crypt Ghast', cost_per_unit: 6 },
  ],
  page: 11,
});

// Bat Swarms
unit('bat_swarms', 'Bat Swarms', 'infantry', 'core',
  'Swarms', '40 x 40 mm', '3+', 39, {
  stats: {M:1,WS:3,BS:0,S:2,T:2,W:5,I:4,A:5,Ld:3},
  equipment: ['Claws and fangs (counts as a hand weapon)'],
  sr: ['fly_7','necromantic_undead','regeneration_6plus','skirmishers'],
  page: 11,
});

// Dire Wolves
unit('dire_wolves', 'Dire Wolves', 'cavalry', 'core',
  'War beasts', '25 x 50 mm', '5-20', 8, {
  profiles: [
    { name: 'Dire Wolf', profile: {M:9,WS:3,BS:0,S:3,T:3,W:1,I:3,A:1,Ld:3} },
    { name: 'Doom Wolf', is_champion: true, champion_cost: 6, profile: {M:9,WS:3,BS:0,S:3,T:3,W:1,I:3,A:2,Ld:3} },
  ],
  equipment: ['Claws and fangs (counts as hand weapons)'],
  sr: ['necromantic_undead','open_order','regeneration_6plus','reserve_move','slavering_charge','swiftstride','vanguard'],
  command: [
    { role: 'champion', name: 'Doom Wolf', cost_per_unit: 6 },
  ],
  page: 14,
});

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL
// ═══════════════════════════════════════════════════════════════════════════

// Grave Guard
unit('grave_guard', 'Grave Guard', 'infantry', 'special',
  'Heavy infantry', '25 x 25 mm', '10+', 11, {
  profiles: [
    { name: 'Grave Guard', profile: {M:4,WS:3,BS:3,S:4,T:4,W:1,I:3,A:1,Ld:7} },
    { name: 'Seneschal', is_champion: true, champion_cost: 6, profile: {M:4,WS:3,BS:3,S:4,T:4,W:1,I:3,A:2,Ld:7} },
  ],
  equipment: ['Hand weapons', 'Heavy armour', 'Shields'],
  sr: ['cleaving_blow','close_order','indomitable_1','necromantic_undead','regeneration_6plus'],
  options: [
    { description: 'Replace shields with great weapons', cost: 1, scope: 'per_model', category: 'weapon' },
    { description: 'Drilled (0-1 per 1,000 pts)', cost: 2, scope: 'per_model', category: 'special', max_per_1000_pts: 1 },
    { description: 'Implacable Defence (0-1 per 1,000 pts)', cost: 1, scope: 'per_model', category: 'special', max_per_1000_pts: 1 },
    { description: 'Seneschal: Purchase magic items', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Seneschal', cost_per_unit: 6 },
    { role: 'standard_bearer', cost_per_unit: 6 },
    { role: 'musician', cost_per_unit: 6 },
  ],
  magic_standard: 50,
  page: 9,
});

// Crypt Horrors
unit('crypt_horrors', 'Crypt Horrors', 'infantry', 'special',
  'Monstrous infantry', '40 x 40 mm', '3+', 46, {
  profiles: [
    { name: 'Crypt Horror', profile: {M:6,WS:3,BS:0,S:4,T:5,W:3,I:2,A:3,Ld:5} },
    { name: 'Crypt Haunter', is_champion: true, champion_cost: 7, profile: {M:6,WS:3,BS:0,S:4,T:5,W:3,I:2,A:4,Ld:5} },
  ],
  equipment: ['Filth-encrusted claws'],
  sr: ['indomitable_1','move_through_cover','necromantic_undead','open_order','regeneration_6plus','stomp_attacks_1'],
  weaponProfiles: [
    { name: 'Filth-encrusted claws', range: 'Combat', S: 'S', AP: '-1', special_rules: ['poisoned_attacks'] },
  ],
  command: [
    { role: 'champion', name: 'Crypt Haunter', cost_per_unit: 7 },
  ],
  page: 11,
});

// Fell Bats
unit('fell_bats', 'Fell Bats', 'infantry', 'special',
  'Monstrous infantry', '40 x 40 mm', '3+', 15, {
  stats: {M:1,WS:3,BS:0,S:3,T:3,W:2,I:3,A:2,Ld:3},
  equipment: ['Claws and fangs (counts as a hand weapon)'],
  sr: ['fly_10','necromantic_undead','regeneration_6plus','skirmishers','swiftstride'],
  page: 12,
});

// Spirit Hosts
unit('spirit_hosts', 'Spirit Hosts', 'infantry', 'special',
  'Swarms', '40 x 40 mm', '3-6', 49, {
  stats: {M:6,WS:3,BS:0,S:3,T:3,W:4,I:1,A:4,Ld:4},
  equipment: ['Hand weapons'],
  sr: ['bound_spirits','ethereal','magical_attacks','necromantic_undead','open_order','regeneration_6plus','reserve_move'],
  page: 12,
});

// Corpse Cart
unit('corpse_cart', 'Corpse Cart', 'war_machine', 'special',
  'Heavy chariot', '50 x 100 mm', '1', 115, {
  profiles: [
    { name: 'Corpse Cart', profile: {M:'-',WS:'-',BS:'-',S:4,T:4,W:4,I:'-',A:'-',Ld:'-'} },
    { name: 'Corpsemaster', profile: {M:'-',WS:3,BS:0,S:3,T:'-',W:'-',I:'-',A:3,Ld:1} },
    { name: 'The Restless Dead', is_mount: true, profile: {M:4,WS:1,BS:0,S:3,T:'-',W:'-',I:1,A:'2D6',Ld:'-'} },
  ],
  equipment: { crew: ['Hand weapon'], mount: ['Hand weapons'] },
  sr: ['close_order','dark_vitality','first_charge','impact_hits_d3plus1','indomitable_1','lore_of_undeath','necromantic_undead','random_attacks','regeneration_6plus'],
  options: [
    { description: 'Corpsemaster weapon', cost: 0, scope: 'per_unit', category: 'weapon',
      choices: [
        { description: 'Whip', cost: 3, scope: 'per_unit' },
        { description: 'Cavalry spear', cost: 3, scope: 'per_unit' },
      ]},
    { description: 'Corpse Cart upgrade', cost: 0, scope: 'per_unit', category: 'special',
      choices: [
        { description: 'Balefire Brazier', cost: 10, scope: 'per_unit' },
        { description: 'Warped Tintinnabulation', cost: 15, scope: 'per_unit' },
      ]},
  ],
  magic: { wizard_level: 1, lores: ['necromancy'] },
  notes: ['Armour Value 4+. Random Attacks applies to The Restless Dead only.', 'Corpse Cart must take one of: Balefire Brazier or Warped Tintinnabulation.'],
  page: 18,
});

// Vargheists
unit('vargheists', 'Vargheists', 'infantry', 'rare',
  'Monstrous infantry', '40 x 40 mm', '3+', 61, {
  profiles: [
    { name: 'Vargheist', profile: {M:6,WS:4,BS:0,S:5,T:4,W:3,I:4,A:3,Ld:7} },
    { name: 'Vargoyle', is_champion: true, champion_cost: 7, profile: {M:6,WS:4,BS:0,S:5,T:4,W:3,I:4,A:4,Ld:7} },
  ],
  equipment: ['Wicked claws'],
  sr: ['armour_bane_2','dark_vitality','flammable','fly_9','frenzy','indomitable_1','necromantic_undead','regeneration_6plus','skirmishers'],
  weaponProfiles: [
    { name: 'Wicked claws', range: 'Combat', S: 'S', AP: '-2', special_rules: [] },
  ],
  command: [
    { role: 'champion', name: 'Vargoyle', cost_per_unit: 7 },
  ],
  page: 12,
});

// ═══════════════════════════════════════════════════════════════════════════
// CAVALRY
// ═══════════════════════════════════════════════════════════════════════════

// Blood Knights
unit('blood_knights', 'Blood Knights', 'cavalry', 'rare',
  'Heavy cavalry', '30 x 60 mm', '5+', 39, {
  profiles: [
    { name: 'Blood Knight', profile: {M:'-',WS:5,BS:3,S:4,T:4,W:1,I:4,A:2,Ld:7} },
    { name: 'Kastellan', is_champion: true, champion_cost: 7, profile: {M:'-',WS:5,BS:3,S:4,T:4,W:1,I:4,A:3,Ld:7} },
    { name: 'Nightmare', is_mount: true, profile: {M:7,WS:3,BS:'-',S:4,T:'-',W:'-',I:2,A:1,Ld:'-'} },
  ],
  equipment: { rider: ['Hand weapons', 'Lances', 'Heavy armour', 'Shields'], mount: ['Iron-shod hooves (counts as hand weapons)', 'Barding'] },
  sr: ['accursed_weapons','close_order','counter_charge','dark_vitality','first_charge','flammable','indomitable_1','martial_pride','necromantic_undead','regeneration_6plus','swiftstride'],
  options: [
    { description: 'Replace heavy armour with full plate armour', cost: 5, scope: 'per_model', category: 'armour' },
    { description: 'Drilled', cost: 3, scope: 'per_model', category: 'special' },
    { description: 'Kastellan: Vampiric Powers', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
    { description: 'Kastellan: Magic items', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Kastellan', cost_per_unit: 7 },
    { role: 'standard_bearer', cost_per_unit: 7 },
    { role: 'musician', cost_per_unit: 7 },
  ],
  magic_standard: 50,
  page: 13,
});

// Black Knights
unit('black_knights_vc', 'Black Knights', 'cavalry', 'special',
  'Heavy cavalry', '30 x 60 mm', '5+', 24, {
  profiles: [
    { name: 'Black Knight', profile: {M:'-',WS:3,BS:0,S:4,T:4,W:1,I:3,A:1,Ld:6} },
    { name: 'Hell Knight', is_champion: true, champion_cost: 6, profile: {M:'-',WS:3,BS:0,S:4,T:4,W:1,I:3,A:2,Ld:6} },
    { name: 'Skeletal Steed', is_mount: true, profile: {M:7,WS:2,BS:'-',S:3,T:'-',W:'-',I:2,A:1,Ld:'-'} },
  ],
  equipment: { rider: ['Hand weapons', 'Heavy armour', 'Shields'], mount: ['Skeletal hooves (counts as hand weapons)'] },
  sr: ['cleaving_blow','close_order','first_charge','necromantic_undead','regeneration_6plus','swiftstride'],
  notes: ['Cleaving Blow applies to Black Knights and Hell Knight only.'],
  options: [
    { description: 'Lances', cost: 2, scope: 'per_model', category: 'weapon' },
    { description: 'Barding', cost: 2, scope: 'per_model', category: 'armour' },
    { description: 'Hell Knight: Magic items', cost: 0, scope: 'per_unit', max_points: 25, category: 'special' },
  ],
  command: [
    { role: 'champion', name: 'Hell Knight', cost_per_unit: 6 },
    { role: 'standard_bearer', cost_per_unit: 6 },
    { role: 'musician', cost_per_unit: 6 },
  ],
  magic_standard: 50,
  page: 14,
});

// Hexwraiths
unit('hexwraiths', 'Hexwraiths', 'cavalry', 'rare',
  'Light cavalry', '30 x 60 mm', '5-10', 31, {
  profiles: [
    { name: 'Hexwraith', profile: {M:'-',WS:3,BS:0,S:3,T:3,W:1,I:2,A:1,Ld:5} },
    { name: 'Hellwraith', is_champion: true, champion_cost: 6, profile: {M:'-',WS:3,BS:0,S:3,T:3,W:1,I:2,A:2,Ld:5} },
    { name: 'Spectral Steed', is_mount: true, profile: {M:8,WS:2,BS:'-',S:3,T:'-',W:'-',I:2,A:1,Ld:'-'} },
  ],
  equipment: { rider: ['Hand weapons', 'Great weapons'], mount: ['Skeletal hooves (counts as hand weapons)'] },
  sr: ['ethereal','flaming_attacks','fly_8','magical_attacks','necromantic_undead','open_order','regeneration_6plus','spectral_reapers','swiftstride','terror'],
  command: [
    { role: 'champion', name: 'Hellwraith', cost_per_unit: 6 },
  ],
  page: 15,
});

// ═══════════════════════════════════════════════════════════════════════════
// RARE MONSTERS
// ═══════════════════════════════════════════════════════════════════════════

// Black Coach
unit('black_coach', 'Black Coach', 'cavalry', 'rare',
  'Heavy Chariot', '50 x 100 mm', '1', 205, {
  profiles: [
    { name: 'Black Coach', profile: {M:'-',WS:'-',BS:'-',S:5,T:6,W:4,I:'-',A:'-',Ld:'-'} },
    { name: 'Wraith', profile: {M:'-',WS:3,BS:0,S:3,T:'-',W:'-',I:'-',A:2,Ld:5} },
    { name: 'Nightmares', is_mount: true, profile: {M:8,WS:3,BS:'-',S:4,T:'-',W:'-',I:2,A:1,Ld:'-'} },
  ],
  equipment: { crew: ['Spectral scythe'], mount: ['Iron-shod hooves (counts as hand weapons)'] },
  sr: ['close_order','first_charge','impact_hits_d6plus2','indomitable_1','magical_attacks','necromantic_undead','regeneration_6plus','spectral_coach','terror'],
  weaponProfiles: [
    { name: 'Spectral scythe', range: 'Combat', S: 'S', AP: 'N/A', special_rules: ['magical_attacks'],
      notes: 'No armour save is permitted against wounds caused by this weapon (Ward and Regeneration saves can be attempted as normal).' },
  ],
  notes: ['Armour Value 3+.'],
  page: 19,
});

// Terrorgheist
unit('terrorgheist', 'Terrorgheist', 'monster', 'rare',
  'Behemoth', '100 x 150 mm', '1', 205, {
  stats: {M:6,WS:3,BS:0,S:5,T:6,W:6,I:3,A:4,Ld:4},
  equipment: ['Filth-encrusted talons', 'Rancid maw', 'Calloused hide (counts as light armour)'],
  sr: ['close_order','fly_9','indomitable_1','infested','large_target','necromantic_undead','regeneration_5plus','stomp_attacks_d6','swiftstride','terror','wailing_dirge'],
  weaponProfiles: [
    { name: 'Filth-encrusted talons', range: 'Combat', S: 'S', AP: '-1', special_rules: ['armour_bane_1','poisoned_attacks'] },
    { name: 'Rancid maw', range: 'Combat', S: 'S', AP: '-2', special_rules: ['armour_bane_1','multiple_wounds_2'],
      notes: 'This model must make one of its attacks each turn with this weapon.' },
  ],
  page: 21,
});

// Varghulf
unit('varghulf', 'Varghulf', 'monster', 'rare',
  'Monstrous creature', '50 x 50 mm', '1', 140, {
  stats: {M:8,WS:5,BS:0,S:5,T:5,W:4,I:4,A:4,Ld:4},
  equipment: ['Wicked claws', 'Calloused hide (counts as light armour)'],
  sr: ['bestial_fury','close_order','counter_charge','dark_vitality','flammable','frenzy','indomitable_1','necromantic_undead','regeneration_5plus','swiftstride','terror'],
  weaponProfiles: [
    { name: 'Wicked claws', range: 'Combat', S: 'S', AP: '-2', special_rules: [] },
  ],
  page: 22,
});

console.log(`Inserted ${unitSort} units`);

// ═══════════════════════════════════════════════════════════════════════════
// VAMPIRIC POWERS
// ═══════════════════════════════════════════════════════════════════════════

const insertUpgrade = db.prepare(`INSERT INTO faction_upgrades
  (id, faction_id, upgrade_type, name, points, restrictions, description, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

const powers = [
  { id: 'curse_of_the_revenant', name: 'Curse of the Revenant', points: 50, restrictions: 'Each power may only be chosen once per army.',
    description: 'This Vampire has a +1 modifier to its Wounds characteristic.' },
  { id: 'beguile', name: 'Beguile', points: 40, restrictions: 'Each power may only be chosen once per army.',
    description: 'Enemy units must make a Leadership test before making any rolls To Hit against this Vampire during the Combat phase. If this test is failed, only rolls of a natural 6 will hit.' },
  { id: 'flying_horror', name: 'Flying Horror', points: 35, restrictions: 'Models whose troop type is \'infantry\' only. Each power may only be chosen once per army.',
    description: 'This Vampire gains the Fly (10) rule, but cannot join a unit.' },
  { id: 'dark_acolyte_power', name: 'Dark Acolyte', points: 30, restrictions: 'Each power may only be chosen once per army.',
    description: 'This Vampire gains the Invocation of Nehek special rule. For the purposes of using this special rule, this model counts as a Level 1 Wizard.' },
  { id: 'master_of_the_black_arts', name: 'Master of the Black Arts', points: 30,
    restrictions: 'A Vampire Count that is a Level 2 Wizard, or a Vampire Thrall that is a Level 1 Wizard only. Each power may only be chosen once per army.',
    description: 'This Vampire increases their Level of Wizardry by 1.' },
  { id: 'supernatural_horror', name: 'Supernatural Horror', points: 20, restrictions: 'Each power may only be chosen once per army.',
    description: 'This Vampire gains the Terror special rule.' },
  { id: 'lord_of_the_night', name: 'Lord of the Night', points: 15, restrictions: 'Each power may only be chosen once per army.',
    description: 'During the Command sub-phase of their turn, this Vampire may attempt to resurrect fallen creatures of the night by making a Leadership test (using their own Leadership). If this test is passed, a single friendly unit of Fell Bats, Bat Swarms or Dire Wolves that is within 12″ of this model recovers D6 lost Wounds.' },
];

powers.forEach((p, i) => insertUpgrade.run(p.id, FACTION, 'vampiric_power', p.name, p.points, p.restrictions, p.description, i));
console.log(`Inserted ${powers.length} Vampiric Powers`);

// ═══════════════════════════════════════════════════════════════════════════
// MAGIC ITEMS (faction-specific)
// ═══════════════════════════════════════════════════════════════════════════

const insertItem = db.prepare(`INSERT INTO magic_items
  (id, faction_id, name, category, points, source, description, rules_text, restrictions, single_use, is_shield, weapon_profile, armour_profile, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let itemSort = 0;
function item(id, name, cat, pts, { desc='', rules=null, restr=null, singleUse=null, isShield=null, wp=null, ap=null } = {}) {
  insertItem.run(id, FACTION, name, cat, pts, SOURCE, desc, rules, restr, singleUse ? 1 : null, isShield ? 1 : null,
    wp ? JSON.stringify(wp) : null, ap ? JSON.stringify(ap) : null, itemSort++);
}

// Magic Weapons
item('vc_frostblade', 'Frostblade', 'magic_weapon', 60, {
  desc: 'A blade of blue ice-steel bound with deadly spells.',
  rules: 'Any enemy model that suffers one or more unsaved wounds from the Frostblade must immediately make a Toughness test. If this test is failed, they gain the Strike Last special rule and must reduce their Initiative characteristic to 1 for the remainder of the game.',
  wp: { name: 'Frostblade', range: 'Combat', S: 'S', AP: '-', special_rules: ['killing_blow','magical_attacks'] },
});
item('vc_sword_of_kings', 'Sword of Kings', 'magic_weapon', 55, {
  desc: 'An accursed blade of ancient and ageless design that thirsts constantly for the souls of its wielder\'s enemies.',
  rules: 'The wielder of the Sword of Kings strikes a Killing Blow if they roll a natural 5 or 6 when making a roll To Wound, rather than the usual 6.',
  wp: { name: 'Sword of Kings', range: 'Combat', S: 'S+1', AP: '-1', special_rules: ['killing_blow','magical_attacks'] },
});
item('vc_blood_drinker', 'Blood Drinker', 'magic_weapon', 45, {
  desc: 'This long, slender blade greedily drinks the blood of its victims, their life force revitalising its master.',
  rules: 'If the wielder of Blood Drinker causes one or more unsaved wounds during the Combat phase, they recover a single lost Wound.',
  wp: { name: 'Blood Drinker', range: 'Combat', S: 'S', AP: '-1', special_rules: ['magical_attacks'] },
});
item('vc_dreadlance', 'Dreadlance', 'magic_weapon', 40, {
  desc: 'Once wielded by an infamous Vampire knight, this lance is uncannily accurate, said to find its target even in the dark of night.',
  rules: 'Models whose troop type is \'cavalry\' or \'monster\' only. The Dreadlance can only be used during a turn in which the wielder charged. In subsequent turns the model must use its hand weapon instead. The wielder of the Dreadlance may re-roll any failed rolls To Hit made whilst using it.',
  restr: 'Models whose troop type is \'cavalry\' or \'monster\' only.',
  wp: { name: 'Dreadlance', range: 'Combat', S: 'S+2', AP: '-2', special_rules: ['armour_bane_1','magical_attacks'] },
});

// Magic Armour
item('vc_flayed_hauberk', 'The Flayed Hauberk', 'magic_armour', 35, {
  desc: 'Stitched from the flesh of countless victims, the wearer of the Flayed Hauberk is enshrouded and protected by the souls of the damned.',
  rules: 'The Flayed Hauberk is a suit of heavy armour which may be worn by a Wizard without penalty. In addition, its wearer has a 6+ Ward save against any wounds suffered.',
  ap: { armour_value: '5+ (heavy armour)', special_rules: [], notes: 'May be worn by a Wizard without penalty. Wearer has a 6+ Ward save.' },
});
item('vc_accursed_armour', 'The Accursed Armour', 'magic_armour', 30, {
  desc: 'Some strange flaw renders the wearer of this armour resilient beyond measure, yet robs them of dexterity.',
  rules: 'Models whose troop type is \'infantry\' or \'cavalry\' only. The Accursed Armour is a suit of full plate armour. In addition, its wearer has a +1 modifier to their Toughness characteristic, but suffers a -1 modifier to their Weapon Skill and Initiative characteristics (to a minimum of 1).',
  restr: 'Models whose troop type is \'infantry\' or \'cavalry\' only.',
});

// Talismans
item('vc_von_carstein_ring', 'Von Carstein Ring', 'talisman', 40, {
  desc: 'An ancient heirloom of the lords of Sylvania, this ring is known to make a Vampire carrying it almost impossible to kill.',
  rules: 'Vampires only. Single use. When the wearer of the Von Carstein Ring loses their last Wound, roll a D6. On a roll of 2+, the Wound is not lost.',
  restr: 'Vampires only.',
  singleUse: true,
});
item('vc_crown_of_the_damned', 'Crown of the Damned', 'talisman', 35, {
  desc: 'The wearer of the Crown of the Damned draws revitalising energies from the spirits imprisoned within it, but at times their eternal wailing can become overpowering.',
  rules: 'The Crown of the Damned gives its wearer a 4+ Ward save against any wounds suffered. However, due to the wailing of the spirits trapped within the crown, its wearer is also subject to the Stupidity special rule.',
});

// Enchanted Items
item('vc_helm_of_commandment', 'Helm of Commandment', 'enchanted_item', 40, {
  desc: 'This ancient and corroded helmet can be used to infuse Undead servants with the wearer\'s sentience, making them formidable fighters.',
  rules: 'Necromancers and Wights only. During the Command sub-phase of their turn, this character may attempt to enhance the sentience of those around them by making a Leadership test (using their own Leadership). If this test is passed, until your next Start of Turn sub-phase this character and any unit they have joined gains a +D3 modifier to their Weapon Skill characteristic (to a maximum of 10).',
  restr: 'Necromancers and Wights only.',
});
item('vc_hand_of_dust', 'Hand of Dust', 'enchanted_item', 35, {
  desc: 'The severed hand of the Great Necromancer himself — the mere proximity of this withered appendage can drain all life and vitality from mortals, leaving them as desiccated husks.',
  rules: 'Necromancers only. This model can cast the following Bound spell, with a Power Level of 2. Roll a D6 each time the Hand of Dust is used. On a roll of 1, it crumbles to dust and cannot be used again. Type: Assailment. Casting Value: 9+. Range: Combat. Effect: The target enemy unit suffers 2D6 Strength 5 hits, each with an AP of -1.',
  restr: 'Necromancers only.',
});
item('vc_cloak_of_mist_shadows', 'Cloak of Mist & Shadows', 'enchanted_item', 30, {
  desc: 'This cloak frees the wearer from the bonds of their physical form, allowing them to move through solid matter like a ghost.',
  rules: 'Necromancers whose troop type is \'infantry\' only. The wearer of the Cloak of Mist & Shadows gains the Ethereal special rule.',
  restr: 'Necromancers whose troop type is \'infantry\' only.',
});

// Arcane Items
item('vc_skull_staff', 'Skull Staff', 'arcane_item', 50, {
  desc: 'The Skull Staff constantly whispers to its bearer, revealing the secrets of their foes and predicting the ebb and flow of the Winds of Magic.',
  rules: 'The bearer of the Skull Staff increases their Dispel range by 3″ and, when attempting a Wizardly dispel, may apply a +1 modifier to their Dispel roll. Note that this is a modifier to the result of a roll — it does not negate a roll of a natural double 1.',
});
item('vc_sceptre_de_noirot', 'Sceptre of De Noirot', 'arcane_item', 35, {
  desc: 'The Necromancer de Noirot suffered a terrible demise when he invoked the power of the sceptre and raised more of the Undead than he could control.',
  rules: 'Necromancers only. The bearer of the Sceptre of De Noirot may attempt to resurrect the fallen by using the Invocation of Nehek special rule twice during their Command sub-phase (rather than the usual once). Roll a D6 each time the sceptre is used. On a roll of 1, the bearer loses a single Wound.',
  restr: 'Necromancers only.',
});
item('vc_spell_familiar', 'Spell Familiar*', 'arcane_item', 15, {
  desc: 'A spell familiar memorises a spell on its master\'s behalf, constantly rehearsing for its big moment until it is called upon to share its arcane knowledge.',
  rules: '0-1 per Wizard. The owner of a Spell Familiar knows one more spell (chosen in the usual way) than is normal for their Level of Wizardry. Note that this does not increase the Wizard\'s Level.',
  restr: '0-1 per Wizard.',
});

// Magic Standards
item('vc_banner_of_the_barrows', 'Banner of the Barrows', 'magic_standard', 65, {
  desc: 'Woven from the wind and the cold, the chill of this banner touches the hearts of those who stand before it.',
  rules: 'Wight Lord Battle Standard Bearer only. During the Combat phase, when a unit carrying the Banner of the Barrows makes a roll To Hit, a roll of 3+ is always a success, regardless of the target\'s Weapon Skill.',
  restr: 'Wight Lord Battle Standard Bearer only.',
});
item('vc_drakenhof_banner', 'Drakenhof Banner', 'magic_standard', 50, {
  desc: 'The infamous Count Vlad von Carstein had thrall Necromancers enchant his household standard to sustain his bodyguard.',
  rules: 'If a unit carrying the Drakenhof Banner has the Regeneration (X+) special rule, it improves the armour value of its Regeneration save by 1.',
});
item('vc_screaming_banner', 'The Screaming Banner', 'magic_standard', 45, {
  desc: 'Even the bravest warriors tremble in the presence of a haunted banner that wails a constant dirge.',
  rules: 'When an enemy unit makes a Leadership test due to Fear caused by a unit carrying the Screaming Banner, it must roll an extra D6 and discard the lowest result.',
});
item('vc_standard_of_hellish_vigour', 'Standard of Hellish Vigour', 'magic_standard', 40, {
  desc: 'The restless essence of the Vampire whose flesh was flayed to craft this banner invigorates the Undead nearby.',
  rules: 'A unit carrying the Standard of Hellish Vigour gains the Reserve Move special rule.',
});

console.log(`Inserted ${itemSort} magic items`);

// ═══════════════════════════════════════════════════════════════════════════
// LORE OF UNDEATH
// ═══════════════════════════════════════════════════════════════════════════

db.prepare(`INSERT INTO lores (lore_key, name, faction_id, source, sort_order) VALUES (?, ?, ?, ?, ?)`).run(
  'lore_of_undeath', 'Lore of Undeath', FACTION, SOURCE, 0
);

const insertSpell = db.prepare(`INSERT INTO spells
  (id, lore_key, faction_id, name, type, casting_value, range, effect, is_signature, remains_in_play, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const spells = [
  { id: 'vanhals_danse_macabre', name: "Vanhal's Danse Macabre", type: 'Enchantment', casting_value: '8+/12+', range: '12"',
    effect: 'If this spell is cast with a casting result of 8 or more, the target friendly unit gains a +D3 modifier to one of the following characteristics (to a maximum of 10). If this spell is cast with a casting result of 12 or more, the target friendly unit gains a +D3 modifier to two of the following characteristics (to a maximum of 10). This spell lasts until your next Start of Turn sub-phase. Movement; Weapon Skill; Initiative.',
    is_signature: false, sort: 0 },
  { id: 'hellish_vigour', name: 'Hellish Vigour', type: 'Enchantment', casting_value: '7+/10+', range: 'Self',
    effect: 'If this spell is cast with a casting result of 7 or more, a single friendly unit that has the Necromantic Undead special rule and is within the caster\'s Command range gains the Reserve Move special rule. If this spell is cast with a casting result of 10 or more, every friendly unit that has the Necromantic Undead special rule and is within the caster\'s Command range gains the Reserve Move special rule. This spell lasts until the end of this turn.',
    is_signature: false, sort: 1 },
  { id: 'raise_dead', name: 'Raise Dead', type: 'Enchantment', casting_value: '10+', range: '12"',
    effect: 'Place a unit of 2D3 Risen Zombies on the battlefield anywhere completely within 12″ of this model, but not within 1″ of any enemy models. This unit cannot declare a charge during the turn in which it was raised. Risen Zombies: M4 WS2 BS0 S3 T3 W1 I1 A1 Ld2. Regular infantry. 25×25mm. Hand weapons. Special Rules: Necromantic Undead, Regeneration (6+), Skirmishers, the Newly Dead. Note: Risen Zombies are not worth any Victory Points.',
    is_signature: false, sort: 2 },
];

spells.forEach(s => insertSpell.run(s.id, 'lore_of_undeath', FACTION, s.name, s.type, s.casting_value, s.range, s.effect, s.is_signature ? 1 : 0, null, s.sort));
console.log(`Inserted ${spells.length} Lore of Undeath spells`);

// ── Verification ─────────────────────────────────────────────────────────────
const unitCount = db.prepare("SELECT COUNT(*) as c FROM units WHERE faction_id = ?").get(FACTION).c;
const itemCount = db.prepare("SELECT COUNT(*) as c FROM magic_items WHERE faction_id = ?").get(FACTION).c;
const powerCount = db.prepare("SELECT COUNT(*) as c FROM faction_upgrades WHERE faction_id = ?").get(FACTION).c;
const spellCount = db.prepare("SELECT COUNT(*) as c FROM spells WHERE faction_id = ?").get(FACTION).c;
const ruleCount = db.prepare("SELECT COUNT(*) as c FROM composition_rules WHERE faction_id = ?").get(FACTION).c;

console.log(`\n── Verification ──`);
console.log(`Units: ${unitCount} | Items: ${itemCount} | Powers: ${powerCount} | Spells: ${spellCount} | Composition rules: ${ruleCount}`);
console.log('\nDone. Run: npm run db:export');
