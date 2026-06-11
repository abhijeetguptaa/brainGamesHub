// src/components/UnlockModal.tsx
import React from 'react';
import { useState } from 'react';
import useUnlockModalStore from '../store/useUnlockModalStore';
import useStarStore from '../store/useStarStore';
import '../styles/UnlockModal.scss';
import { useTranslation } from 'react-i18next';
// import { showSafeRewarded } from '../utils/admob.js';
import { Toast } from '@capacitor/toast';
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

  /*
  const handleGoogleAd = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);

    try {
      await showSafeRewarded(); // show rewarded ad first
      closeModal(); // Close modal AFTER ad is finished
      onConfirm(); // Unlock the feature after ad is closed (and reward is earned)
      trackFeatureUnlocked(featureName, 0); // Cost is 0 if unlocked via Ad
      await Toast.show({
        text: t('unlockModal.featureUnlocked'),
      });
    } catch (err) {
      console.log('Ad failed or skipped:', err);
      const errorCode = (err as any).code || '';
      const message =
        (err as any).code === 'REWARDED_NOT_EARNED'
          ? t('unlockModal.watchFullAd')
          : t('unlockModal.adFailed', { code: errorCode });

      await Toast.show({
        text: message,
      });
    } finally {
      setIsAdLoading(false);
    }
  };
  */

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
        {/* 
        <div className="google-play-link">
          <button onClick={handleGoogleAd} className="google-play-ad" disabled={isAdLoading}>
            🎬 {isAdLoading ? t('unlockModal.loadingAd') : t('unlockModal.watchAd')}
          </button>
        </div>
        */}
      </div>
    </div>
  );
};

export default UnlockModal;
