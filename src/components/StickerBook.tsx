import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useStarStore from '../store/useStarStore';
import { STICKERS, Sticker } from '../data/stickers';
import { playTapSound } from '../utils/soundUtils';
import '../styles/StickerBook.scss';
import { setScreen, logEvent } from '../utils/analytics';

const StickerBook: React.FC = () => {
  const { t } = useTranslation();
  const { stars, unlockedStickers, collectSticker } = useStarStore();

  useEffect(() => {
    setScreen('StickerBook');
  }, []);

  const handleUnlock = (sticker: Sticker) => {
    if (collectSticker(sticker.id, sticker.cost)) {
      playTapSound();
      logEvent('StickerUnlocked', {
        sticker_id: sticker.id,
        sticker_name: sticker.name,
        cost: sticker.cost,
      });
    }
  };

  const totalCollected = Object.values(unlockedStickers).reduce((a, b) => a + b, 0);

  // Helper to get consistent color for each sticker
  const getStickerTheme = (id: string) => {
    const colors = [
      { border: '#FF5722', bg: '#FBE9E7' }, // Deep Orange
      { border: '#E91E63', bg: '#FCE4EC' }, // Pink
      { border: '#9C27B0', bg: '#F3E5F5' }, // Purple
      { border: '#673AB7', bg: '#EDE7F6' }, // Deep Purple
      { border: '#3F51B5', bg: '#E8EAF6' }, // Indigo
      { border: '#2196F3', bg: '#E3F2FD' }, // Blue
      { border: '#03A9F4', bg: '#E1F5FE' }, // Light Blue
      { border: '#00BCD4', bg: '#E0F7FA' }, // Cyan
      { border: '#009688', bg: '#E0F2F1' }, // Teal
      { border: '#4CAF50', bg: '#E8F5E9' }, // Green
      { border: '#8BC34A', bg: '#F1F8E9' }, // Light Green
      { border: '#CDDC39', bg: '#F9FBE7' }, // Lime
      { border: '#FFC107', bg: '#FFF8E1' }, // Amber
      { border: '#FF9800', bg: '#FFF3E0' }, // Orange
    ];

    // Simple hash from ID string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="sticker-book-container">
      <div className="sticker-grid">
        {STICKERS.map((sticker) => {
          const count = unlockedStickers[sticker.id] || 0;
          const isUnlocked = count > 0;
          const canAfford = stars >= sticker.cost;
          const theme = getStickerTheme(sticker.id);

          return (
            <div
              key={sticker.id}
              className={`sticker-card ${isUnlocked ? 'is-owned' : 'is-locked'} ${canAfford ? 'can-buy' : 'too-expensive'}`}
              style={
                {
                  '--sticker-color': theme.border,
                  '--sticker-bg': theme.bg,
                } as React.CSSProperties
              }
              onClick={() => handleUnlock(sticker)}
            >
              <div className="sticker-visual">
                <span className="sticker-emoji">{sticker.emoji}</span>
                {count > 0 && <div className="quantity-badge">{count}</div>}
              </div>

              <div className="sticker-details">
                <span className="sticker-name">{sticker.name}</span>
                <div className="purchase-tag">
                  <span className="cost-value">⭐ {sticker.cost}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StickerBook;
