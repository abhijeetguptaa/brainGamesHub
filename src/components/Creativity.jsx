import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryColor, getCategoryBGColor } from '../constants/colors';
import { setScreen } from '../utils/analytics';

function Creativity() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('CreativityCategory');
  }, []);

  const subjects = [
    {
      to: '/creativity/colorPad',
      label: t('home.subjects.colorPad.label', 'Color Pad'),
      src: '/colorPad.webp',
      title: t('home.subjects.colorPad.title', 'Color Pad'),
    },
    {
      to: '/creativity/coloring-selection',
      label: t('home.categories.coloring', 'Coloring Pages'),
      src: '/coloring.webp',
      title: t('home.subjects.coloring.title', 'Coloring Pages'),
    },
    {
      to: '/creativity/scratch-cards',
      label: t('home.subjects.scratchCards.label', 'Scratch'),
      src: '/scratch-cards.webp',
      title: t('home.subjects.scratchCards.title', 'Scratch'),
    },
    {
      to: '/creativity/tracing-selection',
      label: t('home.subjects.tracing.label'),
      src: '/tracing.png',
      title: t('home.subjects.tracing.title'),
    },
  ];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection creativity"
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

export default Creativity;
