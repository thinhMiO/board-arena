import React, { useState, useEffect } from 'react';
import { sound } from '../../services/audio';
import { ChessPiece } from './ChessPieces';
import { RotateCcw } from 'lucide-react';

const CHESS_THEMES = {
  bw: {
    id: 'bw',
    name: '🏁 Trắng Đen',
    darkSquare: 'bg-[#18181b]', // Zinc-900: Đen tuyền sắc nét
    lightSquare: 'bg-[#f4f4f5]', // Zinc-100: Trắng tinh tương phản cao
    border: 'border-[#09090b] bg-[#000000]',
    innerBorder: 'border-[#27272a]',
    coordLight: 'text-[#18181b]',
    coordDark: 'text-[#f4f4f5]',
    lastMove: 'after:bg-amber-400/35',
    selected: '!bg-[#38bdf8]/50 ring-4 ring-cyan-400',
    moveDot: 'bg-zinc-600/50 ring-1 ring-black/30',
    captureRing: 'border-red-500/80'
  },
  dark: {
    id: 'dark',
    name: '🌙 Tối Slate',
    darkSquare: 'bg-[#1e293b]', // Slate-800
    lightSquare: 'bg-[#334155]', // Slate-700
    border: 'border-[#0f172a] bg-[#090d16]',
    innerBorder: 'border-[#1e293b]',
    coordLight: 'text-[#94a3b8]',
    coordDark: 'text-[#64748b]',
    lastMove: 'after:bg-cyan-500/30',
    selected: '!bg-[#0284c7]/50 ring-4 ring-cyan-400',
    moveDot: 'bg-cyan-400/40 ring-1 ring-cyan-300/30',
    captureRing: 'border-red-400/70'
  },
  green: {
    id: 'green',
    name: '🌲 Xanh Quốc Tế',
    darkSquare: 'bg-[#769656]',
    lightSquare: 'bg-[#eeeed2]',
    border: 'border-[#3b2d22] bg-[#261c14]',
    innerBorder: 'border-[#4a3b2c]',
    coordLight: 'text-[#769656]',
    coordDark: 'text-[#eeeed2]',
    lastMove: 'after:bg-[#f5e15c]/50',
    selected: '!bg-[#f7c04a] ring-4 ring-amber-400',
    moveDot: 'bg-slate-900/30 ring-1 ring-black/10',
    captureRing: 'border-slate-900/35'
  },
  wood: {
    id: 'wood',
    name: '🪵 Gỗ Cổ Điển',
    darkSquare: 'bg-[#b58863]',
    lightSquare: 'bg-[#f0d9b5]',
    border: 'border-[#4a2e18] bg-[#2e1a0b]',
    innerBorder: 'border-[#5c3a1e]',
    coordLight: 'text-[#b58863]',
    coordDark: 'text-[#f0d9b5]',
    lastMove: 'after:bg-amber-400/40',
    selected: '!bg-amber-500/50 ring-4 ring-amber-400',
    moveDot: 'bg-[#4a2e18]/40 ring-1 ring-[#2e1a0b]/20',
    captureRing: 'border-[#4a2e18]/60'
  }
};

export const ChessBoard = ({ gameState, onMove, playerIndex = 0, gameEngine, isInteractive = true }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  // Default flipped if playing as Black (playerIndex === 1) so player's pieces are always at bottom
  const [isFlipped, setIsFlipped] = useState(playerIndex === 1);

  // Browser/system dark mode detection
  const getBrowserPrefersDark = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  };

  const [systemIsDark, setSystemIsDark] = useState(getBrowserPrefersDark);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('chess_theme_mode') || 'auto');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    setIsFlipped(playerIndex === 1);
  }, [playerIndex]);

  // When themeMode is 'auto', automatically use 'bw' (Black & White Darkmode) if browser is dark, or 'green' if light
  const activeThemeKey = themeMode === 'auto'
    ? (systemIsDark ? 'bw' : 'green')
    : themeMode;

  const theme = CHESS_THEMES[activeThemeKey] || CHESS_THEMES.bw;
  const board = gameState.board;

  const toggleTheme = (newMode) => {
    setThemeMode(newMode);
    localStorage.setItem('chess_theme_mode', newMode);
  };

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

  // Board display order (normal: rows 0..7, cols 0..7; flipped: rows 7..0, cols 7..0)
  const displayRows = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const displayCols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      {/* Board Controls Toolbar: Browser Auto Dark Mode, Monochrome & Flip */}
      <div className="w-[min(86vw,min(68vh,500px))] mb-1.5 flex items-center justify-between text-xs px-1 flex-wrap gap-1">
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow">
          <button
            onClick={() => toggleTheme('auto')}
            title="Tự động đổi theo Darkmode trình duyệt/hệ điều hành"
            className={`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-all ${
              themeMode === 'auto' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🖥️ Theo trình duyệt</span>
          </button>
          <button
            onClick={() => toggleTheme('bw')}
            title="Bàn cờ Trắng Đen tương phản cao (Monochrome)"
            className={`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-all ${
              themeMode === 'bw' || (themeMode === 'auto' && systemIsDark) ? 'bg-zinc-800 text-white border border-zinc-600 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏁 Trắng Đen</span>
          </button>
          <button
            onClick={() => toggleTheme('green')}
            title="Màu Xanh Thi Đấu Chuẩn"
            className={`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-all ${
              themeMode === 'green' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🌲 Xanh</span>
          </button>
          <button
            onClick={() => toggleTheme('wood')}
            title="Màu Gỗ Cổ Điển"
            className={`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-all ${
              themeMode === 'wood' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🪵 Gỗ</span>
          </button>
        </div>

        <button
          onClick={() => setIsFlipped(prev => !prev)}
          title="Xoay lật chiều bàn cờ"
          className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-300 font-bold text-[10px] sm:text-[11px] border border-slate-800 shadow flex items-center gap-1.5 transition-all active:scale-95"
        >
          <RotateCcw className="w-3 h-3 text-amber-400" />
          <span>{isFlipped ? 'Chiều: Quân Đen' : 'Chiều: Quân Trắng'}</span>
        </button>
      </div>

      {/* Outer Border */}
      <div className={`relative border-4 sm:border-8 ${theme.border} rounded-2xl shadow-2xl p-1 sm:p-2.5 max-w-full transition-colors duration-200`}>
        {/* Strict 8x8 Equal Aspect-Square Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            width: 'min(86vw, min(68vh, 500px))',
            height: 'min(86vw, min(68vh, 500px))'
          }}
          className={`border-2 ${theme.innerBorder} rounded-lg overflow-hidden shadow-inner`}
        >
          {displayRows.map((r, displayRowIdx) =>
            displayCols.map((c, displayColIdx) => {
              const piece = board[r][c];
              const isDark = (r + c) % 2 === 1;
              const sel = isSelected(r, c);
              const isLastMove = gameState.lastMove &&
                ((gameState.lastMove.from.r === r && gameState.lastMove.from.c === c) ||
                 (gameState.lastMove.to.r === r && gameState.lastMove.to.c === c));

              // Check if square is a valid move target
              const targetMove = candidateMoves.find(m => m.to.r === r && m.to.c === c);
              const isCapture = targetMove && (piece !== null || targetMove.isEnPassant);
              const isQuietMove = targetMove && !isCapture;
              const isKingInCheck = gameState.inCheck && piece && piece.type === 'K' && piece.color === gameState.turn;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  style={{ width: '100%', height: '100%' }}
                  className={`relative flex items-center justify-center cursor-pointer transition-all duration-100 ${
                    isKingInCheck
                      ? '!bg-red-600/90 ring-4 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9)] animate-pulse z-10'
                      : (isDark ? theme.darkSquare : theme.lightSquare)
                  } ${sel ? theme.selected : ''} ${
                    isLastMove && !sel && !isKingInCheck ? `after:absolute after:inset-0 ${theme.lastMove}` : ''
                  }`}
                >
                  {/* File & Rank Coordinate Labels */}
                  {displayColIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold leading-none pointer-events-none ${
                        isDark ? theme.coordDark : theme.coordLight
                      }`}
                    >
                      {8 - r}
                    </span>
                  )}
                  {displayRowIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold leading-none pointer-events-none ${
                        isDark ? theme.coordDark : theme.coordLight
                      }`}
                    >
                      {files[c]}
                    </span>
                  )}

                  {/* VALID MOVE INDICATOR: Dot for empty squares */}
                  {isQuietMove && (
                    <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${theme.moveDot} z-20 pointer-events-none transition-transform transform scale-110`} />
                  )}

                  {/* VALID CAPTURE INDICATOR: Outer capture ring around enemy piece */}
                  {isCapture && (
                    <div className={`absolute inset-1 sm:inset-1.5 rounded-full border-4 sm:border-[5px] ${theme.captureRing} z-20 pointer-events-none animate-pulse`} />
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
