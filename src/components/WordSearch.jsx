import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { generateWordSearch } from '../utils/wordSearchUtils';
import { alphabetData } from '../data/alphabet.ts';
import { WORD_SEARCH_CONSTANTS } from '../constants/wordSearchConstants';
import '../styles/WordSearch.scss';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import SuccessModal from './SuccessModal.tsx';
import DifficultySelection from './DifficultySelection'; // Import DifficultySelection
import { speakText, playCorrectSound } from '../utils/soundUtils.js';
import { useSparkleBurst } from '../hooks/useSparkleBurst.tsx';
import { wordToEmoji } from '../data/iconMapping';
import { formatElapsedTime } from '../utils/timeUtils';
import { setScreen, trackExerciseComplete, trackExerciseStart } from '../utils/analytics';

function getRandomWordsFromAlphabet(count = 5) {
  const allWords = alphabetData
    .flatMap((a) => a.words)
    .map((w) => w.replace(/\s+/g, '').toUpperCase())
    .filter((w) => w.length >= 3 && w.length <= 6);
  const unique = Array.from(new Set(allWords));
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique.slice(0, count);
}

const WordSearchCell = memo(function WordSearchCell({
  rowIdx,
  colIdx,
  letter,
  isHighlighted,
  onCellMouseDown,
  onCellMouseEnter,
  onCellMouseUp,
}) {
  return (
    <td
      className={`wordsearch-cell ${isHighlighted ? 'highlight-from-list' : ''}`}
      onMouseDown={() => onCellMouseDown(rowIdx, colIdx)}
      onMouseEnter={() => onCellMouseEnter(rowIdx, colIdx)}
      onMouseUp={onCellMouseUp}
    >
      {letter}
    </td>
  );
});

const WordListItem = memo(function WordListItem({ word, isFound, onSelectWord }) {
  return (
    <li className="wordsearch-word-list-item">
      <span
        className={`wordsearch-word ${isFound ? 'found' : ''}`}
        onClick={() => onSelectWord(word)}
      >
        {word}
      </span>
    </li>
  );
});

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

const WordSearch = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  const { difficulty } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const [grid, setGrid] = useState([]);
  const [placedWords, setPlacedWords] = useState([]); // [{word, positions: [[r,c], ...]}]
  const [foundWords, setFoundWords] = useState([]); // [word, ...]
  const [selectedCells, setSelectedCells] = useState([]); // [[row, col], ...]
  const [permanentlyFoundWords, setPermanentlyFoundWords] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [win, setWin] = useState(false);
  const [gridSize, setGridSize] = useState(0);
  const [timer, setTimer] = useState(0); // For elapsed time
  const [gameStartedTime, setGameStartedTime] = useState(null); // Timestamp when game started
  const [highlightedGridWordCells, setHighlightedGridWordCells] = useState([]); // New state for highlighted cells from list
  const [matchedEmoji, setMatchedEmoji] = useState(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const gridRef = useRef(null);
  const timerRafRef = useRef(null);
  const matchedEmojiRafRef = useRef(null);
  const colorPalette = WORD_SEARCH_CONSTANTS.COLOR_PALETTE;

  const startGame = useCallback(
    (difficulty) => {
      const difficultySettings = WORD_SEARCH_CONSTANTS.DIFFICULTY_LEVELS[difficulty.toUpperCase()];
      if (!difficultySettings) {
        navigate('/wordsearch');
        return;
      }

      setGridSize(difficultySettings.GRID_SIZE);
      setGameStartedTime(Date.now());
      setTimer(0);
      const pickedWords = getRandomWordsFromAlphabet(difficultySettings.NUM_WORDS);
      const { grid, placedWords } = generateWordSearch(difficultySettings.GRID_SIZE, pickedWords);
      setGrid(grid);
      setPlacedWords(placedWords);
      setFoundWords([]);
      setSelectedCells([]);
      setPermanentlyFoundWords([]);
      setIsSelecting(false);
      setWin(false);
    },
    [navigate],
  );

  useEffect(() => {
    startGame(difficulty);
    trackExerciseStart('WordSearch', difficulty);
  }, [difficulty, startGame]);

  useEffect(() => {
    setScreen('WordSearch');
  }, []);

  const restartGame = () => {
    setHighlightedGridWordCells([]);
    startGame(difficulty);
  };

  useEffect(() => {
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    if (!gameStartedTime || win) return undefined;

    const tick = () => {
      const nextTimer = Math.floor((Date.now() - gameStartedTime) / 1000);
      setTimer((prev) => (prev === nextTimer ? prev : nextTimer));
      timerRafRef.current = requestAnimationFrame(tick);
    };

    timerRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    };
  }, [gameStartedTime, win]);

  useEffect(() => {
    if (matchedEmojiRafRef.current) cancelAnimationFrame(matchedEmojiRafRef.current);
    if (!matchedEmoji) return undefined;

    const startedAt = performance.now();
    const tick = (now) => {
      if (now - startedAt >= 1000) {
        setMatchedEmoji(null);
        matchedEmojiRafRef.current = null;
        return;
      }
      matchedEmojiRafRef.current = requestAnimationFrame(tick);
    };

    matchedEmojiRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (matchedEmojiRafRef.current) cancelAnimationFrame(matchedEmojiRafRef.current);
      matchedEmojiRafRef.current = null;
    };
  }, [matchedEmoji]);

  const handleCellMouseDown = useCallback((row, col) => {
    setIsSelecting(true);
    setSelectedCells([[row, col]]);
  }, []);

  const handleCellMouseEnter = useCallback(
    (row, col) => {
      if (!isSelecting) return;
      setSelectedCells((prev) => {
        if (prev.length === 0) return [[row, col]];
        const [startRow, startCol] = prev[0];
        const dr = row - startRow;
        const dc = col - startCol;
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
          const length = Math.max(Math.abs(dr), Math.abs(dc));
          const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
          const cells = [];
          for (let i = 0; i <= length; i++) {
            cells.push([startRow + i * stepR, startCol + i * stepC]);
          }
          return cells;
        }
        return prev;
      });
    },
    [isSelecting],
  );

  const getSVGLineProps = useCallback(
    (cells) => {
      if (cells.length < 2) return null;
      const [startRow, startCol] = cells[0];
      const [endRow, endCol] = cells[cells.length - 1];
      const table = gridRef.current;
      if (!table) return null;
      const rect = table.getBoundingClientRect();
      const cellWidth = rect.width / gridSize;
      const cellHeight = rect.height / gridSize;
      const x1 = startCol * cellWidth + cellWidth / 2;
      const y1 = startRow * cellHeight + cellHeight / 2;
      const x2 = endCol * cellWidth + cellWidth / 2;
      const y2 = endRow * cellHeight + cellHeight / 2;
      return { x1, y1, x2, y2, width: rect.width, height: rect.height, cellHeight };
    },
    [gridSize],
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || selectedCells.length === 0) {
      setIsSelecting(false);
      setSelectedCells([]);
      return;
    }
    const word = selectedCells.map(([r, c]) => grid[r][c]).join('');
    const reversed = word.split('').reverse().join('');
    const found = placedWords.find(
      (pw) =>
        !foundWords.includes(pw.word) &&
        (word === pw.word || reversed === pw.word) &&
        arraysEqual(pw.positions, selectedCells),
    );
    if (found) {
      setFoundWords((prev) => [...prev, found.word]);
      setPermanentlyFoundWords((prev) => [...prev, selectedCells]);

      const emoji = wordToEmoji[found.word.toUpperCase()];
      if (emoji) {
        setMatchedEmoji(emoji);
        speakText(found.word);
      }

      const props = getSVGLineProps(selectedCells);
      if (props) {
        const centerX = (props.x1 + props.x2) / 2;
        const centerY = (props.y1 + props.y2) / 2;
        triggerSparkleBurst(centerX, centerY, { count: 30, range: 200 });
        playCorrectSound();
      }
    }
    setSelectedCells([]);
    setIsSelecting(false);
  }, [
    isSelecting,
    selectedCells,
    grid,
    placedWords,
    foundWords,
    triggerSparkleBurst,
    getSVGLineProps,
  ]);

  useEffect(() => {
    if (foundWords.length === placedWords.length && placedWords.length > 0 && !win) {
      setWin(true);
      trackExerciseComplete('WordSearch', difficulty, 4);
      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);
    }
  }, [foundWords, placedWords, solvedCount, win, difficulty]);

  const handleWinModalClose = () => {
    restartGame();
  };

  const getCellFromTouch = useCallback(
    (touch, tableRef) => {
      const table = tableRef.current;
      if (!table) return null;
      const rect = table.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const cellWidth = rect.width / gridSize;
      const cellHeight = rect.height / gridSize;
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        return [row, col];
      }
      return null;
    },
    [gridSize],
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length !== 1) return;
      const cell = getCellFromTouch(e.touches[0], gridRef);
      if (cell) {
        setIsSelecting(true);
        setSelectedCells([cell]);
      }
    },
    [getCellFromTouch],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isSelecting || e.touches.length !== 1) return;
      const cell = getCellFromTouch(e.touches[0], gridRef);
      if (!cell) return;
      setSelectedCells((prev) => {
        if (prev.length === 0) return [cell];
        const [startRow, startCol] = prev[0];
        const [row, col] = cell;
        const dr = row - startRow;
        const dc = col - startCol;
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
          const length = Math.max(Math.abs(dr), Math.abs(dc));
          const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
          const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
          const cells = [];
          for (let i = 0; i <= length; i++) {
            cells.push([startRow + i * stepR, startCol + i * stepC]);
          }
          return cells;
        }
        return prev;
      });
    },
    [isSelecting, getCellFromTouch],
  );

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const isCellHighlighted = useCallback(
    (row, col) => {
      return highlightedGridWordCells.some((cell) => cell[0] === row && cell[1] === col);
    },
    [highlightedGridWordCells],
  );

  const handleWordListItemClick = useCallback(
    (word) => {
      speakText(word);
      const wordToHighlight = placedWords.find((pw) => pw.word === word);

      if (wordToHighlight) {
        const isCurrentlyHighlighted =
          highlightedGridWordCells.length > 0 &&
          arraysEqual(highlightedGridWordCells, wordToHighlight.positions);

        if (isCurrentlyHighlighted) {
          setHighlightedGridWordCells([]);
        } else {
          setHighlightedGridWordCells(wordToHighlight.positions);
        }
      }
    },
    [placedWords, highlightedGridWordCells],
  );

  const selectedLineProps = getSVGLineProps(selectedCells);
  const permanentlyFoundLines = useMemo(
    () =>
      permanentlyFoundWords
        .map((cells, index) => {
          const props = getSVGLineProps(cells);
          if (!props) return null;
          return (
            <line
              key={index}
              x1={props.x1}
              y1={props.y1}
              x2={props.x2}
              y2={props.y2}
              stroke={colorPalette[index % colorPalette.length]}
              strokeWidth={props.cellHeight * 0.7}
              strokeLinecap="round"
              opacity="0.7"
            />
          );
        })
        .filter(Boolean),
    [permanentlyFoundWords, colorPalette, getSVGLineProps],
  );

  const renderedGrid = useMemo(
    () =>
      grid.map((rowArr, rowIdx) => (
        <tr key={rowIdx}>
          {rowArr.map((letter, colIdx) => (
            <WordSearchCell
              key={colIdx}
              rowIdx={rowIdx}
              colIdx={colIdx}
              letter={letter}
              isHighlighted={isCellHighlighted(rowIdx, colIdx)}
              onCellMouseDown={handleCellMouseDown}
              onCellMouseEnter={handleCellMouseEnter}
              onCellMouseUp={handleMouseUp}
            />
          ))}
        </tr>
      )),
    [grid, isCellHighlighted, handleCellMouseDown, handleCellMouseEnter, handleMouseUp],
  );

  const renderedWordList = useMemo(
    () =>
      placedWords.map((pw) => (
        <WordListItem
          key={pw.word}
          word={pw.word}
          isFound={foundWords.includes(pw.word)}
          onSelectWord={handleWordListItemClick}
        />
      )),
    [placedWords, foundWords, handleWordListItemClick],
  );

  return (
    <div className="wordsearch-container">
      <div className="wordsearch-layout">
        <div className="wordsearch-content">
          {win && <SuccessModal handleClose={handleWinModalClose} message="" starsWon={4} />}
          <div className="black-bg-card">
            <div className="wordsearch-card-body">
              <div className="wordsearch-header">
                <div className="wordsearch-controls">
                  <div className="wordsearch-timer wordsearch-minw-70">
                    {formatElapsedTime(timer)}
                  </div>

                  <button className="wordsearch-btn btn-primary" onClick={restartGame}>
                    {t('common.newGame')}
                  </button>
                </div>
              </div>

              <div className="wordsearch-game-area">
                <div className="wordsearch-grid-column">
                  <div
                    className="wordsearch-table-wrapper"
                    onMouseLeave={() => {
                      setIsSelecting(false);
                      setSelectedCells([]);
                    }}
                  >
                    <SparkleRenderer />
                    <svg
                      className="wordsearch-svg-overlay"
                      width={selectedLineProps?.width || '100%'}
                      height={selectedLineProps?.height || '100%'}
                      role="img"
                      aria-label={t('wordSearch.selectionOverlay')}
                    >
                      {selectedCells.length > 1 &&
                        (() => {
                          if (!selectedLineProps) return null;

                          return (
                            <line
                              x1={selectedLineProps.x1}
                              y1={selectedLineProps.y1}
                              x2={selectedLineProps.x2}
                              y2={selectedLineProps.y2}
                              stroke={
                                colorPalette[permanentlyFoundWords.length % colorPalette.length]
                              }
                              strokeWidth={selectedLineProps.cellHeight * 0.7}
                              strokeLinecap="round"
                              opacity="0.7"
                            />
                          );
                        })()}

                      {permanentlyFoundLines}
                    </svg>

                    <table
                      className="wordsearch-table user-select-none"
                      ref={gridRef}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <tbody>{renderedGrid}</tbody>
                    </table>
                  </div>
                </div>

                <div className="wordsearch-list-column">
                  <div className="wordsearch-word-list-card">
                    <div className="card-body">
                      <ul className="wordsearch-word-list">
                        {renderedWordList}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {matchedEmoji && (
            <div className="wordsearch-matched-emoji-overlay">
              <span className="matched-emoji">{matchedEmoji}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordSearch;
