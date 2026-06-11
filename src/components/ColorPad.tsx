import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useSparkleBurst } from '@/hooks/useSparkleBurst';
import { COLORING_CONFIG, COLOR_NAMES } from '../constants/coloringConstants';
import { getPointerCoordinates } from '../utils/utils';
import { speakText } from '../utils/soundUtils';
import {
  setScreen,
  trackColorChange,
  trackClearCanvas,
  trackDrawingStart,
} from '../utils/analytics';
import '../styles/PaintBrush.scss';

/**
 * FINAL MOBILE‑PERFECT KIDS COLORING COMPONENT (CENTERED + FITTED)
 */

export default function ColorPad() {
  const { t } = useTranslation();

  const [color, setColor] = useState('#FF3B30');
  const brushSize = COLORING_CONFIG.DEFAULT_BRUSH_SIZE / 20;
  const [currentMode, setCurrentMode] = useState('white');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingColor, setCurrentDrawingColor] = useState('#FF3B30');
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0, visible: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const isBlackboard = currentMode === 'black';

  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();

  useEffect(() => {
    setScreen('ColorPadGame');

    const picker = colorPickerRef.current;
    if (!picker) return;
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } =
        picker;
      const oneThirdWidth = scrollWidth / 3;
      const oneThirdHeight = scrollHeight / 3;

      if (scrollLeft <= 2) {
        picker.scrollLeft = oneThirdWidth + 2;
      } else if (scrollLeft >= scrollWidth - clientWidth - 2) {
        picker.scrollLeft = oneThirdWidth * 2 - clientWidth - 2;
      }

      if (scrollTop <= 2) {
        picker.scrollTop = oneThirdHeight + 2;
      } else if (scrollTop >= scrollHeight - clientHeight - 2) {
        picker.scrollTop = oneThirdHeight * 2 - clientHeight - 2;
      }
    };

    picker.addEventListener('scroll', handleScroll);
    // Initial center - center the selected color on mount
    const frameId = window.requestAnimationFrame(() => {
      if (!picker) return;
      const selectedOption = picker.querySelector('.color-option.selected') as HTMLElement;
      if (selectedOption) {
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
          const top =
            selectedOption.offsetTop - picker.clientHeight / 2 + selectedOption.clientHeight / 2;
          picker.scrollTop = top;
        } else {
          const left =
            selectedOption.offsetLeft - picker.clientWidth / 2 + selectedOption.clientWidth / 2;
          picker.scrollLeft = left;
        }
      } else {
        // Fallback to general centering if none selected
        picker.scrollLeft = picker.scrollWidth / 3;
        picker.scrollTop = picker.scrollHeight / 3;
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      picker.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const picker = colorPickerRef.current;
    if (!picker) return;

    const selectedOption = picker.querySelector('.color-option.selected') as HTMLElement;
    if (selectedOption) {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape) {
        const top =
          selectedOption.offsetTop - picker.clientHeight / 2 + selectedOption.clientHeight / 2;
        picker.scrollTo({ top, behavior: 'smooth' });
      } else {
        const left =
          selectedOption.offsetLeft - picker.clientWidth / 2 + selectedOption.clientWidth / 2;
        picker.scrollTo({ left, behavior: 'smooth' });
      }
    }
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;

      // Fill initial background if blackboard
      if (isBlackboard) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(canvas.parentElement || document.body);

    resizeCanvas();
    return () => observer.disconnect();
  }, [currentMode]);

  const toggleBoard = () => {
    const nextMode = isBlackboard ? 'white' : 'black';
    setCurrentMode(nextMode);
  };

  /** Pointer position */
  const getPos = (e: any) => getPointerCoordinates(e, canvasRef.current);

  const startDrawing = (e: any) => {
    const ctx = ctxRef.current;
    if (!ctx || activePointerIdRef.current !== null) return;

    activePointerIdRef.current = e.pointerId;
    const { x, y } = getPos(e);

    lastPosRef.current = { x, y };

    let activeColor = color;
    if (color === 'multi') {
      const colors = Object.keys(COLOR_NAMES).filter((c) => c !== 'multi');
      activeColor = colors[Math.floor(Math.random() * colors.length)];
    }
    setCurrentDrawingColor(activeColor);

    setIsDrawing(true);
    setPointerPos({ x, y, visible: true });
    trackDrawingStart('ColorPad');

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: any) => {
    const { x, y } = getPos(e);
    setPointerPos((prev) => ({ ...prev, x, y }));

    if (!isDrawing || e.pointerId !== activePointerIdRef.current) return;
    const ctx = ctxRef.current;
    if (!canvasRef.current || !ctx) return;

    const lastPos = lastPosRef.current;

    // Set line properties once
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0; // Ensure full opacity for a "filled" look

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);

    // --- STEP 1: SOLID COLOR BASE ---
    // This ensures the line is "filled" and not just a faint glow
    ctx.strokeStyle = currentDrawingColor;
    ctx.lineWidth = brushSize;
    // ctx.shadowColor = currentDrawingColor;
    // ctx.shadowBlur = brushSize * 1.2;
    ctx.stroke();

    // Reset shadow for performance and next segment
    ctx.shadowBlur = 0;
    lastPosRef.current = { x, y };
  };

  const stopDrawing = (e: any) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (isDrawing) {
      triggerSparkleBurst(lastPosRef.current.x, lastPosRef.current.y, {
        count: COLORING_CONFIG.SPARKLE_COUNT,
        range: COLORING_CONFIG.SPARKLE_RANGE,
      });
    }

    ctx.closePath();
    setIsDrawing(false);
    activePointerIdRef.current = null;
    setPointerPos((prev) => ({ ...prev, visible: false }));
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Reset any transforms (important if scaling was used earlier)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear full canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isBlackboard) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const activePalette = Object.keys(COLOR_NAMES);

  return (
    <div className="paintbrush-container">
      <div className="paintbrush-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className={`paintbrush-canvas ${isBlackboard ? 'bg-black' : 'bg-white'}`}
          style={{ cursor: 'crosshair' }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        {pointerPos.visible && (
          <div
            className="brush-pointer"
            style={{
              left: pointerPos.x,
              top: pointerPos.y,
              backgroundColor: currentDrawingColor,
              width: brushSize,
              height: brushSize,
            }}
          />
        )}
        <SparkleRenderer />
      </div>

      <div className="paintbrush-controls">
        <div className="color-group">
          <div className="color-picker-container" ref={colorPickerRef}>
            {[...activePalette, ...activePalette, ...activePalette].map((c, idx) => (
              <div
                key={`${c}-${idx}`}
                className={`color-option ${c === 'multi' ? 'multi' : ''} ${c === color ? 'selected' : ''}`}
                style={{ backgroundColor: c === 'multi' ? undefined : c }}
                onClick={() => {
                  speakText((COLOR_NAMES as any)[c] || c);
                  setColor(c);
                  trackColorChange(c, 'ColorPad');
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="control-group brush-controls">
        <div className="brush-types-container">
          <button
            className="brush-type-button bg-red-400 text-white"
            onClick={() => {
              clearCanvas();
              trackClearCanvas('ColorPad');
            }}
            title={t('common.actions.clear')}
          >
            <span className="brush-icon">🗑️</span>
          </button>
          <button
            className={`brush-type-button ${isBlackboard ? 'bg-white text-black' : 'bg-black text-white'}`}
            onClick={toggleBoard}
            title={
              isBlackboard
                ? t('coloring.categories.whiteboard')
                : t('coloring.categories.blackboard')
            }
          >
            <span className="brush-icon">{isBlackboard ? '⬜' : '⬛'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
