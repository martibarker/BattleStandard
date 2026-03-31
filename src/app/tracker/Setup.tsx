import { useState } from 'react';
import { useGameStore, type PlayerGameState } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';
import { isWizard } from '../../utils/armyValidation';
import { getSecondariesForFormat, type MatchedPlayFormat } from '../../data/secondary-objectives';
import type { Faction } from '../../types/faction';

interface SetupState {
  step: 1 | 2 | 3 | 4;
  p1Name: string;
  p2Name: string;
  p1ArmyId: string | null;
  p2ArmyId: string | null;
  p1Faction: Faction | null;
  p2Faction: Faction | null;
  p1Spells: Map<string, string>;
  p2Spells: Map<string, string>;
  p1IsAttacker: boolean;
  p2GoesFirst: boolean;
  gameLengthRule: 'standard' | 'random';
  matchedPlayFormat: MatchedPlayFormat;
  selectedSecondaries: string[];
}

export default function Setup() {
  const startGame = useGameStore((s) => s.startGame);
  const addSpellsToWizard = useGameStore((s) => s.addSpellsToWizard);
  const armies = useArmyStore((s) => s.armies);

  const [state, setState] = useState<SetupState>({
    step: 1,
    p1Name: 'Player 1',
    p2Name: 'Player 2',
    p1ArmyId: null,
    p2ArmyId: null,
    p1Faction: null,
    p2Faction: null,
    p1Spells: new Map(),
    p2Spells: new Map(),
    p1IsAttacker: true,
    p2GoesFirst: false,
    gameLengthRule: 'standard',
    matchedPlayFormat: 'open_war',
    selectedSecondaries: [],
  });

  const handleNext = (): void => {
    if (state.step < 3) {
      setState((s: SetupState) => ({ ...s, step: (s.step + 1) as 1 | 2 | 3 }));
    }
  };

  const handlePrev = (): void => {
    if (state.step > 1) {
      setState((s: SetupState) => ({ ...s, step: (s.step - 1) as 1 | 2 | 3 }));
    }
  };

  const handleStartGame = () => {
    const p1Setup: Partial<PlayerGameState> = {
      name: state.p1Name,
      armyListId: state.p1ArmyId,
      factionId: state.p1Faction?.id ?? null,
      side: 'p1',
      isAttacker: state.p1IsAttacker,
      goesFirst: !state.p2GoesFirst,
    };

    const p2Setup: Partial<PlayerGameState> = {
      name: state.p2Name,
      armyListId: state.p2ArmyId,
      factionId: state.p2Faction?.id ?? null,
      side: 'p2',
      isAttacker: !state.p1IsAttacker,
      goesFirst: state.p2GoesFirst,
    };

    // Start the game with game length rule and secondary objectives
    startGame(p1Setup, p2Setup, state.gameLengthRule, state.selectedSecondaries);

    // Add spells for Player 1
    if (state.p1Faction) {
      for (const [key, spellString] of state.p1Spells) {
        const [unitId, lore] = key.split('-');
        const unit = state.p1Faction.units.find((u) => u.id === unitId);
        if (unit && spellString.trim()) {
          const spellNames = spellString.split(',').map((s) => s.trim()).filter(Boolean);
          addSpellsToWizard('p1', unitId, unit.name, lore, spellNames);
        }
      }
    }

    // Add spells for Player 2
    if (state.p2Faction) {
      for (const [key, spellString] of state.p2Spells) {
        const [unitId, lore] = key.split('-');
        const unit = state.p2Faction.units.find((u) => u.id === unitId);
        if (unit && spellString.trim()) {
          const spellNames = spellString.split(',').map((s) => s.trim()).filter(Boolean);
          addSpellsToWizard('p2', unitId, unit.name, lore, spellNames);
        }
      }
    }
  };

  // --- Step 1: Army Selection ---
  if (state.step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 1: Army Selection
        </h2>

        <div className="space-y-6">
          {/* Player 1 */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label className="block mb-2 text-sm font-semibold">Player 1 Name</label>
            <input
              type="text"
              value={state.p1Name}
              onChange={(e) => setState((s: SetupState) => ({ ...s, p1Name: e.target.value }))}
              className="w-full px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: 'var(--color-bg-dark)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />

            <label className="block mt-4 mb-2 text-sm font-semibold">Player 1 Army</label>
            <select
              value={state.p1ArmyId || ''}
              onChange={(e) => {
                const armyId = e.target.value || null;
                const army = armies.find((a) => a.id === armyId);
                const faction = army ? getFaction(army.factionId) : null;
                setState((s: SetupState) => ({
                  ...s,
                  p1ArmyId: armyId,
                  p1Faction: faction ?? null,
                }));
              }}
              className="w-full px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: 'var(--color-bg-dark)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">— Continue without army list —</option>
              {armies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label className="block mb-2 text-sm font-semibold">Player 2 Name</label>
            <input
              type="text"
              value={state.p2Name}
              onChange={(e) => setState((s: SetupState) => ({ ...s, p2Name: e.target.value }))}
              className="w-full px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: 'var(--color-bg-dark)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />

            <label className="block mt-4 mb-2 text-sm font-semibold">Player 2 Army</label>
            <select
              value={state.p2ArmyId || ''}
              onChange={(e) => {
                const armyId = e.target.value || null;
                const army = armies.find((a) => a.id === armyId);
                const faction = army ? getFaction(army.factionId) : null;
                setState((s: SetupState) => ({
                  ...s,
                  p2ArmyId: armyId,
                  p2Faction: faction ?? null,
                }));
              }}
              className="w-full px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: 'var(--color-bg-dark)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="">— Continue without army list —</option>
              {armies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-accent-amber)',
                color: 'var(--color-bg-dark)',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2: Spell Rolling (if armies selected) ---
  if (state.step === 2) {
    const p1HasWizards = state.p1Faction?.units.filter(isWizard) ?? [];
    const p2HasWizards = state.p2Faction?.units.filter(isWizard) ?? [];
    const hasAnySorcery = p1HasWizards.length > 0 || p2HasWizards.length > 0;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 2: Spell Rolling
        </h2>

        {!hasAnySorcery && (
          <div
            className="rounded border p-4 mb-6"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p className="text-sm">No wizards in selected armies. Click Next to continue.</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Player 1 Spells */}
          {p1HasWizards.length > 0 && (
            <div
              className="rounded border p-4"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p1Name} — Spells
              </h3>
              <div className="space-y-4">
                {p1HasWizards.map((unit) => (
                  <div key={unit.id}>
                    <label className="block text-sm font-semibold mb-2">{unit.name}</label>
                    <div className="space-y-2">
                      {unit.magic?.lores?.map((lore) => (
                        <div key={`${unit.id}-${lore}`}>
                          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {lore}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Spell One, Spell Two"
                            value={state.p1Spells.get(`${unit.id}-${lore}`) || ''}
                            onChange={(e) => {
                              const key = `${unit.id}-${lore}`;
                              const newSpells = new Map(state.p1Spells);
                              if (e.target.value) {
                                newSpells.set(key, e.target.value);
                              } else {
                                newSpells.delete(key);
                              }
                              setState((s: SetupState) => ({ ...s, p1Spells: newSpells }));
                            }}
                            className="w-full px-3 py-2 rounded text-sm"
                            style={{
                              backgroundColor: 'var(--color-bg-dark)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-primary)',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player 2 Spells */}
          {p2HasWizards.length > 0 && (
            <div
              className="rounded border p-4"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p2Name} — Spells
              </h3>
              <div className="space-y-4">
                {p2HasWizards.map((unit) => (
                  <div key={unit.id}>
                    <label className="block text-sm font-semibold mb-2">{unit.name}</label>
                    <div className="space-y-2">
                      {unit.magic?.lores?.map((lore) => (
                        <div key={`${unit.id}-${lore}`}>
                          <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {lore}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Spell One, Spell Two"
                            value={state.p2Spells.get(`${unit.id}-${lore}`) || ''}
                            onChange={(e) => {
                              const key = `${unit.id}-${lore}`;
                              const newSpells = new Map(state.p2Spells);
                              if (e.target.value) {
                                newSpells.set(key, e.target.value);
                              } else {
                                newSpells.delete(key);
                              }
                              setState((s: SetupState) => ({ ...s, p2Spells: newSpells }));
                            }}
                            className="w-full px-3 py-2 rounded text-sm"
                            style={{
                              backgroundColor: 'var(--color-bg-dark)',
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-primary)',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6 justify-between">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)',
              }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-accent-amber)',
                color: 'var(--color-bg-dark)',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 3: Initiative ---
  if (state.step === 3) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 3: Initiative & Setup
        </h2>

        <div className="space-y-6">
          {/* Attacker / Defender */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label className="block mb-4 text-sm font-semibold">Attacker / Defender</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attacker"
                  checked={state.p1IsAttacker}
                  onChange={() => setState((s: SetupState) => ({ ...s, p1IsAttacker: true }))}
                />
                <span className="text-sm">{state.p1Name} is Attacker</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attacker"
                  checked={!state.p1IsAttacker}
                  onChange={() => setState((s: SetupState) => ({ ...s, p1IsAttacker: false }))}
                />
                <span className="text-sm">{state.p1Name} is Defender</span>
              </label>
            </div>
          </div>

          {/* Who goes first */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label className="block mb-4 text-sm font-semibold">Who goes first?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="first"
                  checked={!state.p2GoesFirst}
                  onChange={() => setState((s: SetupState) => ({ ...s, p2GoesFirst: false }))}
                />
                <span className="text-sm">{state.p1Name}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="first"
                  checked={state.p2GoesFirst}
                  onChange={() => setState((s: SetupState) => ({ ...s, p2GoesFirst: true }))}
                />
                <span className="text-sm">{state.p2Name}</span>
              </label>
            </div>
          </div>

          {/* Game Length Rule */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label className="block mb-4 text-sm font-semibold">Game Length</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="game-length"
                  checked={state.gameLengthRule === 'standard'}
                  onChange={() => setState((s: SetupState) => ({ ...s, gameLengthRule: 'standard' }))}
                />
                <span className="text-sm">
                  Standard (6 turns)
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85em', marginLeft: '4px' }}>
                    — Fixed game length
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="game-length"
                  checked={state.gameLengthRule === 'random'}
                  onChange={() => setState((s: SetupState) => ({ ...s, gameLengthRule: 'random' }))}
                />
                <span className="text-sm">
                  Random (5-7 turns)
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85em', marginLeft: '4px' }}>
                    — Roll d6 at turn 5
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Turn Order Summary */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p className="text-sm">
              <strong>Turn 1:</strong> {state.p2GoesFirst ? state.p2Name : state.p1Name} moves first
            </p>
            <p className="text-sm mt-2">
              <strong>Roles:</strong> {state.p1IsAttacker ? state.p1Name : state.p2Name} (Attacker),{' '}
              {state.p1IsAttacker ? state.p2Name : state.p1Name} (Defender)
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6 justify-between">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)',
              }}
            >
              Back
            </button>
            <button
              onClick={handleStartGame}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-accent-amber)',
                color: 'var(--color-bg-dark)',
              }}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 4: Secondary Objectives ---
  if (state.step === 4) {
    const secondarySet = getSecondariesForFormat(state.matchedPlayFormat);
    const isMultiSelect = secondarySet?.selectionType === 'all_three';

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 4: Secondary Objectives
        </h2>

        <div className="space-y-6">
          {/* Format Selection */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label className="block mb-4 text-sm font-semibold">Matched Play Format</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={state.matchedPlayFormat === 'open_war'}
                  onChange={() => {
                    setState((s: SetupState) => ({
                      ...s,
                      matchedPlayFormat: 'open_war',
                      selectedSecondaries: [],
                    }));
                  }}
                />
                <span className="text-sm font-semibold">Open War</span>
                <span
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.85em',
                    marginLeft: '4px',
                  }}
                >
                  — Choose 1 secondary
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={state.matchedPlayFormat === 'grand_melee'}
                  onChange={() => {
                    setState((s: SetupState) => ({
                      ...s,
                      matchedPlayFormat: 'grand_melee',
                      selectedSecondaries: [],
                    }));
                  }}
                />
                <span className="text-sm font-semibold">Grand Melee</span>
                <span
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.85em',
                    marginLeft: '4px',
                  }}
                >
                  — Choose 1 secondary
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={state.matchedPlayFormat === 'combined_arms'}
                  onChange={() => {
                    setState((s: SetupState) => ({
                      ...s,
                      matchedPlayFormat: 'combined_arms',
                      selectedSecondaries: getSecondariesForFormat('combined_arms')?.objectives.map((o) => o.id) ?? [],
                    }));
                  }}
                />
                <span className="text-sm font-semibold">Combined Arms</span>
                <span
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.85em',
                    marginLeft: '4px',
                  }}
                >
                  — All 3 secondaries
                </span>
              </label>
            </div>
          </div>

          {/* Secondary Objectives Selection */}
          {secondarySet && (
            <div
              className="rounded border p-4"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <label className="block mb-4 text-sm font-semibold">
                {isMultiSelect
                  ? 'Secondary Objectives (All Active)'
                  : 'Secondary Objectives (Choose One)'}
              </label>
              <div className="space-y-3">
                {secondarySet.objectives.map((obj) => (
                  <label
                    key={obj.id}
                    className="block p-3 rounded cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: 'var(--color-bg-dark)',
                      borderColor: 'var(--color-border)',
                      borderLeft:
                        state.selectedSecondaries.includes(obj.id) ?
                          '3px solid var(--color-accent-amber)' :
                          '3px solid transparent',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type={isMultiSelect ? 'checkbox' : 'radio'}
                        name="secondary"
                        checked={state.selectedSecondaries.includes(obj.id)}
                        onChange={() => {
                          if (isMultiSelect) {
                            // Toggle checkbox
                            setState((s: SetupState) => ({
                              ...s,
                              selectedSecondaries: s.selectedSecondaries.includes(obj.id)
                                ? s.selectedSecondaries.filter((id) => id !== obj.id)
                                : [...s.selectedSecondaries, obj.id],
                            }));
                          } else {
                            // Radio button - only one can be selected
                            setState((s: SetupState) => ({
                              ...s,
                              selectedSecondaries: [obj.id],
                            }));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{obj.name}</div>
                        <div
                          className="text-xs mt-1"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {obj.description}
                        </div>
                        <div
                          className="text-xs font-semibold mt-2"
                          style={{ color: 'var(--color-accent-amber)' }}
                        >
                          {obj.vpValue} VP
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: 'var(--color-bg-dark)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p className="text-sm">
              <strong>Format:</strong> {state.matchedPlayFormat === 'open_war' ? 'Open War' : state.matchedPlayFormat === 'grand_melee' ? 'Grand Melee' : 'Combined Arms'}
            </p>
            <p className="text-sm mt-2">
              <strong>Selected Secondaries:</strong>{' '}
              {state.selectedSecondaries.length === 0
                ? 'None yet'
                : state.selectedSecondaries.length === 1
                  ? '1 secondary'
                  : `${state.selectedSecondaries.length} secondaries`}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6 justify-between">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)',
              }}
            >
              Back
            </button>
            <button
              onClick={handleStartGame}
              disabled={state.selectedSecondaries.length === 0}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={{
                backgroundColor:
                  state.selectedSecondaries.length === 0
                    ? 'var(--color-text-secondary)'
                    : 'var(--color-accent-amber)',
                color: 'var(--color-bg-dark)',
                opacity: state.selectedSecondaries.length === 0 ? 0.5 : 1,
                cursor: state.selectedSecondaries.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
