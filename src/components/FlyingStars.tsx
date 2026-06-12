import React, { useEffect, useState, useRef } from 'react';
import { playSparklePop } from '../utils/soundUtils';
import '../styles/FlyingStars.scss';

interface Star {
  id: number;
  startX: number;
  startY: number;
  delayMs: number;
}

interface FlyingStarsProps {
  count: number;
  startX: number;
  startY: number;
  onComplete: () => void;
  onStarArrived: () => void;
}

let flyingStarIdCounter = 0;

const FlyingStars: React.FC<FlyingStarsProps> = ({
  count,
  startX,
  startY,
  onComplete,
  onStarArrived,
}) => {
  const [stars, setStars] = useState<Star[]>([]);
  const arrivedCountRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    arrivedCountRef.current = 0;
    completedRef.current = false;

    if (count <= 0) {
      onComplete();
      return;
    }

    const newStars = Array.from({ length: count }).map((_, index) => ({
      id: ++flyingStarIdCounter,
      startX,
      startY,
      delayMs: index * 100,
    }));

    setStars(newStars);
    playSparklePop();

    return () => {
      setStars([]);
    };
  }, [count, startX, startY]);

  const handleStarEnd = (starId: number) => {
    setStars((current) => current.filter((star) => star.id !== starId));
    onStarArrived();
    arrivedCountRef.current += 1;

    if (arrivedCountRef.current === count && !completedRef.current) {
      completedRef.current = true;
      requestAnimationFrame(onComplete);
    }
  };

  return (
    <div className="flying-stars-overlay">
      {stars.map((star) => (
        <div
          key={star.id}
          className="flying-star"
          onAnimationEnd={() => handleStarEnd(star.id)}
          style={
            {
              '--start-x': `${star.startX}px`,
              '--start-y': `${star.startY}px`,
              animationDelay: `${star.delayMs}ms`,
              '--target-x': `${window.innerWidth - 60}px`,
              '--target-y': `${20}px`,
            } as React.CSSProperties
          }
        >
          ⭐
        </div>
      ))}
    </div>
  );
};

export default FlyingStars;
