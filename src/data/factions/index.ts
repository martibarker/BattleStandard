import type { Faction, Option, OptionScope } from '../../types/faction';

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
      // Mutually-exclusive group: flatten each choice as its own option
      const groupLabel = (opt.description ?? opt.name ?? '') as string;
      for (const choice of opt.choices as Record<string, unknown>[]) {
        result.push({
          description: (choice.name ?? choice.description ?? '') as string,
          cost: (choice.cost ?? 0) as number,
          scope: (choice.scope ?? 'per_unit') as OptionScope,
          condition: groupLabel || undefined,
        });
      }
    } else {
      result.push({
        description: (opt.description ?? opt.name ?? '') as string,
        cost: (opt.cost ?? 0) as number,
        scope: (opt.scope ?? 'per_unit') as OptionScope,
        condition: (opt.condition ?? opt.notes) as string | undefined,
        replaces: opt.replaces as string | undefined,
        max_points: opt.max_points as number | undefined,
      });
    }
  }

  return result;
}

function normalizeFaction(raw: unknown): Faction {
  const f = raw as Record<string, unknown>;
  return {
    ...f,
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
