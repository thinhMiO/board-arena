import React, { useState, useEffect } from 'react';
import { sound } from '../../services/audio';
import { TRACK_COORDS, START_GATES, BARN_DOORS, BARN_COORDS, STABLE_COORDS } from '@shared/games/CoCaNguaGame.js';
import confetti from 'canvas-confetti';
import { Dice3D } from './Dice3D';

// 3D Horse / Stallion Piece with Player Badging
const HorsePiece = ({ color, horseId, isMovable, isSelected }) => {
  const isRed = color === 0;
  const isYellow = color === 1;
  const isBlue = color === 2;

  const bgGradient = isRed
    ? 'from-red-500 via-rose-600 to-red-900'
    : isYellow
    ? 'from-amber-300 via-yellow-500 to-amber-700'
    : isBlue
    ? 'from-sky-400 via-blue-600 to-blue-900'
    : 'from-emerald-400 via-green-600 to-emerald-900';

  const borderColor = isRed ? '#fecdd3' : isYellow ? '#fef08a' : isBlue ? '#bae6fd' : '#a7f3d0';

  return (
    <div
      className={`relative w-[90%] h-[90%] rounded-full bg-gradient-to-br ${bgGradient} border-2 flex items-center justify-center shadow-xl transition-all select-none ${
        isSelected
          ? 'scale-115 ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9)] z-40 animate-pulse'
          : isMovable
          ? 'scale-105 ring-3 ring-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.7)] z-30 cursor-pointer animate-bounce'
          : ''
      }`}
      style={{ borderColor }}
    >
      {/* 3D Stallion Head SVG */}
      <svg viewBox="0 0 24 24" className="w-[70%] h-[70%] text-white drop-shadow-md fill-current">
        <path d="M19 8.5C18.5 4 15 2 11 2C7.5 2 6 4.5 5 7.5C4 10.5 4 14 5 16C5.5 17 6.5 17.5 7.5 17.5H8.5V20C8.5 21.1 9.4 22 10.5 22H14.5C15.6 22 16.5 21.1 16.5 20V17H17.5C18.6 17 19.5 16.1 19.5 15C19.5 14.5 19.3 14 19 13.5L19 8.5Z" />
        <circle cx="9" cy="7" r="1.3" fill={isYellow ? '#000' : '#fff'} />
      </svg>

      {/* Horse ID Badge */}
      <span
        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center border shadow-sm ${
          isYellow ? 'bg-black text-amber-300 border-amber-400' : 'bg-white text-slate-900 border-slate-300'
        }`}
      >
        {horseId + 1}
      </span>
    </div>
  );
};

export const CoCaNguaBoard = ({ gameState, onMove, gameEngine, isInteractive = true }) => {
  const { numPlayers, horses, turn, dice, hasRolled, lastKickedHorse, noMoves, passReason, extraTurn } = gameState;
  const [rollingAnim, setRollingAnim] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState(null);
  const [autoPassCountdown, setAutoPassCountdown] = useState(null);

  // Valid moves for active turn
  const validMoves = (isInteractive && !gameState.gameOver && gameEngine)
    ? gameEngine.getValidMoves(gameState, gameState.turn)
    : [];

  // Reset selected horse on turn change or roll
  useEffect(() => {
    setSelectedHorseId(null);
  }, [turn, dice, hasRolled]);

  // Handle auto-pass countdown when no moves available
  useEffect(() => {
    if (isInteractive && hasRolled && noMoves && !gameState.gameOver) {
      setAutoPassCountdown(3);
      const timer = setInterval(() => {
        setAutoPassCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onMove({ action: 'pass' });
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setAutoPassCountdown(null);
    }
  }, [hasRolled, noMoves, gameState.gameOver, isInteractive]);

  // Trigger 3D Dice Roll
  const handleRoll = () => {
    if (!isInteractive || gameState.gameOver || hasRolled || rollingAnim) return;
    setRollingAnim(true);
    sound.playClick();

    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 6) + 1;
      onMove({ action: 'roll', dice: rolled });
      setRollingAnim(false);
      sound.playCheck();
      if (rolled === 6) {
        sound.playVictory();
      }
    }, 600);
  };

  // Click on a horse
  const handleHorseClick = (horseIndex) => {
    if (!isInteractive || gameState.gameOver || !hasRolled) return;
    const matchingMoves = validMoves.filter(m => m.horseIndex === horseIndex);
    if (matchingMoves.length === 1) {
      executeHorseMove(matchingMoves[0]);
    } else if (matchingMoves.length > 1) {
      setSelectedHorseId(prev => (prev === horseIndex ? null : horseIndex));
    }
  };

  // Execute a selected move
  const executeHorseMove = (move) => {
    onMove(move);
    sound.playMove();
    setSelectedHorseId(null);
    if (move.willKick) {
      sound.playCapture();
      try {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.65 } });
      } catch {}
    }
  };

  // Find horse at grid cell [r, c]
  const getHorseAt = (r, c) => {
    for (let p = 0; p < numPlayers; p++) {
      for (const h of horses[p]) {
        const pos = gameEngine ? gameEngine.getHorseGridPos(h, p) : null;
        if (pos && pos[0] === r && pos[1] === c) {
          const isMovable = turn === p && validMoves.some(m => m.horseIndex === h.id);
          const isSelected = turn === p && selectedHorseId === h.id;
          return { player: p, horse: h, isMovable, isSelected };
        }
      }
    }
    return null;
  };

  // Check if cell [r, c] is a target for the selected or single movable horse
  const getTargetMoveAt = (r, c) => {
    if (!hasRolled) return null;
    if (selectedHorseId !== null) {
      return validMoves.find(
        m => m.horseIndex === selectedHorseId && m.targetCoord && m.targetCoord[0] === r && m.targetCoord[1] === c
      );
    }
    const movableHorseIds = [...new Set(validMoves.map(m => m.horseIndex))];
    if (movableHorseIds.length === 1) {
      return validMoves.find(
        m => m.targetCoord && m.targetCoord[0] === r && m.targetCoord[1] === c
      );
    }
    return null;
  };

  const playerConfig = [
    { name: 'Đỏ', bg: 'bg-red-600', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/40', dot: '🔴' },
    { name: 'Vàng', bg: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: '🟡' },
    { name: 'Xanh Lam', bg: 'bg-blue-600', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', dot: '🔵' },
    { name: 'Xanh Lá', bg: 'bg-emerald-600', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: '🟢' }
  ];

  // Render individual 15x15 board cell
  const renderCell = (r, c) => {
    const horseInfo = getHorseAt(r, c);
    const targetMove = getTargetMoveAt(r, c);

    // 1. Red Stable (Top-Left: 0-5, 0-5)
    if (r <= 5 && c <= 5) {
      const isPedestal = (r >= 2 && r <= 3 && c >= 2 && c <= 3);
      return (
        <div
          key={`${r}-${c}`}
          className={`flex items-center justify-center relative transition-colors ${
            r === 0 || c === 0 || r === 5 || c === 5 ? 'bg-red-950/80 border border-red-900/50' : 'bg-red-900/40'
          }`}
        >
          {isPedestal && (
            <div
              onClick={() => horseInfo && horseInfo.isMovable && handleHorseClick(horseInfo.horse.id)}
              className={`w-[86%] h-[86%] rounded-full border-2 border-red-400/70 flex items-center justify-center shadow-inner ${
                horseInfo ? 'cursor-pointer hover:scale-105' : 'bg-red-950/50'
              }`}
            >
              {horseInfo && (
                <HorsePiece
                  color={horseInfo.player}
                  horseId={horseInfo.horse.id}
                  isMovable={horseInfo.isMovable}
                  isSelected={horseInfo.isSelected}
                />
              )}
            </div>
          )}
          {r === 1 && c === 2 && (
            <span className="absolute font-black text-[9px] sm:text-[11px] text-red-300 tracking-wider pointer-events-none drop-shadow">
              CHUỒNG ĐỎ
            </span>
          )}
        </div>
      );
    }

    // 2. Blue Stable (Top-Right: 0-5, 9-14)
    if (r <= 5 && c >= 9) {
      const isPedestal = (r >= 2 && r <= 3 && c >= 11 && c <= 12);
      return (
        <div
          key={`${r}-${c}`}
          className={`flex items-center justify-center relative transition-colors ${
            r === 0 || c === 14 || r === 5 || c === 9 ? 'bg-blue-950/80 border border-blue-900/50' : 'bg-blue-900/40'
          }`}
        >
          {isPedestal && (
            <div
              onClick={() => horseInfo && horseInfo.isMovable && handleHorseClick(horseInfo.horse.id)}
              className={`w-[86%] h-[86%] rounded-full border-2 border-blue-400/70 flex items-center justify-center shadow-inner ${
                horseInfo ? 'cursor-pointer hover:scale-105' : 'bg-blue-950/50'
              }`}
            >
              {horseInfo && (
                <HorsePiece
                  color={horseInfo.player}
                  horseId={horseInfo.horse.id}
                  isMovable={horseInfo.isMovable}
                  isSelected={horseInfo.isSelected}
                />
              )}
            </div>
          )}
          {r === 1 && c === 11 && (
            <span className="absolute font-black text-[9px] sm:text-[11px] text-blue-300 tracking-wider pointer-events-none drop-shadow">
              CHUỒNG LAM
            </span>
          )}
        </div>
      );
    }

    // 3. Yellow Stable (Bottom-Right: 9-14, 9-14)
    if (r >= 9 && c >= 9) {
      const isPedestal = (r >= 11 && r <= 12 && c >= 11 && c <= 12);
      return (
        <div
          key={`${r}-${c}`}
          className={`flex items-center justify-center relative transition-colors ${
            r === 14 || c === 14 || r === 9 || c === 9 ? 'bg-amber-950/80 border border-amber-900/50' : 'bg-amber-900/40'
          }`}
        >
          {isPedestal && (
            <div
              onClick={() => horseInfo && horseInfo.isMovable && handleHorseClick(horseInfo.horse.id)}
              className={`w-[86%] h-[86%] rounded-full border-2 border-amber-400/70 flex items-center justify-center shadow-inner ${
                horseInfo ? 'cursor-pointer hover:scale-105' : 'bg-amber-950/50'
              }`}
            >
              {horseInfo && (
                <HorsePiece
                  color={horseInfo.player}
                  horseId={horseInfo.horse.id}
                  isMovable={horseInfo.isMovable}
                  isSelected={horseInfo.isSelected}
                />
              )}
            </div>
          )}
          {r === 10 && c === 11 && (
            <span className="absolute font-black text-[9px] sm:text-[11px] text-amber-300 tracking-wider pointer-events-none drop-shadow">
              CHUỒNG VÀNG
            </span>
          )}
        </div>
      );
    }

    // 4. Green Stable (Bottom-Left: 9-14, 0-5)
    if (r >= 9 && c <= 5) {
      const isPedestal = (r >= 11 && r <= 12 && c >= 2 && c <= 3);
      return (
        <div
          key={`${r}-${c}`}
          className={`flex items-center justify-center relative transition-colors ${
            r === 14 || c === 0 || r === 9 || c === 5 ? 'bg-emerald-950/80 border border-emerald-900/50' : 'bg-emerald-900/40'
          }`}
        >
          {isPedestal && (
            <div
              onClick={() => horseInfo && horseInfo.isMovable && handleHorseClick(horseInfo.horse.id)}
              className={`w-[86%] h-[86%] rounded-full border-2 border-emerald-400/70 flex items-center justify-center shadow-inner ${
                horseInfo ? 'cursor-pointer hover:scale-105' : 'bg-emerald-950/50'
              }`}
            >
              {horseInfo && (
                <HorsePiece
                  color={horseInfo.player}
                  horseId={horseInfo.horse.id}
                  isMovable={horseInfo.isMovable}
                  isSelected={horseInfo.isSelected}
                />
              )}
            </div>
          )}
          {r === 10 && c === 2 && (
            <span className="absolute font-black text-[9px] sm:text-[11px] text-emerald-300 tracking-wider pointer-events-none drop-shadow">
              CHUỒNG LỤC
            </span>
          )}
        </div>
      );
    }

    // 5. Center (7, 7) - Trophy Podium
    if (r === 7 && c === 7) {
      return (
        <div
          key={`${r}-${c}`}
          className="bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 flex items-center justify-center text-base sm:text-lg font-black shadow-2xl text-black border-2 border-yellow-200 animate-pulse"
        >
          🏆
        </div>
      );
    }

    // 6. Red Home Barn Column (r === 7, c from 1 to 6)
    if (r === 7 && c >= 1 && c <= 6) {
      const slotNum = c; // 1 to 6
      return (
        <div
          key={`${r}-${c}`}
          onClick={() => {
            if (targetMove) executeHorseMove(targetMove);
            else if (horseInfo && horseInfo.isMovable) handleHorseClick(horseInfo.horse.id);
          }}
          className={`relative border border-red-700/80 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-inner transition-all ${
            targetMove ? 'ring-4 ring-yellow-400 bg-red-600/90 cursor-pointer animate-pulse' :
            horseInfo ? 'cursor-pointer' : 'bg-gradient-to-r from-red-950 to-red-800 text-red-200'
          }`}
        >
          {horseInfo ? (
            <HorsePiece
              color={horseInfo.player}
              horseId={horseInfo.horse.id}
              isMovable={horseInfo.isMovable}
              isSelected={horseInfo.isSelected}
            />
          ) : targetMove ? (
            <span className="text-yellow-300 font-black animate-bounce">⭐ {slotNum}</span>
          ) : (
            <span>{slotNum}</span>
          )}
        </div>
      );
    }

    // 7. Yellow Home Barn Column (r === 7, c from 8 to 13)
    if (r === 7 && c >= 8 && c <= 13) {
      const slotNum = 14 - c; // 6 down to 1
      return (
        <div
          key={`${r}-${c}`}
          onClick={() => {
            if (targetMove) executeHorseMove(targetMove);
            else if (horseInfo && horseInfo.isMovable) handleHorseClick(horseInfo.horse.id);
          }}
          className={`relative border border-amber-700/80 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-inner transition-all ${
            targetMove ? 'ring-4 ring-yellow-400 bg-amber-600/90 cursor-pointer animate-pulse' :
            horseInfo ? 'cursor-pointer' : 'bg-gradient-to-l from-amber-950 to-amber-800 text-amber-200'
          }`}
        >
          {horseInfo ? (
            <HorsePiece
              color={horseInfo.player}
              horseId={horseInfo.horse.id}
              isMovable={horseInfo.isMovable}
              isSelected={horseInfo.isSelected}
            />
          ) : targetMove ? (
            <span className="text-white font-black animate-bounce">⭐ {slotNum}</span>
          ) : (
            <span>{slotNum}</span>
          )}
        </div>
      );
    }

    // 8. Blue Home Barn Column (c === 7, r from 1 to 6)
    if (c === 7 && r >= 1 && r <= 6) {
      const slotNum = r; // 1 to 6
      return (
        <div
          key={`${r}-${c}`}
          onClick={() => {
            if (targetMove) executeHorseMove(targetMove);
            else if (horseInfo && horseInfo.isMovable) handleHorseClick(horseInfo.horse.id);
          }}
          className={`relative border border-blue-700/80 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-inner transition-all ${
            targetMove ? 'ring-4 ring-yellow-400 bg-blue-600/90 cursor-pointer animate-pulse' :
            horseInfo ? 'cursor-pointer' : 'bg-gradient-to-b from-blue-950 to-blue-800 text-blue-200'
          }`}
        >
          {horseInfo ? (
            <HorsePiece
              color={horseInfo.player}
              horseId={horseInfo.horse.id}
              isMovable={horseInfo.isMovable}
              isSelected={horseInfo.isSelected}
            />
          ) : targetMove ? (
            <span className="text-yellow-300 font-black animate-bounce">⭐ {slotNum}</span>
          ) : (
            <span>{slotNum}</span>
          )}
        </div>
      );
    }

    // 9. Green Home Barn Column (c === 7, r from 8 to 13)
    if (c === 7 && r >= 8 && r <= 13) {
      const slotNum = 14 - r; // 6 down to 1
      return (
        <div
          key={`${r}-${c}`}
          onClick={() => {
            if (targetMove) executeHorseMove(targetMove);
            else if (horseInfo && horseInfo.isMovable) handleHorseClick(horseInfo.horse.id);
          }}
          className={`relative border border-emerald-700/80 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-inner transition-all ${
            targetMove ? 'ring-4 ring-yellow-400 bg-emerald-600/90 cursor-pointer animate-pulse' :
            horseInfo ? 'cursor-pointer' : 'bg-gradient-to-t from-emerald-950 to-emerald-800 text-emerald-200'
          }`}
        >
          {horseInfo ? (
            <HorsePiece
              color={horseInfo.player}
              horseId={horseInfo.horse.id}
              isMovable={horseInfo.isMovable}
              isSelected={horseInfo.isSelected}
            />
          ) : targetMove ? (
            <span className="text-yellow-300 font-black animate-bounce">⭐ {slotNum}</span>
          ) : (
            <span>{slotNum}</span>
          )}
        </div>
      );
    }

    // 10. Start Gates
    const isRedStart = (r === 6 && c === 1);
    const isYellowStart = (r === 8 && c === 13);
    const isBlueStart = (r === 1 && c === 8);
    const isGreenStart = (r === 13 && c === 6);

    // 11. Barn Doors (Cửa Chuồng)
    const isRedDoor = (r === 7 && c === 0);
    const isYellowDoor = (r === 7 && c === 14);
    const isBlueDoor = (r === 0 && c === 7);
    const isGreenDoor = (r === 14 && c === 7);

    // 12. Standard Track Square
    const isTrack = TRACK_COORDS.some(pt => pt[0] === r && pt[1] === c);

    return (
      <div
        key={`${r}-${c}`}
        onClick={() => {
          if (targetMove) executeHorseMove(targetMove);
          else if (horseInfo && horseInfo.isMovable) handleHorseClick(horseInfo.horse.id);
        }}
        className={`relative border flex items-center justify-center transition-all ${
          isRedStart ? 'bg-red-600 text-white font-bold border-red-400' :
          isYellowStart ? 'bg-amber-500 text-black font-bold border-amber-300' :
          isBlueStart ? 'bg-blue-600 text-white font-bold border-blue-400' :
          isGreenStart ? 'bg-emerald-600 text-white font-bold border-emerald-400' :
          isRedDoor ? 'bg-red-950/90 text-red-300 border-red-500' :
          isYellowDoor ? 'bg-amber-950/90 text-amber-300 border-amber-500' :
          isBlueDoor ? 'bg-blue-950/90 text-blue-300 border-blue-500' :
          isGreenDoor ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500' :
          isTrack ? 'bg-slate-900 border-slate-700/80 text-slate-400' : 'bg-[#090d16] border-slate-900'
        } ${horseInfo ? 'cursor-pointer' : ''} ${
          targetMove ? 'ring-4 ring-amber-400 bg-amber-500/40 z-30 cursor-pointer animate-pulse' : ''
        }`}
      >
        {/* Start Gate Marks */}
        {isRedStart && !horseInfo && !targetMove && <span className="text-[10px] font-black">▶</span>}
        {isYellowStart && !horseInfo && !targetMove && <span className="text-[10px] font-black">◀</span>}
        {isBlueStart && !horseInfo && !targetMove && <span className="text-[10px] font-black">▼</span>}
        {isGreenStart && !horseInfo && !targetMove && <span className="text-[10px] font-black">▲</span>}

        {/* Barn Door Markers */}
        {(isRedDoor || isYellowDoor || isBlueDoor || isGreenDoor) && !horseInfo && !targetMove && (
          <span className="text-[9px] font-black text-amber-300">⛩️</span>
        )}

        {/* Target Move Indicator */}
        {targetMove && !horseInfo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {targetMove.type === 'deploy' ? (
              <span className="text-xs animate-bounce font-black text-emerald-300">🚀</span>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-amber-300 animate-ping" />
            )}
          </div>
        )}

        {/* Kick Indicator */}
        {targetMove && horseInfo && targetMove.willKick && (
          <div className="absolute -top-2 -right-2 z-40 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white animate-bounce">
            ⚔️ ĐÁ!
          </div>
        )}

        {/* Horse Piece */}
        {horseInfo && (
          <HorsePiece
            color={horseInfo.player}
            horseId={horseInfo.horse.id}
            isMovable={horseInfo.isMovable}
            isSelected={horseInfo.isSelected}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      {/* Top 3D Dice Shaker Station & Turn Status */}
      <div className="flex items-center justify-between w-[min(94vw,min(70vh,560px))] mb-3 px-4 py-3 glass-panel rounded-3xl shadow-2xl border border-slate-700/80 bg-gradient-to-r from-slate-900/90 via-slate-950/95 to-slate-900/90">
        
        {/* Large 3D Dice Station */}
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-inner flex items-center justify-center">
            <Dice3D
              value={dice || 1}
              isRolling={rollingAnim}
              onRoll={handleRoll}
              disabled={!isInteractive || gameState.gameOver || hasRolled}
              size={64}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleRoll}
              disabled={!isInteractive || gameState.gameOver || hasRolled || rollingAnim}
              className={`px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black rounded-xl shadow-lg active:scale-95 disabled:opacity-40 transition-all text-xs sm:text-sm flex items-center gap-2 ${
                !hasRolled && !gameState.gameOver ? 'animate-bounce ring-4 ring-amber-300/80 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : ''
              }`}
            >
              <span className="text-base sm:text-lg">🎲</span>
              <span>{rollingAnim ? 'ĐANG LẮC...' : hasRolled ? `ĐÃ ĐỔ: ${dice}` : 'GIEO XÚC XẮC'}</span>
            </button>

            {/* Extra Turn Badge */}
            {extraTurn && !rollingAnim && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[11px] font-black flex items-center gap-1 animate-pulse">
                <span>🎉</span> <span>Đổ được 6! Được thêm lượt gieo!</span>
              </span>
            )}
            {!hasRolled && !gameState.gameOver && (
              <span className="text-[10px] text-amber-300/90 font-medium">
                👉 Chạm vào xúc xắc 3D hoặc bấm nút để gieo
              </span>
            )}
          </div>
        </div>

        {/* Current Turn Indicator Badge */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Lượt hiện tại</span>
          <div className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm border flex items-center gap-1.5 shadow-md ${playerConfig[turn]?.badge}`}>
            <span>{playerConfig[turn]?.dot}</span>
            <span>Phe {playerConfig[turn]?.name}</span>
          </div>
        </div>
      </div>

      {/* Pass Turn Notification Banner (when no moves available) */}
      {hasRolled && noMoves && !gameState.gameOver && (
        <div className="w-[min(94vw,min(70vh,560px))] mb-2 p-3 rounded-2xl bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{passReason || `Đổ được ${dice} nhưng không có nước đi nào khả dụng!`}</span>
          </div>
          <button
            onClick={() => onMove({ action: 'pass' })}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-xs transition-transform active:scale-95 shrink-0 flex items-center gap-1 shadow-md"
          >
            <span>Chuyển Lượt</span>
            {autoPassCountdown !== null && <span className="font-mono">({autoPassCountdown}s)</span>}
          </button>
        </div>
      )}

      {/* Kick Notification Toast */}
      {lastKickedHorse && (
        <div className="mb-2 px-5 py-2 rounded-full bg-red-600/40 border-2 border-red-500 text-red-100 font-black text-xs shadow-2xl animate-pulse flex items-center gap-2">
          <span className="text-base">⚔️</span>
          <span>ĐÁ NGỰA! Một chiến mã đối phương đã bị đá văng về chuồng!</span>
        </div>
      )}

      {/* The 15x15 Authentic Ludo / Cờ Cá Ngựa Board */}
      <div className="border-4 sm:border-8 border-[#2e2014] rounded-3xl overflow-hidden shadow-2xl bg-[#150f0b] p-1.5 sm:p-2.5 max-w-full">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(15, 1fr)',
            gridTemplateRows: 'repeat(15, 1fr)',
            width: 'min(94vw, min(70vh, 560px))',
            height: 'min(94vw, min(70vh, 560px))'
          }}
          className="border-2 border-[#3d2b1c] rounded-2xl overflow-hidden bg-[#070b12]"
        >
          {Array(15).fill(0).map((_, r) =>
            Array(15).fill(0).map((__, c) => renderCell(r, c))
          )}
        </div>
      </div>

      {/* Action Guidance & Hint Bar */}
      <div className="mt-2.5 text-center text-xs text-slate-300 max-w-lg bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-md">
        💡 <strong>Gieo 1 hoặc 6</strong> để Xuất Chuồng. Nhấn vào quân ngựa nhấp nháy hoặc ô đích viền vàng để phi nước đại!
      </div>
    </div>
  );
};
