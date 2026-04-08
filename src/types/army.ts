/** Army list types for Battle Standard */

/**
 * Matched Play formats from the WToW Matched Play Guide (2025).
 * Applied on top of faction army composition rules.
 */
export type MatchedPlayFormat = 'open_war' | 'grand_melee' | 'combined_arms';

export interface ArmyEntry {
  id: string;
  unitId: string;
  /** Number of models in the unit (always 1 for characters and war machines) */
  quantity: number;
  includeChampion: boolean;
  includeStandard: boolean;
  includeMusician: boolean;
  /**
   * Descriptions of selected options (equipment, weapon upgrades, formation changes,
   * vow replacements). Used to calculate option costs at render time.
   */
  selectedOptions: string[];
  /**
   * ID of a selected Knightly Virtue from faction.knightly_virtues.
   * Null if no virtue is chosen.
   */
  selectedVirtueId: string | null;
  /**
   * IDs of selected magic items from faction.magic_items.
   * Covers personal magic items (characters) and magic standards (units with standard bearer).
   */
  selectedMagicItemIds: string[];
  /**
   * Quantities for options that use per_n_models scaling (e.g. Fanatics).
   * Key is the option description; value is the number purchased.
   */
  optionQuantities?: Record<string, number>;
  /**
   * ID of the selected mount from faction.units (category: 'mount').
   * Null if unmounted. Only used for characters with a "Mount (see Character Mounts)" option.
   */
  selectedMountId: string | null;
  customName?: string;
  /**
   * Selected lore key (snake_case, e.g. 'battle_magic') for wizard units with a choice of lore.
   * Undefined means the first lore in unit.magic.lores is assumed.
   * Carried through to General's Adjutant to pre-populate spell setup.
   */
  selectedLoreKey?: string;
  /**
   * Dwarfs only — runic items inscribed on this character or war machine.
   * Characters: weapon/armour/talisman runes. War machines: engineering runes only.
   */
  runicItems?: RunicItemState;
}

/**
 * Dwarfs-specific runic item selections for a single army entry.
 *
 * Characters pick a weapon slot (the physical item the runes go on), then
 * stack up to 3 runes on it (from runic_weapon). Armour, talisman and
 * engineering rune lists work the same way but have no slot choice.
 *
 * Tattoos are separate: the model itself is the "item" and the slot is
 * implicit (always the flesh).
 */
export interface RunicItemState {
  /** Which physical weapon the weapon-runes are inscribed on */
  weaponSlot?: 'hand_weapon' | 'great_weapon' | 'crossbow' | 'handgun';
  /** IDs of runic_weapon runes inscribed on weaponSlot (max 3) */
  weaponRunes: string[];
  /** IDs of runic_armour runes (max 3) */
  armourRunes: string[];
  /** IDs of runic_talisman runes (max 3) */
  talismanRunes: string[];
  /** IDs of runic_engineering runes on this war machine (max 3) */
  engineeringRunes: string[];
  /** IDs of runic_tattoo runes (AJ Slayer characters only) */
  tattooRunes: string[];
}

export interface ArmyList {
  id: string;
  name: string;
  factionId: string;
  /** ID of the army_compositions entry (e.g. 'grand_army') */
  compositionId: string;
  /**
   * ID of the chosen sub-order (e.g. 'knights_of_the_white_wolf').
   * Only applicable when the composition has sub_orders; undefined until the player selects one.
   */
  subOrderId?: string;
  /** Active Matched Play formats — multiple may be combined */
  matchedPlayFormats: MatchedPlayFormat[];
  pointsLimit: number;
  entries: ArmyEntry[];
  createdAt: string;
  updatedAt: string;
}
