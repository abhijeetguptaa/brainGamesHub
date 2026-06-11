import React, { useEffect } from 'react';
import MathExercise from './MathExercise';
import { setScreen } from '../utils/analytics';

export default function Division() {
  useEffect(() => {
    setScreen('DivisionGame');
  }, []);

  return <MathExercise operator="Division" />;
}
