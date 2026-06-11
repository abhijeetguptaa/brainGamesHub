import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStarStore from '../store/useStarStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import '../styles/SpinWheel.scss';
import FlyingStars from './FlyingStars';
import RotatingParticles from './RotatingParticles';
import {
  playWheelSpinSound,
  playWinFreeSpinSound,
  playMultiplierRevealSound,
  playMultiplierWinSound,
} from '../utils/soundUtils';
import { useSpinWheel } from '../hooks/useSpinWheel';
import { useSparkleBurst } from '../hooks/useSparkleBurst';
import { COLORING_CONFIG } from '../constants/coloringConstants';
import { getRandomInt } from '../utils/utils';
import { useNavigate } from 'react-router-dom';
import { setScreen } from '../utils/analytics';

interface WheelOption {
  label: string;
  reward: number;
  type: 'tryAgain' | 'oneMoreChance' | 'stars';
  icon: string;
}

const SpinWheel: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    setScreen('SpinWheelGame');
  }, []);

  const addStar = useStarStore((state) => state.addStar);
  const openModal = useUnlockModalStore((state) => state.openModal);
  const { spinsLeft, decrementSpins, incrementSpins, resetSpins } = useSpinWheel();
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  const [resultMessage, setResultMessage] = useState('');
  const [activeMultiplier, setActiveMultiplier] = useState<number | null>(null);
  const [animationData, setAnimationData] = useState<{
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const wheelInnerRef = useRef<HTMLDivElement>(null);
  const pendingRotationRef = useRef<number | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const options: WheelOption[] = useMemo(
    () => [
      { label: t('spinWheel.options.tryAgain'), reward: 0, type: 'tryAgain', icon: '😢' },
      { label: t('spinWheel.options.oneMoreChance'), reward: 0, type: 'oneMoreChance', icon: '😊' },
      { label: t('spinWheel.options.1star'), reward: 1, type: 'stars', icon: '🐰' },
      { label: t('spinWheel.options.2stars'), reward: 2, type: 'stars', icon: '🦊' },
      { label: t('spinWheel.options.3stars'), reward: 3, type: 'stars', icon: '🐱' },
      { label: t('spinWheel.options.5stars'), reward: 5, type: 'stars', icon: '🐘' },
    ],
    [t],
  );

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      pendingRotationRef.current = null;
    };
  }, []);

  const spin = () => {
    if (isSpinning) return;

    if (spinsLeft <= 0) {
      setIsAutoplay(false);
      openModal(t('spinWheel.title'), 10, () => {
        resetSpins(5);
      });
      return;
    }

    setResultMessage(null);
    setActiveMultiplier(null);
    setIsSpinning(true);
    decrementSpins();
    playWheelSpinSound();

    const extraRounds = getRandomInt(5, 10);
    const randomDegree = getRandomInt(0, 359);
    const newRotation = rotation + extraRounds * 360 + randomDegree;

    pendingRotationRef.current = newRotation;
    setRotation(newRotation);
  };

  useEffect(() => {
    if (isAutoplay && !isSpinning && !resultMessage) {
      spin();
    }
  }, [isAutoplay, isSpinning, spinsLeft, resultMessage]);

  const handleWheelTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;

    const pendingRotation = pendingRotationRef.current;
    if (pendingRotation == null) return;

    const actualDegree = pendingRotation % 360;
    const segmentCount = options.length;
    const segmentSize = 360 / segmentCount;

    const index = Math.floor(((360 - (actualDegree % 360)) % 360) / segmentSize);
    const result = options[index];

    handleResult(result);
    setIsSpinning(false);
    pendingRotationRef.current = null;
  };

  const handleResult = (result: WheelOption) => {
    let multiplier = 1;
    let finalReward = result.reward;

    if (result.type === 'stars' && Math.random() < 0.6) {
      const multipliers = [2, 2, 2, 3, 3, 5, 4];
      multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
      finalReward = result.reward * multiplier;
      setActiveMultiplier(multiplier);
      playMultiplierWinSound();
    } else {
      setActiveMultiplier(null);
    }

    const message =
      result.type === 'tryAgain'
        ? t('spinWheel.tryAgainMessage')
        : result.type === 'oneMoreChance'
          ? t('spinWheel.oneMoreChanceWin')
          : multiplier > 1
            ? t('spinWheel.winMessageWithMultiplier', {
                reward: result.label,
                multiplier: multiplier,
                total: finalReward,
              })
            : t('spinWheel.winMessage', { reward: result.label });

    setResultMessage(message);

    if (result.type !== 'tryAgain') {
      if (wheelRef.current) {
        const rect = wheelRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        triggerSparkleBurst(centerX, centerY, {
          count: COLORING_CONFIG.SPARKLE_COUNT * (multiplier > 1 ? 2 : 1),
          range: COLORING_CONFIG.SPARKLE_RANGE * (multiplier > 1 ? 1.5 : 1),
        });

        if (result.type === 'stars') {
          setAnimationData({
            count: finalReward,
            x: centerX,
            y: centerY,
          });
        }
      }
    }

    if (result.type === 'oneMoreChance') {
      incrementSpins();
      playWinFreeSpinSound();
    }

    // Auto hide message after 3 seconds
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => {
      setResultMessage(null);
      setActiveMultiplier(null);
    }, 3000);
  };

  const onAnimationComplete = () => {
    setAnimationData(null);
  };

  const onStarArrived = () => {
    addStar();
  };

  return (
    <div className="spin-wheel-container">
      <RotatingParticles rotation={rotation} isSpinning={isSpinning} />
      {animationData && (
        <FlyingStars
          count={animationData.count}
          startX={animationData.x}
          startY={animationData.y}
          onComplete={onAnimationComplete}
          onStarArrived={onStarArrived}
        />
      )}

      <div className="wheel-wrapper" ref={wheelRef} onClick={spin}>
        <div className="wheel-pointer"></div>
        <div
          className={`wheel ${isAutoplay ? 'is-autoplay' : ''}`}
          ref={wheelInnerRef}
          onTransitionEnd={handleWheelTransitionEnd}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {options.map((option, index) => (
            <div key={index} className="segment">
              <div className="segment-content">
                <span className="character-icon">{option.icon}</span>
                {option.type === 'stars' ? (
                  <span className="star-reward">
                    {Array.from({ length: option.reward }).map((_, i) => (
                      <span key={i} className="star-icon">
                        ⭐
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="option-label">{option.label}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className="center-button" disabled={isSpinning}>
          <div className="center-content">
            <span className="center-icon">{spinsLeft}</span>
          </div>
        </button>
      </div>

      <div className={`spin-result-message ${resultMessage ? 'visible' : ''}`}>
        {resultMessage && (
          <div className="result-content">
            <p>{resultMessage}</p>
            {activeMultiplier && (
              <div className="multiplier-badge">
                <span>Bonus</span> x{activeMultiplier}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className={`autoplay-button ${isAutoplay ? 'active' : ''}`}
        onClick={() => setIsAutoplay(!isAutoplay)}
      >
        {isAutoplay ? '🛑' : '🔄'}{' '}
        {isAutoplay ? t('spinWheel.stopAutoplay') : t('spinWheel.autoplay')}
      </button>

      <SparkleRenderer />
    </div>
  );
};

export default SpinWheel;
