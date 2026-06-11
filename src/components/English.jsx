import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryColor, getCategoryBGColor } from '../constants/colors';
import { setScreen } from '../utils/analytics';

function English() {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('EnglishCategory');
  }, []);

  const subjects = [
    {
      to: '/english/alphabets',
      label: t('home.subjects.alphabets.label'),
      src: '/alphabet.webp',
      title: t('home.subjects.alphabets.title'),
    },
    {
      to: '/english/english-words',
      label: t('home.subjects.spellTheWord.label'),
      src: '/spell_the_word.webp',
      title: t('home.subjects.spellTheWord.title'),
    },
    {
      to: '/english/wordsearch',
      label: t('home.subjects.wordSearch.label'),
      src: '/match_the_word.webp',
      title: t('home.subjects.wordSearch.title'),
    },
    {
      to: '/english/sentence-scramble',
      label: t('home.subjects.sentenceScramble.label', 'Sentence'),
      src: '/sentence-scramble.webp',
      title: t('home.subjects.sentenceScramble.title', 'Rearrange words to form a sentence'),
    },
    {
      to: '/english/passages',
      label: t('home.subjects.passages.label'),
      src: '/passages.webp',
      title: t('home.subjects.passages.title'),
    },
  ];

  return (
    <main className="landing-page" role="main">
      <nav
        className="subject-selection english"
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

export default English;
