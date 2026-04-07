import {
  getLore,
  getLoreSpells,
  FACTION_SPELL_MOD_ITEMS,
  type SpellModItem,
} from '../../utils/magic';
import type { Unit } from '../../types/faction';
import type { WizardSetup } from './wizardSetupTypes';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  unit: Unit;
  factionId: string;
  setup: WizardSetup;
  onChange: (setup: WizardSetup) => void;
  /** When true, magic item modifiers were auto-detected from the army list — show read-only instead of checkboxes */
  fromList?: boolean;
}

const ITEM_LABELS: Record<SpellModItem, string> = {
  lore_familiar:     'Lore Familiar',
  spell_familiar:    'Spell Familiar',
  tome_of_midnight:  'Tome of Midnight',
  grimoire_of_ogvold:'Grimoire of Ogvold',
  heartwood_pendant: 'Heartwood Pendant',
  goretooth:         'Goretooth',
};

const ITEM_DESCRIPTIONS: Record<SpellModItem, string> = {
  lore_familiar:     'The wizard may choose their spells freely rather than generating them randomly.',
  spell_familiar:    'The wizard generates one additional spell beyond their normal allowance.',
  tome_of_midnight:  'The wizard generates one additional spell beyond their normal allowance.',
  grimoire_of_ogvold:'The wizard knows every spell in their chosen lore.',
  heartwood_pendant: 'The wizard may also generate spells from the Lore of the Wilds.',
  goretooth:         'The wizard may also generate spells from the Lore of Primal Magic.',
};

const ITEM_EXTRA_LORE: Partial<Record<SpellModItem, string>> = {
  heartwood_pendant: 'lore_of_the_wilds',
  goretooth:         'lore_of_primal_magic',
};

export default function WizardSpellSetup({ unit, factionId, setup, onChange, fromList = false }: Props) {
  const effectiveLores = [...setup.availableLores, ...setup.extraLores];
  const spells = getLoreSpells(setup.selectedLore);
  const loreName = getLore(setup.selectedLore)?.name ?? setup.selectedLore;
  const spellSlots = setup.wizardLevel + (setup.hasExtraSpell ? 1 : 0);
  const selectedCount = setup.hasGrimoire ? spells.length : setup.selectedSpellIds.length;
  const isAtLimit = !setup.hasGrimoire && setup.selectedSpellIds.length >= spellSlots;
  const isComplete = setup.hasGrimoire || selectedCount === spellSlots;

  const factionItems: SpellModItem[] = (FACTION_SPELL_MOD_ITEMS[factionId] ?? ['lore_familiar']) as SpellModItem[];

  const toggleSpell = (spellId: string) => {
    if (setup.hasGrimoire) return;
    const already = setup.selectedSpellIds.includes(spellId);
    if (!already && isAtLimit) return;
    onChange({
      ...setup,
      selectedSpellIds: already
        ? setup.selectedSpellIds.filter((id) => id !== spellId)
        : [...setup.selectedSpellIds, spellId],
    });
  };

  const handleLoreChange = (loreKey: string) => {
    onChange({ ...setup, selectedLore: loreKey, selectedSpellIds: [] });
  };

  const handleItemToggle = (item: SpellModItem, checked: boolean) => {
    const next = { ...setup };

    if (item === 'lore_familiar') {
      next.hasLoreFamiliar = checked;
    } else if (item === 'spell_familiar' || item === 'tome_of_midnight') {
      next.hasExtraSpell = checked;
      // If unchecking and over the new limit, trim the selection
      if (!checked && next.selectedSpellIds.length > next.wizardLevel) {
        next.selectedSpellIds = next.selectedSpellIds.slice(0, next.wizardLevel);
      }
    } else if (item === 'grimoire_of_ogvold') {
      next.hasGrimoire = checked;
      next.selectedSpellIds = checked ? spells.map((s) => s.id) : [];
    } else if (item === 'heartwood_pendant' || item === 'goretooth') {
      const extraLore = ITEM_EXTRA_LORE[item]!;
      if (checked) {
        next.extraLores = [...next.extraLores.filter((l) => l !== extraLore), extraLore];
      } else {
        next.extraLores = next.extraLores.filter((l) => l !== extraLore);
        // If the removed lore was selected, revert to first available
        if (next.selectedLore === extraLore) {
          next.selectedLore = next.availableLores[0] ?? '';
          next.selectedSpellIds = [];
        }
      }
    }

    onChange(next);
  };

  const countColor: string = isComplete
    ? 'var(--color-accent-amber)'
    : selectedCount > spellSlots
    ? '#ef4444'
    : 'var(--color-text-secondary)';

  return (
    <div
      className="rounded border p-4"
      style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {unit.name}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded font-mono"
          style={{ backgroundColor: 'rgba(217,119,6,0.12)', color: 'var(--color-accent-amber)' }}
        >
          Level {setup.wizardLevel}
        </span>
      </div>

      {/* Lore selector — only if multiple options */}
      {effectiveLores.length > 1 ? (
        <div className="mb-3">
          <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Lore of magic
          </label>
          <select
            value={setup.selectedLore}
            onChange={(e) => handleLoreChange(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              backgroundColor: 'var(--color-bg-dark)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {effectiveLores.map((loreKey) => (
              <option key={loreKey} value={loreKey}>
                {getLore(loreKey)?.name ?? loreKey}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-3">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Lore: {loreName}
          </span>
        </div>
      )}

      {/* Spell count indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {setup.hasLoreFamiliar ? 'Choosing freely' : 'Enter your rolled spells'}
        </span>
        <span className="text-xs font-semibold" style={{ color: countColor }}>
          {setup.hasGrimoire
            ? `All ${spells.length} spells`
            : `${selectedCount} / ${spellSlots} selected`}
        </span>
      </div>

      {/* Spell list */}
      {spells.length === 0 ? (
        <p className="text-xs italic mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          No spell data for this lore.
        </p>
      ) : (
        <div className="space-y-1 mb-3">
          {spells.map((spell) => {
            const checked = setup.hasGrimoire || setup.selectedSpellIds.includes(spell.id);
            const disabled =
              setup.hasGrimoire || (!checked && isAtLimit);
            return (
              <label
                key={spell.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer"
                style={{
                  backgroundColor: checked
                    ? 'rgba(217,119,6,0.08)'
                    : 'var(--color-bg-dark)',
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleSpell(spell.id)}
                  style={{ accentColor: 'var(--color-accent-amber)', flexShrink: 0 }}
                />
                <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {spell.is_signature ? '★ ' : `${spell.number}. `}
                  {spell.name}
                </span>
                <span
                  className="text-xs font-mono shrink-0"
                  style={{ color: 'var(--color-accent-blue)' }}
                >
                  {spell.casting_value}
                </span>
                {spell.is_signature && (
                  <span
                    className="text-xs shrink-0"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Sig
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {/* Magic item modifiers */}
      {factionItems.length > 0 && (
        <div
          className="pt-2 space-y-1.5"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {fromList ? (
            // List mode: show which items were auto-detected, read-only
            (() => {
              const equippedItems = factionItems.filter((item) => {
                const isExtraLore = item === 'heartwood_pendant' || item === 'goretooth';
                const isExtraSpell = item === 'spell_familiar' || item === 'tome_of_midnight';
                return (
                  item === 'lore_familiar'     ? setup.hasLoreFamiliar :
                  isExtraSpell                  ? setup.hasExtraSpell :
                  item === 'grimoire_of_ogvold' ? setup.hasGrimoire :
                  isExtraLore ? setup.extraLores.includes(ITEM_EXTRA_LORE[item]!) : false
                );
              });
              if (equippedItems.length === 0) return null;
              return (
                <>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Magic items (from list):
                  </p>
                  {equippedItems.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs">
                      <span style={{ color: 'var(--color-accent-amber)', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      <div>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{ITEM_LABELS[item]}</span>
                        <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px' }}>{ITEM_DESCRIPTIONS[item]}</span>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()
          ) : (
            // Manual mode: interactive checkboxes
            <>
              <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Magic items (tick if equipped):
              </p>
              {factionItems.map((item) => {
                const isExtraLore = item === 'heartwood_pendant' || item === 'goretooth';
                const isExtraSpell = item === 'spell_familiar' || item === 'tome_of_midnight';
                const checked =
                  item === 'lore_familiar'     ? setup.hasLoreFamiliar :
                  isExtraSpell                  ? setup.hasExtraSpell :
                  item === 'grimoire_of_ogvold' ? setup.hasGrimoire :
                  isExtraLore
                    ? setup.extraLores.includes(ITEM_EXTRA_LORE[item]!)
                    : false;
                return (
                  <label key={item} className="flex items-start gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleItemToggle(item, e.target.checked)}
                      style={{ accentColor: 'var(--color-accent-amber)', flexShrink: 0, marginTop: '2px' }}
                    />
                    <div>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{ITEM_LABELS[item]}</span>
                      <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px' }}>{ITEM_DESCRIPTIONS[item]}</span>
                    </div>
                  </label>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
