import React from 'react';
import { sound } from '../../services/audio';

export const ReversiBoard = ({ gameState, onMove, gameEngine, isInteractive = true }) => {
  const { board, score, turn, lastMove } = gameState;

  // Calculate all valid moves (flips) for current turn
  const validMoves = (isInteractive && !gameState.gameOver && gameEngine)
    ? gameEngine.getValidMoves(gameState, gameState.turn)
    : [];

  const isLegalSquare = (r, c) => validMoves.some(m => m.r === r && m.c === c);

  const handleClick = (r, c) => {
    if (!isInteractive || gameState.gameOver || board[r][c] !== null) return;
    if (!isLegalSquare(r, c)) return;
    onMove({ r, c });
    sound.playMove();
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      {/* Score Header */}
      <div className="flex items-center justify-between w-[min(86vw,min(68vh,480px))] mb-2 px-4 py-1.5 glass-panel rounded-lg text-xs sm:text-sm">
        <div className={`flex items-center gap-2 font-bold ${turn === 0 ? 'text-emerald-400 ring-1 ring-emerald-400/40 rounded px-2' : 'text-slate-300'}`}>
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-neutral-600" />
          <span>Đen: {score.black}</span>
        </div>
        <div className={`flex items-center gap-2 font-bold ${turn === 1 ? 'text-emerald-400 ring-1 ring-emerald-400/40 rounded px-2' : 'text-slate-300'}`}>
          <div className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-300" />
          <span>Trắng: {score.white}</span>
        </div>
      </div>

      <div className="border-4 sm:border-8 border-[#143d2b] rounded-2xl overflow-hidden shadow-2xl bg-[#0f2e20] p-1 sm:p-2.5 max-w-full">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            width: 'min(86vw, min(68vh, 480px))',
            height: 'min(86vw, min(68vh, 480px))'
          }}
          className="gap-[1px] bg-[#0c2218] p-1 border border-emerald-950/60 rounded-lg"
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLast = lastMove && lastMove.r === r && lastMove.c === c;
              const isHint = isLegalSquare(r, c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  style={{ width: '100%', height: '100%' }}
                  className={`relative bg-[#1c543a] hover:bg-[#236848] flex items-center justify-center cursor-pointer transition-colors ${
                    isHint ? 'hover:bg-[#2e7d58]' : ''
                  }`}
                >
                  {/* Subtle 4 star points */}
                  {((r === 2 || r === 6) && (c === 2 || c === 6)) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0d2a1d] absolute" />
                  )}

                  {/* LEGAL MOVE HINT DOT (Othello indicator) */}
                  {isHint && cell === null && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-300/40 ring-1 ring-emerald-300/60 pointer-events-none animate-pulse" />
                  )}

                  {/* Placed Disc */}
                  {cell && (
                    <div
                      className={`w-[82%] h-[82%] rounded-full shadow-lg transform transition-all duration-200 ${
                        cell === 'B'
                          ? 'bg-gradient-to-br from-neutral-800 to-black border border-neutral-700 shadow-black'
                          : 'bg-gradient-to-br from-white to-slate-200 border border-slate-300 shadow-slate-900/40'
                      }`}
                    >
                      {isLast && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full ${cell === 'B' ? 'bg-amber-400' : 'bg-red-500'}`} />
                        </div>
                      )}
                    </div>
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
