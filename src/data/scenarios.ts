/**
 * Matched Play scenarios from Warhammer: The Old World Matched Play Guide.
 * Data sourced from the official PDF (scenarios 1–6, pp. 19–31).
 */

export type GameLengthOption = 'standard' | 'random' | 'break_point';

export interface ScenarioSpecialRule {
  name: string;
  description: string;
}

export interface ScenarioData {
  id: string;
  number: number;
  name: string;
  flavour: string;
  setup: string;
  deployment: string;
  gameLengths: GameLengthOption[];
  specialRules: ScenarioSpecialRule[];
  /** Secondary objective IDs that are required for this scenario */
  mandatorySecondaries: string[];
  /** Secondary objective IDs that may optionally be added */
  optionalSecondaries: string[];
  /** Key for the deployment zone diagram renderer */
  diagramType: 'standard' | 'king_of_hill' | 'diagonal' | 'close_quarters' | 'chance_encounter' | 'encirclement';
}

export const SCENARIOS: ScenarioData[] = [
  {
    id: 'upon_the_field_of_glory',
    number: 1,
    name: 'Upon the Field of Glory',
    flavour:
      'As two rival forces manoeuvre into position, an obvious battleground forms between them. ' +
      'With both armies able to bring their full strength to bear, the day will be won through skill at arms, ' +
      'unyielding courage and the wit of cunning Generals.',
    setup:
      'If the tables have been set up by the organiser, move straight to deployment. ' +
      'If the players are setting up the terrain, place and scatter terrain as described in the Warhammer: The Old World Matched Play Guide.',
    deployment:
      'Winner of a roll-off chooses their deployment zone (A or B). Winner deploys their first unit first. ' +
      'Players deploy using the alternating units method (Matched Play Guide, p.17). ' +
      'Deployment zone A: full-width band, 12″ deep along the top long edge. ' +
      'Deployment zone B: full-width band, 12″ deep along the bottom long edge.',
    gameLengths: ['standard', 'random', 'break_point'],
    specialRules: [],
    mandatorySecondaries: [],
    optionalSecondaries: [
      'baggage_trains', 'special_feature', 'domination',
      'strategic_locations_2', 'strategic_locations_3', 'strategic_locations_4',
    ],
    diagramType: 'standard',
  },
  {
    id: 'king_of_the_hill',
    number: 2,
    name: 'King of the Hill',
    flavour:
      'Not only does controlling high ground give a commanding view of the battlefield, ' +
      'a strategically located hill can make for an easily defensible base of operations, ' +
      'one that can become an all but unassailable position.',
    setup:
      'If the tables have been set up by the organiser, move straight to deployment. ' +
      'Otherwise place and scatter terrain as described in the Warhammer: The Old World Matched Play Guide. ' +
      'In either case, place a single large hill (no more than 12″×18″) in the centre of the battlefield. ' +
      'Once placed, this hill does not scatter.',
    deployment:
      'Winner of a roll-off chooses their deployment zone (A or B). Winner deploys their first unit first. ' +
      'Zone A: 10″ deep band along the top long edge, with 8″ gaps at each short edge. ' +
      'Zone B: 10″ deep band along the bottom long edge, with 8″ gaps at each short edge.',
    gameLengths: ['random', 'break_point'],
    specialRules: [
      {
        name: 'The Hill',
        description:
          'Controlled at the end of each player\'s turn by the closest Core unit within 9″ of the centre (US 10+, not fleeing, not Stupid). ' +
          'If two or more eligible units are equally close, the unit with higher Unit Strength controls it. ' +
          'If two or more eligible enemy units are equally close and have the same Unit Strength, the hill is contested.',
      },
      {
        name: 'Running Up-hill',
        description: 'Vanguard moves cannot be made in this scenario.',
      },
      {
        name: 'Victory Points',
        description: 'The player who controls the hill at the end of each player\'s turn earns a bonus of 100 VP.',
      },
    ],
    mandatorySecondaries: [],
    optionalSecondaries: ['baggage_trains', 'special_feature'],
    diagramType: 'king_of_hill',
  },
  {
    id: 'drawn_battlelines',
    number: 3,
    name: 'Drawn Battlelines',
    flavour:
      'When absolute victory or defeat rests on the outcome of a single battle, Generals can be lured into ' +
      'drawing battlelines and joining the fight before their armies have fully mustered. ' +
      'Those committed to battle must hope reinforcements arrive in a timely manner.',
    setup:
      'If the tables have been set up by the organiser, move straight to deployment. ' +
      'Otherwise place and scatter terrain as described in the Warhammer: The Old World Matched Play Guide.',
    deployment:
      'Winner of a roll-off chooses their diagonal deployment zone (A or B). ' +
      'Before deploying, each player rolls a D6 — if either player rolls a 1, both players must choose one unit ' +
      '(infantry or cavalry) to hold in reserve. Winner deploys their first unit first.',
    gameLengths: ['standard', 'random'],
    specialRules: [
      {
        name: 'Reserves',
        description:
          'Units held in reserve can enter play during the Compulsory Moves sub-phase of any turn of their ' +
          'controlling player\'s choosing (other than the first). They enter from any point on a battlefield edge ' +
          'within their deployment zone. Characters may join a unit being held in reserve, provided they join that unit.',
      },
    ],
    mandatorySecondaries: ['strategic_locations_3'],
    optionalSecondaries: ['domination', 'baggage_trains'],
    diagramType: 'diagonal',
  },
  {
    id: 'close_quarters',
    number: 4,
    name: 'Close Quarters',
    flavour:
      'Countless are the vicious and bloody battles fought in the narrow mountain passes of the Old World, ' +
      'where armies are forced to meet one another head-on. With little room to manoeuvre and retreat a perilous ' +
      'option, grim-faced warriors clash to the ringing of steel and echoing battlecries.',
    setup:
      'If the tables have been set up by the organiser, move straight to deployment. ' +
      'Otherwise place and scatter terrain as described in the Warhammer: The Old World Matched Play Guide.',
    deployment:
      'Winner of a roll-off chooses their deployment zone (A or B). Winner deploys their first unit first. ' +
      'Zone A: 12″ deep band along the top long edge, with 6″ gaps at each short edge. ' +
      'Zone B: 12″ deep band along the bottom long edge, with 6″ gaps at each short edge.',
    gameLengths: ['standard', 'break_point'],
    specialRules: [
      {
        name: 'Bottleneck',
        description:
          'The battle is fought in a narrow mountain pass enclosed by high cliffs. ' +
          'The short battlefield edges count as impassable terrain — no units (including fleeing units or those arriving ' +
          'from reserve) can leave or enter via either short edge, unless they have the Ethereal or Fly (X) special rule.',
      },
    ],
    mandatorySecondaries: ['strategic_locations_2'],
    optionalSecondaries: ['domination'],
    diagramType: 'close_quarters',
  },
  {
    id: 'a_chance_encounter',
    number: 5,
    name: 'A Chance Encounter',
    flavour:
      'Either by luck, misfortune or wild circumstance, two enemy armies stumble into one another in the fog of war. ' +
      'Both forces scramble to prepare for battle and defend their supply lines, eager to seize upon the chance to ' +
      'deal a significant blow if they can marshal their forces in time.',
    setup:
      'If the tables have been set up by the organiser, move straight to deployment. ' +
      'Otherwise place and scatter terrain as described in the Warhammer: The Old World Matched Play Guide.',
    deployment:
      'Winner of a roll-off chooses from zones A1, A2, B1 or B2. ' +
      'If they choose an A zone, their opponent uses the opposite A zone. If they choose a B zone, their opponent uses the opposite B zone. ' +
      'Winner deploys their first unit first. No units may deploy within 18″ of the centre of the battlefield.',
    gameLengths: ['random', 'break_point'],
    specialRules: [],
    mandatorySecondaries: ['special_feature'],
    optionalSecondaries: ['domination', 'baggage_trains'],
    diagramType: 'chance_encounter',
  },
  {
    id: 'encirclement',
    number: 6,
    name: 'Encirclement',
    flavour:
      'Whilst many Generals believe that glory can be won by driving through the heart of the enemy, others will ' +
      'attempt to outflank and encircle their foes, crushing the flanks of the enemy beneath the relentless advance of their army.',
    setup:
      'If the tables have been set up by the organiser, move straight to deployment. ' +
      'Otherwise place and scatter terrain as described in the Warhammer: The Old World Matched Play Guide.',
    deployment:
      'Winner of a roll-off chooses their deployment zone (A or B). Winner deploys their first unit first. ' +
      'Zones are offset: Zone A is a 12″ deep band along the top long edge, stopping 12″ from the right short edge. ' +
      'Zone B is a 12″ deep band along the bottom long edge, starting 12″ from the left short edge.',
    gameLengths: ['standard', 'random'],
    specialRules: [],
    mandatorySecondaries: ['strategic_locations_4'],
    optionalSecondaries: ['baggage_trains', 'special_feature'],
    diagramType: 'encirclement',
  },
];

export function getScenarioById(id: string): ScenarioData | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
