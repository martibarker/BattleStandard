import { useGameStore, type PlayerSide } from '../../store/gameStore';

interface SpellPanelProps {
  side: PlayerSide;
}

export default function SpellPanel({ side }: SpellPanelProps) {
  const players = useGameStore((s) => s.players);
  const currentPhase = useGameStore((s) => s.currentPhase);

  const player = players[side];
  const spells = player.spells ?? [];

  if (spells.length === 0) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Spells
        </h3>
        <p className="text-sm">No wizards in this army.</p>
      </div>
    );
  }

  const isInMagicPhase = currentPhase === 'magic';

  return (
    <div
      className="rounded border p-4"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Spells {!isInMagicPhase && '(Reference)'}
      </h3>

      <div className="space-y-4">
        {spells.map((spell) => (
          <div key={`${spell.unitId}-${spell.lore}`}>
            <div
              className="text-sm font-semibold mb-2 px-2 py-1 rounded"
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                color: 'var(--color-accent-amber)',
              }}
            >
              {spell.unitName} — {spell.lore}
            </div>

            {spell.spells.length === 0 ? (
              <p
                className="text-xs px-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                (No spells recorded)
              </p>
            ) : (
              <div className="space-y-1">
                {spell.spells.map((spellName, idx) => (
                  <div
                    key={idx}
                    className="text-sm px-3 py-2 rounded"
                    style={{
                      backgroundColor: 'var(--color-bg-dark)',
                      color: 'var(--color-text-primary)',
                      borderLeft: '2px solid var(--color-accent-blue)',
                    }}
                  >
                    {spellName}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Magic phase info */}
      {isInMagicPhase && (
        <div
          className="mt-4 pt-4 rounded"
          style={{
            backgroundColor: 'var(--color-bg-dark)',
            borderColor: 'var(--color-border)',
            borderLeft: '2px solid var(--color-accent-blue)',
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
