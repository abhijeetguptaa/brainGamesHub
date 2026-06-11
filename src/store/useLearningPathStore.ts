import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LEARNING_PATH_LEVELS } from '../data/learningPath';
import useStarStore from './useStarStore';

export interface Task {
  id: string;
  path: string;
  targetScore: number;
  label: string;
  type: string;
}

export interface Level {
  id: number;
  title: string;
  tasks: Task[];
}

interface LearningPathState {
  unlockedLevels: number[];
  completedTasks: Record<string, boolean>;
  currentActiveTask: Task | null;
  justCompletedLevel: number | null;
  isAnimating: boolean;
  isTaskReadyToComplete: boolean;
  setActiveTask: (task: Task | null) => void;
  completeTask: (taskId: string) => void;
  setJustCompletedLevel: (levelId: number | null) => void;
  setIsAnimating: (isAnimating: boolean) => void;
  setIsTaskReadyToComplete: (isReady: boolean) => void;
  unlockLevel: (levelId: number) => void;
  skipLevel: (levelId: number) => void;
  resetProgress: () => void;
}

export const useLearningPathStore = create<LearningPathState>()(
  persist(
    (set, get) => ({
      unlockedLevels: [1],
      completedTasks: {},
      currentActiveTask: null,
      justCompletedLevel: null,
      isAnimating: false,
      isTaskReadyToComplete: false,
      setActiveTask: (task) => set({ currentActiveTask: task, isTaskReadyToComplete: false }),
      completeTask: (taskId) => {
        const state = get();
        if (state.completedTasks[taskId]) return;

        const updatedCompletedTasks = { ...state.completedTasks, [taskId]: true };
        let starsToAdd = 10; // Default stars for task

        // Determine level from taskId (e.g., 'l7_t1' -> 7)
        const levelMatch = taskId.match(/^l(\d+)_/);
        if (levelMatch) {
          const levelId = parseInt(levelMatch[1]);
          const level = LEARNING_PATH_LEVELS.find((l) => l.id === levelId);
          if (level) {
            const isLevelNowComplete = level.tasks.every((t) => updatedCompletedTasks[t.id]);

            if (isLevelNowComplete) {
              starsToAdd += 50; // Bonus stars for level completion
              const nextLevelId = levelId + 1;
              const hasNextLevel = LEARNING_PATH_LEVELS.some((l) => l.id === nextLevelId);

              set((state) => ({
                completedTasks: updatedCompletedTasks,
                justCompletedLevel: levelId,
                currentActiveTask: null,
                isTaskReadyToComplete: false,
                unlockedLevels:
                  hasNextLevel && !state.unlockedLevels.includes(nextLevelId)
                    ? [...state.unlockedLevels, nextLevelId]
                    : state.unlockedLevels,
              }));
              useStarStore.getState().addStars(starsToAdd);
              return;
            }
          }
        }

        set({
          completedTasks: updatedCompletedTasks,
          isTaskReadyToComplete: false,
        });
        useStarStore.getState().addStars(starsToAdd);
      },
      setJustCompletedLevel: (levelId) => set({ justCompletedLevel: levelId }),
      setIsAnimating: (isAnimating) => set({ isAnimating }),
      setIsTaskReadyToComplete: (isReady) => set({ isTaskReadyToComplete: isReady }),
      unlockLevel: (levelId) =>
        set((state) => {
          if (!state.unlockedLevels.includes(levelId)) {
            return { unlockedLevels: [...state.unlockedLevels, levelId] };
          }
          return state;
        }),
      skipLevel: (levelId) => {
        const state = get();
        const level = LEARNING_PATH_LEVELS.find((l) => l.id === levelId);
        if (level) {
          const updatedCompletedTasks = { ...state.completedTasks };
          level.tasks.forEach((t) => {
            updatedCompletedTasks[t.id] = true;
          });

          const nextLevelId = levelId + 1;
          const hasNextLevel = LEARNING_PATH_LEVELS.some((l) => l.id === nextLevelId);

          set((state) => ({
            completedTasks: updatedCompletedTasks,
            justCompletedLevel: levelId,
            currentActiveTask: null,
            unlockedLevels:
              hasNextLevel && !state.unlockedLevels.includes(nextLevelId)
                ? [...state.unlockedLevels, nextLevelId]
                : state.unlockedLevels,
          }));
        }
      },
      resetProgress: () =>
        set({
          unlockedLevels: [1],
          completedTasks: {},
          currentActiveTask: null,
          justCompletedLevel: null,
        }),
    }),
    {
      name: 'tiny-steps-storage',
    },
  ),
);
