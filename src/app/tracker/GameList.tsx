import { useGameStore, type SavedGame } from '../../store/gameStore';

interface Props {
  onNewGame: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function phaseLabel(phase: string): string {
  return phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function GameList({ onNewGame }: Props) {
  const savedGames = useGameStore((s) => s.savedGames);
  const loadGame = useGameStore((s) => s.loadGame);
  const deleteGame = useGameStore((s) => s.deleteGame);

  const cardStyle = {
    backgroundColor: 'var(--color-bg-elevated)',
    borderColor: 'var(--color-border)',
  } as const;

  const sorted = [...savedGames].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
          General's Adjutant
        </h2>
        <button
          onClick={onNewGame}
          className="px-4 py-2 rounded text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-accent-amber)', color: 'var(--color-bg-dark)' }}
        >
          + New Game
        </button>
      </div>

      {sorted.length === 0 ? (
        <div
          className="rounded border p-8 text-center"
          style={{ ...cardStyle, color: 'var(--color-text-secondary)' }}
        >
          <p className="text-sm mb-4">No saved games yet.</p>
          <button
            onClick={onNewGame}
            className="px-4 py-2 rounded text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-accent-amber)', color: 'var(--color-bg-dark)' }}
          >
            Start Your First Game
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((game: SavedGame) => (
            <div key={game.gameId} className="rounded border p-4 flex items-start gap-4" style={cardStyle}>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {game.gameName}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Turn {game.currentTurn} · {phaseLabel(game.currentPhase)} · {game.currentSide === 'p1' ? game.players.p1.name : game.players.p2.name}'s turn
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                  Saved {formatDate(game.savedAt)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => loadGame(game.gameId)}
                  className="px-3 py-1.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: 'var(--color-accent-amber)', color: 'var(--color-bg-dark)' }}
                >
                  Resume
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${game.gameName}"? This cannot be undone.`)) {
                      deleteGame(game.gameId);
                    }
                  }}
                  className="px-3 py-1.5 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
