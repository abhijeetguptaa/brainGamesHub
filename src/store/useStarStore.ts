// src/store/useStarStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface StarState {
  stars: number;
  unlockedFeatures: string[];
  unlockedStickers: Record<string, number>;
  unlockedPassages: {
    easy: number[];
    medium: number[];
    hard: number[];
    complex: number[];
  };
  completedPassages: {
    easy: number[];
    medium: number[];
    hard: number[];
    complex: number[];
  };
  addStar: () => void;
  addStars: (amount: number) => void;
  resetStars: () => void;
  unlockFeature: (featureName: string) => void;
  lockFeature: (featureName: string) => void;
  lockFeaturesByPattern: (pattern: RegExp) => void;
  unlockPassage: (passageId: number, difficulty: string) => void;
  completePassage: (passageId: number, difficulty: string) => void;
  collectSticker: (stickerId: string, cost: number) => boolean;
  spendStars: (amount: number) => boolean;
  setMigrationData: (data: { stars?: number; passages?: any }) => void;
}

const isSessionFeature = (f: string) =>
  f === 'wordsearch_hard' ||
  f === 'wordsearch_complex' ||
  f === 'mental_math_hard' ||
  f === 'mental_math_complex' ||
  /^(Addition|Subtraction|Multiplication|Division|Comparison|Ascending|Descending)_(Hard|Complex)$/i.test(
    f,
  );

const useStarStore = create<StarState>()(
  persist(
    (set, get) => ({
      stars: 50, // Default initial value
      unlockedFeatures: [],
      unlockedStickers: {},
      unlockedPassages: { easy: [], medium: [], hard: [], complex: [] },
      completedPassages: { easy: [], medium: [], hard: [], complex: [] },

      setMigrationData: (data: any) =>
        set((state) => ({
          stars: data.stars !== undefined ? data.stars : state.stars,
          unlockedPassages: data.passages !== undefined ? data.passages : state.unlockedPassages,
          completedPassages:
            data.completedPassages !== undefined ? data.completedPassages : state.completedPassages,
        })),

      addStar: () =>
        set((state) => ({
          stars: state.stars + 1,
        })),

      addStars: (amount: number) =>
        set((state) => ({
          stars: state.stars + amount,
        })),

      resetStars: () =>
        set(() => ({
          stars: 0,
        })),

      unlockFeature: (featureName: string) =>
        set((state) => ({
          unlockedFeatures: state.unlockedFeatures.includes(featureName)
            ? state.unlockedFeatures
            : [...state.unlockedFeatures, featureName],
        })),

      lockFeature: (featureName: string) =>
        set((state) => ({
          unlockedFeatures: state.unlockedFeatures.filter((f) => f !== featureName),
        })),

      lockFeaturesByPattern: (pattern: RegExp) =>
        set((state) => ({
          unlockedFeatures: state.unlockedFeatures.filter((f) => !pattern.test(f)),
        })),

      unlockPassage: (passageId: number, difficulty: string) =>
        set((state) => ({
          unlockedPassages: {
            ...state.unlockedPassages,
            [difficulty]: (
              state.unlockedPassages[difficulty as keyof typeof state.unlockedPassages] || []
            ).includes(passageId)
              ? state.unlockedPassages[difficulty as keyof typeof state.unlockedPassages]
              : [
                  ...(state.unlockedPassages[difficulty as keyof typeof state.unlockedPassages] ||
                    []),
                  passageId,
                ],
          },
        })),

      completePassage: (passageId: number, difficulty: string) =>
        set((state) => {
          const key = difficulty as keyof typeof state.completedPassages;
          const current = state.completedPassages[key] || [];
          if (current.includes(passageId)) return state;
          return {
            completedPassages: {
              ...state.completedPassages,
              [key]: [...current, passageId],
            },
          };
        }),

      collectSticker: (stickerId: string, cost: number) => {
        const state = get();
        if (state.stars >= cost) {
          const currentCount = state.unlockedStickers[stickerId] || 0;
          set({
            stars: state.stars - cost,
            unlockedStickers: {
              ...state.unlockedStickers,
              [stickerId]: currentCount + 1,
            },
          });
          return true;
        }
        return false;
      },

      spendStars: (amount: number) => {
        const state = get();
        if (state.stars >= amount) {
          set({ stars: state.stars - amount });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'star-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        unlockedFeatures: state.unlockedFeatures.filter((f) => !isSessionFeature(f)),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.unlockedFeatures = state.unlockedFeatures.filter((f) => !isSessionFeature(f));
        }
        // Migration logic for old users
        const oldStars = localStorage.getItem('stars');
        const oldPassages = localStorage.getItem('unlocked_passages');

        // Migrate skl_current_passage_* to completedPassages
        const difficulties = ['easy', 'medium', 'hard', 'complex'];
        let hasNewMigration = false;
        const migratedCompleted: any = { ...state?.completedPassages };

        difficulties.forEach((diff) => {
          const key = `skl_current_passage_${diff}`;
          const val = localStorage.getItem(key);
          if (val) {
            const count = parseInt(val, 10);
            const currentCompleted = migratedCompleted[diff] || [];
            // If it was "currentIndex", it means all 0 to count-1 were completed
            for (let i = 0; i < count; i++) {
              if (!currentCompleted.includes(i)) {
                currentCompleted.push(i);
                hasNewMigration = true;
              }
            }
            migratedCompleted[diff] = currentCompleted;
            // We'll remove these keys later to prevent re-migration
          }
        });

        if (oldStars || oldPassages || hasNewMigration) {
          state?.setMigrationData({
            stars: oldStars ? parseInt(oldStars, 10) : undefined,
            passages: oldPassages ? JSON.parse(oldPassages) : undefined,
            completedPassages: hasNewMigration ? migratedCompleted : undefined,
          });

          // Clean up old keys after migration to prevent re-migration
          localStorage.removeItem('stars');
          localStorage.removeItem('unlocked_passages');
          difficulties.forEach((diff) => localStorage.removeItem(`skl_current_passage_${diff}`));
        }
      },
    },
  ),
);

export default useStarStore;
