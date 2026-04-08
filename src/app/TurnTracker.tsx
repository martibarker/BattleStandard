import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import Setup from './tracker/Setup';
import GameList from './tracker/GameList';
import PhaseCard from './tracker/PhaseCard';
import SpellPanel from './tracker/SpellPanel';
import EventLog from './tracker/EventLog';
import ScorePanel from './tracker/ScorePanel';
import SecondaryScorePrompt from './tracker/SecondaryScorePrompt';
import UnitStatusSidebar from './tracker/UnitStatusSidebar';

/** General's Adjutant page — orchestrator component */
export default function TurnTracker() {
  const isGameActive = useGameStore((s) => s.isGameActive);
  const exitGame = useGameStore((s) => s.exitGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const activeSecondaries = useGameStore((s) => s.activeSecondaries);

  const [showSetup, setShowSetup] = useState(false);
  const [p1SidebarOpen, setP1SidebarOpen] = useState(false);
  const [p2SidebarOpen, setP2SidebarOpen] = useState(false);

  // Hub: game list or new game setup
  if (!isGameActive) {
    if (showSetup) {
      return <Setup onCancel={() => setShowSetup(false)} onStarted={() => setShowSetup(false)} />;
    }
    return <GameList onNewGame={() => setShowSetup(true)} />;
  }

  const showSecondaryPrompt = currentPhase === 'end_of_turn' && activeSecondaries.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
      {/* Exit bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
      >
        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-secondary)' }}>
          General's Adjutant
        </span>

        {/* Mobile sidebar toggles */}
        <div className="flex gap-2 md:hidden">
          <button
            onClick={() => { setP1SidebarOpen((v) => !v); setP2SidebarOpen(false); }}
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: p1SidebarOpen ? 'rgba(217,119,6,0.2)' : 'var(--color-bg-dark)',
              color: p1SidebarOpen ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
              border: `1px solid ${p1SidebarOpen ? 'var(--color-accent-amber)' : 'var(--color-border)'}`,
            }}
          >
            P1 Units
          </button>
          <button
            onClick={() => { setP2SidebarOpen((v) => !v); setP1SidebarOpen(false); }}
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: p2SidebarOpen ? 'rgba(217,119,6,0.2)' : 'var(--color-bg-dark)',
              color: p2SidebarOpen ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
              border: `1px solid ${p2SidebarOpen ? 'var(--color-accent-amber)' : 'var(--color-border)'}`,
            }}
          >
            P2 Units
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => exitGame()}
            className="px-4 py-1.5 rounded text-sm font-semibold"
            style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: 'var(--color-accent-blue)', border: '1px solid var(--color-accent-blue)' }}
          >
            Save &amp; Exit
          </button>
          <button
            onClick={() => { if (confirm('Abandon game? All progress will be lost.')) resetGame(); }}
            className="px-4 py-1.5 rounded text-sm font-semibold"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid #f87171' }}
          >
            Abandon
          </button>
        </div>
      </div>

      {/* Mobile sidebars — collapsible strips */}
      {(p1SidebarOpen || p2SidebarOpen) && (
        <div
          className="md:hidden border-b p-3 overflow-y-auto"
          style={{ maxHeight: '40vh', backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
        >
          <UnitStatusSidebar side={p1SidebarOpen ? 'p1' : 'p2'} />
        </div>
      )}

      {/* Desktop: three-column layout. Mobile: single column. */}
      <div className="flex h-full">
        {/* P1 sidebar — desktop only */}
        <aside
          className="hidden md:block w-52 shrink-0 border-r overflow-y-auto p-3"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            maxHeight: 'calc(100vh - 49px)',
            position: 'sticky',
            top: '49px',
          }}
        >
          <UnitStatusSidebar side="p1" />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="space-y-4 max-w-3xl mx-auto p-4">
            <PhaseCard />

            {/* Spell panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SpellPanel side="p1" />
              <SpellPanel side="p2" />
            </div>

            {/* Score */}
            <ScorePanel />

            {showSecondaryPrompt && <SecondaryScorePrompt />}

            <EventLog />
          </div>
        </main>

        {/* P2 sidebar — desktop only */}
        <aside
          className="hidden md:block w-52 shrink-0 border-l overflow-y-auto p-3"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            maxHeight: 'calc(100vh - 49px)',
            position: 'sticky',
            top: '49px',
          }}
        >
          <UnitStatusSidebar side="p2" />
        </aside>
      </div>
    </div>
  );
}
