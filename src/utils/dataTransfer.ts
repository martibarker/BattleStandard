import type { ArmyList } from '../types/army';
import type { SavedGame } from '../store/gameStore';
import type { ListCategory } from '../types/faction';
import { getFaction } from '../data/factions';
import { calcEntryPoints, getEffectiveListCategory } from './armyValidation';

const EXPORT_VERSION = 1;

export type ShareFormat = 'social' | 'bcp';

export interface BattleStandardExport {
  version: number;
  exportedAt: string;
  armies: ArmyList[];
  savedGames: SavedGame[];
}

const CATEGORY_LABELS: Record<ListCategory, string> = {
  characters: 'Characters',
  core: 'Core',
  special: 'Special',
  rare: 'Rare',
  mercenaries: 'Mercenaries',
};

const CATEGORY_ORDER: ListCategory[] = ['characters', 'core', 'special', 'rare', 'mercenaries'];

// ── Text generation ───────────────────────────────────────────────────────────

/** Generate a shareable text representation of a single army list */
export function generateArmyText(army: ArmyList, format: ShareFormat): string {
  const faction = getFaction(army.factionId);
  if (!faction) return `[Unknown faction: ${army.factionId}]`;

  const composition = faction.army_compositions.find((c) => c.id === army.compositionId);
  const isBcp = format === 'bcp';

  const lines: string[] = [];

  if (isBcp) {
    lines.push(`ARMY LIST — ${faction.name}`);
    lines.push(`${composition?.name ?? army.compositionId} | ${army.pointsLimit.toLocaleString()} pts`);
    lines.push('');
  } else {
    // Social / Discord format — emoji headers look great on both
    lines.push(`🏰 ${faction.name} — ${composition?.name ?? army.compositionId}`);
    lines.push(`${army.name} | ${army.pointsLimit.toLocaleString()} pts`);
    lines.push('');
  }

  let total = 0;

  // Group entries by category
  const byCategory: Partial<Record<ListCategory, typeof army.entries>> = {};
  for (const entry of army.entries) {
    const unit = faction.units.find((u) => u.id === entry.unitId);
    if (!unit) continue;
    const cat = getEffectiveListCategory(unit, army.compositionId) as ListCategory | null;
    if (!cat) continue;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat]!.push(entry);
  }

  for (const cat of CATEGORY_ORDER) {
    const entries = byCategory[cat];
    if (!entries || entries.length === 0) continue;

    const catTotal = entries.reduce((sum, entry) => {
      const unit = faction.units.find((u) => u.id === entry.unitId)!;
      return sum + calcEntryPoints(unit, entry, faction);
    }, 0);
    total += catTotal;

    if (isBcp) {
      lines.push(`--- ${CATEGORY_LABELS[cat].toUpperCase()} (${catTotal} pts) ---`);
    } else {
      const emoji = { characters: '⚔️', core: '🛡️', special: '🔱', rare: '💀', mercenaries: '⚙️' }[cat];
      lines.push(`${emoji} ${CATEGORY_LABELS[cat]} (${catTotal} pts)`);
    }

    for (const entry of entries) {
      const unit = faction.units.find((u) => u.id === entry.unitId)!;
      const pts = calcEntryPoints(unit, entry, faction);
      const name = entry.customName ?? unit.name;
      const qty = unit.unit_size === '1' ? '' : `${entry.quantity} `;
      lines.push(`  ${qty}${name} — ${pts} pts`);

      // Command
      const cmd: string[] = [];
      if (entry.includeChampion) cmd.push('Champion');
      if (entry.includeStandard) cmd.push('Standard Bearer');
      if (entry.includeMusician) cmd.push('Musician');
      if (cmd.length) lines.push(`    ${cmd.join(', ')}`);

      // Selected options
      if (entry.selectedOptions.length) {
        lines.push(`    ${entry.selectedOptions.join(', ')}`);
      }

      // Magic items
      const items = (entry.selectedMagicItemIds ?? []).map((id) => {
        const item = faction.magic_items.find((i) => i.id === id);
        return item ? `${item.name} (${item.points} pts)` : id;
      });
      if (items.length) {
        lines.push(`    Magic: ${items.join(', ')}`);
      }

      // Mount
      if (entry.selectedMountId) {
        const mount = faction.units.find((u) => u.id === entry.selectedMountId);
        if (mount) lines.push(`    Mount: ${mount.name}`);
      }
    }

    lines.push('');
  }

  if (isBcp) {
    lines.push(`--- Total: ${total.toLocaleString()} / ${army.pointsLimit.toLocaleString()} pts ---`);
  } else {
    lines.push(`Total: ${total.toLocaleString()} / ${army.pointsLimit.toLocaleString()} pts`);
    lines.push('');
    lines.push('Built with Battle Standard — https://battlestandard.app');
    lines.push('#WarhammerOldWorld #WHTOW');
  }

  return lines.join('\n');
}

// ── File download helpers ─────────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── JSON transfer export/import ───────────────────────────────────────────────

export function exportTransferJson(armies: ArmyList[], savedGames: SavedGame[]): void {
  const payload: BattleStandardExport = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    armies,
    savedGames,
  };
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(JSON.stringify(payload, null, 2), `battle-standard-${date}.json`, 'application/json');
}

export function parseImport(text: string): BattleStandardExport {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Not a valid JSON file.');
  }
  if (
    typeof data !== 'object' ||
    data === null ||
    !('version' in data) ||
    !('armies' in data) ||
    !('savedGames' in data)
  ) {
    throw new Error('Not a Battle Standard export file.');
  }
  return data as BattleStandardExport;
}

// ── Share helpers ─────────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function shareNative(title: string, text: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
