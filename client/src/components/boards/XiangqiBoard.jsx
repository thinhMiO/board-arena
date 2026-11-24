import React, { useState } from 'react';
import { sound } from '../../services/audio';

const XIANGQI_PIECES = {
  0: { K: '帥', A: '仕', E: '相', H: '傌', R: '俥', C: '炮', P: '兵' }, // Red
  1: { K: '將', A: '士', E: '象', H: '馬', R: '車', C: '砲', P: '卒' }  // Black
};

export const XiangqiBoard = ({ gameState, onMove, gameEngine, isInteractive = true }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const board = gameState.board;

  // Calculate all valid moves for current turn
  const validMoves = (isInteractive && !gameState.gameOver && gameEngine)
    ? gameEngine.getValidMoves(gameState, gameState.turn)
    : [];

  const candidateMoves = selectedSquare
    ? validMoves.filter(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c)
    : [];

  const isSelected = (r, c) => selectedSquare && selectedSquare.r === r && selectedSquare.c === c;

  const handleClick = (r, c) => {
    if (!isInteractive || gameState.gameOver) return;
    const clickedPiece = board[r][c];

    if (selectedSquare) {
      if (selectedSquare.r === r && selectedSquare.c === c) {
        setSelectedSquare(null);
        return;
      }

      if (clickedPiece && clickedPiece.color === gameState.turn) {
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
      if (clickedPiece && clickedPiece.color === gameState.turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="relative border-4 sm:border-8 border-[#5c3e21] rounded-2xl overflow-hidden shadow-2xl bg-[#e6b97e] p-1.5 sm:p-3 max-w-full">
        {/* Board Outer Grid: 9 files x 10 ranks */}
        <div
          style={{
            width: 'min(86vw, min(68vh, 480px))',
            height: 'min(95vw, min(75vh, 530px))'
          }}
          className="relative border-2 border-[#7a481c] bg-[#eed4ad]"
        >
          {/* River Banner */}
          <div className="absolute top-[45%] left-0 right-0 h-[10%] flex items-center justify-around text-[#7a481c] font-bold text-xs sm:text-sm tracking-widest border-t-2 border-b-2 border-[#7a481c] bg-[#f2dfbe]">
            <span>楚 河 (SỞ HÀ)</span>
            <span>漢 界 (HÁN GIỚI)</span>
          </div>

          {/* Interactive Click Points Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              gridTemplateRows: 'repeat(10, 1fr)'
            }}
            className="absolute inset-0"
          >
            {board.map((row, r) =>
              row.map((piece, c) => {
                const sel = isSelected(r, c);
                const isLastMove = gameState.lastMove &&
                  ((gameState.lastMove.from.r === r && gameState.lastMove.from.c === c) ||
                   (gameState.lastMove.to.r === r && gameState.lastMove.to.c === c));

                // Valid move indicator for Xiangqi
                const targetMove = candidateMoves.find(m => m.to.r === r && m.to.c === c);
                const isCapture = targetMove && piece !== null;
                const isQuietMove = targetMove && !isCapture;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleClick(r, c)}
                    className="relative flex items-center justify-center cursor-pointer group"
                  >
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-[#9e6b38]" />
                      <div className="h-full w-[1px] bg-[#9e6b38] absolute" />
                    </div>

                    {/* Palace Diagonals */}
                    {((r === 0 && c === 3) || (r === 7 && c === 3)) && (
                      <div className="absolute w-[200%] h-[200%] border-t border-r border-[#9e6b38]/40 pointer-events-none rotate-45 transform origin-top-left" />
                    )}

                    {/* Selection Indicator */}
                    {sel && (
                      <div className="absolute w-8 h-8 sm:w-11 sm:h-11 rounded-full border-2 border-amber-500 animate-pulse bg-amber-400/20 z-10" />
                    )}

                    {/* Last Move Indicator */}
                    {isLastMove && !sel && (
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-600 z-10" />
                    )}

                    {/* VALID MOVE HINT: Target Dot */}
                    {isQuietMove && (
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-600/60 ring-2 ring-emerald-400/40 z-20 pointer-events-none animate-pulse" />
                    )}

                    {/* VALID CAPTURE HINT: Ring on enemy piece */}
                    {isCapture && (
                      <div className="absolute w-8 h-8 sm:w-11 sm:h-11 rounded-full border-2 border-red-500 bg-red-500/20 z-20 pointer-events-none animate-ping" />
                    )}

                    {/* Chinese Chess Piece */}
                    {piece && (
                      <div
                        className={`relative z-20 w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-xl shadow-md border-2 transform group-hover:scale-110 transition-transform ${
                          piece.color === 0
                            ? 'bg-[#fff5ea] text-red-600 border-red-700 shadow-red-950/40'
                            : 'bg-[#29231f] text-amber-100 border-[#69584d] shadow-black/60'
                        }`}
                      >
                        {XIANGQI_PIECES[piece.color][piece.type]}
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
