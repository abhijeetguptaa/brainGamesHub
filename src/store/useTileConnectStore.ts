import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface GameState {
  level: number;
  difficulty: Difficulty;
  isPaused: boolean;
  isGameOver: boolean;
  isLevelComplete: boolean;
  timer: number;

  // Actions
  setLevel: (level: number) => void;
  nextLevel: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setPaused: (isPaused: boolean) => void;
  setGameOver: (isGameOver: boolean) => void;
  setLevelComplete: (isLevelComplete: boolean) => void;
  setTimer: (timer: number) => void;
  resetGame: () => void;
}

const useTileConnectStore = create<GameState>()(
  persist(
    (set) => ({
      level: 1,
      difficulty: 'easy',
      isPaused: false,
      isGameOver: false,
      isLevelComplete: false,
      timer: 0,

      setLevel: (level) => set({ level }),
      nextLevel: () =>
        set((state) => ({ level: state.level + 1, isLevelComplete: false })),
      setDifficulty: (difficulty) => set({ difficulty }),
      setPaused: (isPaused) => set({ isPaused }),
      setGameOver: (isGameOver) => set({ isGameOver }),
      setLevelComplete: (isLevelComplete) => set({ isLevelComplete }),
      setTimer: (timer) => set({ timer }),
      resetGame: () =>
        set((state) => ({
          level: state.level, // Keep current level on soft reset
          isPaused: false,
          isGameOver: false,
          isLevelComplete: false,
          timer: 0,
        })),
    }),
    {
      name: 'tile-connect-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ level: state.level, difficulty: state.difficulty }),
    },
  ),
);

export default useTileConnectStore;
