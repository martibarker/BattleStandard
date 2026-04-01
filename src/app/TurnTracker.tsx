import { useGameStore } from '../store/gameStore';
import Setup from './tracker/Setup';
import PhaseCard from './tracker/PhaseCard';
import UnitChecklist from './tracker/UnitChecklist';
import SpellPanel from './tracker/SpellPanel';
import EventLog from './tracker/EventLog';
import ScorePanel from './tracker/ScorePanel';
import SecondaryScorePrompt from './tracker/SecondaryScorePrompt';

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
  const activeSecondaries = useGameStore((s) => s.activeSecondaries);
  const showSecondaryPrompt = currentPhase === 'end_of_turn' && activeSecondaries.length > 0;

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

        {/* Supporting panels
            Mobile:  spells side-by-side (2-col) on row 1; VP/checklist full-width below
            Desktop: 3-column grid (unchanged) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Spell Panel P1 */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {p1.name}
            </div>
            <SpellPanel side="p1" />
          </div>

          {/* Spell Panel P2 */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {p2.name}
            </div>
            <SpellPanel side="p2" />
          </div>

          {/* Unit Checklist — full-width on mobile, 3rd col on desktop (order-first shifts it left) */}
          {showChecklist && (
            <div className="col-span-2 md:col-span-1 md:order-first">
              <UnitChecklist
                mode={currentPhase === 'shooting' ? 'shooting' : 'combat'}
                side={currentSide}
              />
            </div>
          )}

          {/* Score Panel — full-width on mobile, 3rd col on desktop */}
          {!showChecklist && (
            <div className="col-span-2 md:col-span-1">
              <ScorePanel />
            </div>
          )}
        </div>

        {/* Secondary objectives scoring prompt — end of turn only */}
        {showSecondaryPrompt && (
          <div>
            <SecondaryScorePrompt />
          </div>
        )}

        {/* Bottom: Event Log - full width */}
        <div>
          <EventLog />
        </div>
      </div>
    </div>
  );
}
