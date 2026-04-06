import type { CategoryPoints } from '../../utils/armyValidation';
import type { Faction } from '../../types/faction';
import type { ArmyList } from '../../types/army';

interface Props {
  pts: CategoryPoints;
  army: ArmyList;
  faction: Faction;
}

interface BarConfig {
  id: keyof Omit<CategoryPoints, 'total'>;
  label: string;
  cssVar: string;
  limitType: 'min' | 'max';
  defaultPct: number;
}

const BAR_CONFIGS: BarConfig[] = [
  { id: 'characters', label: 'Characters', cssVar: '--f-cat-characters',  limitType: 'max', defaultPct: 25 },
  { id: 'core',       label: 'Core',       cssVar: '--f-cat-core',        limitType: 'min', defaultPct: 25 },
  { id: 'special',    label: 'Special',    cssVar: '--f-cat-special',     limitType: 'max', defaultPct: 50 },
  { id: 'rare',       label: 'Rare',       cssVar: '--f-cat-rare',        limitType: 'max', defaultPct: 25 },
];

const MERCS_BAR: BarConfig = { id: 'mercenaries', label: 'Mercenaries', cssVar: '--f-cat-mercenaries', limitType: 'max', defaultPct: 25 };

export default function ValidationBars({ pts, army, faction }: Props) {
  const limit = army.pointsLimit;
  const comp = faction.army_compositions.find((c) => c.id === army.compositionId);
  const hasMercsRule = comp?.rules.some((r) => r.category === 'mercenaries') ?? false;
  const activeBars = hasMercsRule ? [...BAR_CONFIGS, MERCS_BAR] : BAR_CONFIGS;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${activeBars.length}, 1fr)`,
      backgroundColor: 'var(--f-elevated)',
      borderBottom: '1px solid var(--f-border)',
      transition: 'background 0.4s',
    }}>
      {activeBars.map((bar, idx) => {
        let limitPct = bar.defaultPct;
        if (comp) {
          const rule = comp.rules.find(
            (r) =>
              r.category === bar.id &&
              !r.unit_ids?.length &&
              (r.limit_type === 'max_percent' || r.limit_type === 'min_percent')
          );
          if (rule) limitPct = rule.limit_value;
        }

        const catPts = pts[bar.id];
        const actualPct = limit > 0 ? (catPts / limit) * 100 : 0;
        const fillWidth = limitPct > 0 ? Math.min(100, (actualPct / limitPct) * 100) : 0;

        const violated =
          bar.limitType === 'max'
            ? actualPct > limitPct
            : pts.total > 0 && actualPct < limitPct;

        const warning = !violated && bar.limitType === 'max' && actualPct > limitPct * 0.85;

        const fillColor = violated ? '#C0392B' : warning ? '#B87010' : `var(${bar.cssVar})`;
        const textColor = violated ? '#C0392B' : `var(${bar.cssVar})`;

        const ruleLabel =
          bar.limitType === 'max'
            ? `≤ ${limitPct}% ${violated ? '✗' : '✓'}`
            : `≥ ${limitPct}% ${violated ? '✗' : pts.total > 0 ? '✓' : '—'}`;

        return (
          <div
            key={bar.id}
            style={{
              padding: '10px 16px',
              borderRight: idx < activeBars.length - 1 ? '1px solid var(--f-border)' : undefined,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {/* Category label */}
            <p style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '9px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--f-text-4)',
              margin: 0,
              transition: 'color 0.4s',
            }}>
              {bar.label}
            </p>

            {/* Percentage */}
            <p style={{
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: 1,
              color: textColor,
              margin: 0,
              transition: 'color 0.4s',
            }}>
              {actualPct.toFixed(0)}
              <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}>%</span>
            </p>

            {/* Bar track */}
            <div style={{
              width: '100%',
              height: '5px',
              backgroundColor: 'var(--f-bg)',
              border: '1px solid var(--f-border)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                height: '100%',
                width: `${fillWidth}%`,
                backgroundColor: fillColor,
                borderRadius: '2px',
                transition: 'width 0.6s ease, background 0.4s',
              }} />
            </div>

            {/* Rule label */}
            <p style={{
              fontFamily: "'Source Serif 4', Georgia, serif",
              fontSize: '11px',
              fontStyle: 'italic',
              color: violated ? '#C0392B' : 'var(--f-text-4)',
              margin: 0,
              transition: 'color 0.4s',
            }}>
              {ruleLabel}
            </p>
          </div>
        );
      })}
    </div>
  );
}
