import React, { useState } from 'react';
import { sound } from '../../services/audio';

export const NineMensMorrisBoard = ({ gameState, onMove, gameEngine, isInteractive = true }) => {
  const { points, turn, phase, mustRemoveOpponent } = gameState;

  const coords = [
    { x: 5, y: 5 }, { x: 50, y: 5 }, { x: 95, y: 5 }, { x: 95, y: 50 },
    { x: 95, y: 95 }, { x: 50, y: 95 }, { x: 5, y: 95 }, { x: 5, y: 50 },
    { x: 20, y: 20 }, { x: 50, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 50 },
    { x: 80, y: 80 }, { x: 50, y: 80 }, { x: 20, y: 80 }, { x: 20, y: 50 },
    { x: 35, y: 35 }, { x: 50, y: 35 }, { x: 65, y: 35 }, { x: 65, y: 50 },
    { x: 65, y: 65 }, { x: 50, y: 65 }, { x: 35, y: 65 }, { x: 35, y: 50 }
  ];

  const [fromPoint, setFromPoint] = useState(null);

  const validMoves = (isInteractive && !gameState.gameOver && gameEngine)
    ? gameEngine.getValidMoves(gameState, gameState.turn)
    : [];

  const handlePointClick = idx => {
    if (!isInteractive || gameState.gameOver) return;

    if (mustRemoveOpponent) {
      if (points[idx] === 1 - turn) {
        onMove({ action: 'remove', targetPoint: idx });
        sound.playCapture();
      }
      return;
    }

    if (phase === 'placing') {
      if (points[idx] === null) {
        onMove({ action: 'place', point: idx });
        sound.playMove();
      }
    } else {
      if (fromPoint === null) {
        if (points[idx] === turn) {
          setFromPoint(idx);
          sound.playClick();
        }
      } else {
        if (points[idx] === null) {
          onMove({ action: 'move', from: fromPoint, to: idx });
          sound.playMove();
          setFromPoint(null);
        } else if (points[idx] === turn) {
          setFromPoint(idx);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      {mustRemoveOpponent && (
        <div className="mb-2 px-4 py-1.5 bg-red-600/30 border border-red-500 rounded-full text-xs font-bold text-red-300 animate-pulse">
          🎯 Bạn đã tạo thành hàng 3 quân (Mill)! Hãy chọn 1 quân đối thủ để bắt!
        </div>
      )}

      <div className="border-4 sm:border-8 border-[#3b2a59] rounded-2xl overflow-hidden shadow-2xl bg-[#1a122e] p-2 sm:p-4 max-w-full">
        <div
          style={{
            width: 'min(86vw, min(68vh, 460px))',
            height: 'min(86vw, min(68vh, 460px))'
          }}
          className="relative bg-[#22173d] border-2 border-purple-500/30 rounded-xl"
        >
          {/* SVG Concentric Squares */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-purple-400/40 stroke-2">
            <rect x="5%" y="5%" width="90%" height="90%" fill="none" />
            <rect x="20%" y="20%" width="60%" height="60%" fill="none" />
            <rect x="35%" y="35%" width="30%" height="30%" fill="none" />
            <line x1="50%" y1="5%" x2="50%" y2="35%" />
            <line x1="95%" y1="50%" x2="65%" y2="50%" />
            <line x1="50%" y1="95%" x2="50%" y2="65%" />
            <line x1="5%" y1="50%" x2="35%" y2="50%" />
          </svg>

          {/* 24 Interactive Nodes */}
          {coords.map((c, idx) => {
            const piece = points[idx];
            const sel = fromPoint === idx;
            const canRemove = mustRemoveOpponent && piece === (1 - turn);
            const canPlace = phase === 'placing' && piece === null;

            return (
              <div
                key={idx}
                onClick={() => handlePointClick(idx)}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                className={`absolute w-7 h-7 sm:w-9 sm:h-9 -ml-3.5 -mt-3.5 sm:-ml-4.5 sm:-mt-4.5 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-10 ${
                  sel ? 'ring-4 ring-amber-400 scale-125' : ''
                } ${canRemove ? 'ring-4 ring-red-500 animate-pulse' : ''}`}
              >
                {piece !== null ? (
                  <div
                    className={`w-full h-full rounded-full shadow-lg border-2 ${
                      piece === 0
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-200 shadow-cyan-900/60'
                        : 'bg-gradient-to-br from-amber-400 to-orange-600 border-amber-200 shadow-orange-900/60'
                    }`}
                  />
                ) : (
                  <div className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    canPlace ? 'bg-purple-300/70 hover:bg-amber-400' : 'bg-purple-300/40'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
