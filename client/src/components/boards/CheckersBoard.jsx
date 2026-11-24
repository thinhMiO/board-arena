import React, { useState } from 'react';
import { sound } from '../../services/audio';

export const CheckersBoard = ({ gameState, onMove, gameEngine, isInteractive = true }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const board = gameState.board;

  const validMoves = (isInteractive && !gameState.gameOver && gameEngine)
    ? gameEngine.getValidMoves(gameState, gameState.turn)
    : [];

  const candidateMoves = selectedSquare
    ? validMoves.filter(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c)
    : [];

  const isSelected = (r, c) => selectedSquare && selectedSquare.r === r && selectedSquare.c === c;

  const handleClick = (r, c) => {
    if (!isInteractive || gameState.gameOver) return;
    const piece = board[r][c];

    if (selectedSquare) {
      if (selectedSquare.r === r && selectedSquare.c === c) {
        setSelectedSquare(null);
        return;
      }
      if (piece && piece.player === gameState.turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
        return;
      }

      const matchingMove = candidateMoves.find(m => m.to.r === r && m.to.c === c);
      if (matchingMove) {
        onMove(matchingMove);
        setSelectedSquare(null);
        sound.playMove();
      } else {
        setSelectedSquare(null);
      }
    } else {
      if (piece && piece.player === gameState.turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="border-4 sm:border-8 border-[#3c2a1e] rounded-2xl overflow-hidden shadow-2xl bg-[#281b13] p-1 sm:p-2.5 max-w-full">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            width: 'min(86vw, min(68vh, 480px))',
            height: 'min(86vw, min(68vh, 480px))'
          }}
          className="border border-[#4a3525] rounded-lg overflow-hidden"
        >
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const sel = isSelected(r, c);
              const targetMove = candidateMoves.find(m => m.to.r === r && m.to.c === c);

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => isDark && handleClick(r, c)}
                  style={{ width: '100%', height: '100%' }}
                  className={`relative flex items-center justify-center ${
                    isDark ? 'bg-[#533827] cursor-pointer' : 'bg-[#e2cbb4]'
                  } ${sel ? '!bg-amber-600 ring-4 ring-amber-400 z-10' : ''}`}
                >
                  {/* VALID MOVE HINT: Glowing Target Dot */}
                  {targetMove && (
                    <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full z-20 pointer-events-none animate-pulse ${
                      targetMove.isJump ? 'bg-red-500 ring-4 ring-red-400/40' : 'bg-amber-400/70'
                    }`} />
                  )}

                  {piece && (
                    <div
                      className={`w-[78%] h-[78%] rounded-full flex items-center justify-center font-bold text-xs sm:text-base shadow-lg border-2 transform hover:scale-105 transition-transform ${
                        piece.player === 0
                          ? 'bg-gradient-to-br from-red-600 to-rose-900 border-red-400 text-white shadow-red-950/60'
                          : 'bg-gradient-to-br from-neutral-100 to-neutral-300 border-neutral-400 text-slate-800 shadow-black/40'
                      }`}
                    >
                      {piece.isKing ? '👑' : ''}
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
