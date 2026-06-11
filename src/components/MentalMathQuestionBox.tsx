import {
  getOperator,
  QUIZ_ROUNDS,
  generateDistinctColors,
  getRandomDarkColor,
  generateMentalMathQuestion,
} from '../utils/utils';
import '../styles/QuestionBox.scss';
import SuccessModal from './SuccessModal';
import LooseModal from './LooseModal';
import MentalMathTimer from './MentalMathTimer';
import { useTranslation } from 'react-i18next';
import { playCorrectSound, playIncorrectSound, stopSpeech } from '../utils/soundUtils';
import { useCallback, useState, useEffect, useRef } from 'react';
import { trackExerciseStart, trackExerciseComplete } from '../utils/analytics';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSparkleBurst } from '@/hooks/useSparkleBurst';
import useStarStore from '../store/useStarStore';
import { Toast } from '@capacitor/toast';

const MentalMathQuestionBox = ({ complexity }: { complexity: string }) => {
  const { t } = useTranslation();
  const { stars, spendStars } = useStarStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isEmojiVisible, setIsEmojiVisible] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(() =>
    generateMentalMathQuestion(complexity),
  );
  const [currentRound, setCurrentRound] = useState(1);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);
  const [maxIncorrectAnswers, setMaxIncorrectAnswers] = useState(3);
  const [canWatchAdForLives, setCanWatchAdForLives] = useState(true);
  const [fiftyFiftyCount, setFiftyFiftyCount] = useState(3);
  const [isFiftyFiftyUsed, setIsFiftyFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isSpendingStarsFifty, setIsSpendingStarsFifty] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState<any[]>([]);
  const [showWinModal, setshowWinModal] = useState(false);
  const [showLooseModal, setshowLooseModal] = useState(false);
  const [optionColors, setOptionColors] = useState<string[]>([]);
  const [questionTextColor, setQuestionTextColor] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const currentTimeRef = useRef(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isNewBestTime, setIsNewBestTime] = useState(false);
  const pendingPostEmojiActionRef = useRef<(() => void) | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const emojiRef = useRef<HTMLSpanElement | null>(null);
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const handleTimeUpdate = (time: number) => {
    currentTimeRef.current = time;
  };

  const generateEnhancedQuestion = useCallback(() => {
    return generateMentalMathQuestion(complexity, lastCorrectAnswer);
  }, [complexity, lastCorrectAnswer]);

  /* ---------------------------------- effects ---------------------------------- */

  useEffect(() => {
    setCurrentQuestion(generateEnhancedQuestion());
    setQuestionTextColor(getRandomDarkColor());
  }, [generateEnhancedQuestion, questionKey]);

  useEffect(() => {
    if (currentQuestion && currentQuestion.options) {
      setOptionColors(generateDistinctColors(currentQuestion.options.length));
    }
  }, [currentQuestion]);

  const resetStates = () => {
    setCurrentRound(1);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
    setMaxIncorrectAnswers(3);
    setCanWatchAdForLives(true);
    setFiftyFiftyCount(3);
    setIsFiftyFiftyUsed(false);
    setHiddenOptions([]);
    setIncorrectQuestions([]);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setIsEmojiVisible(false);
    setshowLooseModal(false);
    setshowWinModal(false);
    setLastCorrectAnswer(null);
    setQuestionKey((k) => k + 1);
    setIsTimerRunning(false);
    setGameKey((k) => k + 1);
  };

  useEffect(() => {
    resetStates();
    trackExerciseStart('MentalMath', complexity);
  }, [complexity]);

  useEffect(() => {
    setIsFiftyFiftyUsed(false);
    setHiddenOptions([]);
  }, [questionKey]);

  useEffect(() => {
    if (!isEmojiVisible || !isAnswerCorrect) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      const emoji = emojiRef.current;
      const container = containerRef.current;
      if (!emoji || !container) return;

      const emojiRect = emoji.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      triggerSparkleBurst(
        emojiRect.left - containerRect.left + emojiRect.width / 2,
        emojiRect.top - containerRect.top + emojiRect.height / 2,
        { count: 48, range: 240 },
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isEmojiVisible, isAnswerCorrect, triggerSparkleBurst]);

  /* ---------------------------------- handlers --------------------------------- */

  const handleFiftyFifty = () => {
    if (fiftyFiftyCount > 0 && !isFiftyFiftyUsed && currentQuestion) {
      const correct = currentQuestion.correctAnswer;
      const wrongIndices: number[] = [];
      currentQuestion?.options?.forEach((opt: any, idx: number) => {
        if (opt !== correct) wrongIndices.push(idx);
      });

      // Randomly pick 2 wrong ones to hide
      const shuffled = [...wrongIndices].sort(() => Math.random() - 0.5);
      setHiddenOptions([shuffled[0], shuffled[1]]);
      setFiftyFiftyCount((prev) => prev - 1);
      setIsFiftyFiftyUsed(true);
    } else if (fiftyFiftyCount <= 0) {
      handleFiftyFiftyReward();
    }
  };

  const handleFiftyFiftyReward = async () => {
    if (isSpendingStarsFifty) return;
    if (stars < 100) {
      await Toast.show({
        text: t('unlockModal.notEnoughCoins'),
      });
      return;
    }

    setIsSpendingStarsFifty(true);
    try {
      const success = spendStars(100);
      if (success) {
        setFiftyFiftyCount(3);
        await Toast.show({
          text: t('unlockModal.featureUnlocked'),
        });
      }
    } catch (err) {
      console.error('Failed to spend stars for 50-50:', err);
    } finally {
      setIsSpendingStarsFifty(false);
    }
  };

  const handleAnswerSelect = (answer: any) => {
    if (selectedAnswer !== null) return;

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    const clickTime = currentTimeRef.current;
    setSelectedAnswer(answer);
    const correct = currentQuestion?.correctAnswer;
    const isCorrect = answer === correct;

    setIsAnswerCorrect(isCorrect);
    setIsEmojiVisible(true);
    isCorrect ? playCorrectSound() : playIncorrectSound();

    // Stop timer immediately on game completion (win or loss)
    const nextIncorrectCount = incorrectAnswersCount + (isCorrect ? 0 : 1);
    if (nextIncorrectCount >= maxIncorrectAnswers || currentRound === QUIZ_ROUNDS) {
      setIsTimerRunning(false);
    }

    if (!isCorrect) {
      setIncorrectQuestions((prev) => [
        ...prev,
        {
          question: `${currentQuestion.num1} ${getOperator(currentQuestion.operator)} ${currentQuestion.num2} = ?`,
          userAnswer: answer,
          correctAnswer: correct,
          operator: currentQuestion.operator,
          round: currentRound,
        },
      ]);
    }

    pendingPostEmojiActionRef.current = () => {
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setIsEmojiVisible(false);

      const newCorrectCount = correctAnswersCount + (isCorrect ? 1 : 0);
      const newIncorrectCount = incorrectAnswersCount + (isCorrect ? 0 : 1);

      if (isCorrect) {
        setCorrectAnswersCount(newCorrectCount);
      } else {
        setIncorrectAnswersCount(newIncorrectCount);
      }

      // Always store the correct answer to be used as num1 for the next question,
      // regardless of whether the user was right or wrong.
      setLastCorrectAnswer(Number(correct));

      // Check for incorrect answers limit
      if (newIncorrectCount >= maxIncorrectAnswers) {
        trackExerciseComplete('MentalMath', complexity, newCorrectCount);
        setshowLooseModal(true);
        setIsTimerRunning(false);
        return;
      }

      if (currentRound === QUIZ_ROUNDS) {
        trackExerciseComplete('MentalMath', complexity, newCorrectCount);

        // Calculate best time using clickTime
        const storedBest = localStorage.getItem(`mental_math_best_time_${complexity}`);
        const currentBest = storedBest ? parseFloat(storedBest) : Infinity;

        if (clickTime < currentBest) {
          setIsNewBestTime(true);
          setBestTime(clickTime);
          localStorage.setItem(`mental_math_best_time_${complexity}`, clickTime.toFixed(1));
        } else {
          setIsNewBestTime(false);
          setBestTime(currentBest === Infinity ? clickTime : currentBest);
        }

        setshowWinModal(true);
        setIsTimerRunning(false);
      } else {
        setCurrentRound((r) => r + 1);
        setQuestionKey((k) => k + 1);
      }
    };
  };

  const handleEmojiAnimationEnd = () => {
    setIsEmojiVisible(false);
    const action = pendingPostEmojiActionRef.current;
    pendingPostEmojiActionRef.current = null;
    action?.();
  };

  const handleWinModalClose = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      const parentRoute = `/${segments.slice(0, -1).join('/')}`;
      navigate(parentRoute, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };
  const questionText = currentQuestion
    ? `${currentQuestion.num1} ${getOperator(currentQuestion.operator)} ${currentQuestion.num2} = ?`
    : t('questionBox.loadingQuestion');

  const options = currentQuestion?.options ?? [];

  const handleRewardSuccess = () => {
    // Reward with 3 more opportunities (up to 6 total)
    setMaxIncorrectAnswers(6);
    setCanWatchAdForLives(false);
    setshowLooseModal(false);
    // Continue from current round
    setCurrentRound((r) => r + 1);
    setQuestionKey((k) => k + 1);
    setIsTimerRunning(true);
  };

  const isTinySteps = false;

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return (
    <div ref={containerRef} className="quiz-container-math">
      {/* Emoji - Absolute centered */}
      <div className="emoji-container">
        {isEmojiVisible && (
          <span ref={emojiRef} className="emoji-animation" onAnimationEnd={handleEmojiAnimationEnd}>
            {isAnswerCorrect ? '😃' : '😢'}
          </span>
        )}
      </div>
      <SparkleRenderer />

      <div className="quiz-main-content">
        <div className="quiz-left-panel">
          <MentalMathTimer
            key={gameKey}
            isRunning={isTimerRunning}
            complexity={complexity}
            isCompleted={showWinModal}
            onTimeUpdate={handleTimeUpdate}
          />

          <div className="round-info">
            {t('questionBox.round')} {currentRound} / {QUIZ_ROUNDS}
          </div>
          <div className="round-info">
            <span>
              {t('questionBox.correct')} {correctAnswersCount}
            </span>
            <span
              style={{
                color: incorrectAnswersCount >= maxIncorrectAnswers - 1 ? 'red' : 'inherit',
              }}
            >
              {t('questionBox.incorrect')} {incorrectAnswersCount} / {maxIncorrectAnswers}
            </span>
          </div>

          <div className="question-text" style={{ color: questionTextColor }}>
            {questionText}
          </div>
        </div>

        <div className="quiz-right-panel">
          <div className="options-grid">
            {!currentQuestion && <div>{t('questionBox.loading')}</div>}
            {currentQuestion &&
              options.length > 0 &&
              options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={selectedAnswer !== null || hiddenOptions.includes(index)}
                  className={`option-button
                ${selectedAnswer === option ? 'selected' : ''}
                ${
                  selectedAnswer !== null && selectedAnswer === option
                    ? isAnswerCorrect
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }
              `}
                  style={{
                    backgroundColor: optionColors[index],
                    opacity: hiddenOptions.includes(index) ? 0 : 1,
                    pointerEvents: hiddenOptions.includes(index) ? 'none' : 'auto',
                  }}
                >
                  <span>{option}</span>
                </button>
              ))}
          </div>

          {/* Lifeline 50-50 */}
          <div className="fifty-fifty-container">
            <button
              className="fifty-fifty-btn"
              onClick={handleFiftyFifty}
              disabled={selectedAnswer !== null || isFiftyFiftyUsed || isSpendingStarsFifty}
            >
              {isSpendingStarsFifty ? (
                '...'
              ) : (
                <>
                  {fiftyFiftyCount > 0 ? '🌓 50-50' : '🌟 50-50 (100 🌟)'}
                  <span className="count-badge">{fiftyFiftyCount}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showWinModal && (
        <SuccessModal
          handleClose={handleWinModalClose}
          message={t('questionBox.scoreMessage', {
            correctAnswersCount: correctAnswersCount,
            quizRounds: QUIZ_ROUNDS,
          })}
          starsWon={correctAnswersCount}
          incorrectQuestions={incorrectQuestions}
          showNewGame={!isTinySteps}
          onNewGame={resetStates}
          bestTime={bestTime?.toFixed(1)}
          isNewBestTime={isNewBestTime}
          disableAds={true}
        />
      )}
      {showLooseModal && (
        <LooseModal
          handleClose={resetStates}
          message={
            incorrectAnswersCount >= maxIncorrectAnswers
              ? t('common.feedback.looseMsg.0')
              : t('questionBox.scoreMessage', {
                  correctAnswersCount,
                  quizRounds: QUIZ_ROUNDS,
                })
          }
          onWatchAdReward={canWatchAdForLives ? handleRewardSuccess : undefined}
          incorrectQuestions={incorrectQuestions}
          showNewGame={!isTinySteps}
          onNewGame={resetStates}
        />
      )}
    </div>
  );
};

export default MentalMathQuestionBox;
