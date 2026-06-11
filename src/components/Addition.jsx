import React, { useEffect } from 'react';
import MathExercise from './MathExercise';
import { setScreen } from '../utils/analytics';

export default function Addition() {
  useEffect(() => {
    setScreen('AdditionGame');
  }, []);

  return <MathExercise operator="Addition" />;
}
