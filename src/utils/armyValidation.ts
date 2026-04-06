import type { Faction, Unit, ListCategory, SubOrder } from '../types/faction';
import type { ArmyList, ArmyEntry } from '../types/army';


/**
 * Normalise a unit's equipment field into a flat string array.
 * Handles: string[] (most units), {rider/crew/mount: string[]} objects (cavalry/chariots), null/undefined.
 */
export function flattenEquipment(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'object') {
    return Object.values(raw as Record<string, string[]>).flat();
  }
  return [];
}

/**
 * Calculate armour save from equipment strings and special rule IDs.
 * Returns e.g. "4+" or "-" if no armour present.
 * Barding (from mount equipment) should be included in the equipment array.
 * Accepts a flat string[] or the raw equipment field (object/null) from unit data.
 */
export function calcArmourSave(equipment: unknown, specialRuleIds: string[] = []): string {
  const equip = flattenEquipment(equipment).map((e) => e.toLowerCase());

  let base: number | null = null;
  if (equip.some((e) => e.includes('full plate'))) base = 4;
  else if (equip.some((e) => e.includes('heavy armour') || e.includes('heavy armor'))) base = 5;
  else if (equip.some((e) => e.includes('light armour') || e.includes('light armor'))) base = 6;

  if (base === null) return '-';

  if (equip.some((e) => e.includes('shield'))) base -= 1;
  if (equip.some((e) => e.includes('barding'))) base -= 1;

  // Armoured Hide (X) in special rule IDs, e.g. "armoured_hide_1" or "armoured_hide(1)"
  for (const rule of specialRuleIds) {
    const m = rule.match(/armoured[_\s]?hide[_\s(]?(\d+)/i);
    if (m) base -= parseInt(m[1], 10);
  }

  return `${Math.max(1, base)}+`;
}

/** Parse a unit_size string into { min, max } model counts */
export function parseUnitSize(unitSize: string): { min: number; max: number | null } {
  if (unitSize === '1') return { min: 1, max: 1 };
  const range = unitSize.match(/^(\d+)-(\d+)$/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  const min = unitSize.match(/^(\d+)\+$/);
  if (min) return { min: parseInt(min[1]), max: null };
  return { min: 1, max: null };
}

/** Whether a unit uses per-model points (vs a fixed total) */
export function isPerModelPoints(unit: Unit): boolean {
  return unit.unit_size !== '1';
}

/** Points cost for selected options (equipment, vows, virtues, mount, magic items) on a single entry */
export function calcOptionsCost(unit: Unit, entry: ArmyEntry, faction: Faction): number {
  let cost = 0;

  // Equipment / weapon / vow options
  if (unit.options) {
    for (const opt of unit.options) {
      if (opt.max_points !== undefined) continue; // allowance info only
      if (opt.choices) {
        // Choice group: find the selected choice (if any) and count its cost
        for (const choice of opt.choices) {
          if (entry.selectedOptions.includes(choice.description)) {
            const multiplier = choice.scope === 'per_model' && isPerModelPoints(unit) ? entry.quantity : 1;
            cost += choice.cost * multiplier;
          }
        }
      } else if (opt.per_n_models !== undefined) {
        const qty = entry.optionQuantities?.[opt.description] ?? 0;
        cost += opt.cost * qty;
      } else {
        if (!entry.selectedOptions.includes(opt.description)) continue;
        const multiplier = opt.scope === 'per_model' && isPerModelPoints(unit) ? entry.quantity : 1;
        cost += opt.cost * multiplier;
      }
    }
  }

  // Knightly Virtue
  if (entry.selectedVirtueId) {
    const virtue = faction.knightly_virtues?.find((v) => v.id === entry.selectedVirtueId);
    if (virtue) cost += virtue.points;
  }

  // Mount
  if (entry.selectedMountId) {
    const mount = faction.units.find((u) => u.id === entry.selectedMountId);
    if (mount) cost += mount.points;
  }

  // Magic items (personal items + magic standards)
  for (const itemId of entry.selectedMagicItemIds ?? []) {
    const item = faction.magic_items.find((i) => i.id === itemId);
    if (item) cost += item.points;
  }

  return cost;
}

/** Points cost of a single entry, based on quantity, command upgrades, and selected options */
export function calcEntryPoints(unit: Unit, entry: ArmyEntry, faction?: Faction): number {
  const base = isPerModelPoints(unit)
    ? unit.points * entry.quantity
    : unit.points;

  let cmd = 0;
  if (unit.command) {
    const champions = unit.command.filter(c => c.role === 'champion');
    for (let i = 0; i < champions.length; i++) {
      const c = champions[i];
      const selected = i === 0 ? entry.includeChampion : (c.name != null && entry.selectedOptions.includes(c.name));
      if (selected) cmd += c.cost_per_unit;
    }
    for (const c of unit.command) {
      if (c.role === 'standard_bearer' && entry.includeStandard) { cmd += c.cost_per_unit; break; }
    }
    for (const c of unit.command) {
      if (c.role === 'musician' && entry.includeMusician) { cmd += c.cost_per_unit; break; }
    }
  }
  const opts = faction ? calcOptionsCost(unit, entry, faction) : 0;
  return base + cmd + opts;
}

/**
 * Returns the list category a unit counts toward for a specific army composition,
 * respecting any composition-specific overrides.
 * Returns null for mounts (not standalone units) and units with no category.
 */
export function getEffectiveListCategory(
  unit: Unit,
  compositionId: string,
  isAoI = false,
  subOrder?: SubOrder
): ListCategory | null {
  if (unit.category === 'mount') return null;
  // Sub-order unlocks take highest priority (e.g. Teutogen Guard unlocked by White Wolf)
  if (subOrder) {
    const unlock = subOrder.unlocks.find((u) => u.unit_id === unit.id);
    if (unlock) return unlock.list_category;
  }
  // Apply composition-specific override if present (null = explicitly excluded)
  if (unit.list_category_overrides && compositionId in unit.list_category_overrides) {
    return unit.list_category_overrides[compositionId] ?? null;
  }
  // AoI compositions require an explicit override — no implicit fallback for non-character units
  if (isAoI && unit.category !== 'character') return null;
  if (unit.category === 'character') return 'characters';
  return unit.list_category ?? null;
}

export interface CategoryPoints {
  characters: number;
  core: number;
  special: number;
  rare: number;
  mercenaries: number;
  total: number;
}

/** Compute points per category, using composition-aware slot assignments */
export function calcCategoryPoints(army: ArmyList, faction: Faction): CategoryPoints {
  const result: CategoryPoints = { characters: 0, core: 0, special: 0, rare: 0, mercenaries: 0, total: 0 };
  const composition = faction.army_compositions.find((c) => c.id === army.compositionId);
  const isAoI = composition?.source === 'arcane_journal';
  const subOrder = army.subOrderId
    ? composition?.sub_orders?.find((s) => s.id === army.subOrderId)
    : undefined;
  for (const entry of army.entries) {
    const unit = faction.units.find((u) => u.id === entry.unitId);
    if (!unit) continue;
    let pts = calcEntryPoints(unit, entry, faction);
    // Add sub-order upgrade costs
    if (subOrder) {
      if (subOrder.unit_ids.includes(unit.id)) {
        pts += subOrder.unit_upgrade_pts_per_model * entry.quantity;
      } else if (
        unit.category === 'character' &&
        (unit.id === 'grand_master' || unit.id === 'chapter_master')
      ) {
        pts += subOrder.character_upgrade_pts;
      }
    }
    const cat = getEffectiveListCategory(unit, army.compositionId, isAoI, subOrder);
    if (cat) result[cat] += pts;
    result.total += pts;
  }
  return result;
}

export interface ValidationIssue {
  category: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Returns true if a unit is a Wizard (can take arcane items).
 * Used to enforce: non-magic characters may not take arcane items.
 */
export function isWizard(unit: Unit): boolean {
  return (unit.magic?.wizard_level ?? 0) > 0;
}

/**
 * Returns true if a unit entry has an active standard bearer,
 * which is required to carry a magic standard.
 */
export function hasMagicStandardBearer(unit: Unit, entry: ArmyEntry): boolean {
  return Boolean(unit.magic_standard) && entry.includeStandard;
}

/** Validate the army list against composition rules and matched play formats */
export function validateArmy(army: ArmyList, faction: Faction): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const pts = calcCategoryPoints(army, faction);
  const limit = army.pointsLimit;

  // --- Over points limit ---
  if (pts.total > limit) {
    issues.push({
      category: 'Total',
      message: `Army is over points limit by ${pts.total - limit} pts`,
      severity: 'error',
    });
  }

  // --- Unit availability (runs regardless of points) ---
  for (const entry of army.entries) {
    const unit = faction.units.find((u) => u.id === entry.unitId);
    if (!unit) continue;
    if (unit.availability?.length && !unit.availability.includes(army.compositionId)) {
      const compName =
        faction.army_compositions.find((c) => c.id === army.compositionId)?.name ?? army.compositionId;
      issues.push({
        category: 'Availability',
        message: `${unit.name} is not available in ${compName}`,
        severity: 'error',
      });
    }
  }

  if (limit === 0) return issues;

  // --- Composition rules ---
  const comp = faction.army_compositions.find((c) => c.id === army.compositionId);
  if (comp) {
    for (const rule of comp.rules) {
      // Per-unit count rules (unit_ids specified)
      if (rule.unit_ids?.length) {
        const unitCount = army.entries.filter((e) => rule.unit_ids!.includes(e.unitId)).length;
        const unitNames = rule.unit_ids
          .map((id) => faction.units.find((u) => u.id === id)?.name ?? id)
          .join(' / ');

        if (rule.limit_type === 'max_count') {
          if (unitCount > rule.limit_value) {
            issues.push({
              category: 'Unit limit',
              message: `${unitNames}: ${unitCount} units — max ${rule.limit_value}`,
              severity: 'error',
            });
          }
        }

        if (rule.limit_type === 'max_per_1000_pts') {
          const max = Math.floor(limit / 1000) * rule.limit_value;
          if (unitCount > max) {
            issues.push({
              category: 'Unit limit',
              message: `${unitNames}: ${unitCount} units — max ${rule.limit_value} per 1,000 pts (${max} at ${limit} pts)`,
              severity: 'error',
            });
          }
        }

        if (rule.limit_type === 'min_per_1000_pts') {
          const min = Math.floor(limit / 1000) * rule.limit_value;
          if (pts.total > 0 && unitCount < min) {
            issues.push({
              category: 'Unit requirement',
              message: `${unitNames}: ${unitCount} units — need at least ${rule.limit_value} per 1,000 pts (${min} at ${limit} pts)`,
              severity: 'error',
            });
          }
        }

        if (rule.limit_type === 'min_count') {
          if (pts.total > 0 && unitCount < rule.limit_value) {
            issues.push({
              category: 'Unit requirement',
              message: `${unitNames}: ${unitCount} units — must include at least ${rule.limit_value}`,
              severity: 'error',
            });
          }
        }

        if (rule.limit_type === 'max_per_character') {
          // Count qualifying characters (unlocking characters) in the army
          const charIds = rule.character_unit_ids ?? [];
          const charCount = army.entries.filter((e) => charIds.includes(e.unitId)).length;
          const max = charCount * rule.limit_value;
          if (unitCount > max) {
            const charNames = charIds
              .map((id) => faction.units.find((u) => u.id === id)?.name ?? id)
              .filter((n, i, arr) => arr.indexOf(n) === i)
              .join(' / ');
            issues.push({
              category: 'Unit limit',
              message: `${unitNames}: ${unitCount} unit${unitCount !== 1 ? 's' : ''} — max ${rule.limit_value} per ${charNames} (${charCount} in army → max ${max})`,
              severity: 'error',
            });
          }
        }

        if (rule.limit_type === 'conditional') {
          // Warn if these units are present but qualifying general types are not in the army.
          // The General is not explicitly tracked, so this is a player-facing advisory.
          if (unitCount > 0 && rule.general_unit_ids?.length) {
            const generalPresent = army.entries.some((e) => rule.general_unit_ids!.includes(e.unitId));
            if (!generalPresent) {
              const generalNames = (rule.general_unit_ids ?? [])
                .map((id) => faction.units.find((u) => u.id === id)?.name ?? id)
                .join(' or ');
              issues.push({
                category: 'General requirement',
                message: `${unitNames}: requires General to be ${generalNames}`,
                severity: 'warning',
              });
            } else if (unitCount > rule.limit_value) {
              issues.push({
                category: 'Unit limit',
                message: `${unitNames}: ${unitCount} unit${unitCount !== 1 ? 's' : ''} — max ${rule.limit_value} under this condition`,
                severity: 'error',
              });
            }
          }
        }

        continue; // unit_ids rules don't also do category % checks
      }

      // Category percentage rules
      const catPts = pts[rule.category as keyof CategoryPoints] ?? 0;
      const pct = (catPts / limit) * 100;

      if (rule.limit_type === 'max_percent' && pct > rule.limit_value) {
        issues.push({
          category: rule.category,
          message: `${capitalise(rule.category)} is ${pct.toFixed(1)}% — max ${rule.limit_value}%`,
          severity: 'error',
        });
      }
      if (rule.limit_type === 'min_percent' && pts.total > 0 && pct < rule.limit_value) {
        issues.push({
          category: rule.category,
          message: `${capitalise(rule.category)} is ${pct.toFixed(1)}% — minimum ${rule.limit_value}%`,
          severity: 'error',
        });
      }
    }
  }

  // --- Option-level 0-N per 1,000 pts constraints (parsed from description text) ---
  // The constraint lives in the description string, e.g.:
  //   "Replace Open Order with Skirmishers (0-1 unit per 1,000 pts)"
  //   "0-1 unit per 1,000 points may have the Drilled special rule"
  //   "0-1 unit per 1,000 points may: ..." (choice group header)
  // We count how many army entries have each such option selected and compare
  // against floor(limit / 1000) * N.
  const PER_1000_RE = /\b0-(\d+)\b.*?\bper\s+1[,.]?000\b/i;

  const optionPer1000 = new Map<string, { max: number; count: number }>();
  for (const entry of army.entries) {
    const unit = faction.units.find((u) => u.id === entry.unitId);
    if (!unit) continue;
    for (const opt of unit.options ?? []) {
      const m = PER_1000_RE.exec(opt.description ?? '');
      if (!m) continue;
      const maxPer1000 = parseInt(m[1], 10);

      // Determine whether this entry has the option active
      const isSelected = opt.choices
        ? opt.choices.some((c) => entry.selectedOptions.includes(c.description))
        : entry.selectedOptions.includes(opt.description);
      if (!isSelected) continue;

      const rec = optionPer1000.get(opt.description) ?? { max: maxPer1000, count: 0 };
      rec.count += 1;
      optionPer1000.set(opt.description, rec);
    }
  }
  for (const [desc, { max, count }] of optionPer1000) {
    const allowed = Math.floor(limit / 1000) * max;
    if (count > allowed) {
      // Strip the inline constraint annotation for a cleaner display label
      const label = desc
        .replace(/\s*[[(]?0-\d+(?:\s+\w+)?\s+per\s+1[,.]?000\s*(?:pts?|points)[\])]?/gi, '')
        .replace(/\s*:\s*$/, '')
        .trim() || desc;
      issues.push({
        category: 'Unit limit',
        message: `"${label}": ${count} unit${count !== 1 ? 's' : ''} — max ${max} per 1,000 pts (${allowed} at ${limit} pts)`,
        severity: 'error',
      });
    }
  }

  // --- Matched Play: Grand Melee — no single unit/character > 25% of army ---
  if (army.matchedPlayFormats.includes('grand_melee')) {
    for (const entry of army.entries) {
      const unit = faction.units.find((u) => u.id === entry.unitId);
      if (!unit) continue;
      const entryPts = calcEntryPoints(unit, entry, faction);
      const pct = (entryPts / limit) * 100;
      if (pct > 25) {
        issues.push({
          category: 'Grand Melee',
          message: `${unit.name} costs ${entryPts} pts (${pct.toFixed(1)}%) — max 25% per unit`,
          severity: 'error',
        });
      }
    }
  }

  // --- Matched Play: Combined Arms — max identical units (using effective category) ---
  if (army.matchedPlayFormats.includes('combined_arms')) {
    const unitCounts = new Map<string, number>();
    for (const entry of army.entries) {
      unitCounts.set(entry.unitId, (unitCounts.get(entry.unitId) ?? 0) + 1);
    }
    const caComposition = faction.army_compositions.find((c) => c.id === army.compositionId);
    const isAoI = caComposition?.source === 'arcane_journal';
    const caSubOrder = army.subOrderId
      ? caComposition?.sub_orders?.find((s) => s.id === army.subOrderId)
      : undefined;
    for (const [unitId, count] of unitCounts) {
      const unit = faction.units.find((u) => u.id === unitId);
      if (!unit) continue;
      const cat = getEffectiveListCategory(unit, army.compositionId, isAoI, caSubOrder);
      const maxAllowed =
        cat === 'characters' ? 3
        : cat === 'core' ? 4
        : cat === 'special' ? 3
        : cat === 'rare' ? 2
        : null;
      if (maxAllowed !== null && count > maxAllowed) {
        issues.push({
          category: 'Combined Arms',
          message: `${unit.name}: ${count} entries — max ${maxAllowed} identical ${cat ?? 'units'}`,
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
