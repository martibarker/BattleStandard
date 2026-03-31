/** Secondary objectives from Matched Play Guide */

export type MatchedPlayFormat = 'open_war' | 'grand_melee' | 'combined_arms';

export interface SecondaryObjective {
  id: string;
  name: string;
  description: string;
  vpValue: number;
}

export interface SecondaryObjectiveSet {
  format: MatchedPlayFormat;
  selectionType: 'choose_one' | 'all_three';
  objectives: SecondaryObjective[];
}

export const SECONDARY_OBJECTIVES: SecondaryObjectiveSet[] = [
  {
    format: 'open_war',
    selectionType: 'choose_one',
    objectives: [
      {
        id: 'open_war_first_blood',
        name: 'First Blood',
        description: 'Score 20 VP if you destroy an enemy unit before your opponent destroys one of yours',
        vpValue: 20,
      },
      {
        id: 'open_war_breakthrough',
        name: 'Breakthrough',
        description: 'Score 20 VP if you have units within 12" of the enemy board edge at end of game',
        vpValue: 20,
      },
      {
        id: 'open_war_slay_warlord',
        name: 'Slay the Warlord',
        description: 'Score 20 VP if enemy general is destroyed',
        vpValue: 20,
      },
    ],
  },
  {
    format: 'grand_melee',
    selectionType: 'choose_one',
    objectives: [
      {
        id: 'grand_melee_kingslayer',
        name: 'Kingslayer',
        description: 'Score 20 VP if enemy general is destroyed',
        vpValue: 20,
      },
      {
        id: 'grand_melee_secure_flanks',
        name: 'Secure Flanks',
        description: 'Score 20 VP if you have units within 6" of both board edges at game end',
        vpValue: 20,
      },
      {
        id: 'grand_melee_rear_guard',
        name: 'Rear Guard',
        description: 'Score 20 VP if you have units in enemy deployment zone at game end',
        vpValue: 20,
      },
    ],
  },
  {
    format: 'combined_arms',
    selectionType: 'all_three',
    objectives: [
      {
        id: 'combined_arms_control_center',
        name: 'Control Center',
        description: 'Score 20 VP if you have units closer to the board center than enemy at game end',
        vpValue: 20,
      },
      {
        id: 'combined_arms_dominate_flanks',
        name: 'Dominate Flanks',
        description: 'Score 20 VP if you have units in both enemy flanks (each flank = 6" from table edge) at game end',
        vpValue: 20,
      },
      {
        id: 'combined_arms_break_lines',
        name: 'Break Their Lines',
        description: 'Score 20 VP if you have units within 12" of enemy deployment zone at game end',
        vpValue: 20,
      },
    ],
  },
];

export function getSecondariesForFormat(format: MatchedPlayFormat): SecondaryObjectiveSet | undefined {
  return SECONDARY_OBJECTIVES.find((set) => set.format === format);
}
