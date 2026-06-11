import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useStarStore from '../store/useStarStore';
import useUnlockModalStore from '../store/useUnlockModalStore';
import '../styles/Passages.scss';
import { useTranslation } from 'react-i18next';
import { setScreen } from '../utils/analytics';

const PassageSelection = () => {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('PassageSelection');
  }, []);

  const { difficulty } = useParams();
  const navigate = useNavigate();

  const { unlockedPassages, unlockPassage, completedPassages } = useStarStore();
  const openModal = useUnlockModalStore((state) => state.openModal);
  const [passages, setPassages] = useState([]);
  const [isPassagesLoading, setIsPassagesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setPassages([]);
    setIsPassagesLoading(true);

    import('../data/passage').then(({ passageData }) => {
      if (isMounted) {
        setPassages(passageData[difficulty] || []);
        setIsPassagesLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [difficulty]);

  // Derive "currentIndex" as the first one NOT completed
  const currentDiffCompleted = completedPassages[difficulty] || [];
  let currentIndex = 0;
  while (currentDiffCompleted.includes(currentIndex)) {
    currentIndex++;
  }

  /**
   * 🔓 Common unlock rule
   * First 5 always unlocked OR manually unlocked
   */
  const isUnlockedCheck = (index) => index < 5 || unlockedPassages[difficulty]?.includes(index);

  /**
   * 🔒 Find first locked passage
   */
  let firstLockedIndex = -1;

  for (let i = 0; i < passages.length; i++) {
    if (!isUnlockedCheck(i)) {
      firstLockedIndex = i;
      break;
    }
  }

  /**
   * 👀 Control visible level count
   */
  const visibleCount = Math.min(
    passages.length,
    Math.max(20, (firstLockedIndex > -1 ? firstLockedIndex : currentIndex) + 10),
  );

  if (isPassagesLoading) {
    return (
      <div className="kids-bg">
        <h2 className="subtitle">{t('passageReading.loading')}</h2>
      </div>
    );
  }

  return (
    <div className="kids-bg">
      <h2 className="subtitle">{t('passageSelection.pickLevel')}</h2>

      <div className="levels-grid">
        {passages.slice(0, visibleCount).map((_, i) => {
          const isCompleted = completedPassages[difficulty]?.includes(i);
          const isCurrent = i === currentIndex;
          const isUnlocked = isUnlockedCheck(i);
          const isLocked = !isUnlocked;

          const isFirstLocked = i === firstLockedIndex;
          const isClickable = !isLocked || isFirstLocked;

          const handleClick = () => {
            if (!isClickable) return;

            // 👉 First locked → open unlock modal
            if (isFirstLocked) {
              openModal(t('passageSelection.level', { level: i + 1 }), 40, () => {
                unlockPassage(i, difficulty);
                navigate(`/english/passage/${difficulty}/${i}`);
              });
              return;
            }

            // 👉 Normal unlocked navigation
            navigate(`/english/passage/${difficulty}/${i}`);
          };

          return (
            <motion.div
              key={i}
              whileTap={isClickable ? { scale: 0.9 } : {}}
              className={`level-bubble
                ${isCompleted ? 'done' : ''}
                ${isCurrent ? 'current' : ''}
                ${isLocked ? 'locked' : ''}
                ${!isClickable ? 'disabled' : ''}
                ${isFirstLocked ? 'unlockable-passage' : ''}`}
              onClick={handleClick}
            >
              {isCompleted && <div className="stars">{t('passageSelection.stars')}</div>}
              {isLocked && <div className="lock">{t('passageSelection.lock')}</div>}
              <span className="level-number">{i + 1}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PassageSelection;
