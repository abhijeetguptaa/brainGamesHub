import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryColor, getCategoryBGColor } from '../constants/colors';
import { setScreen } from '../utils/analytics';

function Games() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('GamesCategory');
  }, []);

  const subjects = [
    {
      to: '/games/memory-match',
      label: t('home.subjects.memoryMatch.label'),
      src: '/memoryMatch.webp',
      title: t('home.subjects.memoryMatch.title'),
    },
    {
      to: '/games/sudoku',
      label: t('home.subjects.sudoku.label'),
      src: '/sudoku.webp',
      title: t('home.subjects.sudoku.title'),
    },
    {
      to: '/games/tictactoe',
      label: t('home.subjects.ticTacToe.label'),
      src: '/tic_tac_toe.webp',
      title: t('home.subjects.ticTacToe.title'),
    },
    {
      to: '/games/gridMatch',
      label: t('home.subjects.gridMatch.label'),
      src: '/gridMatch.webp',
      title: t('home.subjects.gridMatch.title'),
    },
    {
      to: '/games/tile-connect',
      label: t('home.subjects.tileConnect.label', 'Tile Connect'),
      src: '/tile-connect.webp',
      title: t('home.subjects.tileConnect.title', 'Tile Connect'),
    },

    {
      to: '/games/spin-wheel',
      label: t('home.subjects.spinWheel.label'),
      src: '/spinWheel.webp',
      title: t('home.subjects.spinWheel.title'),
    },
    {
      to: '/games/smart-match',
      label: t('home.subjects.smartMatch.label'),
      src: '/smartMatch.webp',
      title: t('home.subjects.smartMatch.title'),
    },
    {
      to: '/english/wordsearch',
      label: t('home.subjects.wordSearch.label'),
      src: '/match_the_word.webp',
      title: t('home.subjects.wordSearch.title'),
    },
    {
      to: '/maths/mental-math',
      label: t('home.subjects.mentalMath.label'),
      src: '/mental-math.webp',
      title: t('home.subjects.mentalMath.title'),
    },
  ];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection games"
        role="navigation"
        aria-label={t('common.accessibility.subjectSelection')}
      >
        {subjects.map((subject, index) => (
          <Link
            to={subject.to}
            className="subject-icon-button"
            aria-label={subject.title}
            title={subject.title}
            key={subject.to}
            style={{
              '--card-color': getCategoryColor(index),
              '--bg-color': getCategoryBGColor(index),
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <img className="subject-icon subject-icon--img" src={subject.src} alt={subject.label} />
            <div className="gameName">{subject.label}</div>
          </Link>
        ))}
      </nav>
    </main>
  );
}

export default Games;
