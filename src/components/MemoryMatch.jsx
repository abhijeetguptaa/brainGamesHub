import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import '../styles/MemoryMatch.scss';
import { playCardFlipSound, speakText } from '../utils/soundUtils';
import SuccessModal from './SuccessModal';
import { useTranslation } from 'react-i18next';
import { MEMORY_MATCH_CONFIG, getMemoryMatchIcons } from '../constants/memoryMatchConstants';
import { shuffleArray } from '../utils/utils';
import { useSparkleBurst } from '../hooks/useSparkleBurst';
import { setScreen, trackExerciseComplete } from '../utils/analytics';

const MemoryMatch = () => {
  const { t } = useTranslation();
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const questionMarkLabel = useMemo(() => t('common.questionMark'), [t]);

  /** ✅ Memoized so it doesn't recreate every render */
  const ICON_DATA = useMemo(() => getMemoryMatchIcons(t), [t]);

  const [cardCount, setCardCount] = useState(MEMORY_MATCH_CONFIG.INITIAL_CARD_COUNT);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isGameVisible, setIsGameVisible] = useState(true);
  const [solvedCount, setSolvedCount] = useState(0);

  const levelUpLock = useRef(false);
  const selectedCardIndicesRef = useRef([]);
  const gameBoardRef = useRef(null);
  const cardRefs = useRef({});
  const initialRevealDoneRef = useRef(false);
  const cardsRef = useRef(cards);
  const flippedCardsRef = useRef(flippedCards);
  const isCheckingRef = useRef(isChecking);

  useEffect(() => {
    setScreen('MemoryMatchGame');

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setIsGameVisible(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    flippedCardsRef.current = flippedCards;
  }, [flippedCards]);

  useEffect(() => {
    isCheckingRef.current = isChecking;
  }, [isChecking]);

  /** Generate shuffled cards */
  const generateCards = useCallback(() => {
    const numPairs = cardCount / 2;
    const randomIcons = shuffleArray([...ICON_DATA]);
    const selectedIcons = randomIcons.slice(0, numPairs);

    const pairs = selectedIcons.flatMap((icon, index) => [
      { id: index * 2, value: index, icon, isFlipped: true, isMatched: false },
      { id: index * 2 + 1, value: index, icon, isFlipped: true, isMatched: false },
    ]);

    return shuffleArray(pairs);
  }, [cardCount, ICON_DATA]);

  /** Initialize level */
  useEffect(() => {
    if (document.hidden) {
      setIsGameVisible(false);
    }
    initialRevealDoneRef.current = false;
    setCards(generateCards());
  }, [cardCount, generateCards]);

  /** Flip back timer - only starts when game is visible */
  useEffect(() => {
    const shouldHideInitialReveal =
      isGameVisible && cards.length > 0 && cards.every((c) => c.isFlipped);
    if (!shouldHideInitialReveal || initialRevealDoneRef.current) return;

    const timer = setTimeout(
      () => {
        setCards((c) => c.map((card) => ({ ...card, isFlipped: false })));
        initialRevealDoneRef.current = true;
      },
      (MEMORY_MATCH_CONFIG.FLIP_BACK_DELAY * cardCount) / 2 + 500, // Added 500ms buffer
    );

    return () => clearTimeout(timer);
  }, [cardCount, isGameVisible, cards]);

  /** Card click */
  const handleCardClick = useCallback((index) => {
    const currentCards = cardsRef.current;
    const currentFlippedCards = flippedCardsRef.current;

    if (isCheckingRef.current || !currentCards[index] || currentCards[index].isMatched) {
      return;
    }

    if (currentFlippedCards.length === 1 && currentFlippedCards[0] === index) {
      const newCards = [...currentCards];
      newCards[index] = { ...newCards[index], isFlipped: false };

      selectedCardIndicesRef.current = [];
      setCards(newCards);
      setFlippedCards([]);
      return;
    }

    if (
      currentFlippedCards.length === 2 ||
      currentCards[index].isFlipped ||
      selectedCardIndicesRef.current.includes(index)
    ) {
      return;
    }

    playCardFlipSound();

    selectedCardIndicesRef.current = [...selectedCardIndicesRef.current, index];
    const newCards = [...currentCards];
    newCards[index] = { ...newCards[index], isFlipped: true };

    setCards(newCards);
    setFlippedCards((prev) => (prev.includes(index) ? prev : [...prev, index]));
  }, []);

  /** Match check */
  const checkMatch = useCallback(() => {
    const currentFlippedCards = flippedCardsRef.current;
    const currentCards = cardsRef.current;
    if (currentFlippedCards.length !== 2) return;

    setIsChecking(true);
    const [a, b] = currentFlippedCards;
    const isMatch = currentCards[a].value === currentCards[b].value;

    setTimeout(() => {
      const nextCards = [...currentCards];
      if (isMatch) {
        nextCards[a] = { ...nextCards[a], isMatched: true, isFlipped: true };
        nextCards[b] = { ...nextCards[b], isMatched: true, isFlipped: true };

        speakText(nextCards[a].icon.name);
        [a, b].forEach((index) => {
          const el = cardRefs.current[index];
          if (el) {
            const rect = el.getBoundingClientRect();
            triggerSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        });
      } else {
        nextCards[a] = { ...nextCards[a], isFlipped: false };
        nextCards[b] = { ...nextCards[b], isFlipped: false };
      }

      setCards(nextCards);
      setFlippedCards([]);
      selectedCardIndicesRef.current = [];
      setIsChecking(false);
    }, MEMORY_MATCH_CONFIG.MATCH_CHECK_DELAY);
  }, [triggerSparkleBurst]);

  useEffect(() => {
    if (flippedCards.length === 2) checkMatch();
  }, [flippedCards, checkMatch]);

  const allMatched = useMemo(() => cards.length > 0 && cards.every((c) => c.isMatched), [cards]);

  /** Close success modal + next level */
  const handleClose = () => {
    setShowSuccessMessage(false);
    handleNextLevel();
  };

  const handleNextLevel = useCallback(() => {
    setShowSuccessMessage(false);
    setCardCount((p) =>
      p < MEMORY_MATCH_CONFIG.MAX_CARDS ? p + 2 : MEMORY_MATCH_CONFIG.INITIAL_CARD_COUNT,
    );
    levelUpLock.current = false;
    selectedCardIndicesRef.current = [];
    setFlippedCards([]);
    setCards(generateCards());
  }, [generateCards]);

  /** Detect level completion */
  useEffect(() => {
    if (allMatched && !levelUpLock.current) {
      levelUpLock.current = true;
      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);

      trackExerciseComplete('memory-match', 'default', cards.length / 2);

      setShowSuccessMessage(true);
    }
  }, [allMatched, solvedCount, cards.length]);

  /** Grid columns class */
  const gridColsClass = useMemo(() => {
    return cardCount < 6 ? 'cols-2' : cardCount < 13 ? 'cols-3' : 'cols-4';
  }, [cardCount]);

  return (
    <div className="card-game-container">
      <div ref={gameBoardRef} className={`game-board ${gridColsClass}`}>
        {cards.map((card, i) => (
          <Card
            key={card.id}
            index={i}
            card={card}
            isFlipped={card.isFlipped}
            onClick={handleCardClick}
            cardRefs={cardRefs}
            questionMarkLabel={questionMarkLabel}
          />
        ))}
      </div>

      {showSuccessMessage && (
        <SuccessModal handleClose={handleClose} message={''} starsWon={cards?.length / 2} />
      )}
      <SparkleRenderer />
    </div>
  );
};

const getCardTilt = (index) => {
  const cycle = (index % 5) - 2;
  return `${cycle * 1.2}deg`;
};

const Card = memo(function Card({ index, card, isFlipped, onClick, cardRefs, questionMarkLabel }) {
  const IconComponent = card.icon.component;
  const cardTilt = getCardTilt(index);
  return (
    <div
      ref={(el) => (cardRefs.current[index] = el)}
      className={`card ${isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
      onClick={() => onClick(index)}
      style={{
        '--card-tilt': cardTilt,
      }}
    >
      {!card.isMatched && (
        <div className="card-inner">
          <div className="card-front">{questionMarkLabel}</div>
          <div className="card-back">
            {React.createElement(IconComponent, {
              color: card.icon.color,
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default MemoryMatch;
