import { useSparkleBurst } from '@/hooks/useSparkleBurst';
import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { playTapSound } from '../utils/soundUtils';
import { getRandomInt } from '../utils/utils';
import SuccessModal from './SuccessModal';
import '../styles/ScratchGame.scss';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { finishLearningPathTask, isLearningPathTaskActive } from '../utils/learningPathUtils';
import { SCRATCH_COLORING } from '../data/animalColoring';
// import { showSafeRewarded } from '../utils/admob.js';
import { Toast } from '@capacitor/toast';
import useStarStore from '../store/useStarStore';
import {
  setScreen,
  trackExerciseComplete,
  trackIconSelection,
  trackDrawingStart,
  trackSuccessModalShow,
} from '../utils/analytics';

interface ScratchGameProps {
  icons?: { component?: any; name?: string; sketch?: string; ref?: string }[];
}

export default function ScratchGame({ icons = SCRATCH_COLORING }: ScratchGameProps) {
  const { t } = useTranslation();
  const { stars, spendStars } = useStarStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentActiveTask, completeTask, setActiveTask, setIsTaskReadyToComplete } =
    useLearningPathStore();
  const [isSpendingStars, setIsSpendingStars] = useState(false);

  useEffect(() => {
    setScreen('ScratchCardsGame');
  }, []);
  const [currentIconIndex, setCurrentIconIndex] = useState(() =>
    icons.length > 0 ? getRandomInt(0, icons.length - 1) : 0,
  );

  useEffect(() => {
    const entry = icons[currentIconIndex];
    if (entry) {
      trackIconSelection(entry.name || 'unknown', 'ScratchCards');
    }
  }, [currentIconIndex]);

  const isTinySteps = isLearningPathTaskActive(currentActiveTask, location.pathname, location.search);

  const handleSkipWithStars = async () => {
    if (isSpendingStars) return;
    if (stars < 100) {
      await Toast.show({
        text: t('unlockModal.notEnoughCoins'),
      });
      return;
    }

    setIsSpendingStars(true);
    try {
      const success = spendStars(100);
      if (success) {
        if (isTinySteps && currentActiveTask) {
          finishLearningPathTask({
            currentActiveTask,
            completeTask,
            setActiveTask,
            navigate,
          });
        }
        await Toast.show({
          text: t('unlockModal.featureUnlocked'),
        });
      }
    } catch (err) {
      console.error('Failed to spend stars for skip:', err);
    } finally {
      setIsSpendingStars(false);
    }
  };

  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageBoundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const animalMaskRef = useRef<Uint8Array | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  const [isDrawing, setIsDrawing] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  const loadNextImage = () => {
    playTapSound();
    setCurrentIconIndex((prev: number) => (prev + 1) % icons.length);
  };

  const loadPreviousImage = () => {
    playTapSound();
    setCurrentIconIndex((prev: number) => (prev - 1 + icons.length) % icons.length);
  };

  const loadTokenRef = useRef(0);

  useEffect(() => {
    const bgCanvas = backgroundCanvasRef.current;
    const fgCanvas = foregroundCanvasRef.current;
    if (!bgCanvas || !fgCanvas || !icons[currentIconIndex]) return;

    const loadImage = async () => {
      const token = ++loadTokenRef.current;
      const currentItem = icons[currentIconIndex];
      if (!currentItem.sketch || !currentItem.ref) return;

      try {
        const [sketchImg, refImg] = await Promise.all([
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load sketch: ${currentItem.sketch}`));
            img.src = currentItem.sketch!;
          }),
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load reference: ${currentItem.ref}`));
            img.src = currentItem.ref!;
          }),
        ]);

        if (token !== loadTokenRef.current) return;

        const bgCtx = bgCanvas.getContext('2d');
        const fgCtx = fgCanvas.getContext('2d');
        if (!bgCtx || !fgCtx) return;

        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);

        const maxWidth = bgCanvas.width;
        const maxHeight = bgCanvas.height;

        if (sketchImg.width === 0 || sketchImg.height === 0 || maxWidth === 0 || maxHeight === 0)
          return;

        const scale = Math.min(maxWidth / sketchImg.width, maxHeight / sketchImg.height) * 0.9;
        if (!Number.isFinite(scale) || scale <= 0) return;

        const drawWidth = Math.round(sketchImg.width * scale);
        const drawHeight = Math.round(sketchImg.height * scale);

        if (drawWidth <= 0 || drawHeight <= 0) return;

        const x = Math.round((bgCanvas.width - drawWidth) / 2);
        const y = Math.round((bgCanvas.height - drawHeight) / 2);

        imageBoundsRef.current = { x, y, w: drawWidth, h: drawHeight };

        bgCtx.drawImage(refImg, x, y, drawWidth, drawHeight);

        // List of bright colors for the base
        const brightColors = [
          '#FF6B6B',
          '#4ECDC4',
          '#FFE66D',
          '#FF8E72',
          '#6B5B95',
          '#FEB236',
          '#D64161',
          '#FF7B25',
          '#79C753',
          '#F333FF',
        ];
        const baseColor = brightColors[Math.floor(Math.random() * brightColors.length)];

        // Create Glitter Pattern
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 150;
        patternCanvas.height = 150;
        const pCtx = patternCanvas.getContext('2d');
        if (pCtx) {
          pCtx.fillStyle = baseColor;
          pCtx.fillRect(0, 0, 150, 150);

          // Add "glitter" specks
          for (let i = 0; i < 800; i++) {
            const px = Math.random() * 150;
            const py = Math.random() * 150;
            const size = Math.random() * 2;

            // Mix of white/gold/silver and some multi-colored sparks
            const glitterColors = [
              '#FFFFFF',
              '#FFD700',
              '#C0C0C0',
              '#E0E0E0',
              '#FFFFCC',
              '#FF69B4',
              '#00FFFF',
              '#ADFF2F',
            ];
            pCtx.fillStyle = glitterColors[Math.floor(Math.random() * glitterColors.length)];

            // Random opacity for shimmering effect
            pCtx.globalAlpha = 0.5 + Math.random() * 0.5;

            pCtx.beginPath();
            if (Math.random() > 0.85) {
              // Draw a small star-like glint
              const length = size * 2.5;
              pCtx.moveTo(px - length, py);
              pCtx.lineTo(px + length, py);
              pCtx.moveTo(px, py - length);
              pCtx.lineTo(px, py + length);
              pCtx.strokeStyle = pCtx.fillStyle;
              pCtx.lineWidth = 0.8;
              pCtx.stroke();
            } else {
              pCtx.arc(px, py, size, 0, Math.PI * 2);
              pCtx.fill();
            }
          }
          pCtx.globalAlpha = 1.0; // Reset alpha
        }

        if (token !== loadTokenRef.current) return;

        const pattern = fgCtx.createPattern(patternCanvas, 'repeat');
        if (pattern) {
          fgCtx.fillStyle = pattern;
          fgCtx.fillRect(0, 0, fgCanvas.width, fgCanvas.height);
        } else {
          fgCtx.fillStyle = baseColor;
          fgCtx.fillRect(0, 0, fgCanvas.width, fgCanvas.height);
        }

        // Create a mask of the actual opaque pixels of the animal
        if (drawWidth > 0 && drawHeight > 0) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = drawWidth;
          tempCanvas.height = drawHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(sketchImg, 0, 0, drawWidth, drawHeight);
            const imageData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);
            const pixels = imageData.data;
            const mask = new Uint8Array(drawWidth * drawHeight);
            for (let i = 0; i < pixels.length; i += 4) {
              const isOpaque = pixels[i + 3] > 10;
              const isNotWhite = pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250;
              if (isOpaque && isNotWhite) {
                mask[i / 4] = 1;
              }
            }
            if (token === loadTokenRef.current) {
              animalMaskRef.current = mask;
            }
          }
        }
      } catch (error) {
        console.error('Error loading scratch card:', error);
      }
    };

    const setCanvasSize = () => {
      const parent = fgCanvas.parentElement;
      if (parent) {
        const width = parent.clientWidth || window.innerWidth;
        const height = parent.clientHeight || window.innerHeight;

        if (width > 0 && height > 0) {
          bgCanvas.width = width;
          bgCanvas.height = height;
          fgCanvas.width = width;
          fgCanvas.height = height;
          loadImage();
        }
      }
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, [currentIconIndex]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    const canvas = foregroundCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;
    setIsDrawing(true);
    handleScratch(e);
    trackDrawingStart('ScratchCards');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || e.pointerId !== activePointerIdRef.current) return;
    handleScratch(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    setIsDrawing(false);
    activePointerIdRef.current = null;
    checkIfFullyScratched();
  };

  const handleScratch = (e: React.PointerEvent) => {
    const coords = getCoordinates(e);
    const fgCanvas = foregroundCanvasRef.current;
    if (!fgCanvas) return;
    const ctx = fgCanvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 45, 0, Math.PI * 2);
    ctx.fill();

    if (getRandomInt(0, 5) === 0) {
      triggerSparkleBurst(coords.x, coords.y);
    }
  };

  const checkIfFullyScratched = () => {
    const fgCanvas = foregroundCanvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!fgCanvas || !bgCanvas || !animalMaskRef.current) return;
    const ctx = fgCanvas.getContext('2d');
    if (!ctx) return;

    const { x, y, w, h } = imageBoundsRef.current;
    if (w === 0 || h === 0) return;

    const imageData = ctx.getImageData(x, y, w, h);
    const pixels = imageData.data;
    const mask = animalMaskRef.current;
    let transparentPixels = 0;
    let totalAnimalPixels = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const pixelIndex = i / 4;
      if (mask[pixelIndex]) {
        totalAnimalPixels++;
        if (pixels[i + 3] < 128) {
          transparentPixels++;
        }
      }
    }

    if (totalAnimalPixels === 0) return;

    const scratchPercentage = (transparentPixels / totalAnimalPixels) * 100;

    // Use 50% threshold of the ACTUAL animal area
    if (scratchPercentage > 99) {
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = bgCanvas.width;
      finalCanvas.height = bgCanvas.height;
      const finalCtx = finalCanvas.getContext('2d');
      if (finalCtx) {
        finalCtx.drawImage(bgCanvas, 0, 0);
      }

      if (isTinySteps) {
        setIsTaskReadyToComplete(true);
      } else {
        setShowSuccessModal(true);
        trackSuccessModalShow('ScratchCards');
        playTapSound();
      }
    }
  };

  const handleCloseSuccessModal = () => {
    trackExerciseComplete('ScratchCards');
    setShowSuccessModal(false);

    const isTaskFinished =
      isTinySteps &&
      finishLearningPathTask({
        currentActiveTask,
        completeTask,
        setActiveTask,
        navigate,
      });

    if (!isTaskFinished) {
      loadNextImage();
    }
  };

  // Listen for the back button click from App.jsx via a custom event
  useEffect(() => {
    const handleTrigger = () => {
      if (isTinySteps) {
        setShowSuccessModal(true);
        playTapSound();
      }
    };
    window.addEventListener('trigger-task-completion', handleTrigger);
    return () => window.removeEventListener('trigger-task-completion', handleTrigger);
  }, [isTinySteps]);

  return (
    <>
      <div className="scratch-game-container">
        <div className="scratch-canvas-wrapper">
          <canvas ref={backgroundCanvasRef} className="scratch-canvas-bg" />
          <canvas
            ref={foregroundCanvasRef}
            className="scratch-canvas-fg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none' }}
          />
          <SparkleRenderer />
        </div>
        <div className="navigation-controls scratch-navigation-controls">
          <button
            onClick={loadPreviousImage}
            className="nav-button nav-control-button nav-button--back"
          >
            <span className="text-white text-2xl rotate-180">➜</span>
          </button>
          <button
            onClick={loadNextImage}
            className="nav-button nav-control-button nav-button--next"
          >
            <span className="text-white text-2xl">➜</span>
          </button>
        </div>
        {isTinySteps && (
          <button
            onClick={handleSkipWithStars}
            className="btn-skip-level"
            disabled={isSpendingStars}
            title={t('common.actions.skip')}
          >
            <span className="skip-icon">🌟</span> {isSpendingStars ? '...' : `${t('common.actions.skip')} (100 🌟)`}
          </button>
        )}

        {showSuccessModal && (
          <SuccessModal
            handleClose={handleCloseSuccessModal}
            message={t('scratchGame.success', 'Wow! You revealed the picture!')}
            starsWon={1}
          ></SuccessModal>
        )}
      </div>
    </>
  );
}
