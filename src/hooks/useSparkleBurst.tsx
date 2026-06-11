import React, { useState, useCallback, useEffect, memo } from 'react';
import { playSparklePop } from '../utils/soundUtils';

export interface Sparkle {
  id: number;
  x: number;
  y: number;
  dx: string;
  dy: string;
  color: string;
  char: string;
}

const SPARKLE_CHARS = ['✦', '✭', '✨', '⚡', '🎉'];
const SPARKLE_EVENT = 'skl_trigger_sparkle';
let sparkleIdCounter = 0;

export const SparkleRenderer = memo(() => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      const { x, y, options } = e.detail;
      if (!options.silent) {
        playSparklePop();
      }

      const newSparkles = Array.from({ length: options.count }).map(() => ({
        id: ++sparkleIdCounter,
        x,
        y,
        dx: `${(Math.random() - 0.5) * options.range}px`,
        dy: `${(Math.random() - 0.5) * options.range}px`,
        color: options.color || `hsl(${Math.random() * 360}, 100%, 70%)`,
        char: SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)],
      }));

      setSparkles((prev) => [...prev, ...newSparkles]);

      // Batch remove the entire burst after animation finishes (usually 1s)
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => !newSparkles.find((ns) => ns.id === s.id)));
      }, 1200);
    };

    window.addEventListener(SPARKLE_EVENT, handleTrigger);
    return () => {
      window.removeEventListener(SPARKLE_EVENT, handleTrigger);
    };
  }, []);

  return (
    <>
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle"
          style={
            {
              left: s.x,
              top: s.y,
              '--dx': s.dx,
              '--dy': s.dy,
              '--sparkle-color': s.color,
            } as React.CSSProperties
          }
        >
          {s.char}
        </div>
      ))}
    </>
  );
});

export function useSparkleBurst() {
  const triggerSparkleBurst = useCallback(
    (
      x: number,
      y: number,
      options: { count: number; range: number; color?: string; silent?: boolean } = {
        count: 12,
        range: 150,
      },
    ) => {
      const event = new CustomEvent(SPARKLE_EVENT, { detail: { x, y, options } });
      window.dispatchEvent(event);
    },
    [],
  );

  return { triggerSparkleBurst, SparkleRenderer };
}
