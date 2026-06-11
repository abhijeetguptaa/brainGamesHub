import { useSparkleBurst } from '@/hooks/useSparkleBurst';
import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { playTapSound, speakText } from '../utils/soundUtils';
import SuccessModal from './SuccessModal';
import {
  setScreen,
  trackDrawingStart,
  trackSuccessModalShow,
} from '../utils/analytics';
import '../styles/PaintBrush.scss';
import { COLORING_CONFIG } from '../constants/coloringConstants';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const NUMBERS = Array.from({ length: 100 }, (_, i) => i.toString());

interface TracingGameProps {
  mode?: 'alphabets' | 'numbers';
}

export default function TracingGame({ mode = 'alphabets' }: TracingGameProps) {
  const { t } = useTranslation();

  useEffect(() => {
    setScreen('TracingGame_' + mode);
  }, [mode]);

  const DATA = mode === 'alphabets' ? ALPHABET : NUMBERS;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const regionCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingColor, setCurrentDrawingColor] = useState('#FF3B30');
  const brushSize = 70;
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0, visible: false });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastSparkleTimeRef = useRef(0);
  const loadTokenRef = useRef(0);

  // Sync color randomly on every new item load
  useEffect(() => {
    const brightColors = [
      '#95f800', '#FFCC00', '#06b6fb', '#FF00FF', '#f91307',
      '#007AFF', '#ff012f', '#FF9500', '#0bf847', '#a60af4',
      '#FFD700', '#08f3e7', '#ff2994', '#0aedd6', '#f75a21',
    ];
    const randomColor = brightColors[Math.floor(Math.random() * brightColors.length)];
    setCurrentDrawingColor(randomColor);
  }, [currentIndex]);

  const loadNext = () => {
    playTapSound();
    setCurrentIndex((prev) => (prev + 1) % DATA.length);
  };
  const loadPrev = () => {
    playTapSound();
    setCurrentIndex((prev) => (prev - 1 + DATA.length) % DATA.length);
  };

  useEffect(() => {
    const drawingCanvas = canvasRef.current;
    const outlineCanvas = outlineCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const regionCanvas = regionCanvasRef.current;
    if (!drawingCanvas || !outlineCanvas || !maskCanvas || !regionCanvas) return;

    const loadItem = async () => {
      const token = ++loadTokenRef.current;
      const item = DATA[currentIndex];
      const translated = t(`tracing.${item}`);
      speakText(translated === `tracing.${item}` ? item : translated);
      const drawCtx = drawingCanvas.getContext('2d');
      const outlineCtx = outlineCanvas.getContext('2d');
      const maskCtx = maskCanvas.getContext('2d');
      const regionCtx = regionCanvas.getContext('2d');
      if (!drawCtx || !outlineCtx || !maskCtx || !regionCtx) return;

      drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      regionCtx.clearRect(0, 0, regionCanvas.width, regionCanvas.height);

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = 512;
      sourceCanvas.height = 512;
      const tCtx = sourceCanvas.getContext('2d');
      if (tCtx) {
        tCtx.save();
        tCtx.fillStyle = '#000000';
        tCtx.strokeStyle = '#000000';
        tCtx.lineCap = 'round';
        tCtx.lineJoin = 'round';

        const fontSize = 400;
        tCtx.font = `bold ${fontSize}px sans-serif`;
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        tCtx.fillText(item, sourceCanvas.width / 2, sourceCanvas.height / 2 + 10);

        const contentData = tCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
        let minX = sourceCanvas.width, minY = sourceCanvas.height, maxX = 0, maxY = 0, hasPixels = false;
        for (let yIdx = 0; yIdx < sourceCanvas.height; yIdx++) {
          const rowOffset = yIdx * sourceCanvas.width;
          for (let xIdx = 0; xIdx < sourceCanvas.width; xIdx++) {
            if (contentData[(rowOffset + xIdx) * 4 + 3] > 20) {
              if (xIdx < minX) minX = xIdx;
              if (xIdx > maxX) maxX = xIdx;
              if (yIdx < minY) minY = yIdx;
              if (yIdx > maxY) maxY = yIdx;
              hasPixels = true;
            }
          }
        }

        if (!hasPixels) { tCtx.restore(); return; }

        const cropPadding = Math.max(10, Math.round(sourceCanvas.width * 0.035));
        minX = Math.max(0, minX - cropPadding);
        minY = Math.max(0, minY - cropPadding);
        maxX = Math.min(sourceCanvas.width - 1, maxX + cropPadding);
        maxY = Math.min(sourceCanvas.height - 1, maxY + cropPadding);

        const contentWidth = maxX - minX + 1, contentHeight = maxY - minY + 1;
        const contentCanvas = document.createElement('canvas');
        contentCanvas.width = contentWidth; contentCanvas.height = contentHeight;
        const cCtx = contentCanvas.getContext('2d');
        if (!cCtx) { tCtx.restore(); return; }

        cCtx.putImageData(tCtx.getImageData(minX, minY, contentWidth, contentHeight), 0, 0);
        tCtx.restore();

        const padding = 4;
        const scale = Math.min((drawingCanvas.width - padding * 2) / contentWidth, (drawingCanvas.height - padding * 2) / contentHeight) * 0.8;
        const drawWidth = Math.round(contentWidth * scale), drawHeight = Math.round(contentHeight * scale);
        const x = (drawingCanvas.width - drawWidth) / 2, y = (drawingCanvas.height - drawHeight) / 2;

        const pixelData = cCtx.getImageData(0, 0, contentWidth, contentHeight).data;
        const maskData = new ImageData(contentWidth, contentHeight), outlineData = new ImageData(contentWidth, contentHeight);
        const rowBatchSize = 64;

        for (let yIdx = 0; yIdx < contentHeight; yIdx++) {
          const rowOffset = yIdx * contentWidth;
          for (let xIdx = 0; xIdx < contentWidth; xIdx++) {
            const i = (rowOffset + xIdx) * 4;
            if (pixelData[i + 3] > 50) {
              maskData.data[i] = maskData.data[i + 1] = maskData.data[i + 2] = 180; maskData.data[i + 3] = 70;
              let isEdge = false;
              for (let dy = -1; dy <= 1 && !isEdge; dy++) {
                const ny = yIdx + dy;
                if (ny < 0 || ny >= contentHeight) { isEdge = true; break; }
                const nRowOffset = ny * contentWidth;
                for (let dx = -1; dx <= 1 && !isEdge; dx++) {
                  const nx = xIdx + dx;
                  if (nx < 0 || nx >= contentWidth || pixelData[(nRowOffset + nx) * 4 + 3] <= 50) isEdge = true;
                }
              }
              if (isEdge) { outlineData.data[i] = outlineData.data[i + 1] = outlineData.data[i + 2] = 150; outlineData.data[i + 3] = 255; }
            }
          }
          if (yIdx % rowBatchSize === rowBatchSize - 1) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            if (loadTokenRef.current !== token) return;
          }
        }

        if (loadTokenRef.current !== token) return;
        const mCanvas = document.createElement('canvas');
        mCanvas.width = contentWidth; mCanvas.height = contentHeight;
        mCanvas.getContext('2d')?.putImageData(maskData, 0, 0);
        const oCanvas = document.createElement('canvas');
        oCanvas.width = contentWidth; oCanvas.height = contentHeight;
        oCanvas.getContext('2d')?.putImageData(outlineData, 0, 0);

        outlineCtx.drawImage(mCanvas, x, y, drawWidth, drawHeight);
        outlineCtx.drawImage(oCanvas, x, y, drawWidth, drawHeight);
        maskCtx.drawImage(mCanvas, x, y, drawWidth, drawHeight);
      }
    };

    const setCanvasSize = () => {
      const parent = drawingCanvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const width = parent.clientWidth, height = parent.clientHeight;
        if (width > 0 && height > 0) {
          drawingCanvas.width = outlineCanvas.width = maskCanvas.width = regionCanvas.width = width * dpr;
          drawingCanvas.height = outlineCanvas.height = maskCanvas.height = regionCanvas.height = height * dpr;
          if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement('canvas');
          offscreenCanvasRef.current.width = width * dpr; offscreenCanvasRef.current.height = height * dpr;
          void loadItem();
        }
      }
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    return () => { loadTokenRef.current += 1; window.removeEventListener('resize', setCanvasSize); };
  }, [currentIndex, mode, t]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    const canvas = outlineCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e && (e as any).touches.length > 0) {
      clientX = (e as any).touches[0].clientX; clientY = (e as any).touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;
    const coords = getCoordinates(e);
    setIsDrawing(true); setLastPos(coords);
    setPointerPos({ x: coords.x, y: coords.y, visible: true });
    trackDrawingStart('TracingGame');
  };

  const draw = (e: React.PointerEvent) => {
    const coords = getCoordinates(e);
    setPointerPos((prev) => ({ ...prev, x: coords.x, y: coords.y }));
    if (!isDrawing || e.pointerId !== activePointerIdRef.current) return;

    const canvas = canvasRef.current, maskCanvas = maskCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    if (!canvas || !maskCanvas || !offscreenCanvasRef.current) return;

    const ctx = canvas.getContext('2d'), offCtx = offscreenCanvasRef.current.getContext('2d');
    if (!ctx || !offCtx) return;

    offCtx.clearRect(0, 0, canvas.width, canvas.height);
    offCtx.lineCap = 'round'; offCtx.lineJoin = 'round';
    offCtx.lineWidth = brushSize * dpr; offCtx.globalCompositeOperation = 'source-over';

    const strokeColor = currentDrawingColor;
    
    // Neon brush effect
    offCtx.strokeStyle = strokeColor;
    offCtx.shadowBlur = 20;
    offCtx.shadowColor = strokeColor;
    offCtx.beginPath(); 
    offCtx.moveTo(lastPos.x * dpr, lastPos.y * dpr); 
    offCtx.lineTo(coords.x * dpr, coords.y * dpr); 
    offCtx.stroke();
    offCtx.shadowBlur = 0;

    offCtx.globalCompositeOperation = 'destination-in';
    offCtx.drawImage(maskCanvas, 0, 0);
    ctx.drawImage(offscreenCanvasRef.current, 0, 0);

    if (Date.now() - lastSparkleTimeRef.current > 30) {
      const offsetX = (Math.random() - 0.5) * brushSize;
      const offsetY = (Math.random() - 0.5) * brushSize;
      triggerSparkleBurst(coords.x + offsetX, coords.y + offsetY, { 
        count: 3, 
        range: 50, 
        color: strokeColor, 
        silent: true 
      });
      lastSparkleTimeRef.current = Date.now();
    }
    setLastPos(coords);
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    if (isDrawing) {
      triggerSparkleBurst(lastPos.x, lastPos.y, { count: COLORING_CONFIG.SPARKLE_COUNT, range: COLORING_CONFIG.SPARKLE_RANGE, color: currentDrawingColor });
    }
    setIsDrawing(false); activePointerIdRef.current = null; setPointerPos((prev) => ({ ...prev, visible: false }));
    requestAnimationFrame(checkIfFullyColored);
  };

  const checkIfFullyColored = () => {
    const drawCtx = canvasRef.current?.getContext('2d'), maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!drawCtx || !maskCtx) return;
    const { width, height } = canvasRef.current!;
    const drawData = drawCtx.getImageData(0, 0, width, height).data, maskData = maskCtx.getImageData(0, 0, width, height).data;
    let total = 0, colored = 0;
    for (let i = 3; i < maskData.length; i += 16) { if (maskData[i] > 0) { total++; if (drawData[i] > 0) colored++; } }
    if (total > 0 && (colored / total) * 100 > 99.5) { setShowSuccessModal(true); trackSuccessModalShow('TracingGame'); }
  };

  return (
    <div className="paintbrush-container paintbrush-container--tracing">
      <div className="paintbrush-canvas-wrapper">
        <canvas ref={canvasRef} className="paintbrush-canvas" />
        <canvas ref={maskCanvasRef} className="paintbrush-canvas paintbrush-canvas--hidden" />
        <canvas ref={regionCanvasRef} className="paintbrush-canvas paintbrush-canvas--hidden" />
        <canvas ref={outlineCanvasRef} className="paintbrush-canvas" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing} onPointerCancel={stopDrawing} />
        {pointerPos.visible && (
          <div className="brush-pointer brush-pointer--blob" style={{ left: pointerPos.x, top: pointerPos.y, backgroundColor: currentDrawingColor, width: brushSize, height: brushSize }}>
            <div className="blob-eye left" /><div className="blob-eye right" /><div className="blob-mouth" />
          </div>
        )}
        <SparkleRenderer />
      </div>

      <div className="control-group brush-controls">
        <div className="brush-types-container">
          <button className="nav-button nav-button--back" onClick={loadPrev}>
            <span className="text-white text-2xl rotate-180">➜</span>
          </button>

          <button className="nav-button nav-button--next" onClick={loadNext}>
            <span className="text-white text-2xl">➜</span>
          </button>
        </div>
      </div>
      {showSuccessModal && <SuccessModal handleClose={() => { setShowSuccessModal(false); loadNext(); }} starsWon={1} />}
    </div>
  );
}
