import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MentalMathQuestionBox from './MentalMathQuestionBox';
import { setScreen } from '../utils/analytics';

const MentalMath = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('MentalMathGame');
  }, []);

  const { difficulty } = useParams();

  if (!difficulty) {
    return null; // Or handle redirect, but App.jsx should handle routing
  }

  return (
    <div className="app-container">
      <div className="quiz-wrapper MentalMath">
        <MentalMathQuestionBox complexity={difficulty} />
      </div>
    </div>
  );
};

export default MentalMath;
