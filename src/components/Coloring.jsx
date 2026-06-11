import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { setScreen } from '../utils/analytics';
import {
  EasyColoring,
  ReactIconsColoring,
  NumbersColoring,
  AlphabetColoring,
  CartoonColoring,
} from './ColoringCategories';

function Coloring() {
  const { difficulty } = useParams();

  useEffect(() => {
    setScreen('ColoringGame');
  }, []);

  if (difficulty === 'easy') return <EasyColoring />;
  if (difficulty === 'react-icons') return <ReactIconsColoring />;
  if (difficulty === 'numbers') return <NumbersColoring />;
  if (difficulty === 'alphabet') return <AlphabetColoring />;
  if (difficulty === 'cartoon') return <CartoonColoring />;

  return null;
}

export default Coloring;
