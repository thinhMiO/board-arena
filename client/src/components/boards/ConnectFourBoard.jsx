import React from 'react';
import { sound } from '../../services/audio';

export const ConnectFourBoard = ({ gameState, onMove, isInteractive = true }) => {
  const { cols, rows, board, lastMove, winningLine } = gameState;

  const handleColClick = col => {
    if (!isInteractive || gameState.gameOver || board[0][col] !== null) return;
    onMove({ col });
    sound.playMove();
  };

  const isWinningSlot = (r, c) => {
    if (!winningLine) return false;
    return winningLine.some(pt => pt.r === r && pt.c === c);
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top Drop Arrows */}
      <div className="grid grid-cols-7 w-[320px] xs:w-[350px] sm:w-[420px] mb-2 px-3">
        {Array(cols).fill(0).map((_, c) => (
          <button
            key={c}
            onClick={() => handleColClick(c)}
            disabled={!isInteractive || gameState.gameOver || board[0][c] !== null}
            className="flex justify-center text-amber-400 hover:text-amber-200 disabled:opacity-0 transition-all transform hover:-translate-y-1"
          >
            ▼
          </button>
        ))}
      </div>

      {/* Blue Plastic Frame */}
      <div className="border-4 border-blue-900 rounded-2xl bg-gradient-to-b from-blue-700 to-blue-900 p-3 sm:p-4 shadow-2xl shadow-blue-950/80">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 w-[320px] xs:w-[350px] sm:w-[420px]">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWin = isWinningSlot(r, c);
              const isLast = lastMove && lastMove.row === r && lastMove.col === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleColClick(c)}
                  className="aspect-square bg-[#0b1329] rounded-full p-1 cursor-pointer shadow-inner flex items-center justify-center overflow-hidden hover:brightness-110"
                >
                  {cell ? (
                    <div
                      className={`w-full h-full rounded-full transition-transform shadow-md ${
                        cell === 'R'
                          ? 'bg-gradient-to-br from-red-500 to-rose-700 shadow-red-900/60'
                          : 'bg-gradient-to-br from-yellow-300 to-amber-500 shadow-amber-900/60'
                      } ${isWin ? 'ring-4 ring-white scale-105 animate-bounce' : ''}`}
                    >
                      {isLast && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-white/70" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0a0f1d] shadow-inner" />
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
