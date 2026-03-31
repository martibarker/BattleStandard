import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idbStorage';

export type GamePhase =
  | 'setup'
  | 'start_of_turn'
  | 'movement'
  | 'shooting'
  | 'magic'
  | 'combat'
  | 'end_of_turn';

export type PlayerSide = 'p1' | 'p2';

export interface SpellSelection {
  unitId: string;
  unitName: string;
  lore: string;
  spells: string[];
}

export interface UnitGameState {
  unitId: string;
  entryId: string;
  unitName: string;
  destroyed: boolean;
  fled: boolean;
  stunned: boolean;
  hasShot: boolean;
  hasFought: boolean;
  ambushing: boolean;
  hasArrived: boolean;
}

export interface PlayerGameState {
  name: string;
  armyListId: string | null;
  factionId: string | null;
  side: PlayerSide;
  isAttacker: boolean;
  goesFirst: boolean;
  spells: SpellSelection[];
  unitStates: UnitGameState[];
  pointsTotal: number;
  matchedPlayFormats: string[];
}

export interface GameEvent {
  id: string;
  turn: number;
  phase: GamePhase;
  side: PlayerSide;
  timestamp: number;
  message: string;
}

export interface GameState {
  gameId: string | null;
  currentTurn: number;
  currentPhase: GamePhase;
  currentSide: PlayerSide;
  players: { p1: PlayerGameState; p2: PlayerGameState };
  log: GameEvent[];
  isGameActive: boolean;
  /** 'standard' = 6 turns, 'random' = 5-7 turns determined by d6 roll at turn 5 */
  gameLengthRule: 'standard' | 'random';
  /** Maximum number of turns for this game (6 by default, or determined by random roll) */
  turnLimit: number;
  /** Secondary objectives for this game (e.g. ['open_war_first_blood', 'open_war_breakthrough']) */
  activeSecondaries: string[];

  // Actions
  startGame: (p1: Partial<PlayerGameState>, p2: Partial<PlayerGameState>, gameLengthRule?: 'standard' | 'random', activeSecondaries?: string[]) => void;
  resetGame: () => void;
  advancePhase: () => void;
  toggleUnitShot: (side: PlayerSide, entryId: string) => void;
  toggleUnitFought: (side: PlayerSide, entryId: string) => void;
  markUnitDestroyed: (side: PlayerSide, entryId: string) => void;
  markUnitFled: (side: PlayerSide, entryId: string) => void;
  markAmbusherArrived: (side: PlayerSide, entryId: string) => void;
  addSpellsToWizard: (side: PlayerSide, unitId: string, unitName: string, lore: string, spells: string[]) => void;
  addEvent: (side: PlayerSide, message: string) => void;
}

const PHASE_ORDER: GamePhase[] = [
  'start_of_turn',
  'movement',
  'shooting',
  'magic',
  'combat',
  'end_of_turn',
];

const initialPlayerState = (side: PlayerSide): PlayerGameState => ({
  name: side === 'p1' ? 'Player 1' : 'Player 2',
  armyListId: null,
  factionId: null,
  side,
  isAttacker: side === 'p1',
  goesFirst: side === 'p1',
  spells: [],
  unitStates: [],
  pointsTotal: 0,
  matchedPlayFormats: [],
});

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      gameId: null,
      currentTurn: 1,
      currentPhase: 'setup',
      currentSide: 'p1',
      players: {
        p1: initialPlayerState('p1'),
        p2: initialPlayerState('p2'),
      },
      log: [],
      isGameActive: false,
      gameLengthRule: 'standard',
      turnLimit: 6,
      activeSecondaries: [],

      startGame: (p1Setup: Partial<PlayerGameState>, p2Setup: Partial<PlayerGameState>, gameLengthRule: 'standard' | 'random' = 'standard', activeSecondaries: string[] = []): void => {
        const p1State = { ...initialPlayerState('p1'), ...p1Setup };
        const p2State = { ...initialPlayerState('p2'), ...p2Setup };

        set({
          gameId: `game_${Date.now()}`,
          currentTurn: 1,
          currentPhase: 'start_of_turn',
          currentSide: p1State.goesFirst ? 'p1' : 'p2',
          players: { p1: p1State, p2: p2State },
          log: [],
          isGameActive: true,
          gameLengthRule,
          turnLimit: 6,
          activeSecondaries,
        });
      },

      resetGame: (): void => {
        set({
          gameId: null,
          currentTurn: 1,
          currentPhase: 'setup',
          currentSide: 'p1',
          players: {
            p1: initialPlayerState('p1'),
            p2: initialPlayerState('p2'),
          },
          log: [],
          isGameActive: false,
          gameLengthRule: 'standard',
          turnLimit: 6,
          activeSecondaries: [],
        });
      },

      advancePhase: (): void => {
        const state = get();
        const currentIdx = PHASE_ORDER.indexOf(state.currentPhase);

        if (currentIdx === -1) {
          // Starting from setup
          const nextSide = state.players.p1.goesFirst ? 'p1' : 'p2';
          set({
            currentPhase: PHASE_ORDER[0],
            currentSide: nextSide,
            currentTurn: 1,
          });
          return;
        }

        if (currentIdx < PHASE_ORDER.length - 1) {
          // Move to next phase, same side
          set({ currentPhase: PHASE_ORDER[currentIdx + 1] });
        } else {
          // End of this side's turn, switch sides
          const nextSide = state.currentSide === 'p1' ? 'p2' : 'p1';
          const nextTurn = nextSide === 'p1' ? state.currentTurn + 1 : state.currentTurn;

          if (nextTurn > state.turnLimit) {
            // Game ends
            set({ isGameActive: false });
          } else {
            set({
              currentPhase: PHASE_ORDER[0],
              currentSide: nextSide,
              currentTurn: nextTurn,
            });
          }
        }
      },

      toggleUnitShot: (side: PlayerSide, entryId: string): void => {
        set((state: GameState) => ({
          players: {
            ...state.players,
            [side]: {
              ...state.players[side],
              unitStates: state.players[side].unitStates.map((u: UnitGameState) =>
                u.entryId === entryId ? { ...u, hasShot: !u.hasShot } : u
              ),
            },
          },
        }));
      },

      toggleUnitFought: (side: PlayerSide, entryId: string): void => {
        set((state: GameState) => ({
          players: {
            ...state.players,
            [side]: {
              ...state.players[side],
              unitStates: state.players[side].unitStates.map((u) =>
                u.entryId === entryId ? { ...u, hasFought: !u.hasFought } : u
              ),
            },
          },
        }));
      },

      markUnitDestroyed: (side: PlayerSide, entryId: string): void => {
        set((state: GameState) => ({
          players: {
            ...state.players,
            [side]: {
              ...state.players[side],
              unitStates: state.players[side].unitStates.map((u) =>
                u.entryId === entryId ? { ...u, destroyed: true } : u
              ),
            },
          },
        }));
      },

      markUnitFled: (side: PlayerSide, entryId: string): void => {
        set((state: GameState) => ({
          players: {
            ...state.players,
            [side]: {
              ...state.players[side],
              unitStates: state.players[side].unitStates.map((u) =>
                u.entryId === entryId ? { ...u, fled: true } : u
              ),
            },
          },
        }));
      },

      markAmbusherArrived: (side: PlayerSide, entryId: string): void => {
        set((state: GameState) => ({
          players: {
            ...state.players,
            [side]: {
              ...state.players[side],
              unitStates: state.players[side].unitStates.map((u) =>
                u.entryId === entryId ? { ...u, ambushing: false, hasArrived: true } : u
              ),
            },
          },
        }));
      },

      addSpellsToWizard: (side: PlayerSide, unitId: string, unitName: string, lore: string, spells: string[]): void => {
        set((state: GameState) => {
          const existing = state.players[side].spells.find(
            (s: SpellSelection) => s.unitId === unitId && s.lore === lore
          );

          if (existing) {
            return {
              players: {
                ...state.players,
                [side]: {
                  ...state.players[side],
                  spells: state.players[side].spells.map((s) =>
                    s.unitId === unitId && s.lore === lore
                      ? { ...s, spells: [...new Set([...s.spells, ...spells])] }
                      : s
                  ),
                },
              },
            };
          }

          return {
            players: {
              ...state.players,
              [side]: {
                ...state.players[side],
                spells: [...state.players[side].spells, { unitId, unitName, lore, spells }],
              },
            },
          };
        });
      },

      addEvent: (side: PlayerSide, message: string): void => {
        set((state: GameState) => ({
          log: [
            ...state.log,
            {
              id: `event_${Date.now()}_${Math.random()}`,
              turn: state.currentTurn,
              phase: state.currentPhase,
              side,
              timestamp: Date.now(),
              message,
            },
          ],
        }));
      },
    }),
    {
      name: 'battle-standard-game',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
