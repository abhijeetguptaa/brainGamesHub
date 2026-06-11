import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { generateSudoku } from '../utils/sudokuGenerator';
import '../styles/Sudoku.scss';
import SuccessModal from './SuccessModal';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLearningPathStore } from '../store/useLearningPathStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import { Toast } from '@capacitor/toast';
import { formatElapsedTime } from '../utils/timeUtils';
import {
  createSudokuBoard,
  createSudokuGiven,
  createSudokuNotes,
  getSudokuCandidates,
  getSudokuNumberStats,
  isSudokuSolved,
} from '../utils/sudokuUtils';
import { finishLearningPathTask, isLearningPathTaskActive } from '../utils/learningPathUtils';
import { setScreen, trackExerciseComplete } from '../utils/analytics';

const Sudoku = () => {
  const { t } = useTranslation();
  const { difficulty } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentActiveTask, completeTask, setActiveTask, setIsTaskReadyToComplete } =
    useLearningPathStore();
  const { openModal } = useUnlockModalStore();

  useEffect(() => {
    setScreen('SudokuGame');
  }, []);

  const isTinySteps = isLearningPathTaskActive(
    currentActiveTask,
    location.pathname,
    location.search,
  );

  const [board, setBoard] = useState(() => createSudokuBoard());
  const [notes, setNotes] = useState(() => createSudokuNotes());
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [selected, setSelected] = useState({ row: null, col: null });
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [, setRedoStack] = useState([]);
  const [solution, setSolution] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [lastChanged, setLastChanged] = useState(null);
  const [given, setGiven] = useState(() => createSudokuBoard(false));
  const [autofillNotesEnabled, setAutofillNotesEnabled] = useState(false);
  const [winMessageVisible, setWinMessageVisible] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const timerRafRef = useRef(null);

  const handleNewPuzzle = useCallback(() => {
    const { puzzle, solution } = generateSudoku(difficulty);
    if (!puzzle) {
      navigate('/games/sudoku');
      return;
    }
    setBoard(puzzle);
    setSolution(solution);
    setGiven(createSudokuGiven(puzzle));
    setNotes(createSudokuNotes());
    setGameStatus('playing');
    setTimer(0);
    setTimerActive(false);
    setRedoStack([]);
    setSelected({ row: null, col: null });
    firstMoveMade.current = false;
    setWinMessageVisible(false);
    setIsTaskReadyToComplete(false);
  }, [difficulty, navigate, setIsTaskReadyToComplete]);

  useEffect(() => {
    handleNewPuzzle();
  }, [difficulty, handleNewPuzzle]);

  const handleSkipLevel = () => {
    const target = currentActiveTask?.targetScore || 1;
    openModal(t('common.actions.skip'), 100, () => {
      if (isTinySteps && currentActiveTask) {
        setSolvedCount(target);
        setGameStatus('won');
        setWinMessageVisible(true);
        setIsTaskReadyToComplete(true);
      }
    });
  };

  useEffect(() => {
    if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    if (!timerActive || gameStatus !== 'playing') return undefined;

    let accumulated = 0;
    let lastFrameTime = performance.now();
    const tick = (now) => {
      accumulated += now - lastFrameTime;
      lastFrameTime = now;

      if (accumulated >= 1000) {
        const steps = Math.floor(accumulated / 1000);
        accumulated -= steps * 1000;
        setTimer((t) => t + steps);
      }

      timerRafRef.current = requestAnimationFrame(tick);
    };

    timerRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    };
  }, [timerActive, gameStatus]);

  const firstMoveMade = useRef(false);
  const handleFirstMove = useCallback(() => {
    if (!firstMoveMade.current) {
      setTimerActive(true);
      firstMoveMade.current = true;
    }
  }, []);

  const handleAutofillNotes = useCallback(() => {
    if (autofillNotesEnabled) {
      setNotes(createSudokuNotes());
      setAutofillNotesEnabled(false);
    } else {
      setNotes((prev) =>
        prev.map((row, r) =>
          row.map((nset, c) => {
            if (board[r][c]) return new Set();
            return new Set(getSudokuCandidates(board, r, c));
          }),
        ),
      );
      setAutofillNotesEnabled(true);
    }
  }, [autofillNotesEnabled, board]);

  const pushUndo = useCallback(() => {
    setRedoStack([]);
  }, []);

  const handleCellChange = useCallback(
    (row, col, value) => {
      if (given[row][col]) {
        return;
      }
      handleFirstMove();
      pushUndo();

      setBoard((prev) => {
        const newBoard = prev.map((r, i) =>
          i === row ? r.map((cell, j) => (j === col ? value : cell)) : r,
        );

        if (autofillNotesEnabled) {
          setNotes((prevNotes) =>
            prevNotes.map((r, i) =>
              r.map((nset, j) => {
                if (newBoard[i][j]) return new Set();
                return new Set(getSudokuCandidates(newBoard, i, j));
              }),
            ),
          );
        }

        return newBoard;
      });

      if (value) {
        setSelectedNumber(value);
        setLastChanged({ row, col });
      }
    },
    [given, handleFirstMove, pushUndo, autofillNotesEnabled],
  );

  const handleNumberPad = useCallback((num) => {
    setSelectedNumber((prev) => (prev === num ? null : num));
    setLastChanged(null);
  }, []);
  const handleErase = useCallback(() => {
    // setSelectedNumber(null);
    if (selected.row === null || selected.col === null) return;
    pushUndo();
    handleCellChange(selected.row, selected.col, null);
    setNotes((prev) =>
      prev.map((r, i) =>
        i === selected.row ? r.map((nset, j) => (j === selected.col ? new Set() : nset)) : r,
      ),
    );
  }, [selected, pushUndo, handleCellChange]);

  const { disabledNumbers, remainingCounts } = useMemo(() => {
    const stats = getSudokuNumberStats(board);
    return {
      ...stats,
      emptyCellsCount: board.flat().filter((cell) => cell === null).length,
    };
  }, [board]);

  useEffect(() => {
    if (gameStatus === 'playing' && isSudokuSolved(board, solution)) {
      setGameStatus('won');
      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);
      trackExerciseComplete('sudoku', difficulty, 0);

      if (isTinySteps && currentActiveTask) {
        const target = currentActiveTask?.targetScore || 1;
        if (nextSolved >= target) {
          completeTask(currentActiveTask.id);
          setIsTaskReadyToComplete(true);
        }
      }
    }
  }, [
    board,
    solution,
    gameStatus,
    solvedCount,
    isTinySteps,
    currentActiveTask,
    completeTask,
    setIsTaskReadyToComplete,
    difficulty,
  ]);

  useEffect(() => {
    if (gameStatus === 'won') {
      setWinMessageVisible(true);
    }
  }, [gameStatus]);

  const handleWinModalClose = () => {
    const isCurrentLearningPathTask = isLearningPathTaskActive(
      currentActiveTask,
      location.pathname,
      location.search,
    );
    if (isCurrentLearningPathTask) {
      const target = currentActiveTask?.targetScore || 1;
      if (solvedCount >= target) {
        finishLearningPathTask({
          currentActiveTask,
          completeTask,
          setActiveTask,
          navigate,
        });
      } else {
        handleNewPuzzle();
      }
    } else {
      const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      const parentRoute = `/${segments.slice(0, -1).join('/')}`;
      navigate(parentRoute, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    }
  };
  return (
    <div className="sudoku-container">
      {isTinySteps && currentActiveTask && (
        <div className="task-progress-banner">
          {t('common.progress')}: {solvedCount} / {currentActiveTask.targetScore || 1}
        </div>
      )}
      <div className="w-full d-flex justify-content-around align-items-center my-2">
        <button className="btn btn-primary" onClick={handleNewPuzzle}>
          {t('common.newGame')}
        </button>
        <div className="btn btn-secondary cursor-none">{formatElapsedTime(timer)}</div>
        <button
          className={`btn ${autofillNotesEnabled ? 'btn-danger' : 'btn-success'}`}
          onClick={handleAutofillNotes}
          title={t('sudoku.autofillNotes')}
        >
          📝
        </button>
      </div>
      {isTinySteps && (
        <button
          className="btn-skip-level"
          onClick={handleSkipLevel}
          title={t('common.actions.skip')}
        >
          <span className="skip-icon">⏭️</span> {t('common.actions.skip')}
        </button>
      )}

      <div className="sudoku-game-wrapper">
        <SudokuBoard
          board={board}
          notes={notes}
          onCellChange={handleCellChange}
          selected={selected}
          setSelected={setSelected}
          selectedNumber={selectedNumber}
          lastChanged={lastChanged}
          solution={solution}
          given={given}
          disabledNumbers={disabledNumbers}
        />
        <NumberPad
          onNumber={handleNumberPad}
          onErase={handleErase}
          selectedNumber={selectedNumber}
          disabledNumbers={disabledNumbers}
          remainingCounts={remainingCounts}
        />
      </div>
      {gameStatus === 'won' && winMessageVisible && (
        <SuccessModal
          handleClose={handleWinModalClose}
          message={''}
          starsWon={Math.pow(['easy', 'medium', 'hard', 'complex'].indexOf(difficulty) + 1, 2)}
        />
      )}
    </div>
  );
};

const NumberPad = React.memo(function NumberPad({
  onNumber,
  onErase,
  selectedNumber,
  disabledNumbers = [],
  remainingCounts = [],
}) {
  const { t } = useTranslation();
  return (
    <div className="sudoku-numpad d-flex flex-wrap justify-content-center align-items-end gap-2 mt-3 px-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <div key={n} className="sudoku-numpad__item">
          <span className="sudoku-numpad__count">
            {typeof remainingCounts[n] === 'number' ? remainingCounts[n] : 9}
          </span>
          <button
            className={`btn btn-primary sudoku-numpad-btn${selectedNumber === n ? ' active' : ''}`}
            onClick={() => onNumber(n)}
            disabled={disabledNumbers.includes(n)}
          >
            {n}
          </button>
        </div>
      ))}
      <button
        className="btn btn-secondary sudoku-numpad-btn"
        onClick={onErase}
        title={t('sudoku.erase')}
      >
        🧼
      </button>
    </div>
  );
});

const SudokuBoard = React.memo(function SudokuBoard({
  board,
  notes,
  onCellChange,
  selected,
  setSelected,
  selectedNumber,
  lastChanged,
  solution,
  given,
  disabledNumbers = [],
}) {
  const selectedValue =
    selected.row !== null && selected.col !== null ? board[selected.row][selected.col] : null;
  const highlightValue = selectedNumber || selectedValue;

  const handleCellClick = (row, col) => {
    if (disabledNumbers.includes(selectedNumber)) {
      return;
    }
    setSelected({ row, col });
    if (selectedNumber) {
      onCellChange(row, col, selectedNumber);
    }
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (selected.row === null || selected.col === null) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        onCellChange(selected.row, selected.col, num);
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        onCellChange(selected.row, selected.col, null);
      }
    },
    [selected, onCellChange],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="sudoku-board" tabIndex={0}>
      {board.map((row, r) =>
        row.map((cell, c) => {
          const isSelected = selected.row === r && selected.col === c;
          const isSameValue = highlightValue && cell === highlightValue && cell !== null;
          const isLastChanged = lastChanged && lastChanged.row === r && lastChanged.col === c;
          const isWrong = solution && cell && cell !== solution[r][c];
          const isGiven = given && given[r][c];

          const cellClasses = [
            'sudoku-cell',
            (r + 1) % 3 === 0 && r !== 8 ? 'sudoku-cell--border-bottom' : '',
            c === 0 ? 'sudoku-cell--first-col' : '',
            c === 8 ? 'sudoku-cell--last-col' : '',
            r === 0 ? 'sudoku-cell--first-row' : '',
            r === 8 ? 'sudoku-cell--last-row' : '',
            isSelected ? 'is-selected' : '',
            isLastChanged || isSameValue ? 'is-highlighted' : '',
            isWrong ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const valueClasses = ['sudoku-cell__value', isGiven ? 'is-given' : '']
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={r + '-' + c}
              className={cellClasses}
              onClick={() => handleCellClick(r, c)}
              tabIndex={-1}
            >
              {cell ? (
                <span className={valueClasses}>{cell}</span>
              ) : notes[r][c] && notes[r][c].size > 0 ? (
                <div className="sudoku-cell__notes">
                  {Array.from(notes[r][c])
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                </div>
              ) : null}
            </div>
          );
        }),
      )}
    </div>
  );
});

export default Sudoku;
