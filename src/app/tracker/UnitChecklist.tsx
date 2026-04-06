import { useGameStore, type PlayerSide } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';
import type { Unit, Faction } from '../../types/faction';
import type { ArmyEntry } from '../../types/army';

interface UnitChecklistProps {
  mode: 'shooting' | 'combat';
  side: PlayerSide;
}

export default function UnitChecklist({ mode, side }: UnitChecklistProps) {
  const players = useGameStore((s) => s.players);
  const toggleUnitShot = useGameStore((s) => s.toggleUnitShot);
  const toggleUnitFought = useGameStore((s) => s.toggleUnitFought);
  const armies = useArmyStore((s) => s.armies);

  const player = players[side];
  const faction = player.factionId ? getFaction(player.factionId) : null;
  const army = player.armyListId ? armies.find((a) => a.id === player.armyListId) : null;

  if (!faction || !army) {
    return (
      <div
        className="rounded border p-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <p className="text-sm">No army selected. Checklist unavailable.</p>
      </div>
    );
  }

  // Get units that should appear in the checklist
  const checklistUnits = getChecklistUnits(mode, faction, army.entries);

  const title = mode === 'shooting' ? 'Ranged Attacks' : 'Close Combat';
  const toggle = mode === 'shooting' ? toggleUnitShot : toggleUnitFought;

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

      {checklistUnits.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No units available for {mode}.
        </p>
      ) : (
        <div className="space-y-2">
          {checklistUnits.map((unit) => {
            const entry = army.entries.find((e) => e.unitId === unit.id);
            const unitState = player.unitStates?.find((us) => us.entryId === entry?.id);
            const isChecked =
              mode === 'shooting' ? unitState?.hasShot ?? false : unitState?.hasFought ?? false;
            const isDestroyed = unitState?.destroyed ?? false;
            const isFled = unitState?.fled ?? false;

            return (
              <label
                key={unit.id}
                className="flex items-center gap-3 p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'var(--color-bg-dark)',
                  opacity: isDestroyed || isFled ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    if (entry?.id) {
                      toggle(side, entry.id);
                    }
                  }}
                  disabled={isDestroyed || isFled}
                  className="w-4 h-4"
                />
                <span
                  className="text-sm flex-1"
                  style={{
                    color: isDestroyed
                      ? 'var(--color-text-secondary)'
                      : isFled
                        ? 'var(--color-text-secondary)'
                        : isChecked
                          ? 'var(--color-accent-amber)'
                          : 'var(--color-text-primary)',
                    textDecoration: isDestroyed || isFled ? 'line-through' : 'none',
                  }}
                >
                  {unit.name}
                </span>
                {isDestroyed && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'rgba(255,0,0,0.1)',
                      color: 'var(--color-accent-red, #ef4444)',
                    }}
                  >
                    Destroyed
                  </span>
                )}
                {isFled && (
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'rgba(255,165,0,0.1)',
                      color: 'var(--color-accent-orange, #f97316)',
                    }}
                  >
                    Fled
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {/* Progress indicator */}
      {checklistUnits.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Progress:{' '}
              {checklistUnits.filter((unit) => {
                const entry = army.entries.find((e) => e.unitId === unit.id);
                const unitState = player.unitStates?.find((us) => us.entryId === entry?.id);
                return mode === 'shooting'
                  ? unitState?.hasShot ?? false
                  : unitState?.hasFought ?? false;
              }).length}{' '}
              / {checklistUnits.length}
            </span>
            <div
              className="w-24 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-bg-dark)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  backgroundColor: 'var(--color-accent-amber)',
                  width: `${(checklistUnits.filter((unit) => {
                    const entry = army.entries.find((e) => e.unitId === unit.id);
                    const unitState = player.unitStates?.find((us) => us.entryId === entry?.id);
                    return mode === 'shooting'
                      ? unitState?.hasShot ?? false
                      : unitState?.hasFought ?? false;
                  }).length / checklistUnits.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getChecklistUnits(mode: 'shooting' | 'combat', faction: Faction, entries: ArmyEntry[]): Unit[] {
  if (mode === 'shooting') {
    // Return units with ranged weapon profiles
    return faction.units.filter((u: Unit) =>
      entries.some((e) => e.unitId === u.id) &&
      u.weapon_profiles?.some((wp) => wp.range !== 'Combat')
    );
  } else {
    // For combat, return all units (they may have melee weapons)
    return faction.units.filter((u: Unit) =>
      entries.some((e) => e.unitId === u.id) && u.category !== 'mount'
    );
  }
}
