import React, { useState, useEffect } from 'react';
import { sound } from '../../services/audio';
import { RotateCcw } from 'lucide-react';

const XIANGQI_PIECES = {
  0: { K: '帥', A: '仕', E: '相', H: '傌', R: '俥', C: '炮', P: '兵' }, // Red
  1: { K: '將', A: '士', E: '象', H: '馬', R: '車', C: '砲', P: '卒' }  // Black
};

export const XiangqiBoard = ({ gameState, onMove, playerIndex = 0, gameEngine, isInteractive = true }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isFlipped, setIsFlipped] = useState(playerIndex === 1);

  const getBrowserPrefersDark = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  };

  const [systemIsDark, setSystemIsDark] = useState(getBrowserPrefersDark);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('xiangqi_theme_mode') || 'auto');

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

  const isDarkTheme = themeMode === 'auto' ? systemIsDark : themeMode === 'dark';

  const toggleTheme = () => {
    const nextMode = themeMode === 'auto' ? (systemIsDark ? 'wood' : 'dark') : (themeMode === 'dark' ? 'wood' : 'auto');
    setThemeMode(nextMode);
    localStorage.setItem('xiangqi_theme_mode', nextMode);
  };

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

  const displayRows = isFlipped ? [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const displayCols = isFlipped ? [8, 7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      {/* Board Controls Toolbar */}
      <div className="w-[min(86vw,min(68vh,480px))] mb-1.5 flex items-center justify-between text-xs px-1">
        <button
          onClick={toggleTheme}
          className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all shadow ${
            isDarkTheme ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}
        >
          <span>{themeMode === 'auto' ? `🖥️ Trình duyệt (${isDarkTheme ? 'Tối' : 'Sáng'})` : (isDarkTheme ? '🌙 Bàn Cờ Tối' : '🪵 Bàn Gỗ Cổ Điển')}</span>
        </button>

        <button
          onClick={() => setIsFlipped(prev => !prev)}
          className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-300 font-bold text-[11px] border border-slate-800 shadow flex items-center gap-1.5 transition-all active:scale-95"
        >
          <RotateCcw className="w-3 h-3 text-amber-400" />
          <span>{isFlipped ? 'Chiều: Quân Đen (將)' : 'Chiều: Quân Đỏ (帥)'}</span>
        </button>
      </div>

      <div className={`relative border-4 sm:border-8 ${isDarkTheme ? 'border-[#0f172a] bg-[#090d16]' : 'border-[#5c3e21] bg-[#e6b97e]'} rounded-2xl overflow-hidden shadow-2xl p-1.5 sm:p-3 max-w-full transition-colors`}>
        {/* Board Outer Grid: 9 files x 10 ranks */}
        <div
          style={{
            width: 'min(86vw, min(68vh, 480px))',
            height: 'min(95vw, min(75vh, 530px))'
          }}
          className={`relative border-2 ${isDarkTheme ? 'border-[#1e293b] bg-[#1e293b]' : 'border-[#7a481c] bg-[#eed4ad]'}`}
        >
          {/* River Banner */}
          <div className={`absolute top-[45%] left-0 right-0 h-[10%] flex items-center justify-around font-bold text-xs sm:text-sm tracking-widest border-t-2 border-b-2 ${
            isDarkTheme ? 'text-slate-400 border-[#334155] bg-[#0f172a]' : 'text-[#7a481c] border-[#7a481c] bg-[#f2dfbe]'
          }`}>
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
            {displayRows.map(r =>
              displayCols.map(c => {
                const piece = board[r][c];
                const sel = isSelected(r, c);
                const isLastMove = gameState.lastMove &&
                  ((gameState.lastMove.from.r === r && gameState.lastMove.from.c === c) ||
                   (gameState.lastMove.to.r === r && gameState.lastMove.to.c === c));

                // Valid move indicator for Xiangqi
                const targetMove = candidateMoves.find(m => m.to.r === r && m.to.c === c);
                const isCapture = targetMove && piece !== null;
                const isQuietMove = targetMove && !isCapture;
                const isGeneralInCheck = gameState.inCheck && piece && piece.type === 'K' && piece.color === gameState.turn;

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

                    {/* General Check Flash Ring */}
                    {isGeneralInCheck && (
                      <div className="absolute w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 border-red-500 bg-red-600/40 z-10 animate-ping pointer-events-none" />
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
                          isGeneralInCheck
                            ? 'ring-4 ring-red-600 shadow-[0_0_20px_rgba(239,68,68,0.95)] animate-pulse scale-105 !border-red-500'
                            : ''
                        } ${
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
