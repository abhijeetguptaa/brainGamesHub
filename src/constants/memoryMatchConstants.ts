import { wordToEmoji, createCustomIcon } from '../data/iconMapping';

export const MEMORY_MATCH_CONFIG = {
  MAX_CARDS: 20,
  INITIAL_CARD_COUNT: 4,
  FLIP_BACK_DELAY: 500,
  MATCH_CHECK_DELAY: 700,
  LEVEL_UP_DELAY: 1000,
};

export const getMemoryMatchIcons = (t: any) => [
  {
    component: createCustomIcon(wordToEmoji.BALL),
    name: t('words.Ball'),
  },
  {
    component: createCustomIcon(wordToEmoji.FROG),
    name: t('words.Frog'),
  },
  {
    component: createCustomIcon(wordToEmoji.CHERRY),
    name: t('words.Cherry'),
  },
  {
    component: createCustomIcon(wordToEmoji.PARROT),
    name: t('words.Parrot'),
  },
  {
    component: createCustomIcon(wordToEmoji.ANT),
    name: t('words.Ant'),
  },
  {
    component: createCustomIcon(wordToEmoji.TIGER),
    name: t('words.Tiger'),
  },
  {
    component: createCustomIcon(wordToEmoji.APPLE),
    name: t('words.Apple'),
  },
  {
    component: createCustomIcon(wordToEmoji.GIFT),
    name: t('words.Gift'),
  },
  {
    component: createCustomIcon(wordToEmoji.HEN),
    name: t('words.Hen'),
  },
  {
    component: createCustomIcon(wordToEmoji.DONUT),
    name: t('words.Donut'),
  },
];
