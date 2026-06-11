// Sudoku Generator Constants
// All static values and configuration for sudoku generation

// Grid dimensions
export const SUDOKU_GRID_SIZE = 9;
export const SUDOKU_BOX_SIZE = 3;

// Sudoku numbers range
export const SUDOKU_MIN_NUMBER = 1;
export const SUDOKU_MAX_NUMBER = 9;
export const SUDOKU_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Number of cells to remove for each difficulty level
export const REMOVAL_COUNTS = {
  easy: 30,
  medium: 37,
  hard: 47,
  complex: 52,
};

// Default difficulty
export const DEFAULT_DIFFICULTY = 'easy';

// Solution validation
export const UNIQUE_SOLUTION_COUNT = 1;

// Grid initialization
export const EMPTY_CELL_VALUE = null;
