import React from 'react';
import { sound } from '../../services/audio';

export const GoBoard = ({ gameState, onMove, isInteractive = true }) => {
  const { size, board, lastMove, prisoners, turn } = gameState;

  const handleClick = (r, c) => {
    if (!isInteractive || gameState.gameOver || board[r][c] !== null) return;
    onMove({ r, c, isPass: false });
    sound.playMove();
  };

  const handlePass = () => {
    if (!isInteractive || gameState.gameOver) return;
    onMove({ isPass: true });
    sound.playClick();
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      {/* Prisoners & Pass Header */}
      <div className="flex items-center justify-between w-[min(86vw,min(68vh,480px))] mb-2 px-3 py-1.5 glass-panel rounded-lg text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-bold">
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-neutral-600" />
          <span>Tù binh: {prisoners.black}</span>
        </div>
        <button
          onClick={handlePass}
          disabled={!isInteractive || gameState.gameOver}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded shadow transition-all active:scale-95 disabled:opacity-40 text-xs"
        >
          Bỏ Lượt (Pass)
        </button>
        <div className="flex items-center gap-2 font-bold">
          <div className="w-3.5 h-3.5 rounded-full bg-white border border-neutral-300" />
          <span>Tù binh: {prisoners.white}</span>
        </div>
      </div>

      <div className="border-4 sm:border-8 border-[#7a4e28] rounded-2xl overflow-hidden shadow-2xl bg-[#dca868] p-1 sm:p-2.5 max-w-full">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
            width: 'min(86vw, min(68vh, 480px))',
            height: 'min(86vw, min(68vh, 480px))'
          }}
          className="border border-[#915e31] bg-[#e2b075] rounded-md shadow-inner"
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLast = lastMove && !lastMove.isPass && lastMove.r === r && lastMove.c === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  style={{ width: '100%', height: '100%' }}
                  className="relative flex items-center justify-center cursor-pointer group"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-[#915e31]" />
                    <div className="h-full w-[1px] bg-[#915e31] absolute" />
                  </div>

                  {cell && (
                    <div
                      className={`relative z-10 w-[84%] h-[84%] rounded-full shadow-lg transition-transform ${
                        cell === 'B'
                          ? 'bg-gradient-to-br from-neutral-800 to-black shadow-black'
                          : 'bg-gradient-to-br from-white to-slate-200 shadow-slate-800/40'
                      }`}
                    >
                      {isLast && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full ${cell === 'B' ? 'bg-amber-400' : 'bg-red-500'}`} />
                        </div>
                      )}
                    </div>
                  )}

                  {!cell && isInteractive && !gameState.gameOver && (
                    <div
                      className={`hidden group-hover:block absolute w-[74%] h-[74%] rounded-full opacity-40 z-10 ${
                        turn === 0 ? 'bg-black' : 'bg-white'
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
