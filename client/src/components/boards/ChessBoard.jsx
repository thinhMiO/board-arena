import React, { useState } from 'react';
import { sound } from '../../services/audio';
import { ChessPiece } from './ChessPieces';

export const ChessBoard = ({ gameState, onMove, playerIndex, gameEngine, isInteractive = true }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const board = gameState.board;

  // Calculate all valid moves for current turn
  const validMoves = (isInteractive && !gameState.gameOver && gameEngine)
    ? gameEngine.getValidMoves(gameState, gameState.turn)
    : [];

  // Filter valid destination moves for the selected piece
  const candidateMoves = selectedSquare
    ? validMoves.filter(m => m.from.r === selectedSquare.r && m.from.c === selectedSquare.c)
    : [];

  const isSelected = (r, c) => selectedSquare && selectedSquare.r === r && selectedSquare.c === c;

  const handleSquareClick = (r, c) => {
    if (!isInteractive || gameState.gameOver) return;

    const clickedPiece = board[r][c];

    // If a piece is already selected
    if (selectedSquare) {
      if (selectedSquare.r === r && selectedSquare.c === c) {
        setSelectedSquare(null);
        return;
      }

      // Check if clicking another own piece
      if (clickedPiece && clickedPiece.color === gameState.turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
        return;
      }

      // Check if target square is in candidate moves
      const matchingMove = candidateMoves.find(m => m.to.r === r && m.to.c === c);

      if (matchingMove) {
        onMove(matchingMove);
        setSelectedSquare(null);
        sound.playMove();
      } else {
        setSelectedSquare(null);
      }
    } else {
      // Select own piece that has valid moves
      if (clickedPiece && clickedPiece.color === gameState.turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
      }
    }
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      {/* Outer Wooden Border */}
      <div className="relative border-4 sm:border-8 border-[#3b2d22] rounded-2xl shadow-2xl bg-[#261c14] p-1 sm:p-2.5 max-w-full">
        {/* Strict 8x8 Equal Aspect-Square Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            width: 'min(86vw, min(68vh, 500px))',
            height: 'min(86vw, min(68vh, 500px))'
          }}
          className="border-2 border-[#4a3b2c] rounded-lg overflow-hidden shadow-inner"
        >
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const sel = isSelected(r, c);
              const isLastMove = gameState.lastMove &&
                ((gameState.lastMove.from.r === r && gameState.lastMove.from.c === c) ||
                 (gameState.lastMove.to.r === r && gameState.lastMove.to.c === c));

              // Check if square is a valid move target
              const targetMove = candidateMoves.find(m => m.to.r === r && m.to.c === c);
              const isCapture = targetMove && (piece !== null || targetMove.isEnPassant);
              const isQuietMove = targetMove && !isCapture;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  style={{ width: '100%', height: '100%' }}
                  className={`relative flex items-center justify-center cursor-pointer transition-all duration-100 ${
                    isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'
                  } ${sel ? '!bg-[#f7c04a] ring-4 ring-amber-400 z-10' : ''} ${
                    isLastMove && !sel ? 'after:absolute after:inset-0 after:bg-[#f5e15c]/50' : ''
                  }`}
                >
                  {/* File & Rank Coordinate Labels */}
                  {c === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold leading-none pointer-events-none ${
                        isDark ? 'text-[#eeeed2]' : 'text-[#769656]'
                      }`}
                    >
                      {8 - r}
                    </span>
                  )}
                  {r === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold leading-none pointer-events-none ${
                        isDark ? 'text-[#eeeed2]' : 'text-[#769656]'
                      }`}
                    >
                      {files[c]}
                    </span>
                  )}

                  {/* VALID MOVE INDICATOR: Dot for empty squares */}
                  {isQuietMove && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/30 ring-1 ring-black/10 z-20 pointer-events-none transition-transform transform scale-110" />
                  )}

                  {/* VALID CAPTURE INDICATOR: Outer capture ring around enemy piece */}
                  {isCapture && (
                    <div className="absolute inset-1 sm:inset-1.5 rounded-full border-4 sm:border-[5px] border-slate-900/35 z-20 pointer-events-none animate-pulse" />
                  )}

                  {/* High Quality Vector Chess Piece */}
                  {piece && (
                    <div className="w-full h-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-10">
                      <ChessPiece type={piece.type} color={piece.color} />
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
