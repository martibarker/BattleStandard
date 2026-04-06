import { useState } from 'react';
import { useGameStore, type PlayerGameState } from '../../store/gameStore';
import { SECONDARY_OBJECTIVES } from '../../data/secondary-objectives';

interface PlayerColProps {
  side: 'p1' | 'p2';
  player: PlayerGameState;
  accentColor: string;
  battle: number;
  secondary: number;
  showSecondary: boolean;
  onBattleScoreChange: (side: 'p1' | 'p2', value: string) => void;
}

function PlayerCol({ side, player, accentColor, battle, secondary, showSecondary, onBattleScoreChange }: PlayerColProps) {
  const total = battle + secondary;

  return (
    <div
      className="rounded p-3"
      style={{
        backgroundColor: 'var(--color-bg-dark)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        {player.name}
        {player.isAttacker && ' (Attacker)'}
      </div>

      {/* Total — prominent */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
          {total}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          VP total
        </span>
      </div>

      {/* Battle sub-score */}
      <div className="mb-2">
        <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Battle VP
        </label>
        <input
          type="number"
          min="0"
          value={battle}
          onChange={(e) => onBattleScoreChange(side, e.target.value)}
          className="w-full px-2 py-1 rounded text-sm"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Secondary sub-score */}
      {showSecondary && (
        <div
          className="text-xs px-2 py-1 rounded flex justify-between"
          style={{ backgroundColor: 'var(--color-bg-elevated)' }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>Secondary VP</span>
          <span style={{ color: 'var(--color-accent-amber)', fontWeight: 600 }}>{secondary}</span>
        </div>
      )}
    </div>
  );
}

const SCORING_RULES = {
  unitDestroyed: 'Unit destroyed: 100 × (unit cost / 1,000) VP',
  modelFled: 'Model fled: 25 VP per model',
  secondaryObjective: 'Secondary objective: VP value varies by objective',
};

export default function ScorePanel() {
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const turnLimit = useGameStore((s) => s.turnLimit);
  const activeSecondaries = useGameStore((s) => s.activeSecondaries);
  const secondaryScores = useGameStore((s) => s.secondaryScores);

  const [battleScores, setBattleScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [showGuide, setShowGuide] = useState(false);

  const p1 = players.p1;
  const p2 = players.p2;

  const p1Total = battleScores.p1 + secondaryScores.p1;
  const p2Total = battleScores.p2 + secondaryScores.p2;

  const handleBattleScoreChange = (side: 'p1' | 'p2', value: string) => {
    const num = parseInt(value) || 0;
    setBattleScores((s) => ({ ...s, [side]: Math.max(0, num) }));
  };

  const showSecondary = activeSecondaries.length > 0;

  return (
    <div
      className="rounded border p-4"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Victory Points
      </h3>

      {/* Active Secondary Objectives reference */}
      {activeSecondaries.length > 0 && (
        <div className="mb-4 space-y-1">
          {activeSecondaries.map((id) => {
            const obj = SECONDARY_OBJECTIVES.find((o) => o.id === id);
            if (!obj) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-2 p-2 rounded text-xs"
                style={{ backgroundColor: 'var(--color-bg-dark)', borderLeft: '2px solid var(--color-accent-blue)' }}
              >
                <span style={{ color: 'var(--color-text-primary)' }}>{obj.name}</span>
                <span className="ml-auto font-semibold" style={{ color: 'var(--color-accent-amber)' }}>
                  {obj.vpSummary}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <PlayerCol side="p1" player={p1} accentColor="var(--color-accent-amber)" battle={battleScores.p1} secondary={secondaryScores.p1} showSecondary={showSecondary} onBattleScoreChange={handleBattleScoreChange} />
        <PlayerCol side="p2" player={p2} accentColor="var(--color-accent-blue)" battle={battleScores.p2} secondary={secondaryScores.p2} showSecondary={showSecondary} onBattleScoreChange={handleBattleScoreChange} />
      </div>

      {/* Difference */}
      <div
        className="mt-4 p-3 rounded text-center"
        style={{ backgroundColor: 'var(--color-bg-dark)' }}
      >
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Difference
        </p>
        <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          <span
            style={{
              color:
                p1Total > p2Total
                  ? 'var(--color-accent-amber)'
                  : p2Total > p1Total
                  ? 'var(--color-accent-blue)'
                  : 'var(--color-text-secondary)',
            }}
          >
            {Math.abs(p1Total - p2Total)}
          </span>
          <span style={{ fontSize: '0.6em', marginLeft: '4px', color: 'var(--color-text-secondary)' }}>
            {p1Total > p2Total ? p1.name : p2Total > p1Total ? p2.name : 'Tied'}
          </span>
        </p>
      </div>

      <div className="mt-3 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Turn {currentTurn} of {turnLimit}
      </div>

      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-2 py-2 rounded text-xs font-semibold text-center"
          style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-accent-blue)' }}
        >
          {showGuide ? '▼' : '▶'} Scoring Guide
        </button>

        {showGuide && (
          <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <p className="font-semibold mb-1">Primary Scoring:</p>
              {Object.entries(SCORING_RULES).map(([key, rule]) => (
                <div key={key} className="mb-1">
                  {rule}
                </div>
              ))}
            </div>
            <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
              See Matched Play Guide for secondary objectives and format details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
