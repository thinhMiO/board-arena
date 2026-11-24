import React from 'react';
import { sound } from '../../services/audio';

export const GomokuBoard = ({ gameState, onMove, isInteractive = true }) => {
  const { size, board, lastMove, winningLine } = gameState;

  const handleClick = (r, c) => {
    if (!isInteractive || gameState.gameOver || board[r][c] !== null) return;
    onMove({ r, c });
    sound.playMove();
  };

  const isWinningCell = (r, c) => {
    if (!winningLine) return false;
    return winningLine.some(pt => pt.r === r && pt.c === c);
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="border-4 sm:border-8 border-[#734822] rounded-2xl overflow-hidden shadow-2xl bg-[#dca868] p-1 sm:p-2.5 max-w-full">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
            width: 'min(86vw, min(68vh, 480px))',
            height: 'min(86vw, min(68vh, 480px))'
          }}
          className="border border-[#8f5d2f] bg-[#e4b276] rounded-md shadow-inner"
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLast = lastMove && lastMove.r === r && lastMove.c === c;
              const isWin = isWinningCell(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  style={{ width: '100%', height: '100%' }}
                  className="relative flex items-center justify-center cursor-pointer group"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-[#9e6734]" />
                    <div className="h-full w-[1px] bg-[#9e6734] absolute" />
                  </div>

                  {((size === 15 && (r === 3 || r === 7 || r === 11) && (c === 3 || c === 7 || c === 11)) ||
                    (size === 19 && (r === 3 || r === 9 || r === 15) && (c === 3 || c === 9 || c === 15))) &&
                    !cell && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6a3f16] z-0" />
                    )}

                  {cell && (
                    <div
                      className={`relative z-10 w-[84%] h-[84%] rounded-full flex items-center justify-center shadow-lg transition-transform ${
                        cell === 'X'
                          ? 'bg-gradient-to-br from-neutral-800 to-black text-white shadow-neutral-900/80'
                          : 'bg-gradient-to-br from-white to-slate-200 text-slate-900 shadow-slate-600/40'
                      } ${isWin ? 'ring-4 ring-amber-400 scale-110 animate-pulse' : ''}`}
                    >
                      {isLast && (
                        <div className={`w-2 h-2 rounded-full ${cell === 'X' ? 'bg-amber-400' : 'bg-red-500'}`} />
                      )}
                    </div>
                  )}

                  {!cell && isInteractive && !gameState.gameOver && (
                    <div
                      className={`hidden group-hover:block absolute w-[74%] h-[74%] rounded-full opacity-40 z-10 ${
                        gameState.turn === 0 ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
