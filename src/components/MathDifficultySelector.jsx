import React, { useEffect } from 'react';
import DifficultySelection from './DifficultySelection';
import { useTranslation } from 'react-i18next';
import useStarStore from '../store/useStarStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import { playTapSound } from '../utils/soundUtils.js';
import { DIFFICULTY_LEVELS } from '../constants/appConstants';
import { setScreen } from '../utils/analytics';

const MathDifficultySelector = ({ operator }) => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('MathDifficultySelection_' + operator);
  }, [operator]);

  const { unlockedFeatures, unlockFeature } = useStarStore();
  const openModal = useUnlockModalStore((state) => state.openModal);

  const difficultyConfigs = [
    { key: DIFFICULTY_LEVELS.EASY, label: t('common.levels.easy'), emoji: '🐣', color: '#60a5fa' },
    {
      key: DIFFICULTY_LEVELS.MEDIUM,
      label: t('common.levels.medium'),
      emoji: '🐼',
      color: '#f59e0b',
    },
    {
      key: DIFFICULTY_LEVELS.HARD,
      label: t('common.levels.hard'),
      emoji: '🦊',
      color: '#f97316',
      cost: 40,
    },
    {
      key: DIFFICULTY_LEVELS.COMPLEX,
      label: t('common.levels.complex'),
      emoji: '🦁',
      color: '#ef4444',
      cost: 60,
    },
  ];

  const difficulties = difficultyConfigs.map((d) => {
    // Maintain compatibility with existing unlock feature names
    const featureName = `${operator}_${d.label}`;
    const isLocked =
      ![DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM].includes(d.key) &&
      !unlockedFeatures.includes(featureName);

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

  return (
    <DifficultySelection difficulties={difficulties} baseRoute={`/maths/${operator.toLowerCase()}`} />
  );
};

export default MathDifficultySelector;
