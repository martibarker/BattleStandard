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

export interface Option {
  description: string;
  cost: number;
  scope: OptionScope;
  condition?: string;
  notes?: string;
  replaces?: string;
  /** For magic item allowances: maximum total points value */
  max_points?: number;
}

export interface CommandUpgrade {
  role: 'champion' | 'standard_bearer' | 'musician';
  /** Display name of the champion, e.g. 'First Knight', 'Gallant' */
  name?: string;
  cost_per_unit: number;
}

export type UnitCategory =
  | 'character'
  | 'infantry'
  | 'cavalry'
  | 'monster'
  | 'war_machine'
  | 'mount';

/** Composition bucket for army list validation */
export type ListCategory = 'characters' | 'core' | 'special' | 'rare';

export type ArmyLimitType =
  | 'max_percent'
  | 'min_percent'
  /** Maximum count of specific unit_ids per 1,000 pts of army points limit */
  | 'max_per_1000_pts'
  /** Minimum count of specific unit_ids per 1,000 pts of army points limit */
  | 'min_per_1000_pts'
  /** Absolute maximum count of specific unit_ids regardless of army size */
  | 'max_count';

export type UnitSource = 'forces_of_fantasy' | 'arcane_journal' | 'ravening_hordes';

export interface Unit {
  id: string;
  name: string;
  category: UnitCategory;
  /** Default army list composition bucket (used when no override applies) */
  list_category?: ListCategory;
  /**
   * Composition-specific category overrides.
   * Key = compositionId (e.g. "errantry_crusade"), value = effective ListCategory.
   */
  list_category_overrides?: Partial<Record<string, ListCategory>>;
  source: UnitSource;
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
  equipment: string[];
  options?: Option[];
  command?: CommandUpgrade[];
  /** Maximum points value of magic standard this unit may carry */
  magic_standard?: number;
  /** IDs referencing special-rules.json */
  special_rules: string[];
  weapon_profiles?: WeaponProfile[];
  magic?: MagicDetails;
  notes?: string[];
}

export type MagicItemCategory =
  | 'magic_weapon'
  | 'magic_armour'
  | 'talisman'
  | 'enchanted_item'
  | 'arcane_item'
  | 'magic_standard';

export interface MagicItem {
  id: string;
  name: string;
  category: MagicItemCategory;
  source: UnitSource;
  points: number;
  extremely_common?: boolean;
  restrictions?: string;
  description: string;
  weapon_profile?: WeaponProfile;
  armour_profile?: ArmourProfile;
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
  notes?: string;
}

export interface ArmyComposition {
  id: string;
  name: string;
  source: UnitSource;
  rules: ArmyCompositionRule[];
}

export interface Faction {
  id: string;
  name: string;
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
  /** Faction-specific spell lores (Ravening Hordes) */
  lore_of_gork?: Spell[];               // Orcs & Goblins
  lore_of_mork?: Spell[];               // Orcs & Goblins
  lore_of_chaos?: Spell[];              // Warriors of Chaos
  lore_of_beasts?: Spell[];             // Beastmen
  lore_of_nehekhara?: Spell[];          // Tomb Kings
}
