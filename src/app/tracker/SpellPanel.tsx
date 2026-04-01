import { useGameStore, type PlayerSide } from '../../store/gameStore';

interface SpellPanelProps {
  side: PlayerSide;
}

export default function SpellPanel({ side }: SpellPanelProps) {
  const players = useGameStore((s) => s.players);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const currentSide = useGameStore((s) => s.currentSide);
  const toggleSpellAssailment = useGameStore((s) => s.toggleSpellAssailment);

  const player = players[side];
  const allSpells = player.spells ?? [];

  const isActiveSide = side === currentSide;
  const isInCombat = currentPhase === 'combat';
  const isInStartOfTurn = currentPhase === 'start_of_turn';
  const isInMovement = currentPhase === 'movement';
  const isInShooting = currentPhase === 'shooting';

  // Visibility rules:
  // – Active player's panel: always visible
  // – Inactive player's panel: visible in combat (Assailment only), hidden otherwise
  const panelVisible = isActiveSide || isInCombat;

  // During combat, inactive player shows only Assailment spells
  const combatInactiveFilter = !isActiveSide && isInCombat;

  // During start_of_turn, only Hex and Enchantment spells are relevant
  const startOfTurnFilter = isInStartOfTurn && isActiveSide;

  // During movement, only Conveyance spells are relevant
  const movementFilter = isInMovement && isActiveSide;

  // During shooting, only Magic Missile spells are relevant
  const shootingFilter = isInShooting && isActiveSide;

  const visibleSelections = combatInactiveFilter
    ? allSpells
        .map((sel) => ({ ...sel, spells: sel.spells.filter((sp) => sp.isAssailment) }))
        .filter((sel) => sel.spells.length > 0)
    : startOfTurnFilter
    ? allSpells
        .map((sel) => ({
          ...sel,
          spells: sel.spells.filter(
            (sp) => sp.spellType === 'Hex' || sp.spellType === 'Enchantment',
          ),
        }))
        .filter((sel) => sel.spells.length > 0)
    : movementFilter
    ? allSpells
        .map((sel) => ({
          ...sel,
          spells: sel.spells.filter((sp) => sp.spellType === 'Conveyance'),
        }))
        .filter((sel) => sel.spells.length > 0)
    : shootingFilter
    ? allSpells
        .map((sel) => ({
          ...sel,
          spells: sel.spells.filter((sp) => sp.spellType === 'Magic Missile'),
        }))
        .filter((sel) => sel.spells.length > 0)
    : allSpells;

  if (!panelVisible) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Spells
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Active on {player.name}'s turn.
        </p>
      </div>
    );
  }

  if (allSpells.length === 0) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Spells
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No spells recorded.
        </p>
      </div>
    );
  }

  if (startOfTurnFilter && visibleSelections.length === 0) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Ongoing Spells
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No active Hexes or Enchantments in play.
        </p>
      </div>
    );
  }

  if (movementFilter && visibleSelections.length === 0) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Conveyance Spells
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No Conveyance spells available.
        </p>
      </div>
    );
  }

  if (shootingFilter && visibleSelections.length === 0) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Magic Missiles
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No Magic Missile spells available.
        </p>
      </div>
    );
  }

  if (combatInactiveFilter && visibleSelections.length === 0) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Assailment Spells
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No Assailment spells marked.
        </p>
      </div>
    );
  }

  const title = combatInactiveFilter
    ? 'Assailment Spells'
    : startOfTurnFilter
    ? 'Ongoing Spells'
    : movementFilter
    ? 'Conveyance Spells'
    : shootingFilter
    ? 'Magic Missiles'
    : 'Spells (Reference)';

  return (
    <div
      className="rounded border p-4"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h3>

      <div className="space-y-4">
        {visibleSelections.map((sel) => (
          <div key={`${sel.unitId}-${sel.lore}`}>
            {/* Wizard / group header */}
            <div
              className="text-sm font-semibold mb-2 px-2 py-1 rounded"
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                color: 'var(--color-accent-amber)',
              }}
            >
              {sel.unitName}
            </div>

            {sel.spells.length === 0 ? (
              <p className="text-xs px-2" style={{ color: 'var(--color-text-secondary)' }}>
                (No spells recorded)
              </p>
            ) : (
              <div className="space-y-1">
                {sel.spells.map((spellEntry, idx) => {
                  // Find index in original allSpells array for the toggle action
                  const originalSel = allSpells.find(
                    (s) => s.unitId === sel.unitId && s.lore === sel.lore,
                  );
                  const originalIdx = originalSel
                    ? originalSel.spells.findIndex((s) => s.name === spellEntry.name)
                    : idx;

                  const isBound = spellEntry.isBound === true;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded"
                      style={{
                        backgroundColor: 'var(--color-bg-dark)',
                        borderLeft: spellEntry.isAssailment
                          ? '2px solid var(--color-accent-amber)'
                          : isBound
                          ? '2px solid var(--color-accent-blue)'
                          : '2px solid var(--color-border)',
                      }}
                    >
                      {/* Spell name + casting value */}
                      <div className="flex items-baseline gap-2 flex-1 min-w-0">
                        <span
                          className="text-sm truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {isBound ? '⚡ ' : ''}{spellEntry.name}
                        </span>
                        {spellEntry.castingValue && (
                          <span
                            className="text-xs font-mono shrink-0"
                            style={{ color: 'var(--color-accent-blue)' }}
                          >
                            {spellEntry.castingValue}
                          </span>
                        )}
                        {isBound && spellEntry.powerLevel !== undefined && (
                          <span
                            className="text-xs shrink-0"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Pwr {spellEntry.powerLevel}
                          </span>
                        )}
                      </div>

                      {/* Assailment toggle — not applicable to bound spells */}
                      {!isBound && (
                        <button
                          onClick={() =>
                            toggleSpellAssailment(side, sel.unitId, sel.lore, originalIdx)
                          }
                          className="text-xs px-2 py-0.5 rounded shrink-0"
                          title={spellEntry.isAssailment ? 'Remove Assailment tag' : 'Mark as Assailment'}
                          style={{
                            backgroundColor: spellEntry.isAssailment
                              ? 'rgba(217, 119, 6, 0.2)'
                              : 'var(--color-bg-elevated)',
                            color: spellEntry.isAssailment
                              ? 'var(--color-accent-amber)'
                              : 'var(--color-text-secondary)',
                            border: spellEntry.isAssailment
                              ? '1px solid var(--color-accent-amber)'
                              : '1px solid var(--color-border)',
                          }}
                        >
                          Assailment
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
