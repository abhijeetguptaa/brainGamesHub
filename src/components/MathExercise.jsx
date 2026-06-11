import React from 'react';
import QuestionBox from './QuestionBox';
import { getRangeSetForOperator } from '../utils/utils.js';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { DIFFICULTY_LEVELS } from '../constants/appConstants';

export default function MathExercise({ operator }) {
  const { t } = useTranslation();
  const { difficulty } = useParams();

  const complexityOptions = getRangeSetForOperator(operator);

  const difficultyMap = {
    [DIFFICULTY_LEVELS.EASY]: t('common.levels.easy'),
    [DIFFICULTY_LEVELS.MEDIUM]: t('common.levels.medium'),
    [DIFFICULTY_LEVELS.HARD]: t('common.levels.hard'),
    [DIFFICULTY_LEVELS.COMPLEX]: t('common.levels.complex'),
  };

  const complexityLevelsMap = {
    [t('common.levels.easy')]: [complexityOptions[0]],
    [t('common.levels.medium')]: [complexityOptions[1]],
    [t('common.levels.hard')]: [complexityOptions[2]],
    [t('common.levels.complex')]: [complexityOptions[3]],
  };

  const currentLevelLabel = difficultyMap[difficulty] || t('common.levels.easy');
  const selectedComplexity = Number(complexityLevelsMap[currentLevelLabel][0].substring(1));
  const difficultyClass = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <div className="app-container">
      <h2 className="activity-title text-on-blue-BG">
        {t(`home.subjects.${operator.toLowerCase()}.label`)}
      </h2>
      <div className={`quiz-wrapper ${operator} ${difficultyClass}`}>
        {selectedComplexity && <QuestionBox operator={operator} complexity={selectedComplexity} />}
      </div>
    </div>
  );
}
