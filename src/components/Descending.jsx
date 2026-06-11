import React, { useEffect } from 'react';
import MathExercise from './MathExercise';
import { setScreen } from '../utils/analytics';

export default function Descending() {
  useEffect(() => {
    setScreen('DescendingGame');
  }, []);

  return <MathExercise operator="Descending" />;
}
