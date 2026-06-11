import {
  getOperator,
  QUIZ_ROUNDS,
  generateDistinctColors,
  getRandomDarkColor,
} from '../utils/utils';
import { generateQuestion } from '../utils/utils';
import '../styles/QuestionBox.scss';
import SuccessModal from './SuccessModal';
import LooseModal from './LooseModal';
import { useTranslation } from 'react-i18next';
import { playCorrectSound, playIncorrectSound, stopSpeech } from '../utils/soundUtils';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSparkleBurst } from '@/hooks/useSparkleBurst';
import { trackExerciseStart, trackExerciseComplete } from '../utils/analytics';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  exitLearningPathTask,
  finishLearningPathTask,
  isLearningPathTaskActive,
} from '../utils/learningPathUtils';

const COMPARISON_OPTIONS = ['=', '<', '>'] as const;

const QuestionBox = ({ operator, complexity }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isEmojiVisible, setIsEmojiVisible] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState<any[]>([]);
  const [showWinModal, setshowWinModal] = useState(false);
  const [showLooseModal, setshowLooseModal] = useState(false);
  const [optionColors, setOptionColors] = useState<string[]>([]);
  const [questionTextColor, setQuestionTextColor] = useState('');
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const emojiRef = useRef<HTMLSpanElement | null>(null);
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());
  const pendingPostEmojiActionRef = useRef<(() => void) | null>(null);

  const {
    currentActiveTask,
    completeTask,
    setActiveTask,
    completedTasks,
    setIsTaskReadyToComplete,
  } = useLearningPathStore();

  /* ---------------------------------- helpers ---------------------------------- */

  const getQuestionId = (q: any) => {
    if (!q) return '';
    if (q.numbers) {
      return `Sorting_${[...q.numbers].sort((a, b) => a - b).join('_')}_${operator}`;
    }
    if (q.num1 !== undefined && q.num2 !== undefined) {
      return `${q.num1}_${operator}_${q.num2}`;
    }
    return JSON.stringify(q);
  };

  const generateEnhancedQuestion = useCallback(() => {
    const base = generateQuestion(operator, complexity);
    if (operator === 'Ascending' || operator === 'Descending') {
      return base;
    }
    const { num1, num2, correctAnswer } = base;
    const questionPattern = `${num1} ${getOperator(operator)} ${num2} = _`;
    if (operator === 'Comparison') {
      return {
        ...base,
        questionPattern: base?.num1 + ',' + base?.num2,
      };
    }

    if (!base?.num1 || !base?.num2 || base.correctAnswer === undefined) return base;

    const options = base.options || [correctAnswer];

    return {
      ...base,
      questionPattern,
      correctAnswer,
      options,
    };
  }, [operator, complexity]);

  /* ---------------------------------- effects ---------------------------------- */

  useEffect(() => {
    let newQuestion = generateEnhancedQuestion();
    let id = getQuestionId(newQuestion);
    let attempts = 0;

    // Try to find a unique question within the current set
    while (usedQuestionIdsRef.current.has(id) && attempts < 15) {
      newQuestion = generateEnhancedQuestion();
      id = getQuestionId(newQuestion);
      attempts++;
    }

    usedQuestionIdsRef.current.add(id);
    setCurrentQuestion(newQuestion);
    setQuestionTextColor(getRandomDarkColor());
  }, [generateEnhancedQuestion, questionKey]);

  useEffect(() => {
    let colors: string[] = [];
    if (operator === 'Comparison') {
      colors = generateDistinctColors(COMPARISON_OPTIONS.length);
    } else if (currentQuestion && currentQuestion.options) {
      colors = generateDistinctColors(currentQuestion.options.length);
    }
    setOptionColors(colors);
  }, [currentQuestion, operator]);

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

  const resetStates = () => {
    setCurrentRound(1);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
    setIncorrectQuestions([]);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setIsEmojiVisible(false);
    setshowLooseModal(false);
    setshowWinModal(false);
    usedQuestionIdsRef.current.clear();
    setQuestionKey((k) => k + 1);
    setIsTaskReadyToComplete(false);
  };
  useEffect(() => {
    resetStates();
    trackExerciseStart(operator, complexity);
  }, [operator, complexity]);

  /* ---------------------------------- handlers --------------------------------- */

  const handleAnswerSelect = (answer: any) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    let correct: any;
    let isCorrect = false;

    if (operator === 'Comparison') {
      const { num1, num2 } = currentQuestion || {};
      if (num1 === num2) correct = '=';
      else if (num1 < num2) correct = '<';
      else correct = '>';

      isCorrect = String(answer) === correct;
    } else {
      correct = currentQuestion?.correctAnswer;
      isCorrect = answer === correct;
    }

    setIsAnswerCorrect(isCorrect);
    setIsEmojiVisible(true);
    isCorrect ? playCorrectSound() : playIncorrectSound();

    if (!isCorrect) {
      setIncorrectQuestions((prev) => [
        ...prev,
        {
          question: currentQuestion?.questionPattern || currentQuestion?.numbers?.join(', ') || '',
          userAnswer: answer,
          correctAnswer: correct,
          operator,
          round: currentRound,
        },
      ]);
    }

    pendingPostEmojiActionRef.current = () => {
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setIsEmojiVisible(false);

      isCorrect ? setCorrectAnswersCount((c) => c + 1) : setIncorrectAnswersCount((c) => c + 1);

      if (currentRound === QUIZ_ROUNDS) {
        const finalCorrectCount = correctAnswersCount + (isCorrect ? 1 : 0);
        trackExerciseComplete(operator, complexity, finalCorrectCount);

        const finalIncorrectCount = incorrectAnswersCount + (isCorrect ? 0 : 1);
        const didPassSession = 2 * finalIncorrectCount <= QUIZ_ROUNDS;
        const isCurrentLearningPathTask = isLearningPathTaskActive(
          currentActiveTask,
          location.pathname,
          location.search,
        );

        if (!didPassSession) {
          setshowLooseModal(true);
        } else {
          if (isCurrentLearningPathTask && currentActiveTask) {
            completeTask(currentActiveTask.id);
            setIsTaskReadyToComplete(true);
          }
          setshowWinModal(true);
        }
      } else {
        setCurrentRound((r) => r + 1);
        setQuestionKey((k) => k + 1);
      }
    };
  };

  const isComparison = operator === 'Comparison';
  const isSorting = operator === 'Ascending' || operator === 'Descending';

  const handleModalClose = () => {
    exitLearningPathTask({
      currentActiveTask,
      pathname: location.pathname,
      search: location.search,
      setActiveTask,
      navigate,
    });
  };
  const questionText = (() => {
    if (!currentQuestion) return t('questionBox.loadingQuestion');

    if (isComparison) {
      const { num1, num2 } = currentQuestion;
      return `${num1 ?? '?'} _ ${num2 ?? '?'}`;
    }

    if (isSorting) {
      return currentQuestion.numbers
        ? currentQuestion.numbers.join(' _ ')
        : t('questionBox.loading');
    }

    return (
      currentQuestion.questionPattern ??
      `${currentQuestion.num1 ?? '_'} ${getOperator(operator)} ${currentQuestion.num2 ?? '_'} = ?`
    );
  })();

  const options = isComparison ? COMPARISON_OPTIONS : (currentQuestion?.options ?? []);

  const handleRewardSuccess = () => {
    setIncorrectAnswersCount(0);
    setIncorrectQuestions([]);
    setshowLooseModal(false);
    // Optionally reset round if it was the last round
    if (currentRound >= QUIZ_ROUNDS) {
      setCurrentRound(1);
    }
  };

  const handleSkipTask = () => {
    if (isTinySteps && currentActiveTask) {
      finishLearningPathTask({
        currentActiveTask,
        completeTask,
        setActiveTask,
        navigate,
      });
    }
  };

  const handleEmojiAnimationEnd = () => {
    setIsEmojiVisible(false);
    const action = pendingPostEmojiActionRef.current;
    pendingPostEmojiActionRef.current = null;
    action?.();
  };

  const isTinySteps = !!currentActiveTask;
  const isAlreadyCompleted =
    isTinySteps && currentActiveTask && completedTasks[currentActiveTask.id];

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return (
    <div ref={containerRef} className={`quiz-container-math ${operator} ${complexity}`}>
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
          <div className="round-info">
            <span>
              {t('questionBox.round')} {currentRound} / {QUIZ_ROUNDS}
            </span>
          </div>
          <div className="round-info">
            <span>
              {t('questionBox.correct')} {correctAnswersCount}
            </span>

            <span>
              {t('questionBox.incorrect')} {incorrectAnswersCount}
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
                  disabled={selectedAnswer !== null}
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
                  style={{ backgroundColor: optionColors[index] }}
                >
                  <span>{option}</span>
                </button>
              ))}
            {currentQuestion && options.length === 0 && <div>{t('questionBox.noOptions')}</div>}
          </div>
        </div>
      </div>

      {showWinModal && (
        <SuccessModal
          handleClose={handleModalClose}
          message={t('questionBox.scoreMessage', {
            correctAnswersCount: correctAnswersCount,
            quizRounds: QUIZ_ROUNDS,
          })}
          starsWon={correctAnswersCount}
          skipStarAward={isAlreadyCompleted}
          incorrectQuestions={incorrectQuestions}
          showNewGame={!isTinySteps}
          onNewGame={resetStates}
        />
      )}
      {showLooseModal && (
        <LooseModal
          handleClose={handleModalClose}
          message={t('questionBox.scoreMessage', {
            correctAnswersCount: correctAnswersCount,
            quizRounds: QUIZ_ROUNDS,
          })}
          onWatchAdReward={handleRewardSuccess}
          incorrectQuestions={incorrectQuestions}
          showNewGame={!isTinySteps}
          onNewGame={resetStates}
          isTinySteps={isTinySteps}
          onSkipTask={handleSkipTask}
        />
      )}
    </div>
  );
};

export default QuestionBox;
