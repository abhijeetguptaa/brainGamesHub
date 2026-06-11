export interface Point {
  x: number;
  y: number;
}

export type Board = number[][];

export const canConnectDirectly = (board: Board, p1: Point, p2: Point): boolean => {
  if (p1.x !== p2.x && p1.y !== p2.y) return false;

  if (p1.x === p2.x) {
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    for (let y = minY + 1; y < maxY; y++) {
      if (board[p1.x][y] !== 0) return false;
    }
  } else {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    for (let x = minX + 1; x < maxX; x++) {
      if (board[x][p1.y] !== 0) return false;
    }
  }
  return true;
};

export const canConnectOneTurn = (board: Board, p1: Point, p2: Point): Point | null => {
  const corner1 = { x: p1.x, y: p2.y };
  const corner2 = { x: p2.x, y: p1.y };

  if (board[corner1.x][corner1.y] === 0) {
    if (canConnectDirectly(board, p1, corner1) && canConnectDirectly(board, corner1, p2)) {
      return corner1;
    }
  }

  if (board[corner2.x][corner2.y] === 0) {
    if (canConnectDirectly(board, p1, corner2) && canConnectDirectly(board, corner2, p2)) {
      return corner2;
    }
  }

  return null;
};

export const canConnectTwoTurns = (board: Board, p1: Point, p2: Point): Point[] | null => {
  const rows = board.length;
  const cols = board[0].length;

  // Scan horizontally
  for (let x = 0; x < rows; x++) {
    const corner1 = { x, y: p1.y };
    const corner2 = { x, y: p2.y };
    if (board[corner1.x][corner1.y] === 0 && board[corner2.x][corner2.y] === 0) {
      if (
        canConnectDirectly(board, p1, corner1) &&
        canConnectDirectly(board, corner1, corner2) &&
        canConnectDirectly(board, corner2, p2)
      ) {
        return [corner1, corner2];
      }
    }
  }

  // Scan vertically
  for (let y = 0; y < cols; y++) {
    const corner1 = { x: p1.x, y };
    const corner2 = { x: p2.x, y };
    if (board[corner1.x][corner1.y] === 0 && board[corner2.x][corner2.y] === 0) {
      if (
        canConnectDirectly(board, p1, corner1) &&
        canConnectDirectly(board, corner1, corner2) &&
        canConnectDirectly(board, corner2, p2)
      ) {
        return [corner1, corner2];
      }
    }
  }

  return null;
};

export const findPath = (board: Board, p1: Point, p2: Point): Point[] | null => {
  if (board[p1.x][p1.y] !== board[p2.x][p2.y]) return null;
  if (p1.x === p2.x && p1.y === p2.y) return null;

  // Direct
  if (canConnectDirectly(board, p1, p2)) {
    return [p1, p2];
  }

  // One turn
  const corner = canConnectOneTurn(board, p1, p2);
  if (corner) {
    return [p1, corner, p2];
  }

  // Two turns
  const corners = canConnectTwoTurns(board, p1, p2);
  if (corners) {
    return [p1, corners[0], corners[1], p2];
  }

  return null;
};

export const generateBoard = (rows: number, cols: number, tileTypes: number): Board => {
  let finalBoard: Board;
  let attempts = 0;
  do {
    finalBoard = generateBoardInternal(rows, cols, tileTypes);
    attempts++;
  } while (!hasPossibleMatches(finalBoard) && attempts < 10);

  return finalBoard;
};

const generateBoardInternal = (rows: number, cols: number, tileTypes: number): Board => {
  const totalTiles = rows * cols;
  if (totalTiles % 2 !== 0) throw new Error('Total tiles must be even');

  const board: Board = Array.from({ length: rows + 2 }, () => Array(cols + 2).fill(0));
  const spots: Point[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      spots.push({ x: r, y: c });
    }
  }

  // Shuffle spots
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spots[i], spots[j]] = [spots[j], spots[i]];
  }

  const occupied = new Set<string>();
  const tilesToPlace: number[] = [];
  for (let i = 0; i < totalTiles / 2; i++) {
    tilesToPlace.push((i % tileTypes) + 1);
  }

  // Shuffle tile types so we don't always use the same types for easy pairs
  for (let i = tilesToPlace.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tilesToPlace[i], tilesToPlace[j]] = [tilesToPlace[j], tilesToPlace[i]];
  }

  let tilesIdx = 0;
  let tilesCount = 0;
  const targetEasyTiles = Math.floor(totalTiles * 0.25);

  // Phase 1: Place adjacent pairs for at least 25% of tiles
  for (let i = 0; i < spots.length && tilesCount < targetEasyTiles; i++) {
    const p1 = spots[i];
    if (occupied.has(`${p1.x},${p1.y}`)) continue;

    const neighbors = [
      { x: p1.x + 1, y: p1.y },
      { x: p1.x - 1, y: p1.y },
      { x: p1.x, y: p1.y + 1 },
      { x: p1.x, y: p1.y - 1 },
    ].filter(
      (n) => n.x >= 1 && n.x <= rows && n.y >= 1 && n.y <= cols && !occupied.has(`${n.x},${n.y}`),
    );

    if (neighbors.length > 0) {
      const p2 = neighbors[Math.floor(Math.random() * neighbors.length)];
      const type = tilesToPlace[tilesIdx++];
      board[p1.x][p1.y] = type;
      board[p2.x][p2.y] = type;
      occupied.add(`${p1.x},${p1.y}`);
      occupied.add(`${p2.x},${p2.y}`);
      tilesCount += 2;
    }
  }

  // Phase 2: Fill the rest randomly with remaining tiles
  const remainingSpots = spots.filter((p) => !occupied.has(`${p.x},${p.y}`));
  const remainingTiles: number[] = [];
  while (tilesIdx < tilesToPlace.length) {
    const type = tilesToPlace[tilesIdx++];
    remainingTiles.push(type, type);
  }

  // Shuffle remaining tiles
  for (let i = remainingTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingTiles[i], remainingTiles[j]] = [remainingTiles[j], remainingTiles[i]];
  }

  remainingSpots.forEach((p, idx) => {
    board[p.x][p.y] = remainingTiles[idx];
  });

  return board;
};

export const hasPossibleMatches = (board: Board): boolean => {
  const rows = board.length;
  if (rows === 0) return false;
  const cols = board[0].length;
  const tiles: { p: Point; type: number }[] = [];

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (board[r][c] !== 0) {
        tiles.push({ p: { x: r, y: c }, type: board[r][c] });
      }
    }
  }

  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i].type === tiles[j].type) {
        if (findPath(board, tiles[i].p, tiles[j].p)) {
          return true;
        }
      }
    }
  }

  return false;
};

export const findAPossibleMatch = (board: Board): { p1: Point; p2: Point } | null => {
  const rows = board.length;
  if (rows === 0) return null;
  const cols = board[0].length;
  const tiles: { p: Point; type: number }[] = [];

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (board[r][c] !== 0) {
        tiles.push({ p: { x: r, y: c }, type: board[r][c] });
      }
    }
  }

  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i].type === tiles[j].type) {
        if (findPath(board, tiles[i].p, tiles[j].p)) {
          return { p1: tiles[i].p, p2: tiles[j].p };
        }
      }
    }
  }

  return null;
};

export const shuffleBoardPartial = (board: Board, percentage: number = 0.5): Board => {
  const rows = board.length;
  if (rows === 0) return board;
  const cols = board[0].length;
  const occupiedSpots: Point[] = [];

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (board[r][c] !== 0) {
        occupiedSpots.push({ x: r, y: c });
      }
    }
  }

  if (occupiedSpots.length < 2) return board;

  let newBoard: Board = board;
  let attempts = 0;
  const maxAttempts = 100;

  // We want to ensure that after shuffle, there's at least one possible match
  // While only shuffling a subset of tiles (50%)
  while (attempts < maxAttempts) {
    const tempBoard: Board = board.map((row) => [...row]);

    // Shuffle spots to pick random ones to shuffle
    const shuffledSpots = [...occupiedSpots];
    for (let i = shuffledSpots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSpots[i], shuffledSpots[j]] = [shuffledSpots[j], shuffledSpots[i]];
    }

    const countToShuffle = Math.max(2, Math.floor(occupiedSpots.length * percentage));
    const spotsToShuffle = shuffledSpots.slice(0, countToShuffle);
    const tiles: number[] = spotsToShuffle.map((p) => board[p.x][p.y]);

    // Shuffle the tile values
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    spotsToShuffle.forEach((p, index) => {
      tempBoard[p.x][p.y] = tiles[index];
    });

    if (hasPossibleMatches(tempBoard)) {
      newBoard = tempBoard;
      break;
    }

    attempts++;

    // Fallback: If we can't find a match by shuffling only 50%,
    // we might need to shuffle more or eventually just do a full shuffle
    if (attempts > maxAttempts / 2) {
      percentage = Math.min(1.0, percentage + 0.05);
    }
  }

  return newBoard;
};
