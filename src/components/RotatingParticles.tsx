import React, { useMemo } from 'react';
import '../styles/RotatingParticles.scss';

interface RotatingParticlesProps {
  rotation: number;
  isSpinning: boolean;
}

const RotatingParticles: React.FC<RotatingParticlesProps> = ({ isSpinning }) => {
  const particles = useMemo(() => {
    const count = 40; // Increased count for more variety
    const icons = ['✨', '⭐', '🌟'];

    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 1.5 + 1,
      // Select a random emoji for EACH particle
      emoji: icons[Math.floor(Math.random() * icons.length)],
      // Starting angle
      angle: Math.random() * 360,
      // Staggered entry
      delay: Math.random() * 1.5,
      // Random speed for spiraling
      speed: 4 + Math.random() * 4,
    }));
  }, [isSpinning]);

  if (!isSpinning) return null;

  return (
    <div className="spiral-particles-overlay">
      {particles.map((p) => (
        <div
          key={p.id}
          className="spiral-wrapper"
          style={
            {
              '--start-angle': `${p.angle}deg`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.speed}s`,
            } as any
          }
        >
          <div
            className="spiral-particle"
            style={
              {
                fontSize: `${p.size}rem`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.speed}s`,
              } as any
            }
          >
            {p.emoji}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RotatingParticles;
