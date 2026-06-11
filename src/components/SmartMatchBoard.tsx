import { memo, useMemo } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { SmartMatchItem } from '../constants/smartMatchConstants';

interface DragState {
  r: number;
  c: number;
  x: number;
  y: number;
}

interface SmartMatchBoardProps {
  grid: (SmartMatchItem | null)[][];
  gameId: number;
  selectedCell: { r: number; c: number } | null;
  matchingItems: string[];
  hintItems: string[];
  dragState: DragState | null;
  isProcessing: boolean;
  cellRefs: MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  setDragState: Dispatch<SetStateAction<DragState | null>>;
  onCellClick: (r: number, c: number) => void;
  onPanEnd: (r: number, c: number, info: PanInfo) => void;
}

const getNeighborOffset = (row: number, col: number, dragState: DragState | null) => {
  if (!dragState) return { x: 0, y: 0 };

  const rowDistance = Math.abs(row - dragState.r);
  const colDistance = Math.abs(col - dragState.c);
  const threshold = 10;
  const isXDominant = Math.abs(dragState.x) > Math.abs(dragState.y);

  if (!((rowDistance === 1 && colDistance === 0) || (rowDistance === 0 && colDistance === 1))) {
    return { x: 0, y: 0 };
  }

  const isTarget = isXDominant
    ? (dragState.x > threshold && col === dragState.c + 1 && row === dragState.r) ||
      (dragState.x < -threshold && col === dragState.c - 1 && row === dragState.r)
    : (dragState.y > threshold && row === dragState.r + 1 && col === dragState.c) ||
      (dragState.y < -threshold && row === dragState.r - 1 && col === dragState.c);

  return isTarget
    ? { x: isXDominant ? -dragState.x : 0, y: isXDominant ? 0 : -dragState.y }
    : { x: 0, y: 0 };
};

type CellProps = {
  row: number;
  col: number;
  item: SmartMatchItem | null;
  isSelected: boolean;
  isMatching: boolean;
  isHint: boolean;
  neighborOffset: { x: number; y: number };
  zIndex: number;
  isProcessing: boolean;
  cellRefs: MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  setDragState: Dispatch<SetStateAction<DragState | null>>;
  onCellClick: (r: number, c: number) => void;
  onPanEnd: (r: number, c: number, info: PanInfo) => void;
};

const SmartMatchCell = memo(function SmartMatchCell({
  row,
  col,
  item,
  isSelected,
  isMatching,
  isHint,
  neighborOffset,
  zIndex,
  isProcessing,
  cellRefs,
  setDragState,
  onCellClick,
  onPanEnd,
}: CellProps) {
  return (
    <motion.div
      key={item?.id || `empty-${row}-${col}`}
      ref={(el) => {
        cellRefs.current[`${row}-${col}`] = el;
      }}
      className={`board-cell ${isSelected ? 'selected' : ''} ${isMatching ? 'is-matching' : ''} ${isHint ? 'is-hint' : ''} ${item?.special ? `is-special is-special-${item.special}` : ''}`}
      style={{ zIndex }}
      onClick={() => onCellClick(row, col)}
      drag={!isProcessing}
      dragConstraints={{ left: -60, right: 60, top: -60, bottom: 60 }}
      dragElastic={0.1}
      dragSnapToOrigin
      onDragStart={() => setDragState({ r: row, c: col, x: 0, y: 0 })}
      onDrag={(_, info) => setDragState({ r: row, c: col, x: info.offset.x, y: info.offset.y })}
      onDragEnd={(_, info) => onPanEnd(row, col, info)}
      layout
      initial={{ scale: 0 }}
      animate={{
        x: neighborOffset.x,
        y: neighborOffset.y,
        scale: isMatching ? 1.3 : isHint ? [1, 1.15, 1] : 1,
        rotate: isMatching ? [0, -10, 10, 0] : 0,
      }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        scale: isHint ? { repeat: Infinity, duration: 1 } : undefined,
      }}
    >
      {item && (
        <span className="item-emoji" style={{ color: item.color }}>
          {item.emoji}
        </span>
      )}
    </motion.div>
  );
});

function SmartMatchBoard({
  grid,
  gameId,
  selectedCell,
  matchingItems,
  hintItems,
  dragState,
  isProcessing,
  cellRefs,
  setDragState,
  onCellClick,
  onPanEnd,
}: SmartMatchBoardProps) {
  const matchingItemSet = useMemo(() => new Set(matchingItems), [matchingItems]);
  const hintItemSet = useMemo(() => new Set(hintItems), [hintItems]);

  const boardRows = useMemo(
    () =>
      grid.map((row, r) => (
        <div key={r} className="board-row">
          {row.map((item, c) => {
            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const cellKey = `${r}-${c}`;
            const isMatching = matchingItemSet.has(cellKey);
            const isHint = hintItemSet.has(cellKey);
            const neighborOffset = getNeighborOffset(r, c, dragState);
            const zIndex =
              dragState?.r === r && dragState?.c === c
                ? 100
                : isSelected
                  ? 50
                  : isMatching
                    ? 10
                    : 1;

            return (
              <SmartMatchCell
                key={item?.id || `empty-${r}-${c}`}
                row={r}
                col={c}
                item={item}
                isSelected={isSelected}
                isMatching={isMatching}
                isHint={isHint}
                neighborOffset={neighborOffset}
                zIndex={zIndex}
                isProcessing={isProcessing}
                cellRefs={cellRefs}
                setDragState={setDragState}
                onCellClick={onCellClick}
                onPanEnd={onPanEnd}
              />
            );
          })}
        </div>
      )),
    [
      grid,
      selectedCell,
      matchingItemSet,
      hintItemSet,
      dragState,
      isProcessing,
      cellRefs,
      setDragState,
      onCellClick,
      onPanEnd,
    ],
  );

  return (
    <div className="game-board" key={gameId}>
      {boardRows}
    </div>
  );
}

export default memo(SmartMatchBoard);
