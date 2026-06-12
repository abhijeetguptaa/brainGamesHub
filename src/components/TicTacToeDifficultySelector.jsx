import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DifficultySelection from './DifficultySelection';
import { setScreen } from '../utils/analytics';

const TicTacToeDifficultySelector = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('TicTacToeDifficultySelection');
  }, []);

  const difficulties = [
    {
      key: 'easy',
      label: t('common.levels.easy'),
      emoji: '🐣',
      color: '#60a5fa',
    },
    {
      key: 'medium',
      label: t('common.levels.medium'),
      emoji: '🐼',
      color: '#f59e0b',
    },
    {
      key: 'hard',
      label: t('common.levels.hard'),
      emoji: '🦊',
      color: '#f97316',
    },
    {
      key: 'pvp',
      label: t('ticTacToe.humanVsHuman'),
      emoji: '👫',
      color: '#ec4899',
    },
  ];

  return <DifficultySelection difficulties={difficulties} baseRoute="/tictactoe" />;
};

export default TicTacToeDifficultySelector;
