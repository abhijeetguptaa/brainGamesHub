// Sudoku puzzle generator and solver
import {
  SUDOKU_GRID_SIZE,
  SUDOKU_BOX_SIZE,
  SUDOKU_NUMBERS,
  REMOVAL_COUNTS,
  DEFAULT_DIFFICULTY,
  UNIQUE_SOLUTION_COUNT,
  EMPTY_CELL_VALUE,
} from '../constants/sudokuConstants.js';

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function copyGrid(grid) {
  return grid.map((row) => [...row]);
}

function isSafe(grid, row, col, num) {
  for (let x = 0; x < SUDOKU_GRID_SIZE; x++) {
    if (grid[row][x] === num || grid[x][col] === num) return false;
  }
  const startRow = row - (row % SUDOKU_BOX_SIZE),
    startCol = col - (col % SUDOKU_BOX_SIZE);
  for (let i = 0; i < SUDOKU_BOX_SIZE; i++) {
    for (let j = 0; j < SUDOKU_BOX_SIZE; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
}

function solveSudoku(grid) {
  for (let row = 0; row < SUDOKU_GRID_SIZE; row++) {
    for (let col = 0; col < SUDOKU_GRID_SIZE; col++) {
      if (!grid[row][col]) {
        for (let num of shuffle([...SUDOKU_NUMBERS])) {
          if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = EMPTY_CELL_VALUE;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateFullBoard() {
  const grid = Array(SUDOKU_GRID_SIZE)
    .fill(EMPTY_CELL_VALUE)
    .map(() => Array(SUDOKU_GRID_SIZE).fill(EMPTY_CELL_VALUE));
  solveSudoku(grid);
  return grid;
}

function countSolutions(grid) {
  let count = 0;
  function helper(g) {
    for (let row = 0; row < SUDOKU_GRID_SIZE; row++) {
      for (let col = 0; col < SUDOKU_GRID_SIZE; col++) {
        if (!g[row][col]) {
          for (let num of SUDOKU_NUMBERS) {
            if (isSafe(g, row, col, num)) {
              g[row][col] = num;
              helper(g);
              g[row][col] = EMPTY_CELL_VALUE;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  helper(copyGrid(grid));
  return count;
}

function getRemovalCount(difficulty) {
  return REMOVAL_COUNTS[difficulty] || REMOVAL_COUNTS[DEFAULT_DIFFICULTY];
}

export function generateSudoku(difficulty = DEFAULT_DIFFICULTY) {
  const solution = generateFullBoard();
  const puzzle = copyGrid(solution);
  let removals = getRemovalCount(difficulty);
  while (removals > 0) {
    const row = Math.floor(Math.random() * SUDOKU_GRID_SIZE);
    const col = Math.floor(Math.random() * SUDOKU_GRID_SIZE);
    if (puzzle[row][col] === EMPTY_CELL_VALUE) continue;
    const backup = puzzle[row][col];
    puzzle[row][col] = EMPTY_CELL_VALUE;
    // Ensure unique solution
    if (countSolutions(puzzle) !== UNIQUE_SOLUTION_COUNT) {
      puzzle[row][col] = backup;
      continue;
    }
    removals--;
  }
  return { puzzle, solution };
}
