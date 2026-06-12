import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useTileConnectStore from '../store/useTileConnectStore';
import TileConnectBoard, { TileConnectBoardHandle } from './TileConnectBoard';
import { AnimatePresence, motion } from 'framer-motion';
import SuccessModal from './SuccessModal';
import useUnlockModalStore from '../store/useUnlockModalStore';
import UnlockModal from './UnlockModal';
import { setScreen, trackExerciseStart } from '../utils/analytics';
import { useNavigate, useLocation } from 'react-router-dom';

const TileConnect: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { level, isLevelComplete, resetGame, nextLevel } = useTileConnectStore();
  const { openModal } = useUnlockModalStore();

  const boardRef = useRef<TileConnectBoardHandle>(null);

  const [isGridReady, setIsGridReady] = useState(false);

  useEffect(() => {
    setScreen('TileConnect');
    trackExerciseStart('TileConnect', level);
    resetGame();
    // Safety timeout
    const safetyTimeout = setTimeout(() => {
      setIsGridReady(true);
    }, 10000);

    return () => clearTimeout(safetyTimeout);
  }, [resetGame]);

  const handleGridReady = useCallback(() => {
    setIsGridReady(true);
  }, []);

  const handleNoMatches = useCallback(() => {
    openModal(t('games.tileConnect.shuffle', 'Shuffle'), 20, () => {
      boardRef.current?.shuffle();
    });
  }, [openModal, t]);

  const handleNextLevel = () => {
    setIsGridReady(false);
    nextLevel();
  };

  return (
    <div className="tile-connect-outer-container">
      {!isGridReady && (
        <div className="tile-connect-loading-overlay">
          <div className="tile-connect-spinner" />
          <p className="tile-connect-loading-text">
            {t('common.loading', 'Loading...')}
          </p>
        </div>
      )}

      {/* Decorative background elements */}
      <div className="tile-connect-deco-1" />
      <div className="tile-connect-deco-2" />

      {/* React Game Board */}
      <TileConnectBoard
        ref={boardRef}
        onGridReady={handleGridReady}
        onNoMatches={handleNoMatches}
      />

      {/* UI Overlay - Level Header */}
      <div className="tile-connect-header-overlay">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="tile-connect-level-badge-container"
        >
          <div className="relative group">
            <div className="tile-connect-level-glow" />

            <div className="tile-connect-level-badge">
              <span className="tile-connect-level-icon">✨</span>
              <span className="tile-connect-level-text">
                {t('common.level', 'Level')} {level}
              </span>
              <span className="tile-connect-level-icon">✨</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Level Complete Screen */}
      <AnimatePresence>
        {isLevelComplete && (
          <SuccessModal
            handleClose={handleNextLevel}
            message={t('games.tileConnect.levelCompleted', 'Level {{level}} Completed!', { level })}
            starsWon={5 + Math.floor(level / 10)}
          />
        )}
      </AnimatePresence>

      <UnlockModal />
    </div>
  );
};

export default TileConnect;
