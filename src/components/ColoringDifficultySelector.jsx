import React, { useEffect } from 'react';
import DifficultySelection from './DifficultySelection';
import { useTranslation } from 'react-i18next';
import { setScreen } from '../utils/analytics';

const ColoringDifficultySelector = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('ColoringDifficultySelection');
  }, []);

  const difficulties = [
    {
      key: 'easy',
      label: t('common.levels.easy'),
      emoji: '🐣',
      color: '#60a5fa',
    },
    {
      key: 'react-icons',
      label: t('coloring.categories.reactIcons'),
      emoji: '✨',
      color: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
      path: '/creativity/coloring/react-icons',
    },
    {
      key: 'numbers',
      label: t('coloring.categories.numbers'),
      emoji: '🔢',
      image: '/number_count.webp',
      color: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      path: '/creativity/coloring/numbers',
    },
    {
      key: 'alphabet',
      label: t('coloring.categories.alphabet'),
      emoji: '🔤',
      image: '/alphabet.webp',
      color: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      path: '/creativity/coloring/alphabet',
    },
    {
      key: 'cartoon',
      label: t('coloring.categories.cartoon'),
      emoji: '🎨',
      image: '/cartoon_coloring.webp',
      color: 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)',
      path: '/creativity/coloring/cartoon',
    },
  ];

  return <DifficultySelection difficulties={difficulties} baseRoute="/creativity/coloring" />;
};

export default ColoringDifficultySelector;
