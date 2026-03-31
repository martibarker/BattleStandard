import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function EventLog() {
  const log = useGameStore((s) => s.log);
  const addEvent = useGameStore((s) => s.addEvent);
  const currentSide = useGameStore((s) => s.currentSide);
  const players = useGameStore((s) => s.players);

  const p1Name = players.p1.name;
  const p2Name = players.p2.name;

  // Reverse log to show most recent at top
  const reversedLog = [...log].reverse();

  const handleAddEvent = (message: string) => {
    if (message.trim()) {
      addEvent(currentSide, message);
    }
  };

  return (
    <div
      className="rounded border p-4 h-96 flex flex-col"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
        Game Log
      </h3>

      {/* Event list */}
      <div
        className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2"
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          padding: '8px',
          borderRadius: '4px',
        }}
      >
        {reversedLog.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No events yet.
          </p>
        ) : (
          reversedLog.map((event) => {
            const playerName = event.side === 'p1' ? p1Name : p2Name;
            return (
              <div key={event.id} className="text-xs">
                <div
                  style={{
                    color:
                      event.side === 'p1'
                        ? 'var(--color-accent-amber)'
                        : 'var(--color-accent-blue)',
                    fontWeight: 600,
                  }}
                >
                  {playerName} — Turn {event.turn}, {formatPhase(event.phase)}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {event.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick log entry */}
      <QuickEventEntry onSubmit={handleAddEvent} />
    </div>
  );
}

interface QuickEventEntryProps {
  onSubmit: (message: string) => void;
}

function QuickEventEntry({ onSubmit }: QuickEventEntryProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Log an event..."
        className="flex-1 px-2 py-1 rounded text-xs"
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      />
      <button
        onClick={handleSubmit}
        className="px-3 py-1 rounded text-xs font-semibold"
        style={{
          backgroundColor: 'var(--color-accent-amber)',
          color: 'var(--color-bg-dark)',
        }}
      >
        Log
      </button>
    </div>
  );
}

function formatPhase(phase: string): string {
  return (
    {
      setup: 'Setup',
      start_of_turn: 'Start',
      movement: 'Move',
      shooting: 'Shoot',
      magic: 'Magic',
      combat: 'Combat',
      end_of_turn: 'End',
    } as Record<string, string>
  )[phase] || phase;
}
