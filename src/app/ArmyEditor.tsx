import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useArmyStore } from '../store/armyStore';
import { calcArmourSave, calcCategoryPoints, calcEntryPoints, calcOptionsCost, flattenEquipment, getEffectiveListCategory, isWizard, parseUnitSize, validateArmy } from '../utils/armyValidation';
import { getFaction } from '../data/factions/index';

import type { Faction, Unit, WeaponProfile, Option, OptionChoice, SubOrder } from '../types/faction';
import type { ArmyEntry } from '../types/army';
import specialRulesData from '../data/rules/special-rules.json';
import { getLore, unitLoreToId } from '../utils/magic';
import ValidationBars from '../components/ValidationBars';
import { generateArmyName } from '../data/armyNames';
import { generateArmyText, copyToClipboard, shareNative } from '../utils/dataTransfer';
import QRCodeModal from '../components/QRCodeModal';


type BrowserTab = 'characters' | 'core' | 'special' | 'rare' | 'mercenaries';

const TABS: { id: BrowserTab; label: string }[] = [
  { id: 'characters', label: 'Characters' },
  { id: 'core', label: 'Core' },
  { id: 'special', label: 'Special' },
  { id: 'rare', label: 'Rare' },
  { id: 'mercenaries', label: 'Mercenaries' },
];

/** Whether a unit is available in the given army composition */
function isUnitAvailable(unit: Unit, compositionId: string): boolean {
  if (unit.availability && unit.availability.length > 0) {
    return unit.availability.includes(compositionId);
  }
  return true;
}

/** Units available to browse for the given tab and composition (excludes mounts) */
function getUnitsForTab(faction: Faction, tab: BrowserTab, compositionId: string, subOrder?: SubOrder): Unit[] {
  const isAoI = faction.army_compositions.find((c) => c.id === compositionId)?.source === 'arcane_journal';
  return faction.units.filter(
    (u) =>
      u.category !== 'mount' &&
      getEffectiveListCategory(u, compositionId, isAoI, subOrder) === tab &&
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
  const setSubOrder = useArmyStore((s) => s.setSubOrder);

  const army = armies.find((a) => a.id === id);
  const faction = army ? getFaction(army.factionId) : undefined;

  const [showQR, setShowQR] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<BrowserTab>('characters');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [expandedMagicCategories, setExpandedMagicCategories] = useState<Record<string, boolean>>({
    magic_weapon: false,
    magic_armour: false,
    talisman: false,
    enchanted_item: false,
    arcane_item: false,
    magic_standard: false,
    magic_items_section: false,
  });
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastKey = useRef(0);


  if (!army || !faction) {
    return (
      <div className="p-6">
        <p style={{ color: 'var(--f-text-3)' }}>{!army ? 'Army not found.' : 'Faction data not found.'}</p>
        <button onClick={() => navigate('/army-builder')} className="mt-3 text-sm underline" style={{ color: 'var(--f-primary)' }}>
          Back to My Armies
        </button>
      </div>
    );
  }

  const pts = calcCategoryPoints(army, faction);
  const issues = validateArmy(army, faction);
  const errors = issues.filter((i) => i.severity === 'error');
  const comp = faction.army_compositions.find((c) => c.id === army.compositionId);
  const subOrder = army.subOrderId
    ? comp?.sub_orders?.find((s) => s.id === army.subOrderId)
    : undefined;

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
    toastKey.current += 1;
    setToast({ message: `+ ${unit.name} added`, key: toastKey.current });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  function handleQtyChange(entry: ArmyEntry, unit: Unit, delta: number) {
    const { min, max } = parseUnitSize(unit.unit_size);
    const next = entry.quantity + delta;
    if (next < min || (max !== null && next > max)) return;
    updateEntry(armyId, entry.id, { quantity: next });
  }

  function openDrawer(tab: BrowserTab) {
    setDrawerTab(tab);
    setDrawerOpen(true);
  }

  // ---- sub-components ----

  const isOver = pts.total > army.pointsLimit;
  const remaining = army.pointsLimit - pts.total;

  const renderEditorHeader = () => (
    <div
      className="sticky top-0 z-30"
      style={{
        backgroundColor: 'var(--f-surface)',
        borderBottom: '1px solid var(--f-border)',
        transition: 'background 0.4s',
      }}
    >
      {/* Proclamation band */}
      <div style={{
        padding: '14px 24px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        borderBottom: '1px solid var(--f-border)',
      }}>
        {/* Left: back + army name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2px' }}>
            <button
              onClick={() => navigate('/army-builder')}
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '9px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--f-text-4)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            >
              ← Armies
            </button>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '8px',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: 'var(--f-text-4)',
            }}>
              <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--f-gold-rule)', display: 'inline-block' }} />
              Army Manifest
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
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
                style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '22px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  backgroundColor: 'var(--f-elevated)',
                  color: 'var(--f-text)',
                  border: '1px solid var(--f-gold)',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  flex: 1,
                  minWidth: 0,
                  outline: 'none',
                }}
              />
            ) : (
              <button
                onClick={() => { setNameInput(army.name); setEditingName(true); }}
                title="Click to rename"
                style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '22px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: 'var(--f-text)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {army.name}
              </button>
            )}
            <button
              onClick={() => {
                const name = generateArmyName(army.factionId);
                renameArmy(army.id, name);
                setNameInput(name);
              }}
              title="Generate a random name"
              style={{
                flexShrink: 0,
                width: '28px',
                height: '28px',
                border: '1px solid var(--f-border-mid)',
                borderRadius: '3px',
                backgroundColor: 'var(--f-elevated)',
                color: 'var(--f-gold)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--f-gold)';
                e.currentTarget.style.color = 'var(--f-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--f-border-mid)';
                e.currentTarget.style.color = 'var(--f-gold)';
              }}
            >
              ⚄
            </button>
            <button
              onClick={async () => {
                const text = generateArmyText(army, 'social');
                const shared = await shareNative(`${army.name} — Battle Standard`, text);
                if (!shared) await copyToClipboard(text);
              }}
              style={{
                flexShrink: 0,
                height: '28px',
                padding: '0 10px',
                border: '1px solid var(--f-border-mid)',
                borderRadius: '3px',
                backgroundColor: 'var(--f-elevated)',
                color: 'var(--f-gold)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '9.5px',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--f-gold)';
                e.currentTarget.style.color = 'var(--f-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--f-border-mid)';
                e.currentTarget.style.color = 'var(--f-gold)';
              }}
            >
              Share ↑
            </button>
            <button
              onClick={() => setShowQR(true)}
              style={{
                padding: '6px 12px', borderRadius: '4px', fontSize: '13px',
                fontFamily: "'Cinzel', serif", cursor: 'pointer',
                border: '1px solid var(--f-border-mid)', color: 'var(--f-gold)',
                background: 'transparent',
              }}
            >
              QR
            </button>
          </div>

          <p style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '12px',
            color: 'var(--f-text-3)',
            margin: 0,
          }}>
            {army.pointsLimit.toLocaleString()} point engagement · {comp?.name ?? 'Standard'}{subOrder ? ` · ${subOrder.name}` : ''}
          </p>
        </div>

        {/* Right: points circle + unbound */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          {/* Points circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '2px solid var(--f-gold)',
              backgroundColor: 'var(--f-elevated)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 0 0 4px var(--f-gold-dim), inset 0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.4s',
            }}>
              {/* Inner ring */}
              <div style={{
                position: 'absolute',
                inset: '4px',
                borderRadius: '50%',
                border: '1px solid var(--f-gold-rule)',
                pointerEvents: 'none',
              }} />
              <span style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: 1,
                color: isOver ? '#C0392B' : 'var(--f-gold)',
                transition: 'color 0.4s',
              }}>{pts.total}</span>
              <span style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '10px',
                color: 'var(--f-text-3)',
                lineHeight: 1,
              }}>/ {army.pointsLimit}</span>
            </div>
            <span style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '7px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--f-text-4)',
            }}>Points Bound</span>
          </div>

          {/* Remaining / over */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '36px',
              fontWeight: 700,
              lineHeight: 1,
              color: isOver ? '#C0392B' : 'var(--f-primary)',
              margin: 0,
              transition: 'color 0.4s',
            }}>
              {isOver ? `-${Math.abs(remaining)}` : remaining}
            </p>
            <p style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '7px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: isOver ? '#C0392B' : 'var(--f-text-4)',
              margin: 0,
            }}>
              {isOver ? 'Over Limit' : 'Unbound'}
            </p>
          </div>
        </div>
      </div>

      {/* Validation bars */}
      <ValidationBars pts={pts} army={army} faction={faction} />
    </div>
  );

  const renderValidationBanner = () => {
    if (errors.length === 0) return null;
    return (
      <div style={{
        padding: '8px 24px',
        borderBottom: '1px solid var(--f-border)',
        borderLeft: '4px solid #C0392B',
        backgroundColor: 'var(--f-elevated)',
      }}>
        {errors.map((e, i) => (
          <p key={i} style={{
            fontSize: '12px',
            color: '#C0392B',
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontStyle: 'italic',
            margin: '2px 0',
          }}>
            ⚠ {e.message}
          </p>
        ))}
      </div>
    );
  };

  const renderUnitBrowserDrawer = () => {
    const units = getUnitsForTab(faction, drawerTab, army.compositionId, subOrder);
    const tabColor = CAT_COLORS[drawerTab];
    return (
      /* Backdrop */
      <div
        onClick={() => setDrawerOpen(false)}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', justifyContent: 'flex-end' }}
      >
        {/* Drawer panel */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(440px, 100vw)',
            backgroundColor: 'var(--f-surface)',
            borderLeft: '1px solid var(--f-border-mid)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 301,
            animation: 'drawer-slide-in 0.25s ease',
            position: 'relative',
          }}
        >
          {/* Drawer header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', borderBottom: '1px solid var(--f-border)', flexShrink: 0 }}>
            <p style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--f-text-4)', margin: 0 }}>
              Enrol a Unit
            </p>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: 'none', border: '1px solid var(--f-border)', color: 'var(--f-text-3)', width: '28px', height: '28px', cursor: 'pointer', borderRadius: '3px', fontSize: '14px' }}
            >✕</button>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--f-border)', flexShrink: 0 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDrawerTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: drawerTab === tab.id ? CAT_COLORS[tab.id] : 'var(--f-text-4)',
                  borderBottom: drawerTab === tab.id ? `2px solid ${CAT_COLORS[tab.id]}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Unit list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {units.map((unit) => {
              const { min } = parseUnitSize(unit.unit_size);
              const isFixed = unit.unit_size === '1';
              const minCost = isFixed ? unit.points : unit.points * min;
              const inListCount = army.entries.filter((e) => e.unitId === unit.id).length;
              return (
                <div key={unit.id} style={{ backgroundColor: 'var(--f-card)', border: '1px solid var(--f-border)', borderLeft: `3px solid ${tabColor}`, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '13px', fontWeight: 700, color: 'var(--f-text)', margin: '0 0 2px', letterSpacing: '0.02em' }}>{unit.name}</p>
                      <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '11px', fontStyle: 'italic', color: 'var(--f-text-3)', margin: '0 0 4px' }}>{unit.troop_type} · {unit.base_size}</p>
                      <p style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '11px', color: 'var(--f-gold)', margin: '0 0 4px' }}>
                        {isFixed ? `${unit.points} pts` : `${unit.points} pts/model · min ${min}${unit.unit_size !== `${min}+` && unit.unit_size !== `${min}` ? ` (${unit.unit_size})` : '+'}`}
                        {minCost !== unit.points && !isFixed ? ` · from ${minCost} pts` : ''}
                      </p>
                      <StatBar unit={unit} />
                      <SpecialRulesList ruleIds={unit.special_rules} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleAddUnit(unit)}
                        style={{ backgroundColor: 'var(--f-primary)', color: '#fff', border: 'none', padding: '6px 14px', fontFamily: "'Cinzel', Georgia, serif", fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        + Enrol
                      </button>
                      {inListCount > 0 && (
                        <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '10px', color: 'var(--f-gold)', backgroundColor: 'var(--f-gold-dim)', padding: '2px 8px', border: '1px solid var(--f-gold-rule)' }}>
                          ×{inListCount} in list
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {units.length === 0 && (
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontStyle: 'italic', fontSize: '13px', textAlign: 'center', padding: '32px 0', color: 'var(--f-text-4)' }}>
                No units in this category
              </p>
            )}
          </div>

          {/* Toast */}
          {toast && (
            <div key={toast.key} style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10, padding: '0 16px' }}>
              <div style={{ backgroundColor: 'var(--f-primary)', color: '#fff', padding: '8px 20px', fontFamily: "'Cinzel', Georgia, serif", fontSize: '12px', letterSpacing: '0.05em', animation: 'toast-pop 2s ease forwards', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                {toast.message}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CAT_COLORS: Record<BrowserTab, string> = {
    characters:  'var(--f-cat-characters)',
    core:        'var(--f-cat-core)',
    special:     'var(--f-cat-special)',
    rare:        'var(--f-cat-rare)',
    mercenaries: 'var(--f-cat-mercenaries)',
  };

  const renderArmyList = () => {
    const hasMercsRule = comp?.rules.some((r) => r.category === 'mercenaries') ?? false;
    const categories: { id: BrowserTab; label: string }[] = [
      { id: 'characters', label: 'Characters' },
      { id: 'core', label: 'Core' },
      { id: 'special', label: 'Special' },
      { id: 'rare', label: 'Rare' },
      ...(hasMercsRule ? [{ id: 'mercenaries' as BrowserTab, label: 'Mercenaries' }] : []),
    ];

    return (
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 10px', borderBottom: '1px solid var(--f-border)' }}>
          <p style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '10px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--f-text-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: 0,
          }}>
            <span style={{ width: '20px', height: '1px', backgroundColor: 'var(--f-gold-rule)', display: 'inline-block' }} />
            Deployment Roster
          </p>
          <button
            onClick={() => openDrawer('characters')}
            style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--f-primary)',
              border: '1px solid var(--f-primary)',
              backgroundColor: 'transparent',
              padding: '5px 14px',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.15s',
            }}
          >
            + Enrol Unit
          </button>
        </div>

        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Entries grouped by category */}
          {categories.map((cat) => {
            const entries = army.entries.filter((entry) => {
              const unit = faction.units.find((u) => u.id === entry.unitId);
              if (!unit) return false;
              return getEffectiveListCategory(unit, army.compositionId) === cat.id;
            });
            const catColor = CAT_COLORS[cat.id];

            const isCollapsed = !!collapsedSections[cat.id];
            return (
              <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {/* Heraldic category divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  {/* Collapse toggle + label — clickable */}
                  <button
                    onClick={() => setCollapsedSections((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
                    }}
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${cat.label}`}
                  >
                    <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '9px', color: catColor, opacity: 0.7, userSelect: 'none', marginRight: '2px' }}>
                      {isCollapsed ? '▸' : '▾'}
                    </span>
                    <div style={{
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      padding: '4px 14px',
                      border: `1px solid ${catColor}`,
                      color: catColor,
                      position: 'relative',
                      flexShrink: 0,
                    }}>
                      <span style={{ position: 'absolute', left: '-9px', top: '50%', transform: 'translateY(-50%)', fontSize: '7px' }}>◆</span>
                      {cat.label}
                      <span style={{ position: 'absolute', right: '-9px', top: '50%', transform: 'translateY(-50%)', fontSize: '7px' }}>◆</span>
                    </div>
                  </button>
                  <div style={{ flex: 1, height: '1px', opacity: 0.2, background: `linear-gradient(90deg, ${catColor}, transparent)` }} />
                  {/* Per-section enrol button */}
                  <button
                    onClick={() => openDrawer(cat.id)}
                    style={{
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '9px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: catColor,
                      border: `1px solid ${catColor}`,
                      backgroundColor: 'transparent',
                      padding: '3px 10px',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      opacity: 0.75,
                      transition: 'opacity 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
                  >
                    + Enrol
                  </button>
                  <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '11px', color: 'var(--f-text-3)', flexShrink: 0 }}>
                    {pts[cat.id]} pts
                  </span>
                </div>

                {!isCollapsed && entries.length === 0 && (
                  <button
                    onClick={() => openDrawer(cat.id)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: `1px dashed ${catColor}`,
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '10px',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      color: catColor,
                      opacity: 0.6,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  >
                    ◆ Enrol a {cat.label} ◆
                  </button>
                )}
                {!isCollapsed && entries.map((entry) => {
                  const unit = faction.units.find((u) => u.id === entry.unitId);
                  if (!unit) return null;
                  const entryPts = calcEntryPoints(unit, entry, faction);
                  const optsCost = calcOptionsCost(unit, entry, faction);
                  const isFixed = unit.unit_size === '1';
                  const showOptions = !!(unit.options && unit.options.length > 0) || !!(unit.command && unit.command.length > 0);
                  const { min, max } = parseUnitSize(unit.unit_size);

                  const mountUnit = entry.selectedMountId
                    ? faction.units.find((u) => u.id === entry.selectedMountId)
                    // Fallback: some characters have mount as a plain checkbox/choice option
                    // Match either exact name ("Warhorse") or "Mount on X" / "Mount on a X" style
                    : faction.units.find((u) =>
                        u.category === 'mount' &&
                        entry.selectedOptions.some((o) => {
                          const ol = o.toLowerCase();
                          const nl = u.name.toLowerCase();
                          return ol === nl || ol.endsWith(nl);
                        })
                      ) ?? null;
                  const baseEquip = flattenEquipment(unit.equipment);
                  const extraEquip = [
                    ...entry.selectedOptions.filter((o) => /\bshield\b/i.test(o) && !baseEquip.some((e) => /\bshield\b/i.test(e))),
                    ...flattenEquipment(mountUnit?.equipment),
                  ];
                  const entrySave = calcArmourSave([...baseEquip, ...extraEquip], unit.special_rules ?? []);

                  return (
                    <div
                      key={entry.id}
                      style={{
                        backgroundColor: 'var(--f-card)',
                        border: '1px solid var(--f-border)',
                        borderLeft: `4px solid ${catColor}`,
                        padding: '12px 16px',
                      }}
                    >
                      {/* Unit header row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start', marginBottom: '6px' }}>
                        <div>
                          <p style={{
                            fontFamily: "'Cinzel', Georgia, serif",
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--f-text)',
                            margin: '0 0 2px',
                            letterSpacing: '0.02em',
                          }}>{entry.customName || unit.name}</p>
                          <p style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: '11px',
                            fontStyle: 'italic',
                            color: 'var(--f-text-3)',
                            margin: 0,
                          }}>
                            {unit.troop_type} · {unit.base_size}
                            {!isFixed ? ` · ${entry.quantity} models` : ''}
                            {entrySave !== '-' ? ` · Sv ${entrySave}` : ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '22px', fontWeight: 700, lineHeight: 1, color: 'var(--f-gold)' }}>
                            {entryPts}
                          </span>
                          <span style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--f-text-4)' }}>
                            pts
                          </span>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <button onClick={() => duplicateEntry(armyId, entry.id)} title="Duplicate"
                              style={{ width: '26px', height: '26px', border: '1px solid var(--f-border)', backgroundColor: 'var(--f-elevated)', color: 'var(--f-text-3)', fontSize: '13px', cursor: 'pointer', borderRadius: '3px' }}>⧉</button>
                            <button onClick={() => removeEntry(army.id, entry.id)} aria-label="Remove"
                              style={{ width: '26px', height: '26px', border: '1px solid var(--f-border)', backgroundColor: 'var(--f-elevated)', color: '#C0392B', fontSize: '13px', cursor: 'pointer', borderRadius: '3px' }}>✕</button>
                          </div>
                        </div>
                      </div>

                      {!isFixed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '11px', fontStyle: 'italic', color: 'var(--f-text-3)' }}>Models:</span>
                          <button onClick={() => handleQtyChange(entry, unit, -1)} disabled={entry.quantity <= min}
                            style={{ width: '24px', height: '24px', border: '1px solid var(--f-border)', backgroundColor: 'var(--f-elevated)', color: 'var(--f-text)', fontWeight: 700, cursor: 'pointer', borderRadius: '3px', opacity: entry.quantity <= min ? 0.3 : 1 }}>−</button>
                          <input
                            type="number"
                            min={min}
                            max={max ?? undefined}
                            value={entry.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                const clamped = Math.max(min, max !== null ? Math.min(max, val) : val);
                                updateEntry(armyId, entry.id, { quantity: clamped });
                              }
                            }}
                            style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '13px', fontWeight: 700, color: 'var(--f-text)', width: '48px', textAlign: 'center', background: 'var(--f-elevated)', border: '1px solid var(--f-border)', borderRadius: '3px', padding: '2px 4px' }}
                          />
                          <button onClick={() => handleQtyChange(entry, unit, 1)} disabled={max !== null && entry.quantity >= max}
                            style={{ width: '24px', height: '24px', border: '1px solid var(--f-border)', backgroundColor: 'var(--f-elevated)', color: 'var(--f-text)', fontWeight: 700, cursor: 'pointer', borderRadius: '3px', opacity: (max !== null && entry.quantity >= max) ? 0.3 : 1 }}>+</button>
                          <button onClick={() => handleQtyChange(entry, unit, 5)} disabled={max !== null && entry.quantity >= max}
                            style={{ height: '24px', padding: '0 6px', border: '1px solid var(--f-border)', backgroundColor: 'var(--f-elevated)', color: 'var(--f-text)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', borderRadius: '3px', opacity: (max !== null && entry.quantity >= max) ? 0.3 : 1 }}>+5</button>
                          <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '11px', color: 'var(--f-text-3)' }}>× {unit.points} pts</span>
                        </div>
                      )}

                      <StatBar unit={unit} save={entrySave} mount={mountUnit} />

                      {/* Lore selector — shown for wizards with more than one lore option */}
                      {unit.magic && unit.magic.lores.length > 1 && (() => {
                        const activeLoreKey = entry.selectedLoreKey ?? unit.magic.lores[0];
                        const activeLoreId = unitLoreToId(activeLoreKey);
                        const loreUrl = `https://tow.whfb.app/the-lores-of-magic/${activeLoreId}`;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '11px', fontStyle: 'italic', color: 'var(--f-text-3)', flexShrink: 0 }}>Lore:</span>
                            <select
                              value={activeLoreKey}
                              onChange={(e) => updateEntry(armyId, entry.id, { selectedLoreKey: e.target.value })}
                              style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '12px', color: 'var(--f-text)', background: 'var(--f-elevated)', border: '1px solid var(--f-border)', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer' }}
                            >
                              {unit.magic.lores.map((loreKey) => (
                                <option key={loreKey} value={loreKey}>
                                  {getLore(loreKey)?.name ?? loreKey}
                                </option>
                              ))}
                            </select>
                            <a
                              href={loreUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View lore on tow.whfb.app"
                              style={{ color: 'var(--f-blue)', fontSize: '13px', lineHeight: 1, textDecoration: 'none', flexShrink: 0 }}
                            >↗</a>
                          </div>
                        );
                      })()}

                      {unit.weapon_profiles && unit.weapon_profiles.length > 0 && (() => {
                        // Show profiles matching base equipment OR currently selected weapon options
                        const equipped = [
                          ...flattenEquipment(unit.equipment),
                          ...entry.selectedOptions,
                        ].map(e => e.toLowerCase());
                        const relevantProfiles = unit.weapon_profiles.filter(wp => {
                          // Strip parenthetical qualifiers before matching so that e.g.
                          // "Polearm (single-handed)" matches equipment "Polearms (see weapon profiles)"
                          const wpRoot = wp.name.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
                          return equipped.some(eq => eq.includes(wpRoot));
                        });
                        return relevantProfiles.length > 0 ? <WeaponProfileTable profiles={relevantProfiles} /> : null;
                      })()}

                      <SpecialRulesList ruleIds={[
                        ...(unit.special_rules ?? []),
                        ...(unit.options ?? []).flatMap((o) =>
                          entry.selectedOptions.includes(o.description) ? (o.grants_rules ?? []) : []
                        ),
                        ...(entry.selectedMagicItemIds ?? []).flatMap((itemId) => {
                          const item = faction.magic_items.find((i) => i.id === itemId) as (typeof faction.magic_items[0] & { grants_rules?: string[] }) | undefined;
                          return item?.grants_rules ?? [];
                        }),
                      ]} />

                      {showOptions && (
                        <>
                          <button
                            onClick={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                            style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '11px', fontStyle: 'italic', color: 'var(--f-primary)', marginTop: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left' }}
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
            );
          })}

        </div>
      </div>
    );
  };

  // Sub-order selector — mandatory before building when composition has sub_orders
  if (comp?.sub_orders && !army.subOrderId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {renderEditorHeader()}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <h2 style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '18px',
            color: 'var(--f-accent)',
            marginBottom: '4px',
          }}>
            Choose Your Knightly Order
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--f-text-3)', marginBottom: '16px' }}>
            Select the order your army belongs to. This cannot be changed once units are added.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {comp.sub_orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSubOrder(armyId, order.id)}
                style={{
                  background: 'var(--f-surface)',
                  border: '1px solid var(--f-border)',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--f-text)',
                }}
              >
                <div style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--f-accent)',
                  marginBottom: '6px',
                }}>
                  {order.name}
                  <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '12px', color: 'var(--f-text-3)', marginLeft: '8px' }}>
                    +{order.character_upgrade_pts}pts character · +{order.unit_upgrade_pts_per_model}pts/model knights
                  </span>
                </div>
                {order.all_units_rules.length > 0 && (
                  <ul style={{ margin: '0 0 4px 0', paddingLeft: '16px', fontSize: '12px', color: 'var(--f-text-2)' }}>
                    {order.all_units_rules.map((r) => <li key={r}>{r}</li>)}
                  </ul>
                )}
                {order.elite_rules.length > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--f-text-3)', fontStyle: 'italic' }}>
                    Grand Master / Chapter Master / Inner Circle Knights: {order.elite_rules.join('; ')}
                  </div>
                )}
                {order.restrictions.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                    Excludes: {order.restrictions.join(', ')}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {renderEditorHeader()}
      {renderValidationBanner()}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderArmyList()}
      </div>
      {drawerOpen && renderUnitBrowserDrawer()}
      {showQR && <QRCodeModal army={army} onClose={() => setShowQR(false)} />}
    </div>
  );
}

function StatBar({ unit, save, mount }: { unit: Unit; save?: string; mount?: Unit | null }) {
  const main = unit.profiles[0];
  if (!main) return null;

  // Find mount profile (cavalry) or crew profile (war machine)
  const mountEntry = unit.profiles.find((pe) => pe.is_mount) ?? null;
  const crewEntry = unit.category === 'war_machine'
    ? (unit.profiles.slice(1).find((pe) => !pe.is_mount && !pe.is_champion) ?? null)
    : null;

  // For characters with a selected mount unit, synthesise a mount profile entry
  const charMountEntry =
    !mountEntry && mount?.profiles[0]
      ? { name: mount.name, profile: mount.profiles[0].profile, is_mount: true as const }
      : null;

  const extraEntry = mountEntry ?? crewEntry ?? charMountEntry;
  const multiRow = extraEntry !== null;

  const cols = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld', 'Sv'] as const;
  const displaySave = save ?? calcArmourSave(unit.equipment, unit.special_rules ?? []);

  // War machines move at crew speed — show crew M in the machine row
  const mainStats = { ...main.profile };
  if (crewEntry && String(mainStats.M) === '-') {
    mainStats.M = crewEntry.profile.M;
  }

  // Label for the extra row
  const extraLabel = mountEntry
    ? mountEntry.name
    : charMountEntry
      ? charMountEntry.name
      : crewEntry
        ? `Crew ×${crewEntry.profile.W}`
        : '';

  const cellStyle: React.CSSProperties = {
    border: '1px solid var(--f-border)',
    textAlign: 'center',
    padding: '3px 4px',
  };
  const nameCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: '8px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--f-text-3)',
    textAlign: 'left',
    paddingLeft: '5px',
    width: '62px',
    maxWidth: '62px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const renderRow = (stats: typeof main.profile, rowSave: string, label: string) => (
    <tr>
      {multiRow && <td style={nameCellStyle} title={label}>{label}</td>}
      {cols.map((s) => {
        const val = s === 'Sv' ? rowSave : String(stats[s as keyof typeof stats] ?? '-');
        return (
          <td key={s} style={{
            ...cellStyle,
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '13px',
            fontWeight: 700,
            color: s === 'Sv' && val === '-' ? 'var(--f-text-4)' : 'var(--f-text)',
          }}>
            {val}
          </td>
        );
      })}
    </tr>
  );

  return (
    <table style={{ borderCollapse: 'collapse', marginTop: '8px', width: '100%', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          {multiRow && <th style={{ ...cellStyle, width: '62px', backgroundColor: 'var(--f-bg)' }} />}
          {cols.map((s) => (
            <th key={s} style={{
              ...cellStyle,
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '9px',
              letterSpacing: '0.05em',
              color: 'var(--f-text-4)',
              fontWeight: 600,
              backgroundColor: 'var(--f-bg)',
            }}>
              {s}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {renderRow(mainStats, displaySave, main.name)}
        {extraEntry && renderRow(extraEntry.profile, '-', extraLabel)}
      </tbody>
    </table>
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
          <tr style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
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
              <td className="pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--f-text)' }}>{wp.name}</td>
              <td className="text-center pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--f-text)' }}>{wp.range}</td>
              <td className="text-center pr-2 py-0.5" style={{ color: 'var(--f-text)' }}>{wp.S}</td>
              <td className="text-center pr-2 py-0.5" style={{ color: 'var(--f-text)' }}>{wp.AP}</td>
              <td className="py-0.5" style={{ color: 'var(--f-text-3)' }}>
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
  const rulesData = (specialRulesData as { rules: { id: string; name: string; url?: string }[] }).rules;
  return (
    <>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {ruleIds.map((id) => {
          const rule = rulesData.find((r) => r.id === id);
          const name = rule?.name ?? formatRuleName(id);
          // Use explicit url override if present, otherwise derive from name
          const url = rule?.url ?? (() => {
            // Strip parenthetical qualifier (e.g. "Hatred (Dwarfs)" → "hatred") so variants
            // resolve to the single base rule page on tow.whfb.app
            const baseName = name.replace(/\s*\(.*\)\s*$/, '').trim();
            const slug = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return `https://tow.whfb.app/special-rules/${slug}`;
          })();
          return (
            <button
              key={id}
              onClick={() => setActiveRule({ name, url })}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--f-bg)',
                color: 'var(--f-primary)',
                border: '1px solid var(--f-border)',
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
            style={{ height: '80vh', backgroundColor: 'var(--f-elevated)', border: '1px solid var(--f-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-2 shrink-0 border-b"
              style={{ borderColor: 'var(--f-border)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--f-text)' }}>
                {activeRule.name}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={activeRule.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs"
                  style={{ color: 'var(--f-text-3)' }}
                >
                  Open in browser ↗
                </a>
                <button
                  onClick={() => setActiveRule(null)}
                  className="text-sm font-bold px-2 py-0.5 rounded"
                  style={{ color: 'var(--f-text)', backgroundColor: 'var(--f-bg)' }}
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

  const magicAllowanceOpt = options.find(
    (o) => o.max_points !== undefined && !o.description.toLowerCase().includes('standard')
  );
  const hasVirtuePicker = options.some((o) => o.description.includes('Knightly Virtue'));
  const hasMountOption = options.some((o) =>
    o.description === 'Mount' ||
    o.description.includes('Mount (see Character Mounts)') ||
    /^may be mounted/i.test(o.description)
  );
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
    let next = checked
      ? [...entry.selectedOptions, desc]
      : entry.selectedOptions.filter((d) => d !== desc);
    // If unchecking an option, also remove any options that depend on it as a condition
    if (!checked) {
      const dependents = options.filter((o) => o.condition === desc).map((o) => o.description);
      if (dependents.length > 0) next = next.filter((d) => !dependents.includes(d));
    }
    updateEntry(armyId, entry.id, { selectedOptions: next });
  }

  function selectChoice(choices: OptionChoice[], choiceDesc: string | null) {
    const allDescs = choices.map((c) => c.description);
    const without = entry.selectedOptions.filter((d) => !allDescs.includes(d));
    const next = choiceDesc ? [...without, choiceDesc] : without;
    updateEntry(armyId, entry.id, { selectedOptions: next });
  }

  function toggleChoice(choiceDesc: string) {
    const already = entry.selectedOptions.includes(choiceDesc);
    const next = already
      ? entry.selectedOptions.filter((d) => d !== choiceDesc)
      : [...entry.selectedOptions, choiceDesc];
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

  const divider = <div className="border-t" style={{ borderColor: 'var(--f-border)' }} />;

  return (
    <div className="mt-1.5 pt-2 flex flex-col gap-2.5 border-t" style={{ borderColor: 'var(--f-border)' }}>

      {/* Command */}
      {command.length > 0 && (
        <OptionsSection label="Command">
          {command.map((cmd, cmdIdx) => {
            const champRank = cmd.role === 'champion'
              ? command.filter(c => c.role === 'champion').indexOf(cmd)
              : -1;
            const checked = cmd.role === 'champion'
              ? champRank === 0
                ? entry.includeChampion
                : entry.selectedOptions.includes(cmd.name ?? '')
              : cmd.role === 'standard_bearer' ? entry.includeStandard
              : entry.includeMusician;
            const label = cmd.role === 'champion' ? (cmd.name ?? 'Champion')
              : cmd.role === 'standard_bearer' ? 'Standard Bearer'
              : (cmd.name ?? 'Musician');
            const onChange = (v: boolean) => {
              if (cmd.role === 'champion') {
                if (champRank === 0) {
                  updateEntry(armyId, entry.id, { includeChampion: v });
                } else {
                  const name = cmd.name ?? '';
                  let next = v
                    ? [...entry.selectedOptions, name]
                    : entry.selectedOptions.filter(o => o !== name);
                  // If unchecking, remove any options conditioned on this champion
                  if (!v) {
                    const champCondition = `${name} champion only`;
                    const conditioned = options.filter(o => o.condition === champCondition).map(o => o.description);
                    if (conditioned.length > 0) next = next.filter(d => !conditioned.includes(d));
                  }
                  updateEntry(armyId, entry.id, { selectedOptions: next });
                }
              } else if (cmd.role === 'standard_bearer') {
                updateEntry(armyId, entry.id, { includeStandard: v });
              } else {
                updateEntry(armyId, entry.id, { includeMusician: v });
              }
            };
            return <OptionCheckbox key={`${cmd.role}-${cmdIdx}`} label={`${label} — +${cmd.cost_per_unit} pts`} checked={checked} onChange={onChange} />;
          })}
        </OptionsSection>
      )}

      {/* Weapons */}
      {hasWeapons && (
        <OptionsSection label="Weapons">
          {weaponOptions.map((opt) => (
            <RegularOption key={opt.description} opt={opt} entry={entry} toggleOption={toggleOption} />
          ))}
          {weaponChoiceGroups.map((group) => (
            <ChoiceGroup key={group.description} group={group} entry={entry} selectChoice={selectChoice} toggleChoice={toggleChoice} armyId={armyId} />
          ))}
        </OptionsSection>
      )}

      {/* Armour & Shields */}
      {hasArmour && (
        <OptionsSection label="Armour &amp; Shields">
          {armourOptions.map((opt) => (
            <RegularOption key={opt.description} opt={opt} entry={entry} toggleOption={toggleOption} />
          ))}
          {armourChoiceGroups.map((group) => (
            <ChoiceGroup key={group.description} group={group} entry={entry} selectChoice={selectChoice} toggleChoice={toggleChoice} armyId={armyId} />
          ))}
        </OptionsSection>
      )}

      {/* Special Upgrades */}
      {hasSpecial && (
        <OptionsSection label="Special Upgrades">
          {specialOptions.map((opt) => (
            <RegularOption key={opt.description} opt={opt} entry={entry} toggleOption={toggleOption} />
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
                  <button onClick={() => setQty(Math.max(0, qty - 1))} disabled={qty <= 0} className="w-6 h-6 rounded text-sm font-bold disabled:opacity-30" style={{ backgroundColor: 'var(--f-bg)', color: 'var(--f-text)' }}>−</button>
                  <span className="text-sm font-semibold w-4 text-center" style={{ color: 'var(--f-text)' }}>{qty}</span>
                  <button onClick={() => setQty(Math.min(maxAllowed, qty + 1))} disabled={qty >= maxAllowed} className="w-6 h-6 rounded text-sm font-bold disabled:opacity-30" style={{ backgroundColor: 'var(--f-bg)', color: 'var(--f-text)' }}>+</button>
                  <span className="text-xs" style={{ color: qty > 0 ? 'var(--f-text)' : 'var(--f-text-3)' }}>
                    {opt.description}{totalCost > 0 ? ` — +${totalCost} pts` : ''}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--f-text-3)' }}>max {maxAllowed}</span>
                </div>
                {opt.notes && <span className="text-xs italic ml-8" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>{opt.notes}</span>}
              </div>
            );
          })}
          {specialChoiceGroups.map((group) => (
            <ChoiceGroup key={group.description} group={group} entry={entry} selectChoice={selectChoice} toggleChoice={toggleChoice} armyId={armyId} />
          ))}
        </OptionsSection>
      )}

      {/* Vow */}
      {vowOptions.length > 0 && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--f-text-3)' }}>Vow</p>
            <div className="flex flex-col gap-1">
              {/* Default vow */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span
                  className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                  style={{
                    borderColor: !selectedVow ? 'var(--f-primary)' : 'var(--f-border)',
                    backgroundColor: !selectedVow ? 'var(--f-primary)' : 'transparent',
                  }}
                >
                  {!selectedVow && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <input type="radio" name={`vow-${entry.id}`} checked={!selectedVow} onChange={() => selectVow(null)} className="sr-only" />
                <span className="text-xs" style={{ color: !selectedVow ? 'var(--f-text)' : 'var(--f-text-3)' }}>
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
                        borderColor: isActive ? 'var(--f-primary)' : 'var(--f-border)',
                        backgroundColor: isActive ? 'var(--f-primary)' : 'transparent',
                      }}
                    >
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <input type="radio" name={`vow-${entry.id}`} checked={isActive} onChange={() => selectVow(opt.description)} className="sr-only" />
                    <span className="text-xs" style={{ color: isActive ? 'var(--f-text)' : 'var(--f-text-3)' }}>
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
            <p className="text-xs font-semibold" style={{ color: 'var(--f-text-3)' }}>Mount</p>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <span
                  className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                  style={{
                    borderColor: !entry.selectedMountId ? 'var(--f-primary)' : 'var(--f-border)',
                    backgroundColor: !entry.selectedMountId ? 'var(--f-primary)' : 'transparent',
                  }}
                >
                  {!entry.selectedMountId && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <input type="radio" name={`mount-${entry.id}`} checked={!entry.selectedMountId} onChange={() => updateEntry(armyId, entry.id, { selectedMountId: null })} className="sr-only" />
                <span className="text-xs" style={{ color: !entry.selectedMountId ? 'var(--f-text)' : 'var(--f-text-3)' }}>
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
                          borderColor: isActive ? 'var(--f-primary)' : 'var(--f-border)',
                          backgroundColor: isActive ? 'var(--f-primary)' : 'transparent',
                        }}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <input type="radio" name={`mount-${entry.id}`} checked={isActive} onChange={() => updateEntry(armyId, entry.id, { selectedMountId: mount.id })} className="sr-only" />
                      <span className="flex flex-col min-w-0 gap-0.5">
                        <span className="text-xs leading-snug" style={{ color: isActive ? 'var(--f-text)' : 'var(--f-text-3)' }}>
                          {mount.name} — +{mount.points} pts
                        </span>
                        {mp && (
                          <span className="text-xs" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
                            M{mp.M} WS{mp.WS} S{mp.S} T{String(mp.T) === '-' ? '—' : mp.T} W{String(mp.W) === '-' ? '—' : mp.W} I{mp.I} A{mp.A}
                          </span>
                        )}
                        {mount.profiles[0]?.mount_grants && (
                          <span className="text-xs italic" style={{ color: 'var(--f-primary)', opacity: 0.8 }}>
                            Grants: {mount.profiles[0].mount_grants}
                          </span>
                        )}
                      </span>
                    </label>
                    {isActive && mount.weapon_profiles && mount.weapon_profiles.length > 0 && (
                      <div className="ml-6 mt-1 overflow-x-auto">
                        <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
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
                                <td className="text-left pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--f-text)', fontSize: '0.65rem' }}>{wp.name}</td>
                                <td className="text-left pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--f-text)' }}>{wp.range}</td>
                                <td className="text-center pr-2 py-0.5" style={{ color: 'var(--f-text)' }}>{wp.S}</td>
                                <td className="text-center pr-2 py-0.5" style={{ color: 'var(--f-text)' }}>{wp.AP}</td>
                                <td className="py-0.5" style={{ color: 'var(--f-text-3)' }}>
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
              <p key={i} className="text-xs italic" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>{note}</p>
            ))}
          </div>
        </>
      )}

      {/* Knightly Virtue */}
      {hasVirtuePicker && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--f-text-3)' }}>Knightly Virtue</p>
            <select
              value={entry.selectedVirtueId ?? ''}
              onChange={(e) => updateEntry(armyId, entry.id, { selectedVirtueId: e.target.value || null })}
              className="text-xs rounded px-2 py-1"
              style={{ backgroundColor: 'var(--f-bg)', color: 'var(--f-text)', border: '1px solid var(--f-border)' }}
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
              return v ? <p className="text-xs italic leading-snug" style={{ color: 'var(--f-text-3)' }}>{v.description}</p> : null;
            })()}
          </div>
        </>
      )}

      {/* Personal magic items (characters and unit champions) */}
      {magicAllowanceOpt && (!unit.command?.some((c) => c.role === 'champion') || entry.includeChampion) && (
        <>
          {divider}
          <div className="flex flex-col gap-1.5">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setExpandedMagicCategories({ ...expandedMagicCategories, magic_items_section: !(expandedMagicCategories.magic_items_section ?? false) })}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--f-text-3)' }}>
                Magic Items {!(expandedMagicCategories.magic_items_section ?? false) ? '▸' : '▾'}
              </p>
              <p className="text-xs" style={{ color: totalItemPts > (magicAllowanceOpt.max_points ?? 0) ? 'var(--f-gold)' : 'var(--f-text-3)' }}>
                {totalItemPts} / {magicAllowanceOpt.max_points} pts
              </p>
            </button>
            {(expandedMagicCategories.magic_items_section ?? false) && !isWizard(unit) && (
              <p className="text-xs italic" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>Arcane items require a Wizard</p>
            )}
            {(expandedMagicCategories.magic_items_section ?? false) && characterItemCategories.map((cat) => {
              // Filter items available to this unit (check unit_restriction text against unit name/troop type)
              const allCatItems = faction.magic_items.filter((i) => i.category === cat);
              const items = allCatItems.filter((i) => {
                const r = i.restrictions ?? '';
                if (!r) return true;
                const rl = r.toLowerCase();
                return rl.includes(unit.name.toLowerCase()) || rl.includes(unit.troop_type.toLowerCase());
              });
              if (items.length === 0) return null;
              if (cat === 'arcane_item' && !isWizard(unit)) return null;
              const isExpanded = expandedMagicCategories[cat] ?? false;

              // For magic_armour: split into armour suits vs shields
              const armourItems = cat === 'magic_armour' ? items.filter((i) => !(i as typeof i & { is_shield?: boolean }).is_shield) : null;
              const shieldItems = cat === 'magic_armour' ? items.filter((i) => !!(i as typeof i & { is_shield?: boolean }).is_shield) : null;

              const renderItem = (item: typeof items[0], inputType: 'checkbox' | 'radio' = 'checkbox', radioName?: string) => {
                const isSelected = selectedItems.includes(item.id);
                const catSelected = selectedItems.find((id) => items.some((i) => i.id === id));
                const wouldExceed = !isSelected && item.points > remainingAllowance;
                const categoryBlocked = inputType === 'checkbox' && !isSelected && !!catSelected;
                const isDisabled = wouldExceed || categoryBlocked;
                const itemExt = item as typeof item & { single_use?: boolean; is_shield?: boolean; grants_rules?: string[] };
                return (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2 pt-1.5 border-t ${isDisabled ? 'opacity-40' : 'cursor-pointer'}`}
                    style={{ borderColor: 'var(--f-border)' }}
                  >
                    {inputType === 'checkbox' ? (
                      <span
                        className="shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center text-xs"
                        style={{
                          borderColor: isSelected ? 'var(--f-gold)' : 'var(--f-border)',
                          backgroundColor: isSelected ? 'var(--f-gold)' : 'transparent',
                          color: '#0f1117',
                        }}
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                    ) : (
                      <span
                        className="shrink-0 w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center"
                        style={{
                          borderColor: isSelected ? 'var(--f-gold)' : 'var(--f-border)',
                          backgroundColor: isSelected ? 'var(--f-gold)' : 'transparent',
                        }}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0f1117' }} />}
                      </span>
                    )}
                    <input
                      type={inputType}
                      name={radioName}
                      disabled={isDisabled}
                      checked={isSelected}
                      onChange={(e) => toggleMagicItem(item.id, e.target.checked)}
                      className="sr-only"
                    />
                    <span className="flex flex-col min-w-0 gap-0.5 flex-1">
                      {/* Name + pts + badges */}
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium leading-snug" style={{ color: isSelected ? 'var(--f-text)' : 'var(--f-text-3)' }}>
                          {item.name} — {item.points} pts
                        </span>
                        {itemExt.single_use && (
                          <span className="text-xs px-1 rounded" style={{ backgroundColor: 'var(--f-bg)', color: 'var(--f-text-3)', fontSize: '0.6rem' }}>Single Use</span>
                        )}
                      </span>
                      {/* Flavour text — italic */}
                      {item.description && (
                        <span className="text-xs italic leading-snug" style={{ color: 'var(--f-text-3)', opacity: 0.8 }}>
                          {item.description}
                        </span>
                      )}
                      {/* Rules text — non-italic */}
                      {(item as typeof item & { rules_text?: string }).rules_text && (
                        <span className="text-xs leading-snug" style={{ color: 'var(--f-text-3)' }}>
                          {(item as typeof item & { rules_text?: string }).rules_text}
                        </span>
                      )}
                      {/* Weapon profile */}
                      {item.weapon_profile && (
                        <div className="mt-0.5 overflow-x-auto">
                          <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
                                <th className="text-left pr-2 pb-0.5 font-medium whitespace-nowrap">Rng</th>
                                <th className="text-center pr-2 pb-0.5 font-medium">S</th>
                                <th className="text-center pr-2 pb-0.5 font-medium">AP</th>
                                <th className="text-left pb-0.5 font-medium">Special</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--f-text)' }}>{item.weapon_profile.range}</td>
                                <td className="text-center pr-2 py-0.5" style={{ color: 'var(--f-text)' }}>{item.weapon_profile.S}</td>
                                <td className="text-center pr-2 py-0.5" style={{ color: 'var(--f-text)' }}>{item.weapon_profile.AP}</td>
                                <td className="py-0.5" style={{ color: 'var(--f-text-3)' }}>{item.weapon_profile.special_rules?.map(formatRuleName).join(', ') || '—'}</td>
                              </tr>
                            </tbody>
                          </table>
                          {item.weapon_profile.notes && (
                            <p className="text-xs italic mt-0.5" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>{item.weapon_profile.notes}</p>
                          )}
                        </div>
                      )}
                      {/* Armour profile */}
                      {item.armour_profile && (
                        <div className="mt-0.5 overflow-x-auto">
                          <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
                                <th className="text-left pr-2 pb-0.5 font-medium whitespace-nowrap">Armour</th>
                                <th className="text-left pb-0.5 font-medium">Special</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="pr-2 py-0.5 whitespace-nowrap" style={{ color: 'var(--f-text)' }}>{item.armour_profile.armour_value}</td>
                                <td className="py-0.5" style={{ color: 'var(--f-text-3)' }}>{item.armour_profile.special_rules?.map(formatRuleName).join(', ') || '—'}</td>
                              </tr>
                            </tbody>
                          </table>
                          {item.armour_profile.notes && (
                            <p className="text-xs italic mt-0.5" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>{item.armour_profile.notes}</p>
                          )}
                        </div>
                      )}
                    </span>
                  </label>
                );
              };

              return (
                <div key={cat} className="flex flex-col gap-0">
                  <button
                    onClick={() => setExpandedMagicCategories({ ...expandedMagicCategories, [cat]: !expandedMagicCategories[cat] })}
                    className="text-xs uppercase tracking-wide text-left py-1 px-1.5 rounded hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--f-text-3)', opacity: 0.6, fontSize: '0.65rem' }}
                  >
                    {isExpanded ? '▼' : '▶'} {MAGIC_ITEM_CATEGORY_LABELS[cat]}
                  </button>
                  {isExpanded && cat === 'magic_armour' ? (
                    <>
                      {armourItems && armourItems.length > 0 && (
                        <div className="flex flex-col">
                          <p className="text-xs px-1 mb-0.5" style={{ color: 'var(--f-text-3)', opacity: 0.5, fontSize: '0.6rem' }}>ARMOUR</p>
                          {armourItems.map((item) => renderItem(item))}
                        </div>
                      )}
                      {shieldItems && shieldItems.length > 0 && (
                        <div className="flex flex-col mt-1.5">
                          <p className="text-xs px-1 mb-0.5" style={{ color: 'var(--f-text-3)', opacity: 0.5, fontSize: '0.6rem' }}>SHIELDS</p>
                          {shieldItems.map((item) => renderItem(item))}
                        </div>
                      )}
                    </>
                  ) : isExpanded ? (
                    items.map((item) => renderItem(item))
                  ) : null}
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
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setExpandedMagicCategories({ ...expandedMagicCategories, magic_standard: !expandedMagicCategories.magic_standard })}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--f-text-3)' }}>
                Magic Standard {expandedMagicCategories.magic_standard ? '▾' : '▸'}
                {!expandedMagicCategories.magic_standard && selectedStandardItem && (
                  <span className="font-normal ml-1" style={{ color: 'var(--f-text)' }}>— {selectedStandardItem.name}</span>
                )}
              </p>
              <p className="text-xs" style={{ color: 'var(--f-text-3)' }}>
                {selectedStandardItem ? `${selectedStandardItem.points}` : '0'} / {unit.magic_standard} pts
              </p>
            </button>
            {expandedMagicCategories.magic_standard && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span
                    className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                    style={{
                      borderColor: !selectedStandardItem ? 'var(--f-primary)' : 'var(--f-border)',
                      backgroundColor: !selectedStandardItem ? 'var(--f-primary)' : 'transparent',
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
                  <span className="text-xs" style={{ color: !selectedStandardItem ? 'var(--f-text)' : 'var(--f-text-3)' }}>No magic standard</span>
                </label>
                {faction.magic_items
                  .filter((i) => i.category === 'magic_standard' && i.points <= (unit.magic_standard ?? 0))
                  .map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-start gap-2 pt-1.5 border-t cursor-pointer" style={{ borderColor: 'var(--f-border)' }}>
                        <span
                          className="shrink-0 w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center"
                          style={{
                            borderColor: isSelected ? 'var(--f-gold)' : 'var(--f-border)',
                            backgroundColor: isSelected ? 'var(--f-gold)' : 'transparent',
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
                          <span className="text-xs font-medium leading-snug" style={{ color: isSelected ? 'var(--f-text)' : 'var(--f-text-3)' }}>
                            {item.name} — {item.points} pts
                          </span>
                          {item.description && (
                            <span className="text-xs italic leading-snug" style={{ color: 'var(--f-text-3)', opacity: 0.8 }}>
                              {item.description}
                            </span>
                          )}
                          {(item as typeof item & { rules_text?: string }).rules_text && (
                            <span className="text-xs leading-snug" style={{ color: 'var(--f-text-3)' }}>
                              {(item as typeof item & { rules_text?: string }).rules_text}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function OptionsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold" style={{ color: 'var(--f-text-3)' }}>{label}</p>
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
          borderColor: checked ? 'var(--f-gold)' : 'var(--f-border)',
          backgroundColor: checked ? 'var(--f-gold)' : 'transparent',
          color: '#0f1117',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-xs" style={{ color: checked ? 'var(--f-text)' : 'var(--f-text-3)' }}>
        {label}
      </span>
    </label>
  );
}

function RegularOption({
  opt,
  entry,
  toggleOption,
}: {
  opt: Option;
  entry: ArmyEntry;
  toggleOption: (desc: string, checked: boolean) => void;
}) {
  const checked = entry.selectedOptions.includes(opt.description);
  const champOnlyMatch = opt.condition?.match(/^(.+) champion only$/);
  const conditionMet = !opt.condition
    || entry.selectedOptions.includes(opt.condition)
    || (champOnlyMatch != null && entry.selectedOptions.includes(champOnlyMatch[1]));
  const isDisabled = !conditionMet;
  const costPart = opt.cost > 0
    ? opt.scope === 'per_model'
      ? ` — +${opt.cost} pts/model`
      : ` — +${opt.cost} pts`
    : '';
  return (
    <div className={`flex flex-col gap-0.5${isDisabled ? ' opacity-40' : ''}`}>
      <label className={`flex items-center gap-2 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <span
          className="shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs"
          style={{
            borderColor: checked ? 'var(--f-gold)' : 'var(--f-border)',
            backgroundColor: checked ? 'var(--f-gold)' : 'transparent',
            color: '#0f1117',
          }}
        >
          {checked ? '✓' : ''}
        </span>
        <input
          type="checkbox"
          checked={checked}
          disabled={isDisabled}
          onChange={(e) => !isDisabled && toggleOption(opt.description, e.target.checked)}
          className="sr-only"
        />
        <span className="text-xs" style={{ color: checked ? 'var(--f-text)' : 'var(--f-text-3)' }}>
          {opt.description}{costPart}
        </span>
      </label>
      {opt.replaces && (
        <span className="text-xs italic ml-6" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
          Replaces: {opt.replaces}
        </span>
      )}
      {opt.notes && (
        <span className="text-xs italic ml-6" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
          {opt.notes}
        </span>
      )}
    </div>
  );
}

function ChoiceGroup(props: {
  group: Option;
  entry: ArmyEntry;
  selectChoice: (choices: OptionChoice[], choiceDesc: string | null) => void;
  toggleChoice: (choiceDesc: string) => void;
  armyId: string;
}) {
  const { group, entry, selectChoice, toggleChoice } = props;
  const choices = group.choices!;
  const isMulti = !!group.multi_select;
  // For radio: only one can be active; for checkbox: any subset
  const selectedDesc = !isMulti
    ? (choices.find((c) => entry.selectedOptions.includes(c.description))?.description ?? null)
    : null;

  return (
    <div className="flex flex-col gap-0.5">
      {group.description && (
        <p className="text-xs font-medium" style={{ color: 'var(--f-text-3)' }}>{group.description}</p>
      )}
      {choices.map((choice) => {
        const isActive = isMulti
          ? entry.selectedOptions.includes(choice.description)
          : selectedDesc === choice.description;
        const costPart = choice.cost > 0
          ? choice.scope === 'per_model'
            ? ` — +${choice.cost} pts/model`
            : ` — +${choice.cost} pts`
          : '';
        return (
          <label key={choice.description} className="flex items-center gap-2 cursor-pointer ml-2">
            {isMulti ? (
              <span
                className="shrink-0 w-4 h-4 border flex items-center justify-center"
                style={{
                  borderColor: isActive ? 'var(--f-primary)' : 'var(--f-border)',
                  backgroundColor: isActive ? 'var(--f-primary)' : 'transparent',
                  borderRadius: '2px',
                }}
              >
                {isActive && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
              </span>
            ) : (
              <span
                className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                style={{
                  borderColor: isActive ? 'var(--f-primary)' : 'var(--f-border)',
                  backgroundColor: isActive ? 'var(--f-primary)' : 'transparent',
                }}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            )}
            <input
              type={isMulti ? 'checkbox' : 'radio'}
              checked={isActive}
              onChange={() => isMulti ? toggleChoice(choice.description) : selectChoice(choices, choice.description)}
              className="sr-only"
            />
            <span className="text-xs" style={{ color: isActive ? 'var(--f-text)' : 'var(--f-text-3)' }}>
              {choice.description}{costPart}
            </span>
            {choice.notes && (
              <span className="text-xs italic ml-6" style={{ color: 'var(--f-text-3)', opacity: 0.7 }}>
                {choice.notes}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
