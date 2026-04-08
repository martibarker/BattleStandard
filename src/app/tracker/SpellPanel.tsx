import { useGameStore, type PlayerSide } from '../../store/gameStore';

interface SpellPanelProps {
  side: PlayerSide;
}

export default function SpellPanel({ side }: SpellPanelProps) {
  const players = useGameStore((s) => s.players);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const currentSide = useGameStore((s) => s.currentSide);
  const toggleSpellAssailment = useGameStore((s) => s.toggleSpellAssailment);
  const setSpellCastState = useGameStore((s) => s.setSpellCastState);

  const player = players[side];
  const allSpells = player.spells ?? [];

  const isActiveSide = side === currentSide;
  const isInCombat = currentPhase === 'combat';
  const isInStartOfTurn = currentPhase === 'start_of_turn';
  const isInMovement = currentPhase === 'movement';
  const isInShooting = currentPhase === 'shooting';
  const isEndOfTurn = currentPhase === 'end_of_turn';

  // A wizard is "in combat" if any unit state for their spell selection has inCombat set
  const playerUnitStates = player.unitStates;
  const isWizardInCombat = (unitId: string) =>
    playerUnitStates.some((us) => (us.unitId === unitId || us.entryId === unitId) && us.inCombat);

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

  // For each spell selection, filter spells by wizard-in-combat restriction
  const applyInCombatFilter = (selections: typeof allSpells) =>
    selections.map((sel) => {
      if (!isWizardInCombat(sel.unitId)) return sel;
      return {
        ...sel,
        spells: sel.spells.filter(
          (sp) => sp.spellType === 'Hex' || sp.spellType === 'Enchantment' || sp.isAssailment,
        ),
      };
    }).filter((sel) => sel.spells.length > 0);

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
    : applyInCombatFilter(allSpells);

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
    : isEndOfTurn
    ? 'Spell Summary'
    : 'Spells (Reference)';

  const readOnly = isEndOfTurn;

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
                      {/* Spell name + casting value + effect */}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-sm"
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
                        {spellEntry.effect && (
                          <p
                            className="text-xs leading-snug"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {spellEntry.effect}
                          </p>
                        )}
                      </div>

                      {/* Cast state buttons + Assailment toggle */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!readOnly && (['cast', 'failed', 'dispelled'] as const).map((cs) => {
                          const active = spellEntry.castState === cs;
                          const labels = { cast: 'Cast', failed: 'Failed', dispelled: 'Dispelled' };
                          const colors: Record<string, string> = {
                            cast: '#16a34a',
                            failed: '#dc2626',
                            dispelled: '#9333ea',
                          };
                          return (
                            <button
                              key={cs}
                              onClick={() => setSpellCastState(side, sel.unitId, sel.lore, originalIdx, cs)}
                              className="text-xs px-1.5 py-0.5 rounded shrink-0"
                              title={labels[cs]}
                              style={{
                                backgroundColor: active ? `${colors[cs]}22` : 'var(--color-bg-elevated)',
                                color: active ? colors[cs] : 'var(--color-text-secondary)',
                                border: `1px solid ${active ? colors[cs] : 'var(--color-border)'}`,
                              }}
                            >
                              {labels[cs]}
                            </button>
                          );
                        })}
                        {readOnly && spellEntry.castState && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-semibold"
                            style={{
                              backgroundColor: spellEntry.castState === 'cast' ? 'rgba(22,163,74,0.15)'
                                : spellEntry.castState === 'failed' ? 'rgba(220,38,38,0.15)'
                                : 'rgba(147,51,234,0.15)',
                              color: spellEntry.castState === 'cast' ? '#16a34a'
                                : spellEntry.castState === 'failed' ? '#dc2626'
                                : '#9333ea',
                            }}
                          >
                            {spellEntry.castState === 'cast' ? 'Cast' : spellEntry.castState === 'failed' ? 'Failed' : 'Dispelled'}
                          </span>
                        )}
                        {!isBound && !readOnly && (
                          <button
                            onClick={() =>
                              toggleSpellAssailment(side, sel.unitId, sel.lore, originalIdx)
                            }
                            className="text-xs px-1.5 py-0.5 rounded shrink-0"
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
