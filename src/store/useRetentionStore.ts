import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RetentionState {
  streakCount: number;
  lastLoginDate: string | null; // ISO Date string (YYYY-MM-DD)
  bonusClaimedToday: boolean;
  totalDaysPlayed: number;

  // Actions
  checkLogin: () => { isNewDay: boolean; isStreakBroken: boolean };
  claimBonus: () => void;
}

const useRetentionStore = create<RetentionState>()(
  persist(
    (set, get) => ({
      streakCount: 0,
      lastLoginDate: null,
      bonusClaimedToday: false,
      totalDaysPlayed: 0,

      checkLogin: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = get().lastLoginDate;

        if (lastLogin === today) {
          return { isNewDay: false, isStreakBroken: false };
        }

        let newStreak = get().streakCount;
        let isStreakBroken = false;

        if (lastLogin) {
          const lastDate = new Date(lastLogin);
          const currentDate = new Date(today);
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1;
            isStreakBroken = true;
          }
        } else {
          newStreak = 1;
        }

        set({
          lastLoginDate: today,
          streakCount: newStreak,
          bonusClaimedToday: false,
          totalDaysPlayed: get().totalDaysPlayed + 1,
        });

        return { isNewDay: true, isStreakBroken };
      },

      claimBonus: () => set({ bonusClaimedToday: true }),
    }),
    {
      name: 'retention-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useRetentionStore;
