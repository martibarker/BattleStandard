import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { SECONDARY_OBJECTIVES } from '../../data/secondary-objectives';

const SCORING_RULES = {
  unitDestroyed: 'Unit destroyed: 100 × (unit cost / 1,000) VP',
  modelFled: 'Model fled: 25 VP per model',
  secondaryObjective: 'Secondary objective: 20 VP (varies by format)',
};

export default function ScorePanel() {
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const turnLimit = useGameStore((s) => s.turnLimit);
  const [scores, setScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [showGuide, setShowGuide] = useState(false);
  const activeSecondaries = useGameStore((s) => s.activeSecondaries);

  const p1 = players.p1;
  const p2 = players.p2;

  const handleScoreChange = (side: 'p1' | 'p2', value: string) => {
    const num = parseInt(value) || 0;
    setScores((s) => ({ ...s, [side]: Math.max(0, num) }));
  };

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

      {/* Active Secondary Objectives */}
      {activeSecondaries.length > 0 && (
        <div className="mb-4 space-y-2">
          {activeSecondaries.map((secondaryId) => {
            const secondary = SECONDARY_OBJECTIVES.flatMap((set) => set.objectives).find(
              (obj) => obj.id === secondaryId
            );
            if (!secondary) return null;

            return (
              <div key={secondaryId} className="text-xs">
                <div
                  className="flex items-center gap-2 p-2 rounded"
                  style={{
                    backgroundColor: 'var(--color-bg-dark)',
                    borderLeft: '2px solid var(--color-accent-blue)',
                  }}
                >
                  <span>{secondary.name}</span>
                  <span
                    className="ml-auto font-semibold"
                    style={{ color: 'var(--color-accent-amber)' }}
                  >
                    +{secondary.vpValue}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 */}
        <div
          className="rounded p-3"
          style={{
            backgroundColor: 'var(--color-bg-dark)',
            borderLeft: '3px solid var(--color-accent-amber)',
          }}
        >
          <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {p1.name}
            {p1.isAttacker && ' (Attacker)'}
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {scores.p1}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              VP
            </span>
          </div>
          <input
            type="number"
            min="0"
            value={scores.p1}
            onChange={(e) => handleScoreChange('p1', e.target.value)}
            className="w-full px-2 py-1 rounded text-sm"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Player 2 */}
        <div
          className="rounded p-3"
          style={{
            backgroundColor: 'var(--color-bg-dark)',
            borderLeft: '3px solid var(--color-accent-blue)',
          }}
        >
          <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {p2.name}
            {p2.isAttacker && ' (Attacker)'}
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {scores.p2}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              VP
            </span>
          </div>
          <input
            type="number"
            min="0"
            value={scores.p2}
            onChange={(e) => handleScoreChange('p2', e.target.value)}
            className="w-full px-2 py-1 rounded text-sm"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* VP Difference */}
      <div
        className="mt-4 pt-4 rounded p-3 text-center"
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Difference
        </p>
        <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          <span
            style={{
              color:
                scores.p1 > scores.p2
                  ? 'var(--color-accent-amber)'
                  : scores.p2 > scores.p1
                    ? 'var(--color-accent-blue)'
                    : 'var(--color-text-secondary)',
            }}
          >
            {Math.abs(scores.p1 - scores.p2)}
          </span>
          <span style={{ fontSize: '0.6em', marginLeft: '4px', color: 'var(--color-text-secondary)' }}>
            {scores.p1 > scores.p2 ? p1.name : scores.p2 > scores.p1 ? p2.name : 'Tied'}
          </span>
        </p>
      </div>

      {/* Turn info */}
      <div
        className="mt-4 text-center text-xs"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Turn {currentTurn} of {turnLimit}
      </div>

      {/* Scoring Guide Toggle */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-2 py-2 rounded text-xs font-semibold text-center"
          style={{
            backgroundColor: 'var(--color-bg-dark)',
            color: 'var(--color-accent-blue)',
          }}
        >
          {showGuide ? '▼' : '▶'} Scoring Guide
        </button>

        {showGuide && (
          <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <p className="font-semibold mb-1">Primary Scoring:</p>
              {Object.entries(SCORING_RULES).map(([key, rule]) => (
                <div key={key} className="mb-1 text-xs">
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
