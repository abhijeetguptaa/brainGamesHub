import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SENTENCE_SCRAMBLE_DATA } from '../data/sentenceScrambleData';
import { playCorrectSound, playIncorrectSound, playTapSound, speakText } from '../utils/soundUtils';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { setScreen, trackExerciseComplete, trackExerciseStart } from '../utils/analytics';
import SuccessModal from './SuccessModal';
import LooseModal from './LooseModal';
import useUnlockModalStore from '../store/useUnlockModalStore';
import '../styles/SentenceScramble.scss';
import '../styles/EnglishWordsSpell.scss';
import { FcUndo } from 'react-icons/fc';
import { finishLearningPathTask, isLearningPathTaskActive } from '../utils/learningPathUtils';

const SentenceScramble = () => {
  const { difficulty = 'easy' } = useParams<{ difficulty: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useUnlockModalStore();
  const {
    currentActiveTask,
    completeTask,
    setActiveTask,
    completedTasks,
    setIsTaskReadyToComplete,
  } = useLearningPathStore();

  const isLearningPathTask = isLearningPathTaskActive(
    currentActiveTask,
    location.pathname,
    location.search,
  );

  useEffect(() => {
    setScreen('SentenceScrambleGame');
    trackExerciseStart('SentenceScramble', difficulty);
  }, [difficulty]);

  useEffect(() => {
    const handleTrigger = () => {
      if (isLearningPathTask) {
        setShowSuccess(true);
      }
    };
    window.addEventListener('trigger-task-completion', handleTrigger);
    return () => window.removeEventListener('trigger-task-completion', handleTrigger);
  }, [isLearningPathTask]);

  const storageKey = `sentence_scramble_progress_${difficulty}`;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [showFullHint, setShowFullHint] = useState(false);

  const questions = SENTENCE_SCRAMBLE_DATA[difficulty] || SENTENCE_SCRAMBLE_DATA.easy;

  // Safety check for index out of bounds if data changed
  useEffect(() => {
    if (currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(0);
      localStorage.setItem(storageKey, '0');
    }
  }, [questions.length, currentQuestionIndex, storageKey]);

  const currentQuestion = questions[currentQuestionIndex];

  const initGame = useCallback(() => {
    if (!currentQuestion) return;
    // Shuffle words but ensure they are not in correct order initially
    let words = [...currentQuestion.words];
    let shuffleCount = 0;
    do {
      words = words.sort(() => Math.random() - 0.5);
      shuffleCount++;
    } while (words.join(' ') === currentQuestion.correct && shuffleCount < 10);

    setShuffledWords(words);
    setSelectedWords([]);
    setAttempts(0);
    setHintIndex(-1);
  }, [currentQuestion]);

  const handleCheck = useCallback(() => {
    if (!currentQuestion) return;
    const userSentence = selectedWords.join(' ');
    if (userSentence === currentQuestion.correct) {
      playCorrectSound();
      trackExerciseComplete('SentenceScramble', difficulty, 1);
      setShowSuccess(true);
    } else {
      playIncorrectSound();
      setAttempts((prev) => prev + 1);
      if (attempts >= 1) {
        // Show hint after 2 wrong attempts (attempts 0 and 1)
        const correctWords = currentQuestion.correct.split(' ');
        let firstWrongIndex = 0;
        while (
          firstWrongIndex < selectedWords.length &&
          selectedWords[firstWrongIndex] === correctWords[firstWrongIndex]
        ) {
          firstWrongIndex++;
        }
        setHintIndex(firstWrongIndex);
      }
      setShowFailure(true);
    }
  }, [selectedWords, currentQuestion, attempts]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (
      currentQuestion &&
      selectedWords.length === currentQuestion.words.length &&
      selectedWords.length > 0 &&
      !showSuccess &&
      !showFailure
    ) {
      const timer = setTimeout(() => {
        handleCheck();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedWords.length, currentQuestion, handleCheck, showSuccess, showFailure]);

  const handleWordClick = (word: string, index: number, isSelected: boolean) => {
    playTapSound();
    speakText(word);

    if (isSelected) {
      setSelectedWords((prev) => prev.filter((_, i) => i !== index));
      setShuffledWords((prev) => [...prev, word]);
    } else {
      setShuffledWords((prev) => prev.filter((_, i) => i !== index));
      setSelectedWords((prev) => [...prev, word]);
    }
  };

  const handleReset = () => {
    playTapSound();
    initGame();
  };

  const handleNext = () => {
    setShowSuccess(false);
    setShowFailure(false);
    const nextIndex = (currentQuestionIndex + 1) % questions.length;
    setCurrentQuestionIndex(nextIndex);
    localStorage.setItem(storageKey, nextIndex.toString());
  };

  const handleSkip = () => {
    playTapSound();
    openModal(t('sentenceScramble.skipLevel', 'Skip Sentence'), 100, () => {
      handleNext();
    });
  };

  const showHint = () => {
    playTapSound();
    setShowFullHint(true);
    speakText(currentQuestion.correct);
  };

  const handleSuccessModalClose = () => {
    setShowSuccess(false);
    if (isLearningPathTask) {
      finishLearningPathTask({
        currentActiveTask,
        completeTask,
        setActiveTask,
        navigate,
      });
    } else {
      handleNext();
    }
  };

  const correctWordsArr = currentQuestion?.correct.split(' ') || [];

  return (
    <div className="sentence-scramble-container kids-bg">
      <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="title">
        🌟 {t('sentenceScramble.title', 'Sentence Scramble')} 🧩
      </motion.h1>

      <div className="game-area">
        {/* Tray for selected words */}
        <motion.div layout className="sentence-tray">
          <AnimatePresence mode="popLayout">
            {selectedWords.map((word, index) => (
              <motion.button
                key={`selected-${index}-${word}`}
                layout
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                className="word-tile selected"
                onClick={() => handleWordClick(word, index, true)}
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
          {selectedWords.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="placeholder">
              ✨ {t('sentenceScramble.tapWords', 'Tap words to build a sentence')} ✨
            </motion.div>
          )}
        </motion.div>

        {/* Pool of available words */}
        <div className="word-pool">
          <AnimatePresence mode="popLayout">
            {shuffledWords.map((word, index) => {
              const isHinted = hintIndex >= 0 && word === correctWordsArr[hintIndex];
              return (
                <motion.button
                  key={`pool-${index}-${word}`}
                  layout
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.1, rotate: 2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`word-tile pool ${isHinted ? 'hinted' : ''}`}
                  onClick={() => handleWordClick(word, index, false)}
                >
                  {word}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="controls">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="game-btn reset"
            onClick={handleReset}
          >
            <FcUndo />
            {t('common.actions.reset', 'Reset')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="game-btn hint"
            onClick={showHint}
          >
            💡 {t('common.actions.hint', 'Hint')}
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="game-btn skip"
          onClick={handleSkip}
        >
          🎥 {t('sentenceScramble.skipLevel', 'Skip')}
        </motion.button>
      </div>

      {showFullHint && (
        <div className="hint-overlay" onClick={() => setShowFullHint(false)}>
          <div className="hint-display" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={() => setShowFullHint(false)}
              className="close-button btn btn-link"
            >
              X
            </button>
            <p className="hint-text">
              <strong>{currentQuestion.correct}</strong>
            </p>
          </div>
        </div>
      )}

      {showSuccess && (
        <SuccessModal
          handleClose={handleSuccessModalClose}
          message={t('sentenceScramble.correct', 'Great job! That is a perfect sentence.')}
          starsWon={1}
        />
      )}

      {showFailure && (
        <LooseModal
          handleClose={() => {
            setShowFailure(false);
            handleReset();
          }}
          message={t('sentenceScramble.wrong', 'Not quite right. Try again!')}
          showNewGame={false}
        />
      )}
    </div>
  );
};

export default SentenceScramble;
