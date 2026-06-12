import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useRetentionStore from '../store/useRetentionStore';
import useStarStore from '../store/useStarStore';
import { playTapSound, speakText } from '../utils/soundUtils';
import FlyingStars from './FlyingStars';
import '../styles/SuccessModal.scss'; // Reuse modal styles
import { logEvent } from '../utils/analytics';

const DailyBonusModal: React.FC = () => {
  const { t } = useTranslation();
  const { streakCount, bonusClaimedToday, claimBonus } = useRetentionStore();
  const { addStar } = useStarStore();
  const [show, setShow] = useState(false);
  const [animationData, setAnimationData] = useState<{
    count: number;
    x: number;
    y: number;
  } | null>(null);
  const claimButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Show modal if bonus not claimed today
    if (!bonusClaimedToday) {
      setShow(true);
    }
  }, [bonusClaimedToday, t]);

  const handleClaim = () => {
    const reward = 20 + streakCount * 2; // Base 20 + streak bonus

    logEvent('DailyBonusClaimed', {
      streak: streakCount,
      reward: reward,
    });

    if (claimButtonRef.current) {
      const rect = claimButtonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      setAnimationData({
        count: reward,
        x: centerX,
        y: centerY,
      });
    } else {
      // Fallback if ref is not available
      setAnimationData({
        count: reward,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }

    claimBonus();
    playTapSound();
  };

  const onAnimationComplete = () => {
    setAnimationData(null);
    setShow(false);
  };

  const onStarArrived = () => {
    addStar();
    playTapSound();
  };

  if (!show) return null;

  return (
    <>
      {animationData && (
        <FlyingStars
          count={animationData.count}
          startX={animationData.x}
          startY={animationData.y}
          onComplete={onAnimationComplete}
          onStarArrived={onStarArrived}
        />
      )}
      <div className={`success-overlay ${animationData ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className="success-message">
          <h2 className="applause">🎁 {t('retention.dailyBonus')}</h2>
          <div className="success-stars">
            <span>🔥</span>
            <span className="streak-count-text">
              {streakCount} {t('retention.dayStreak')}
            </span>
          </div>
          <p className="success-desc">{t('retention.claimMessage')}</p>

          <div className="flex flex-col gap-4 w-full">
            <button
              ref={claimButtonRef}
              className="btn-gradient-reward"
              onClick={handleClaim}
              disabled={!!animationData}
            >
              🎁 {t('retention.claimButton')} ⭐
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyBonusModal;
