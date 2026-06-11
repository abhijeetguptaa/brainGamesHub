import { useEffect, useState } from 'react';
import { speakText } from '../utils/soundUtils';
import '../styles/looseModal.scss';
import { useTranslation } from 'react-i18next';
// import { showSafeRewarded, getRewardedCooldown, MIN_TIME_BETWEEN_REWARDED } from '../utils/admob.js';
import { Toast } from '@capacitor/toast';
import { setScreen } from '../utils/analytics';
import useStarStore from '../store/useStarStore';

const LooseModal = ({
  handleClose,
  message = '',
  onWatchAdReward,
  incorrectQuestions = [],
  showNewGame = false,
  onNewGame,
  isTinySteps = false,
  onSkipTask,
}: any) => {
  const { t } = useTranslation();
  const { stars, spendStars } = useStarStore();
  const [isSpendingStars, setIsSpendingStars] = useState(false);
  // const [isAdLoading, setIsAdLoading] = useState(false);
  // const [cooldown, setCooldown] = useState(0);
  const [showMistakes, setShowMistakes] = useState(false);
  const [applauseText] = useState(() => {
    const list: any = t('common.feedback.looseMsg', { returnObjects: true });
    return list[Math.floor(Math.random() * list.length)];
  });

  useEffect(() => {
    setScreen('LooseModal');
    speakText(applauseText);

    // const initialCooldown = getRewardedCooldown();
    // if (initialCooldown > 0) {
    //   setCooldown(initialCooldown);
    // }
  }, [applauseText]);

  /*
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);
  */

  const handleSpendStars = async () => {
    if (isSpendingStars) return;
    if (stars < 100) {
      await Toast.show({
        text: t('unlockModal.notEnoughCoins'),
      });
      return;
    }

    setIsSpendingStars(true);
    try {
      const success = spendStars(100);
      if (success) {
        if (onWatchAdReward) {
          onWatchAdReward();
        }
        if (isTinySteps && onSkipTask) {
          onSkipTask();
        }
        await Toast.show({
          text: t('unlockModal.featureUnlocked'),
        });
      }
    } catch (err) {
      console.error('Failed to spend stars:', err);
    } finally {
      setIsSpendingStars(false);
    }
  };

  /*
  const handleGoogleAd = async () => {
    if (isAdLoading || cooldown > 0) return;
    setIsAdLoading(true);

    try {
      await showSafeRewarded(); // show rewarded ad first
      if (onWatchAdReward) {
        onWatchAdReward();
      }
      if (isTinySteps && onSkipTask) {
        onSkipTask();
      }
      await Toast.show({
        text: t('unlockModal.featureUnlocked'),
      });
      // After success, start cooldown manually to show it immediately
      setCooldown(MIN_TIME_BETWEEN_REWARDED / 1000); 
    } catch (err: any) {
      console.log('Ad failed or skipped:', err);
      const errorCode = err.code || '';
      const errorMessage =
        err.code === 'REWARDED_NOT_EARNED'
          ? t('unlockModal.watchFullAd')
          : t('unlockModal.adFailed', { code: errorCode });

      await Toast.show({
        text: errorMessage,
      });

      // If ad failed due to cooldown or not ready, update local cooldown
      const currentCooldown = getRewardedCooldown();
      if (currentCooldown > 0) {
        setCooldown(currentCooldown);
      }
    } finally {
      setIsAdLoading(false);
    }
  };
  */

  const handleNewGameClick = () => {
    if (onNewGame) onNewGame();
  };

  return (
    <div className="loose-overlay">
      <div className={`loose-message ${showMistakes ? 'show-mistakes-mode' : ''}`}>
        {!showMistakes ? (
          <>
            <div className="loose-icon">💡</div>
            <h2>{applauseText}</h2>
            <p>{message}</p>

            <div className="loose-stars">
              <span>🌟🌟🌟</span>
            </div>

            <div className="loose-actions">
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

            {onWatchAdReward && (
              <div className="ad-reward-container">
                <button
                  onClick={handleSpendStars}
                  className="ad-reward-button"
                  disabled={isSpendingStars}
                >
                  🌟 {isSpendingStars ? t('unlockModal.loadingAd') : 
                      `${t('common.actions.watchAdReward')} (100 🌟)`}
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
          onClick={handleClose}
          disabled={isSpendingStars}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default LooseModal;

