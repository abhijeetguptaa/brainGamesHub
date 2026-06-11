import React, { useEffect } from 'react';
import DifficultySelection from './DifficultySelection';
import { useTranslation } from 'react-i18next';
import { setScreen } from '../utils/analytics';

const SentenceScrambleDifficultySelector = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('SentenceScrambleDifficultySelection');
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
      key: 'complex',
      label: t('common.levels.complex'),
      emoji: '🦁',
      color: '#ef4444',
    },
  ];

  return (
    <DifficultySelection
      difficulties={difficulties}
      baseRoute="/english/sentence-scramble"
      extraClass="wordsearch-selection" // Re-using a playful selection class
    />
  );
};

export default SentenceScrambleDifficultySelector;
