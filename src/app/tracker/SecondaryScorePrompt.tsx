import { useGameStore, type PlayerSide } from '../../store/gameStore';
import { SECONDARY_OBJECTIVES } from '../../data/secondary-objectives';

/**
 * Shown during the End of Turn phase when active secondaries are in play.
 * Lets either player record VP scored from a secondary objective this turn.
 */
export default function SecondaryScorePrompt() {
  const activeSecondaries = useGameStore((s) => s.activeSecondaries);
  const secondaryScores = useGameStore((s) => s.secondaryScores);
  const players = useGameStore((s) => s.players);
  const addSecondaryVP = useGameStore((s) => s.addSecondaryVP);

  if (activeSecondaries.length === 0) return null;

  return (
    <div
      className="rounded border p-4"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-accent-amber)',
        borderLeftWidth: '4px',
      }}
    >
      <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Secondary Objectives
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        Did either player score a secondary this turn?
      </p>

      <div className="space-y-3">
        {activeSecondaries.map((id) => {
          const obj = SECONDARY_OBJECTIVES.flatMap((s) => s.objectives).find((o) => o.id === id);
          if (!obj) return null;

          return (
            <div
              key={id}
              className="rounded p-3"
              style={{ backgroundColor: 'var(--color-bg-dark)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {obj.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {obj.description}
                  </p>
                </div>
                <span
                  className="text-xs font-bold shrink-0"
                  style={{ color: 'var(--color-accent-amber)' }}
                >
                  +{obj.vpValue} VP
                </span>
              </div>

              <div className="flex gap-2 mt-2">
                {(['p1', 'p2'] as PlayerSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => addSecondaryVP(side, obj.vpValue, obj.name)}
                    className="flex-1 py-2 rounded text-sm font-semibold"
                    style={{
                      backgroundColor:
                        side === 'p1'
                          ? 'rgba(217, 119, 6, 0.15)'
                          : 'rgba(96, 165, 250, 0.15)',
                      color:
                        side === 'p1'
                          ? 'var(--color-accent-amber)'
                          : 'var(--color-accent-blue)',
                      border: `1px solid ${
                        side === 'p1' ? 'var(--color-accent-amber)' : 'var(--color-accent-blue)'
                      }`,
                    }}
                  >
                    {players[side].name} scored
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Running secondary totals */}
      <div
        className="mt-4 pt-3 flex justify-around text-center"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        {(['p1', 'p2'] as PlayerSide[]).map((side) => (
          <div key={side}>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {players[side].name}
            </p>
            <p
              className="text-xl font-bold"
              style={{
                fontFamily: 'var(--font-heading)',
                color: side === 'p1' ? 'var(--color-accent-amber)' : 'var(--color-accent-blue)',
              }}
            >
              {secondaryScores[side]}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              secondary VP
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
