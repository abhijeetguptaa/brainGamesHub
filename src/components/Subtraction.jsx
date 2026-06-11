import React, { useEffect } from 'react';
import MathExercise from './MathExercise';
import { setScreen } from '../utils/analytics';

export default function Subtraction() {
  useEffect(() => {
    setScreen('SubtractionGame');
  }, []);

  return <MathExercise operator="Subtraction" />;
}
