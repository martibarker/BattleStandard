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
   * ID of the selected mount from faction.units (category: 'mount').
   * Null if unmounted. Only used for characters with a "Mount (see Character Mounts)" option.
   */
  selectedMountId: string | null;
  customName?: string;
}

export interface ArmyList {
  id: string;
  name: string;
  factionId: string;
  /** ID of the army_compositions entry (e.g. 'grand_army') */
  compositionId: string;
  /** Active Matched Play formats — multiple may be combined */
  matchedPlayFormats: MatchedPlayFormat[];
  pointsLimit: number;
  entries: ArmyEntry[];
  createdAt: string;
  updatedAt: string;
}
