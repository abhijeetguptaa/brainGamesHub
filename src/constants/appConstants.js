// Application-wide Constants
// All static values and configuration for the entire application

export const IS_TEST_MODE = import.meta.env.MODE === 'test';

// Math Operations
export const MATH_OPERATORS = {
  Addition: 'Addition',
  Subtraction: 'Subtraction',
  Multiplication: 'Multiplication',
  Division: 'Division',
  MentalMath: 'MentalMath',
};

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  COMPLEX: 'complex',
};

// Quiz constants
export const QUIZ_SETTINGS = {
  ROUNDS: 10,
};

export const STORAGE_KEYS = {
  USER_NAME: 'math_app_user_name_v1',
  WELCOME_SCREEN_SEEN: 'welcome_screen_seen_v1',
};
