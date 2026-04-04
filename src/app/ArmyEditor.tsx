import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useArmyStore } from '../store/armyStore';
import { calcArmourSave, calcCategoryPoints, calcEntryPoints, calcOptionsCost, getEffectiveListCategory, isPerModelPoints, isWizard, parseUnitSize, validateArmy } from '../utils/armyValidation';
import { getFaction } from '../data/factions/index';
import type { Faction, Unit, WeaponProfile, Option, OptionChoice } from '../types/faction';
import type { ArmyEntry } from '../types/army';
import specialRulesData from '../data/rules/special-rules.json';


type BrowserTab = 'characters' | 'core' | 'special' | 'rare';

const TABS: { id: BrowserTab; label: string }[] = [
  { id: 'characters', label: 'Characters' },
  { id: 'core', label: 'Core' },
  { id: 'special', label: 'Special' },
  { id: 'rare', label: 'Rare' },
];

/** Whether a unit is available in the given army composition */
function isUnitAvailable(unit: Unit, compositionId: string): boolean {
  if (unit.availability && unit.availability.length > 0) {
    return unit.availability.includes(compositionId);
  }
  return true;
}

/** Units available to browse for the given tab and composition (excludes mounts) */
function getUnitsForTab(faction: Faction, tab: BrowserTab, compositionId: string): Unit[] {
  return faction.units.filter(
    (u) =>
      u.category !== 'mount' &&
      getEffectiveListCategory(u, compositionId) === tab &&
      isUnitAvailable(u, compositionId)
  );
}

export default function ArmyEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const armies = useArmyStore((s) => s.armies);
  const addEntry = useArmyStore((s) => s.addEntry);
  const removeEntry = useArmyStore((s) => s.removeEntry);
  const duplicateEntry = useArmyStore((s) => s.duplicateEntry);
  const updateEntry = useArmyStore((s) => s.updateEntry);
  const renameArmy = useArmyStore((s) => s.renameArmy);

  const army = armies.find((a) => a.id === id);
  const faction = army ? getFaction(army.factionId) : undefined;

  const [browserTab, setBrowserTab] = useState<BrowserTab>('characters');
  const [mobileView, setMobileView] = useState<'browse' | 'list'>('browse');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [expandedMagicCategories, setExpandedMagicCategories] = useState<Record<string, boolean>>({
    magic_weapon: true,
    magic_armour: true,
    talisman: true,
    enchanted_item: true,
    arcane_item: true,
  });
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!army || !faction) {
    return (
      <div className="p-6">
        <p style={{ color: 'var(--color-text-secondary)' }}>{!army ? 'Army not found.' : 'Faction data not found.'}</p>
        <button onClick={() => navigate('/army-builder')} className="mt-3 text-sm underline" style={{ color: 'var(--color-accent-blue)' }}>
          Back to My Armies
        </button>
      </div>
    );
  }

  const pts = calcCategoryPoints(army, faction);
  const issues = validateArmy(army, faction);
  const errors = issues.filter((i) => i.severity === 'error');
  const comp = faction.army_compositions.find((c) => c.id === army.compositionId);

  // army is guaranteed non-null past the early return above
  const armyId = army.id;

  function handleAddUnit(unit: Unit) {
    const { min } = parseUnitSize(unit.unit_size);
    addEntry(armyId, {
      unitId: unit.id,
      quantity: min,
      includeChampion: false,
      includeStandard: false,
      includeMusician: false,
      selectedOptions: [],
      selectedVirtueId: null,
      selectedMagicItemIds: [],
      selectedMountId: null,
    });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message: `+ ${unit.name} added`, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  function handleQtyChange(entry: ArmyEntry, unit: Unit, delta: number) {
    const { min, max } = parseUnitSize(unit.unit_size);
    const next = entry.quantity + delta;
    if (next < min || (max !== null && next > max)) return;
    updateEntry(armyId, entry.id, { quantity: next });
  }

  const pctColor = (pct: number, rule: 'min' | 'max', threshold: number) => {
    if (rule === 'max' && pct > threshold) return 'var(--color-accent-amber)';
    if (rule === 'min' && pct < threshold && pts.total > 0) return 'var(--color-accent-amber)';
    return 'var(--color-accent-blue)';
  };

  // ---- sub-components ----

  const EditorHeader = () => (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b"
      style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
    >
      <button onClick={() => navigate('/army-builder')} className="text-sm shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        ← Back
      </button>

      <div className="flex-1 min-w-0">
        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => {
              if (nameInput.trim()) renameArmy(army.id, nameInput.trim());
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') { setEditingName(false); }
            }}
            className="rounded px-2 py-0.5 text-base font-semibold w-full"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-accent-amber)' }}
          />
        ) : (
          <button
            className="text-base font-semibold truncate text-left w-full"
            style={{ color: 'var(--color-text-primary)' }}
            onClick={() => { setNameInput(army.name); setEditingName(true); }}
            title="Click to rename"
          >
            {army.name}
          </button>
        )}
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {comp?.name} · {army.pointsLimit} pts limit
        </p>
      </div>

      <div className="text-right shrink-0">
        <p
          className="text-base font-bold"
          style={{ color: pts.total > army.pointsLimit ? 'var(--color-accent-amber)' : 'var(--color-accent-blue)' }}
        >
          {pts.total} / {army.pointsLimit}
        </p>
        {errors.length > 0 && (
          <p className="text-xs" style={{ color: 'var(--color-accent-amber)' }}>
            {errors.length} issue{errors.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );

  const ValidationBanner = () => {
    if (errors.length === 0) return null;
    return (
      <div className="px-4 py-2 border-b" style={{ backgroundColor: '#2a1a00', borderColor: 'var(--color-accent-amber)' }}>
        {errors.map((e, i) => (
          <p key={i} className="text-xs" style={{ color: 'var(--color-accent-amber)' }}>
            ⚠ {e.message}
          </p>
        ))}
      </div>
    );
  };

  const UnitBrowser = () => {
    const units = getUnitsForTab(faction, browserTab, army.compositionId);
    return (
      <div className="flex flex-col h-full overflow-hidden relative">
        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setBrowserTab(tab.id)}
              className="flex-1 py-2 text-xs font-semibold transition-colors"
              style={{
                color: browserTab === tab.id ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
                borderBottom: browserTab === tab.id ? '2px solid var(--color-accent-amber)' : '2px solid transparent',
                backgroundColor: 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Unit list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {units.map((unit) => {
            const { min } = parseUnitSize(unit.unit_size);
            const isFixed = unit.unit_size === '1';
            const minCost = isFixed ? unit.points : unit.points * min;
            const inListCount = army.entries.filter((e) => e.unitId === unit.id).length;
            return (
              <div
                key={unit.id}
                className="rounded border p-3"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                      {unit.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {unit.troop_type} · {unit.base_size}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-accent-amber)' }}>
                      {isFixed ? `${unit.points} pts` : `${unit.points} pts/model · min ${min}${unit.unit_size !== `${min}+` && unit.unit_size !== `${min}` ? ` (${unit.unit_size})` : '+'}`}
                      {minCost !== unit.points && !isFixed ? ` · from ${minCost} pts` : ''}
                    </p>
                    <StatBar unit={unit} />
                    <SpecialRulesList ruleIds={unit.special_rules} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAddUnit(unit)}
                      className="rounded px-3 py-1.5 text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-accent-amber)', color: '#0f1117' }}
                    >
                      + Add
                    </button>
                    {inListCount > 0 && (
                      <span
                        className="text-xs font-semibold rounded px-1.5 py-0.5"
                        style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-accent-amber)' }}
                      >
                        ×{inListCount} in list
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {units.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
              No units in this category
            </p>
          )}
        </div>

        {/* Add confirmation toast */}
        {toast && (
          <div
            key={toast.key}
            className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-50 px-4"
          >
            <div
              className="px-4 py-2 rounded-full text-sm font-bold"
              style={{ backgroundColor: 'var(--color-accent-amber)', color: '#0f1117', animation: 'toast-pop 2s ease forwards' }}
            >
              {toast.message}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ArmyList = () => {
    const categories: { id: BrowserTab; label: string }[] = [
      { id: 'characters', label: 'Characters' },
      { id: 'core', label: 'Core' },
      { id: 'special', label: 'Special' },
      { id: 'rare', label: 'Rare' },
    ];

    return (
      <div className="overflow-y-auto flex flex-col gap-4 p-3">
        {/* Category summaries */}
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const catPts = pts[cat.id];
            const pct = army.pointsLimit > 0 ? (catPts / army.pointsLimit) * 100 : 0;
            const rule = comp?.rules.find((r) => r.category === cat.id);
            return (
              <div
                key={cat.id}
                className="rounded border p-2 text-center"
                style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{cat.label}</p>
                <p
                  className="text-sm font-bold"
                  style={{
                    color: rule
                      ? pctColor(pct, rule.limit_type === 'min_percent' ? 'min' : 'max', rule.limit_value)
                      : 'var(--color-text-primary)',
                  }}
                >
                  {catPts} pts
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {pct.toFixed(0)}%{rule ? ` / ${rule.limit_type === 'min_percent' ? '≥' : '≤'}${rule.limit_value}%` : ''}
                </p>
              </div>
            );
          })}
        </div>

        {/* Entries grouped by category */}
        {categories.map((cat) => {
          const entries = army.entries.filter((entry) => {
            const unit = faction.units.find((u) => u.id === entry.unitId);
            if (!unit) return false;
            return getEffectiveListCategory(unit, army.compositionId) === cat.id;
          });
          if (entries.length === 0) return null;

          return (
            <div key={cat.id}>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1.5 px-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {cat.label} — {pts[cat.id]} pts
              </p>
              <div className="flex flex-col gap-1.5">
                {entries.map((entry) => {
                  const unit = faction.units.find((u) => u.id === entry.unitId);
                  if (!unit) return null;
                  const entryPts = calcEntryPoints(unit, entry, faction);
                  const optsCost = calcOptionsCost(unit, entry, faction);
                  const isFixed = unit.unit_size === '1';
                  const showOptions = !!(unit.options && unit.options.length > 0) || !!(unit.command && unit.command.length > 0);
                  const { min, max } = parseUnitSize(unit.unit_size);

                  // Armour save: combine unit equipment + selected option shields + mount barding
                  const mountUnit = entry.selectedMountId
                    ? faction.units.find((u) => u.id === entry.selectedMountId)
                    : null;
                  const extraEquip = [
                    ...entry.selectedOptions.filter(
                      (o) => /\bshield\b/i.test(o) && !(unit.equipment ?? []).some((e) => /\bshield\b/i.test(e))
                    ),
                    ...(mountUnit?.equipment ?? []),
                  ];
                  const entrySave = calcArmourSave([...(unit.equipment ?? []), ...extraEquip], unit.special_rules ?? []);

                  return (
                    <div
                      key={entry.id}
                      className="rounded border p-2.5"
                      style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                          {entry.customName || unit.name}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold" style={{ color: 'var(--color-accent-amber)' }}>
                            {entryPts} pts
                          </span>
                          {entrySave !== '-' && (
                            <span className="text-xs font-semibold px-1 rounded" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-dark)' }}>
                              Sv {entrySave}
                            </span>
                          )}
                          <button
                            onClick={() => duplicateEntry(armyId, entry.id)}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-dark)' }}
                            aria-label="Duplicate unit"
                            title="Duplicate"
                          >
                            ⧉
                          </button>
                          <button
                            onClick={() => removeEntry(army.id, entry.id)}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-dark)' }}
                            aria-label="Remove unit"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {!isFixed && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Models:</span>
                          <button
                            onClick={() => handleQtyChange(entry, unit, -1)}
                            disabled={entry.quantity <= min}
                            className="w-6 h-6 rounded text-sm font-bold disabled:opacity-30"
                            style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)' }}
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold w-6 text-center" style={{ color: 'var(--color-text-primary)' }}>
                            {entry.quantity}
                          </span>
                          <button
                            onClick={() => handleQtyChange(entry, unit, 1)}
                            disabled={max !== null && entry.quantity >= max}
                            className="w-6 h-6 rounded text-sm font-bold disabled:opacity-30"
                            style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)' }}
                          >
                            +
                          </button>
                          <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                            × {unit.points} pts
                          </span>
                        </div>
                      )}

                      {unit.weapon_profiles && unit.weapon_profiles.length > 0 && (() => {
                        // Only display weapon_profiles that match base equipment
                        const equipmentLower = (unit.equipment ?? []).map(e => e.toLowerCase());
                        const baseWeaponProfiles = unit.weapon_profiles.filter(wp =>
                          equipmentLower.some(eq => eq.includes(wp.name.toLowerCase()))
                        );
                        return baseWeaponProfiles.length > 0 ? <WeaponProfileTable profiles={baseWeaponProfiles} /> : null;
                      })()}

                      <SpecialRulesList ruleIds={unit.special_rules} />

                      {showOptions && (
                        <>
                          <button
                            onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                            className="text-xs mt-1.5 w-full text-left"
                            style={{ color: 'var(--color-accent-blue)' }}
                          >
                            {expandedEntryId === entry.id ? '▲ Options' : '▼ Options'}
                            {optsCost > 0 && ` (+${optsCost} pts)`}
                          </button>
                          {expandedEntryId === entry.id && (
                            <EntryOptionsPanel
                              unit={unit}
                              entry={entry}
                              faction={faction}
                              armyId={armyId}
                              updateEntry={updateEntry}
                              expandedMagicCategories={expandedMagicCategories}
                              setExpandedMagicCategories={setExpandedMagicCategories}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {army.entries.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            Add units from the browser to build your list.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <EditorHeader />
      <ValidationBanner />

      {/* Mobile toggle */}
      <div className="flex border-b md:hidden shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setMobileView('browse')}
          className="flex-1 py-2 text-sm font-semibold"
          style={{
            color: mobileView === 'browse' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
            borderBottom: mobileView === 'browse' ? '2px solid var(--color-accent-amber)' : '2px solid transparent',
          }}
        >
          Browse Units
        </button>
        <button
          onClick={() => setMobileView('list')}
          className="flex-1 py-2 text-sm font-semibold"
          style={{
            color: mobileView === 'list' ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)',
            borderBottom: mobileView === 'list' ? '2px solid var(--color-accent-amber)' : '2px solid transparent',
          }}
        >
          My List {army.entries.length > 0 ? `(${army.entries.length})` : ''}
        </button>
      </div>

      {/* Desktop two-column / Mobile single-column */}
      <div className="flex flex-1 overflow-hidden">
        {/* Browser panel */}
        <div
          className={`flex flex-col border-r overflow-hidden ${mobileView === 'browse' ? 'flex' : 'hidden'} md:flex md:w-1/2`}
          style={{ borderColor: 'var(--color-border)' }}
        >
          <UnitBrowser />
        </div>

        {/* List panel */}
        <div
          className={`flex-1 overflow-hidden ${mobileView === 'list' ? 'flex flex-col' : 'hidden'} md:flex md:flex-col md:w-1/2`}
        >
          <ArmyList />
        </div>
      </div>
    </div>
  );
}

function StatBar({ unit, save }: { unit: Unit; save?: string }) {
  const main = unit.profiles[0];
  if (!main) return null;
  const p = main.profile;
  const stats = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'] as const;
  const displaySave = save ?? calcArmourSave(unit.equipment ?? [], unit.special_rules ?? []);
  return (
    <div className="flex gap-1 mt-1.5 flex-wrap">
      {stats.map((s) => (
        <span key={s} className="text-xs leading-none" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="mr-0.5">{s}</span>
          <span style={{ color: 'var(--color-text-primary)' }}>{String(p[s])}</span>
        </span>
      ))}
      <span className="text-xs leading-none" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="mr-0.5">Sv</span>
        <span style={{ color: displaySave === '-' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>{displaySave}</span>
      </span>
    </div>
  );
}

function formatRuleName(rule: string): string {
  return rule.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function WeaponProfileTable({ profiles }: { profiles: WeaponProfile[] }) {
  if (!profiles || profiles.length === 0) return null;
  return (
    <div className="mt-1.5 overflow-x-auto">
      <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            <th className="text-left pr-2 pb-0.5 font-medium whitespace-nowrap">Weapon</th>
            <th className="text-center pr-2 pb-0.5 font-medium whitespace-nowrap">Rng</th>
            <th className="text-center pr-2 pb-0.5 font-medium">S</th>
            <th className="text-center pr-2 pb-0.5 font-medium">AP</th>
            <th className="text-left pb-0.5 font-medium">Special</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((wp, i) => (
            <tr key={i}>
              <td className="pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>{wp.name}</td>
              <td className="text-center pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>{wp.range}</td>
              <td className="text-center pr-2 py-0.5" style={{ color: 'var(--color-text-primary)' }}>{wp.S}</td>
              <td className="text-center pr-2 py-0.5" style={{ color: 'var(--color-text-primary)' }}>{wp.AP}</td>
              <td className="py-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {wp.special_rules.map(formatRuleName).join(', ')}
                {wp.notes && <span className="italic opacity-70"> — {wp.notes}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function SpecialRulesList({ ruleIds }: { ruleIds: string[] }) {
  const [activeRule, setActiveRule] = useState<{ name: string; url: string } | null>(null);
  if (!ruleIds || ruleIds.length === 0) return null;
  const rulesData = (specialRulesData as { rules: { id: string; name: string }[] }).rules;
  return (
    <>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {ruleIds.map((id) => {
          const rule = rulesData.find((r) => r.id === id);
          const name = rule?.name ?? formatRuleName(id);
          const url = `https://tow.whfb.app/special-rules/${id.replace(/_/g, '-')}`;
          return (
            <button
              key={id}
              onClick={() => setActiveRule({ name, url })}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--color-bg-dark)',
                color: 'var(--color-accent-blue)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      {activeRule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setActiveRule(null)}
        >
          <div
            className="flex flex-col rounded-lg overflow-hidden w-full max-w-2xl shadow-2xl"
            style={{ height: '80vh', backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-2 shrink-0 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {activeRule.name}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={activeRule.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Open in browser ↗
                </a>
                <button
                  onClick={() => setActiveRule(null)}
                  className="text-sm font-bold px-2 py-0.5 rounded"
                  style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-dark)' }}
                >
                  ✕
                </button>
              </div>
            </div>
            <iframe
              src={activeRule.url}
              className="flex-1 w-full border-0"
              title={activeRule.name}
            />
          </div>
        </div>
      )}
    </>
  );
}

/** Returns mount units available to the given character based on mount notes */
function getAvailableMounts(unit: Unit, faction: Faction): Unit[] {
  return faction.units.filter((u) => {
    if (u.category !== 'mount') return false;
    const notes = u.notes ?? [];
    if (notes.length === 0) return true;
    return notes.some(
      (note) => note.toLowerCase().includes('available') && note.toLowerCase().includes(unit.name.toLowerCase())
    );
  });
}

const MAGIC_ITEM_CATEGORY_LABELS: Record<string, string> = {
  magic_weapon: 'Magic Weapons',
  magic_armour: 'Magic Armour',
  talisman: 'Talismans',
  enchanted_item: 'Enchanted Items',
  arcane_item: 'Arcane Items',
  magic_standard: 'Magic Standards',
};

function EntryOptionsPanel({
  unit,
  entry,
  faction,
  armyId,
  updateEntry,
  expandedMagicCategories,
  setExpandedMagicCategories,
}: {
  unit: Unit;
  entry: ArmyEntry;
  faction: Faction;
  armyId: string;
  updateEntry: (armyId: string, entryId: string, patch: Partial<Omit<ArmyEntry, 'id'>>) => void;
  expandedMagicCategories: Record<string, boolean>;
  setExpandedMagicCategories: (categories: Record<string, boolean>) => void;
}) {
  const options = unit.options ?? [];
  const perModel = isPerModelPoints(unit);

  const magicAllowanceOpt = options.find(
    (o) => o.max_points !== undefined && !o.description.toLowerCase().includes('standard')
  );
  const hasVirtuePicker = options.some((o) => o.description.includes('Knightly Virtue'));
  const hasMountOption = options.some((o) => o.description === 'Mount' || o.description.includes('Mount (see Character Mounts)'));
  const availableMounts = hasMountOption ? getAvailableMounts(unit, faction) : [];
  const vowOptions = options.filter(
    (o) => o.max_points === undefined && o.description.startsWith('Replace') && o.description.includes('Vow')
  );
  const regularOptions = options.filter(
    (o) =>
      o.max_points === undefined &&
      !o.choices &&
      o.per_n_models === undefined &&
      !o.description.includes('Knightly Virtue') &&
      !o.description.includes('Mount (see Character Mounts)') &&
      !(o.description.startsWith('Replace') && o.description.includes('Vow'))
  );

  const scaledOptions = options.filter((o) => o.per_n_models !== undefined);

  const choiceGroups = options.filter(
    (o) =>
      o.max_points === undefined &&
      o.choices &&
      o.choices.length > 0
  );

  const command = unit.command ?? [];

  // Group regular options by category; uncategorised options fall into 'special'
  const weaponOptions = regularOptions.filter((o) => o.category === 'weapon');
  const armourOptions = regularOptions.filter((o) => o.category === 'armour');
  const specialOptions = regularOptions.filter((o) => !o.category || o.category === 'special');

  // Group choice groups by category
  const weaponChoiceGroups = choiceGroups.filter((o) => o.category === 'weapon');
  const armourChoiceGroups = choiceGroups.filter((o) => o.category === 'armour');
  const specialChoiceGroups = choiceGroups.filter((o) => !o.category || o.category === 'special');

  const hasWeapons = weaponOptions.length > 0 || weaponChoiceGroups.length > 0;
  const hasArmour = armourOptions.length > 0 || armourChoiceGroups.length > 0;
  const hasSpecial = specialOptions.length > 0 || scaledOptions.length > 0 || specialChoiceGroups.length > 0;

  function toggleOption(desc: string, checked: boolean) {
    const next = checked
      ? [...entry.selectedOptions, desc]
      : entry.selectedOptions.filter((d) => d !== desc);
    updateEntry(armyId, entry.id, { selectedOptions: next });
  }

  function selectChoice(choices: OptionChoice[], choiceDesc: string | null) {
    const allDescs = choices.map((c) => c.description);
    const without = entry.selectedOptions.filter((d) => !allDescs.includes(d));
    const next = choiceDesc ? [...without, choiceDesc] : without;
    updateEntry(armyId, entry.id, { selectedOptions: next });
  }

  function selectVow(desc: string | null) {
    const without = entry.selectedOptions.filter((d) => !vowOptions.some((v) => v.description === d));
    updateEntry(armyId, entry.id, { selectedOptions: desc ? [...without, desc] : without });
  }

  function toggleMagicItem(itemId: string, checked: boolean) {
    const next = checked
      ? [...(entry.selectedMagicItemIds ?? []), itemId]
      : (entry.selectedMagicItemIds ?? []).filter((id) => id !== itemId);
    updateEntry(armyId, entry.id, { selectedMagicItemIds: next });
  }

  const selectedVow = vowOptions.find((v) => entry.selectedOptions.includes(v.description));
  const selectedItems = entry.selectedMagicItemIds ?? [];
  const selectedMount = availableMounts.find((m) => m.id === entry.selectedMountId);

  // Personal magic items for characters
  const characterItemCategories = ['magic_weapon', 'magic_armour', 'talisman', 'enchanted_item', 'arcane_item'] as const;
  const totalItemPts = selectedItems.reduce((sum, id) => {
    const item = faction.magic_items.find((i) => i.id === id);
    return sum + (item?.points ?? 0);
  }, 0);
  const remainingAllowance = (magicAllowanceOpt?.max_points ?? 0) - totalItemPts;

  // Magic standard for units with standard bearer
  const hasMagicStandardSlot = !!unit.magic_standard && entry.includeStandard;
  const selectedStandardItem = hasMagicStandardSlot
    ? faction.magic_items.find((i) => i.category === 'magic_standard' && selectedItems.includes(i.id))
    : null;

  const divider = <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />;

  return (
    <div className="mt-1.5 pt-2 flex flex-col gap-2.5 border-t" style={{ borderColor: 'var(--color-border)' }}>

      {/* Command */}
      {command.length > 0 && (
        <OptionsSection label="Command">
          {command.map((cmd) => {
            const checked = cmd.role === 'champion' ? entry.includeChampion
              : cmd.role === 'standard_bearer' ? entry.includeStandard
              : entry.includeMusician;
            const label = cmd.role === 'champion' ? (cmd.name ?? 'Champion')
              : cmd.role === 'standard_bearer' ? 'Standard Bearer'
              : (cmd.name ?? 'Musician');
            const onChange = (v: boolean) => {
              if (cmd.role === 'champion') updateEntry(armyId, entry.id, { includeChampion: v });
              else if (cmd.role === 'standard_bearer') updateEntry(armyId, entry.id, { includeStandard: v });
              else updateEntry(armyId, entry.id, { includeMusician: v });
            };
            return <OptionCheckbox key={cmd.role} label={`${label} — +${cmd.cost_per_unit} pts`} checked={checked} onChange={onChange} />;
          })}
        </OptionsSection>
      )}

      {/* Weapons */}
      {hasWeapons && (
        <OptionsSection label="Weapons">
          {weaponOptions.map((opt) => (
            <RegularOption key={opt.description} opt={opt} entry={entry} perModel={perModel} toggleOption={toggleOption} />
          ))}
          {weaponChoiceGroups.map((group) => (
            <ChoiceGroup key={group.description} group={group} entry={entry} perModel={perModel} selectChoice={selectChoice} armyId={armyId} />
          ))}
        </OptionsSection>
      )}

      {/* Armour & Shields */}
      {hasArmour && (
        <OptionsSection label="Armour &amp; Shields">
          {armourOptions.map((opt) => (
            <RegularOption key={opt.description} opt={opt} entry={entry} perModel={perModel} toggleOption={toggleOption} />
          ))}
          {armourChoiceGroups.map((group) => (
            <ChoiceGroup key={group.description} group={group} entry={entry} perModel={perModel} selectChoice={selectChoice} armyId={armyId} />
          ))}
        </OptionsSection>
      )}

      {/* Special Upgrades */}
      {hasSpecial && (
        <OptionsSection label="Special Upgrades">
          {specialOptions.map((opt) => (
            <RegularOption key={opt.description} opt={opt} entry={entry} perModel={perModel} toggleOption={toggleOption} />
          ))}
          {scaledOptions.map((opt) => {
            const maxAllowed = Math.min(Math.floor(entry.quantity / opt.per_n_models!), opt.max_count ?? 99);
            const qty = entry.optionQuantities?.[opt.description] ?? 0;
            const totalCost = opt.cost * qty;
            function setQty(next: number) {
              updateEntry(armyId, entry.id, {
                optionQuantities: { ...(entry.optionQuantities ?? {}), [opt.description]: next },
              });
            }
            return (
              <div key={opt.description} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(Math.max(0, qty - 1))} disabled={qty <= 0} className="w-6 h-6 rounded text-sm font-bold disabled:opacity-30" style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)' }}>−</button>
                  <span className="text-sm font-semibold w-4 text-center" style={{ color: 'var(--color-text-primary)' }}>{qty}</span>
                  <button onClick={() => setQty(Math.min(maxAllowed, qty + 1))} disabled={qty >= maxAllowed} className="w-6 h-6 rounded text-sm font-bold disabled:opacity-30" style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)' }}>+</button>
                  <span className="text-xs" style={{ color: qty > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                    {opt.description}{totalCost > 0 ? ` — +${totalCost} pts` : ''}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--color-text-secondary)' }}>max {maxAllowed}</span>
                </div>
                {opt.notes && <span className="text-xs italic ml-8" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>{opt.notes}</span>}
              </div>
            );
          })}
          {specialChoiceGroups.map((group) => (
            <ChoiceGroup key={group.description} group={group} entry={entry} perModel={perModel} selectChoice={selectChoice} armyId={armyId} />
          ))}
        </OptionsSection>
      )}

      {/* Vow */}
      {vowOptions.length > 0 && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Vow</p>
            <div className="flex flex-col gap-1">
              {/* Default vow */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span
                  className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                  style={{
                    borderColor: !selectedVow ? 'var(--color-accent-blue)' : 'var(--color-border)',
                    backgroundColor: !selectedVow ? 'var(--color-accent-blue)' : 'transparent',
                  }}
                >
                  {!selectedVow && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <input type="radio" name={`vow-${entry.id}`} checked={!selectedVow} onChange={() => selectVow(null)} className="sr-only" />
                <span className="text-xs" style={{ color: !selectedVow ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                  Knight's Vow
                </span>
              </label>
              {vowOptions.map((opt) => {
                const isActive = selectedVow?.description === opt.description;
                const vowName = opt.description.replace(/^.+?with the /, '');
                return (
                  <label key={opt.description} className="flex items-center gap-2 cursor-pointer">
                    <span
                      className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: isActive ? 'var(--color-accent-blue)' : 'var(--color-border)',
                        backgroundColor: isActive ? 'var(--color-accent-blue)' : 'transparent',
                      }}
                    >
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <input type="radio" name={`vow-${entry.id}`} checked={isActive} onChange={() => selectVow(opt.description)} className="sr-only" />
                    <span className="text-xs" style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                      {vowName} — +{opt.cost} pts
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Mount picker */}
      {availableMounts.length > 0 && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Mount</p>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <span
                  className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                  style={{
                    borderColor: !entry.selectedMountId ? 'var(--color-accent-blue)' : 'var(--color-border)',
                    backgroundColor: !entry.selectedMountId ? 'var(--color-accent-blue)' : 'transparent',
                  }}
                >
                  {!entry.selectedMountId && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <input type="radio" name={`mount-${entry.id}`} checked={!entry.selectedMountId} onChange={() => updateEntry(armyId, entry.id, { selectedMountId: null })} className="sr-only" />
                <span className="text-xs" style={{ color: !entry.selectedMountId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                  On foot
                </span>
              </label>
              {availableMounts.map((mount) => {
                const isActive = entry.selectedMountId === mount.id;
                const mp = mount.profiles[0]?.profile;
                return (
                  <div key={mount.id} className="flex flex-col gap-0.5">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <span
                        className="shrink-0 w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center"
                        style={{
                          borderColor: isActive ? 'var(--color-accent-blue)' : 'var(--color-border)',
                          backgroundColor: isActive ? 'var(--color-accent-blue)' : 'transparent',
                        }}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <input type="radio" name={`mount-${entry.id}`} checked={isActive} onChange={() => updateEntry(armyId, entry.id, { selectedMountId: mount.id })} className="sr-only" />
                      <span className="flex flex-col min-w-0 gap-0.5">
                        <span className="text-xs leading-snug" style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                          {mount.name} — +{mount.points} pts
                        </span>
                        {mp && (
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                            M{mp.M} WS{mp.WS} S{mp.S} T{String(mp.T) === '-' ? '—' : mp.T} W{String(mp.W) === '-' ? '—' : mp.W} I{mp.I} A{mp.A}
                          </span>
                        )}
                        {mount.profiles[0]?.mount_grants && (
                          <span className="text-xs italic" style={{ color: 'var(--color-accent-blue)', opacity: 0.8 }}>
                            Grants: {mount.profiles[0].mount_grants}
                          </span>
                        )}
                      </span>
                    </label>
                    {isActive && mount.weapon_profiles && mount.weapon_profiles.length > 0 && (
                      <div className="ml-6 mt-1 overflow-x-auto">
                        <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                              <th className="text-left pr-2 pb-0.5 font-medium whitespace-nowrap">Weapon</th>
                              <th className="text-left pr-2 pb-0.5 font-medium whitespace-nowrap">Rng</th>
                              <th className="text-center pr-2 pb-0.5 font-medium">S</th>
                              <th className="text-center pr-2 pb-0.5 font-medium">AP</th>
                              <th className="text-left pb-0.5 font-medium">Special</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mount.weapon_profiles.map((wp) => (
                              <tr key={wp.name}>
                                <td className="text-left pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-primary)', fontSize: '0.65rem' }}>{wp.name}</td>
                                <td className="text-left pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>{wp.range}</td>
                                <td className="text-center pr-2 py-0.5" style={{ color: 'var(--color-text-primary)' }}>{wp.S}</td>
                                <td className="text-center pr-2 py-0.5" style={{ color: 'var(--color-text-primary)' }}>{wp.AP}</td>
                                <td className="py-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                  <span className="text-xs">{wp.special_rules?.map(formatRuleName).join(', ') || '—'}</span>
                                  {wp.notes && <span className="text-xs italic opacity-70 ml-1"> — {wp.notes}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedMount?.notes && selectedMount.notes.filter(n => !n.startsWith('Available')).map((note, i) => (
              <p key={i} className="text-xs italic" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>{note}</p>
            ))}
          </div>
        </>
      )}

      {/* Knightly Virtue */}
      {hasVirtuePicker && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Knightly Virtue</p>
            <select
              value={entry.selectedVirtueId ?? ''}
              onChange={(e) => updateEntry(armyId, entry.id, { selectedVirtueId: e.target.value || null })}
              className="text-xs rounded px-2 py-1"
              style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <option value="">None</option>
              {(faction.knightly_virtues ?? [])
                .filter((v) => !v.restrictions || v.restrictions.toLowerCase().includes(unit.name.toLowerCase()))
                .map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.points} pts)</option>
                ))}

            </select>
            {entry.selectedVirtueId && (() => {
              const v = faction.knightly_virtues?.find((vv) => vv.id === entry.selectedVirtueId);
              return v ? <p className="text-xs italic leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{v.description}</p> : null;
            })()}
          </div>
        </>
      )}

      {/* Personal magic items (characters) */}
      {magicAllowanceOpt && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Magic Items</p>
              <p className="text-xs" style={{ color: totalItemPts > (magicAllowanceOpt.max_points ?? 0) ? 'var(--color-accent-amber)' : 'var(--color-text-secondary)' }}>
                {totalItemPts} / {magicAllowanceOpt.max_points} pts
              </p>
            </div>
            {!isWizard(unit) && (
              <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>Arcane items require a Wizard</p>
            )}
            {characterItemCategories.map((cat) => {
              const items = faction.magic_items.filter((i) => i.category === cat);
              if (items.length === 0) return null;
              const catSelected = selectedItems.find((id) => items.some((i) => i.id === id));
              const isWiz = isWizard(unit);
              if (cat === 'arcane_item' && !isWiz) return null;
              const isExpanded = expandedMagicCategories[cat] ?? true;
              return (
                <div key={cat} className="flex flex-col gap-1">
                  <button
                    onClick={() => setExpandedMagicCategories({ ...expandedMagicCategories, [cat]: !expandedMagicCategories[cat] })}
                    className="text-xs uppercase tracking-wide text-left py-1 px-1.5 rounded hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--color-text-secondary)', opacity: 0.6, fontSize: '0.65rem' }}
                  >
                    {isExpanded ? '▼' : '▶'} {MAGIC_ITEM_CATEGORY_LABELS[cat]}
                  </button>
                  {isExpanded && items.map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    const wouldExceed = !isSelected && item.points > remainingAllowance;
                    const categoryBlocked = !isSelected && !!catSelected;
                    const isDisabled = wouldExceed || categoryBlocked;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2 ${isDisabled ? 'opacity-40' : 'cursor-pointer'}`}
                      >
                        <span
                          className="shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center text-xs"
                          style={{
                            borderColor: isSelected ? 'var(--color-accent-amber)' : 'var(--color-border)',
                            backgroundColor: isSelected ? 'var(--color-accent-amber)' : 'transparent',
                            color: '#0f1117',
                          }}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                        <input
                          type="checkbox"
                          disabled={isDisabled}
                          checked={isSelected}
                          onChange={(e) => toggleMagicItem(item.id, e.target.checked)}
                          className="sr-only"
                        />
                        <span className="flex flex-col min-w-0 gap-0.5">
                          <span className="text-xs leading-snug" style={{ color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {item.name} — {item.points} pts{item.restrictions ? ` · ${item.restrictions}` : ''}
                          </span>
                          {item.weapon_profile && (
                            <div className="mt-0.5 overflow-x-auto">
                              <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                                    <th className="text-left pr-2 pb-0.5 font-medium whitespace-nowrap">Rng</th>
                                    <th className="text-center pr-2 pb-0.5 font-medium">S</th>
                                    <th className="text-center pr-2 pb-0.5 font-medium">AP</th>
                                    <th className="text-left pb-0.5 font-medium">Special</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="text-left pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>{item.weapon_profile.range}</td>
                                    <td className="text-center pr-2 py-0.5" style={{ color: 'var(--color-text-primary)' }}>{item.weapon_profile.S}</td>
                                    <td className="text-center pr-2 py-0.5" style={{ color: 'var(--color-text-primary)' }}>{item.weapon_profile.AP}</td>
                                    <td className="py-0.5" style={{ color: 'var(--color-text-secondary)' }}>{item.weapon_profile.special_rules?.map(formatRuleName).join(', ') || '—'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                          {item.armour_profile && (
                            <div className="mt-0.5 overflow-x-auto">
                              <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                                    <th className="text-left pr-2 pb-0.5 font-medium whitespace-nowrap">Armour</th>
                                    <th className="text-left pb-0.5 font-medium">Special</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="text-left pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>{item.armour_profile.armour_value}</td>
                                    <td className="py-0.5" style={{ color: 'var(--color-text-secondary)' }}>{item.armour_profile.special_rules?.map(formatRuleName).join(', ') || '—'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                          {item.description && (
                            <span className="text-xs italic leading-snug" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                              {item.description.split('.')[0]}...
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Magic Standard (units with standard bearer) */}
      {hasMagicStandardSlot && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Magic Standard</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedStandardItem ? `${selectedStandardItem.points}` : '0'} / {unit.magic_standard} pts
              </p>
            </div>
            {/* None option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span
                className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                style={{
                  borderColor: !selectedStandardItem ? 'var(--color-accent-blue)' : 'var(--color-border)',
                  backgroundColor: !selectedStandardItem ? 'var(--color-accent-blue)' : 'transparent',
                }}
              >
                {!selectedStandardItem && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <input
                type="radio"
                name={`std-${entry.id}`}
                checked={!selectedStandardItem}
                onChange={() => {
                  const without = selectedItems.filter((id) => !faction.magic_items.find((i) => i.id === id && i.category === 'magic_standard'));
                  updateEntry(armyId, entry.id, { selectedMagicItemIds: without });
                }}
                className="sr-only"
              />
              <span className="text-xs" style={{ color: !selectedStandardItem ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                No magic standard
              </span>
            </label>
            {faction.magic_items
              .filter((i) => i.category === 'magic_standard' && i.points <= (unit.magic_standard ?? 0))
              .map((item) => {
                const isSelected = selectedItems.includes(item.id);
                return (
                  <label key={item.id} className="flex items-start gap-2 cursor-pointer">
                    <span
                      className="shrink-0 w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: isSelected ? 'var(--color-accent-amber)' : 'var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-accent-amber)' : 'transparent',
                      }}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0f1117' }} />}
                    </span>
                    <input
                      type="radio"
                      name={`std-${entry.id}`}
                      checked={isSelected}
                      onChange={() => {
                        const without = selectedItems.filter((id) => !faction.magic_items.find((i) => i.id === id && i.category === 'magic_standard'));
                        updateEntry(armyId, entry.id, { selectedMagicItemIds: [...without, item.id] });
                      }}
                      className="sr-only"
                    />
                    <span className="flex flex-col min-w-0 gap-0.5">
                      <span className="text-xs leading-snug" style={{ color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                        {item.name} — {item.points} pts
                      </span>
                      <span className="text-xs italic leading-snug" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                        {item.description}
                      </span>
                    </span>
                  </label>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}

function OptionsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function OptionCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span
        className="shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs"
        style={{
          borderColor: checked ? 'var(--color-accent-amber)' : 'var(--color-border)',
          backgroundColor: checked ? 'var(--color-accent-amber)' : 'transparent',
          color: '#0f1117',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-xs" style={{ color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </label>
  );
}

function RegularOption({
  opt,
  entry,
  perModel,
  toggleOption,
}: {
  opt: Option;
  entry: ArmyEntry;
  perModel: boolean;
  toggleOption: (desc: string, checked: boolean) => void;
}) {
  const checked = entry.selectedOptions.includes(opt.description);
  const multiplier = opt.scope === 'per_model' && perModel ? entry.quantity : 1;
  const costPart = opt.cost > 0 ? ` — +${opt.cost * multiplier} pts${opt.scope === 'per_model' ? '/model' : ''}` : '';
  return (
    <div className="flex flex-col gap-0.5">
      <label className="flex items-center gap-2 cursor-pointer">
        <span
          className="shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs"
          style={{
            borderColor: checked ? 'var(--color-accent-amber)' : 'var(--color-border)',
            backgroundColor: checked ? 'var(--color-accent-amber)' : 'transparent',
            color: '#0f1117',
          }}
        >
          {checked ? '✓' : ''}
        </span>
        <input type="checkbox" checked={checked} onChange={(e) => toggleOption(opt.description, e.target.checked)} className="sr-only" />
        <span className="text-xs" style={{ color: checked ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
          {opt.description}{costPart}
        </span>
      </label>
      {opt.replaces && (
        <span className="text-xs italic ml-6" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
          Replaces: {opt.replaces}
        </span>
      )}
      {opt.notes && (
        <span className="text-xs italic ml-6" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
          {opt.notes}
        </span>
      )}
    </div>
  );
}

function ChoiceGroup(props: {
  group: Option;
  entry: ArmyEntry;
  perModel: boolean;
  selectChoice: (choices: OptionChoice[], choiceDesc: string | null) => void;
  armyId: string;
}) {
  const { group, entry, perModel, selectChoice } = props;
  const choices = group.choices!;
  const selectedDesc = choices.find((c) => entry.selectedOptions.includes(c.description))?.description ?? null;
  return (
    <div className="flex flex-col gap-0.5">
      {group.description && (
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{group.description}</p>
      )}
      {choices.map((choice) => {
        const isActive = selectedDesc === choice.description;
        const multiplier = choice.scope === 'per_model' && perModel ? entry.quantity : 1;
        const costPart = choice.cost > 0 ? ` — +${choice.cost * multiplier} pts${choice.scope === 'per_model' ? '/model' : ''}` : '';
        return (
          <label key={choice.description} className="flex items-center gap-2 cursor-pointer ml-2">
            <span
              className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
              style={{
                borderColor: isActive ? 'var(--color-accent-blue)' : 'var(--color-border)',
                backgroundColor: isActive ? 'var(--color-accent-blue)' : 'transparent',
              }}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <input
              type="radio"
              checked={isActive}
              onChange={() => selectChoice(choices, choice.description)}
              className="sr-only"
            />
            <span className="text-xs" style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
              {choice.description}{costPart}
            </span>
            {choice.notes && (
              <span className="text-xs italic ml-6" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                {choice.notes}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
