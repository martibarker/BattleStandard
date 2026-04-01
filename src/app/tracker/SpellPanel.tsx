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
  const isInMagicPhase = currentPhase === 'magic';

  // Visibility rules:
  // – Active player's panel: always visible
  // – Inactive player's panel: visible in combat (Assailment only), hidden otherwise
  const panelVisible = isActiveSide || isInCombat;

  // During combat, inactive player shows only Assailment spells
  const combatInactiveFilter = !isActiveSide && isInCombat;

  const visibleSelections = combatInactiveFilter
    ? allSpells
        .map((sel) => ({ ...sel, spells: sel.spells.filter((sp) => sp.isAssailment) }))
        .filter((sel) => sel.spells.length > 0)
    : allSpells;

  // Empty state
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

  const title = combatInactiveFilter ? 'Assailment Spells' : `Spells${!isInMagicPhase ? ' (Reference)' : ''}`;

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
            <div
              className="text-sm font-semibold mb-2 px-2 py-1 rounded"
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                color: 'var(--color-accent-amber)',
              }}
            >
              {sel.unitName} — {sel.lore}
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
                    (s) => s.unitId === sel.unitId && s.lore === sel.lore
                  );
                  const originalIdx = originalSel
                    ? originalSel.spells.findIndex((s) => s.name === spellEntry.name)
                    : idx;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded"
                      style={{
                        backgroundColor: 'var(--color-bg-dark)',
                        borderLeft: spellEntry.isAssailment
                          ? '2px solid var(--color-accent-amber)'
                          : '2px solid var(--color-accent-blue)',
                      }}
                    >
                      <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {spellEntry.name}
                      </span>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {isInMagicPhase && isActiveSide && (
        <div
          className="mt-4 pt-3 rounded"
          style={{
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Cast your spells now. Mark them in the log when cast.
          </p>
        </div>
      )}
    </div>
  );
}
