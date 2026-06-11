import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryColor, getCategoryBGColor } from '../constants/colors';
import { setScreen } from '../utils/analytics';

function Junior() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('JuniorCategory');
  }, []);

  const subjects = [
    {
      to: '/junior/tap-learn-letters',
      label: t('home.subjects.tapLearnLetters.label'),
      src: '/alphabet.webp',
      title: t('home.subjects.tapLearnLetters.title'),
    },
    {
      to: '/junior/tap-learn-numbers',
      label: t('home.subjects.tapLearnNumbers.label'),
      src: '/number_count.webp',
      title: t('home.subjects.tapLearnNumbers.title'),
    },
    {
      to: '/junior/tap-learn-farm-animals',
      label: t('home.subjects.tapLearnFarmAnimals.label'),
      src: '/farm-animals.webp',
      title: t('home.subjects.tapLearnFarmAnimals.title'),
    },
    {
      to: '/junior/tap-learn-wild-animals',
      label: t('home.subjects.tapLearnWildAnimals.label'),
      src: '/wild-animals.webp',
      title: t('home.subjects.tapLearnWildAnimals.title'),
    },
    {
      to: '/junior/tap-learn-sea-animals',
      label: t('home.subjects.tapLearnSeaAnimals.label'),
      src: '/sea-animals.webp',
      title: t('home.subjects.tapLearnSeaAnimals.title'),
    },
    {
      to: '/junior/tap-learn-insects',
      label: t('home.subjects.tapLearnInsects.label'),
      src: '/insects.webp',
      title: t('home.subjects.tapLearnInsects.title'),
    },

    {
      to: '/junior/tap-learn-colors',
      label: t('home.subjects.tapLearnColors.label'),
      src: '/tap-fill.webp',
      title: t('home.subjects.tapLearnColors.title'),
    },
    {
      to: '/junior/tap-learn-vegetables',
      label: t('home.subjects.tapLearnVegetables.label'),
      src: '/vegetables.webp',
      title: t('home.subjects.tapLearnVegetables.title'),
    },
    {
      to: '/junior/tap-learn-fruits',
      label: t('home.subjects.tapLearnFruits.label'),
      src: '/fruits.webp',
      title: t('home.subjects.tapLearnFruits.title'),
    },
    {
      to: '/junior/tap-learn-vehicles',
      label: t('home.subjects.tapLearnVehicles.label'),
      src: '/vehicles.webp',
      title: t('home.subjects.tapLearnVehicles.title'),
    },
    {
      to: '/junior/tap-learn-food',
      label: t('home.subjects.tapLearnFood.label'),
      src: '/food.webp',
      title: t('home.subjects.tapLearnFood.title'),
    },
    {
      to: '/junior/tap-learn-instruments',
      label: t('home.subjects.tapLearnInstruments.label'),
      src: '/instruments.webp',
      title: t('home.subjects.tapLearnInstruments.title'),
    },
    {
      to: '/junior/tap-learn-shapes',
      label: t('home.subjects.tapLearnShapes.label'),
      src: '/shapes.webp',
      title: t('home.subjects.tapLearnShapes.title'),
    },
  ];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection junior"
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

export default Junior;
