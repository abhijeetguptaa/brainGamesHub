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
    <div className="relative w-full h-screen bg-gradient-to-br from-[#FFEFBA] to-[#FFFFFF] flex items-center justify-center overflow-hidden">
      {!isGridReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-[#8d6e63] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#5d4037] font-bold text-xl animate-pulse">
            {t('common.loading', 'Loading...')}
          </p>
        </div>
      )}

      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-blue-200/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* React Game Board */}
      <TileConnectBoard
        ref={boardRef}
        onGridReady={handleGridReady}
        onNoMatches={handleNoMatches}
      />

      {/* UI Overlay - Kid Friendly Level Header */}
      <div className="absolute inset-0 flex justify-center items-start pointer-events-none p-4">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="pointer-events-auto h-fit"
        >
          <div className="relative group">
            {/* Playful Multi-color Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-[2.5rem] blur opacity-50 group-hover:opacity-100 transition duration-1000" />

            <div className="relative bg-white px-8 py-2 rounded-[2rem] shadow-[0_6px_0_rgba(236,72,153,0.3)] border-[6px] border-pink-400 flex items-center gap-3 transform -rotate-1 active:scale-95 transition-transform">
              <span className="text-3xl filter drop-shadow-sm">✨</span>
              <span className="bg-gradient-to-br from-pink-600 to-purple-600 bg-clip-text text-transparent font-black text-2xl sm:text-3xl tracking-wide uppercase">
                {t('common.level', 'Level')} {level}
              </span>
              <span className="text-3xl filter drop-shadow-sm">✨</span>
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
