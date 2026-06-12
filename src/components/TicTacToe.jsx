import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/TicTacToe.scss';
import { TTT_TIMER_DURATION, TTT_AI_THINK_DELAY_MS } from '../constants/ticTacToeConstants';
import { playTapSound } from '../utils/soundUtils';
import { useTranslation } from 'react-i18next';
import SuccessModal from './SuccessModal';
import LooseModal from './LooseModal';
import TicTacToeBoard from './TicTacToeBoard';
import { createInitialBoard, getWinner, getAiMove } from '../utils/ticTacToeUtils';

import { useParams } from 'react-router-dom';
import { setScreen, trackExerciseComplete } from '../utils/analytics';

const TicTacToe = ({ userName }) => {
  const { t } = useTranslation();
  const { difficulty: urlDifficulty } = useParams();

  useEffect(() => {
    setScreen('TicTacToeGame');
  }, []);

  const [mode, setMode] = useState(urlDifficulty === 'pvp' ? 'pvp' : 'pvai');
  const [playerX] = useState(userName || t('common.defaultUserName'));
  const [playerO] = useState(t('common.player2'));
  const symbol = 'X'; // For PvAI: user's symbol
  const [difficulty, setDifficulty] = useState(urlDifficulty || 'hard'); // 'easy', 'medium', 'hard'

  useEffect(() => {
    if (urlDifficulty) {
      setMode(urlDifficulty === 'pvp' ? 'pvp' : 'pvai');
      setDifficulty(urlDifficulty);
    }
  }, [urlDifficulty]);

  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: 'success', message: '', stars: 0 });

  const gameHandledRef = useRef(false);

  const [history, setHistory] = useState([{ board: createInitialBoard(), xIsNext: true }]);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(TTT_TIMER_DURATION);
  const timerFrameRef = useRef();
  const aiFrameRef = useRef();

  const boardRef = useRef(null);

  const { board, xIsNext } = history[currentStep];
  const winnerInfo = getWinner(board);
  const isDraw = !winnerInfo && board.flat().every(Boolean);
  let oLabel;
  if (mode === 'pvai') {
    oLabel = symbol === 'X' ? t('common.ai') : playerO;
  } else {
    oLabel = playerO || 'O';
  }

  const handleRestart = () => {
    setHistory([{ board: createInitialBoard(), xIsNext: true }]);
    setCurrentStep(0);
    setTimer(TTT_TIMER_DURATION);
    gameHandledRef.current = false;
    setShowModal(false);
  };

  const handleWinModalClose = () => {
    handleRestartGame();
  };

  const handleRestartGame = () => {
    setShowModal(false);
    handleRestart();
  };

  useEffect(() => {
    if ((winnerInfo || isDraw) && !gameHandledRef.current) {
      gameHandledRef.current = true;
      if (winnerInfo) {
        setScore((prev) => ({ ...prev, [winnerInfo.winner]: prev[winnerInfo.winner] + 1 }));

        const starsByDifficulty = {
          easy: 1,
          medium: 3,
          hard: 5,
        };
        const starsWon = starsByDifficulty[difficulty] || 1;

        if (mode === 'pvai') {
          if (winnerInfo.winner === symbol) {
            trackExerciseComplete('tictactoe', difficulty, starsWon);
            setModalConfig({
              type: 'success',
              message: t('ticTacToe.winX', { name: playerX }),
              stars: starsWon,
            });
          } else {
            setModalConfig({
              type: 'loose',
              message: t('ticTacToe.winO', { name: oLabel }),
              stars: 0,
            });
          }
        } else {
          const winnerName = winnerInfo.winner === 'X' ? playerX : playerO;
          setModalConfig({
            type: 'success',
            message: t('ticTacToe.winX', { name: winnerName }),
            stars: starsWon,
          });
        }
      } else if (isDraw) {
        setScore((prev) => ({ ...prev, draw: prev.draw + 1 }));
        setModalConfig({
          type: 'loose',
          message: t('ticTacToe.draw'),
          stars: 0,
        });
      }
      setShowModal(true);
    }
  }, [winnerInfo, isDraw, mode, symbol, playerX, playerO, oLabel, t, difficulty]);

  const handleTimeout = useCallback(() => {
    if (winnerInfo || showModal) return;
    if (mode !== 'pvai') return;
    if (mode === 'pvai' && ((symbol === 'X' && !xIsNext) || (symbol === 'O' && xIsNext))) return;
    const next = { board: board.map((r) => [...r]), xIsNext: !xIsNext };
    const newHistory = history.slice(0, currentStep + 1).concat([next]);
    setHistory(newHistory);
    setCurrentStep(currentStep + 1);
  }, [winnerInfo, showModal, mode, symbol, xIsNext, board, history, currentStep]);

  useEffect(() => {
    if (timerFrameRef.current) cancelAnimationFrame(timerFrameRef.current);
    if (winnerInfo || mode !== 'pvai' || showModal) return undefined;

    setTimer(TTT_TIMER_DURATION);
    let accumulated = 0;
    let lastFrameTime = performance.now();

    const tick = (now) => {
      accumulated += now - lastFrameTime;
      lastFrameTime = now;

      if (accumulated >= 1000) {
        const steps = Math.floor(accumulated / 1000);
        accumulated -= steps * 1000;
        setTimer((current) => {
          const next = current - steps;
          if (next <= 0) {
            handleTimeout();
            return 0;
          }
          return next;
        });
      }

      timerFrameRef.current = requestAnimationFrame(tick);
    };

    timerFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerFrameRef.current) cancelAnimationFrame(timerFrameRef.current);
      timerFrameRef.current = null;
    };
  }, [xIsNext, currentStep, winnerInfo, mode, showModal, handleTimeout]);

  const handleCellClick = useCallback(
    (row, col, isAI = false) => {
      if (showModal) return;
      playTapSound();
      if (board[row][col] || winnerInfo) return;
      if (!isAI && mode === 'pvai' && ((symbol === 'X' && !xIsNext) || (symbol === 'O' && xIsNext)))
        return;
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = xIsNext ? 'X' : 'O';
      const next = { board: newBoard, xIsNext: !xIsNext };
      const newHistory = history.slice(0, currentStep + 1).concat([next]);
      setHistory(newHistory);
      setCurrentStep(currentStep + 1);
    },
    [showModal, board, winnerInfo, mode, symbol, xIsNext, history, currentStep],
  );

  useEffect(() => {
    if (aiFrameRef.current) cancelAnimationFrame(aiFrameRef.current);
    if (winnerInfo || showModal) return;
    const isAITurn =
      mode === 'pvai' && ((symbol === 'X' && !xIsNext) || (symbol === 'O' && xIsNext));
    if (isAITurn) {
      const aiSymbol = symbol === 'X' ? 'O' : 'X';
      const humanSymbol = symbol;
      const move = getAiMove(board, difficulty, aiSymbol, humanSymbol);
      if (move) {
        const startedAt = performance.now();
        const tick = (now) => {
          if (now - startedAt >= TTT_AI_THINK_DELAY_MS) {
            handleCellClick(move.r, move.c, true);
            aiFrameRef.current = null;
            return;
          }
          aiFrameRef.current = requestAnimationFrame(tick);
        };
        aiFrameRef.current = requestAnimationFrame(tick);
      }
    }
    return () => {
      if (aiFrameRef.current) cancelAnimationFrame(aiFrameRef.current);
      aiFrameRef.current = null;
    };
  }, [
    xIsNext,
    currentStep,
    winnerInfo,
    mode,
    symbol,
    difficulty,
    showModal,
    board,
    handleCellClick,
  ]);

  return (
    <div className="tic-tac-toe-wrapper">
      <h2 className="tic-tac-toe-title">{t('ticTacToe.title')}</h2>

      <div className="ttt-game-container">
        <div className="ttt-info-section">
          <div className="ttt-score-container">
            <div className="score-box">
              <span className="player-label">{playerX}:</span> <span className="score-value">{score.X}</span>
            </div>
            <div className="score-box">
              <span className="player-label">{t('ticTacToe.draws')}</span>{' '}
              <span className="score-value">{score.draw}</span>
            </div>
            <div className="score-box">
              <span className="player-label">{oLabel}:</span> <span className="score-value">{score.O}</span>
            </div>
          </div>

          {mode === 'pvai' && (
            <div className="ttt-timer-container">
              <div className="timer-box">
                <span className="timer-label">{t('ticTacToe.timer')}</span>{' '}
                <span className={`timer-value ${timer <= 5 ? 'critical' : ''}`}>{timer}s</span>
              </div>
            </div>
          )}
        </div>

        <div className="ttt-board-section">
          <TicTacToeBoard
            board={board}
            winnerInfo={winnerInfo}
            boardRef={boardRef}
            onCellClick={handleCellClick}
          />
        </div>
      </div>

      {showModal && modalConfig.type === 'success' && (
        <SuccessModal
          handleClose={handleWinModalClose}
          message={modalConfig.message}
          starsWon={modalConfig.stars}
        />
      )}
      {showModal && modalConfig.type === 'loose' && (
        <LooseModal handleClose={handleRestart} message={modalConfig.message} />
      )}
    </div>
  );
};

export default TicTacToe;
