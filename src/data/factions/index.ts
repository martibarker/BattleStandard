import type { Faction, Option, OptionChoice, OptionScope } from '../../types/faction';

// Raw JSON imports
import bretonniaRaw from './kingdom-of-bretonnia.json';
import empireRaw from './empire-of-man.json';
import dwarvesRaw from './dwarfen-mountain-holds.json';
import woodElvesRaw from './wood-elf-realms.json';
import highElvesRaw from './high-elf-realms.json';
import orcsRaw from './orc-and-goblin-tribes.json';
import warriorsRaw from './warriors-of-chaos.json';
import beastmenRaw from './beastmen-brayherds.json';
import tombKingsRaw from './tomb-kings-of-khemri.json';
import globalMagicItemsRaw from '../magic-items.json';

/**
 * Normalise the options array on a unit so all factions use the same
 * { description, cost, scope, condition?, replaces?, max_points? } shape.
 *
 * Some faction files (e.g. Empire) use { name, cost, scope } for individual
 * options and { description, choices: [...] } for mutually-exclusive groups.
 * We flatten choices into individual options, carrying the group header as
 * the `condition` field so the UI can still surface it.
 */
function normalizeOptions(options: unknown[] | undefined): Option[] {
  if (!options) return [];
  const result: Option[] = [];

  for (const raw of options) {
    const opt = raw as Record<string, unknown>;

    if (Array.isArray(opt.choices)) {
      // Mutually-exclusive group: preserve as a choice group with choices[]
      const choices: OptionChoice[] = (opt.choices as Record<string, unknown>[]).map((c) => ({
        description: (c.description ?? c.name ?? '') as string,
        cost: (c.cost ?? 0) as number,
        scope: (c.scope ?? 'per_unit') as OptionScope,
        notes: c.notes as string | undefined,
      }));
      result.push({
        description: (opt.description ?? opt.name ?? '') as string,
        cost: 0,
        scope: 'per_unit',
        choices,
      });
    } else {
      result.push({
        description: (opt.description ?? opt.name ?? '') as string,
        cost: (opt.cost ?? 0) as number,
        scope: (opt.scope ?? 'per_unit') as OptionScope,
        condition: opt.condition as string | undefined,
        notes: opt.notes as string | undefined,
        replaces: opt.replaces as string | undefined,
        max_points: opt.max_points as number | undefined,
        max_count: opt.max_count as number | undefined,
        per_n_models: opt.per_n_models as number | undefined,
      });
    }
  }

  return result;
}

// Build lookup map: id → canonical data from global magic items
type GlobalItemData = {
  description?: string;
  restrictions?: string;
  weapon_profile?: Record<string, unknown>;
  armour_profile?: Record<string, unknown>;
};
const globalItemData = new Map<string, GlobalItemData>();
for (const item of (globalMagicItemsRaw as { magic_items: Record<string, unknown>[] }).magic_items) {
  globalItemData.set(item.id as string, {
    description: item.description as string | undefined,
    restrictions: item.restrictions as string | undefined,
    weapon_profile: item.weapon_profile as Record<string, unknown> | undefined,
    armour_profile: item.armour_profile as Record<string, unknown> | undefined,
  });
}

function normalizeFaction(raw: unknown): Faction {
  const f = raw as Record<string, unknown>;
  // Normalise faction magic items: canonical data wins over faction copies for global items
  const factionMagicItems = (f.magic_items as Record<string, unknown>[] | undefined ?? []).map((item) => {
    const globals = globalItemData.get(item.id as string);
    return {
      ...item,
      // For global items: use canonical description/restrictions from magic-items.json
      description: globals?.description ?? (item.description ?? item.effect),
      restrictions: globals !== undefined ? globals.restrictions : item.restrictions,
      weapon_profile: globals?.weapon_profile ?? item.weapon_profile,
      armour_profile: globals?.armour_profile ?? item.armour_profile,
    };
  });

  return {
    ...f,
    magic_items: factionMagicItems,
    units: (f.units as Record<string, unknown>[]).map((u) => {
      // Transform stats into profiles format if needed
      let profiles = u.profiles as unknown[];
      if (!profiles && u.stats) {
        // Convert single stats object into profiles array format
        profiles = [{
          name: u.name as string,
          profile: u.stats,
        }];
      }
      // Normalize weapon_profiles field names (strength → S, ap → AP)
      const weaponProfiles = (u.weapon_profiles as Record<string, unknown>[])?.map((wp) => ({
        ...wp,
        S: (wp.S ?? wp.strength) as string,
        AP: (wp.AP ?? wp.ap) as string,
      }));
      return {
        ...u,
        profiles: profiles || [],
        equipment: (u.equipment as string[] | undefined) ?? [],
        special_rules: (u.special_rules as string[] | undefined) ?? [],
        options: normalizeOptions(u.options as unknown[] | undefined),
        ...(weaponProfiles && { weapon_profiles: weaponProfiles }),
      };
    }),
  } as unknown as Faction;
}

export const FACTIONS: Faction[] = [
  // Forces of Fantasy
  normalizeFaction(bretonniaRaw),
  normalizeFaction(empireRaw),
  normalizeFaction(dwarvesRaw),
  normalizeFaction(woodElvesRaw),
  normalizeFaction(highElvesRaw),
  // Ravening Hordes
  normalizeFaction(orcsRaw),
  normalizeFaction(warriorsRaw),
  normalizeFaction(beastmenRaw),
  normalizeFaction(tombKingsRaw),
];

export function getFaction(id: string): Faction | undefined {
  return FACTIONS.find((f) => f.id === id);
}
