// src/components/UnlockModal.tsx
import React from 'react';
import { useState } from 'react';
import useUnlockModalStore from '../store/useUnlockModalStore';
import useStarStore from '../store/useStarStore';
import '../styles/UnlockModal.scss';
import { useTranslation } from 'react-i18next';
import { trackFeatureUnlocked } from '../utils/analytics';

const UnlockModal: React.FC = () => {
  const { isOpen, closeModal, featureName, onConfirm } = useUnlockModalStore();
  const { stars, spendStars } = useStarStore();
  const { t } = useTranslation();
  const [isSpendingStars, setIsSpendingStars] = useState(false);
  const fixedCost = 100;

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (isSpendingStars) return;
    if (stars >= fixedCost) {
      const success = spendStars(fixedCost);
      if (success) {
        onConfirm();
        trackFeatureUnlocked(featureName, fixedCost);
        closeModal();
      }
    } else {
      alert(t('unlockModal.notEnoughCoins'));
    }
  };

  return (
    <div className="unlock-modal-overlay">
      <div className="unlock-modal-content">
        <h2>{t('unlockModal.title')}</h2>
        <p>{t('unlockModal.cost', { cost: fixedCost })}</p>
        <p className={`${stars < fixedCost ? 'text-red' : ''}`}>
          {t('unlockModal.balance', { stars })}
        </p>
        <div className="unlock-modal-actions">
          <button onClick={closeModal} className="cancel-button" disabled={isSpendingStars}>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="confirm-button"
            disabled={stars < fixedCost || isSpendingStars}
          >
            {t('unlockModal.unlockWithStars', { cost: fixedCost })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;
