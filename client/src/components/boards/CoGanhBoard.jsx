import React, { useState } from 'react';
import { sound } from '../../services/audio';

export const CoGanhBoard = ({ gameState, onMove, gameEngine, isInteractive = true }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const { board, turn } = gameState;

  const validMoves = (isInteractive && !gameState.gameOver && gameEngine)
    ? gameEngine.getValidMoves(gameState, gameState.turn)
    : [];

  const candidateMoves = selectedSquare
    ? validMoves.filter(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c)
    : [];

  const handleClick = (r, c) => {
    if (!isInteractive || gameState.gameOver) return;
    const piece = board[r][c];

    if (selectedSquare) {
      if (selectedSquare.r === r && selectedSquare.c === c) {
        setSelectedSquare(null);
        return;
      }
      if (piece === turn) {
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
      if (piece === turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="border-4 sm:border-8 border-emerald-950 rounded-2xl overflow-hidden shadow-2xl bg-[#0f2d1e] p-2 sm:p-4 max-w-full">
        <div
          style={{
            width: 'min(86vw, min(68vh, 460px))',
            height: 'min(86vw, min(68vh, 460px))'
          }}
          className="relative bg-[#143b27] border-2 border-emerald-600/40 rounded-xl"
        >
          {/* Diagonal SVG Lines of Cờ Gánh */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-emerald-500/40 stroke-2">
            <line x1="0%" y1="0%" x2="100%" y2="100%" />
            <line x1="100%" y1="0%" x2="0%" y2="100%" />
            <line x1="50%" y1="0%" x2="100%" y2="50%" />
            <line x1="100%" y1="50%" x2="50%" y2="100%" />
            <line x1="50%" y1="100%" x2="0%" y2="50%" />
            <line x1="0%" y1="50%" x2="50%" y2="0%" />
          </svg>

          {/* 5x5 Intersections Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(5, 1fr)'
            }}
            className="absolute inset-0"
          >
            {board.map((row, r) =>
              row.map((piece, c) => {
                const sel = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;
                const isTarget = candidateMoves.some(m => m.to.r === r && m.to.c === c);

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleClick(r, c)}
                    className="relative flex items-center justify-center cursor-pointer group"
                  >
                    {/* Orthogonal grid lines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-emerald-500/30" />
                      <div className="h-full w-[1px] bg-emerald-500/30 absolute" />
                    </div>

                    {/* Intersection Point Dot */}
                    <div className="w-2 h-2 rounded-full bg-emerald-400/40 absolute z-0" />

                    {/* VALID MOVE HINT: Glowing Target Dot */}
                    {isTarget && (
                      <div className="w-4 h-4 rounded-full bg-amber-400/80 ring-2 ring-amber-300 z-20 pointer-events-none animate-pulse" />
                    )}

                    {/* Placed Piece */}
                    {piece !== null && (
                      <div
                        className={`relative z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 transform group-hover:scale-110 transition-transform ${
                          piece === 0
                            ? 'bg-gradient-to-br from-blue-500 to-sky-700 border-sky-300 text-white shadow-sky-950/80'
                            : 'bg-gradient-to-br from-red-500 to-rose-700 border-rose-300 text-white shadow-rose-950/80'
                        } ${sel ? 'ring-4 ring-amber-400 scale-110 animate-pulse' : ''}`}
                      >
                        {piece === 0 ? 'X' : 'Đ'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
