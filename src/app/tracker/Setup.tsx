import { useState } from 'react';
import { useGameStore, type PlayerGameState, type SpellEntry } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import type { ArmyEntry } from '../../types/army';
import { getFaction } from '../../data/factions';
import { isWizard } from '../../utils/armyValidation';
import { SECONDARY_OBJECTIVES } from '../../data/secondary-objectives';
import {
  getLore,
  getLoreSpells,
  getAllPlayableLores,
  BOUND_SPELL_ITEMS,
  type SpellModItem,
} from '../../utils/magic';
import WizardSpellSetup from './WizardSpellSetup';
import { initWizardSetup, type WizardSetup } from './wizardSetupTypes';
import type { Faction, Unit } from '../../types/faction';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface ManualCaster {
  casterName: string;
  wizardLevel: number;
  /** kebab-case lore id from getAllPlayableLores() */
  selectedLore: string;
  selectedSpellIds: string[];
  /** Override spell limit — allows selecting more spells than wizard level */
  unlockExtraSpells: boolean;
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
  gameLengthRule: 'standard' | 'random' | 'break_point';
  selectedSecondaries: string[];
  // Deployment roll-off and zones
  /** Who won the deployment zone roll-off (they choose Zone A or B and deploy first unit first) */
  deploymentRollOffWinner: 'p1' | 'p2' | null;
  // Pre-game checklist
  p1BaggageTrainPlaced: boolean;
  p2BaggageTrainPlaced: boolean;
  p1ScoutsDone: boolean;
  p2ScoutsDone: boolean;
  p1VanguardDone: boolean;
  p2VanguardDone: boolean;
  /** Which player finished deploying first and earns +1 on the first-turn roll-off */
  deploymentBonusPlayer: 'p1' | 'p2' | null;
}

interface Props {
  onCancel: () => void;
  onStarted: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps magic item IDs (as stored in faction data) to their SpellModItem key */
const ITEM_ID_TO_MOD: Record<string, SpellModItem> = {
  'lore-familiar':      'lore_familiar',
  'lore_familiar':      'lore_familiar',
  'spell_familiar':     'spell_familiar',
  'tome_of_midnight':   'tome_of_midnight',
  'grimoire_of_ogvold': 'grimoire_of_ogvold',
  'heartwood-pendant':  'heartwood_pendant',
  'heartwood_pendant':  'heartwood_pendant',
  'goretooth':          'goretooth',
};

const EXTRA_LORE_MAP: Partial<Record<SpellModItem, string>> = {
  heartwood_pendant: 'lore_of_the_wilds',
  goretooth:         'lore_of_primal_magic',
};

function applySpellModItems(setup: WizardSetup, itemIds: string[]): void {
  for (const id of itemIds) {
    const mod = ITEM_ID_TO_MOD[id];
    if (!mod) continue;
    if (mod === 'lore_familiar')     setup.hasLoreFamiliar = true;
    if (mod === 'spell_familiar' || mod === 'tome_of_midnight') setup.hasExtraSpell = true;
    if (mod === 'grimoire_of_ogvold') {
      setup.hasGrimoire = true;
      setup.selectedSpellIds = getLoreSpells(setup.selectedLore).map((s) => s.id);
    }
    const extraLore = EXTRA_LORE_MAP[mod];
    if (extraLore && !setup.extraLores.includes(extraLore)) {
      setup.extraLores.push(extraLore);
    }
  }
}

function resolveWizardLevel(unit: Unit, entry: ArmyEntry | undefined): number {
  const base = unit.magic?.wizard_level ?? 1;
  if (!entry) return base;
  for (const opt of entry.selectedOptions) {
    const m = opt.match(/\bLevel\s+(\d+)\s+Wizard\b/i);
    if (m) return parseInt(m[1], 10);
  }
  return base;
}

function boundSpellsFromEntries(entries: ArmyEntry[]): string[] {
  const allItemIds = new Set(entries.flatMap((e) => e.selectedMagicItemIds ?? []));
  return BOUND_SPELL_ITEMS.filter((b) => allItemIds.has(b.itemId)).map((b) => b.itemId);
}

function initWizardSetups(faction: Faction, entries: ArmyEntry[] = []): WizardSetup[] {
  // When a pre-built list is provided, only include wizards enrolled in that list.
  // When building manually (no entries), fall back to all faction wizards.
  const enrolledIds = new Set(entries.map((e) => e.unitId));
  const unitPool = entries.length > 0
    ? faction.units.filter((u) => enrolledIds.has(u.id) && isWizard(u))
    : faction.units.filter(isWizard);

  return unitPool.map((unit) => {
    const setup = initWizardSetup(unit);
    const entry = entries.find((e) => e.unitId === unit.id);
    // Apply level upgrade from selected options (e.g. "Upgrade to Level 3 Wizard")
    setup.wizardLevel = resolveWizardLevel(unit, entry);
    // Apply pre-selected lore from army builder
    if (entry?.selectedLoreKey) {
      setup.selectedLore = entry.selectedLoreKey;
    }
    // Apply spell-modifier magic items (Lore Familiar, Grimoire, extra lores, etc.)
    if (entry?.selectedMagicItemIds?.length) {
      applySpellModItems(setup, entry.selectedMagicItemIds);
    }
    return setup;
  });
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
    deploymentRollOffWinner: null,
    p1BaggageTrainPlaced: false,
    p2BaggageTrainPlaced: false,
    p1ScoutsDone: false,
    p2ScoutsDone: false,
    p1VanguardDone: false,
    p2VanguardDone: false,
    deploymentBonusPlayer: null,
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
                    const entries = army?.entries ?? [];
                    const wizardSetups = faction ? initWizardSetups(faction, entries) : [];
                    const boundKey = side === 'p1' ? 'p1BoundSpells' : 'p2BoundSpells';
                    const autobound = entries.length > 0 ? boundSpellsFromEntries(entries) : [];
                    setState((s) => ({
                      ...s,
                      [armyIdKey]: id,
                      [factionKey]: faction ?? null,
                      [setupsKey]: wizardSetups,
                      [boundKey]: autobound,
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
      const atLimit = !caster.unlockExtraSpells && caster.selectedSpellIds.length >= caster.wizardLevel;

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

          {/* Unlock extra spells override */}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={caster.unlockExtraSpells}
              onChange={(e) => updateCaster({ unlockExtraSpells: e.target.checked })}
              style={{ accentColor: 'var(--color-accent-amber)', flexShrink: 0 }}
            />
            <span style={{ color: 'var(--color-text-primary)' }}>
              Allow additional spells (magic item / override)
            </span>
          </label>

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
                      caster.selectedSpellIds.length >= caster.wizardLevel
                        ? 'var(--color-accent-amber)'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {caster.selectedSpellIds.length}{caster.unlockExtraSpells ? '' : ` / ${caster.wizardLevel}`}
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

    const renderBoundSpells = (side: 'p1' | 'p2', _factionId: string | null, playerName: string) => {
      const armyIdKey = side === 'p1' ? 'p1ArmyId' : 'p2ArmyId';
      const hasList = !!state[armyIdKey];
      const key = side === 'p1' ? 'p1BoundSpells' : 'p2BoundSpells';
      const selected = state[key];

      // With a list loaded: auto-detected — show summary only if any were found, no manual UI
      if (hasList) {
        if (selected.length === 0) return null;
        return (
          <div className="rounded border p-4 mt-4" style={cardStyle}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {playerName} — Bound Spell Items
            </h4>
            <div className="space-y-1">
              {selected.map((itemId) => {
                const item = BOUND_SPELL_ITEMS.find((b) => b.itemId === itemId);
                if (!item) return null;
                return (
                  <div key={itemId} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.itemName} → {item.spellName} ({item.castingValue}) Power {item.powerLevel}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Without a list: show all items from all factions, grouped by army/AJ
      const FACTION_LABELS: Record<string, string> = {
        'empire-of-man':       'Empire of Man',
        'high-elf-realms':     'High Elf Realms',
        'wood-elf-realms':     'Wood Elf Realms',
        'kingdom-of-bretonnia':'Kingdom of Bretonnia',
        'dwarfen-mountain-holds': 'Dwarfen Mountain Holds',
        'orc-goblin-tribes':   'Orc & Goblin Tribes',
        'warriors-of-chaos':   'Warriors of Chaos',
        'beastmen-brayherds':  'Beastmen Brayherds',
        'tomb-kings-of-khemri':'Tomb Kings of Khemri',
      };

      const allItems = [...BOUND_SPELL_ITEMS];
      const unselected = allItems.filter((b) => !selected.includes(b.itemId));

      // Group into Universal + per-faction buckets
      const universalItems = unselected.filter((b) => !b.factionId);
      const factionGroups = Object.entries(
        unselected
          .filter((b) => !!b.factionId)
          .reduce<Record<string, typeof allItems>>((acc, b) => {
            const key = b.factionId!;
            (acc[key] ??= []).push(b);
            return acc;
          }, {})
      );

      return (
        <div className="rounded border p-4 mt-4" style={cardStyle}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {playerName} — Bound Spell Items
          </h4>
          {selected.length > 0 && (
            <div className="space-y-1 mb-3">
              {selected.map((itemId) => {
                const item = BOUND_SPELL_ITEMS.find((b) => b.itemId === itemId);
                if (!item) return null;
                return (
                  <div key={itemId} className="flex items-center justify-between text-xs py-1 px-2 rounded" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                    <span>{item.itemName} <span style={{ color: 'var(--color-text-secondary)' }}>→ {item.spellName} ({item.castingValue})</span></span>
                    <button
                      onClick={() => setState((s) => ({ ...s, [key]: s[key].filter((id) => id !== itemId) }))}
                      style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1, marginLeft: '8px' }}
                    >×</button>
                  </div>
                );
              })}
            </div>
          )}
          {unselected.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) setState((s) => ({ ...s, [key]: [...s[key], id] }));
              }}
              className="w-full px-3 py-2 rounded text-sm"
              style={inputStyle}
            >
              <option value="">+ Add bound spell item…</option>
              {universalItems.length > 0 && (
                <optgroup label="Universal">
                  {universalItems.map((item) => (
                    <option key={item.itemId} value={item.itemId}>
                      {item.itemName} — {item.spellName} ({item.castingValue}) Power {item.powerLevel}
                    </option>
                  ))}
                </optgroup>
              )}
              {factionGroups.map(([fId, items]) => (
                <optgroup key={fId} label={FACTION_LABELS[fId] ?? fId}>
                  {items.map((item) => (
                    <option key={item.itemId} value={item.itemId}>
                      {item.itemName} — {item.spellName} ({item.castingValue}) Power {item.powerLevel}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
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
                      fromList={!!state.p1ArmyId}
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
                      { casterName: '', wizardLevel: 2, selectedLore: '', selectedSpellIds: [], unlockExtraSpells: false },
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
                      fromList={!!state.p2ArmyId}
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
                      { casterName: '', wizardLevel: 2, selectedLore: '', selectedSpellIds: [], unlockExtraSpells: false },
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
  // Step 3: Secondary Objectives
  // ---------------------------------------------------------------------------
  if (state.step === 3) {
    const nonStrategicObjectives = SECONDARY_OBJECTIVES.filter(
      (o) => !['strategic_locations_2', 'strategic_locations_3', 'strategic_locations_4'].includes(o.id)
    );

    const toggleObjective = (id: string) => {
      setState((s) => ({
        ...s,
        selectedSecondaries: s.selectedSecondaries.includes(id)
          ? s.selectedSecondaries.filter((x) => x !== id)
          : [...s.selectedSecondaries, id],
      }));
    };

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 3: Secondary Objectives
        </h2>

        <div className="space-y-6">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Secondary objectives are chosen by the organiser and may be applied to any scenario.
            Tick whichever objectives are in use for this game.
          </p>

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

          {/* Strategic Locations — determined by mission */}
          <div
            className="rounded border p-3"
            style={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Strategic Locations</strong>
              {' '}— the number of objective markers is determined by your mission. Mission selection is coming soon.
            </p>
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
  // Step 4: Deployment & Setup
  // ---------------------------------------------------------------------------
  if (state.step === 4) {
    const zoneAPlayer = state.p1IsAttacker ? state.p1Name : state.p2Name;
    const zoneBPlayer = state.p1IsAttacker ? state.p2Name : state.p1Name;
    const hasBaggageTrains = state.selectedSecondaries.includes('baggage_trains');

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Step 4: Deployment & Setup
        </h2>

        <div className="space-y-6">

          {/* Game Length */}
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-3 text-sm font-semibold">Game Length</label>
            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="game-length"
                  checked={state.gameLengthRule === 'standard'}
                  onChange={() => setState((s) => ({ ...s, gameLengthRule: 'standard' }))}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <strong>Standard (6 turns)</strong>
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                    — The game lasts for exactly six battle rounds.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="game-length"
                  checked={state.gameLengthRule === 'random'}
                  onChange={() => setState((s) => ({ ...s, gameLengthRule: 'random' }))}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  <strong>Random Game Length</strong>
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                    — Starting at the end of round 5, roll D6 and add the round number. On 10+, the battle ends immediately.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="game-length"
                  checked={state.gameLengthRule === 'break_point'}
                  onChange={() => setState((s) => ({ ...s, gameLengthRule: 'break_point' }))}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm">
                    <strong>Break Point</strong>
                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                      — Battle ends when one or both armies reach their break point.
                    </span>
                  </span>
                  <details className="mt-1">
                    <summary className="text-xs cursor-pointer" style={{ color: 'var(--color-accent-amber)' }}>
                      How break point works ▾
                    </summary>
                    <div className="text-xs mt-2 space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                      <p>An army's break point equals 25% of its total Unit Strength at the start of the game (add Unit Strength of every unit including characters, divide by 4, round down).</p>
                      <p>At the beginning of any Start of Turn sub-phase, if either army's remaining Unit Strength has fallen below its break point, that army is Broken and the game ends.</p>
                      <p>If both armies fall below their break point simultaneously, the game ends and VPs are totalled as normal — however the best either player can achieve is a Marginal Victory, and the worst is a Marginal Loss.</p>
                    </div>
                  </details>
                </div>
              </label>
            </div>
          </div>

          {/* Deployment Zone Roll-off */}
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-1 text-sm font-semibold">Deployment Zone Roll-off</label>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Both players roll off. The winner chooses their deployment zone (A or B) and deploys their first unit first.
            </p>
            {/* Who won the roll-off */}
            <p className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Who won the roll-off?</p>
            <div className="flex gap-6 mb-4">
              {(['p1', 'p2'] as const).map((side) => {
                const name = side === 'p1' ? state.p1Name : state.p2Name;
                return (
                  <label key={side} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="deployment-roll-off"
                      checked={state.deploymentRollOffWinner === side}
                      onChange={() => setState((s) => ({ ...s, deploymentRollOffWinner: side }))}
                      style={{ accentColor: 'var(--color-accent-amber)' }}
                    />
                    <span style={{ color: state.deploymentRollOffWinner === side ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                      {name}
                    </span>
                  </label>
                );
              })}
            </div>
            {/* Zone assignment — mirrored dropdowns */}
            <p className="text-xs mb-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Deployment zones</p>
            <div className="flex flex-col gap-3">
              {(['p1', 'p2'] as const).map((side) => {
                const name = side === 'p1' ? state.p1Name : state.p2Name;
                const isZoneA = side === 'p1' ? state.p1IsAttacker : !state.p1IsAttacker;
                return (
                  <div key={side} className="flex items-center gap-3">
                    <span className="text-sm shrink-0" style={{ width: '7rem', color: 'var(--color-text-secondary)' }}>{name}</span>
                    <select
                      value={isZoneA ? 'A' : 'B'}
                      onChange={(e) => {
                        const chooseA = e.target.value === 'A';
                        setState((s) => ({ ...s, p1IsAttacker: side === 'p1' ? chooseA : !chooseA }));
                      }}
                      className="flex-1 px-3 py-2 rounded text-sm"
                      style={inputStyle}
                    >
                      <option value="A">Zone A</option>
                      <option value="B">Zone B</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Baggage Train placement — only shown if objective is active */}
          {hasBaggageTrains && (
            <div className="rounded border p-4" style={cardStyle}>
              <label className="block mb-1 text-sm font-semibold">Baggage Train Placement</label>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Place before deployment begins. Each baggage train must be wholly within the player's deployment zone, at least 3″ from any battlefield edge, not on terrain and not straddling a low linear obstacle. Once placed it cannot be moved.
              </p>
              <div className="flex gap-6">
                {(['p1', 'p2'] as const).map((side) => {
                  const name = side === 'p1' ? state.p1Name : state.p2Name;
                  const checked = side === 'p1' ? state.p1BaggageTrainPlaced : state.p2BaggageTrainPlaced;
                  const key = side === 'p1' ? 'p1BaggageTrainPlaced' : 'p2BaggageTrainPlaced';
                  return (
                    <label key={side} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setState((s) => ({ ...s, [key]: e.target.checked }))}
                        style={{ accentColor: 'var(--color-accent-amber)' }}
                      />
                      <span style={{ color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {name} placed
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pre-game Checklist */}
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-1 text-sm font-semibold">Pre-game Checklist</label>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              After deployment, resolve these before Turn 1. If both players have pre-game special rules, roll off for order; then alternate.
            </p>

            {/* Scouts */}
            <div className="mb-4">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Scouts</p>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Deploy units with Scouts now — they count as part of your deployment for the first-turn roll-off.
              </p>
              <div className="flex gap-6">
                {(['p1', 'p2'] as const).map((side) => {
                  const name = side === 'p1' ? state.p1Name : state.p2Name;
                  const checked = side === 'p1' ? state.p1ScoutsDone : state.p2ScoutsDone;
                  const key = side === 'p1' ? 'p1ScoutsDone' : 'p2ScoutsDone';
                  return (
                    <label key={side} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setState((s) => ({ ...s, [key]: e.target.checked }))}
                        style={{ accentColor: 'var(--color-accent-amber)' }}
                      />
                      <span style={{ color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Vanguard */}
            <div className="mb-4">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Vanguard</p>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Units with Vanguard may make a free move now, before Turn 1.
              </p>
              <div className="flex gap-6">
                {(['p1', 'p2'] as const).map((side) => {
                  const name = side === 'p1' ? state.p1Name : state.p2Name;
                  const checked = side === 'p1' ? state.p1VanguardDone : state.p2VanguardDone;
                  const key = side === 'p1' ? 'p1VanguardDone' : 'p2VanguardDone';
                  return (
                    <label key={side} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setState((s) => ({ ...s, [key]: e.target.checked }))}
                        style={{ accentColor: 'var(--color-accent-amber)' }}
                      />
                      <span style={{ color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* First Turn Roll-off +1 */}
            <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>First Turn Roll-off</p>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Winner chooses who goes first. The player who finished deploying first (including Scouts) adds +1 to their roll.
              </p>
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>Who finished deploying first?</p>
              <div className="flex gap-6">
                {(['p1', 'p2', null] as const).map((side) => {
                  const label = side === null ? 'Neither / Same time' : (side === 'p1' ? state.p1Name : state.p2Name);
                  return (
                    <label key={String(side)} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="deployment-bonus"
                        checked={state.deploymentBonusPlayer === side}
                        onChange={() => setState((s) => ({ ...s, deploymentBonusPlayer: side }))}
                        style={{ accentColor: 'var(--color-accent-amber)' }}
                      />
                      <span style={{ color: state.deploymentBonusPlayer === side ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Who goes first — resolved after roll-off */}
          <div className="rounded border p-4" style={cardStyle}>
            <label className="block mb-3 text-sm font-semibold">Who goes first?</label>
            <div className="flex gap-4 flex-wrap">
              {(['p1', 'p2'] as const).map((side) => {
                const name = side === 'p1' ? state.p1Name : state.p2Name;
                const isFirst = side === 'p1' ? !state.p2GoesFirst : state.p2GoesFirst;
                return (
                  <label key={side} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="first"
                      checked={isFirst}
                      onChange={() => setState((s) => ({ ...s, p2GoesFirst: side === 'p2' }))}
                      style={{ accentColor: 'var(--color-accent-amber)' }}
                    />
                    <span className="text-sm" style={{ color: isFirst ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                      {name}
                      {state.deploymentBonusPlayer === side && (
                        <span style={{ color: 'var(--color-accent-amber)', marginLeft: '6px', fontSize: '0.85em' }}>+1 to roll</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded border p-4" style={{ ...cardStyle, color: 'var(--color-text-secondary)' }}>
            <p className="text-sm">
              <strong style={{ color: 'var(--color-text-primary)' }}>Turn 1:</strong>{' '}
              {state.p2GoesFirst ? state.p2Name : state.p1Name} moves first
            </p>
            <p className="text-sm mt-1">
              <strong style={{ color: 'var(--color-text-primary)' }}>Zones:</strong>{' '}
              {zoneAPlayer} (Zone A), {zoneBPlayer} (Zone B)
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
