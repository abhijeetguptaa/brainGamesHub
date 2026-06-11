import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/GridMatch.scss';
import { playTapSound } from '../utils/soundUtils';
import { GRID_SIZE, COLORS, PATTERNS } from '../constants/GridMatch';
import SuccessModal from './SuccessModal';
import { useLearningPathStore } from '../store/useLearningPathStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setScreen, trackExerciseComplete } from '../utils/analytics';
import { finishLearningPathTask } from '../utils/learningPathUtils';

// helper
const buildGrid = (idx) =>
  Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => PATTERNS[idx](r, c)),
  );

export default function GridMatch() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('GridMatchGame');
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { currentActiveTask, completeTask, setActiveTask, setIsTaskReadyToComplete } =
    useLearningPathStore();
  const { openModal } = useUnlockModalStore();

  const [currentPatternIndex, setCurrentPatternIndex] = useState(() =>
    Math.floor(Math.random() * PATTERNS.length),
  );
  const [reference, setReference] = useState([]); // Will be set by loadPattern
  const [player, setPlayer] = useState(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(COLORS.empty)),
  );
  const [selected, setSelected] = useState(COLORS.teal);
  const [done, setDone] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const successModalRef = useRef(null);

  const isCurrentLearningPathTask =
    !!currentActiveTask && (location.pathname + location.search).includes(currentActiveTask.path);

  const handleSkipLevel = () => {
    const target = currentActiveTask?.targetScore || 1;
    const cost = 100;

    openModal(t('common.actions.skip'), cost, () => {
      if (isCurrentLearningPathTask) {
        setDone(true);
        setSolvedCount(target);
        setIsTaskReadyToComplete(true);
        trackExerciseComplete('GridMatch', 'normal', target);
      }
    });
  };

  // New loadPattern function
  const loadPattern = useCallback((index) => {
    setReference(buildGrid(index));
    setPlayer(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(COLORS.empty)));
    setDone(false);
    setShowHint(false);
  }, []);

  // Load initial pattern and when currentPatternIndex changes
  useEffect(() => {
    loadPattern(currentPatternIndex);
  }, [currentPatternIndex, loadPattern]);

  // ✅ auto check
  useEffect(() => {
    if (reference.length !== GRID_SIZE) return;
    const match = reference.every((row, r) => row.every((col, c) => col === player[r][c]));
    if (match && !done) {
      setDone(true);
      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);
      trackExerciseComplete('GridMatch', 'normal', nextSolved);

      const target = currentActiveTask?.targetScore || 1;

      if (
        currentActiveTask &&
        (location.pathname + location.search).includes(currentActiveTask.path)
      ) {
        if (nextSolved >= target) {
          setIsTaskReadyToComplete(true);
        }
      }
    }
  }, [
    player,
    reference,
    done,
    solvedCount,
    currentActiveTask,
    location.pathname,
    location.search,
    setIsTaskReadyToComplete,
  ]);

  const handleModalClose = useCallback(() => {
    setDone(false);
    // Reset player immediately to prevent race condition with auto-check useEffect
    setPlayer(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(COLORS.empty)));
    // Note: setIsTaskReadyToComplete is handled in handleWinModalClose
    setCurrentPatternIndex((prevIndex) => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * PATTERNS.length);
      } while (nextIndex === prevIndex && PATTERNS.length > 1);
      return nextIndex;
    });
  }, []);

  const handleWinModalClose = useCallback(() => {
    const isCurrentLearningPathTask =
      !!currentActiveTask && (location.pathname + location.search).includes(currentActiveTask.path);
    const target = currentActiveTask?.targetScore || 1;

    if (isCurrentLearningPathTask) {
      if (solvedCount >= target) {
        finishLearningPathTask({
          currentActiveTask,
          completeTask,
          setActiveTask,
          navigate,
        });
        setIsTaskReadyToComplete(false);
      } else {
        handleModalClose();
      }
    } else {
      // Free play: X means back
      const segments = location.pathname.split('/').filter(Boolean);
      if (segments.length > 1) {
        const parentRoute = `/${segments.slice(0, -1).join('/')}`;
        navigate(parentRoute, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [
    currentActiveTask,
    navigate,
    handleModalClose,
    location.pathname,
    location.search,
    solvedCount,
    completeTask,
    setActiveTask,
    setIsTaskReadyToComplete,
  ]);

  const paint = (r, c) => {
    if (done) return;

    setPlayer((p) =>
      p.map((row, ri) =>
        row.map((cell, ci) => {
          if (ri === r && ci === c) {
            return selected;
          }
          return cell;
        }),
      ),
    );
  };

  const changeLevel = useCallback((direction) => {
    setCurrentPatternIndex((prevIndex) => {
      let newIndex = prevIndex + direction;
      if (newIndex < 0) {
        newIndex = PATTERNS.length - 1;
      } else if (newIndex >= PATTERNS.length) {
        newIndex = 0;
      }
      return newIndex;
    });
  }, []);

  return (
    <div className="gridMatch">
      {isCurrentLearningPathTask && (
        <>
          <div className="task-progress-banner">
            {t('common.progress')}: {solvedCount} / {currentActiveTask.targetScore}
          </div>
          <button
            className="btn-skip-level"
            onClick={handleSkipLevel}
            title={t('common.actions.skip')}
            style={{
              position: 'absolute',
              top: '60px',
              right: '10px',
              zIndex: 1,
            }}
          >
            <span className="skip-icon">⏭️</span> {t('common.actions.skip')}
          </button>
        </>
      )}
      {/* TARGET BOARD */}

      <div className="target-board">
        {player.flat().map((c, i) => {
          const r = Math.floor(i / GRID_SIZE);
          const col = i % GRID_SIZE;
          const hintColor = reference[r] ? reference[r][col] : COLORS.empty;

          return (
            <div
              key={i}
              className="cell"
              style={{ backgroundColor: c, position: 'relative' }}
              onMouseDown={() => {
                setIsPainting(true);
                paint(r, col);
              }}
              onMouseEnter={() => {
                if (isPainting) {
                  paint(r, col);
                }
              }}
              onMouseUp={() => setIsPainting(false)}
              onMouseLeave={() => setIsPainting(false)}
              onTouchStart={() => {
                setIsPainting(true);
                paint(r, col);
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el?.dataset?.cell) {
                  const idx = Number(el.dataset.cell);
                  paint(Math.floor(idx / GRID_SIZE), idx % GRID_SIZE);
                }
              }}
              onTouchEnd={() => setIsPainting(false)}
              data-cell={i}
            >
              {showHint && hintColor !== COLORS.empty && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: hintColor,
                    opacity: 0.3,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="palette-column">
        {Object.values(COLORS).map((c) => (
          <button
            key={c}
            className={`color-btn ${selected === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => {
              playTapSound();
              setSelected(c);
            }}
          />
        ))}
        <button
          className={`color-btn hint-btn ${showHint ? 'active' : ''}`}
          onClick={() => {
            playTapSound();
            setShowHint(!showHint);
          }}
          title={t('common.actions.hint', 'Hint')}
        >
          💡
        </button>
      </div>

      <div className="level-nav">
        <button
          onClick={() => {
            playTapSound();
            changeLevel(-1);
          }}
        >
          ◀
        </button>
        <div className="reference-board">
          {reference.flat().map((c, i) => (
            <div key={i} className="cell small" style={{ backgroundColor: c }} />
          ))}
        </div>
        <button
          onClick={() => {
            playTapSound();
            changeLevel(1);
          }}
        >
          ▶
        </button>
      </div>

      {/* PALETTE COLUMN */}

      {done && (
        <SuccessModal
          ref={successModalRef}
          handleClose={handleWinModalClose}
          message=""
          starsWon={2}
          showNewGame={!isCurrentLearningPathTask}
          onNewGame={handleModalClose}
        />
      )}
    </div>
  );
}
