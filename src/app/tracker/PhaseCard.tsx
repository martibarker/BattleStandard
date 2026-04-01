import { useGameStore, type GamePhase, type PlayerSide } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';
import type { Unit } from '../../types/faction';
import StartOfTurnPanel from './StartOfTurnPanel';

interface Prompt {
  id: string;
  title: string;
  description?: string;
  category: 'required' | 'reminder' | 'optional';
}

export default function PhaseCard() {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const currentSide = useGameStore((s) => s.currentSide);
  const players = useGameStore((s) => s.players);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const gameLengthRule = useGameStore((s) => s.gameLengthRule);
  const turnLimit = useGameStore((s) => s.turnLimit);
  const armies = useArmyStore((s) => s.armies);

  const player = players[currentSide];
  const faction = player.factionId ? getFaction(player.factionId) : null;
  const army = player.armyListId ? armies.find((a) => a.id === player.armyListId) : null;

  // Generate prompts for current phase
  const prompts = generatePrompts(
    currentPhase,
    currentSide,
    currentTurn,
    gameLengthRule,
    turnLimit,
    player,
    faction,
    army?.entries ?? []
  );

  const phaseLabel = formatPhaseLabel(currentPhase);
  const isSetup = currentPhase === 'setup';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Turn/Phase/Side */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Turn {currentTurn} / {currentTurn === turnLimit ? 'Final' : `of ${turnLimit}`}
            </p>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              {phaseLabel}
            </h1>
            <p className="text-lg mt-2" style={{ color: 'var(--color-accent-amber)' }}>
              {player.name}
              {player.isAttacker && ' (Attacker)'}
              {!player.isAttacker && ' (Defender)'}
            </p>
          </div>

          {/* Skip/Advance Button */}
          {!isSetup && (
            <button
              onClick={advancePhase}
              className="px-6 py-3 rounded font-semibold text-base"
              style={{
                backgroundColor: 'var(--color-accent-amber)',
                color: 'var(--color-bg-dark)',
              }}
            >
              {currentTurn === 6 && currentPhase === 'end_of_turn' ? 'End Game' : 'Next Phase'}
            </button>
          )}
        </div>
      </div>

      {/* Start of Turn: interactive checklist replaces generic prompts */}
      {currentPhase === 'start_of_turn' ? (
        <StartOfTurnPanel />
      ) : prompts.length > 0 ? (
        <div className="space-y-4 mb-6">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded border p-4"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor:
                  prompt.category === 'required'
                    ? 'var(--color-accent-amber)'
                    : 'var(--color-border)',
                borderLeftWidth: prompt.category === 'required' ? '4px' : '1px',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-1 flex-shrink-0"
                  style={{
                    color: promptColor(prompt.category),
                    fontSize: '18px',
                  }}
                >
                  {prompt.category === 'required' && '⚠'}
                  {prompt.category === 'reminder' && '📌'}
                  {prompt.category === 'optional' && '→'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{prompt.title}</h3>
                  {prompt.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {prompt.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded border p-4 mb-6"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <p className="text-sm">No phase actions required.</p>
        </div>
      )}

      {/* Phase Description */}
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {phaseDescription(currentPhase)}
        </p>
      </div>
    </div>
  );
}

function formatPhaseLabel(phase: GamePhase): string {
  return (
    {
      setup: 'Setup',
      start_of_turn: 'Start of Turn',
      movement: 'Movement',
      shooting: 'Shooting',
      magic: 'Magic',
      combat: 'Combat',
      end_of_turn: 'End of Turn',
    } as Record<GamePhase, string>
  )[phase];
}

function phaseDescription(phase: GamePhase): string {
  return (
    {
      setup: 'Set up your armies on the battlefield.',
      start_of_turn:
        'Resolve any mandatory effects at the start of the turn (stupidity, rallying, ambushers, etc.).',
      movement: 'Move your units. Declare charges.',
      shooting: 'Units with ranged weapons shoot at enemies.',
      magic: 'Cast spells from your wizard(s).',
      combat: 'Resolve close combat between units in contact.',
      end_of_turn: 'Check objectives, end-of-turn effects.',
    } as Record<GamePhase, string>
  )[phase];
}

function promptColor(category: 'required' | 'reminder' | 'optional'): string {
  switch (category) {
    case 'required':
      return 'var(--color-accent-amber)';
    case 'reminder':
      return 'var(--color-accent-blue)';
    case 'optional':
      return 'var(--color-text-secondary)';
  }
}

function generatePrompts(
  phase: GamePhase,
  _side: PlayerSide,
  currentTurn: number,
  gameLengthRule: 'standard' | 'random',
  turnLimit: number,
  player: any,
  faction: any,
  entries: any[]
): Prompt[] {
  const prompts: Prompt[] = [];

  // start_of_turn is handled by StartOfTurnPanel — skip prompt generation for it
  if (phase === 'start_of_turn') {
    // Ambusher arrival still shown as a generic prompt alongside the panel
    const ambushers = player.unitStates?.filter((u: any) => u.ambushing && !u.hasArrived) ?? [];
    if (ambushers.length > 0) {
      prompts.push({
        id: 'ambush',
        title: 'Ambusher Arrival Rolls',
        description: `${ambushers.length} ambusher(s) waiting to arrive`,
        category: 'required',
      });
    }
  }

  if (phase === 'movement') {
    // Charges
    prompts.push({
      id: 'charges',
      title: 'Declare Charges',
      description: 'Announce any charge actions',
      category: 'reminder',
    });

    // Compulsory moves
    if (faction) {
      const frenzyUnits = getUnitsWithRule(faction, entries, 'frenzy');
      const randomMoveUnits = getUnitsWithRule(faction, entries, 'random_movement');
      if (frenzyUnits.length > 0 || randomMoveUnits.length > 0) {
        const compNames = [
          ...frenzyUnits.map((u) => u.name),
          ...randomMoveUnits.map((u) => u.name),
        ];
        prompts.push({
          id: 'compulsory',
          title: 'Compulsory Moves',
          description: `${compNames.join(', ')} must move`,
          category: 'required',
        });
      }
    }

    // Ambusher reminder
    const arrivedAmbushers =
      player.unitStates?.filter((u: any) => u.hasArrived && !u.ambushing) ?? [];
    if (arrivedAmbushers.length > 0) {
      prompts.push({
        id: 'ambush-move',
        title: 'Arrived Ambushers',
        description: `${arrivedAmbushers.length} ambusher(s) can now move`,
        category: 'reminder',
      });
    }
  }

  if (phase === 'shooting') {
    // Ranged units checklist reminder
    if (faction) {
      const rangedUnits = faction.units.filter((u: Unit) =>
        entries.some((e) => e.unitId === u.id) &&
        u.weapon_profiles?.some((wp) => wp.range !== 'Combat')
      );
      if (rangedUnits.length > 0) {
        prompts.push({
          id: 'ranged',
          title: 'Ranged Attacks',
          description: `${rangedUnits.length} unit(s) with ranged weapons available`,
          category: 'reminder',
        });
      }
    }

    // Magic missiles
    const missileSpells = player.spells?.filter((s: any) =>
      s.spells.some((sp: { name: string }) => sp.name.toLowerCase().includes('missile'))
    ) ?? [];
    if (missileSpells.length > 0) {
      prompts.push({
        id: 'missiles',
        title: 'Magic Missiles',
        description: `${missileSpells.length} spell(s) with missile effects`,
        category: 'optional',
      });
    }
  }

  if (phase === 'magic') {
    // Unused spells
    const unusedSpells = player.spells?.filter((s: any) => s.spells.length > 0) ?? [];
    if (unusedSpells.length > 0) {
      prompts.push({
        id: 'spells',
        title: 'Cast Spells',
        description: `${unusedSpells.length} wizard(s) with available spells`,
        category: 'reminder',
      });
    } else if (player.spells && player.spells.length > 0) {
      prompts.push({
        id: 'no-spells',
        title: 'No Spells Available',
        description: 'All spells have been cast',
        category: 'optional',
      });
    }
  }

  if (phase === 'combat') {
    // Combat reminder
    const unitsInCombat = player.unitStates?.filter((u: any) => !u.hasFought) ?? [];
    if (unitsInCombat.length > 0) {
      prompts.push({
        id: 'combat',
        title: 'Resolve Close Combat',
        description: `${unitsInCombat.length} unit(s) not yet fought`,
        category: 'reminder',
      });
    }
  }

  if (phase === 'end_of_turn') {
    // Random game length roll at turn 5
    if (gameLengthRule === 'random' && currentTurn === 5) {
      prompts.push({
        id: 'random-length-roll',
        title: 'Random Game Length Roll',
        description: 'Roll a d6: 1-3 = game ends, 4-5 = turn 6, 6 = turn 7. Inform your opponent of the result.',
        category: 'required',
      });
    }

    // Game turn limit check
    if (currentTurn === turnLimit) {
      prompts.push({
        id: 'final-turn',
        title: 'Final Turn',
        description: 'This is the last turn. After this phase, the game ends.',
        category: 'required',
      });
    }
  }

  return prompts;
}

function getUnitsWithRule(faction: any, entries: any[], ruleId: string): Unit[] {
  return faction.units.filter((u: Unit) =>
    entries.some((e) => e.unitId === u.id) && u.special_rules.includes(ruleId)
  );
}
