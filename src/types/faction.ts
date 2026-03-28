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

export type UnitSource = 'forces_of_fantasy' | 'arcane_journal';

export interface Unit {
  id: string;
  name: string;
  category: UnitCategory;
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

export type ArmyLimitType = 'max_percent' | 'min_percent' | 'per_1000_pts';

export interface ArmyCompositionRule {
  category: string;
  limit_type: ArmyLimitType;
  limit_value: number;
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
  knightly_virtues: KnightlyVirtue[];
  magic_items: MagicItem[];
  lore_of_the_lady: Spell[];
  chivalrous_vows: ChivalrousVow[];
}
