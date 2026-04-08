import { useGameStore, type CombatRecord, type CombatScore, type PlayerSide, emptyCombatScore, totalCombatScore } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';

const SCORE_FIELDS: { key: keyof CombatScore; label: string }[] = [
  { key: 'wounds',     label: 'Wounds' },
  { key: 'ranks',      label: 'Ranks' },
  { key: 'banner',     label: 'Banner' },
  { key: 'closeOrder', label: 'Close Order' },
  { key: 'highGround', label: 'High Ground' },
  { key: 'flank',      label: 'Flank' },
  { key: 'rear',       label: 'Rear' },
];

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
      >−</button>
      <span className="w-6 text-center text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
      >+</button>
    </div>
  );
}

function CombatCard({ combat }: { combat: CombatRecord }) {
  const players = useGameStore((s) => s.players);
  const upsertCombat = useGameStore((s) => s.upsertCombat);
  const resolveCombat = useGameStore((s) => s.resolveCombat);
  const armies = useArmyStore((s) => s.armies);

  const p1Army = players.p1.armyListId ? armies.find((a) => a.id === players.p1.armyListId) : null;
  const p2Army = players.p2.armyListId ? armies.find((a) => a.id === players.p2.armyListId) : null;
  const p1Faction = players.p1.factionId ? getFaction(players.p1.factionId) : null;
  const p2Faction = players.p2.factionId ? getFaction(players.p2.factionId) : null;

  const getNames = (entryIds: string[], side: 'p1' | 'p2') => {
    const army = side === 'p1' ? p1Army : p2Army;
    const faction = side === 'p1' ? p1Faction : p2Faction;
    return entryIds.map((id) => {
      const entry = army?.entries.find((e) => e.id === id);
      return faction?.units.find((u) => u.id === entry?.unitId)?.name ?? entry?.unitName ?? id;
    }).join(', ');
  };

  const updateScore = (side: 'p1' | 'p2', field: keyof CombatScore, value: number) => {
    upsertCombat({
      ...combat,
      p1Score: side === 'p1' ? { ...combat.p1Score, [field]: value } : combat.p1Score,
      p2Score: side === 'p2' ? { ...combat.p2Score, [field]: value } : combat.p2Score,
    });
  };

  const p1Total = totalCombatScore(combat.p1Score);
  const p2Total = totalCombatScore(combat.p2Score);
  const diff = Math.abs(p1Total - p2Total);
  const leader: PlayerSide | 'tied' = p1Total > p2Total ? 'p1' : p2Total > p1Total ? 'p2' : 'tied';

  const handleOutcome = (outcome: CombatRecord['outcome']) => {
    const loserSide: PlayerSide | undefined = leader === 'tied' ? undefined : (leader === 'p1' ? 'p2' : 'p1');
    if (outcome === 'drawn' || !loserSide) {
      upsertCombat({ ...combat, outcome, loserSide: undefined, pursuitDecision: undefined });
    } else {
      upsertCombat({ ...combat, outcome, loserSide, pursuitDecision: undefined });
    }
  };

  const handlePursuit = (decision: CombatRecord['pursuitDecision']) => {
    resolveCombat(combat.id, combat.outcome, combat.loserSide, decision);
  };

  const handleDrawn = () => {
    resolveCombat(combat.id, 'drawn', undefined, undefined);
  };

  const scoreSection = (side: 'p1' | 'p2', score: CombatScore) => (
    <div className="flex-1 space-y-1.5">
      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-accent-amber)' }}>
        {players[side].name}
        <span className="ml-1 text-xs font-normal" style={{ color: 'var(--color-text-secondary)' }}>
          ({getNames(side === 'p1' ? combat.p1EntryIds : combat.p2EntryIds, side)})
        </span>
      </div>
      {SCORE_FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
          <Stepper value={score[key]} onChange={(v) => updateScore(side, key, v)} />
        </div>
      ))}
      <div
        className="flex items-center justify-between mt-2 pt-2 border-t font-semibold text-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span style={{ color: 'var(--color-text-primary)' }}>Total</span>
        <span style={{
          color: leader === side ? 'var(--color-accent-amber)' : leader === 'tied' ? 'var(--color-text-secondary)' : '#f87171',
          fontSize: '1.1rem',
        }}>
          {totalCombatScore(score)}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="rounded border p-4 space-y-4"
      style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
    >
      {/* Combat header */}
      <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
        {getNames(combat.p1EntryIds, 'p1')}
        <span style={{ color: 'var(--color-text-secondary)' }}> vs </span>
        {getNames(combat.p2EntryIds, 'p2')}
        {combat.resolved && (
          <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(22,163,74,0.15)', color: '#16a34a' }}>
            Resolved
          </span>
        )}
      </div>

      {/* Score entry — side by side */}
      <div className="flex gap-6">
        {scoreSection('p1', combat.p1Score)}
        <div className="w-px" style={{ backgroundColor: 'var(--color-border)' }} />
        {scoreSection('p2', combat.p2Score)}
      </div>

      {/* Result summary */}
      {leader !== 'tied' && (
        <div className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
          <span style={{ color: 'var(--color-accent-amber)', fontWeight: 600 }}>
            {players[leader].name}
          </span>
          {' wins by '}
          <span style={{ color: 'var(--color-accent-amber)', fontWeight: 600 }}>{diff}</span>
        </div>
      )}
      {leader === 'tied' && (
        <div className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>Scores tied</div>
      )}

      {/* Outcome buttons */}
      {!combat.resolved && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
            Outcome
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'drawn',       label: 'Drawn Combat' },
              { key: 'give_ground', label: 'Give Ground' },
              { key: 'fall_back',   label: 'Fall Back in Good Order' },
              { key: 'flee',        label: 'Flee!' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => key === 'drawn' ? handleDrawn() : handleOutcome(key)}
                className="px-3 py-1.5 rounded text-sm font-semibold"
                style={{
                  backgroundColor: combat.outcome === key ? 'rgba(217,119,6,0.2)' : 'var(--color-bg-dark)',
                  color: combat.outcome === key ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
                  border: `1px solid ${combat.outcome === key ? 'var(--color-accent-amber)' : 'var(--color-border)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Pursuit decision — only when outcome involves a fleeing/falling-back loser */}
          {(combat.outcome === 'flee' || combat.outcome === 'fall_back') && combat.loserSide && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                {players[combat.loserSide === 'p1' ? 'p2' : 'p1'].name} — Pursuit
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'follow_up', label: 'Follow Up' },
                  { key: 'pursue',    label: 'Pursue' },
                  { key: 'restrain',  label: 'Restrain & Reform' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handlePursuit(key)}
                    className="px-3 py-1.5 rounded text-sm font-semibold"
                    style={{
                      backgroundColor: combat.pursuitDecision === key ? 'rgba(96,165,250,0.2)' : 'var(--color-bg-dark)',
                      color: combat.pursuitDecision === key ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                      border: `1px solid ${combat.pursuitDecision === key ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolved summary */}
      {combat.resolved && combat.outcome && (
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Outcome: <span style={{ color: 'var(--color-text-primary)' }}>{combat.outcome.replace('_', ' ')}</span>
          {combat.pursuitDecision && (
            <> · Pursuit: <span style={{ color: 'var(--color-text-primary)' }}>{combat.pursuitDecision.replace('_', ' ')}</span></>
          )}
        </div>
      )}
    </div>
  );
}

export default function CombatResolution() {
  const combats = useGameStore((s) => s.combats);
  const currentTurn = useGameStore((s) => s.currentTurn);

  // Show combats that are active (current turn OR unresolved from previous turns)
  const activeCombats = combats.filter((c) => !c.resolved || c.turn === currentTurn);

  if (activeCombats.length === 0) {
    return (
      <div
        className="rounded border p-4 text-sm"
        style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        No active combats. Declare charges in the Movement phase to create combats.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        {activeCombats.length} combat{activeCombats.length !== 1 ? 's' : ''} to resolve
      </div>
      {activeCombats.map((c) => (
        <CombatCard key={c.id} combat={c} />
      ))}
    </div>
  );
}
