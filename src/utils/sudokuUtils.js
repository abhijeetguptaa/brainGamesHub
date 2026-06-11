export const SUDOKU_SIZE = 9;

export function createSudokuBoard(fillValue = null) {
  return Array.from({ length: SUDOKU_SIZE }, () => Array(SUDOKU_SIZE).fill(fillValue));
}

export function createSudokuNotes() {
  return Array.from({ length: SUDOKU_SIZE }, () =>
    Array.from({ length: SUDOKU_SIZE }, () => new Set()),
  );
}

export function createSudokuGiven(puzzle) {
  return puzzle.map((row) => row.map((cell) => Boolean(cell)));
}

export function getSudokuCandidates(board, row, col) {
  if (board[row][col]) return [];

  const candidates = [];

  for (let num = 1; num <= SUDOKU_SIZE; num++) {
    let found = false;

    for (let i = 0; i < SUDOKU_SIZE; i++) {
      if (board[row][i] === num || board[i][col] === num) {
        found = true;
        break;
      }
    }

    if (found) continue;

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (board[i][j] === num) {
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      candidates.push(num);
    }
  }

  return candidates;
}

export function getSudokuNumberStats(board) {
  const numberCounts = Array(SUDOKU_SIZE + 1).fill(0);

  board.flat().forEach((value) => {
    if (value) numberCounts[value]++;
  });

  const disabledNumbers = [];
  const remainingCounts = [];

  for (let num = 1; num <= SUDOKU_SIZE; num++) {
    if (numberCounts[num] >= SUDOKU_SIZE) {
      disabledNumbers.push(num);
    }
    remainingCounts[num] = SUDOKU_SIZE - numberCounts[num];
  }

  return { disabledNumbers, remainingCounts };
}

export function isSudokuSolved(board, solution) {
  if (!solution) return false;
  return board.every((row, rowIndex) =>
    row.every((cell, colIndex) => cell === solution[rowIndex][colIndex]),
  );
}
