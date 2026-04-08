import { useGameStore, type PlayerSide } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';

interface Props {
  side: PlayerSide;
}

export default function UnitStatusSidebar({ side }: Props) {
  const players = useGameStore((s) => s.players);
  const markUnitFled = useGameStore((s) => s.markUnitFled);
  const markUnitInCombat = useGameStore((s) => s.markUnitInCombat);
  const markUnitDestroyed = useGameStore((s) => s.markUnitDestroyed);
  const armies = useArmyStore((s) => s.armies);

  const player = players[side];
  const army = player.armyListId ? armies.find((a) => a.id === player.armyListId) : null;
  const faction = player.factionId ? getFaction(player.factionId) : null;

  const entries = army?.entries ?? [];

  if (entries.length === 0) {
    return (
      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        No army loaded.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        className="text-xs font-semibold uppercase tracking-wide pb-1 mb-1 border-b"
        style={{ color: 'var(--color-accent-amber)', borderColor: 'var(--color-border)' }}
      >
        {player.name}
      </div>
      {entries.map((entry) => {
        const unitName = faction?.units.find((u) => u.id === entry.unitId)?.name ?? entry.unitName ?? entry.unitId;
        const us = player.unitStates.find((u) => u.entryId === entry.id);
        const destroyed = us?.destroyed ?? false;
        const fled = us?.fled ?? false;
        const inCombat = us?.inCombat ?? false;
        const chargeFailed = us?.chargeFailed ?? false;

        return (
          <div
            key={entry.id}
            className="rounded px-2 py-1.5 text-xs"
            style={{
              backgroundColor: destroyed ? 'rgba(0,0,0,0.2)' : 'var(--color-bg-dark)',
              border: '1px solid var(--color-border)',
              opacity: destroyed ? 0.5 : 1,
            }}
          >
            {/* Unit name */}
            <div
              className="font-medium truncate mb-1"
              style={{ color: destroyed ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', textDecoration: destroyed ? 'line-through' : 'none' }}
            >
              {unitName}
            </div>

            {/* Status chips row */}
            <div className="flex flex-wrap gap-1">
              {inCombat && (
                <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'rgba(217,119,6,0.2)', color: 'var(--color-accent-amber)' }}>
                  Combat
                </span>
              )}
              {fled && (
                <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#f87171' }}>
                  Fleeing
                </span>
              )}
              {chargeFailed && !fled && !inCombat && (
                <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>
                  Charge Failed
                </span>
              )}
            </div>

            {/* Action buttons */}
            {!destroyed && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {/* Toggle Fleeing */}
                <button
                  onClick={() => markUnitFled(side, entry.id)}
                  disabled={fled}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: fled ? 'rgba(220,38,38,0.15)' : 'var(--color-bg-elevated)',
                    color: fled ? '#f87171' : 'var(--color-text-secondary)',
                    border: `1px solid ${fled ? '#f87171' : 'var(--color-border)'}`,
                    cursor: fled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {fled ? 'Fleeing' : 'Mark Fled'}
                </button>

                {/* Toggle In Combat */}
                <button
                  onClick={() => markUnitInCombat(side, entry.id, !inCombat)}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: inCombat ? 'rgba(217,119,6,0.2)' : 'var(--color-bg-elevated)',
                    color: inCombat ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
                    border: `1px solid ${inCombat ? 'var(--color-accent-amber)' : 'var(--color-border)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {inCombat ? 'In Combat' : 'Combat'}
                </button>

                {/* Destroy */}
                <button
                  onClick={() => markUnitDestroyed(side, entry.id)}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    color: '#f87171',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
