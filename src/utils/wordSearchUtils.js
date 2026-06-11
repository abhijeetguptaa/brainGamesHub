// Utility to generate a word search grid with given words
// Words can be placed horizontally, vertically, diagonally, forward or reverse

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDirection() {
  // [rowDelta, colDelta]
  const directions = [
    [0, 1], // right
    [0, -1], // left
    [1, 0], // down
    [-1, 0], // up
    [1, 1], // down-right
    [-1, -1], // up-left
    [1, -1], // down-left
    [-1, 1], // up-right
  ];
  return directions[getRandomInt(0, directions.length - 1)];
}

function canPlace(grid, word, row, col, dr, dc) {
  const n = grid.length;
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    if (r < 0 || r >= n || c < 0 || c >= n) return false;
    if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word, row, col, dr, dc) {
  const positions = [];
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dr;
    const c = col + i * dc;
    grid[r][c] = word[i];
    positions.push([r, c]);
  }
  return positions;
}

export function generateWordSearch(gridSize, words) {
  // Create empty grid
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
  const placedWords = [];
  const wordList = [...words];

  for (let w = 0; w < wordList.length; w++) {
    const word = wordList[w];
    let placed = false;
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const drdc = getRandomDirection();
      const dr = drdc[0];
      const dc = drdc[1];
      // Compute valid start positions
      let maxRow = gridSize - 1,
        maxCol = gridSize - 1,
        minRow = 0,
        minCol = 0;
      if (dr === 1) ((minRow = 0), (maxRow = gridSize - word.length));
      if (dr === -1) ((minRow = word.length - 1), (maxRow = gridSize - 1));
      if (dc === 1) ((minCol = 0), (maxCol = gridSize - word.length));
      if (dc === -1) ((minCol = word.length - 1), (maxCol = gridSize - 1));
      const row = getRandomInt(minRow, maxRow);
      const col = getRandomInt(minCol, maxCol);
      if (canPlace(grid, word, row, col, dr, dc)) {
        const positions = placeWord(grid, word, row, col, dr, dc);
        placedWords.push({ word, positions });
        placed = true;
      }
    }
    if (!placed) {
      // If can't place, skip (rare)
    }
  }
  // Fill empty cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!grid[r][c]) {
        grid[r][c] = alphabet[getRandomInt(0, alphabet.length - 1)];
      }
    }
  }
  return { grid, placedWords };
}
