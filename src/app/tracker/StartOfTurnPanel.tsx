import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';
import type { Unit } from '../../types/faction';
import type { ArmyEntry } from '../../types/army';

// ---------------------------------------------------------------------------
// Gaze of the Gods D6 reference table (Warhammer: The Old World)
// ---------------------------------------------------------------------------

const GAZE_TABLE = [
  { roll: 1,   result: 'The Fates Weigh In The Balance', detail: 'No effect.' },
  { roll: 2,   result: 'Chaotic Attribute',              detail: 'Roll D66 on the Chaos Attribute table.' },
  { roll: 3,   result: 'Chaotic Attribute',              detail: 'Roll D66 on the Chaos Attribute table.' },
  { roll: 4,   result: 'Chaotic Attribute',              detail: 'Roll D66 on the Chaos Attribute table.' },
  { roll: 5,   result: 'Chaotic Attribute',              detail: 'Roll D66 on the Chaos Attribute table.' },
  { roll: 6,   result: 'Apotheosis',                     detail: 'The character becomes a Daemon Prince.' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUnitsWithRule(units: Unit[], entries: ArmyEntry[], ruleId: string): Unit[] {
  return units.filter(
    (u) => entries.some((e) => e.unitId === u.id) && u.special_rules.includes(ruleId),
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StartOfTurnPanel() {
  const currentSide   = useGameStore((s) => s.currentSide);
  const currentTurn   = useGameStore((s) => s.currentTurn);
  const players       = useGameStore((s) => s.players);
  const recordGaze    = useGameStore((s) => s.recordGazeResult);
  const armies        = useArmyStore((s) => s.armies);

  const player  = players[currentSide];
  const army    = player.armyListId ? armies.find((a) => a.id === player.armyListId) : null;
  const faction = player.factionId ? getFaction(player.factionId) : null;
  const entries = army?.entries ?? [];

  const units         = faction?.units ?? [];
  const unitStates    = player.unitStates ?? [];
  const gazeLog       = player.gazeOfGodsLog ?? {};

  // Derive relevant unit lists
  const stupidUnits     = getUnitsWithRule(units, entries, 'stupidity');
  const impetuousUnits  = getUnitsWithRule(units, entries, 'impetuous');
  const gazeCharacters  = faction?.id === 'warriors-of-chaos'
    ? getUnitsWithRule(units, entries, 'gaze_of_the_gods')
    : [];
  const fleeingUnits    = unitStates
    .filter((us) => us.fled && !us.destroyed)
    .map((us) => ({ id: us.unitId, name: us.unitName }));

  // Local checkbox state — resets each render (per-turn tracking)
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Gaze recording state
  const [gazeFormUnitId, setGazeFormUnitId] = useState<string | null>(null);
  const [gazeD6, setGazeD6]               = useState<number>(1);
  const [gazeNote, setGazeNote]           = useState('');
  const [gazeTableOpen, setGazeTableOpen] = useState(false);

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submitGaze = (unitId: string, unitName: string) => {
    const row = GAZE_TABLE.find((r) => r.roll === gazeD6);
    const resultStr = `Turn ${currentTurn}: D6 ${gazeD6} — ${row?.result ?? '?'}${gazeNote ? ` (${gazeNote})` : ''}`;
    recordGaze(currentSide, unitId, resultStr);
    // Reset form
    setGazeFormUnitId(null);
    setGazeD6(1);
    setGazeNote('');
    // Auto-check the character's test row
    toggle(`gaze-${unitId}`);
    void unitName; // used in resultStr via closure
  };

  const hasAnyAction =
    stupidUnits.length > 0 ||
    impetuousUnits.length > 0 ||
    fleeingUnits.length > 0 ||
    gazeCharacters.length > 0;

  if (!hasAnyAction) {
    return (
      <div
        className="rounded border p-4 mb-4"
        style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No mandatory start-of-turn actions.
        </p>
      </div>
    );
  }

  const sectionHeader = (title: string) => (
    <div
      className="text-xs font-semibold uppercase tracking-wide mb-2"
      style={{ color: 'var(--color-accent-amber)' }}
    >
      {title}
    </div>
  );

  const checkRow = (key: string, label: string, sub?: string) => {
    const done = checked.has(key);
    return (
      <label
        key={key}
        className="flex items-start gap-3 px-3 py-2 rounded cursor-pointer"
        style={{
          backgroundColor: done ? 'rgba(217,119,6,0.06)' : 'var(--color-bg-dark)',
        }}
      >
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggle(key)}
          style={{ accentColor: 'var(--color-accent-amber)', marginTop: '2px', flexShrink: 0 }}
        />
        <div>
          <span
            className="text-sm"
            style={{
              color: done ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {label}
          </span>
          {sub && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {sub}
            </p>
          )}
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-4 mb-4">

      {/* ── Stupidity Tests ─────────────────────────────────────────────── */}
      {stupidUnits.length > 0 && (
        <div
          className="rounded border p-4"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-accent-amber)',
            borderLeftWidth: '4px',
          }}
        >
          {sectionHeader('Stupidity Tests')}
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Each unit below must take a Leadership test. If failed, it moves forward
            d6" toward the nearest visible enemy and cannot shoot or cast spells this turn.
          </p>
          <div className="space-y-1">
            {stupidUnits.map((u) =>
              checkRow(`stupid-${u.id}`, u.name, `Ld ${u.profiles[0]?.profile.Ld ?? '?'}`)
            )}
          </div>
        </div>
      )}

      {/* ── Impetuous Tests ─────────────────────────────────────────────── */}
      {impetuousUnits.length > 0 && (
        <div
          className="rounded border p-4"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-accent-amber)',
            borderLeftWidth: '4px',
          }}
        >
          {sectionHeader('Impetuous Units')}
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Units with the Impetuous rule must declare a charge against any visible
            enemy they are able to reach, unless they pass a Leadership test to restrain themselves.
          </p>
          <div className="space-y-1">
            {impetuousUnits.map((u) =>
              checkRow(`impetuous-${u.id}`, u.name, `Ld ${u.profiles[0]?.profile.Ld ?? '?'} to restrain`)
            )}
          </div>
        </div>
      )}

      {/* ── Rally Tests ─────────────────────────────────────────────────── */}
      {fleeingUnits.length > 0 && (
        <div
          className="rounded border p-4"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-accent-amber)',
            borderLeftWidth: '4px',
          }}
        >
          {sectionHeader('Rally Tests')}
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Fleeing units roll against their Leadership to rally. Units within 12″ of
            the General may use his Leadership value instead. Units with Rallying Cry
            nearby allow re-rolls of failed tests.
          </p>
          <div className="space-y-1">
            {fleeingUnits.map((u) =>
              checkRow(`rally-${u.id}`, u.name, 'Fleeing — roll to rally or continue fleeing')
            )}
          </div>
        </div>
      )}

      {/* ── Gaze of the Gods ────────────────────────────────────────────── */}
      {gazeCharacters.length > 0 && (
        <div
          className="rounded border p-4"
          style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
        >
          {sectionHeader('Gaze of the Gods')}
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Record any Gaze rolls for characters who earned one this turn.
          </p>

          {/* D6 Reference — collapsible */}
          <button
            onClick={() => setGazeTableOpen((o) => !o)}
            className="text-xs mb-3"
            style={{ color: 'var(--color-accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {gazeTableOpen ? '▾ Hide' : '▸ Show'} D6 reference table
          </button>
          {gazeTableOpen && (
            <div
              className="rounded mb-3 overflow-hidden text-xs"
              style={{ border: '1px solid var(--color-border)' }}
            >
              {GAZE_TABLE.map((row, i) => (
                <div
                  key={i}
                  className="flex gap-3 px-3 py-1.5"
                  style={{
                    backgroundColor: i % 2 === 0 ? 'var(--color-bg-dark)' : 'var(--color-bg-elevated)',
                  }}
                >
                  <span
                    className="font-mono font-bold shrink-0"
                    style={{ color: 'var(--color-accent-amber)', width: '1.2rem' }}
                  >
                    {row.roll}
                  </span>
                  <span className="font-semibold shrink-0" style={{ color: 'var(--color-text-primary)', minWidth: '10rem' }}>
                    {row.result}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{row.detail}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {gazeCharacters.map((unit) => {
              const log = gazeLog[unit.id] ?? [];
              const isRecording = gazeFormUnitId === unit.id;
              const gazeRow = GAZE_TABLE.find((r) => r.roll === gazeD6);

              return (
                <div
                  key={unit.id}
                  className="rounded p-3"
                  style={{ backgroundColor: 'var(--color-bg-dark)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {unit.name}
                    </span>
                    <button
                      onClick={() => setGazeFormUnitId(isRecording ? null : unit.id)}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: isRecording ? 'rgba(217,119,6,0.15)' : 'var(--color-bg-elevated)',
                        color: isRecording ? 'var(--color-accent-amber)' : 'var(--color-accent-blue)',
                        border: `1px solid ${isRecording ? 'var(--color-accent-amber)' : 'var(--color-border)'}`,
                      }}
                    >
                      {isRecording ? 'Cancel' : '+ Record Result'}
                    </button>
                  </div>

                  {/* Accumulated results */}
                  {log.length > 0 && (
                    <div className="mb-2 space-y-0.5">
                      {log.map((entry, i) => (
                        <p key={i} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {entry}
                        </p>
                      ))}
                    </div>
                  )}
                  {log.length === 0 && !isRecording && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      No results recorded yet.
                    </p>
                  )}

                  {/* Inline recording form */}
                  {isRecording && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                          D6 roll:
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <button
                              key={n}
                              onClick={() => setGazeD6(n)}
                              className="w-7 h-7 rounded text-xs font-semibold"
                              style={{
                                backgroundColor: gazeD6 === n ? 'var(--color-accent-amber)' : 'var(--color-bg-elevated)',
                                color: gazeD6 === n ? 'var(--color-bg-dark)' : 'var(--color-text-primary)',
                                border: `1px solid ${gazeD6 === n ? 'var(--color-accent-amber)' : 'var(--color-border)'}`,
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-accent-amber)' }}>
                          {gazeRow?.result}
                        </span>
                      </div>

                      {/* Note field (for D66 attribute, or apotheosis detail) */}
                      <div>
                        <input
                          type="text"
                          placeholder={gazeD6 >= 2 && gazeD6 <= 5 ? 'D66 result + attribute (e.g. 34 — scaly skin)' : 'Notes (optional)'}
                          value={gazeNote}
                          onChange={(e) => setGazeNote(e.target.value)}
                          className="w-full px-3 py-1.5 rounded text-xs"
                          style={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                      </div>

                      <button
                        onClick={() => submitGaze(unit.id, unit.name)}
                        className="px-3 py-1.5 rounded text-xs font-semibold"
                        style={{
                          backgroundColor: 'var(--color-accent-amber)',
                          color: 'var(--color-bg-dark)',
                        }}
                      >
                        Save Result
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
