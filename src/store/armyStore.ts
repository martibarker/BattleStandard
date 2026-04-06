import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ArmyList, ArmyEntry, MatchedPlayFormat } from '../types/army';
import { idbStorage } from './idbStorage';

let _nextId = 1;
function uid() {
  return `${Date.now()}-${_nextId++}`;
}

interface ArmyStore {
  armies: ArmyList[];
  createArmy: (config: {
    name: string;
    factionId: string;
    compositionId: string;
    matchedPlayFormats: MatchedPlayFormat[];
    pointsLimit: number;
  }) => string;
  deleteArmy: (id: string) => void;
  renameArmy: (id: string, name: string) => void;
  addEntry: (armyId: string, entry: Omit<ArmyEntry, 'id'>) => string;
  removeEntry: (armyId: string, entryId: string) => void;
  duplicateEntry: (armyId: string, entryId: string) => string;
  updateEntry: (armyId: string, entryId: string, patch: Partial<Omit<ArmyEntry, 'id'>>) => void;
  setSubOrder: (armyId: string, subOrderId: string) => void;
}

export const useArmyStore = create<ArmyStore>()(
  persist(
    (set) => ({
      armies: [],

      createArmy: (config) => {
        const id = uid();
        const now = new Date().toISOString();
        set((s) => ({
          armies: [
            ...s.armies,
            { ...config, id, entries: [], createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },

      deleteArmy: (id) =>
        set((s) => ({ armies: s.armies.filter((a) => a.id !== id) })),

      renameArmy: (id, name) =>
        set((s) => ({
          armies: s.armies.map((a) =>
            a.id === id ? { ...a, name, updatedAt: new Date().toISOString() } : a
          ),
        })),

      addEntry: (armyId, entry) => {
        const id = uid();
        set((s) => ({
          armies: s.armies.map((a) =>
            a.id === armyId
              ? {
                  ...a,
                  entries: [...a.entries, { ...entry, id }],
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        }));
        return id;
      },

      removeEntry: (armyId, entryId) =>
        set((s) => ({
          armies: s.armies.map((a) =>
            a.id === armyId
              ? {
                  ...a,
                  entries: a.entries.filter((e) => e.id !== entryId),
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        })),

      duplicateEntry: (armyId, entryId) => {
        const newId = uid();
        set((s) => ({
          armies: s.armies.map((a) => {
            if (a.id !== armyId) return a;
            const src = a.entries.find((e) => e.id === entryId);
            if (!src) return a;
            const idx = a.entries.indexOf(src);
            const clone = { ...src, id: newId };
            const entries = [
              ...a.entries.slice(0, idx + 1),
              clone,
              ...a.entries.slice(idx + 1),
            ];
            return { ...a, entries, updatedAt: new Date().toISOString() };
          }),
        }));
        return newId;
      },

      updateEntry: (armyId, entryId, patch) =>
        set((s) => ({
          armies: s.armies.map((a) =>
            a.id === armyId
              ? {
                  ...a,
                  entries: a.entries.map((e) =>
                    e.id === entryId ? { ...e, ...patch } : e
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        })),

      setSubOrder: (armyId, subOrderId) =>
        set((s) => ({
          armies: s.armies.map((a) =>
            a.id === armyId
              ? { ...a, subOrderId, updatedAt: new Date().toISOString() }
              : a
          ),
        })),
    }),
    {
      name: 'battle-standard-armies',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
