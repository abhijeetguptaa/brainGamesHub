import { useSparkleBurst } from '@/hooks/useSparkleBurst';
import React, { useRef, useState, useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useTranslation } from 'react-i18next';
import { playTapSound, speakText } from '../utils/soundUtils';
import { getRandomInt } from '../utils/utils';
import SuccessModal from './SuccessModal';
import '../styles/PaintBrush.scss';
import { getBrushTypes, COLOR_NAMES, COLORING_CONFIG } from '../constants/coloringConstants';
import { useLearningPathStore } from '../store/useLearningPathStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { finishLearningPathTask } from '../utils/learningPathUtils';
import { FcUndo } from 'react-icons/fc';
import {
  setScreen,
  trackColorChange,
  trackBrushChange,
  trackBrushSizeChange,
  trackIconSelection,
  trackUndoAction,
  trackDrawingStart,
  trackSuccessModalShow,
} from '../utils/analytics';
interface IconColoringProps {
  icons: { component?: any; src?: string; name?: string }[];
}

export default function IconColoring({ icons = [] }: IconColoringProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentActiveTask, completeTask, setActiveTask, setIsTaskReadyToComplete } =
    useLearningPathStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const regionCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('multi');
  const [currentDrawingColor, setCurrentDrawingColor] = useState('multi');
  const [brushSize, setBrushSize] = useState(COLORING_CONFIG.DEFAULT_BRUSH_SIZE);
  const [brushType, setBrushType] = useState('neon');
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0, visible: false });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const { triggerSparkleBurst, SparkleRenderer } = useSparkleBurst();
  const loadTokenRef = useRef(0);

  useEffect(() => {
    setScreen('IconColoring');
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory((prev) => [...prev.slice(-19), dataUrl]);
  };

  const undo = () => {
    if (history.length <= 1) {
      if (history.length === 1) {
        clearCanvas();
        setHistory([]);
      }
      return;
    }
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = previousState;
    setHistory(newHistory);
    playTapSound();
    trackUndoAction('IconColoring');
  };
  const [currentIconIndex, setCurrentIconIndex] = useState(() =>
    icons.length > 0 ? getRandomInt(0, icons.length - 1) : 0,
  );

  useEffect(() => {
    setHistory([]);
    const entry = icons[currentIconIndex];
    if (entry) {
      trackIconSelection(entry.name || 'unknown', 'IconColoring');
    }
  }, [currentIconIndex]);

  useEffect(() => {
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
    setTimeout(() => {
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
    }, 200);

    return () => picker.removeEventListener('scroll', handleScroll);
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

  const isLearningPathTask =
    !!currentActiveTask && (location.pathname + location.search).includes(currentActiveTask.path);

  const cropToOpaqueBounds = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) return sourceCanvas;

    const { width, height } = sourceCanvas;
    if (width === 0 || height === 0) return sourceCanvas;
    const imageData = sourceCtx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return sourceCanvas;

    const croppedWidth = maxX - minX + 1;
    const croppedHeight = maxY - minY + 1;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;

    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return sourceCanvas;

    croppedCtx.drawImage(
      sourceCanvas,
      minX,
      minY,
      croppedWidth,
      croppedHeight,
      0,
      0,
      croppedWidth,
      croppedHeight,
    );
    return croppedCanvas;
  };

  const loadNextImage = () => {
    if (icons.length === 0) return;
    playTapSound();
    setCurrentIconIndex((prev) => (prev + 1) % icons.length);
  };

  const loadPreviousImage = () => {
    if (icons.length === 0) return;
    playTapSound();
    setCurrentIconIndex((prev) => (prev - 1 + icons.length) % icons.length);
  };

  useEffect(() => {
    const drawingCanvas = canvasRef.current;
    const outlineCanvas = outlineCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const regionCanvas = regionCanvasRef.current;
    if (!drawingCanvas || !outlineCanvas || !maskCanvas || !regionCanvas || icons.length === 0)
      return;

    const loadIcon = async () => {
      const token = ++loadTokenRef.current;
      const entry = icons[currentIconIndex];
      if (!entry) return;

      const setImageData = async (tempCanvas: HTMLCanvasElement, isImageSource: boolean) => {
        if (!drawingCanvas || !outlineCanvas || !maskCanvas || !regionCanvas) return;
        const centeredCanvas = cropToOpaqueBounds(tempCanvas);
        if (!centeredCanvas.width || !centeredCanvas.height) return;

        const drawCtx = drawingCanvas.getContext('2d');
        const outlineCtx = outlineCanvas.getContext('2d');
        const maskCtx = maskCanvas.getContext('2d');
        const regionCtx = regionCanvas.getContext('2d');

        if (!drawCtx || !outlineCtx || !maskCtx || !regionCtx) return;

        drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        regionCtx.clearRect(0, 0, regionCanvas.width, regionCanvas.height);

        const padding = 10;
        const maxWidth = drawingCanvas.width - padding * 2;
        const maxHeight = drawingCanvas.height - padding * 2;

        const scale =
          Math.min(maxWidth / centeredCanvas.width, maxHeight / centeredCanvas.height) * 0.95;
        if (!Number.isFinite(scale) || scale <= 0) return;
        const drawWidth = Math.max(1, Math.round(centeredCanvas.width * scale));
        const drawHeight = Math.max(1, Math.round(centeredCanvas.height * scale));

        const x = Math.round((drawingCanvas.width - drawWidth) / 2);
        const y = Math.round((drawingCanvas.height - drawHeight) / 2);

        const finalTempCanvas = document.createElement('canvas');
        finalTempCanvas.width = drawWidth;
        finalTempCanvas.height = drawHeight;
        const finalTempCtx = finalTempCanvas.getContext('2d');
        if (!finalTempCtx) return;
        finalTempCtx.drawImage(centeredCanvas, 0, 0, drawWidth, drawHeight);

        const imageData = finalTempCtx.getImageData(0, 0, drawWidth, drawHeight);
        const pixelData = imageData.data;

        const maskData = new ImageData(drawWidth, drawHeight);
        const outlineData = new ImageData(drawWidth, drawHeight);

        const rowBatchSize = 48;

        // --- PROCESSING LOGIC ---

        if (isImageSource) {
          // Cartoon/WebP Logic: Use dark pixels as border and flood-fill background
          const isDark = (i: number) => {
            const alpha = pixelData[i + 3];
            if (alpha < 10) return false;
            const r = pixelData[i],
              g = pixelData[i + 1],
              b = pixelData[i + 2];
            return (r + g + b) / 3 < 120;
          };

          for (let i = 0; i < pixelData.length; i += 4) {
            if (isDark(i)) {
              outlineData.data[i] = 0;
              outlineData.data[i + 1] = 0;
              outlineData.data[i + 2] = 0;
              outlineData.data[i + 3] = 255;
            }
            if (
              Math.floor(i / 4 / drawWidth) % (rowBatchSize * 2) === rowBatchSize * 2 - 1 &&
              i % (drawWidth * 4) === 0
            ) {
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              if (loadTokenRef.current !== token) return;
            }
          }

          const visited = new Uint8Array(drawWidth * drawHeight);
          const queue: [number, number][] = [];
          for (let ix = 0; ix < drawWidth; ix++) {
            if (!isDark(ix * 4) && !visited[ix]) {
              visited[ix] = 1;
              queue.push([ix, 0]);
            }
            const bIdx = (drawHeight - 1) * drawWidth + ix;
            if (!isDark(bIdx * 4) && !visited[bIdx]) {
              visited[bIdx] = 1;
              queue.push([ix, drawHeight - 1]);
            }
          }
          for (let iy = 0; iy < drawHeight; iy++) {
            const lIdx = iy * drawWidth;
            if (!isDark(lIdx * 4) && !visited[lIdx]) {
              visited[lIdx] = 1;
              queue.push([0, iy]);
            }
            const rIdx = iy * drawWidth + (drawWidth - 1);
            if (!isDark(rIdx * 4) && !visited[rIdx]) {
              visited[rIdx] = 1;
              queue.push([drawWidth - 1, iy]);
            }
          }

          let head = 0;
          while (head < queue.length) {
            const [qx, qy] = queue[head++];
            const neighbors = [
              [qx + 1, qy],
              [qx - 1, qy],
              [qx, qy + 1],
              [qx, qy - 1],
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < drawWidth && ny >= 0 && ny < drawHeight) {
                const idx = ny * drawWidth + nx;
                if (!visited[idx] && !isDark(idx * 4)) {
                  visited[idx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
            if (head % 5000 === 0) {
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              if (loadTokenRef.current !== token) return;
            }
          }

          for (let i = 0; i < drawWidth * drawHeight; i++) {
            const pi = i * 4;
            if (!visited[i] && !isDark(pi)) {
              maskData.data[pi] = 255;
              maskData.data[pi + 1] = 255;
              maskData.data[pi + 2] = 255;
              maskData.data[pi + 3] = 255;
            }
            if (
              Math.floor(i / drawWidth) % (rowBatchSize * 4) === rowBatchSize * 4 - 1 &&
              i % drawWidth === 0
            ) {
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              if (loadTokenRef.current !== token) return;
            }
          }
        } else {
          // Icon/Emoji Logic: Original Edge Detection
          const isOpaque = (i: number) => {
            const alpha = pixelData[i + 3];
            if (alpha < 10) return false;
            const r = pixelData[i],
              g = pixelData[i + 1],
              b = pixelData[i + 2];
            return (r + g + b) / 3 < 240;
          };

          for (let i = 0; i < pixelData.length; i += 4) {
            if (isOpaque(i)) {
              const pixelX = (i / 4) % drawWidth;
              const pixelY = Math.floor(i / 4 / drawWidth);
              let isEdge = false;
              const edgeRadius = 2;
              for (let dy = -edgeRadius; dy <= edgeRadius && !isEdge; dy++) {
                for (let dx = -edgeRadius; dx <= edgeRadius && !isEdge; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  const nx = pixelX + dx;
                  const ny = pixelY + dy;
                  if (nx >= 0 && nx < drawWidth && ny >= 0 && ny < drawHeight) {
                    const ni = (ny * drawWidth + nx) * 4;
                    if (!isOpaque(ni)) isEdge = true;
                    else {
                      const diff =
                        Math.abs(pixelData[i] - pixelData[ni]) +
                        Math.abs(pixelData[i + 1] - pixelData[ni + 1]) +
                        Math.abs(pixelData[i + 2] - pixelData[ni + 2]);
                      if (diff > 60) isEdge = true;
                    }
                  } else isEdge = true;
                }
              }
              if (isEdge) {
                outlineData.data[i] = 0;
                outlineData.data[i + 1] = 0;
                outlineData.data[i + 2] = 0;
                outlineData.data[i + 3] = 255;
              }
            }
            if (
              Math.floor(i / 4 / drawWidth) % rowBatchSize === rowBatchSize - 1 &&
              i % (drawWidth * 4) === 0
            ) {
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              if (loadTokenRef.current !== token) return;
            }
          }

          const visited = new Uint8Array(drawWidth * drawHeight);
          const queue: [number, number][] = [];
          for (let ix = 0; ix < drawWidth; ix++) {
            if (!isOpaque(ix * 4)) queue.push([ix, 0]);
            if (!isOpaque(((drawHeight - 1) * drawWidth + ix) * 4))
              queue.push([ix, drawHeight - 1]);
          }
          for (let iy = 0; iy < drawHeight; iy++) {
            if (!isOpaque(iy * drawWidth * 4)) queue.push([0, iy]);
            if (!isOpaque((iy * drawWidth + (drawWidth - 1)) * 4)) queue.push([drawWidth - 1, iy]);
          }
          queue.forEach(([qx, qy]) => {
            visited[qy * drawWidth + qx] = 1;
          });
          let head = 0;
          while (head < queue.length) {
            const [qx, qy] = queue[head++];
            const neighbors = [
              [qx + 1, qy],
              [qx - 1, qy],
              [qx, qy + 1],
              [qx, qy - 1],
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < drawWidth && ny >= 0 && ny < drawHeight) {
                const idx = ny * drawWidth + nx;
                if (!visited[idx] && !isOpaque(idx * 4)) {
                  visited[idx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
            if (head % 10000 === 0) {
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              if (loadTokenRef.current !== token) return;
            }
          }
          for (let i = 0; i < drawWidth * drawHeight; i++) {
            if (!visited[i]) {
              const pi = i * 4;
              if (outlineData.data[pi + 3] === 0) {
                maskData.data[pi] = 255;
                maskData.data[pi + 1] = 255;
                maskData.data[pi + 2] = 255;
                maskData.data[pi + 3] = 255;
              }
            }
            if (
              Math.floor(i / drawWidth) % (rowBatchSize * 4) === rowBatchSize * 4 - 1 &&
              i % drawWidth === 0
            ) {
              await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
              if (loadTokenRef.current !== token) return;
            }
          }
        }

        maskCtx.putImageData(maskData, x, y);
        outlineCtx.putImageData(outlineData, x, y);

        // Save initial blank state to history
        const dataUrl = drawingCanvas.toDataURL();
        setHistory([dataUrl]);
      };

      if (entry.src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = entry.src;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        if (loadTokenRef.current !== token) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth || img.width;
        tempCanvas.height = img.naturalHeight || img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
          await setImageData(tempCanvas, true);
        }
      } else if (entry.component) {
        const IconComponent = (entry.component as any).type || entry.component;
        const emoji = (IconComponent as any).emoji;

        if (emoji) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 600;
          tempCanvas.height = 800;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;
          tempCtx.fillStyle = '#000000';
          tempCtx.font = '400px serif';
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';
          tempCtx.fillText(emoji, 300, 300);
          await setImageData(tempCanvas, false);
        } else {
          let svgString = '';
          try {
            svgString = ReactDOMServer.renderToStaticMarkup(
              React.createElement(IconComponent, { size: 400, color: '#000000' }),
            );
          } catch (err) {
            console.error('Failed to render icon coloring:', err);
            return;
          }
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = url;
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          if (loadTokenRef.current !== token) return;

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 600;
          tempCanvas.height = 800;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, 100, 50);
            await setImageData(tempCanvas, false);
          }
          URL.revokeObjectURL(url);
        }
      }
    };

    const setCanvasSize = () => {
      const parent = drawingCanvas.parentElement;
      if (parent) {
        const width = parent.clientWidth || window.innerWidth;
        const height = parent.clientHeight || window.innerHeight;

        if (width > 0 && height > 0) {
          drawingCanvas.width = width;
          drawingCanvas.height = height;
          outlineCanvas.width = width;
          outlineCanvas.height = height;
          maskCanvas.width = width;
          maskCanvas.height = height;
          regionCanvas.width = width;
          regionCanvas.height = height;

          if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
          }
          offscreenCanvasRef.current.width = width;
          offscreenCanvasRef.current.height = height;

          loadIcon();
        }
      }
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, [currentIconIndex, icons]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    const canvas = outlineCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const createRegionMask = (startX: number, startY: number) => {
    const maskCanvas = maskCanvasRef.current;
    const regionCanvas = regionCanvasRef.current;
    if (!maskCanvas || !regionCanvas) return false;

    const maskCtx = maskCanvas.getContext('2d');
    const regionCtx = regionCanvas.getContext('2d');
    if (!maskCtx || !regionCtx) return false;

    const width = maskCanvas.width;
    const height = maskCanvas.height;
    if (width === 0 || height === 0) return false;
    const maskImageData = maskCtx.getImageData(0, 0, width, height);
    const regionImageData = new ImageData(width, height);

    let x = Math.floor(startX);
    let y = Math.floor(startY);

    if (x < 0 || x >= width || y < 0 || y >= height) return false;

    let startIdx = (y * width + x) * 4;
    let isStartOpaque = maskImageData.data[startIdx + 3] > 0;

    // If we started on a transparent area (outline or background),
    // look for the nearest opaque pixel within a small radius (10px) to be forgiving
    if (!isStartOpaque) {
      let found = false;
      const radius = 10;
      for (let r = 1; r <= radius && !found; r++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = (ny * width + nx) * 4;
              if (maskImageData.data[nIdx + 3] > 0) {
                x = nx;
                y = ny;
                startIdx = nIdx;
                isStartOpaque = true;
                found = true;
              }
            }
          }
        }
      }
      if (!found) {
        regionCtx.clearRect(0, 0, width, height);
        return false;
      }
    }

    const visited = new Uint8Array(width * height);
    const queue: [number, number][] = [[x, y]];
    visited[y * width + x] = 1;

    let head = 0;
    while (head < queue.length) {
      const [qx, qy] = queue[head++];

      const idx = (qy * width + qx) * 4;
      regionImageData.data[idx] = 255;
      regionImageData.data[idx + 1] = 255;
      regionImageData.data[idx + 2] = 255;
      regionImageData.data[idx + 3] = 255;

      const neighbors = [
        [qx + 1, qy],
        [qx - 1, qy],
        [qx, qy + 1],
        [qx, qy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx]) {
            const isNeighborOpaque = maskImageData.data[nIdx * 4 + 3] > 0;
            // Only continue if the neighbor is also opaque
            // This restricts the fill to the current segment and prevents background coloring
            if (isNeighborOpaque) {
              visited[nIdx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }
    }

    regionCtx.clearRect(0, 0, width, height);
    regionCtx.putImageData(regionImageData, 0, 0);
    return true;
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== null) return;

    const coords = getCoordinates(e);
    const segmentFound = createRegionMask(coords.x, coords.y);

    if (!segmentFound) return;

    activePointerIdRef.current = e.pointerId;

    let activeColor = color;
    if (color === 'multi') {
      const colors = Object.keys(COLOR_NAMES).filter((c) => c !== 'multi');
      activeColor = colors[Math.floor(Math.random() * colors.length)];
    }
    setCurrentDrawingColor(activeColor);

    setIsDrawing(true);
    setLastPos(coords);
    setPointerPos({ x: coords.x, y: coords.y, visible: true });
    setShowMagnifier(true);
    setShowSizeSelector(false);
    trackDrawingStart('IconColoring');
  };

  const draw = (e: React.PointerEvent) => {
    const coords = getCoordinates(e);
    setPointerPos((prev) => ({ ...prev, x: coords.x, y: coords.y }));

    if (!isDrawing || e.pointerId !== activePointerIdRef.current) return;

    const canvas = canvasRef.current;
    const regionCanvas = regionCanvasRef.current;
    const magnifierCanvas = magnifierCanvasRef.current;

    if (!canvas || !regionCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We use an offscreen canvas to handle the segment clipping
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = canvas.width;
      offscreenCanvasRef.current.height = canvas.height;
    }
    const offCtx = offscreenCanvasRef.current.getContext('2d');
    if (!offCtx) return;

    // 1. Draw the stroke onto the clean offscreen canvas
    offCtx.clearRect(0, 0, canvas.width, canvas.height);
    offCtx.lineCap = 'round';
    offCtx.lineJoin = 'round';
    offCtx.lineWidth = brushSize;
    offCtx.globalCompositeOperation = 'source-over';

    switch (brushType) {
      case 'pencil':
      case 'neon': {
        let strokeColor = currentDrawingColor;
        offCtx.strokeStyle = strokeColor;
        if (brushType === 'neon') {
          offCtx.shadowBlur = 20;
          offCtx.shadowColor = strokeColor;
        }
        offCtx.beginPath();
        offCtx.moveTo(lastPos.x, lastPos.y);
        offCtx.lineTo(coords.x, coords.y);
        offCtx.stroke();
        offCtx.shadowBlur = 0;
        break;
      }
      case 'glitter':
        for (let i = 0; i < 25; i++) {
          const offsetX = (Math.random() - 0.5) * brushSize * 2;
          const offsetY = (Math.random() - 0.5) * brushSize * 2;
          offCtx.fillStyle = Math.random() > 0.5 ? currentDrawingColor : '#FFFFFF';
          offCtx.shadowBlur = 10;
          offCtx.shadowColor = currentDrawingColor;
          offCtx.fillRect(coords.x + offsetX, coords.y + offsetY, 2, 2);
        }
        offCtx.shadowBlur = 0;
        break;
    }

    // 2. Clip the offscreen drawing to the touched segment
    offCtx.globalCompositeOperation = 'destination-in';
    offCtx.drawImage(regionCanvas, 0, 0);

    // 3. Composite the clipped stroke onto the main drawing canvas
    ctx.drawImage(offscreenCanvasRef.current, 0, 0);

    // 4. NEW: Ensure the outline stays clean by erasing anything that might have bled into the border area
    if (outlineCanvasRef.current) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(outlineCanvasRef.current, 0, 0);
      ctx.restore();
    }

    setLastPos(coords);

    if (!magnifierCanvas) return;
    const magnifierCtx = magnifierCanvas.getContext('2d');
    if (!magnifierCtx) return;

    const zoom = 2;
    const sourceX = coords.x - magnifierCanvas.width / (2 * zoom);
    const sourceY = coords.y - magnifierCanvas.height / (2 * zoom);

    magnifierCtx.clearRect(0, 0, magnifierCanvas.width, magnifierCanvas.height);
    magnifierCtx.fillStyle = 'white';
    magnifierCtx.fillRect(0, 0, magnifierCanvas.width, magnifierCanvas.height);

    magnifierCtx.drawImage(
      canvas,
      sourceX,
      sourceY,
      magnifierCanvas.width / zoom,
      magnifierCanvas.height / zoom,
      0,
      0,
      magnifierCanvas.width,
      magnifierCanvas.height,
    );

    if (outlineCanvasRef.current) {
      magnifierCtx.drawImage(
        outlineCanvasRef.current,
        sourceX,
        sourceY,
        magnifierCanvas.width / zoom,
        magnifierCanvas.height / zoom,
        0,
        0,
        magnifierCanvas.width,
        magnifierCanvas.height,
      );
    }
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (e.pointerId !== activePointerIdRef.current) return;

    if (isDrawing) {
      const canvas = outlineCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        triggerSparkleBurst(
          lastPos.x * (rect.width / canvas.width),
          lastPos.y * (rect.height / canvas.height),
          { count: COLORING_CONFIG.SPARKLE_COUNT, range: COLORING_CONFIG.SPARKLE_RANGE },
        );
      }
      saveToHistory();
    }
    setIsDrawing(false);
    activePointerIdRef.current = null;
    setShowMagnifier(false);
    setPointerPos((prev) => ({ ...prev, visible: false }));
    checkIfFullyColored();
  };

  const checkIfFullyColored = () => {
    const drawingCanvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!drawingCanvas || !maskCanvas) return;
    const drawCtx = drawingCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!drawCtx || !maskCtx) return;
    const { width, height } = drawingCanvas;
    if (width === 0 || height === 0) return;
    const drawingImageData = drawCtx.getImageData(0, 0, width, height);
    const maskImageData = maskCtx.getImageData(0, 0, width, height);
    let totalDrawablePixels = 0;
    let coloredPixels = 0;
    for (let i = 0; i < maskImageData.data.length; i += 4) {
      if (maskImageData.data[i + 3] > 0) {
        totalDrawablePixels++;
        if (drawingImageData.data[i + 3] > 0) {
          coloredPixels++;
        }
      }
    }
    if (
      totalDrawablePixels > 0 &&
      (coloredPixels / totalDrawablePixels) * 100 > COLORING_CONFIG.FULLY_COLORED_THRESHOLD
    ) {
      trackSuccessModalShow('IconColoring');
      let minX = width,
        minY = height,
        maxX = 0,
        maxY = 0;
      let found = false;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (maskImageData.data[i + 3] > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            found = true;
          }
        }
      }

      if (found) {
        const padding = 10;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(width, maxX + padding);
        maxY = Math.min(height, maxY + padding);

        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = cropWidth;
        finalCanvas.height = cropHeight;
        const finalCtx = finalCanvas.getContext('2d');

        if (finalCtx && outlineCanvasRef.current) {
          finalCtx.drawImage(
            drawingCanvas,
            minX,
            minY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight,
          );
          finalCtx.drawImage(
            outlineCanvasRef.current,
            minX,
            minY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight,
          );
          setScreenshotUrl(finalCanvas.toDataURL('image/png'));
        }
      } else {
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const finalCtx = finalCanvas.getContext('2d');
        if (finalCtx && outlineCanvasRef.current) {
          finalCtx.drawImage(drawingCanvas, 0, 0);
          finalCtx.drawImage(outlineCanvasRef.current, 0, 0);
          setScreenshotUrl(finalCanvas.toDataURL('image/png'));
        }
      }

      if (isLearningPathTask) {
        setIsTaskReadyToComplete(true);
      }
      setShowSuccessModal(true);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setScreenshotUrl(null);
    if (
      !finishLearningPathTask({
        currentActiveTask,
        completeTask,
        setActiveTask,
        navigate,
      })
    ) {
      loadNextImage();
    }
  };

  useEffect(() => {
    const handleTrigger = () => {
      if (isLearningPathTask) {
        setShowSuccessModal(true);
      }
    };
    window.addEventListener('trigger-task-completion', handleTrigger);
    return () => window.removeEventListener('trigger-task-completion', handleTrigger);
  }, [isLearningPathTask]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveToHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    playTapSound();
  };

  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const brushSizes = [10, 20, 30, 40, 50];

  return (
    <div className="paintbrush-container">
      <div className="paintbrush-canvas-wrapper">
        <canvas ref={canvasRef} className="paintbrush-canvas" />
        <canvas ref={maskCanvasRef} className="paintbrush-canvas paintbrush-canvas--hidden" />
        <canvas ref={regionCanvasRef} className="paintbrush-canvas paintbrush-canvas--hidden" />
        <canvas
          ref={outlineCanvasRef}
          className="paintbrush-canvas"
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

      {showSizeSelector && (
        <div className="brush-size-selector">
          {brushSizes.map((size) => (
            <button
              key={size}
              className={`size-option ${brushSize === size ? 'active' : ''}`}
              onClick={() => {
                setBrushSize(size);
                setShowSizeSelector(false);
                trackBrushSizeChange(size, 'IconColoring');
              }}
            >
              <div
                className="size-preview"
                style={{
                  width: size * 0.6,
                  height: size * 0.6,
                  background:
                    color === 'multi'
                      ? 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)'
                      : color,
                }}
              />
            </button>
          ))}
          <button className="close-selector" onClick={() => setShowSizeSelector(false)}>
            ✕
          </button>
        </div>
      )}

      <div className="paintbrush-controls">
        <div className="color-group">
          <div className="color-picker-container" ref={colorPickerRef}>
            {[
              ...Object.keys(COLOR_NAMES),
              ...Object.keys(COLOR_NAMES),
              ...Object.keys(COLOR_NAMES),
            ].map((c, idx) => (
              <div
                key={`${c}-${idx}`}
                className={`color-option ${c === 'multi' ? 'multi' : ''} ${c === color ? 'selected' : ''}`}
                style={{ backgroundColor: c === 'multi' ? undefined : c }}
                onClick={() => {
                  speakText(COLOR_NAMES[c]);
                  setColor(c);
                  setShowSizeSelector(true);
                  trackColorChange(c, 'IconColoring');
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="control-group brush-controls">
        <div className="brush-types-container">
          <button
            className="nav-button nav-button--back"
            onClick={loadPreviousImage}
            title={t('genericColoring.alt.back')}
          >
            <span className="text-white text-2xl rotate-180">➜</span>
          </button>

          {getBrushTypes(t).map((type) => (
            <button
              key={type.id}
              className={`brush-type-button ${brushType === type.id ? 'active' : ''}`}
              onClick={() => {
                setBrushType(type.id);
                trackBrushChange(type.id, 'IconColoring');
              }}
              title={type.label}
            >
              <span className="brush-icon">{type.icon}</span>
            </button>
          ))}

          <button
            className="brush-type-button"
            onClick={undo}
            disabled={history.length <= 1}
            title={t('common.actions.undo')}
          >
            <span className="brush-icon">
              <FcUndo />
            </span>
          </button>

          <button
            className="nav-button nav-button--next"
            onClick={loadNextImage}
            title={t('genericColoring.alt.next')}
          >
            <span className="text-white text-2xl">➜</span>
          </button>
        </div>
      </div>

      {showMagnifier && (
        <div className="magnifier">
          <canvas ref={magnifierCanvasRef} width="150" height="150" className="magnifier-canvas" />
        </div>
      )}

      {showSuccessModal && (
        <SuccessModal handleClose={handleCloseSuccessModal} message="" starsWon={1}>
          {screenshotUrl && (
            <div className="canvas-screenshot">
              <img src={screenshotUrl} alt={t('genericColoring.alt.coloredCanvas')} />
            </div>
          )}
        </SuccessModal>
      )}
    </div>
  );
}
