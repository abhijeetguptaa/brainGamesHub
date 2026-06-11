import React, { useEffect } from 'react';
import DifficultySelection from './DifficultySelection';
import { useTranslation } from 'react-i18next';
import useStarStore from '../store/useStarStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import { DIFFICULTY_LEVELS } from '../constants/appConstants';
import { setScreen } from '../utils/analytics';

const WordSearchDifficultySelector = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('WordSearchDifficultySelection');
  }, []);

  const { unlockedFeatures, unlockFeature } = useStarStore();
  const { openModal } = useUnlockModalStore();

  const isHardUnlocked = unlockedFeatures.includes(`wordsearch_${DIFFICULTY_LEVELS.HARD}`);
  const isComplexUnlocked = unlockedFeatures.includes(`wordsearch_${DIFFICULTY_LEVELS.COMPLEX}`);

  const wordSearchDifficulties = [
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
      locked: !isHardUnlocked,
      onClick: () =>
        !isHardUnlocked &&
        openModal(t('common.levels.hard'), 30, () =>
          unlockFeature(`wordsearch_${DIFFICULTY_LEVELS.HARD}`),
        ),
    },
    {
      key: DIFFICULTY_LEVELS.COMPLEX,
      label: t('common.levels.complex'),
      emoji: '🦁',
      color: '#ef4444',
      locked: !isComplexUnlocked,
      onClick: () =>
        !isComplexUnlocked &&
        openModal(t('common.levels.complex'), 40, () =>
          unlockFeature(`wordsearch_${DIFFICULTY_LEVELS.COMPLEX}`),
        ),
    },
  ];

  return <DifficultySelection difficulties={wordSearchDifficulties} baseRoute="/wordsearch" />;
};

export default WordSearchDifficultySelector;
