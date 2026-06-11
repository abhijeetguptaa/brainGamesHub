import React, { useEffect } from 'react';
import MathExercise from './MathExercise';
import { setScreen } from '../utils/analytics';

export default function Multiplication() {
  useEffect(() => {
    setScreen('MultiplicationGame');
  }, []);

  return <MathExercise operator="Multiplication" />;
}
