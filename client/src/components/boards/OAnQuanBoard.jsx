import React, { useState } from 'react';
import { sound } from '../../services/audio';

export const OAnQuanBoard = ({ gameState, onMove, isInteractive = true }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const { cells, scores, turn } = gameState;

  const myFields = turn === 0 ? [0, 1, 2, 3, 4] : [6, 7, 8, 9, 10];

  const handleCellClick = cellIdx => {
    if (!isInteractive || gameState.gameOver || !myFields.includes(cellIdx)) return;
    if (cells[cellIdx] === 0) return;
    setSelectedCell(cellIdx);
    sound.playClick();
  };

  const handleChooseDirection = direction => {
    if (selectedCell === null) return;
    onMove({ cellIdx: selectedCell, direction });
    setSelectedCell(null);
    sound.playMove();
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Score Header */}
      <div className="flex items-center justify-between w-full max-w-[480px] mb-3 px-4 py-2 glass-panel rounded-lg font-bold">
        <span className={turn === 0 ? 'text-amber-400' : 'text-slate-400'}>
          Người 1: {scores[0]} điểm
        </span>
        <span className={turn === 1 ? 'text-amber-400' : 'text-slate-400'}>
          Người 2: {scores[1]} điểm
        </span>
      </div>

      {/* Direction Selection Dialog */}
      {selectedCell !== null && (
        <div className="mb-3 flex items-center gap-3 bg-amber-500/20 border border-amber-400 px-4 py-1.5 rounded-full animate-bounce">
          <span className="text-sm font-bold text-amber-300">Chọn chiều rải quân ô {selectedCell + 1}:</span>
          <button
            onClick={() => handleChooseDirection(-1)}
            className="px-3 py-0.5 bg-amber-600 hover:bg-amber-500 rounded font-bold text-white text-xs shadow"
          >
            ◀ Ngược chiều
          </button>
          <button
            onClick={() => handleChooseDirection(1)}
            className="px-3 py-0.5 bg-amber-600 hover:bg-amber-500 rounded font-bold text-white text-xs shadow"
          >
            Thuận chiều ▶
          </button>
        </div>
      )}

      {/* Traditional Mancala Board */}
      <div className="border-4 border-[#5b381d] rounded-3xl overflow-hidden shadow-2xl bg-[#a16834] p-3 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-3 bg-[#be844d] p-3 rounded-2xl border-2 border-[#78471e]">
          
          {/* Left Quan (Cell 11) */}
          <div className="w-16 sm:w-20 h-28 sm:h-36 rounded-l-full bg-[#875326] border-2 border-[#543011] flex flex-col items-center justify-center shadow-inner text-amber-200">
            <span className="text-xs font-bold uppercase tracking-widest mb-1">Quan</span>
            <span className="text-2xl sm:text-3xl font-extrabold">{cells[11]}</span>
          </div>

          {/* Center 10 Rice Fields (2 rows x 5 cols) */}
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Top Row: Player 1 (cells 10, 9, 8, 7, 6) */}
            <div className="flex gap-2 sm:gap-3">
              {[10, 9, 8, 7, 6].map(idx => (
                <div
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl border-2 border-[#543011] flex flex-col items-center justify-center font-bold shadow-inner cursor-pointer transition-all ${
                    turn === 1 ? 'hover:scale-105 hover:border-amber-400 bg-[#8c5628]' : 'bg-[#7d4b21] opacity-90'
                  } ${selectedCell === idx ? 'ring-4 ring-amber-400 !bg-amber-700' : ''}`}
                >
                  <span className="text-xs text-amber-200/60">{idx + 1}</span>
                  <span className="text-lg sm:text-xl text-amber-100">{cells[idx]}</span>
                </div>
              ))}
            </div>

            {/* Bottom Row: Player 0 (cells 0, 1, 2, 3, 4) */}
            <div className="flex gap-2 sm:gap-3">
              {[0, 1, 2, 3, 4].map(idx => (
                <div
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl border-2 border-[#543011] flex flex-col items-center justify-center font-bold shadow-inner cursor-pointer transition-all ${
                    turn === 0 ? 'hover:scale-105 hover:border-amber-400 bg-[#8c5628]' : 'bg-[#7d4b21] opacity-90'
                  } ${selectedCell === idx ? 'ring-4 ring-amber-400 !bg-amber-700' : ''}`}
                >
                  <span className="text-xs text-amber-200/60">{idx + 1}</span>
                  <span className="text-lg sm:text-xl text-amber-100">{cells[idx]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Quan (Cell 5) */}
          <div className="w-16 sm:w-20 h-28 sm:h-36 rounded-r-full bg-[#875326] border-2 border-[#543011] flex flex-col items-center justify-center shadow-inner text-amber-200">
            <span className="text-xs font-bold uppercase tracking-widest mb-1">Quan</span>
            <span className="text-2xl sm:text-3xl font-extrabold">{cells[5]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
