import { useState } from 'react';
import { useGameStore, type PlayerGameState, type SpellEntry } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';
import { isWizard } from '../../utils/armyValidation';
import { SECONDARY_OBJECTIVES } from '../../data/secondary-objectives';
import {
  getLore,
  getLoreSpells,
  getAllPlayableLores,
  BOUND_SPELL_ITEMS,
  type BoundSpellItem,
} from '../../utils/magic';
import WizardSpellSetup from './WizardSpellSetup';
import { initWizardSetup, type WizardSetup } from './wizardSetupTypes';
import type { Faction } from '../../types/faction';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface ManualCaster {
  casterName: string;
  wizardLevel: number;
  /** kebab-case lore id from getAllPlayableLores() */
  selectedLore: string;
  selectedSpellIds: string[];
}

interface SetupState {
  step: 1 | 2 | 3 | 4;
  gameName: string;
  p1Name: string;
  p2Name: string;
  p1ArmyId: string | null;
  p2ArmyId: string | null;
  p1Faction: Faction | null;
  p2Faction: Faction | null;
  p1WizardSetups: WizardSetup[];
  p2WizardSetups: WizardSetup[];
  p1ManualCasters: ManualCaster[];
  p2ManualCasters: ManualCaster[];
  /** IDs of bound spell items ticked for each player */
  p1BoundSpells: string[];
  p2BoundSpells: string[];
  p1IsAttacker: boolean;
  p2GoesFirst: boolean;
  gameLengthRule: 'standard' | 'random';
  selectedSecondaries: string[];
}

interface Props {
  onCancel: () => void;
  onStarted: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initWizardSetups(faction: Faction): WizardSetup[] {
  return faction.units.filter(isWizard).map(initWizardSetup);
}

function boundItemsForFaction(factionId: string | null): BoundSpellItem[] {
  return BOUND_SPELL_ITEMS.filter(
    (b) => b.factionId === undefined || b.factionId === factionId,
  );
}

function buildSpellEntries(setup: WizardSetup): SpellEntry[] {
  const loreData = getLore(setup.selectedLore);
  return setup.selectedSpellIds.map((spellId) => {
    const spell = loreData?.spells?.find((s) => s.id === spellId);
    return {
      name: spell?.name ?? spellId,
      isAssailment: spell?.type === 'Assailment',
      spellId,
      castingValue: spell?.casting_value,
      spellType: spell?.type,
    };
  });
}

function buildManualEntries(caster: ManualCaster): SpellEntry[] {
  const loreData = getLore(caster.selectedLore);
  return caster.selectedSpellIds.map((spellId) => {
    const spell = loreData?.spells?.find((s) => s.id === spellId);
    return {
      name: spell?.name ?? spellId,
      isAssailment: spell?.type === 'Assailment',
      spellId,
      castingValue: spell?.casting_value,
      spellType: spell?.type,
    };
  });
}

// ---------------------------------------------------------------------------
// Setup component
// ---------------------------------------------------------------------------

export default function Setup({ onCancel }: Props) {
  const startGame = useGameStore((s) => s.startGame);
  const addSpellsToWizard = useGameStore((s) => s.addSpellsToWizard);
  const armies = useArmyStore((s) => s.armies);

  const [state, setState] = useState<SetupState>({
    step: 1,
    gameName: '',
    p1Name: 'Player 1',
    p2Name: 'Player 2',
    p1ArmyId: null,
    p2ArmyId: null,
    p1Faction: null,
    p2Faction: null,
    p1WizardSetups: [],
    p2WizardSetups: [],
    p1ManualCasters: [],
    p2ManualCasters: [],
    p1BoundSpells: [],
    p2BoundSpells: [],
    p1IsAttacker: true,
    p2GoesFirst: false,
    gameLengthRule: 'standard',
    selectedSecondaries: [],
  });

  const handleNext = (): void => {
    if (state.step < 4) {
      setState((s) => ({ ...s, step: (s.step + 1) as 1 | 2 | 3 | 4 }));
    }
  };

  const handlePrev = (): void => {
    if (state.step > 1) {
      setState((s) => ({ ...s, step: (s.step - 1) as 1 | 2 | 3 | 4 }));
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

    startGame(p1Setup, p2Setup, state.gameLengthRule, state.selectedSecondaries, state.gameName);

    // Linked army wizards
    for (const wizardSetup of state.p1WizardSetups) {
      const entries = buildSpellEntries(wizardSetup);
      if (entries.length > 0) {
        addSpellsToWizard('p1', wizardSetup.unitId, wizardSetup.unitName, wizardSetup.selectedLore, entries);
      }
    }
    for (const wizardSetup of state.p2WizardSetups) {
      const entries = buildSpellEntries(wizardSetup);
      if (entries.length > 0) {
        addSpellsToWizard('p2', wizardSetup.unitId, wizardSetup.unitName, wizardSetup.selectedLore, entries);
      }
    }

    // Manual casters (no linked army)
    state.p1ManualCasters.forEach((caster, idx) => {
      const entries = buildManualEntries(caster);
      if (entries.length > 0) {
        addSpellsToWizard(
          'p1',
          `manual_p1_${idx}`,
          caster.casterName.trim() || `${state.p1Name} Caster ${idx + 1}`,
          caster.selectedLore,
          entries,
        );
      }
    });
    state.p2ManualCasters.forEach((caster, idx) => {
      const entries = buildManualEntries(caster);
      if (entries.length > 0) {
        addSpellsToWizard(
          'p2',
          `manual_p2_${idx}`,
          caster.casterName.trim() || `${state.p2Name} Caster ${idx + 1}`,
          caster.selectedLore,
          entries,
        );
      }
    });

    // Bound spell items — grouped as a single "Bound Spells" selection per player
    const p1Bound: SpellEntry[] = state.p1BoundSpells.flatMap((itemId) => {
      const item = BOUND_SPELL_ITEMS.find((b) => b.itemId === itemId);
      if (!item) return [];
      return [{
        name: `${item.spellName} (Bound, Power ${item.powerLevel})`,
        isAssailment: false,
        spellId: item.spellId,
        castingValue: item.castingValue,
        spellType: 'Bound',
        isBound: true,
        powerLevel: item.powerLevel,
      }];
    });
    if (p1Bound.length > 0) {
      addSpellsToWizard('p1', 'bound_spells_p1', 'Bound Spells', 'various', p1Bound);
    }

    const p2Bound: SpellEntry[] = state.p2BoundSpells.flatMap((itemId) => {
      const item = BOUND_SPELL_ITEMS.find((b) => b.itemId === itemId);
      if (!item) return [];
      return [{
        name: `${item.spellName} (Bound, Power ${item.powerLevel})`,
        isAssailment: false,
        spellId: item.spellId,
        castingValue: item.castingValue,
        spellType: 'Bound',
        isBound: true,
        powerLevel: item.powerLevel,
      }];
    });
    if (p2Bound.length > 0) {
      addSpellsToWizard('p2', 'bound_spells_p2', 'Bound Spells', 'various', p2Bound);
    }
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

  // ---------------------------------------------------------------------------
  // Step 1: Army Selection
  // ---------------------------------------------------------------------------
  if (state.step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Step 1: Army Selection
          </h2>
          <button onClick={onCancel} className="text-sm px-3 py-1.5 rounded" style={btnSecondary}>
            Cancel
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-2 text-sm font-semibold">Game Name (optional)</label>
            <input
              type="text"
              placeholder={`${state.p1Name} vs ${state.p2Name}`}
              value={state.gameName}
              onChange={(e) => setState((s) => ({ ...s, gameName: e.target.value }))}
              className="w-full px-3 py-2 rounded text-sm"
              style={inputStyle}
            />
          </div>

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
                    const setupsKey = side === 'p1' ? 'p1WizardSetups' : 'p2WizardSetups';
                    const wizardSetups = faction ? initWizardSetups(faction) : [];
                    setState((s) => ({
                      ...s,
                      [armyIdKey]: id,
                      [factionKey]: faction ?? null,
                      [setupsKey]: wizardSetups,
                    }));
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

  // ---------------------------------------------------------------------------
  // Step 2: Spell Generation
  // ---------------------------------------------------------------------------
  if (state.step === 2) {
    const playableLores = getAllPlayableLores();

    const renderManualCaster = (side: 'p1' | 'p2', idx: number) => {
      const castersKey = side === 'p1' ? 'p1ManualCasters' : 'p2ManualCasters';
      const caster = state[castersKey][idx];
      const casterSpells = getLoreSpells(caster.selectedLore);
      const atLimit = caster.selectedSpellIds.length >= caster.wizardLevel;

      const updateCaster = (patch: Partial<ManualCaster>) => {
        setState((s) => ({
          ...s,
          [castersKey]: s[castersKey].map((c, i) => (i === idx ? { ...c, ...patch } : c)),
        }));
      };

      return (
        <div
          key={idx}
          className="rounded p-3 space-y-3"
          style={{ backgroundColor: 'var(--color-bg-dark)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
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

          {/* Name */}
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Caster name
            </label>
            <input
              type="text"
              placeholder="e.g. Archmage"
              value={caster.casterName}
              onChange={(e) => updateCaster({ casterName: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={inputStyle}
            />
          </div>

          {/* Wizard level */}
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Wizard level
            </label>
            <select
              value={caster.wizardLevel}
              onChange={(e) => {
                const lvl = Number(e.target.value);
                updateCaster({
                  wizardLevel: lvl,
                  selectedSpellIds: caster.selectedSpellIds.slice(0, lvl),
                });
              }}
              className="w-full px-3 py-2 rounded text-sm"
              style={inputStyle}
            >
              {[1, 2, 3, 4].map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </div>

          {/* Lore */}
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Lore of magic
            </label>
            <select
              value={caster.selectedLore}
              onChange={(e) => updateCaster({ selectedLore: e.target.value, selectedSpellIds: [] })}
              className="w-full px-3 py-2 rounded text-sm"
              style={inputStyle}
            >
              <option value="">— Select lore —</option>
              {playableLores.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Spells */}
          {caster.selectedLore && casterSpells.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Spells
                </label>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      caster.selectedSpellIds.length === caster.wizardLevel
                        ? 'var(--color-accent-amber)'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {caster.selectedSpellIds.length} / {caster.wizardLevel}
                </span>
              </div>
              <div className="space-y-1">
                {casterSpells.map((spell) => {
                  const checked = caster.selectedSpellIds.includes(spell.id);
                  const disabled = !checked && atLimit;
                  return (
                    <label
                      key={spell.id}
                      className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-xs"
                      style={{
                        backgroundColor: checked ? 'rgba(217,119,6,0.08)' : 'var(--color-bg-elevated)',
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          const newIds = checked
                            ? caster.selectedSpellIds.filter((id) => id !== spell.id)
                            : [...caster.selectedSpellIds, spell.id];
                          updateCaster({ selectedSpellIds: newIds });
                        }}
                        style={{ accentColor: 'var(--color-accent-amber)', flexShrink: 0 }}
                      />
                      <span className="flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {spell.is_signature ? '★ ' : `${spell.number}. `}{spell.name}
                      </span>
                      <span className="font-mono" style={{ color: 'var(--color-accent-blue)' }}>
                        {spell.casting_value}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    };

    const renderBoundSpells = (side: 'p1' | 'p2', factionId: string | null, playerName: string) => {
      const key = side === 'p1' ? 'p1BoundSpells' : 'p2BoundSpells';
      const selected = state[key];
      const items = boundItemsForFaction(factionId);
      if (items.length === 0) return null;

      return (
        <div className="rounded border p-4 mt-4" style={cardStyle}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {playerName} — Bound Spell Items
          </h4>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Tick any bound spell items your characters are carrying.
          </p>
          <div className="space-y-2">
            {items.map((item) => {
              const checked = selected.includes(item.itemId);
              return (
                <label key={item.itemId} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setState((s) => ({
                        ...s,
                        [key]: checked
                          ? s[key].filter((id) => id !== item.itemId)
                          : [...s[key], item.itemId],
                      }));
                    }}
                    style={{ accentColor: 'var(--color-accent-amber)', marginTop: '2px', flexShrink: 0 }}
                  />
                  <div>
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {item.itemName}
                    </span>
                    <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                      → {item.spellName} ({item.castingValue}) Power {item.powerLevel}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      );
    };

    const p1HasWizards = state.p1WizardSetups.length > 0;
    const p2HasWizards = state.p2WizardSetups.length > 0;
    const nothingToShow =
      !p1HasWizards && !p2HasWizards && state.p1Faction !== null && state.p2Faction !== null;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 2: Spell Generation
        </h2>

        {nothingToShow && (
          <div
            className="rounded border p-4 mb-6"
            style={{ ...cardStyle, color: 'var(--color-text-secondary)' }}
          >
            <p className="text-sm">No wizards in selected armies. Click Next to continue.</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Player 1 */}
          {p1HasWizards ? (
            <div className="rounded border p-4" style={cardStyle}>
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p1Name} — Spells
              </h3>
              <div className="space-y-4">
                {state.p1WizardSetups.map((wizardSetup) => {
                  const unit = state.p1Faction!.units.find((u) => u.id === wizardSetup.unitId)!;
                  return (
                    <WizardSpellSetup
                      key={wizardSetup.unitId}
                      unit={unit}
                      factionId={state.p1Faction!.id}
                      setup={wizardSetup}
                      onChange={(updated) =>
                        setState((s) => ({
                          ...s,
                          p1WizardSetups: s.p1WizardSetups.map((ws) =>
                            ws.unitId === updated.unitId ? updated : ws,
                          ),
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>
          ) : state.p1Faction === null ? (
            <div className="rounded border p-4" style={cardStyle}>
              <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p1Name} — Manual Casters
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                No army list linked. Add spellcasters manually.
              </p>

              <div className="space-y-4">
                {state.p1ManualCasters.map((_, idx) => renderManualCaster('p1', idx))}
              </div>

              <button
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    p1ManualCasters: [
                      ...s.p1ManualCasters,
                      { casterName: '', wizardLevel: 2, selectedLore: '', selectedSpellIds: [] },
                    ],
                  }))
                }
                className="mt-3 w-full px-3 py-2 rounded text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--color-bg-dark)',
                  color: 'var(--color-accent-blue)',
                  border: '1px solid var(--color-border)',
                }}
              >
                + Add Caster
              </button>
            </div>
          ) : null}

          {renderBoundSpells('p1', state.p1Faction?.id ?? null, state.p1Name)}

          {/* Player 2 */}
          {p2HasWizards ? (
            <div className="rounded border p-4" style={cardStyle}>
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p2Name} — Spells
              </h3>
              <div className="space-y-4">
                {state.p2WizardSetups.map((wizardSetup) => {
                  const unit = state.p2Faction!.units.find((u) => u.id === wizardSetup.unitId)!;
                  return (
                    <WizardSpellSetup
                      key={wizardSetup.unitId}
                      unit={unit}
                      factionId={state.p2Faction!.id}
                      setup={wizardSetup}
                      onChange={(updated) =>
                        setState((s) => ({
                          ...s,
                          p2WizardSetups: s.p2WizardSetups.map((ws) =>
                            ws.unitId === updated.unitId ? updated : ws,
                          ),
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>
          ) : state.p2Faction === null ? (
            <div className="rounded border p-4" style={cardStyle}>
              <h3 className="text-lg mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                {state.p2Name} — Manual Casters
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                No army list linked. Add spellcasters manually.
              </p>

              <div className="space-y-4">
                {state.p2ManualCasters.map((_, idx) => renderManualCaster('p2', idx))}
              </div>

              <button
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    p2ManualCasters: [
                      ...s.p2ManualCasters,
                      { casterName: '', wizardLevel: 2, selectedLore: '', selectedSpellIds: [] },
                    ],
                  }))
                }
                className="mt-3 w-full px-3 py-2 rounded text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--color-bg-dark)',
                  color: 'var(--color-accent-blue)',
                  border: '1px solid var(--color-border)',
                }}
              >
                + Add Caster
              </button>
            </div>
          ) : null}

          {renderBoundSpells('p2', state.p2Faction?.id ?? null, state.p2Name)}

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

  // ---------------------------------------------------------------------------
  // Step 3: Initiative & Setup
  // ---------------------------------------------------------------------------
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
                  Random Game Length
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85em', marginLeft: '4px' }}>
                    — From end of round 5, roll D6 + round number; 10+ ends the battle
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-3 text-sm font-semibold">Pre-game Checklist</label>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              After deployment is complete, resolve these before Turn 1 begins.
              If both players have pre-game special rules, roll off for order; then alternate.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="shrink-0 mt-0.5">→</span>
                <span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Scouts:</strong>{' '}
                  Deploy any units with Scouts now (they count as part of your deployment for the first-turn roll-off).
                </span>
              </div>
              <div className="flex items-start gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="shrink-0 mt-0.5">→</span>
                <span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Vanguard:</strong>{' '}
                  Units with Vanguard may make a free move now, before Turn 1.
                </span>
              </div>
              <div className="flex items-start gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="shrink-0 mt-0.5">→</span>
                <span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>First Turn Roll-off:</strong>{' '}
                  Winner chooses who goes first. The player who finished deploying first (including Scouts) adds +1 to their roll.
                </span>
              </div>
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

  // ---------------------------------------------------------------------------
  // Step 4: Secondary Objectives
  // ---------------------------------------------------------------------------
  if (state.step === 4) {
    // Strategic Locations are mutually exclusive (only one marker count at a time).
    // All other objectives can be combined freely.
    const strategicIds = ['strategic_locations_2', 'strategic_locations_3', 'strategic_locations_4'];
    const isStrategicSelected = (id: string) => strategicIds.includes(id) && state.selectedSecondaries.includes(id);
    const anyStrategicSelected = strategicIds.some((id) => state.selectedSecondaries.includes(id));

    const toggleObjective = (id: string) => {
      setState((s) => {
        if (strategicIds.includes(id)) {
          // Radio-style for Strategic Locations: deselect others, toggle this one
          const alreadySelected = s.selectedSecondaries.includes(id);
          const withoutStrategic = s.selectedSecondaries.filter((x) => !strategicIds.includes(x));
          return {
            ...s,
            selectedSecondaries: alreadySelected ? withoutStrategic : [...withoutStrategic, id],
          };
        }
        // Checkbox for all others
        return {
          ...s,
          selectedSecondaries: s.selectedSecondaries.includes(id)
            ? s.selectedSecondaries.filter((x) => x !== id)
            : [...s.selectedSecondaries, id],
        };
      });
    };

    const nonStrategicObjectives = SECONDARY_OBJECTIVES.filter((o) => !strategicIds.includes(o.id));
    const strategicObjectives = SECONDARY_OBJECTIVES.filter((o) => strategicIds.includes(o.id));

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 4: Secondary Objectives
        </h2>

        <div className="space-y-6">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Secondary objectives are chosen by the organiser and may be applied to any scenario.
            Tick whichever objectives are in use for this game.
          </p>

          {/* Baggage Trains, Special Feature, Domination — checkboxes */}
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-3 text-sm font-semibold">Objectives</label>
            <div className="space-y-3">
              {nonStrategicObjectives.map((obj) => {
                const active = state.selectedSecondaries.includes(obj.id);
                return (
                  <label
                    key={obj.id}
                    className="block p-3 rounded cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-bg-dark)',
                      borderLeft: active ? '3px solid var(--color-accent-amber)' : '3px solid transparent',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleObjective(obj.id)}
                        className="mt-1"
                        style={{ accentColor: 'var(--color-accent-amber)' }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{obj.name}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {obj.description}
                        </div>
                        <div className="text-xs font-semibold mt-2" style={{ color: 'var(--color-accent-amber)' }}>
                          {obj.vpSummary}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Strategic Locations — radio (mutually exclusive marker count) */}
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-1 text-sm font-semibold">Strategic Locations</label>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Choose one marker count, or none.
            </p>
            <div className="space-y-3">
              {strategicObjectives.map((obj) => {
                const active = isStrategicSelected(obj.id);
                return (
                  <label
                    key={obj.id}
                    className="block p-3 rounded cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-bg-dark)',
                      borderLeft: active ? '3px solid var(--color-accent-amber)' : '3px solid transparent',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="strategic-locations"
                        checked={active}
                        onChange={() => toggleObjective(obj.id)}
                        onClick={() => {
                          // Allow deselecting by clicking the already-selected radio
                          if (active) toggleObjective(obj.id);
                        }}
                        className="mt-1"
                        style={{ accentColor: 'var(--color-accent-amber)' }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{obj.name}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {obj.description}
                        </div>
                        <div className="text-xs font-semibold mt-2" style={{ color: 'var(--color-accent-amber)' }}>
                          {obj.vpSummary}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div
            className="rounded border p-4"
            style={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <p className="text-sm">
              <strong style={{ color: 'var(--color-text-primary)' }}>Active objectives:</strong>{' '}
              {state.selectedSecondaries.length === 0
                ? 'None (standard VP only)'
                : state.selectedSecondaries
                    .map((id) => SECONDARY_OBJECTIVES.find((o) => o.id === id)?.name ?? id)
                    .join(', ')}
            </p>
            {anyStrategicSelected && (
              <p className="text-xs mt-2">
                Strategic Locations VP is scored at the end of each player's turn throughout the game.
              </p>
            )}
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
