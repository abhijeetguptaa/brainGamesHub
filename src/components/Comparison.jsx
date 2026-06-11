import React, { useEffect } from 'react';
import MathExercise from './MathExercise';
import { setScreen } from '../utils/analytics';

export default function Comparison() {
  useEffect(() => {
    setScreen('ComparisonGame');
  }, []);

  return <MathExercise operator="Comparison" />;
}
