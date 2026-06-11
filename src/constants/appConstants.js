// Application-wide Constants
// All static values and configuration for the entire application

export const IS_TEST_MODE =
  import.meta.env.VITE_ADMOB_TEST_MODE === 'true' || import.meta.env.MODE === 'test';

// Math Operations
export const MATH_OPERATORS = {
  Addition: 'Addition',
  Subtraction: 'Subtraction',
  Multiplication: 'Multiplication',
  Division: 'Division',
  Comparison: 'Comparison',
  Ascending: 'Ascending',
  Descending: 'Descending',
  MentalMath: 'MentalMath',
};

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  COMPLEX: 'complex',
};

export const OPERATOR_SYMBOLS = {
  [MATH_OPERATORS.Addition]: '+',
  [MATH_OPERATORS.Subtraction]: '-',
  [MATH_OPERATORS.Multiplication]: '*',
  [MATH_OPERATORS.Division]: '/',
  [MATH_OPERATORS.Comparison]: '?',
  [MATH_OPERATORS.Ascending]: '↑',
  [MATH_OPERATORS.Descending]: '↓',
};

// Range configurations
export const RANGE_SETS = {
  SET1: [10, 20, 50, 100, 200, 500],
  SET2: [10, 20, 30, 40, 50, 100],
};

// Quiz and Animation Settings
export const QUIZ_SETTINGS = {
  ROUNDS: 100,
  PASS_THRESHOLD: 0.8, // 80% to pass
  ANIMATION_DURATION: 3000, // ms
  OPTION_COUNT: 4,
  MIN_NUMBERS_FOR_ARRANGEMENT: 3,
  MIN_DIVISION_DIVISOR: 2,
  MIN_RESULT: 2,
  PLAUSIBLE_OPTIONS_LIMIT: 10,
  FALLBACK_LIMIT: 1000,
};

// Number generation settings
export const NUMBER_GENERATION = {
  MIN_VALUE: 1, // avoid 0
  VARIANCE_PERCENT: 0.1, // ±10% for plausible options
  MIN_VARIANCE: 0.9,
  MAX_VARIANCE: 1.1,
};

// UI Text and Labels
export const APP_TEXT = {
  TITLES: {
    SMART_KIDS_LEARNING: 'Smart Kids Learning',
  },
  BUTTONS: {
    GO_HOME: 'Go Home',
    SHARE_PDF: 'Share PDF',
    DOWNLOAD: 'Download as File',
  },
  LABELS: {
    OPERATION: 'Operation',
    RANGE: 'Range',
    NAME: 'Name: ',
    DATE: 'Date: ',
    CLASS: 'Class: ',
  },
  EMOJIS: {
    SHARE: '📤',
    DOWNLOAD: '⬇️',
  },
};

// File and sharing configuration
export const FILE_SETTINGS = {
  DEFAULT_PDF_NAME: 'smart-kids-learning.pdf',
  DEFAULT_PASSAGE_PDF_NAME: 'smart-kids-learning-passage.pdf',
  PDF_TYPE: 'application/pdf',
  SHARE_TITLE: 'Smart Kids Learning',
  SHARE_TEXT: 'Smart Kids Learning PDF attached.',
};

// Modal and UI states
export const UI_MODES = {
  DOWNLOAD: 'download',
  SHARE: 'share',
};

export const STORAGE_KEYS = {
  USER_NAME: 'math_app_user_name_v1',
  WELCOME_SCREEN_SEEN: 'welcome_screen_seen_v1',
};
