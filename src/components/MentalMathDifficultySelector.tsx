import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DifficultySelection from './DifficultySelection';
import useStarStore from '../store/useStarStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import { setScreen } from '../utils/analytics';

const MentalMathDifficultySelector = () => {
  const { t } = useTranslation();
  const { unlockedFeatures, unlockFeature } = useStarStore();
  const { openModal } = useUnlockModalStore();

  useEffect(() => {
    setScreen('MentalMathDifficultySelection');
  }, []);

  const isHardUnlocked = unlockedFeatures.includes('mental_math_hard');
  const isComplexUnlocked = unlockedFeatures.includes('mental_math_complex');

  const difficulties = [
    {
      key: 'easy',
      label: t('common.levels.easy'),
      emoji: '🌟',
      color: '#4caf50',
    },
    {
      key: 'medium',
      label: t('common.levels.medium'),
      emoji: '🚀',
      color: '#2196f3',
    },
    {
      key: 'hard',
      label: t('common.levels.hard'),
      emoji: '🔥',
      color: '#f44336',
      locked: !isHardUnlocked,
      onClick: () =>
        !isHardUnlocked &&
        openModal(t('common.levels.hard'), 40, () => unlockFeature('mental_math_hard')),
    },
    {
      key: 'complex',
      label: t('common.levels.complex'),
      emoji: '🧠',
      color: '#ff9800',
      locked: !isComplexUnlocked,
      onClick: () =>
        !isComplexUnlocked &&
        openModal(t('common.levels.complex'), 60, () => unlockFeature('mental_math_complex')),
    },
  ];

  return <DifficultySelection difficulties={difficulties} baseRoute="/mental-math" />;
};

export default MentalMathDifficultySelector;
