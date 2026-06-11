import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryColor, getCategoryBGColor } from '../constants/colors';
import { setScreen } from '../utils/analytics';

function Maths() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('MathsCategory');
  }, []);

  const subjects = [
    {
      to: '/maths/counting',
      label: t('home.subjects.counting.label'),
      src: '/number_count.webp',
      title: t('home.subjects.counting.title'),
    },

    
    {
      to: '/maths/addition',
      label: t('home.subjects.addition.label'),
      src: '/addition.webp',
      title: t('home.subjects.addition.title'),
    },
    {
      to: '/maths/subtraction',
      label: t('home.subjects.subtraction.label'),
      src: '/subtraction.webp',
      title: t('home.subjects.subtraction.title'),
    },
    {
      to: '/maths/multiplication',
      label: t('home.subjects.multiplication.label'),
      src: '/multiplication.webp',
      title: t('home.subjects.multiplication.title'),
    },
    {
      to: '/maths/division',
      label: t('home.subjects.division.label'),
      src: '/division.webp',
      title: t('home.subjects.division.title'),
    },
    {
      to: '/maths/comparison',
      label: t('home.subjects.comparison.label'),
      src: '/comparison.webp',
      title: t('home.subjects.comparison.title'),
    },
    {
      to: '/maths/ascending',
      label: t('home.subjects.ascending.label'),
      src: '/ascending.webp',
      title: t('home.subjects.ascending.title'),
    },
    {
      to: '/maths/descending',
      label: t('home.subjects.descending.label'),
      src: '/descending.webp',
      title: t('home.subjects.descending.title'),
    },
  ];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection math-games"
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

export default Maths;
