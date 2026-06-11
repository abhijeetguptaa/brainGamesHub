export const createInitialBoard = () =>
  Array(3)
    .fill(null)
    .map(() => Array(3).fill(null));

export function getWinner(board) {
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return {
        winner: board[i][0],
        line: [
          [i, 0],
          [i, 1],
          [i, 2],
        ],
      };
    }

    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return {
        winner: board[0][i],
        line: [
          [0, i],
          [1, i],
          [2, i],
        ],
      };
    }
  }

  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return {
      winner: board[0][0],
      line: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    };
  }

  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return {
      winner: board[0][2],
      line: [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    };
  }

  return null;
}

export function minimax(board, depth, isMax, ai, human, alpha, beta) {
  const winnerInfo = getWinner(board);
  if (winnerInfo) {
    if (winnerInfo.winner === ai) return { score: 10 - depth };
    if (winnerInfo.winner === human) return { score: depth - 10 };
  }

  if (board.flat().every(Boolean)) return { score: 0 };

  let bestMove = null;

  if (isMax) {
    let maxEval = -Infinity;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!board[r][c]) {
          board[r][c] = ai;
          const evalResult = minimax(board, depth + 1, false, ai, human, alpha, beta);
          board[r][c] = null;
          if (evalResult.score > maxEval) {
            maxEval = evalResult.score;
            bestMove = { r, c };
          }
          alpha = Math.max(alpha, evalResult.score);
          if (beta <= alpha) break;
        }
      }
    }
    return { score: maxEval, move: bestMove };
  }

  let minEval = Infinity;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!board[r][c]) {
        board[r][c] = human;
        const evalResult = minimax(board, depth + 1, true, ai, human, alpha, beta);
        board[r][c] = null;
        if (evalResult.score < minEval) {
          minEval = evalResult.score;
          bestMove = { r, c };
        }
        beta = Math.min(beta, evalResult.score);
        if (beta <= alpha) break;
      }
    }
  }
  return { score: minEval, move: bestMove };
}

export function getRandomEmptyCell(board) {
  const emptyCells = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!board[r][c]) {
        emptyCells.push({ r, c });
      }
    }
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

export function getAiMove(board, difficulty, aiSymbol, humanSymbol) {
  if (difficulty === 'easy') {
    return getRandomEmptyCell(board);
  }

  if (difficulty === 'medium' && Math.random() < 0.5) {
    return getRandomEmptyCell(board);
  }

  return minimax(
    board.map((row) => [...row]),
    0,
    true,
    aiSymbol,
    humanSymbol,
    -Infinity,
    Infinity,
  ).move;
}

export function getStrikeLineCoordinates(line) {
  const offset = 0.5;

  if (line[0][0] === line[1][0] && line[1][0] === line[2][0]) {
    const row = line[0][0];
    return { start: [offset, row + offset], end: [2 + offset, row + offset] };
  }

  if (line[0][1] === line[1][1] && line[1][1] === line[2][1]) {
    const col = line[0][1];
    return { start: [col + offset, offset], end: [col + offset, 2 + offset] };
  }

  if (line[0][0] === 0 && line[0][1] === 0) {
    return { start: [offset, offset], end: [2 + offset, 2 + offset] };
  }

  return { start: [2 + offset, offset], end: [offset, 2 + offset] };
}
