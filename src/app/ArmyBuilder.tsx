import { useNavigate } from 'react-router-dom';
import { useArmyStore } from '../store/armyStore';
import { generateArmyText, copyToClipboard, shareNative } from '../utils/dataTransfer';

/** Army Builder dashboard — lists all saved armies */
export default function ArmyBuilder() {
  const armies = useArmyStore((s) => s.armies);
  const deleteArmy = useArmyStore((s) => s.deleteArmy);
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent-amber)' }} className="text-2xl">
          My Armies
        </h1>
        <button
          onClick={() => navigate('/army-builder/new')}
          className="px-4 py-2 rounded text-sm font-semibold"
          style={{ backgroundColor: 'var(--color-accent-amber)', color: '#0f1117' }}
        >
          + New Army
        </button>
      </div>

      {armies.length === 0 ? (
        <div
          className="rounded-lg border p-10 text-center"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <p className="text-lg mb-1">No armies yet</p>
          <p className="text-sm">Create your first army to get started.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {armies.map((army) => (
            <li
              key={army.id}
              className="rounded-lg border flex items-center justify-between p-4 cursor-pointer transition-colors hover:border-amber-500/50"
              style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
              onClick={() => navigate(`/army-builder/${army.id}`)}
            >
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {army.name}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {army.pointsLimit} pts
                  {army.matchedPlayFormats.length > 0 ? ` · ${army.matchedPlayFormats.map(formatFormat).join(' + ')}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {army.entries.length} {army.entries.length === 1 ? 'unit' : 'units'}
                </span>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const text = generateArmyText(army, 'social');
                    const shared = await shareNative(`${army.name} — Battle Standard`, text);
                    if (!shared) await copyToClipboard(text);
                  }}
                  className="text-sm px-2 py-1 rounded"
                  style={{ color: 'var(--color-text-secondary)' }}
                  title="Share army list"
                  aria-label="Share army"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${army.name}"?`)) deleteArmy(army.id);
                  }}
                  className="text-sm px-2 py-1 rounded"
                  style={{ color: 'var(--color-text-secondary)' }}
                  aria-label="Delete army"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatFormat(fmt: string) {
  return { open_war: 'Open War', grand_melee: 'Grand Melee', combined_arms: 'Combined Arms' }[fmt] ?? fmt;
}
