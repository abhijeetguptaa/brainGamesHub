// Word Search Game Constants
export const WORD_SEARCH_CONSTANTS = {
  // Game Configuration
  DIFFICULTY_LEVELS: {
    EASY: {
      GRID_SIZE: 6,
      NUM_WORDS: 6,
      CLASSES: 'level-btn btn-easy',
    },
    MEDIUM: {
      GRID_SIZE: 7,
      NUM_WORDS: 7,
      CLASSES: 'level-btn btn-medium',
    },
    HARD: {
      GRID_SIZE: 8,
      NUM_WORDS: 8,
      CLASSES: 'level-btn btn-hard',
    },
    COMPLEX: {
      GRID_SIZE: 9,
      NUM_WORDS: 9,
      CLASSES: 'level-btn btn-complex',
    },
  },
  WORD_LENGTH: {
    MIN: 3,
    MAX: 6,
  },

  // Timing Constants (in milliseconds)
  TIMING: {
    CORRECT_SELECTION: 0, // Time to show selection for correct word (2 seconds)
    INCORRECT_SELECTION: 0, // Time to show selection for incorrect word (300ms)
  },

  // Styling
  STYLES: {
    CELL: {
      WIDTH: 36,
      HEIGHT: 36,
      FONT_WEIGHT: 700,
      FONT_SIZE: 20,
      BORDER: '2px solid #dee2e6',
    },
    TABLE: {
      LAYOUT: 'fixed',
      WIDTH: '100%',
    },
  },
  // Colors for selection and found-word overlays
  COLOR_PALETTE: ['#FF5733', '#3498DB', '#27AE60', '#8E44AD', '#F39C12'],
};

export default WORD_SEARCH_CONSTANTS;
