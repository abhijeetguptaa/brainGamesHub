import React, { useEffect } from 'react';
import DifficultySelection from './DifficultySelection';
import { useTranslation } from 'react-i18next';
import useSudokuStore from '../store/useSudokuStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import { useNavigate } from 'react-router-dom';
import { setScreen } from '../utils/analytics';

const SudokuDifficultySelector = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLevelUnlocked, unlockLevel } = useSudokuStore();
  const openModal = useUnlockModalStore((state) => state.openModal);

  useEffect(() => {
    setScreen('SudokuDifficultySelection');
  }, []);

  const handleUnlock = (key, cost) => {
    openModal(t(`common.levels.${key}`), cost, () => {
      unlockLevel(key);
      navigate(`/games/sudoku/${key}`);
    });
  };

  const sudokuDifficulties = [
    {
      key: 'easy',
      label: t('common.levels.easy'),
      emoji: '🐣',
      color: '#60a5fa',
      locked: !isLevelUnlocked('easy'),
    },
    {
      key: 'medium',
      label: t('common.levels.medium'),
      emoji: '🐼',
      color: '#f59e0b',
      locked: !isLevelUnlocked('medium'),
    },
    {
      key: 'hard',
      label: t('common.levels.hard'),
      emoji: '🦊',
      color: '#f97316',
      locked: !isLevelUnlocked('hard'),
      onClick: () => handleUnlock('hard', 40),
    },
    {
      key: 'complex',
      label: t('common.levels.complex'),
      emoji: '🦁',
      color: '#ef4444',
      locked: !isLevelUnlocked('complex'),
      onClick: () => handleUnlock('complex', 60),
    },
  ];

  return <DifficultySelection difficulties={sudokuDifficulties} baseRoute="/games/sudoku" />;
};

export default SudokuDifficultySelector;
