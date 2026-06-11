import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/MentalMathTimer.scss';

interface MentalMathTimerProps {
  isRunning: boolean;
  onTimeUpdate?: (time: number) => void;
  complexity: string;
  isCompleted: boolean;
}

const MentalMathTimer: React.FC<MentalMathTimerProps> = ({
  isRunning,
  onTimeUpdate,
  complexity,
  isCompleted,
}) => {
  const { t } = useTranslation();
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const onTimeUpdateRef = useRef<typeof onTimeUpdate>(onTimeUpdate);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // Load best time from localStorage only for display
  useEffect(() => {
    const storedBest = localStorage.getItem(`mental_math_best_time_${complexity}`);
    if (storedBest) {
      setBestTime(parseFloat(storedBest));
    } else {
      setBestTime(null);
    }
    setTime(0);
  }, [complexity]);

  // Sync with parent's completion (to show the final best time if it was updated)
  useEffect(() => {
    if (isCompleted) {
      const storedBest = localStorage.getItem(`mental_math_best_time_${complexity}`);
      if (storedBest) {
        setBestTime(parseFloat(storedBest));
      }
    }
  }, [isCompleted, complexity]);

  useEffect(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    accumulatorRef.current = 0;

    if (isRunning && !isCompleted) {
      let lastFrameTime = performance.now();
      const tick = (now: number) => {
        const delta = now - lastFrameTime;
        lastFrameTime = now;
        accumulatorRef.current += delta;

        if (accumulatorRef.current >= 100) {
          const steps = Math.floor(accumulatorRef.current / 100);
          accumulatorRef.current -= steps * 100;
          setTime((prev) => {
            const nextTime = +(prev + steps * 0.1).toFixed(1);
            onTimeUpdateRef.current?.(nextTime);
            return nextTime;
          });
        }

        timerRef.current = requestAnimationFrame(tick);
      };

      timerRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning, isCompleted]);

  const formatTime = (seconds: number) => {
    return seconds.toFixed(1) + 's';
  };

  return (
    <div className="mental-math-timer-container">
      <div className="timer-display">{formatTime(time)}</div>
      {bestTime !== null && (
        <div className="best-time">
          🏆 {t('common.best', 'Best')}: <span className="time-value">{formatTime(bestTime)}</span>
        </div>
      )}
    </div>
  );
};

export default MentalMathTimer;
