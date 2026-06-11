import React, { useEffect } from 'react';
import DifficultySelection from './DifficultySelection';
import { useTranslation } from 'react-i18next';
import useStarStore from '../store/useStarStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import { playTapSound } from '../utils/soundUtils.js';
import { setScreen } from '../utils/analytics';

const QuizDifficultySelector = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('QuizDifficultySelection');
  }, []);

  const { unlockedFeatures, unlockFeature } = useStarStore();
  const openModal = useUnlockModalStore((state) => state.openModal);

  const difficultyConfigs = [
    { key: 'easy', label: t('common.levels.easy'), emoji: '🐣', color: '#60a5fa' },
    { key: 'medium', label: t('common.levels.medium'), emoji: '🐼', color: '#f59e0b' },
    { key: 'expert', label: t('quiz.expert'), emoji: '🦁', color: '#ef4444', cost: 60 },
  ];

  const difficulties = difficultyConfigs.map((d) => {
    const featureName = `quiz_${d.key}`;
    const isLocked = d.key === 'expert' && !unlockedFeatures.includes(featureName);

    return {
      ...d,
      locked: isLocked,
      onClick: () => {
        if (isLocked) {
          openModal(featureName, d.cost, () => {
            unlockFeature(featureName);
            playTapSound();
          });
        }
      },
    };
  });

  return <DifficultySelection difficulties={difficulties} baseRoute="/quiz" />;
};

export default QuizDifficultySelector;
