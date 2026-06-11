// This component provides a fun and interactive word spelling game for kids. It displays an image and a set of shuffled letters, and the user has to drag and drop the letters in the correct order to spell the word. The user can also hear the word spoken aloud, and get a hint if they are stuck.
import { useState, useEffect, cloneElement } from 'react';
import '../styles/EnglishWordsSpell.scss';
import { speakText } from '../utils/soundUtils';
import { countingIconData } from '../data/iconMapping';
import { useTranslation } from 'react-i18next';
import SuccessModal from './SuccessModal';
import { getRandomVisibleColor } from '../utils/utils';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { finishLearningPathTask, isLearningPathTaskActive } from '../utils/learningPathUtils';
import { setScreen, trackExerciseComplete } from '../utils/analytics';

const EnglishWordsSpell = () => {
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
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  useEffect(() => {
    setScreen('EnglishWordsSpellGame');

    // Initialize first word
    const randomIndex = Math.floor(Math.random() * countingIconData.length);
    setCurrentWordIndex(randomIndex);
    setUsedIndices([randomIndex]);
  }, []);

  const isLearningPathTask = isLearningPathTaskActive(
    currentActiveTask,
    location.pathname,
    location.search,
  );

  const [droppedLetters, setDroppedLetters] = useState<string[]>([]);
  const [shuffledLetters, setShuffledLetters] = useState<any[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showHint, setShowHint] = useState(false);
  const [showError, setShowError] = useState(false);
  const [iconColor, setIconColor] = useState('');
  const [solvedCount, setSolvedCount] = useState(0);

  const currentWord =
    currentWordIndex !== -1 ? countingIconData[currentWordIndex] : countingIconData[0];
  const Icon = currentWord.image;
  const isAlreadyCompleted =
    isLearningPathTask && currentActiveTask && completedTasks[currentActiveTask.id];

  // Initialize game for current word
  useEffect(() => {
    if (currentWordIndex === -1) return;
    setIsCorrect(false);
    setShowHint(false);
    setDroppedLetters(Array(currentWord.letters.length).fill(''));

    const shuffled = [...currentWord.letters]
      .sort(() => Math.random() - 0.5)
      .map((letter) => ({
        letter,
        selected: false,
        color: getRandomVisibleColor(),
      }));
    setShuffledLetters(shuffled);
    setIconColor(getRandomVisibleColor());
  }, [currentWordIndex]);

  // Check if word is complete and correct
  useEffect(() => {
    if (currentWordIndex === -1) return;
    if (droppedLetters.length === currentWord.letters.length) {
      const filledLetters = droppedLetters.filter((letter) => letter && letter !== '');
      if (filledLetters.length === currentWord.letters.length) {
        const isWordCorrect = filledLetters.join('') === currentWord.word;
        setShowError(!isWordCorrect);
        if (isWordCorrect) {
          setTimeout(() => {
            const nextSolvedCount = solvedCount + 1;
            setIsCorrect(true);
            setSolvedCount(nextSolvedCount);
            trackExerciseComplete('spell', 'easy', 1);

            const target = currentActiveTask?.targetScore || 10;
            if (isLearningPathTask && currentActiveTask && nextSolvedCount >= target) {
              setIsTaskReadyToComplete(true);
            }
          }, 500);
        }
      } else {
        setShowError(false);
      }
    } else {
      setShowError(false);
    }
  }, [droppedLetters, currentWord, t]);

  const handleLetterSelect = (letter: string, index: number, color: string) => {
    setShowHint(false);
    const emptyIndex = droppedLetters.findIndex((l) => !l || l === '');
    if (emptyIndex === -1) return;

    const newDroppedLetters = [...droppedLetters];
    newDroppedLetters[emptyIndex] = letter;
    // We can store color if needed, but for now just use it for the selectable button
    setDroppedLetters(newDroppedLetters);

    const newShuffledLetters = [...shuffledLetters];
    newShuffledLetters[index].selected = true;
    setShuffledLetters(newShuffledLetters);

    speakText(letter);
  };

  const handleSlotClick = (index: number) => {
    if (isCorrect) return;
    const letter = droppedLetters[index];
    if (!letter || letter === '') return;

    // Remove letter from slots
    const newDroppedLetters = [...droppedLetters];
    newDroppedLetters[index] = '';
    setDroppedLetters(newDroppedLetters);

    // Make letter selectable again
    const newShuffledLetters = [...shuffledLetters];
    const shuffledIndex = newShuffledLetters.findIndex(
      (obj) => obj.letter === letter && obj.selected,
    );
    if (shuffledIndex !== -1) {
      newShuffledLetters[shuffledIndex].selected = false;
      setShuffledLetters(newShuffledLetters);
    }
  };

  const handleImageClick = () => {
    speakText(currentWord.word);
  };

  const handleReset = () => {
    if (isCorrect) return;
    const shuffled = [...currentWord.letters]
      .sort(() => Math.random() - 0.5)
      .map((letter) => ({
        letter,
        selected: false,
        color: getRandomVisibleColor(),
      }));
    setShuffledLetters(shuffled);
    setDroppedLetters(Array(currentWord.letters.length).fill(''));
    setIsCorrect(false);
    setShowHint(false);
  };

  const handleHint = () => {
    if (isCorrect) return;
    setShowHint(true);
    speakText(`${t('englishWordsSpell.theWordIs')} ${currentWord.word}`);
  };

  const showNextWord = () => {
    if (countingIconData.length <= 1) {
      // If only one word, manually reset
      setIsCorrect(false);
      setShowHint(false);
      setDroppedLetters(Array(currentWord.letters.length).fill(''));
      const shuffled = [...currentWord.letters]
        .sort(() => Math.random() - 0.5)
        .map((letter) => ({
          letter,
          selected: false,
          color: getRandomVisibleColor(),
        }));
      setShuffledLetters(shuffled);
      return;
    }

    let availableIndices = countingIconData
      .map((_, i) => i)
      .filter((i) => !usedIndices.includes(i));

    if (availableIndices.length === 0) {
      // All words used, reset but avoid immediate repeat
      availableIndices = countingIconData.map((_, i) => i).filter((i) => i !== currentWordIndex);
      setUsedIndices([]);
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    setCurrentWordIndex(randomIndex);
    setUsedIndices((prev) => [...prev, randomIndex]);
  };

  const handleSuccessClose = () => {
    const target = currentActiveTask?.targetScore || 10;
    if (isLearningPathTask && currentActiveTask && solvedCount >= target) {
      finishLearningPathTask({
        currentActiveTask,
        completeTask,
        setActiveTask,
        navigate,
      });
      return;
    }
    showNextWord();
  };

  return (
    <div
      className="english-words-spell"
      role="application"
      aria-label={t('englishWordsSpell.title')}
    >
      {isLearningPathTask && currentActiveTask && (
        <>
          <div className="task-progress-banner">
            {t('common.progress')}: {solvedCount} / {currentActiveTask.targetScore}
          </div>
        </>
      )}
      <main className="spell-main" role="main">
        {/* Image Display */}
        <div className="image-container">
          {cloneElement(Icon as React.ReactElement, {
            className: 'word-image',
            onClick: handleImageClick,
            role: 'button',
            tabIndex: 0,
            color: iconColor,
            size: 120,
          })}
        </div>
        <div className="spell-main-button-container">
          {/* Letter Slots */}
          <div className="letter-slots-container">
            <div className="letter-slots">
              {currentWord.letters.map((correctLetter, index) => {
                const isFilled = droppedLetters[index] && droppedLetters[index] !== '';
                const isWrong =
                  showError && !isCorrect && isFilled && droppedLetters[index] !== correctLetter;
                const errorClass = isWrong ? 'error' : '';
                return (
                  <div
                    key={index}
                    className={`letter-slot${isFilled ? ' filled' : ''}${isCorrect ? ' correct' : ''}${errorClass ? ' ' + errorClass : ''}`}
                    onClick={() => handleSlotClick(index)}
                  >
                    {isFilled && <span className="dropped-letter">{droppedLetters[index]}</span>}
                  </div>
                );
              })}
            </div>
            {/* Small error line below slots */}
            {showError && !isCorrect && (
              <div className="spelling-error-line">{t('englishWordsSpell.spellingError')}</div>
            )}
          </div>

          {/* Selectable Letters */}
          <div className="letters-container">
            <div className="letters-grid">
              {shuffledLetters.map((letterObj, index) => (
                <div
                  key={`${letterObj.letter}-${index}`}
                  className={`selectable-letter${letterObj.selected ? ' disabled' : ''}`}
                  style={{ backgroundColor: letterObj.selected ? '#ccc' : letterObj.color }}
                  onClick={() =>
                    !letterObj.selected &&
                    handleLetterSelect(letterObj.letter, index, letterObj.color)
                  }
                  role="button"
                  tabIndex={letterObj.selected ? -1 : 0}
                  aria-label={`${t('englishWordsSpell.selectLetter')}${letterObj.letter}`}
                  aria-disabled={letterObj.selected}
                >
                  {letterObj.letter}
                </div>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="game-controls">
            <button
              className="level-btn btn-complex"
              onClick={handleHint}
              aria-label={t('englishWordsSpell.getHint')}
              disabled={isCorrect}
            >
              {t('englishWordsSpell.hint')}
            </button>

            <button
              className="level-btn btn-easy"
              onClick={handleReset}
              aria-label={t('englishWordsSpell.resetWord')}
              disabled={isCorrect}
            >
              {t('common.actions.reset')}
            </button>
          </div>
        </div>
        {/* Hint Display */}
        {showHint && (
          <div className="hint-overlay" onClick={() => setShowHint(false)}>
            <div className="hint-display" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-label={t('common.close')}
                onClick={() => setShowHint(false)}
                className="close-button btn btn-link"
              >
                X
              </button>
              <p className="hint-text">
                {t('englishWordsSpell.theWordIsHint')} <strong>{currentWord.word}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isCorrect && (
          <SuccessModal
            handleClose={handleSuccessClose}
            message=""
            starsWon={1}
            skipStarAward={isAlreadyCompleted}
          />
        )}
      </main>
    </div>
  );
};

export default EnglishWordsSpell;
