import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setScreen } from '../utils/analytics';

function Puzzle() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('PuzzleGame');
  }, []);

  const subjects = [];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection puzzles"
        role="navigation"
        aria-label={t('common.accessibility.subjectSelection')}
      >
        {subjects.map((subject) => (
          <Link
            to={subject.to}
            className="subject-icon-button"
            aria-label={subject.title}
            title={subject.title}
            key={subject.to}
          >
            <img className="subject-icon subject-icon--img" src={subject.src} alt={subject.label} />
            <div className="gameName">{t(`${subject.label}`)}</div>
          </Link>
        ))}
      </nav>
    </main>
  );
}

export default Puzzle;
