import type { Unit } from '../../types/faction';

export interface WizardSetup {
  unitId: string;
  unitName: string;
  wizardLevel: number;
  /** Unit lore keys (snake_case from faction data), e.g. ['battle_magic', 'illusion'] */
  availableLores: string[];
  /** Currently selected lore key (snake_case) */
  selectedLore: string;
  /** Spell IDs from lores.json that have been selected */
  selectedSpellIds: string[];
  hasLoreFamiliar: boolean;
  /** +1 spell: Spell Familiar (Warriors) or Tome of Midnight (Empire) */
  hasExtraSpell: boolean;
  /** Grimoire of Ogvold: wizard knows ALL spells from their chosen lore */
  hasGrimoire: boolean;
  /** Extra lore keys added by items: Heartwood Pendant (lore_of_the_wilds),
   *  Goretooth (lore_of_primal_magic) */
  extraLores: string[];
}

/** Build the initial WizardSetup for a wizard unit */
export function initWizardSetup(unit: Unit): WizardSetup {
  const lores = unit.magic?.lores ?? [];
  return {
    unitId: unit.id,
    unitName: unit.name,
    wizardLevel: unit.magic?.wizard_level ?? 1,
    availableLores: lores,
    selectedLore: lores[0] ?? '',
    selectedSpellIds: [],
    hasLoreFamiliar: false,
    hasExtraSpell: false,
    hasGrimoire: false,
    extraLores: [],
  };
}
