// This component provides a fun and interactive counting exercise for kids. It displays a number of icons on the screen, and the user has to count them. The user can also navigate to the previous or next number.
import * as React from 'react';
import { useState, useEffect, cloneElement } from 'react';
import '../styles/CountingExercise.scss';
import { speakText, playTapSound, stopSpeech } from '../utils/soundUtils';
import { getRandomVisibleColor } from '../utils/utils';
import { countingIconData } from '../data/iconMapping';
import { useTranslation } from 'react-i18next';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate, useLocation } from 'react-router-dom';
import SuccessModal from './SuccessModal';
import { finishLearningPathTask, isLearningPathTaskActive } from '../utils/learningPathUtils';
import { setScreen, trackExerciseComplete } from '../utils/analytics';

const CountingExercise = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setScreen('CountingExercise');
  }, []);

  const {
    currentActiveTask,
    completeTask,
    setActiveTask,
    completedTasks,
    setIsTaskReadyToComplete,
  } = useLearningPathStore();

  const [currentIcon, setCurrentIcon] = useState<React.ReactElement | null>(null);
  const [currentWord, setCurrentWord] = useState('');
  const [currentNumber, setCurrentNumber] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [iconColors, setIconColors] = useState<string[]>([]);
  const [countedIndices, setCountedIndices] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasShownSuccess, setHasShownSuccess] = useState(false);

  const isLearningPathTask = isLearningPathTaskActive(
    currentActiveTask,
    location.pathname,
    location.search,
  );
  const isAlreadyCompleted =
    isLearningPathTask && currentActiveTask && completedTasks[currentActiveTask.id];

  const maxNumber = isLearningPathTask ? currentActiveTask?.targetScore || 20 : 20;

  // Format word for display (e.g. "APPLE" -> "Apple")
  const formatWord = (word: string, num: number) => {
    if (!word) return '';
    const formatted = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

    // Simple pluralization logic
    if (num > 1) {
      // consonant + y → ies
      if (formatted.endsWith('y') && !/[aeiou]y$/.test(formatted)) {
        return formatted.slice(0, -1) + 'ies';
      }

      // s, sh, ch, x, z → es
      if (/(s|sh|ch|x|z)$/.test(formatted)) {
        return formatted + 'es';
      }

      return formatted + 's';
    }
    return formatted;
  };

  useEffect(() => {
    const randomWord = countingIconData[Math.floor(Math.random() * countingIconData.length)];
    const word = randomWord.word;
    setCurrentIcon(randomWord.image);
    setCurrentWord(word);
    setCountedIndices(new Set());

    const newColors = Array.from({ length: 20 }, () => getRandomVisibleColor());
    setIconColors(newColors);

    const speak = async () => {
      try {
        setIsSpeaking(true);
        const formatted = formatWord(word, currentNumber);
        const translatedWord = t(`words.${formatted}`, { defaultValue: formatted });
        const translatedNumber = t(`countingExercise.numbers.${currentNumber}`, {
          defaultValue: currentNumber.toString(),
        });
        stopSpeech();
        speakText(`${translatedNumber} ${translatedWord}`);
      } catch (err) {
        console.error('Initial speech failed:', err);
      } finally {
        // Set to false after a short delay so buttons aren't permanently locked
        setTimeout(() => setIsSpeaking(false), 500);
      }
    };
    speak();

    return () => {
      stopSpeech();
    };
  }, [currentNumber]);

  const handleNext = async () => {
    playTapSound();
    if (currentNumber < maxNumber) {
      setIsSpeaking(true);
      const newNumber = currentNumber + 1;
      setCurrentNumber(newNumber);

      if (newNumber === maxNumber && !hasShownSuccess) {
        setHasShownSuccess(true);
        trackExerciseComplete('counting', 'easy', 5);
        if (isLearningPathTask) {
          setIsTaskReadyToComplete(true);
        } else {
          setTimeout(() => setShowSuccess(true), 1500);
        }
      }
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    if (
      !finishLearningPathTask({
        currentActiveTask: isLearningPathTask ? currentActiveTask : null,
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
  };

  const handlePrevious = async () => {
    playTapSound();
    if (currentNumber > 1) {
      setIsSpeaking(true);
      const newNumber = currentNumber - 1;
      setCurrentNumber(newNumber);
    }
  };

  // Listen for the back button click from App.jsx via a custom event
  useEffect(() => {
    const handleTrigger = () => {
      if (isLearningPathTask) {
        setShowSuccess(true);
      }
    };
    window.addEventListener('trigger-task-completion', handleTrigger);
    return () => {
      window.removeEventListener('trigger-task-completion', handleTrigger);
    };
  }, [isLearningPathTask]);

  const handleNumberClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    try {
      playTapSound();
      setIsSpeaking(true);
      stopSpeech();
      const translatedNumber = t(`countingExercise.numbers.${currentNumber}`, {
        defaultValue: currentNumber.toString(),
      });
      speakText(translatedNumber);
    } catch (err) {
      console.error('Number click failed:', err);
    } finally {
      setTimeout(() => setIsSpeaking(false), 500);
    }
  };

  const handleHeaderClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) return;
    try {
      playTapSound();
      setIsSpeaking(true);
      const formatted = formatWord(currentWord, currentNumber);
      const translatedWord = t(`words.${formatted}`, { defaultValue: formatted });
      const translatedNumber = t(`countingExercise.numbers.${currentNumber}`, {
        defaultValue: currentNumber.toString(),
      });
      stopSpeech();
      speakText(`${translatedNumber} ${translatedWord}`);
    } catch (err) {
      console.error('Header click failed:', err);
    } finally {
      setTimeout(() => setIsSpeaking(false), 500);
    }
  };

  const handleObjectClick = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (isSpeaking) return;

    if (countedIndices.has(index)) {
      return;
    }

    try {
      playTapSound();
      const newCounted = new Set(countedIndices);
      newCounted.add(index);
      setCountedIndices(newCounted);
      setIsSpeaking(true);
      stopSpeech();
      const count = newCounted.size;
      const translatedNumber = t(`countingExercise.numbers.${count}`, {
        defaultValue: count.toString(),
      });
      speakText(translatedNumber);
    } catch (err) {
      console.error('Object click handling failed:', err);
    } finally {
      setTimeout(() => setIsSpeaking(false), 400);
    }
  };

  return (
    <div className="counting-exercise" role="application" aria-label={t('countingExercise.title')}>
      {isLearningPathTask && currentActiveTask && (
        <div className="task-progress-banner">
          {t('common.progress')}: {currentNumber} / {currentActiveTask.targetScore}
        </div>
      )}
      <main className="counting-main" role="main">
        <header className="counting-header" onClick={handleHeaderClick} role="button" tabIndex={0}>
          <p className="counting-subtitle text-on-blue-BG">
            {t(`countingExercise.numbers.${currentNumber}`, {
              defaultValue: currentNumber.toString(),
            })}{' '}
            {t(`words.${formatWord(currentWord, currentNumber)}`, {
              defaultValue: formatWord(currentWord, currentNumber),
            })}
          </p>
        </header>

        {/* Objects Grid - Centered and full width */}
        <div className="objects-container">
          <div className="objects-grid">
            {currentIcon &&
              Array.from({ length: currentNumber }).map((_, index) => (
                <div
                  key={index}
                  className={`object-item ${countedIndices.has(index) ? 'counted' : ''}`}
                  onClick={(e) => handleObjectClick(e, index)}
                >
                  {cloneElement(currentIcon as React.ReactElement, {
                    size: 48,
                    color: iconColors[index] || '#000',
                  })}
                </div>
              ))}
          </div>
        </div>

        {/* Number Display - At the bottom */}
        <div className="number-display" onClick={handleNumberClick} role="button" tabIndex={0}>
          <h2 className="current-number text-on-blue-BG">{currentNumber}</h2>
        </div>

        {/* Navigation Controls - Below number text */}
        <div className="navigation-controls">
          <button
            className="nav-button nav-control-button nav-button--back"
            onClick={handlePrevious}
            disabled={currentNumber === 1 || isSpeaking}
            aria-label={t('common.actions.previous')}
          >
            <span className="text-white text-2xl rotate-180">➜</span>
          </button>
          <button
            className="nav-button nav-control-button nav-button--next"
            onClick={handleNext}
            disabled={currentNumber === maxNumber || isSpeaking}
            aria-label={t('common.actions.next')}
          >
            <span className="text-white text-2xl">➜</span>
          </button>
        </div>
      </main>
      {showSuccess && (
        <SuccessModal
          handleClose={handleCloseSuccess}
          message={t('common.scoreMessage', {
            correctAnswersCount: maxNumber,
            quizRounds: maxNumber,
          })}
          starsWon={5}
          skipStarAward={isAlreadyCompleted}
          showNewGame={!isLearningPathTask}
          onNewGame={() => {
            setShowSuccess(false);
            setHasShownSuccess(false);
            setCurrentNumber(1);
          }}
        />
      )}
    </div>
  );
};

export default CountingExercise;
