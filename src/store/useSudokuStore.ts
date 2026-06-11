import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SudokuState {
  unlockedLevels: string[];
  unlockLevel: (level: string) => void;
  isLevelUnlocked: (level: string) => boolean;
}

const useSudokuStore = create<SudokuState>()(
  persist(
    (set, get) => ({
      unlockedLevels: ['easy', 'medium'], // easy and medium are unlocked by default
      unlockLevel: (level) =>
        set((state) => ({
          unlockedLevels: [...new Set([...state.unlockedLevels, level])],
        })),
      isLevelUnlocked: (level) => get().unlockedLevels.includes(level),
    }),
    {
      name: 'sudoku-storage',
      partialize: (state) => ({
        ...state,
        unlockedLevels: state.unlockedLevels.filter((l) => l !== 'hard' && l !== 'complex'),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.unlockedLevels = state.unlockedLevels.filter(
            (l) => l !== 'hard' && l !== 'complex',
          );
        }
      },
    },
  ),
);

export default useSudokuStore;
