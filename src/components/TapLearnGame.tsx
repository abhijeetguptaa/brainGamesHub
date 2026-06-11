import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { playApplauseSound, playIncorrectSound, speakText } from '../utils/soundUtils';
import { CATEGORY_COLORS, getCategoryColor } from '../constants/colors';
import { GameType, TapLearnOption } from '../data/tapLearnData';
import SuccessModal from './SuccessModal';
import { showSafeInterstitial } from '../utils/admob';
import './TapLearnGame.scss';
import { FcUndo } from 'react-icons/fc';
import { useSparkleBurst } from '@/hooks/useSparkleBurst';

import { useLearningPathStore } from '../store/useLearningPathStore';
import { useLocation } from 'react-router-dom';
import { finishLearningPathTask, isLearningPathTaskActive } from '../utils/learningPathUtils';

interface TapLearnGameProps {
  gameType: GameType;
  data: TapLearnOption[];
}

const gameTypeToIndex: Record<string, number> = {
  alphabets: 0,
  counting: 1,
  farmAnimals: 2,
  wildAnimals: 3,
  seaAnimals: 4,
  insects: 5,
  colors: 6,
  vegetables: 7,
  fruits: 8,
  vehicles: 9,
  food: 10,
  instruments: 11,
  shapes: 12,
};

const TapLearnGame: React.FC<TapLearnGameProps> = ({ gameType, data }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const categoryColor = getCategoryColor(gameTypeToIndex[gameType] ?? 0);

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

  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem(`tapLearn_index_${gameType}`);
    return saved ? parseInt(saved, 10) % data.length : 0;
  });

  useEffect(() => {
    const handleTrigger = () => {
      if (isLearningPathTask) {
        setShowSuccessModal(true);
      }
    };
    window.addEventListener('trigger-task-completion', handleTrigger);
    return () => window.removeEventListener('trigger-task-completion', handleTrigger);
  }, [isLearningPathTask]);

  const [question, setQuestion] = useState<TapLearnOption | null>(null);
  const [options, setOptions] = useState<TapLearnOption[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [wrongId, setWrongId] = useState<string | number | null>(null);
  const [isEmojiVisible, setIsEmojiVisible] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const pendingPostEmojiActionRef = useRef<(() => void) | null>(null);
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const getOptionLabel = useCallback(
    (option: TapLearnOption) =>
      t(`tapLearn.items.${gameType}.${String(option.id)}`, { defaultValue: option.label }),
    [gameType, t],
  );

  const generateQuestion = useCallback(() => {
    if (!data || data.length === 0) return;

    const pool = data;
    const correct = pool[currentIndex % pool.length];

    // Pick 3 random distractors
    const distractors = pool
      .filter((item) => item.id !== correct.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allOptions = [correct, ...distractors].sort(() => 0.5 - Math.random());

    setQuestion(correct);
    setOptions(allOptions);
    setFeedback(null);
    setWrongId(null);
    setIsEmojiVisible(false);
    setIsAnswerCorrect(null);
    speakText(getOptionLabel(correct));
  }, [data, currentIndex, getOptionLabel]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  useEffect(() => {
    return () => {
      import('../utils/soundUtils').then(({ stopSpeech }) => {
        stopSpeech();
      });
    };
  }, []);

  useEffect(() => {
    if (!isEmojiVisible || !isAnswerCorrect) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      triggerSparkleBurst(window.innerWidth / 2, window.innerHeight / 2, {
        count: 48,
        range: 240,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isEmojiVisible, isAnswerCorrect, triggerSparkleBurst]);

  const handleTap = (option: TapLearnOption) => {
    if (feedback === 'correct') return;

    const isCorrect = option.id === question?.id;
    setIsAnswerCorrect(isCorrect);
    setIsEmojiVisible(true);

    if (isCorrect) {
      setFeedback('correct');
      playApplauseSound();
      pendingPostEmojiActionRef.current = () => {
        // Show ad every 6th correct answer, unless it's the last question (modal handles that)
        const showAds = (currentIndex + 1) % 6 === 0;

        const isLast = isLearningPathTask
          ? currentIndex >= (currentActiveTask?.targetScore || data.length) - 1
          : currentIndex === data.length - 1;

        if (showAds && !isLast) {
          showSafeInterstitial();
        }

        if (isLast) {
          setShowSuccessModal(true);
          localStorage.setItem(`tapLearn_index_${gameType}`, '0');
        } else {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          localStorage.setItem(`tapLearn_index_${gameType}`, String(nextIndex));
        }
      };
    } else {
      setFeedback('wrong');
      setWrongId(option.id);
      playIncorrectSound();
      pendingPostEmojiActionRef.current = () => {
        setFeedback(null);
        setWrongId(null);
        setIsEmojiVisible(false);
      };
    }
  };

  const handleEmojiAnimationEnd = () => {
    setIsEmojiVisible(false);
    const action = pendingPostEmojiActionRef.current;
    pendingPostEmojiActionRef.current = null;
    action?.();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    localStorage.setItem(`tapLearn_index_${gameType}`, '0');
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (isLearningPathTask) {
      finishLearningPathTask({
        currentActiveTask,
        completeTask,
        setActiveTask,
        navigate,
      });
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

  if (!question) return null;

  const isColorGame = gameType === 'colors';
  const isTextGame = ['letters', 'numbers'].includes(gameType);
  const targetTotal = isLearningPathTask ? currentActiveTask?.targetScore || data.length : data.length;

  return (
    <div className="app-container tap-learn-game">
      <div className="playful-background">
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
      </div>

      <div className="game-progress">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / targetTotal) * 90}%` }}
        ></div>
        <div className="progress-info">
          <span className="progress-text">
            {currentIndex + 1} / {targetTotal}
          </span>
          <button
            className="reset-game-btn"
            onClick={handleReset}
            title={t('common.actions.reset')}
          >
            <FcUndo />
          </button>
        </div>
      </div>

      <div className="emoji-container">
        {isEmojiVisible && (
          <span className="emoji-animation" onAnimationEnd={handleEmojiAnimationEnd}>
            {isAnswerCorrect ? '😃' : '😢'}
          </span>
        )}
      </div>

      <SparkleRenderer />

      <h2 className="activity-title text-on-blue-BG">
        {isColorGame ? (
          <>
            <span
              style={{ color: question.value, cursor: 'pointer' }}
              onClick={() => speakText(getOptionLabel(question))}
            >
              {getOptionLabel(question)}
            </span>
          </>
        ) : (
          <>
            <span
              className="highlight"
              style={{
                color: !isTextGame ? question.color : undefined,
                cursor: 'pointer',
              }}
              onClick={() => speakText(getOptionLabel(question))}
            >
              {getOptionLabel(question)}
            </span>
          </>
        )}
      </h2>

      <div className="quiz-wrapper">
        <div className="options-grid">
          {options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleTap(option)}
              disabled={feedback === 'correct'}
              style={{
                backgroundColor: isColorGame
                  ? option.value
                  : isTextGame
                    ? CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                    : 'transparent',
                borderColor: categoryColor,
                boxShadow: `0 8px 0 ${categoryColor}44`, // semi-transparent shadow
              }}
              className={`
              option-button
              ${!isColorGame && !isTextGame ? 'is-emoji' : ''}
            `}
            >
              <span
                className={`option-content
                ${feedback === 'correct' && option.id === question.id ? 'animate-success' : ''}
                ${wrongId === option.id ? 'animate-shake' : ''}
              `}
                style={{
                  color: !isColorGame && !isTextGame ? (option.color ?? undefined) : undefined,
                }}
              >
                {isColorGame ? '' : isTextGame ? getOptionLabel(option) : option.value}
              </span>
            </button>
          ))}
        </div>
      </div>

      {showSuccessModal && (
        <SuccessModal handleClose={handleSuccessModalClose} message="" starsWon={isLearningPathTask ? 1 : 5} />
      )}
    </div>
  );
};

export default TapLearnGame;
