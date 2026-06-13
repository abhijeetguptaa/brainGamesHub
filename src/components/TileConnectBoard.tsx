import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import useTileConnectStore from '../store/useTileConnectStore';
import {
  findPath,
  generateBoard,
  hasPossibleMatches,
  findAPossibleMatch,
  shuffleBoardPartial,
} from '../utils/matchingAlgorithm';
import type { Board, Point } from '../utils/matchingAlgorithm';
import { playTapSound, playMatchBurstSound, playIncorrectSound, playSparklePop } from '../utils/soundUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { trackExerciseComplete } from '../utils/analytics';
import '../styles/TileConnect.scss';

const EMOJI_ICONS = [
  '🍎',
  '🍌',
  '🍇',
  '🍓',
  '🍒',
  '🍍',
  '🥝',
  '🍉',
  '🍑',
  '🍋',
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🦁',
  '🐯',
  '🚗',
  '🚲',
  '🚀',
  '🚁',
  '🚢',
  '🚂',
  '🚜',
  '🚓',
  '🚒',
  '🚑',
  '🍕',
  '🍔',
  '🍟',
  '🍦',
  '🍩',
  '🍪',
  '🍫',
  '🍬',
  '🍭',
  '🍳',
];

const TILE_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffd93d',
  '#6bcb77',
  '#4d96ff',
  '#ff9248',
  '#9b59b6',
  '#f06292',
];

export interface TileConnectBoardHandle {
  shuffle: () => void;
}

interface TileConnectBoardProps {
  onGridReady: () => void;
  onNoMatches: () => void;
}

const TileConnectBoard = forwardRef<TileConnectBoardHandle, TileConnectBoardProps>((props, ref) => {
  const { onGridReady, onNoMatches } = props;
  const { level, setLevelComplete, isLevelComplete } = useTileConnectStore();

  const [board, setBoard] = useState<Board>([]);
  const [selectedTile, setSelectedTile] = useState<Point | null>(null);
  const [path, setPath] = useState<Point[] | null>(null);
  const [lineColor, setLineColor] = useState<string>('#000');
  const [suggestedTiles, setSuggestedTiles] = useState<Point[]>([]);
  const [canClick, setCanClick] = useState(true);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [isShaking, setIsShaking] = useState(false);
  const [matchingPair, setMatchingPair] = useState<{ p1: Point; p2: Point } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionTimeoutRef = useRef<any>(null);

  const setupGame = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    let r, c;
    if (width > height) {
      // Landscape: Dynamically calculate columns based on aspect ratio to fill width
      r = Math.min(4 + Math.floor(level / 12), 5);
      // Try to fill width by using aspect ratio
      c = Math.floor(r * aspect * 1.2);
      c = Math.max(c, 4);
      c = Math.min(c, 12);
    } else {
      // Portrait: More rows to fill vertical space
      c = Math.min(4 + Math.floor(level / 12), 6);
      r = Math.floor((c / aspect) * 0.8);
      r = Math.max(r, 6);
      r = Math.min(r, 16);
    }

    // Ensure even number of total tiles for pairs
    if ((r * c) % 2 !== 0) c++;

    setRows(r);
    setCols(c);

    const tileTypes = Math.min(12 + level, EMOJI_ICONS.length);
    const newBoard = generateBoard(r, c, tileTypes);
    setBoard(newBoard);
    setSelectedTile(null);
    setPath(null);
    setSuggestedTiles([]);
    setCanClick(true);
    onGridReady();
  }, [level, onGridReady]);

  useEffect(() => {
    if (isLevelComplete) {
      setBoard([]);
    } else {
      setupGame();
    }
  }, [isLevelComplete, setupGame]);

  useImperativeHandle(ref, () => ({
    shuffle: () => {
      if (board.length === 0) return;
      const shuffled = shuffleBoardPartial(board, 0.5);
      setBoard(shuffled);
      playSparklePop();
      startSuggestionTimer();
    },
  }));

  const startSuggestionTimer = useCallback(() => {
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    setSuggestedTiles([]);

    if (board.length === 0) return;

    suggestionTimeoutRef.current = setTimeout(() => {
      const match = findAPossibleMatch(board);
      if (match) {
        setSuggestedTiles([match.p1, match.p2]);
      }
    }, 10000);
  }, [board]);

  useEffect(() => {
    startSuggestionTimer();
    return () => {
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    };
  }, [startSuggestionTimer]);

  const checkGameState = useCallback(
    (currentBoard: Board) => {
      let remaining = 0;
      for (let r = 1; r < currentBoard.length - 1; r++) {
        for (let c = 1; c < currentBoard[0].length - 1; c++) {
          if (currentBoard[r][c] !== 0) remaining++;
        }
      }

      if (remaining === 0) {
        trackExerciseComplete('TileConnect', level, level);
        setLevelComplete(true);
      } else if (!hasPossibleMatches(currentBoard)) {
        onNoMatches();
      }
    },
    [setLevelComplete, onNoMatches],
  );

  const handleTileClick = (r: number, c: number) => {
    if (!canClick || !board[r] || board[r][c] === 0) return;

    startSuggestionTimer();

    if (!selectedTile) {
      setSelectedTile({ x: r, y: c });
      playTapSound();
    } else {
      if (selectedTile.x === r && selectedTile.y === c) {
        setSelectedTile(null);
        return;
      }

      const foundPath = findPath(board, selectedTile, { x: r, y: c });
      if (foundPath) {
        const type = board[r][c];
        setLineColor(TILE_COLORS[(type - 1) % TILE_COLORS.length]);
        setMatchingPair({ p1: selectedTile, p2: { x: r, y: c } });
        setPath(foundPath);
        setCanClick(false);
        playMatchBurstSound();
        playSparklePop();

        setTimeout(() => {
          const newBoard = board.map((row) => [...row]);
          newBoard[selectedTile.x][selectedTile.y] = 0;
          newBoard[r][c] = 0;

          setBoard(newBoard);
          setPath(null);
          setMatchingPair(null);
          setSelectedTile(null);
          setCanClick(true);
          checkGameState(newBoard);
        }, 400);
      } else {
        playIncorrectSound();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setSelectedTile(null);
      }
    }
  };

  const getPathPoints = () => {
    if (!path || !gridRef.current) return '';

    const points: string[] = [];
    const gridRect = gridRef.current.getBoundingClientRect();

    path.forEach((p) => {
      const cell = gridRef.current?.querySelector(`[data-row="${p.x}"][data-col="${p.y}"]`);
      if (cell) {
        const rect = cell.getBoundingClientRect();
        const x = rect.left - gridRect.left + rect.width / 2;
        const y = rect.top - gridRect.top + rect.height / 2;
        points.push(`${x},${y}`);
      }
    });

    return points.join(' ');
  };

  return (
    <div
      className="tile-connect-board-container"
      ref={containerRef}
    >
      <motion.div
        ref={gridRef}
        animate={
          isShaking
            ? {
                x: [-12, 12, -12, 12, 0],
                rotate: [-1.2, 1.2, -1.2, 1.2, 0],
              }
            : { x: 0, rotate: 0 }
        }
        transition={{ duration: 0.4 }}
        className="tile-connect-grid"
        style={
          {
            '--rows': rows,
            '--cols': cols,
          } as React.CSSProperties
        }
      >
        {board.map((row, r) =>
          row.map((type, c) => {
            const isRim = r === 0 || r === rows + 1 || c === 0 || c === cols + 1;
            return (
              <div
                key={`${r}-${c}`}
                data-row={r}
                data-col={c}
                className={`tile-cell ${type === 0 ? 'empty' : 'active'}`}
                onClick={() => !isRim && handleTileClick(r, c)}
              >
                <AnimatePresence>
                  {type !== 0 && !isRim && (
                    <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="tile-inner-card"
                    style={
                      {
                        '--border-color':
                          (selectedTile?.x === r && selectedTile?.y === c) ||
                          (matchingPair?.p1.x === r && matchingPair?.p1.y === c) ||
                          (matchingPair?.p2.x === r && matchingPair?.p2.y === c)
                            ? '#000'
                            : TILE_COLORS[(type - 1) % TILE_COLORS.length],
                        zIndex: selectedTile?.x === r && selectedTile?.y === c ? 10 : 1,
                        transform: selectedTile?.x === r && selectedTile?.y === c ? 'scale(1.1) translateY(-5px)' : 'scale(1)',
                        boxShadow: selectedTile?.x === r && selectedTile?.y === c ? '0 10px 20px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      } as React.CSSProperties
                    }
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{
                          scale: selectedTile?.x === r && selectedTile?.y === c ? 1.3 : 1,
                          rotate: suggestedTiles.some((p) => p.x === r && p.y === c)
                            ? [0, -10, 10, -10, 0]
                            : 0,
                        }}
                        exit={{ scale: 0 }}
                        transition={{
                          scale: { type: 'spring', stiffness: 300, damping: 20 },
                          rotate: suggestedTiles.some((p) => p.x === r && p.y === c)
                            ? { repeat: Infinity, duration: 0.6, ease: 'easeInOut' }
                            : { duration: 0.2 },
                        }}
                        className="tile-emoji"
                      >
                        {EMOJI_ICONS[type - 1]}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }),
        )}

        <div className="tile-connect-svg-layer">
          <svg className="tile-connect-svg">
            {path && (
              <g>
                <motion.polyline
                  points={getPathPoints()}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.polyline
                  points={getPathPoints()}
                  fill="none"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </g>
            )}
          </svg>
        </div>
      </motion.div>
    </div>
  );
});

export default TileConnectBoard;
