import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArmyStore } from '../store/armyStore';
import { FACTIONS } from '../data/factions/index';
import type { MatchedPlayFormat } from '../types/army';
import type { Faction } from '../types/faction';

const POINTS_PRESETS = [500, 750, 1000, 1500, 2000, 2500, 3000];

const MATCHED_PLAY_OPTIONS: { value: MatchedPlayFormat; label: string; desc: string }[] = [
  { value: 'open_war', label: 'Open War', desc: 'Standard army book rules with no extra restrictions.' },
  {
    value: 'grand_melee',
    label: 'Grand Melee',
    desc: 'No single unit or character may cost more than 25% of the army points limit.',
  },
  {
    value: 'combined_arms',
    label: 'Combined Arms',
    desc: 'Limits on identical units: max 3 characters, 4 core, 3 special, 2 rare/mercenary.',
  },
];

export default function NewArmy() {
  const navigate = useNavigate();
  const createArmy = useArmyStore((s) => s.createArmy);

  const [selectedFaction, setSelectedFaction] = useState<Faction>(FACTIONS[0]);
  const [compositionId, setCompositionId] = useState(FACTIONS[0].army_compositions[0]?.id ?? '');
  const [name, setName] = useState('');
  const [matchedPlayFormats, setMatchedPlayFormats] = useState<MatchedPlayFormat[]>([]);
  const [pointsLimit, setPointsLimit] = useState(2000);
  const [customPoints, setCustomPoints] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const effectivePoints = useCustom ? parseInt(customPoints) || 0 : pointsLimit;

  function handleFactionChange(faction: Faction) {
    setSelectedFaction(faction);
    setCompositionId(faction.army_compositions[0]?.id ?? '');
  }

  function handleCreate() {
    if (!name.trim() || effectivePoints < 100) return;
    const id = createArmy({
      name: name.trim(),
      factionId: selectedFaction.id,
      compositionId,
      matchedPlayFormats,
      pointsLimit: effectivePoints,
    });
    navigate(`/army-builder/${id}`);
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button
        onClick={() => navigate('/army-builder')}
        className="text-sm mb-5 flex items-center gap-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        ← Back
      </button>

      <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent-amber)' }} className="text-2xl mb-6">
        New Army
      </h1>

      <div className="flex flex-col gap-5">
        {/* Army name */}
        <Field label="Army name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Couronne Host"
            className="w-full rounded px-3 py-2 text-base"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
        </Field>

        {/* Faction */}
        <Field label="Faction">
          <div className="grid grid-cols-2 gap-2">
            {FACTIONS.map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-2 rounded p-2.5 cursor-pointer border transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: selectedFaction.id === f.id ? 'var(--color-accent-amber)' : 'var(--color-border)',
                }}
              >
                <input
                  type="radio"
                  name="faction"
                  checked={selectedFaction.id === f.id}
                  onChange={() => handleFactionChange(f)}
                  className="shrink-0"
                />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {f.name}
                </span>
              </label>
            ))}
          </div>
        </Field>

        {/* Army composition */}
        <Field label="Army composition">
          <div className="flex flex-col gap-2">
            {selectedFaction.army_compositions.map((comp) => (
              <label
                key={comp.id}
                className="flex items-start gap-3 rounded p-3 cursor-pointer border transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: compositionId === comp.id ? 'var(--color-accent-amber)' : 'var(--color-border)',
                }}
              >
                <input
                  type="radio"
                  name="composition"
                  value={comp.id}
                  checked={compositionId === comp.id}
                  onChange={() => setCompositionId(comp.id)}
                  className="mt-1 shrink-0"
                />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {comp.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {comp.source === 'arcane_journal' ? 'Arcane Journal' : 'Forces of Fantasy'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Field>

        {/* Matched Play formats */}
        <Field label="Matched Play formats">
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Select any combination. Grand Melee and Combined Arms stack.
          </p>
          <div className="flex flex-col gap-2">
            {MATCHED_PLAY_OPTIONS.map((opt) => {
              const fmt = opt.value;
              const active = matchedPlayFormats.includes(fmt);
              return (
                <label
                  key={fmt}
                  className="flex items-start gap-3 rounded p-3 cursor-pointer border transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: active ? 'var(--color-accent-blue)' : 'var(--color-border)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) =>
                      setMatchedPlayFormats((prev) =>
                        e.target.checked ? [...prev, fmt] : prev.filter((f) => f !== fmt)
                      )
                    }
                    className="mt-1 shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {opt.desc}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </Field>

        {/* Points limit */}
        <Field label="Points limit">
          <div className="flex flex-wrap gap-2 mb-2">
            {POINTS_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { setUseCustom(false); setPointsLimit(p); }}
                className="px-3 py-1 rounded text-sm font-medium border transition-colors"
                style={{
                  backgroundColor: !useCustom && pointsLimit === p ? 'var(--color-accent-amber)' : 'var(--color-bg-elevated)',
                  color: !useCustom && pointsLimit === p ? '#0f1117' : 'var(--color-text-primary)',
                  borderColor: !useCustom && pointsLimit === p ? 'var(--color-accent-amber)' : 'var(--color-border)',
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setUseCustom(true)}
              className="px-3 py-1 rounded text-sm font-medium border transition-colors"
              style={{
                backgroundColor: useCustom ? 'var(--color-accent-amber)' : 'var(--color-bg-elevated)',
                color: useCustom ? '#0f1117' : 'var(--color-text-primary)',
                borderColor: useCustom ? 'var(--color-accent-amber)' : 'var(--color-border)',
              }}
            >
              Custom
            </button>
          </div>
          {useCustom && (
            <input
              type="number"
              value={customPoints}
              onChange={(e) => setCustomPoints(e.target.value)}
              placeholder="Enter points"
              min={100}
              className="w-full rounded px-3 py-2 text-base"
              style={{
                backgroundColor: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
          )}
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Limit: <strong style={{ color: 'var(--color-text-primary)' }}>{effectivePoints} pts</strong>
          </p>
        </Field>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || effectivePoints < 100}
          className="w-full py-3 rounded font-semibold text-base transition-opacity disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-accent-amber)', color: '#0f1117' }}
        >
          Create Army
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
