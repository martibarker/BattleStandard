import { useGameStore } from '../store/gameStore';
import Setup from './tracker/Setup';
import PhaseCard from './tracker/PhaseCard';
import UnitChecklist from './tracker/UnitChecklist';
import SpellPanel from './tracker/SpellPanel';
import EventLog from './tracker/EventLog';
import ScorePanel from './tracker/ScorePanel';

/** Turn Tracker page — orchestrator component */
export default function TurnTracker() {
  const isGameActive = useGameStore((s) => s.isGameActive);
  const resetGame = useGameStore((s) => s.resetGame);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const currentSide = useGameStore((s) => s.currentSide);
  const players = useGameStore((s) => s.players);

  // Setup wizard if game not active
  if (!isGameActive) {
    return <Setup />;
  }

  const p1 = players.p1;
  const p2 = players.p2;
  const showChecklist = currentPhase === 'shooting' || currentPhase === 'combat';

  // Game tracker layout
  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
      {/* Reset button (top-right) */}
      <button
        onClick={() => {
          if (confirm('Reset game? Progress will be lost.')) {
            resetGame();
          }
        }}
        className="fixed top-4 right-4 px-3 py-1 rounded text-xs font-semibold"
        style={{
          backgroundColor: 'rgba(217, 119, 6, 0.2)',
          color: 'var(--color-accent-amber)',
          border: '1px solid var(--color-accent-amber)',
        }}
      >
        Reset
      </button>

      {/* Main layout: Phase card spans full width, supporting panels below */}
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Phase Card - spans full width */}
        <div>
          <PhaseCard />
        </div>

        {/* Supporting panels - 3-column layout */}
        <div className="grid grid-cols-3 gap-4">
          {/* Left: Unit Checklist (if applicable) */}
          {showChecklist && (
            <div>
              <UnitChecklist
                mode={currentPhase === 'shooting' ? 'shooting' : 'combat'}
                side={currentSide}
              />
            </div>
          )}

          {/* Center/Left: Spell Panel P1 */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {p1.name}
            </div>
            <SpellPanel side="p1" />
          </div>

          {/* Center/Right: Spell Panel P2 */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {p2.name}
            </div>
            <SpellPanel side="p2" />
          </div>

          {/* Right: Score Panel */}
          {!showChecklist && (
            <div>
              <ScorePanel />
            </div>
          )}
        </div>

        {/* Bottom: Event Log - full width */}
        <div>
          <EventLog />
        </div>
      </div>
    </div>
  );
}
