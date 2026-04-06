import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ThemeOption {
  id: string;
  label: string;
  faction: string;
  hint: string;
  available: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'empire',       label: 'The Empire',        faction: 'empire-of-man',          hint: 'Warm plaster & imperial crimson', available: true },
  { id: 'bretonnia',    label: 'Bretonnia',         faction: 'kingdom-of-bretonnia',   hint: 'Coming soon',                    available: false },
  { id: 'high-elves',   label: 'High Elves',        faction: 'high-elf-realms',        hint: 'Coming soon',                    available: false },
  { id: 'wood-elves',   label: 'Wood Elves',        faction: 'wood-elf-realms',        hint: 'Coming soon',                    available: false },
  { id: 'dwarfs',       label: 'Dwarfen Holds',     faction: 'dwarfen-mountain-holds', hint: 'Coming soon',                    available: false },
  { id: 'greenskins',   label: 'Orcs & Goblins',    faction: 'orc-and-goblin-tribes',  hint: 'Coming soon',                    available: false },
  { id: 'chaos',        label: 'Warriors of Chaos', faction: 'warriors-of-chaos',      hint: 'Coming soon',                    available: false },
];

interface ThemeStore {
  theme: string;
  setTheme: (theme: string) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'empire',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'battle-standard-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
