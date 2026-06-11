import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ITEMS,
  MATCH_THRESHOLD,
  LEVELS,
  SmartMatchItem,
  SpecialType,
} from '../constants/smartMatchConstants';
import {
  playTapSound,
  playCorrectSound,
  playIncorrectSound,
  playTileDropSound,
  playRowClearSound,
  playBombSound,
  playColorBlastSound,
  playMatchBurstSound,
} from '../utils/soundUtils';
import { useSparkleBurst } from '../hooks/useSparkleBurst';
import SuccessModal from './SuccessModal';
import LooseModal from './LooseModal';
import SmartMatchBoard from './SmartMatchBoard';
import useUnlockModalStore from '../store/useUnlockModalStore';
import '../styles/SmartMatch.scss';
import { useNavigate, useLocation } from 'react-router-dom';
import { setScreen, trackExerciseComplete } from '../utils/analytics';
import { debounce } from '../utils/utils';

const ITEM_COLORS: Record<string, string> = {
  apple: '#FF4D4F',
  donut: '#FFB84D',
  star: '#FFD54A',
  cherry: '#E63946',
  leaf: '#43AA8B',
  lollipop: '#9B5DE5',
  flower: '#F15BB5',
  cookie: '#8D6E63',
  lantern: '#F8961E',
  berry: '#577590',
};

const getItemColor = (type: string) => ITEM_COLORS[type] || '#FFFFFF';

const SmartMatch: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();
  const { openModal } = useUnlockModalStore();

  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = debounce(() => {
      const landscape = window.innerWidth > window.innerHeight;
      if (landscape !== isLandscape) {
        setIsLandscape(landscape);
        setGameId((prev) => prev + 1);
      }
    }, 200);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLandscape]);

  const ROWS = isLandscape ? 7 : 9;
  const COLS = isLandscape ? 9 : 7;

  const [grid, setGrid] = useState<(SmartMatchItem | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [collectedItems, setCollectedItems] = useState<{ [key: string]: number }>({});
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = LEVELS[levelIndex];
  const currentTargetScore = currentLevel.targetScore;
  const requiredTypes = useMemo(
    () => (currentLevel.collectItems ? Object.keys(currentLevel.collectItems) : []),
    [currentLevel],
  );
  const requiredTypeSet = useMemo(() => new Set(requiredTypes), [requiredTypes]);
  const weightedPool = useMemo(() => {
    const poolSize = Math.min(6 + Math.floor(levelIndex / 5), ITEMS.length);
    const availableItems = [...ITEMS.slice(0, poolSize)];

    requiredTypes.forEach((type) => {
      if (!availableItems.find((i) => i.type === type)) {
        const itemDef = ITEMS.find((i) => i.type === type);
        if (itemDef) availableItems.push(itemDef);
      }
    });

    const pool: typeof ITEMS = [];
    availableItems.forEach((item) => {
      const weight = requiredTypeSet.has(item.type) ? 3 : 1;
      for (let i = 0; i < weight; i++) {
        pool.push(item);
      }
    });

    return pool;
  }, [levelIndex, requiredTypes, requiredTypeSet]);

  useEffect(() => {
    setScreen('SmartMatchGame');
  }, []);

  const [movesLeft, setMovesLeft] = useState(currentLevel.moves);

  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const [gameId, setGameId] = useState(0); // For resetting
  const [matchingItems, setMatchingItems] = useState<string[]>([]);
  const [hintItems, setHintItems] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{
    r: number;
    c: number;
    x: number;
    y: number;
  } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const cellRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Skip Level with Modal
  const handleSkipLevel = () => {
    if (isProcessing) return;

    openModal(t('home.subjects.smartMatch.skipLevel'), 100, () => {
      if (levelIndex < LEVELS.length - 1) {
        setLevelIndex((prev) => prev + 1);
      } else {
        setLevelIndex(0);
      }
      setGameId((prev) => prev + 1);
    });
  };

  // Generate a random item with weighted probability for required items
  const getRandomItem = useCallback((): SmartMatchItem => {
    const item = weightedPool[Math.floor(Math.random() * weightedPool.length)];

    return {
      ...item,
      color: getItemColor(item.type),
      id: Math.random().toString(36).substr(2, 9),
    };
  }, [weightedPool]);

  // Load state from local storage
  useEffect(() => {
    const savedState = localStorage.getItem('smartMatchState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Dimension check: ensure saved grid matches current orientation
        const savedRows = parsed.grid?.length || 0;
        const savedCols = parsed.grid?.[0]?.length || 0;

        if (savedRows === ROWS && savedCols === COLS) {
          // Sanitize grid types to ensure consistency
          const sanitizedGrid = parsed.grid.map((row: any[]) =>
            row.map((item: any) => (item ? { ...item, type: item.type.trim() } : null)),
          );
          setGrid(sanitizedGrid);
          setScore(parsed.score);
          setCollectedItems(parsed.collectedItems);
          setLevelIndex(parsed.levelIndex);
          setMovesLeft(parsed.movesLeft);
        } else {
          console.warn('Saved state dimensions mismatch current orientation. Starting fresh.');
          // Restore levelIndex even if dimensions mismatch
          if (parsed.levelIndex !== undefined) {
            setLevelIndex(parsed.levelIndex);
          }
          localStorage.removeItem('smartMatchState');
        }
      } catch (e) {
        console.error('Failed to load SmartMatch state', e);
      }
    }
    setIsLoaded(true);
  }, [ROWS, COLS]);

  // Save state to local storage
  useEffect(() => {
    if (!isLoaded || showSuccess || showFailure || !grid || grid.length === 0) return;

    const stateToSave = {
      grid,
      score,
      collectedItems,
      levelIndex,
      movesLeft,
    };
    localStorage.setItem('smartMatchState', JSON.stringify(stateToSave));
  }, [grid, score, collectedItems, levelIndex, movesLeft, isLoaded, showSuccess, showFailure]);

  const generateCleanGrid = useCallback(() => {
    let newGrid: (SmartMatchItem | null)[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => null),
    );

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let item;
        do {
          item = getRandomItem();
        } while (
          (r >= 2 &&
            newGrid[r - 1][c]?.type === item.type &&
            newGrid[r - 2][c]?.type === item.type) ||
          (c >= 2 && newGrid[r][c - 1]?.type === item.type && newGrid[r][c - 2]?.type === item.type)
        );
        newGrid[r][c] = item;
      }
    }
    return newGrid;
  }, [getRandomItem, ROWS, COLS]);

  // Initialize grid (only if not loaded from storage)
  const initGrid = useCallback(() => {
    if (localStorage.getItem('smartMatchState') && grid.length > 0 && !gameId) return;

    let newGrid: (SmartMatchItem | null)[][] = [];
    let isValid = false;
    let attempts = 0;

    while (!isValid && attempts < 24) {
      newGrid = generateCleanGrid();
      if (findPossibleMoves(newGrid).length > 0) {
        isValid = true;
      }
      attempts++;
    }

    setGrid(newGrid);
    setScore(0);
    setCollectedItems({});
    setMovesLeft(currentLevel.moves);
    setShowSuccess(false);
    setShowFailure(false);
    setMatchingItems([]);
    setHintItems([]);
    setSelectedCell(null);
    setDragState(null);
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
  }, [currentLevel, gameId, grid.length, generateCleanGrid]);

  useEffect(() => {
    if (isLoaded) {
      initGrid();
    }
  }, [initGrid, gameId, isLoaded]);

  // Match Detection Logic
  const findMatches = useCallback(
    (currentGrid: (SmartMatchItem | null)[][]) => {
      const matches: { r: number; c: number }[] = [];
      const groups: { items: { r: number; c: number }[]; type: string }[] = [];

      // Horizontal
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c <= COLS - MATCH_THRESHOLD; c++) {
          const type = currentGrid[r][c]?.type;
          if (!type) continue;
          let matchLength = 1;
          while (c + matchLength < COLS && currentGrid[r][c + matchLength]?.type === type) {
            matchLength++;
          }
          if (matchLength >= MATCH_THRESHOLD) {
            const groupItems = [];
            for (let i = 0; i < matchLength; i++) {
              matches.push({ r, c: c + i });
              groupItems.push({ r, c: c + i });
            }
            let gType = '3-match';
            if (matchLength === 4) gType = '4-match-horizontal';
            if (matchLength >= 5) gType = '5-match';
            groups.push({ items: groupItems, type: gType });
            c += matchLength - 1;
          }
        }
      }

      // Vertical
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r <= ROWS - MATCH_THRESHOLD; r++) {
          const type = currentGrid[r][c]?.type;
          if (!type) continue;
          let matchLength = 1;
          while (r + matchLength < ROWS && currentGrid[r + matchLength][c]?.type === type) {
            matchLength++;
          }
          if (matchLength >= MATCH_THRESHOLD) {
            const groupItems = [];
            for (let i = 0; i < matchLength; i++) {
              matches.push({ r: r + i, c });
              groupItems.push({ r: r + i, c });
            }
            let gType = '3-match';
            if (matchLength === 4) gType = '4-match-vertical';
            if (matchLength >= 5) gType = '5-match';
            groups.push({ items: groupItems, type: gType });
            r += matchLength - 1;
          }
        }
      }

      return { matches, groups };
    },
    [ROWS, COLS],
  );

  // Find possible moves for hints
  const findPossibleMoves = useCallback(
    (currentGrid: (SmartMatchItem | null)[][]) => {
      if (!currentGrid || currentGrid.length === 0) return [];

      // Ensure grid is full before calculating moves
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (!currentGrid[r][c]) return [];
        }
      }

      // Create a temporary working copy for simulation
      const simulationGrid = currentGrid.map((row) => [...row]);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const item = simulationGrid[r][c];
          if (!item) continue;

          // Try swap with right
          if (c < COLS - 1) {
            const neighbor = simulationGrid[r][c + 1];
            if (neighbor) {
              simulationGrid[r][c + 1] = item;
              simulationGrid[r][c] = neighbor;
              const { matches } = findMatches(simulationGrid);
              // Swap back immediately
              simulationGrid[r][c] = item;
              simulationGrid[r][c + 1] = neighbor;

              // Only return as a hint if the match actually involves one of the swapped items
              if (
                matches.length > 0 &&
                matches.some((m) => (m.r === r && m.c === c) || (m.r === r && m.c === c + 1))
              ) {
                const hintKeys = new Set([`${r}-${c}`, `${r}-${c + 1}`]);
                matches.forEach((m) => hintKeys.add(`${m.r}-${m.c}`));
                return Array.from(hintKeys);
              }
            }
          }
          // Try swap with down
          if (r < ROWS - 1) {
            const neighbor = simulationGrid[r + 1][c];
            if (neighbor) {
              simulationGrid[r + 1][c] = item;
              simulationGrid[r][c] = neighbor;
              const { matches } = findMatches(simulationGrid);
              // Swap back immediately
              simulationGrid[r][c] = item;
              simulationGrid[r + 1][c] = neighbor;

              // Only return as a hint if the match actually involves one of the swapped items
              if (
                matches.length > 0 &&
                matches.some((m) => (m.r === r && m.c === c) || (m.r === r + 1 && m.c === c))
              ) {
                const hintKeys = new Set([`${r}-${c}`, `${r + 1}-${c}`]);
                matches.forEach((m) => hintKeys.add(`${m.r}-${m.c}`));
                return Array.from(hintKeys);
              }
            }
          }
        }
      }
      return [];
    },
    [ROWS, COLS, findMatches],
  );

  const startHintTimer = useCallback(() => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    if (isProcessing || showSuccess || showFailure) return;

    hintTimeoutRef.current = setTimeout(() => {
      const moves = findPossibleMoves(grid);
      setHintItems(moves);
    }, 5000);
  }, [grid, isProcessing, showSuccess, showFailure, findPossibleMoves]);

  const waitForNextPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

  const waitForPaintCycles = async (count = 1) => {
    for (let i = 0; i < count; i++) {
      await waitForNextPaint();
    }
  };

  useEffect(() => {
    startHintTimer();
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [grid, startHintTimer]);

  const resolveSpecialEffects = useCallback(
    (gridToProcess: (SmartMatchItem | null)[][], matchedPoints: { r: number; c: number }[]) => {
      const pointsToClear = [...matchedPoints];
      const processedPoints = new Set(matchedPoints.map((p) => `${p.r}-${p.c}`));
      let queue = [...matchedPoints];
      let isBoardClearTriggered = false;

      while (queue.length > 0) {
        const { r, c } = queue.shift()!;
        const item = gridToProcess[r][c];

        if (item?.special) {
          let extraPoints: { r: number; c: number }[] = [];
          if (item.special === 'row') {
            playRowClearSound();
            for (let i = 0; i < COLS; i++) extraPoints.push({ r, c: i });
          } else if (item.special === 'column') {
            playRowClearSound();
            for (let i = 0; i < ROWS; i++) extraPoints.push({ r: i, c });
          } else if (item.special === 'bomb') {
            playBombSound();
            for (let i = r - 1; i <= r + 1; i++) {
              for (let j = c - 1; j <= c + 1; j++) {
                if (i >= 0 && i < ROWS && j >= 0 && j < COLS) {
                  extraPoints.push({ r: i, c: j });
                }
              }
            }
          } else if (item.special === 'boardClear') {
            playColorBlastSound();
            isBoardClearTriggered = true;
            for (let i = 0; i < ROWS; i++) {
              for (let j = 0; j < COLS; j++) {
                extraPoints.push({ r: i, c: j });
              }
            }
          }
          // colorBlast logic usually happens on swap, but if matched:
          else if (item.special === 'colorBlast') {
            playColorBlastSound();
            for (let i = 0; i < ROWS; i++) {
              for (let j = 0; j < COLS; j++) {
                if (gridToProcess[i][j]?.type === item.type) {
                  extraPoints.push({ r: i, c: j });
                }
              }
            }
          }

          extraPoints.forEach((p) => {
            const key = `${p.r}-${p.c}`;
            if (!processedPoints.has(key)) {
              processedPoints.add(key);
              pointsToClear.push(p);
              queue.push(p);
            }
          });
        }
      }
      return { pointsToClear, isBoardClearTriggered };
    },
    [COLS, ROWS],
  );

  const processGrid = useCallback(
    async (
      currentGrid: (SmartMatchItem | null)[][],
      lastSwapPoint?: { r: number; c: number },
      forcedMovesLeft?: number,
    ) => {
      setIsProcessing(true);
      let workingGrid = [...currentGrid.map((row) => [...row])];
      let hasMoreMatches = true;
      let totalScoreGain = 0;
      const itemsGained: { [key: string]: number } = {};

      while (hasMoreMatches) {
        const { matches, groups } = findMatches(workingGrid);
        if (matches.length === 0) {
          hasMoreMatches = false;
          break;
        }

        // Play match sound
        playMatchBurstSound();

        // Clear matches and resolve specials
        const { pointsToClear, isBoardClearTriggered } = resolveSpecialEffects(
          workingGrid,
          matches,
        );
        const uniquePointsToClear = Array.from(
          new Set(pointsToClear.map((m) => `${m.r}-${m.c}`)),
        ).map((s) => {
          const [r, c] = s.split('-').map(Number);
          return { r, c };
        });

        // Track item types
        uniquePointsToClear.forEach(({ r, c }) => {
          const item = workingGrid[r][c];
          if (item) {
            const type = item.type.trim();
            itemsGained[type] = (itemsGained[type] || 0) + 1;
          }
        });

        // Special creations (skip if board clear triggered)
        const specialsToPlace: {
          r: number;
          c: number;
          type: string;
          color: string;
          special: SpecialType;
        }[] = [];
        if (!isBoardClearTriggered) {
          groups.forEach((g) => {
            if (g.type !== '3-match') {
              // Find center point or point closest to last swap
              let triggerPoint = g.items[1]; // default middle
              if (lastSwapPoint) {
                const nearest = g.items.find(
                  (p) => p.r === lastSwapPoint.r && p.c === lastSwapPoint.c,
                );
                if (nearest) triggerPoint = nearest;
              }

              let specialType: SpecialType = 'row';
              if (g.type === '4-match-horizontal')
                specialType = 'column'; // Clears vertical column
              else if (g.type === '4-match-vertical') specialType = 'row';
              else if (g.type === '5-match') specialType = 'colorBlast';
              else if (g.items.length >= 6) specialType = 'boardClear';

              const itemTemplate = workingGrid[triggerPoint.r][triggerPoint.c] || getRandomItem();
              specialsToPlace.push({
                ...triggerPoint,
                type: itemTemplate.type,
                color: itemTemplate.color || getItemColor(itemTemplate.type),
                special: specialType,
              });
            }
          });
        }

        // Trigger pop animation and sparkles
        const matchKeys = uniquePointsToClear.map((m) => `${m.r}-${m.c}`);
        setMatchingItems(matchKeys);

        uniquePointsToClear.forEach(({ r, c }) => {
          const cell = cellRefs.current[`${r}-${c}`];
          if (cell) {
            const rect = cell.getBoundingClientRect();
            triggerSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
              count: 16,
              range: 150,
            });
          }
        });

        totalScoreGain += uniquePointsToClear.length;
        await waitForPaintCycles(1); // Small wait to ensure matchingItems state is applied
        await new Promise((resolve) => setTimeout(resolve, 400)); // Wait for pop animation (0.4s in SCSS)

        uniquePointsToClear.forEach(({ r, c }) => {
          workingGrid[r][c] = null;
        });

        if (isBoardClearTriggered) {
          // RESET GRID logic - ensure new grid is playable
          let isValid = false;
          let attempts = 0;
          while (!isValid && attempts < 24) {
            workingGrid = generateCleanGrid();
            if (findPossibleMoves(workingGrid).length > 0) {
              isValid = true;
            }
            attempts++;
          }
          setGrid([...workingGrid]);
          setMatchingItems([]); // Clear matches after board reset
          hasMoreMatches = false; // Stop chain after board reset
          await waitForPaintCycles(2);
        } else {
          // Place specials
          specialsToPlace.forEach((s) => {
            const itemDef = ITEMS.find((i) => i.type === s.type) || ITEMS[0];
            workingGrid[s.r][s.c] = {
              ...itemDef,
              id: `special-${Math.random()}`,
              color: s.color || getItemColor(s.type),
              special: s.special,
            };
          });

          setMatchingItems([]); // Clear matches before showing dropped grid
          setGrid([...workingGrid]);
          await waitForNextPaint();

          // Drop items
          for (let c = 0; c < COLS; c++) {
            let emptySpot = ROWS - 1;
            for (let r = ROWS - 1; r >= 0; r--) {
              if (workingGrid[r][c] !== null) {
                if (emptySpot !== r) {
                  workingGrid[emptySpot][c] = workingGrid[r][c];
                  workingGrid[r][c] = null;
                }
                emptySpot--;
              }
            }
          }

          setGrid([...workingGrid]);
          playTileDropSound();
          await waitForNextPaint();

          // Fill new items
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (workingGrid[r][c] === null) {
                let item = getRandomItem();
                // Reduce possibility of winning combinations (chain reactions) to 90%
                // by actively preventing a match 10% of the time
                if (Math.random() < 0.15) {
                  let attempts = 0;
                  while (
                    attempts < 10 &&
                    ((r >= 2 &&
                      workingGrid[r - 1][c]?.type === item.type &&
                      workingGrid[r - 2][c]?.type === item.type) ||
                      (r < ROWS - 2 &&
                        workingGrid[r + 1][c]?.type === item.type &&
                        workingGrid[r + 2][c]?.type === item.type) ||
                      (c >= 2 &&
                        workingGrid[r][c - 1]?.type === item.type &&
                        workingGrid[r][c - 2]?.type === item.type) ||
                      (c < COLS - 2 &&
                        workingGrid[r][c + 1]?.type === item.type &&
                        workingGrid[r][c + 2]?.type === item.type) ||
                      (r >= 1 &&
                        r < ROWS - 1 &&
                        workingGrid[r - 1][c]?.type === item.type &&
                        workingGrid[r + 1][c]?.type === item.type) ||
                      (c >= 1 &&
                        c < COLS - 1 &&
                        workingGrid[r][c - 1]?.type === item.type &&
                        workingGrid[r][c + 1]?.type === item.type))
                  ) {
                    item = getRandomItem();
                    attempts++;
                  }
                }
                workingGrid[r][c] = item;
              }
            }
          }

          setGrid([...workingGrid]);
          playTileDropSound();
          await waitForNextPaint();
        }
      }

      setCollectedItems((prev) => {
        const next = { ...prev };
        Object.keys(itemsGained).forEach((type) => {
          next[type] = (next[type] || 0) + itemsGained[type];
        });

        const finalMovesLeft = forcedMovesLeft !== undefined ? forcedMovesLeft : movesLeft;

        setScore((prevScore) => {
          const newScore = prevScore + totalScoreGain;

          // Check success
          const scoreMet = newScore >= currentTargetScore;
          const itemsMet = currentLevel.collectItems
            ? Object.entries(currentLevel.collectItems).every(
                ([type, target]) => (next[type] || 0) >= target,
              )
            : true;

          if (scoreMet && itemsMet && !showSuccess) {
            setShowSuccess(true);
            playCorrectSound();
          } else {
            // Check if game is lost
            if (finalMovesLeft <= 0) {
              setFailureMessage(t('home.subjects.smartMatch.failureMsg'));
              setShowFailure(true);
              playIncorrectSound();
            } else {
              // Check for stalemate (no valid moves in grid)
              const possibleMoves = findPossibleMoves(workingGrid);

              if (possibleMoves.length === 0) {
                setFailureMessage(t('home.subjects.smartMatch.noMovesLeft'));
                setShowFailure(true);
                playIncorrectSound();
              }
            }
          }
          return newScore;
        });

        return next;
      });
      setIsProcessing(false);
    },
    [
      currentLevel,
      currentTargetScore,
      findMatches,
      findPossibleMoves,
      getRandomItem,
      movesLeft,
      showFailure,
      showSuccess,
      t,
      resolveSpecialEffects,
      generateCleanGrid,
    ],
  );

  // Auto-process matches that appear outside of a swap (e.g., board load, shuffle, reward)
  useEffect(() => {
    if (!isProcessing && isLoaded && grid.length > 0) {
      const { matches } = findMatches(grid);
      if (matches.length > 0) {
        processGrid(grid);
      }
    }
  }, [grid, isProcessing, isLoaded, findMatches, processGrid]);
  const swapItems = useCallback(
    async (r1: number, c1: number, r2: number, c2: number) => {
      if (isProcessing || movesLeft <= 0) return;

      // Swap
      let newGrid = [...grid.map((row) => [...row])];
      const temp = newGrid[r1][c1];
      newGrid[r1][c1] = newGrid[r2][c2];
      newGrid[r2][c2] = temp;

      // Check if swap creates match
      const { matches } = findMatches(newGrid);
      if (matches.length > 0) {
        setGrid(newGrid);
        setSelectedCell(null);
        const nextMoves = Math.max(0, movesLeft - 1);
        setMovesLeft(nextMoves);
        await processGrid(newGrid, { r: r1, c: c1 }, nextMoves);
      } else {
        // Swap back (visual feedback)
        setGrid(newGrid);
        playTapSound(); // Use a different sound maybe?
        requestAnimationFrame(() => {
          const backGrid = [...newGrid.map((row) => [...row])];
          const t = backGrid[r1][c1];
          backGrid[r1][c1] = backGrid[r2][c2];
          backGrid[r2][c2] = t;
          setGrid(backGrid);
          setSelectedCell(null);
        });
      }
    },
    [grid, isProcessing, movesLeft, findMatches, processGrid],
  );

  const handleCellClick = useCallback(
    async (r: number, c: number) => {
      setHintItems([]);
      startHintTimer();
      if (isProcessing || movesLeft <= 0 || showSuccess || showFailure) return;
      playTapSound();

      if (!selectedCell) {
        setSelectedCell({ r, c });
      } else {
        const dr = Math.abs(r - selectedCell.r);
        const dc = Math.abs(c - selectedCell.c);

        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
          await swapItems(selectedCell.r, selectedCell.c, r, c);
        } else {
          setSelectedCell({ r, c });
        }
      }
    },
    [isProcessing, movesLeft, showSuccess, showFailure, selectedCell, swapItems, startHintTimer],
  );

  const handlePanEnd = useCallback(
    (r: number, c: number, info: any) => {
      setHintItems([]);
      startHintTimer();
      setDragState(null);
      if (isProcessing || movesLeft <= 0 || showSuccess || showFailure) return;
      const { offset } = info;
      const threshold = 30;

      let targetR = r;
      let targetC = c;

      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        if (Math.abs(offset.x) > threshold) {
          targetC = offset.x > 0 ? c + 1 : c - 1;
        }
      } else {
        if (Math.abs(offset.y) > threshold) {
          targetR = offset.y > 0 ? r + 1 : r - 1;
        }
      }

      if (targetR !== r || targetC !== c) {
        if (targetR >= 0 && targetR < ROWS && targetC >= 0 && targetC < COLS) {
          swapItems(r, c, targetR, targetC);
        }
      }
    },
    [isProcessing, movesLeft, showSuccess, showFailure, startHintTimer, swapItems],
  );

  const resetGame = () => {
    setGameId((prev) => prev + 1);
  };

  const handleRewardSuccess = useCallback(() => {
    // Grant extra moves only if we were out of moves (move finish)
    if (movesLeft <= 0) {
      setMovesLeft((prev) => prev + 10);
    }
    setShowFailure(false);
    setHintItems([]);

    // Check if we already have possible moves. If so, don't shuffle as requested by user.
    if (findPossibleMoves(grid).length > 0) {
      return;
    }

    // Perform a board shuffle to give a fresh start (only if stalemate)
    const items = grid.flat().filter(Boolean) as SmartMatchItem[];
    // Shuffle items array
    const shuffledItems = [...items];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }

    const newGrid: (SmartMatchItem | null)[][] = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => null),
    );

    let k = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (k < shuffledItems.length) {
          newGrid[r][c] = shuffledItems[k++];
        }
      }
    }

    // Ensure we have at least some moves after shuffle
    const currentMoves = findPossibleMoves(newGrid);
    if (currentMoves.length < 3) {
      let movesCreated = currentMoves.length;
      const sectors = [
        { rStart: 0, rEnd: Math.floor(ROWS / 3) },
        { rStart: Math.floor(ROWS / 3), rEnd: Math.floor((2 * ROWS) / 3) },
        { rStart: Math.floor((2 * ROWS) / 3), rEnd: ROWS - 1 },
      ];

      for (const sector of sectors) {
        if (movesCreated >= 3) break;
        let sectorFixed = false;
        for (let r = sector.rStart; r < sector.rEnd && !sectorFixed; r++) {
          for (let c = 0; c < COLS - 2 && !sectorFixed; c++) {
            if (r + 1 < ROWS && newGrid[r][c]) {
              const baseItem = newGrid[r][c]!;
              newGrid[r][c + 1] = { ...baseItem, id: `rew-${Math.random()}` };
              newGrid[r + 1][c + 2] = { ...baseItem, id: `rew-${Math.random()}` };
              sectorFixed = true;
              movesCreated++;
            }
          }
        }
      }
    }

    setGrid(newGrid);
    playTileDropSound();
  }, [grid, findPossibleMoves, ROWS, COLS, movesLeft]);

  return (
    <div className="smart-match-container">
      <div className="header-column">
        <button
          className="skip-level-top-btn"
          onClick={handleSkipLevel}
          disabled={isProcessing}
          title={t('home.subjects.smartMatch.skipLevel')}
        >
          ⏭️ {t('home.subjects.smartMatch.skipLevel')}
        </button>

        <div className="game-header">
          <div className="header-left">
            <div className="level-info">
              {t('home.subjects.smartMatch.level')} {currentLevel.id}
            </div>

            <div className="score-board">
              {t('home.subjects.smartMatch.score')}
              <span>
                {score} / {currentTargetScore}
              </span>
            </div>
            <div className="moves-board">
              {t('home.subjects.smartMatch.moves')}: {movesLeft}
            </div>
          </div>

          <div className="header-right">
            {currentLevel.collectItems && (
              <div className="objectives-bar">
                {Object.entries(currentLevel.collectItems).map(([type, target]) => {
                  const trimmedType = type.trim();
                  const itemDef = ITEMS.find((i) => i.type.trim() === trimmedType);
                  const current = collectedItems[type] || collectedItems[trimmedType] || 0;
                  return (
                    <div
                      key={type}
                      className={`objective-item ${current >= target ? 'completed' : ''}`}
                    >
                      <span className="obj-emoji">{itemDef?.emoji || '❓'}</span>
                      <span className="obj-count">
                        {current} / {target}
                      </span>
                      {current >= target && <span className="obj-check">✅</span>}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              className="reset-btn"
              onClick={resetGame}
              aria-label={t('common.actions.reset')}
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      <SmartMatchBoard
        grid={grid}
        gameId={gameId}
        selectedCell={selectedCell}
        matchingItems={matchingItems}
        hintItems={hintItems}
        dragState={dragState}
        isProcessing={isProcessing}
        cellRefs={cellRefs}
        setDragState={setDragState}
        onCellClick={handleCellClick}
        onPanEnd={handlePanEnd}
      />

      {showSuccess && (
        <SuccessModal
          handleClose={() => {
            trackExerciseComplete('SmartMatch');
            setShowSuccess(false);
            if (levelIndex < LEVELS.length - 1) {
              setLevelIndex((prev) => prev + 1);
            } else {
              setLevelIndex(0); // Loop back or show final message
            }
            setGameId((prev) => prev + 1);
          }}
          message={t('home.subjects.smartMatch.levelComplete', {
            level: currentLevel.id,
          })}
          starsWon={levelIndex * 2}
        />
      )}
      {showFailure && (
        <LooseModal
          handleClose={() => {
            setShowFailure(false);
          }}
          message={failureMessage}
          onWatchAdReward={handleRewardSuccess}
        />
      )}
      <SparkleRenderer />
    </div>
  );
};

export default SmartMatch;
