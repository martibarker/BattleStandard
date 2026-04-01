import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from './idbStorage';

export interface SavedGame {
  gameId: string;
  gameName: string;
  savedAt: number;
  currentTurn: number;
  currentPhase: GamePhase;
  currentSide: PlayerSide;
  players: { p1: PlayerGameState; p2: PlayerGameState };
  log: GameEvent[];
  gameLengthRule: 'standard' | 'random';
  turnLimit: number;
  activeSecondaries: string[];
  secondaryScores: { p1: number; p2: number };
}

export type GamePhase =
  | 'setup'
  | 'start_of_turn'
  | 'movement'
  | 'shooting'
  | 'magic'
  | 'combat'
  | 'end_of_turn';

export type PlayerSide = 'p1' | 'p2';

export interface SpellEntry {
  name: string;
  isAssailment: boolean;
  /** lores.json spell id — enables casting value lookup at render time */
  spellId?: string;
  /** Cached from lores.json at setup time */
  castingValue?: string;
  /** e.g. 'Assailment', 'Magic Missile', 'Hex', 'Enchantment' */
  spellType?: string;
  /** True for spells granted by a bound spell item */
  isBound?: boolean;
  /** Power level for bound spells */
  powerLevel?: number;
}

export interface SpellSelection {
  unitId: string;
  unitName: string;
  lore: string;
  spells: SpellEntry[];
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
  /**
   * Cumulative Gaze of the Gods log for Warriors of Chaos characters.
   * Key = unit id, value = array of result strings (one per roll, e.g. "Turn 2: D6:4 — Chaotic Attribute (scales)")
   */
  gazeOfGodsLog: Record<string, string[]>;
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
  gameName: string;
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
  /** VP scored from secondary objectives (tracked separately from battle VP) */
  secondaryScores: { p1: number; p2: number };
  /** Persisted saved games list */
  savedGames: SavedGame[];

  // Actions
  startGame: (p1: Partial<PlayerGameState>, p2: Partial<PlayerGameState>, gameLengthRule?: 'standard' | 'random', activeSecondaries?: string[], gameName?: string) => void;
  resetGame: () => void;
  /** Save current game state to the saved games list and return to hub */
  exitGame: () => void;
  /** Load a saved game as the active game */
  loadGame: (gameId: string) => void;
  /** Permanently delete a saved game */
  deleteGame: (gameId: string) => void;
  advancePhase: () => void;
  toggleUnitShot: (side: PlayerSide, entryId: string) => void;
  toggleUnitFought: (side: PlayerSide, entryId: string) => void;
  markUnitDestroyed: (side: PlayerSide, entryId: string) => void;
  markUnitFled: (side: PlayerSide, entryId: string) => void;
  markAmbusherArrived: (side: PlayerSide, entryId: string) => void;
  addSpellsToWizard: (side: PlayerSide, unitId: string, unitName: string, lore: string, spells: SpellEntry[]) => void;
  addSecondaryVP: (side: PlayerSide, vp: number, objectiveName: string) => void;
  toggleSpellAssailment: (side: PlayerSide, unitId: string, lore: string, spellIndex: number) => void;
  /** Record a Gaze of the Gods result for a Warriors of Chaos character */
  recordGazeResult: (side: PlayerSide, unitId: string, result: string) => void;
  addEvent: (side: PlayerSide, message: string) => void;
}

const PHASE_ORDER: GamePhase[] = [
  'start_of_turn',
  'movement',
  'magic',
  'shooting',
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
  gazeOfGodsLog: {},
});

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      gameId: null,
      gameName: '',
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
      secondaryScores: { p1: 0, p2: 0 },
      savedGames: [],

      startGame: (p1Setup: Partial<PlayerGameState>, p2Setup: Partial<PlayerGameState>, gameLengthRule: 'standard' | 'random' = 'standard', activeSecondaries: string[] = [], gameName = ''): void => {
        const p1State = { ...initialPlayerState('p1'), ...p1Setup };
        const p2State = { ...initialPlayerState('p2'), ...p2Setup };
        const resolvedName = gameName.trim() || `${p1State.name} vs ${p2State.name}`;

        set({
          gameId: `game_${Date.now()}`,
          gameName: resolvedName,
          currentTurn: 1,
          currentPhase: 'start_of_turn',
          currentSide: p1State.goesFirst ? 'p1' : 'p2',
          players: { p1: p1State, p2: p2State },
          log: [],
          isGameActive: true,
          gameLengthRule,
          turnLimit: 6,
          activeSecondaries,
          secondaryScores: { p1: 0, p2: 0 },
        });
      },

      resetGame: (): void => {
        set({
          gameId: null,
          gameName: '',
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
          secondaryScores: { p1: 0, p2: 0 },
        });
      },

      exitGame: (): void => {
        const state = get();
        if (!state.gameId) return;
        const snapshot: SavedGame = {
          gameId: state.gameId,
          gameName: state.gameName,
          savedAt: Date.now(),
          currentTurn: state.currentTurn,
          currentPhase: state.currentPhase,
          currentSide: state.currentSide,
          players: state.players,
          log: state.log,
          gameLengthRule: state.gameLengthRule,
          turnLimit: state.turnLimit,
          activeSecondaries: state.activeSecondaries,
          secondaryScores: state.secondaryScores,
        };
        const existing = state.savedGames.findIndex((g) => g.gameId === state.gameId);
        const savedGames = existing >= 0
          ? state.savedGames.map((g, i) => (i === existing ? snapshot : g))
          : [...state.savedGames, snapshot];
        set({
          savedGames,
          isGameActive: false,
        });
      },

      loadGame: (gameId: string): void => {
        const state = get();
        const saved = state.savedGames.find((g) => g.gameId === gameId);
        if (!saved) return;
        set({
          gameId: saved.gameId,
          gameName: saved.gameName,
          currentTurn: saved.currentTurn,
          currentPhase: saved.currentPhase,
          currentSide: saved.currentSide,
          players: saved.players,
          log: saved.log,
          isGameActive: true,
          gameLengthRule: saved.gameLengthRule,
          turnLimit: saved.turnLimit,
          activeSecondaries: saved.activeSecondaries,
          secondaryScores: saved.secondaryScores,
        });
      },

      deleteGame: (gameId: string): void => {
        set((state) => ({
          savedGames: state.savedGames.filter((g) => g.gameId !== gameId),
        }));
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

      addSpellsToWizard: (side: PlayerSide, unitId: string, unitName: string, lore: string, spells: SpellEntry[]): void => {
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
                      ? {
                          ...s,
                          spells: [
                            ...s.spells,
                            ...spells.filter(
                              (sp) => !s.spells.some((existing) => existing.name === sp.name)
                            ),
                          ],
                        }
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

      addSecondaryVP: (side: PlayerSide, vp: number, objectiveName: string): void => {
        set((state: GameState) => ({
          secondaryScores: {
            ...state.secondaryScores,
            [side]: state.secondaryScores[side] + vp,
          },
          log: [
            ...state.log,
            {
              id: `secondary_${Date.now()}_${Math.random()}`,
              turn: state.currentTurn,
              phase: state.currentPhase,
              side,
              timestamp: Date.now(),
              message: `${objectiveName}: +${vp} secondary VP`,
            },
          ],
        }));
      },

      recordGazeResult: (side: PlayerSide, unitId: string, result: string): void => {
        set((state: GameState) => ({
          players: {
            ...state.players,
            [side]: {
              ...state.players[side],
              gazeOfGodsLog: {
                ...state.players[side].gazeOfGodsLog,
                [unitId]: [
                  ...(state.players[side].gazeOfGodsLog[unitId] ?? []),
                  result,
                ],
              },
            },
          },
        }));
      },

      toggleSpellAssailment: (side: PlayerSide, unitId: string, lore: string, spellIndex: number): void => {
        set((state: GameState) => ({
          players: {
            ...state.players,
            [side]: {
              ...state.players[side],
              spells: state.players[side].spells.map((sel: SpellSelection) => {
                if (sel.unitId !== unitId || sel.lore !== lore) return sel;
                return {
                  ...sel,
                  spells: sel.spells.map((sp: SpellEntry, i: number) =>
                    i === spellIndex ? { ...sp, isAssailment: !sp.isAssailment } : sp
                  ),
                };
              }),
            },
          },
        }));
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
