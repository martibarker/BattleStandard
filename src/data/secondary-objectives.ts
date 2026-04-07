/**
 * Secondary Objectives from the Warhammer: The Old World Matched Play Guide.
 * Data sourced exclusively from the official PDF (pp. 28–31).
 *
 * These four objectives are scenario-independent options chosen by the organiser.
 * Any combination may be applied to any scenario.
 */

export interface SecondaryObjective {
  id: string;
  name: string;
  /** One-paragraph summary of the objective rules, suitable for display in setup. */
  description: string;
  /** Short VP summary shown in the card. */
  vpSummary: string;
  /**
   * Default VP amount used by the quick-add scoring button.
   * For multi-value objectives (e.g. Domination) this is the per-unit amount
   * and the player presses the button once per unit scored.
   */
  defaultVp: number;
}

/**
 * The four Secondary Objectives. Strategic Locations appears three times,
 * once for each supported marker count (2, 3, or 4).
 */
export const SECONDARY_OBJECTIVES: SecondaryObjective[] = [
  {
    id: 'baggage_trains',
    name: 'Baggage Trains',
    description:
      'Each player places one baggage train (60×100mm base) wholly within their deployment zone, at least 3″ from any battlefield edge. ' +
      'A Core unit (Unit Strength 10+, not Stupid) within 6″ controls it. ' +
      'A unit with Unit Strength 5+ can destroy the enemy\'s baggage train by moving into base contact during Remaining Moves; ' +
      'if still in contact at the start of their next turn (US 5+, not in combat, not fleeing) it is destroyed.',
    vpSummary: '100 VP (control yours at game end) / 250 VP (destroy the enemy\'s)',
    defaultVp: 100,
  },
  {
    id: 'special_feature',
    name: 'Special Feature',
    description:
      'Place a single terrain piece (max 6″ wide) in the centre of the battlefield before deployment begins (Matched Play Guide, p.16). ' +
      'Controlled each Start of Turn by the closest Core unit (US 10+, not fleeing, not Stupid) within 6″. ' +
      'The controlling player rolls D6 for an Unusual Property that lasts until end of turn: ' +
      '1–2 Magic Resistance (−3); 3–4 Hatred (all enemies); 5–6 Unbreakable.',
    vpSummary: '200 VP (control at game end)',
    defaultVp: 200,
  },
  {
    id: 'domination',
    name: 'Domination',
    description:
      'The battlefield is divided into 4 equal quarters by two lines through the centre. ' +
      'At game end, each player totals the Unit Strength of models completely within each quarter (not counting fleeing). ' +
      'The player with the highest total controls that quarter.',
    vpSummary: '100 VP per quarter (+50 VP if US > 2× enemy; +100 VP if uncontested)',
    defaultVp: 100,
  },
  {
    id: 'strategic_locations_2',
    name: 'Strategic Locations (2 markers)',
    description:
      'Two objective markers (40mm round base) placed on the battlefield: one halfway between the centre and the middle of each long edge. ' +
      'At the end of each player\'s turn, a Core unit (US 10+, not fleeing, not Stupid) within 6″ controls each marker.',
    vpSummary: '30 VP per marker controlled at the end of each player\'s turn',
    defaultVp: 30,
  },
  {
    id: 'strategic_locations_3',
    name: 'Strategic Locations (3 markers)',
    description:
      'Three objective markers (40mm round base): one in the centre and one halfway between the centre and each short edge. ' +
      'At the end of each player\'s turn, a Core unit (US 10+, not fleeing, not Stupid) within 6″ controls each marker.',
    vpSummary: '30 VP per marker controlled at the end of each player\'s turn',
    defaultVp: 30,
  },
  {
    id: 'strategic_locations_4',
    name: 'Strategic Locations (4 markers)',
    description:
      'Four objective markers (40mm round base): one halfway between the centre and the middle of each of the four battlefield edges. ' +
      'At the end of each player\'s turn, a Core unit (US 10+, not fleeing, not Stupid) within 6″ controls each marker.',
    vpSummary: '30 VP per marker controlled at the end of each player\'s turn',
    defaultVp: 30,
  },
];

export function getSecondaryById(id: string): SecondaryObjective | undefined {
  return SECONDARY_OBJECTIVES.find((o) => o.id === id);
}
