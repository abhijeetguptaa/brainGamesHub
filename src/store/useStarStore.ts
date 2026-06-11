// src/store/useStarStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface StarState {
  stars: number;
  unlockedFeatures: string[];
  unlockedStickers: Record<string, number>;
  
  addStar: () => void;
  addStars: (amount: number) => void;
  resetStars: () => void;
  unlockFeature: (featureName: string) => void;
  lockFeature: (featureName: string) => void;
  lockFeaturesByPattern: (pattern: RegExp) => void;
  collectSticker: (stickerId: string, cost: number) => boolean;
  spendStars: (amount: number) => boolean;
  setMigrationData: (data: { stars?: number }) => void;
}

const isSessionFeature = (f: string) =>
  f === 'wordsearch_hard' ||
  f === 'wordsearch_complex' ||
  f === 'mental_math_hard' ||
  f === 'mental_math_complex';

const useStarStore = create<StarState>()(
  persist(
    (set, get) => ({
      stars: 50, // Default initial value
      unlockedFeatures: [],
      unlockedStickers: {},

      setMigrationData: (data: any) =>
        set((state) => ({
          stars: data.stars !== undefined ? data.stars : state.stars,
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
        // Simplified migration logic (just stars)
        const oldStars = localStorage.getItem('stars');
        if (oldStars) {
          state?.setMigrationData({
            stars: parseInt(oldStars, 10),
          });
          localStorage.removeItem('stars');
        }
      },
    },
  ),
);

export default useStarStore;
