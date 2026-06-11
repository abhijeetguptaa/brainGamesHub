import { useState, useEffect } from 'react';

const SPIN_WHEEL_LAST_DATE = 'spin_wheel_last_date';
const SPIN_WHEEL_SPINS_LEFT = 'spin_wheel_spins_left';
const DEFAULT_SPINS = 5;

export const useSpinWheel = () => {
  const [spinsLeft, setSpinsLeft] = useState<number>(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem(SPIN_WHEEL_LAST_DATE);
    const savedSpins = localStorage.getItem(SPIN_WHEEL_SPINS_LEFT);

    if (lastDate !== today) {
      return DEFAULT_SPINS;
    }
    return savedSpins !== null ? parseInt(savedSpins, 10) : DEFAULT_SPINS;
  });

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(SPIN_WHEEL_LAST_DATE, today);
    localStorage.setItem(SPIN_WHEEL_SPINS_LEFT, spinsLeft.toString());
  }, [spinsLeft]);

  const decrementSpins = () => {
    if (spinsLeft > 0) {
      setSpinsLeft((prev) => prev - 1);
    }
  };

  const incrementSpins = () => {
    setSpinsLeft((prev) => prev + 1);
  };

  const resetSpins = (amount: number = DEFAULT_SPINS) => {
    setSpinsLeft(amount);
  };

  return {
    spinsLeft,
    decrementSpins,
    incrementSpins,
    resetSpins,
  };
};
