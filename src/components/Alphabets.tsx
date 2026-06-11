// This component provides a fun and interactive way for kids to learn the English alphabet. It displays each letter of the alphabet, along with a set of words that start with that letter. The user can click on a word to see an icon representing that word and hear the word spoken aloud.
import React, { useEffect, useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { alphabetData, MODAL_ICON_SIZE } from '../data/alphabet';
import '../styles/Alphabets.scss';
import { playTapSound, speakText, stopSpeech } from '../utils/soundUtils';
import { wordToEmoji, createCustomIcon } from '../data/iconMapping';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate, useLocation } from 'react-router-dom';
import SuccessModal from './SuccessModal';
import { finishLearningPathTask, isLearningPathTaskActive } from '../utils/learningPathUtils';
import { setScreen } from '../utils/analytics';

const Alphabets = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentActiveTask,
    completeTask,
    setActiveTask,
    completedTasks,
    setIsTaskReadyToComplete,
  } = useLearningPathStore();
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [visitedLetterIndices, setVisitedLetterIndices] = useState<Set<number>>(new Set([0]));
  const [modalWord, setModalWord] = useState('');
  const [showWinModal, setShowWinModal] = useState(false);

  const isLearningPathTask = isLearningPathTaskActive(
    currentActiveTask,
    location.pathname,
    location.search,
  );

  const currentLetter = alphabetData[currentLetterIndex];

  const isAlreadyCompleted =
    isLearningPathTask && currentActiveTask && completedTasks[currentActiveTask.id];

  const levelId = currentActiveTask
    ? parseInt(currentActiveTask.id.substring(1).split('_')[0])
    : 100; // Default to all if not in learning path
  const maxIndexForLevel = Math.min(levelId * 6 - 1, alphabetData.length - 1);

  const handleFinish = () => {
    if (currentActiveTask && isLearningPathTask) {
      setShowWinModal(true);
    }
  };

  useEffect(() => {
    setScreen('AlphabetsCategory');

    const handleTrigger = () => {
      handleFinish();
    };
    window.addEventListener('trigger-task-completion', handleTrigger);
    return () => window.removeEventListener('trigger-task-completion', handleTrigger);
  }, []);

  useEffect(() => {
    const speakLetter = async () => {
      await stopSpeech();
      await speakText(currentLetter.letter);
    };
    speakLetter();
  }, [currentLetter.letter]);

  const handleWinModalClose = () => {
    if (
      !finishLearningPathTask({
        currentActiveTask,
        completeTask,
        setActiveTask,
        navigate,
      })
    ) {
      const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      const parentRoute = `/${segments.slice(0, -1).join('/')}`;
      navigate(parentRoute, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    }
    setShowWinModal(false);
  };
  const speak = async (text: string) => {
    await stopSpeech();
    await speakText(text);
  };

  const onLetterKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      speak(`${currentLetter.letter}, ${currentLetter.smallLetter}`);
    }
  };

  useEffect(() => {
    if (!modalWord) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setModalWord('');
    window.addEventListener('keydown', onEsc as any);
    return () => window.removeEventListener('keydown', onEsc as any);
  }, [modalWord]);

  useEffect(() => {
    setVisitedLetterIndices((prev) => {
      if (prev.has(currentLetterIndex)) return prev;
      const next = new Set(prev);
      next.add(currentLetterIndex);
      return next;
    });
  }, [currentLetterIndex]);

  // Adjust visited check for the current level range
  const hasVisitedAllLettersInRange = Array.from({ length: maxIndexForLevel + 1 }).every((_, i) =>
    visitedLetterIndices.has(i),
  );

  useEffect(() => {
    if (
      isLearningPathTask &&
      currentLetterIndex === maxIndexForLevel &&
      hasVisitedAllLettersInRange
    ) {
      setIsTaskReadyToComplete(true);
    }
  }, [
    currentLetterIndex,
    hasVisitedAllLettersInRange,
    isLearningPathTask,
    maxIndexForLevel,
    setIsTaskReadyToComplete,
  ]);

  return (
    <div className="app-container alphabet-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
      <div className="bg-shape shape-4"></div>
      {showWinModal && (
        <SuccessModal
          handleClose={handleWinModalClose}
          message=""
          starsWon={5}
          skipStarAward={isAlreadyCompleted}
        />
      )}
      {modalWord && (
        <div className="modal-overlay" onClick={() => setModalWord('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              aria-label={t('common.close')}
              onClick={() => setModalWord('')}
            >
              ✕
            </button>
            <div className="word-icon modal-icon">
              {React.createElement(createCustomIcon(wordToEmoji[modalWord.toUpperCase()]), {
                size: MODAL_ICON_SIZE,
              })}
            </div>
            <div className="word-spelling modal-spelling">{t(`words.${modalWord}`)}</div>
          </div>
        </div>
      )}

      <div className={`alphabet-card letter-variant-${currentLetterIndex % 5}`}>
        <div className="alphabet-header">
          <div
            className="letter-pair"
            tabIndex={0}
            onClick={() => {
              speak(`${currentLetter.letter}`);
            }}
            onKeyPress={onLetterKeyPress}
          >
            <span className="letter-capital">{currentLetter.letter}</span>
            <span className="letter-small">{currentLetter.smallLetter}</span>
          </div>
        </div>

        <div className="words-list">
          {currentLetter.words.map((word) => (
            <div
              key={word}
              className="word-item"
              onClick={() => {
                setModalWord(word);
                speak(
                  t('alphabet.isFor', {
                    letter: currentLetter.letter,
                    word: t(`words.${word}`),
                  }),
                );
              }}
            >
              <div className="word-icon">
                {React.createElement(createCustomIcon(wordToEmoji[word.toUpperCase()]), {
                  size: 64,
                })}
              </div>
              <div className="word-spelling">{t(`words.${word}`)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation-controls">
        <button
          onClick={() => {
            playTapSound();
            setCurrentLetterIndex((i) => {
              if (isLearningPathTask && i === 0) return 0;
              return i === 0 ? maxIndexForLevel : i - 1;
            });
          }}
          className="nav-button nav-control-button nav-button--back"
          aria-label={t('common.actions.previous')}
          disabled={isLearningPathTask && currentLetterIndex === 0}
        >
          <span className="text-white text-2xl rotate-180">➜</span>
        </button>
        <button
          onClick={() => {
            playTapSound();
            setCurrentLetterIndex((i) => {
              if (isLearningPathTask && i === maxIndexForLevel) return i;
              return i === maxIndexForLevel ? 0 : i + 1;
            });
          }}
          className="nav-button nav-control-button nav-button--next"
          aria-label={t('common.actions.next')}
          disabled={isLearningPathTask && currentLetterIndex === maxIndexForLevel}
        >
          <span className="text-white text-2xl">➜</span>
        </button>
      </div>
    </div>
  );
};

export default Alphabets;
