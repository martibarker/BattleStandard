import { useState } from 'react';
import { useGameStore, type PlayerSide, emptyCombatScore } from '../../store/gameStore';
import { useArmyStore } from '../../store/armyStore';
import { getFaction } from '../../data/factions';
import type { ArmyEntry } from '../../types/army';

interface DeclaredCharge {
  id: string;
  /** Active player's entry IDs involved in this charge */
  attackerEntryIds: string[];
  attackerNames: string[];
  /** Opponent's entry IDs being charged */
  defenderEntryIds: string[];
  defenderNames: string[];
  result?: 'success' | 'failed';
}


export default function ChargeScreen() {
  const players = useGameStore((s) => s.players);
  const currentSide = useGameStore((s) => s.currentSide);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const markUnitInCombat = useGameStore((s) => s.markUnitInCombat);
  const markChargeFailed = useGameStore((s) => s.markChargeFailed);
  const upsertCombat = useGameStore((s) => s.upsertCombat);
  const armies = useArmyStore((s) => s.armies);

  const opponentSide: PlayerSide = currentSide === 'p1' ? 'p2' : 'p1';
  const attacker = players[currentSide];
  const defender = players[opponentSide];

  const attackerArmy = attacker.armyListId ? armies.find((a) => a.id === attacker.armyListId) : null;
  const defenderArmy = defender.armyListId ? armies.find((a) => a.id === defender.armyListId) : null;
  const attackerFaction = attacker.factionId ? getFaction(attacker.factionId) : null;
  const defenderFaction = defender.factionId ? getFaction(defender.factionId) : null;

  // All non-destroyed, non-fleeing attacker entries
  const attackerEntries: ArmyEntry[] = (attackerArmy?.entries ?? []).filter((e) => {
    const us = attacker.unitStates.find((u) => u.entryId === e.id);
    return !us?.destroyed;
  });

  // All non-destroyed defender entries
  const defenderEntries: ArmyEntry[] = (defenderArmy?.entries ?? []).filter((e) => {
    const us = defender.unitStates.find((u) => u.entryId === e.id);
    return !us?.destroyed;
  });

  const getUnitLabel = (entryId: string, side: 'attacker' | 'defender'): string => {
    const entries = side === 'attacker' ? attackerEntries : defenderEntries;
    const faction = side === 'attacker' ? attackerFaction : defenderFaction;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return entryId;
    return faction?.units.find((u) => u.id === entry.unitId)?.name ?? entry.customName ?? entryId;
  };

  // Local charge declaration state
  const [selectedAttackers, setSelectedAttackers] = useState<string[]>([]);
  const [selectedDefenders, setSelectedDefenders] = useState<string[]>([]);
  const [declared, setDeclared] = useState<DeclaredCharge[]>([]);
  const [applied, setApplied] = useState(false);

  // IDs already involved in a declared charge
  const usedAttackerIds = new Set(declared.flatMap((d) => d.attackerEntryIds));
  const usedDefenderIds = new Set(declared.flatMap((d) => d.defenderEntryIds));

  const toggleAttacker = (id: string) => {
    if (usedAttackerIds.has(id)) return;
    setSelectedAttackers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDefender = (id: string) => {
    if (usedDefenderIds.has(id)) return;
    setSelectedDefenders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const declareCharge = () => {
    if (selectedAttackers.length === 0 || selectedDefenders.length === 0) return;
    const charge: DeclaredCharge = {
      id: `charge_${Date.now()}`,
      attackerEntryIds: selectedAttackers,
      attackerNames: selectedAttackers.map((id) => getUnitLabel(id, 'attacker')),
      defenderEntryIds: selectedDefenders,
      defenderNames: selectedDefenders.map((id) => getUnitLabel(id, 'defender')),
    };
    setDeclared((prev) => [...prev, charge]);
    setSelectedAttackers([]);
    setSelectedDefenders([]);
  };

  const setResult = (chargeId: string, result: 'success' | 'failed') => {
    setDeclared((prev) =>
      prev.map((c) => c.id === chargeId ? { ...c, result } : c)
    );
  };

  const applyCharges = () => {
    for (const charge of declared) {
      if (charge.result === 'success') {
        // Mark attacker units inCombat
        for (const id of charge.attackerEntryIds) markUnitInCombat(currentSide, id, true);
        // Mark defender units inCombat
        for (const id of charge.defenderEntryIds) markUnitInCombat(opponentSide, id, true);
        // Create a combat record
        const record = {
          id: charge.id,
          turn: currentTurn,
          p1EntryIds: currentSide === 'p1' ? charge.attackerEntryIds : charge.defenderEntryIds,
          p2EntryIds: currentSide === 'p2' ? charge.attackerEntryIds : charge.defenderEntryIds,
          p1Score: emptyCombatScore(),
          p2Score: emptyCombatScore(),
          resolved: false,
        };
        upsertCombat(record);
      } else if (charge.result === 'failed') {
        for (const id of charge.attackerEntryIds) markChargeFailed(currentSide, id);
      }
    }
    setApplied(true);
  };

  const allResolved = declared.length > 0 && declared.every((c) => c.result !== undefined);
  const hasNoCombat = declared.length === 0;

  // Show inCombat units (ongoing from last turn)
  const ongoingAttackers = attackerEntries.filter((e) => {
    const us = attacker.unitStates.find((u) => u.entryId === e.id);
    return us?.inCombat;
  });
  const ongoingDefenders = defenderEntries.filter((e) => {
    const us = defender.unitStates.find((u) => u.entryId === e.id);
    return us?.inCombat;
  });

  return (
    <div className="space-y-4">
      {/* Ongoing combats banner */}
      {(ongoingAttackers.length > 0 || ongoingDefenders.length > 0) && (
        <div
          className="rounded border p-3 text-sm"
          style={{ backgroundColor: 'rgba(217,119,6,0.08)', borderColor: 'var(--color-accent-amber)', color: 'var(--color-accent-amber)' }}
        >
          <span className="font-semibold">Ongoing combat</span>
          {' — '}
          {[...ongoingAttackers.map((e) => getUnitLabel(e.id, 'attacker')), ...ongoingDefenders.map((e) => getUnitLabel(e.id, 'defender'))].join(', ')} remain locked in contact.
        </div>
      )}

      {/* Two-column charge declaration */}
      {!applied && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Attacker column */}
            <div>
              <div className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                {attacker.name} — select chargers
              </div>
              <div className="space-y-1">
                {attackerEntries.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No units available.</p>
                )}
                {attackerEntries.map((entry) => {
                  const name = getUnitLabel(entry.id, 'attacker');
                  const us = attacker.unitStates.find((u) => u.entryId === entry.id);
                  const isInCombat = us?.inCombat;
                  const isFleeing = us?.fled;
                  const isUsed = usedAttackerIds.has(entry.id);
                  const isSelected = selectedAttackers.includes(entry.id);
                  const disabled = isUsed || isInCombat || isFleeing;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => toggleAttacker(entry.id)}
                      disabled={disabled}
                      className="w-full text-left text-sm px-3 py-2 rounded"
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(96,165,250,0.2)'
                          : 'var(--color-bg-dark)',
                        border: `1px solid ${isSelected ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                        color: disabled ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {name}
                      {isInCombat && <span className="ml-2 text-xs" style={{ color: 'var(--color-accent-amber)' }}>In Combat</span>}
                      {isFleeing && <span className="ml-2 text-xs" style={{ color: '#f87171' }}>Fleeing</span>}
                      {isUsed && <span className="ml-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Declared</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Defender column */}
            <div>
              <div className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                {defender.name} — select targets
              </div>
              <div className="space-y-1">
                {defenderEntries.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No units available.</p>
                )}
                {defenderEntries.map((entry) => {
                  const name = getUnitLabel(entry.id, 'defender');
                  const us = defender.unitStates.find((u) => u.entryId === entry.id);
                  const isFleeing = us?.fled;
                  const isUsed = usedDefenderIds.has(entry.id);
                  const isSelected = selectedDefenders.includes(entry.id);
                  const disabled = isUsed;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => toggleDefender(entry.id)}
                      disabled={disabled}
                      className="w-full text-left text-sm px-3 py-2 rounded"
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(239,68,68,0.15)'
                          : 'var(--color-bg-dark)',
                        border: `1px solid ${isSelected ? '#f87171' : 'var(--color-border)'}`,
                        color: disabled ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {name}
                      {isFleeing && <span className="ml-2 text-xs" style={{ color: '#f87171' }}>Fleeing</span>}
                      {isUsed && <span className="ml-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Targeted</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Declare button */}
          <button
            onClick={declareCharge}
            disabled={selectedAttackers.length === 0 || selectedDefenders.length === 0}
            className="px-4 py-2 rounded text-sm font-semibold"
            style={{
              backgroundColor: selectedAttackers.length > 0 && selectedDefenders.length > 0
                ? 'var(--color-accent-amber)' : 'var(--color-bg-elevated)',
              color: selectedAttackers.length > 0 && selectedDefenders.length > 0
                ? 'var(--color-bg-dark)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              cursor: selectedAttackers.length > 0 && selectedDefenders.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Declare Charge →
          </button>

          {/* Declared charges — pass/fail */}
          {declared.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Declared Charges
              </div>
              {declared.map((charge) => (
                <div
                  key={charge.id}
                  className="rounded border p-3 space-y-2"
                  style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                >
                  <div className="text-sm">
                    <span style={{ color: 'var(--color-accent-blue)' }}>{charge.attackerNames.join(', ')}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}> → </span>
                    <span style={{ color: '#f87171' }}>{charge.defenderNames.join(', ')}</span>
                  </div>
                  <div className="flex gap-2">
                    {(['success', 'failed'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setResult(charge.id, r)}
                        className="px-3 py-1 rounded text-sm font-semibold"
                        style={{
                          backgroundColor: charge.result === r
                            ? r === 'success' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'
                            : 'var(--color-bg-dark)',
                          color: charge.result === r
                            ? r === 'success' ? '#16a34a' : '#dc2626'
                            : 'var(--color-text-secondary)',
                          border: `1px solid ${charge.result === r ? (r === 'success' ? '#16a34a' : '#dc2626') : 'var(--color-border)'}`,
                        }}
                      >
                        {r === 'success' ? '✓ Success' : '✗ Failed'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={applyCharges}
                disabled={!allResolved}
                className="px-4 py-2 rounded text-sm font-semibold"
                style={{
                  backgroundColor: allResolved ? 'var(--color-accent-amber)' : 'var(--color-bg-elevated)',
                  color: allResolved ? 'var(--color-bg-dark)' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  cursor: allResolved ? 'pointer' : 'not-allowed',
                }}
              >
                Apply Charges
              </button>
            </div>
          )}

          {hasNoCombat && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Select units on both sides then tap "Declare Charge →". You can declare multiple charges before applying.
            </p>
          )}
        </>
      )}

      {applied && (
        <div
          className="rounded border p-3 text-sm"
          style={{ backgroundColor: 'rgba(22,163,74,0.1)', borderColor: '#16a34a', color: '#16a34a' }}
        >
          Charges applied. Proceed to the Shooting phase.
        </div>
      )}
    </div>
  );
}
