import { getStrikeLineCoordinates } from '../utils/ticTacToeUtils';

const TicTacToeBoard = ({ board, winnerInfo, boardRef, onCellClick }) => (
  <div className="ttt-board-wrapper">
    <div className="ttt-board" ref={boardRef}>
      {board.flat().map((cell, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        let cellClass = 'ttt-cell';

        if (cell === 'X') cellClass += ' x-purple';
        if (cell === 'O') cellClass += ' o-cyan';

        return (
          <button
            key={`cell-${row}-${col}-${cell || '-'}`}
            className={cellClass}
            onClick={() => onCellClick(row, col)}
            disabled={Boolean(cell) || Boolean(winnerInfo)}
            tabIndex={0}
          >
            {cell}
          </button>
        );
      })}

      {winnerInfo && (
        <svg className="ttt-strike" width="100%" height="100%" viewBox="0 0 3 3">
          {(() => {
            const { start, end } = getStrikeLineCoordinates(winnerInfo.line);

            return (
              <line
                x1={start[0]}
                y1={start[1]}
                x2={end[0]}
                y2={end[1]}
                stroke="var(--color-strike, #fff200)"
                strokeWidth={0.08}
                strokeLinecap="round"
                filter="url(#glow)"
              />
            );
          })()}
        </svg>
      )}
    </div>
  </div>
);

export default TicTacToeBoard;
