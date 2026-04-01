import loresRaw from '../data/lores.json';

export interface LoreSpell {
  id: string;
  name: string;
  number: number;
  is_signature: boolean;
  casting_value: string;
  range: string;
  type: string;
  duration: string;
  flavour: string;
  effect: string;
}

export interface Lore {
  id: string;
  name: string;
  spells?: LoreSpell[];
}

/** These are reference articles in lores.json, not actual spell lores */
const META_LORE_IDS: ReadonlySet<string> = new Set([
  'spell-categories-lores',
  'spells-and-spell-generation',
]);

const ALL_LORES = loresRaw as unknown as Lore[];

/** Convert unit lore key (snake_case from faction data) to lores.json id (kebab-case) */
export function unitLoreToId(unitLore: string): string {
  return unitLore.replace(/_/g, '-');
}

/** Look up a lore by unit snake_case key or lores.json kebab-case id */
export function getLore(loreKey: string): Lore | undefined {
  const id = loreKey.includes('_') ? unitLoreToId(loreKey) : loreKey;
  const lore = ALL_LORES.find((l) => l.id === id);
  return lore && !META_LORE_IDS.has(lore.id) ? lore : undefined;
}

/** All playable lores (excludes meta/reference entries without spells) */
export function getAllPlayableLores(): Lore[] {
  return ALL_LORES.filter(
    (l) => Array.isArray(l.spells) && l.spells.length > 0 && !META_LORE_IDS.has(l.id),
  );
}

/** Spells for a lore, sorted signature-first then by number */
export function getLoreSpells(loreKey: string): LoreSpell[] {
  const lore = getLore(loreKey);
  if (!lore?.spells) return [];
  return [...lore.spells].sort((a, b) => a.number - b.number);
}

// ---------------------------------------------------------------------------
// Spell-modifying magic items
// ---------------------------------------------------------------------------

export type SpellModItem =
  | 'lore_familiar'
  | 'spell_familiar'
  | 'tome_of_midnight'
  | 'grimoire_of_ogvold'
  | 'heartwood_pendant'
  | 'goretooth';

/** Items available to each faction. All non-Dwarf factions can access lore_familiar
 *  (it's a global item). Faction-specific extras are listed separately. */
export const FACTION_SPELL_MOD_ITEMS: Readonly<Partial<Record<string, SpellModItem[]>>> = {
  'empire-of-man':        ['lore_familiar', 'tome_of_midnight'],
  'high-elf-realms':      ['lore_familiar'],
  'kingdom-of-bretonnia': ['lore_familiar'],
  'wood-elf-realms':      ['lore_familiar', 'heartwood_pendant'],
  'warriors-of-chaos':    ['lore_familiar', 'spell_familiar', 'grimoire_of_ogvold'],
  'beastmen-brayherds':   ['lore_familiar', 'goretooth'],
  'orc-and-goblin-tribes':['lore_familiar'],
  'tomb-kings-of-khemri': ['lore_familiar'],
  'dwarfen-mountain-holds': [],
};

// ---------------------------------------------------------------------------
// Bound spell items
// ---------------------------------------------------------------------------

export interface BoundSpellItem {
  itemId: string;
  itemName: string;
  /** lores.json kebab-case lore id */
  loreId: string;
  spellId: string;
  spellName: string;
  castingValue: string;
  powerLevel: number;
  /** If set, only shown for this faction; undefined = available to all factions */
  factionId?: string;
}

function makeBound(
  itemId: string,
  itemName: string,
  loreId: string,
  spellId: string,
  powerLevel: number,
  factionId?: string,
): BoundSpellItem {
  const spell = getLore(loreId)?.spells?.find((s) => s.id === spellId);
  return {
    itemId,
    itemName,
    loreId,
    spellId,
    spellName: spell?.name ?? spellId,
    castingValue: spell?.casting_value ?? '?',
    powerLevel,
    factionId,
  };
}

export const BOUND_SPELL_ITEMS: ReadonlyArray<BoundSpellItem> = [
  makeBound('ruby-ring-of-ruin',          'Ruby Ring of Ruin',           'battle-magic',       'fireball',       1),
  makeBound('ring_of_fury',               'Ring of Fury',                'battle-magic',       'hammerhand',     2, 'high-elf-realms'),
  makeBound('ring_of_taal',               'Ring of Taal',                'battle-magic',       'oaken_shield',   3, 'empire-of-man'),
  makeBound('twice_blessed_armour',       'Twice-Blessed Armour',        'battle-magic',       'hammerhand',     2, 'empire-of-man'),
  makeBound('standard-of-mornings-chill', "Standard of Morning's Chill", 'lore-of-the-wilds',  'swirling_mists', 2, 'wood-elf-realms'),
  makeBound('moonstone-of-the-hidden-ways','Moonstone of the Hidden Ways','lore-of-athel-loren','forest_walker',  3, 'wood-elf-realms'),
  makeBound('rod_of_the_damned',          'Rod of the Damned',           'daemonology',        'the_summoning',  2, 'warriors-of-chaos'),
];
