import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import Setup from './tracker/Setup';
import GameList from './tracker/GameList';
import PhaseCard from './tracker/PhaseCard';
import UnitChecklist from './tracker/UnitChecklist';
import SpellPanel from './tracker/SpellPanel';
import EventLog from './tracker/EventLog';
import ScorePanel from './tracker/ScorePanel';
import SecondaryScorePrompt from './tracker/SecondaryScorePrompt';

/** General's Adjutant page — orchestrator component */
export default function TurnTracker() {
  const isGameActive = useGameStore((s) => s.isGameActive);
  const exitGame = useGameStore((s) => s.exitGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const currentSide = useGameStore((s) => s.currentSide);
  const players = useGameStore((s) => s.players);
  const activeSecondaries = useGameStore((s) => s.activeSecondaries);

  const [showSetup, setShowSetup] = useState(false);

  // Hub: game list or new game setup
  if (!isGameActive) {
    if (showSetup) {
      return <Setup onCancel={() => setShowSetup(false)} onStarted={() => setShowSetup(false)} />;
    }
    return <GameList onNewGame={() => setShowSetup(true)} />;
  }

  const p1 = players.p1;
  const p2 = players.p2;
  const showChecklist = currentPhase === 'shooting' || currentPhase === 'combat';
  const showSecondaryPrompt = currentPhase === 'end_of_turn' && activeSecondaries.length > 0;

  // Active game tracker layout
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
      {/* Exit bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border)',
        }}
      >
        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-secondary)' }}>
          General's Adjutant
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => exitGame()}
            className="px-4 py-1.5 rounded text-sm font-semibold"
            style={{
              backgroundColor: 'rgba(96, 165, 250, 0.15)',
              color: 'var(--color-accent-blue)',
              border: '1px solid var(--color-accent-blue)',
            }}
          >
            Save &amp; Exit
          </button>
          <button
            onClick={() => {
              if (confirm('Abandon game? All progress will be lost.')) {
                resetGame();
              }
            }}
            className="px-4 py-1.5 rounded text-sm font-semibold"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid #f87171',
            }}
          >
            Abandon
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="space-y-4 max-w-7xl mx-auto p-4">
        <div>
          <PhaseCard />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {p1.name}
            </div>
            <SpellPanel side="p1" />
          </div>

          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {p2.name}
            </div>
            <SpellPanel side="p2" />
          </div>

          {showChecklist && (
            <div className="col-span-2 md:col-span-1 md:order-first">
              <UnitChecklist
                mode={currentPhase === 'shooting' ? 'shooting' : 'combat'}
                side={currentSide}
              />
            </div>
          )}

          {!showChecklist && (
            <div className="col-span-2 md:col-span-1">
              <ScorePanel />
            </div>
          )}
        </div>

        {showSecondaryPrompt && (
          <div>
            <SecondaryScorePrompt />
          </div>
        )}

        <div>
          <EventLog />
        </div>
      </div>
    </div>
  );
}
