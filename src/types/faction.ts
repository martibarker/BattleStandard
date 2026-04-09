/** Faction data types for Battle Standard army lists */

/** Stat value: number, '-' for N/A, or modifier string like '(+1)' */
export type Stat = number | string;

export interface Profile {
  M: Stat;
  WS: Stat;
  BS: Stat;
  S: Stat;
  T: Stat;
  W: Stat;
  I: Stat;
  A: Stat;
  Ld: Stat;
}

/** A single model profile within a unit entry */
export interface ProfileEntry {
  name: string;
  profile: Profile;
  /** True if this is the champion upgrade model */
  is_champion?: boolean;
  /** True if this is the mount component of a cavalry unit */
  is_mount?: boolean;
  /** Points cost to add this champion (per unit) */
  champion_cost?: number;
  /** Characteristic bonuses this mount grants to the rider, e.g. '+1 Wound' */
  mount_grants?: string;
}

/** A weapon with its own combat profile (polearms, trebuchets, etc.) */
export interface WeaponProfile {
  name: string;
  /** e.g. 'Combat', '12-72"', '48"' */
  range: string;
  /** e.g. 'S', 'S+1', '5(10)', '8' */
  S: string;
  /** e.g. '-1', '-3', '-' */
  AP: string;
  special_rules: string[];
  notes?: string;
}

/** An armour or shield with its own profile (magic armour, shields, etc.) */
export interface ArmourProfile {
  armour_value: string;
  /** e.g. 'shield', 'helm' */
  type?: string;
  special_rules: string[];
  notes?: string;
}

export interface MagicDetails {
  wizard_level: number;
  lores: string[];
}

export type OptionScope = 'per_model' | 'per_unit' | 'per_army';

/** Determines which section of the options panel an option appears in */
export type OptionCategory = 'weapon' | 'armour' | 'special';

/** A single option within a mutually-exclusive choice group */
export interface OptionChoice {
  description: string;
  cost: number;
  scope: OptionScope;
  notes?: string;
  category?: OptionCategory;
  /** Special rule IDs this choice grants when selected */
  grants_rules?: string[];
}

export interface Option {
  description: string;
  cost: number;
  scope: OptionScope;
  condition?: string;
  notes?: string;
  replaces?: string;
  /** For magic item allowances: maximum total points value */
  max_points?: number;
  /** Maximum number that can be purchased (e.g. max 3 Fanatics) */
  max_count?: number;
  /** 1 of this option allowed per N models in unit (e.g. 1 Fanatic per 10 Night Goblins) */
  per_n_models?: number;
  /** Which section of the options panel this option appears in */
  category?: OptionCategory;
  /** Mutually-exclusive sub-options — rendered as a radio group (pick one) */
  choices?: OptionChoice[];
  /** When true, choices are independent checkboxes (multiple may be selected) */
  multi_select?: boolean;
  /** Max number of units in the army that may have any of these choices — per 1,000 pts */
  max_per_1000_pts?: number;
  /** Special rule IDs this option grants when selected (e.g. ['frenzy']) */
  grants_rules?: string[];
}

export interface CommandUpgrade {
  role: 'champion' | 'standard_bearer' | 'musician';
  /** Display name of the champion, e.g. 'First Knight', 'Gallant' */
  name?: string;
  cost_per_unit: number;
  /** Stat overrides for the champion relative to the base unit profile */
  champion_stats?: Partial<Profile>;
}

export type UnitCategory =
  | 'character'
  | 'infantry'
  | 'cavalry'
  | 'monster'
  | 'war_machine'
  | 'mount';

/** Composition bucket for army list validation */
export type ListCategory = 'characters' | 'core' | 'special' | 'rare' | 'mercenaries';

export type ArmyLimitType =
  | 'max_percent'
  | 'min_percent'
  /** Maximum count of specific unit_ids per 1,000 pts of army points limit */
  | 'max_per_1000_pts'
  /** Minimum count of specific unit_ids per 1,000 pts of army points limit */
  | 'min_per_1000_pts'
  /** Absolute maximum count of specific unit_ids regardless of army size */
  | 'max_count'
  /** Absolute minimum count of specific unit_ids regardless of army size */
  | 'min_count'
  /**
   * Maximum count of unit_ids = limit_value × (number of qualifying characters in army).
   * character_unit_ids lists which character unit IDs count as unlocking characters.
   */
  | 'max_per_character'
  /**
   * These unit_ids may only be taken if general_unit_ids contains the army's General.
   * Validated as a warning since the General is not explicitly tracked in the army list.
   */
  | 'conditional';

export type UnitSource = 'forces_of_fantasy' | 'arcane_journal' | 'ravening_hordes' | 'legends';

export type FactionPublication = 'forces_of_fantasy' | 'ravening_hordes' | 'legends';

export interface ErrataNote {
  type: 'stat' | 'points' | 'rule';
  note: string;
  faq_url: string;
}

export interface Unit {
  id: string;
  name: string;
  category: UnitCategory;
  /** Default army list composition bucket (used when no override applies) */
  list_category?: ListCategory;
  /**
   * Composition-specific category overrides.
   * Key = compositionId (e.g. "errantry_crusade"), value = effective ListCategory,
   * or null to exclude the unit from that composition entirely.
   */
  list_category_overrides?: Partial<Record<string, ListCategory | null>>;
  source: UnitSource;
  source_page?: number;
  is_named_character?: boolean;
  /** Which army compositions can include this unit; omit for units available in all */
  availability?: string[];
  troop_type: string;
  base_size: string;
  /** e.g. '1', '5+', '10+', '3-30' */
  unit_size: string;
  /** Base points per model, or total for characters and war machines */
  points: number;
  profiles: ProfileEntry[];
  /**
   * Unit equipment list. Most units use a flat string[].
   * Cavalry and chariots may use {rider: string[], mount: string[]} or {crew: string[], mount: string[]}.
   * Use flattenEquipment() from armyValidation to get a safe flat array.
   */
  equipment: string[] | Record<string, string[]>;
  options?: Option[];
  command?: CommandUpgrade[];
  /** Maximum points value of magic standard this unit may carry */
  magic_standard?: number;
  /** IDs referencing special-rules.json */
  special_rules: string[];
  weapon_profiles?: WeaponProfile[];
  magic?: MagicDetails;
  notes?: string[];
  /** Structured errata notes from official FAQ/Errata documents */
  errata?: ErrataNote[];
}

export type MagicItemCategory =
  | 'magic_weapon'
  | 'magic_armour'
  | 'talisman'
  | 'enchanted_item'
  | 'arcane_item'
  | 'magic_standard'
  // Dwarf runic item categories (stored in runic_items array)
  | 'runic_weapon'
  | 'runic_armour'
  | 'runic_talisman'
  | 'runic_standard'
  | 'runic_engineering'
  | 'runic_tattoo';

export interface MagicItem {
  id: string;
  name: string;
  category: MagicItemCategory;
  source: UnitSource;
  points: number;
  extremely_common?: boolean;
  /** Free-text troop-type or unit-name restriction, e.g. "Goblin Bosses only" */
  restrictions?: string;
  /** Narrative/flavour text only — displayed italic */
  description: string;
  /** Mechanical rules text — displayed non-italic below description */
  rules_text?: string;
  /** True if this item is consumed on use */
  single_use?: boolean;
  /** True if this is a magic shield (sub-type of magic_armour) */
  is_shield?: boolean;
  /** Rule IDs this item grants to the bearer when equipped */
  grants_rules?: string[];
  weapon_profile?: WeaponProfile;
  armour_profile?: ArmourProfile;
  /** Structured errata notes from official FAQ/Errata documents */
  errata?: ErrataNote[];
}

export interface KnightlyVirtue {
  id: string;
  name: string;
  points: number;
  restrictions?: string;
  description: string;
}

export interface ChivalrousVow {
  id: string;
  name: string;
  description: string;
  restrictions: string;
}

export interface Spell {
  id: string;
  name: string;
  type: string;
  casting_value: string;
  range: string;
  effect: string;
  remains_in_play?: boolean;
  is_signature?: boolean;
}

export interface ArmyCompositionRule {
  category: string;
  limit_type: ArmyLimitType;
  limit_value: number;
  /**
   * If set, this rule applies only to these unit IDs (not the whole category).
   * Used for per-unit count/rate limits such as "0-1 Field Trebuchet per 1,000 pts".
   */
  unit_ids?: string[];
  /**
   * For max_per_character: unit IDs of characters that each unlock limit_value of unit_ids.
   * e.g. Night Goblin Chiefs/Shamans unlock Night Goblin Mobs.
   */
  character_unit_ids?: string[];
  /**
   * For conditional: unit IDs of characters that may serve as the General to satisfy this rule.
   * Validated as a warning — the player must ensure their General is one of these types.
   */
  general_unit_ids?: string[];
  notes?: string;
}

export interface SubOrderUnlock {
  unit_id: string;
  list_category: ListCategory;
}

export interface SubOrder {
  id: string;
  name: string;
  /** Points added to the character (Grand Master / Chapter Master) upgrade cost */
  character_upgrade_pts: number;
  /** Points per model added to knight units in this order */
  unit_upgrade_pts_per_model: number;
  /** Unit IDs that pay the per-model upgrade cost */
  unit_ids: string[];
  /** Special rules granted to ALL units belonging to this order (display only) */
  all_units_rules: string[];
  /** Special rules granted to Grand Master / Chapter Master / ICK only (display only) */
  elite_rules: string[];
  /** Units unlocked / granted a list category by this sub-order */
  unlocks: SubOrderUnlock[];
  /** Unit IDs excluded from the army when this sub-order is chosen */
  restrictions: string[];
}

export interface ArmyComposition {
  id: string;
  name: string;
  source: UnitSource;
  rules: ArmyCompositionRule[];
  /** Knightly Order sub-orders; if present, player must choose exactly one before building */
  sub_orders?: SubOrder[];
}

export interface Faction {
  id: string;
  name: string;
  /** Which book this faction was published in */
  publication?: FactionPublication;
  sources: string[];
  army_compositions: ArmyComposition[];
  units: Unit[];
  /** Faction-specific upgrade lists */
  knightly_virtues?: KnightlyVirtue[];   // Bretonnia
  elven_honours?: KnightlyVirtue[];      // High Elves
  runic_items?: MagicItem[];             // Dwarfs
  magic_items: MagicItem[];
  /** Faction-specific spell lores */
  lore_of_the_lady?: Spell[];            // Bretonnia
  lore_of_saphery?: Spell[];             // High Elves
  lore_of_athel_loren?: Spell[];         // Wood Elves
  lore_of_the_wilds?: Spell[];           // Wood Elves
  prayers_of_sigmar?: Spell[];           // Empire
  prayers_of_ulric?: Spell[];            // Empire
  /** Other faction-specific data */
  chivalrous_vows?: ChivalrousVow[];     // Bretonnia
  forest_sprites?: unknown[];            // Wood Elves
  gifts_of_chaos?: KnightlyVirtue[];     // Warriors of Chaos
  chaos_mutations?: KnightlyVirtue[];    // Beastmen Brayherds
  /** Faction-specific upgrades (Legends) */
  vampiric_powers?: KnightlyVirtue[];   // Vampire Counts
  /** Faction-specific spell lores (Legends) */
  lore_of_undeath?: Spell[];            // Vampire Counts
  /** Faction-specific spell lores (Ravening Hordes) */
  lore_of_gork?: Spell[];               // Orcs & Goblins
  lore_of_mork?: Spell[];               // Orcs & Goblins
  lore_of_chaos?: Spell[];              // Warriors of Chaos
  lore_of_beasts?: Spell[];             // Beastmen
  lore_of_nehekhara?: Spell[];          // Tomb Kings
  lore_of_naggaroth?: Spell[];          // Dark Elves
  /** Faction-specific spell lores (Arcane Journals — FoF) */
  lore_of_yang?: Spell[];              // Grand Cathay
  lore_of_yin?: Spell[];               // Grand Cathay
}
