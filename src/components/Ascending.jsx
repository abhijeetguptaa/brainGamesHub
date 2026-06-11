import React, { useEffect } from 'react';
import MathExercise from './MathExercise';
import { setScreen } from '../utils/analytics';

export default function Ascending() {
  useEffect(() => {
    setScreen('AscendingGame');
  }, []);

  return <MathExercise operator="Ascending" />;
}
