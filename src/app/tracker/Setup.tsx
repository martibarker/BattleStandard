import { useState } from 'react';
import { useGameStore, type PlayerGameState } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';
import { isWizard } from '../../utils/armyValidation';
import { getSecondariesForFormat, type MatchedPlayFormat } from '../../data/secondary-objectives';
import type { Faction, Unit } from '../../types/faction';

interface ManualCaster {
  casterName: string;
  lore: string;
  spells: string;
}

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
  p1ManualCasters: ManualCaster[];
  p2ManualCasters: ManualCaster[];
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
    p1ManualCasters: [],
    p2ManualCasters: [],
    p1IsAttacker: true,
    p2GoesFirst: false,
    gameLengthRule: 'standard',
    matchedPlayFormat: 'open_war',
    selectedSecondaries: [],
  });

  const handleNext = (): void => {
    if (state.step < 4) {
      setState((s: SetupState) => ({ ...s, step: (s.step + 1) as 1 | 2 | 3 | 4 }));
    }
  };

  const handlePrev = (): void => {
    if (state.step > 1) {
      setState((s: SetupState) => ({ ...s, step: (s.step - 1) as 1 | 2 | 3 | 4 }));
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

    startGame(p1Setup, p2Setup, state.gameLengthRule, state.selectedSecondaries);

    // Spells from linked army wizards
    if (state.p1Faction) {
      for (const [key, spellString] of state.p1Spells) {
        const [unitId, lore] = key.split('-');
        const unit = state.p1Faction.units.find((u) => u.id === unitId);
        if (unit && spellString.trim()) {
          const entries = spellString.split(',').map((s) => s.trim()).filter(Boolean)
            .map((name) => ({ name, isAssailment: false }));
          addSpellsToWizard('p1', unitId, unit.name, lore, entries);
        }
      }
    }
    if (state.p2Faction) {
      for (const [key, spellString] of state.p2Spells) {
        const [unitId, lore] = key.split('-');
        const unit = state.p2Faction.units.find((u) => u.id === unitId);
        if (unit && spellString.trim()) {
          const entries = spellString.split(',').map((s) => s.trim()).filter(Boolean)
            .map((name) => ({ name, isAssailment: false }));
          addSpellsToWizard('p2', unitId, unit.name, lore, entries);
        }
      }
    }

    // Manually entered casters (when no army list linked)
    state.p1ManualCasters.forEach((caster, idx) => {
      if (!caster.casterName.trim() && !caster.spells.trim()) return;
      const entries = caster.spells.split(',').map((s) => s.trim()).filter(Boolean)
        .map((name) => ({ name, isAssailment: false }));
      if (entries.length > 0) {
        addSpellsToWizard(
          'p1',
          `manual_p1_${idx}`,
          caster.casterName.trim() || `${state.p1Name} Caster ${idx + 1}`,
          caster.lore.trim() || 'Manual',
          entries
        );
      }
    });
    state.p2ManualCasters.forEach((caster, idx) => {
      if (!caster.casterName.trim() && !caster.spells.trim()) return;
      const entries = caster.spells.split(',').map((s) => s.trim()).filter(Boolean)
        .map((name) => ({ name, isAssailment: false }));
      if (entries.length > 0) {
        addSpellsToWizard(
          'p2',
          `manual_p2_${idx}`,
          caster.casterName.trim() || `${state.p2Name} Caster ${idx + 1}`,
          caster.lore.trim() || 'Manual',
          entries
        );
      }
    });
  };

  // --- Shared styles ---
  const cardStyle = {
    backgroundColor: 'var(--color-bg-elevated)',
    borderColor: 'var(--color-border)',
  } as const;

  const inputStyle = {
    backgroundColor: 'var(--color-bg-dark)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  } as const;

  const btnPrimary = {
    backgroundColor: 'var(--color-accent-amber)',
    color: 'var(--color-bg-dark)',
  } as const;

  const btnSecondary = {
    backgroundColor: 'var(--color-bg-elevated)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  } as const;

  // --- Step 1: Army Selection ---
  if (state.step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 1: Army Selection
        </h2>

        <div className="space-y-6">
          {(['p1', 'p2'] as const).map((side) => {
            const nameKey = side === 'p1' ? 'p1Name' : 'p2Name';
            const armyIdKey = side === 'p1' ? 'p1ArmyId' : 'p2ArmyId';
            const name = state[nameKey];
            const armyId = state[armyIdKey];

            return (
              <div key={side} className="rounded border p-4" style={cardStyle}>
                <label className="block mb-2 text-sm font-semibold">
                  {side === 'p1' ? 'Player 1' : 'Player 2'} Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setState((s) => ({ ...s, [nameKey]: e.target.value }))}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={inputStyle}
                />

                <label className="block mt-4 mb-2 text-sm font-semibold">
                  {side === 'p1' ? 'Player 1' : 'Player 2'} Army
                </label>
                <select
                  value={armyId || ''}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    const army = armies.find((a) => a.id === id);
                    const faction = army ? getFaction(army.factionId) : null;
                    const factionKey = side === 'p1' ? 'p1Faction' : 'p2Faction';
                    setState((s) => ({ ...s, [armyIdKey]: id, [factionKey]: faction ?? null }));
                  }}
                  className="w-full px-3 py-2 rounded text-sm"
                  style={inputStyle}
                >
                  <option value="">— Continue without army list —</option>
                  {armies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <div className="flex justify-end mt-6">
            <button onClick={handleNext} className="px-4 py-2 rounded text-sm font-semibold" style={btnPrimary}>
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2: Spell Rolling ---
  if (state.step === 2) {
    const p1Wizards = state.p1Faction?.units.filter(isWizard) ?? [];
    const p2Wizards = state.p2Faction?.units.filter(isWizard) ?? [];

    const renderWizardInputs = (
      side: 'p1' | 'p2',
      wizards: Unit[],
      spellMap: Map<string, string>
    ) => (
      <div className="space-y-4">
        {wizards.map((unit) => (
          <div key={unit.id}>
            <label className="block text-sm font-semibold mb-2">{unit.name}</label>
            <div className="space-y-2">
              {unit.magic?.lores?.map((lore: string) => {
                const key = `${unit.id}-${lore}`;
                return (
                  <div key={key}>
                    <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {lore}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fireball, Wall of Fire"
                      value={spellMap.get(key) || ''}
                      onChange={(e) => {
                        const mapKey = side === 'p1' ? 'p1Spells' : 'p2Spells';
                        setState((s) => {
                          const newMap = new Map(s[mapKey]);
                          if (e.target.value) newMap.set(key, e.target.value);
                          else newMap.delete(key);
                          return { ...s, [mapKey]: newMap };
                        });
                      }}
                      className="w-full px-3 py-2 rounded text-sm mt-1"
                      style={inputStyle}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );

    const renderManualCasters = (side: 'p1' | 'p2', playerName: string) => {
      const castersKey = side === 'p1' ? 'p1ManualCasters' : 'p2ManualCasters';
      const casters = state[castersKey];
      return (
        <div
          className="rounded border p-4"
          style={cardStyle}
        >
          <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            {playerName} — Manual Casters
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            No army list linked. Add spellcasters manually.
          </p>

          {casters.length === 0 && (
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              No casters added yet.
            </p>
          )}

          <div className="space-y-4">
            {casters.map((caster, idx) => (
              <div
                key={idx}
                className="rounded p-3 space-y-2"
                style={{ backgroundColor: 'var(--color-bg-dark)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-accent-amber)' }}>
                    Caster {idx + 1}
                  </span>
                  <button
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        [castersKey]: s[castersKey].filter((_, i) => i !== idx),
                      }))
                    }
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-elevated)' }}
                  >
                    Remove
                  </button>
                </div>

                <div>
                  <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Caster name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Archmage"
                    value={caster.casterName}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        [castersKey]: s[castersKey].map((c, i) =>
                          i === idx ? { ...c, casterName: e.target.value } : c
                        ),
                      }))
                    }
                    className="w-full px-3 py-2 rounded text-sm mt-1"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Lore of magic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lore of Fire"
                    value={caster.lore}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        [castersKey]: s[castersKey].map((c, i) =>
                          i === idx ? { ...c, lore: e.target.value } : c
                        ),
                      }))
                    }
                    className="w-full px-3 py-2 rounded text-sm mt-1"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Spells (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fireball, Wall of Fire"
                    value={caster.spells}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        [castersKey]: s[castersKey].map((c, i) =>
                          i === idx ? { ...c, spells: e.target.value } : c
                        ),
                      }))
                    }
                    className="w-full px-3 py-2 rounded text-sm mt-1"
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              setState((s) => ({
                ...s,
                [castersKey]: [...s[castersKey], { casterName: '', lore: '', spells: '' }],
              }))
            }
            className="mt-3 w-full px-3 py-2 rounded text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-accent-blue)', border: '1px solid var(--color-border)' }}
          >
            + Add Caster
          </button>
        </div>
      );
    };

    const hasAnyContent =
      p1Wizards.length > 0 || p2Wizards.length > 0 ||
      !state.p1Faction || !state.p2Faction;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 2: Spell Rolling
        </h2>

        {!hasAnyContent && (
          <div className="rounded border p-4 mb-6" style={{ ...cardStyle, color: 'var(--color-text-secondary)' }}>
            <p className="text-sm">No wizards in selected armies. Click Next to continue.</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Player 1: army wizard spells OR manual entry */}
          {p1Wizards.length > 0 ? (
            <div className="rounded border p-4" style={cardStyle}>
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p1Name} — Spells
              </h3>
              {renderWizardInputs('p1', p1Wizards, state.p1Spells)}
            </div>
          ) : !state.p1Faction ? (
            renderManualCasters('p1', state.p1Name)
          ) : null}

          {/* Player 2: army wizard spells OR manual entry */}
          {p2Wizards.length > 0 ? (
            <div className="rounded border p-4" style={cardStyle}>
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p2Name} — Spells
              </h3>
              {renderWizardInputs('p2', p2Wizards, state.p2Spells)}
            </div>
          ) : !state.p2Faction ? (
            renderManualCasters('p2', state.p2Name)
          ) : null}

          <div className="flex gap-3 mt-6 justify-between">
            <button onClick={handlePrev} className="px-4 py-2 rounded text-sm font-semibold" style={btnSecondary}>
              Back
            </button>
            <button onClick={handleNext} className="px-4 py-2 rounded text-sm font-semibold" style={btnPrimary}>
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Step 3: Initiative & Setup ---
  if (state.step === 3) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 3: Initiative & Setup
        </h2>

        <div className="space-y-6">
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-4 text-sm font-semibold">Attacker / Defender</label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attacker"
                  checked={state.p1IsAttacker}
                  onChange={() => setState((s) => ({ ...s, p1IsAttacker: true }))}
                />
                <span className="text-sm">{state.p1Name} is Attacker</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attacker"
                  checked={!state.p1IsAttacker}
                  onChange={() => setState((s) => ({ ...s, p1IsAttacker: false }))}
                />
                <span className="text-sm">{state.p1Name} is Defender</span>
              </label>
            </div>
          </div>

          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-4 text-sm font-semibold">Who goes first?</label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="first"
                  checked={!state.p2GoesFirst}
                  onChange={() => setState((s) => ({ ...s, p2GoesFirst: false }))}
                />
                <span className="text-sm">{state.p1Name}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="first"
                  checked={state.p2GoesFirst}
                  onChange={() => setState((s) => ({ ...s, p2GoesFirst: true }))}
                />
                <span className="text-sm">{state.p2Name}</span>
              </label>
            </div>
          </div>

          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-4 text-sm font-semibold">Game Length</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="game-length"
                  checked={state.gameLengthRule === 'standard'}
                  onChange={() => setState((s) => ({ ...s, gameLengthRule: 'standard' }))}
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
                  onChange={() => setState((s) => ({ ...s, gameLengthRule: 'random' }))}
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

          <div className="rounded border p-4" style={{ ...cardStyle, color: 'var(--color-text-secondary)' }}>
            <p className="text-sm">
              <strong>Turn 1:</strong> {state.p2GoesFirst ? state.p2Name : state.p1Name} moves first
            </p>
            <p className="text-sm mt-2">
              <strong>Roles:</strong> {state.p1IsAttacker ? state.p1Name : state.p2Name} (Attacker),{' '}
              {state.p1IsAttacker ? state.p2Name : state.p1Name} (Defender)
            </p>
          </div>

          <div className="flex gap-3 mt-6 justify-between">
            <button onClick={handlePrev} className="px-4 py-2 rounded text-sm font-semibold" style={btnSecondary}>
              Back
            </button>
            <button onClick={handleNext} className="px-4 py-2 rounded text-sm font-semibold" style={btnPrimary}>
              Next
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
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-4 text-sm font-semibold">Matched Play Format</label>
            <div className="space-y-2">
              {(
                [
                  { id: 'open_war', label: 'Open War', hint: 'Choose 1 secondary' },
                  { id: 'grand_melee', label: 'Grand Melee', hint: 'Choose 1 secondary' },
                  { id: 'combined_arms', label: 'Combined Arms', hint: 'All 3 secondaries' },
                ] as { id: MatchedPlayFormat; label: string; hint: string }[]
              ).map(({ id, label, hint }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={state.matchedPlayFormat === id}
                    onChange={() => {
                      const autoSelected =
                        id === 'combined_arms'
                          ? getSecondariesForFormat('combined_arms')?.objectives.map((o) => o.id) ?? []
                          : [];
                      setState((s) => ({
                        ...s,
                        matchedPlayFormat: id,
                        selectedSecondaries: autoSelected,
                      }));
                    }}
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85em' }}>
                    — {hint}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {secondarySet && (
            <div className="rounded border p-4" style={cardStyle}>
              <label className="block mb-4 text-sm font-semibold">
                {isMultiSelect ? 'Secondary Objectives (All Active)' : 'Secondary Objectives (Choose One)'}
              </label>
              <div className="space-y-3">
                {secondarySet.objectives.map((obj) => (
                  <label
                    key={obj.id}
                    className="block p-3 rounded cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-bg-dark)',
                      borderLeft: state.selectedSecondaries.includes(obj.id)
                        ? '3px solid var(--color-accent-amber)'
                        : '3px solid transparent',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type={isMultiSelect ? 'checkbox' : 'radio'}
                        name="secondary"
                        checked={state.selectedSecondaries.includes(obj.id)}
                        onChange={() => {
                          setState((s) => ({
                            ...s,
                            selectedSecondaries: isMultiSelect
                              ? s.selectedSecondaries.includes(obj.id)
                                ? s.selectedSecondaries.filter((id) => id !== obj.id)
                                : [...s.selectedSecondaries, obj.id]
                              : [obj.id],
                          }));
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{obj.name}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {obj.description}
                        </div>
                        <div className="text-xs font-semibold mt-2" style={{ color: 'var(--color-accent-amber)' }}>
                          {obj.vpValue} VP
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div
            className="rounded border p-4"
            style={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <p className="text-sm">
              <strong>Format:</strong>{' '}
              {state.matchedPlayFormat === 'open_war'
                ? 'Open War'
                : state.matchedPlayFormat === 'grand_melee'
                ? 'Grand Melee'
                : 'Combined Arms'}
            </p>
            <p className="text-sm mt-2">
              <strong>Selected:</strong>{' '}
              {state.selectedSecondaries.length === 0
                ? 'None yet'
                : `${state.selectedSecondaries.length} objective${state.selectedSecondaries.length > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex gap-3 mt-6 justify-between">
            <button onClick={handlePrev} className="px-4 py-2 rounded text-sm font-semibold" style={btnSecondary}>
              Back
            </button>
            <button
              onClick={handleStartGame}
              className="px-4 py-2 rounded text-sm font-semibold"
              style={btnPrimary}
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
