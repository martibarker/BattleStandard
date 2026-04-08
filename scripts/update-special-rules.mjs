import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.resolve(__dirname, '../src/data/rules/special-rules.json');

const FAQ_URL = 'https://assets.warhammer-community.com/eng_28-01_warhammer_the_old_world_faq_and_errata_rulebook-cypy1xqrht-t4jzdire13.pdf';

const sr = JSON.parse(readFileSync(RULES_PATH, 'utf8'));

// Rule IDs (exact match or prefix) affected by the Jan 2026 Rulebook FAQ v1.5.2
const FAQ_EXACT = new Set([
  'frenzy', 'impetuous', 'large_target', 'poisoned_attacks', 'random_movement',
  'reserve_move', 'stupidity', 'swiftstride', 'unstable', 'vanguard', 'warband',
  'chariot_runners', 'evasive', 'fire_and_flee',
]);
const FAQ_PREFIXES = [
  'fly_', 'impact_hits_', 'regeneration_', 'stomp_attacks_', 'monster_handlers',
];

function isFaqAffected(id) {
  if (FAQ_EXACT.has(id)) return true;
  return FAQ_PREFIXES.some(p => id.startsWith(p));
}

// Tag existing rules with faq_url
let tagged = 0;
for (const rule of sr.rules) {
  if (isFaqAffected(rule.id) && !rule.faq_url) {
    rule.faq_url = FAQ_URL;
    tagged++;
  }
}
console.log(`Tagged ${tagged} existing rules with faq_url.`);

// New rules to add
const newRules = [
  // New parametric rulebook variants (all FAQ-affected)
  {
    id: 'fly_7', name: 'Fly (7)', source: 'rulebook',
    description: 'Refer to the Warhammer: The Old World rulebook.',
    faq_url: FAQ_URL,
  },
  {
    id: 'regeneration_6', name: 'Regeneration (6+)', source: 'rulebook',
    description: 'Refer to the Warhammer: The Old World rulebook.',
    faq_url: FAQ_URL,
  },
  {
    id: 'impact_hits_d6_plus_2', name: 'Impact Hits (D6+2)', source: 'rulebook',
    description: 'Refer to the Warhammer: The Old World rulebook.',
    faq_url: FAQ_URL,
  },
  {
    id: 'stomp_attacks_d3_plus_1', name: 'Stomp Attacks (D3+1)', source: 'rulebook',
    description: 'Refer to the Warhammer: The Old World rulebook.',
    faq_url: FAQ_URL,
  },
  {
    id: 'evasive', name: 'Evasive', source: 'rulebook',
    description: 'Refer to the Warhammer: The Old World rulebook.',
    faq_url: FAQ_URL,
  },
  {
    id: 'monster_handlers', name: 'Monster Handlers', source: 'rulebook',
    description: 'Refer to the Warhammer: The Old World rulebook.',
    faq_url: FAQ_URL,
  },

  // ── Dark Elves army rules ──────────────────────────────────────────────────
  {
    id: 'eternal_hatred', name: 'Eternal Hatred', source: 'army',
    description: 'A model with this rule hates all enemies. In addition, when fighting in close combat against a unit that contains at least one High Elf model, a model with this rule may re-roll all missed To Hit rolls in every round of combat, not just the first.',
  },
  {
    id: 'elven_reflexes', name: 'Elven Reflexes', source: 'army',
    description: 'A model with this rule always strikes at its Initiative value in close combat, even when using weapons that would normally force it to strike last.',
  },
  {
    id: 'sea_dragon_cloak', name: 'Sea Dragon Cloak', source: 'army',
    description: 'Counts as light armour (5+ armour save). Shooting and spell attacks against a model wearing a Sea Dragon Cloak are at -1 To Hit.',
  },
  {
    id: 'martial_prowess', name: 'Martial Prowess', source: 'army',
    description: 'A unit with this rule may claim a maximum Rank Bonus of +4 in close combat (rather than the usual +3). Models in the second rank may make supporting attacks when armed with hand weapons or spears.',
  },
  {
    id: 'murderous', name: 'Murderous', source: 'army',
    description: 'Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'cleaving_blow', name: 'Cleaving Blow', source: 'army',
    description: 'A model with this rule that rolls a natural 6 To Hit causes a Killing Blow instead of a normal hit.',
  },
  {
    id: 'dance_of_death', name: 'Dance of Death', source: 'army',
    description: 'A unit with this rule that is a valid charge target may redirect that charge. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'hekartis_blessing', name: "Hekartis' Blessing", source: 'army',
    description: 'Friendly units in range of the Cauldron of Blood benefit from special combat bonuses. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'goad_beast', name: 'Goad Beast', source: 'army',
    description: 'Beastmasters with this rule can attempt to prevent or modify a Wilful Beast test for a nearby monster. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'hidden', name: 'Hidden', source: 'army',
    description: 'Before the battle, this model may be secretly assigned to a friendly unit. When revealed, it is placed in the unit and may act immediately. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'cursed_coven', name: 'Cursed Coven', source: 'army',
    description: 'Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'dark_runes', name: 'Dark Runes', source: 'army',
    description: 'Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'stony_stare', name: 'Stony Stare', source: 'army',
    description: 'Enemy models in base contact must pass a Leadership test at the start of each Close Combat phase or be turned to stone. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'abyssal_howl', name: 'Abyssal Howl', source: 'army',
    description: 'Enemy units within range of this model must take a Fear test. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'wilful_beast', name: 'Wilful Beast', source: 'army',
    description: 'This model must pass a Leadership test each turn or act erratically instead of following orders. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'lore_of_naggaroth', name: 'Lore of Naggaroth', source: 'army',
    description: 'This wizard knows spells from the Lore of Naggaroth, the dark magic of the Druchii.',
  },
  {
    id: 'extra_attacks_remaining_wounds', name: 'Extra Attacks (Remaining Wounds)', source: 'army',
    description: 'This model gains additional Attacks equal to its current Wounds remaining above 1. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'dragged_along', name: 'Dragged Along', source: 'army',
    description: 'When a Cold One Flees or Charges, its rider is dragged along and must follow. Refer to the Dark Elves Legends army list for full details.',
  },
  {
    id: 'hatred_high_elves', name: 'Hatred (High Elves)', source: 'army',
    description: 'This model has the Hatred special rule, applying specifically to High Elf models and units.',
  },

  // ── Vampire Counts army rules ──────────────────────────────────────────────
  {
    id: 'dark_vitality', name: 'Dark Vitality', source: 'army',
    description: 'This model can have Wounds restored by the Invocation of Nehek spell and similar Undead-restoring abilities.',
  },
  {
    id: 'lore_of_undeath', name: 'Lore of Undeath', source: 'army',
    description: 'This wizard knows spells from the Lore of Undeath, the necromantic magic of the Vampire Counts.',
  },
  {
    id: 'necromantic_undead', name: 'Necromantic Undead', source: 'army',
    description: 'Models with this rule are Undead: Immune to Psychology, never take Panic tests, and use the general\'s Leadership for any required test. Units that lose more Wounds in combat than they inflict suffer additional Wounds with no saves (Unstable).',
  },
  {
    id: 'banner_of_the_count', name: 'Banner of the Count', source: 'army',
    description: 'This magic standard serves as a rallying point and provides special benefits. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'indomitable_1', name: 'Indomitable (1)', source: 'army',
    description: 'Reduce the number of Wounds lost from each unsaved Wound by 1 (minimum 1). Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'indomitable_2', name: 'Indomitable (2)', source: 'army',
    description: 'Reduce the number of Wounds lost from each unsaved Wound by 2 (minimum 1). Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'bestial_fury', name: 'Bestial Fury', source: 'army',
    description: 'This model gains bonus Attacks under certain combat conditions. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'blasphemous_tome', name: 'Blasphemous Tome', source: 'army',
    description: 'A model carrying the Blasphemous Tome generates additional Power Dice each Magic Phase.',
  },
  {
    id: 'bound_spirits', name: 'Bound Spirits', source: 'army',
    description: 'Spirit Hosts are Ethereal and can only be wounded by magical attacks.',
  },
  {
    id: 'carrion_feeders', name: 'Carrion Feeders', source: 'army',
    description: 'This Corpse Cart provides special bonuses to nearby Undead units. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'ghoulish_glamour', name: 'Ghoulish Glamour', source: 'army',
    description: 'A Vampire with this rule can attempt to prevent an enemy model in base contact from making attacks. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'invocation_of_nehek', name: 'Invocation of Nehek', source: 'army',
    description: 'A signature spell of the Lore of Undeath. Restores Wounds to Undead units or adds new models to Skeleton and Zombie units.',
  },
  {
    id: 'martial_pride', name: 'Martial Pride', source: 'army',
    description: 'A model with this rule may not refuse challenges and must always issue or accept a challenge when possible.',
  },
  {
    id: 'scrying_pool', name: 'Scrying Pool', source: 'army',
    description: 'Grants a Vampire magical sight over the battlefield. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'slavering_charge', name: 'Slavering Charge', source: 'army',
    description: 'This unit gains bonus Attacks on the turn it charges into combat.',
  },
  {
    id: 'spectral_coach', name: 'Spectral Coach', source: 'army',
    description: 'The Black Coach uses special ethereal movement rules. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'spectral_reapers', name: 'Spectral Reapers', source: 'army',
    description: 'The Black Coach\'s ethereal steeds make additional attacks in close combat.',
  },
  {
    id: 'the_hunger', name: 'The Hunger', source: 'army',
    description: 'After a Vampire kills an enemy model in close combat, it may attempt to recover a previously lost Wound.',
  },
  {
    id: 'the_newly_dead', name: 'The Newly Dead', source: 'army',
    description: 'Zombie units can be raised beyond their starting size by Invocation of Nehek and similar effects, with no upper limit.',
  },
  {
    id: 'wailing_dirge', name: 'Wailing Dirge', source: 'army',
    description: 'Enemy units within range of the Mortis Engine must re-roll successful Leadership-based tests.',
  },
  {
    id: 'wight_banner', name: 'Wight Banner', source: 'army',
    description: 'The Wight Banner carried by a Wight King provides combat bonuses to its unit. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'accursed_reliquary', name: 'Accursed Reliquary', source: 'army',
    description: 'The Mortis Engine radiates a field of dark magical energy that damages nearby units. Refer to the Vampire Counts Legends army list for full details.',
  },
  {
    id: 'accursed_weapons', name: 'Accursed Weapons', source: 'army',
    description: 'Attacks made with Accursed Weapons ignore Ward saves.',
  },
  {
    id: 'infested', name: 'Infested', source: 'army',
    description: 'This Corpse Cart is overrun with rats and vermin that hamper nearby enemies. Refer to the Vampire Counts Legends army list for full details.',
  },
];

const existingIds = new Set(sr.rules.map(r => r.id));
let added = 0;
for (const r of newRules) {
  if (!existingIds.has(r.id)) {
    sr.rules.push(r);
    added++;
  }
}

writeFileSync(RULES_PATH, JSON.stringify(sr, null, 2) + '\n');
console.log(`Added ${added} new rules. Total: ${sr.rules.length} rules.`);
