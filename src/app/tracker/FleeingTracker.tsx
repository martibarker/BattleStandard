import { useGameStore, type PlayerSide } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';

export default function FleeingTracker() {
  const players = useGameStore((s) => s.players);
  const recordRallyAttempt = useGameStore((s) => s.recordRallyAttempt);
  const armies = useArmyStore((s) => s.armies);

  // Collect all fleeing units from both players
  const fleeingUnits: { side: PlayerSide; entryId: string; name: string; rallyAttempt?: 'passed' | 'failed' }[] = [];

  for (const side of ['p1', 'p2'] as PlayerSide[]) {
    const player = players[side];
    const army = player.armyListId ? armies.find((a) => a.id === player.armyListId) : null;
    const faction = player.factionId ? getFaction(player.factionId) : null;

    for (const us of player.unitStates) {
      if (!us.fled || us.destroyed) continue;
      const entry = army?.entries.find((e) => e.id === us.entryId);
      const unitName = faction?.units.find((u) => u.id === entry?.unitId)?.name ?? us.unitName ?? us.entryId;
      fleeingUnits.push({ side, entryId: us.entryId, name: unitName, rallyAttempt: us.rallyAttempt });
    }
  }

  if (fleeingUnits.length === 0) return null;

  return (
    <div
      className="rounded border p-4"
      style={{ backgroundColor: 'rgba(220,38,38,0.05)', borderColor: '#f87171' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: '#f87171', fontSize: '1rem' }}>⚠</span>
        <h3 className="text-sm font-semibold" style={{ color: '#f87171' }}>
          Fleeing Units — Rally Required
        </h3>
      </div>

      <div className="space-y-2">
        {fleeingUnits.map(({ side, entryId, name, rallyAttempt }) => (
          <div
            key={`${side}-${entryId}`}
            className="flex items-center justify-between gap-3 rounded px-3 py-2"
            style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
          >
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {name}
              </span>
              <span className="ml-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {players[side].name}
              </span>
            </div>

            <div className="flex gap-2 shrink-0">
              {rallyAttempt ? (
                <span
                  className="text-xs px-2 py-1 rounded font-semibold"
                  style={{
                    backgroundColor: rallyAttempt === 'passed' ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                    color: rallyAttempt === 'passed' ? '#16a34a' : '#dc2626',
                  }}
                >
                  {rallyAttempt === 'passed' ? '✓ Rallied' : '✗ Still Fleeing'}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => recordRallyAttempt(side, entryId, 'passed')}
                    className="text-xs px-2 py-1 rounded font-semibold"
                    style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid #16a34a' }}
                  >
                    Rallied
                  </button>
                  <button
                    onClick={() => recordRallyAttempt(side, entryId, 'failed')}
                    className="text-xs px-2 py-1 rounded font-semibold"
                    style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#dc2626', border: '1px solid #dc2626' }}
                  >
                    Still Fleeing
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Fleeing units cannot shoot, charge, or cast spells. Failed rally = unit continues to flee; remove if it leaves the table.
      </div>
    </div>
  );
}
