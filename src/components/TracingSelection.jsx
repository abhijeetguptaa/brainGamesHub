import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryColor, getCategoryBGColor } from '../constants/colors';
import { setScreen } from '../utils/analytics';

function TracingSelection() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('TracingSelection');
  }, []);

  const subjects = [
    {
      to: '/creativity/tracing-selection/alphabet-tracing',
      label: t('home.subjects.alphabetTracing.label'),
      src: '/alphabet-tracing.png',
      title: t('home.subjects.alphabetTracing.title'),
    },
    {
      to: '/creativity/tracing-selection/number-tracing',
      label: t('home.subjects.numberTracing.label'),
      src: '/number-tracing.png',
      title: t('home.subjects.numberTracing.title'),
    },
  ];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection tracing-selection"
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

export default TracingSelection;
