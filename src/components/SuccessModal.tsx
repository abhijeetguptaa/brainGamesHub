import { useEffect, useState, useRef } from 'react';
import { speakText, playTapSound, playApplauseSound } from '../utils/soundUtils';
import '../styles/SuccessModal.scss';
import { useTranslation } from 'react-i18next';
import useStarStore from '../store/useStarStore';
import { trackStarsEarned, setScreen } from '../utils/analytics';
import { useSparkleBurst } from '../hooks/useSparkleBurst';
import { getRandomItem } from '../utils/utils';
import { IS_TEST_MODE } from '../constants/appConstants';
import FlyingStars from './FlyingStars';
import SuccessModalPetals from './SuccessModalPetals';
import { showSafeInterstitial } from '../utils/admob';

const SuccessModal = ({
  handleClose,
  message = '',
  starsWon = 1,
  children,
  skipStarAward = false,
  incorrectQuestions = [],
  showNewGame = false,
  onNewGame,
  bestTime = null,
  isNewBestTime = false,
  disableAds = false,
}: any) => {
  const { t } = useTranslation();
  const { addStar } = useStarStore();
  const hasAwardedStars = useRef(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();
  const [showMistakes, setShowMistakes] = useState(false);

  // TRIGGER INTERSTITIAL AD (Safe Moment: Success Modal Dismissal)
  // & APPLAUSE SOUND (Safe Moment: Success Modal Display)
  useEffect(() => {
    setScreen('SuccessModal');
    playApplauseSound();

    const usageCount = Number(localStorage.getItem('usageCount') || 0) + 1;
    localStorage.setItem('usageCount', usageCount.toString());
    const hasRated = localStorage.getItem('hasRated') === 'true';
    const isRandomChancePassed = Math.random() > 0.9;

    if (!IS_TEST_MODE && !hasRated && usageCount >= 5 && isRandomChancePassed) {
      setShouldShowRateUs(true);
    }
  }, []);

  const [applauseText] = useState(() => {
    const list: any = t('common.feedback.successMsg', { returnObjects: true });
    return getRandomItem(list);
  });

  const [shouldShowRateUs, setShouldShowRateUs] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [animationData, setAnimationData] = useState<{
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!hasSpoken.current) {
      speakText(applauseText);
      hasSpoken.current = true;
    }
  }, [applauseText]);

  useEffect(() => {
    if (starsWon > 0 && !hasAwardedStars.current && !skipStarAward) {
      trackStarsEarned(starsWon, message || t('common.done'));
      hasAwardedStars.current = true;

      // Initial big burst in center
      triggerSparkleBurst(window.innerWidth / 2, window.innerHeight / 2, {
        count: 30,
        range: 400,
      });
    }
  }, [starsWon, triggerSparkleBurst, message, skipStarAward]);

  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    if (showMistakes || isClosing || animationData) {
      return;
    }

    let accumulated = 0;
    let lastFrameTime = performance.now();
    const tick = (now: number) => {
      accumulated += now - lastFrameTime;
      lastFrameTime = now;

      if (accumulated >= 1000) {
        const steps = Math.floor(accumulated / 1000);
        accumulated -= steps * 1000;
        setTimeLeft((prev) => {
          const next = Math.max(0, prev - steps);
          if (next === 0) {
            handleCloseClick();
          }
          return next;
        });
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    };
  }, [showMistakes, isClosing, animationData]);

  const handleRateUs = () => {
    window.open(
      'https://play.google.com/store/apps/details?id=com.alphagaming.brainGamesHub',
      '_blank',
    );
  };

  const runPendingAction = () => {
    setIsClosing(true);
    const action = pendingActionRef.current ?? handleClose;
    pendingActionRef.current = null;
    action();
  };

  const startExitFlow = (action: () => void, { showAd = false } = {}) => {
    if (isClosing || animationData) return;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);

    pendingActionRef.current = action;

    if (showAd && !disableAds) {
      showSafeInterstitial();
    }

    if (starsWon > 0 && !skipStarAward) {
      setAnimationData({
        count: starsWon,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      return;
    }

    runPendingAction();
  };

  const handleCloseClick = () => {
    startExitFlow(handleClose, { showAd: true });
  };

  const handleNewGameClick = () => {
    startExitFlow(onNewGame || handleClose);
  };

  return (
    <div className={`success-overlay ${animationData ? 'transparent-overlay' : ''}`}>
      {animationData && (
        <div className="success-collection-logo">
          <img src="/logo_fg.webp" alt="Game Logo" />
        </div>
      )}
      {animationData && (
        <FlyingStars
          count={animationData.count}
          startX={animationData.x}
          startY={animationData.y}
          onComplete={runPendingAction}
          onStarArrived={() => {
            addStar();
            playTapSound();
          }}
        />
      )}
      {!animationData && <SuccessModalPetals />}
      <SparkleRenderer />
      <div
        className={`success-message ${animationData ? 'opacity-0' : ''} ${showMistakes ? 'show-mistakes-mode' : ''} ${shouldShowRateUs && !showMistakes ? 'has-rate-us' : ''}`}
      >
        {!showMistakes ? (
          <>
            <div className="success-content-wrapper">
              <div className="success-main-info">
                <h2 className="applause">
                  {applauseText.split('').map((letter: any, index: number) => (
                    <span
                      key={index}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      className="letter"
                    >
                      {letter === ' ' ? '\u00A0' : letter}
                    </span>
                  ))}
                </h2>
                <p className="success-desc">{message}</p>
                {isNewBestTime && (
                  <div className={`best-time-modal ${isNewBestTime ? 'new-best' : ''}`}>
                    <span>{t('common.newBestTime')}:</span>
                    <span className="time-value">{bestTime}s</span>
                  </div>
                )}
                <div className="success-stars">
                  <span>
                    {Array(starsWon > 5 ? 5 : starsWon)
                      .fill('⭐')
                      .join('')}
                  </span>
                </div>

                <div className="success-actions">
                  {showNewGame && (
                    <button className="new-game-button" onClick={handleNewGameClick}>
                      🎮 {t('common.newGame')}
                    </button>
                  )}

                  {incorrectQuestions.length > 0 && (
                    <button className="show-mistakes-toggle" onClick={() => setShowMistakes(true)}>
                      📋 {t('questionBox.showMistakes')} ({incorrectQuestions.length})
                    </button>
                  )}
                </div>
              </div>

              {children && <div className="success-children-column">{children}</div>}
            </div>

            {shouldShowRateUs && (
              <div className="rate-us-section">
                <p className="rate-us-text">{t('successModal.rateUsPrompt')}</p>
                <button
                  type="button"
                  className="level-btn btn-hard"
                  disabled={isClosing}
                  onClick={() => {
                    debugger;
                  }}
                >
                  {t('successModal.rateNow')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mistakes-container">
            <h3>{t('questionBox.showMistakes')}</h3>
            <div className="mistakes-list">
              {incorrectQuestions.map((item: any, index: number) => (
                <div key={index} className="incorrect-question-item">
                  <div className="incorrect-question-text">
                    <strong>{t('questionBox.question')}</strong> {item.question}
                  </div>
                  <div className="incorrect-answer">
                    <strong>{t('questionBox.selectedAnswer')}</strong>{' '}
                    <span>{item.userAnswer}</span>
                  </div>
                  <div className="correct-answer">
                    <strong>{t('questionBox.correctAnswer')}</strong>{' '}
                    <span>{item.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="nav-button nav-button--back mx-auto mb-4"
              onClick={() => setShowMistakes(false)}
            >
              <span className="text-white text-2xl rotate-180">➜</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="close-button"
          aria-label={t('common.close')}
          onClick={handleCloseClick}
          disabled={isClosing}
        >
          <div className="close-timer-ring">
            <svg viewBox="0 0 36 36">
              <path
                className="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="ring-fg"
                strokeDasharray={`${(timeLeft / 5) * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="close-x">✕</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
