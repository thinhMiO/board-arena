import React, { useState, useEffect } from 'react';

// Rotation degrees to show face 1-6 facing the camera
const FACE_ROTATIONS = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: 90 },
  4: { x: 0, y: -90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 }
};

// Realistic Pip (Dot) Component
const Pip = ({ color = 'black', size = 'w-3 h-3 sm:w-3.5 sm:h-3.5' }) => {
  const isRed = color === 'red';
  return (
    <div
      className={`${size} rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] ${
        isRed
          ? 'bg-gradient-to-br from-red-500 via-rose-600 to-red-800'
          : 'bg-gradient-to-br from-slate-700 via-slate-900 to-black'
      }`}
    />
  );
};

export const Dice3D = ({ value = 1, isRolling = false, onRoll, disabled = false, size = 68 }) => {
  const [spinOffset, setSpinOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isRolling) {
      // Add multiple full spins during roll
      setSpinOffset(prev => ({
        x: prev.x + 720 + Math.floor(Math.random() * 360),
        y: prev.y + 1080 + Math.floor(Math.random() * 360)
      }));
    }
  }, [isRolling]);

  const targetRotation = FACE_ROTATIONS[value] || FACE_ROTATIONS[1];
  const rotX = isRolling ? spinOffset.x : spinOffset.x - (spinOffset.x % 360) + targetRotation.x;
  const rotY = isRolling ? spinOffset.y : spinOffset.y - (spinOffset.y % 360) + targetRotation.y;

  const halfSize = size / 2;

  const faceStyle = (transform) => ({
    width: `${size}px`,
    height: `${size}px`,
    transform,
    position: 'absolute',
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15), 0 0 4px rgba(0,0,0,0.2)',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    backgroundImage: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f1f5f9 70%, #cbd5e1 100%)',
    border: '1.5px solid #cbd5e1'
  });

  return (
    <div className="flex flex-col items-center select-none">
      {/* 3D Perspective Scene */}
      <div
        onClick={() => !disabled && !isRolling && onRoll && onRoll()}
        className={`relative cursor-pointer transition-transform duration-300 ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          perspective: '600px'
        }}
      >
        {/* The 3D Rotating Cube */}
        <div
          className={`w-full h-full relative transition-transform ${
            isRolling ? 'duration-500 ease-linear' : 'duration-700 ease-out'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) ${isRolling ? 'translateY(-20px)' : 'translateY(0)'}`
          }}
        >
          {/* Face 1: Large Red Pip Center (Classic Asian / Ludo Style) */}
          <div style={faceStyle(`translateZ(${halfSize}px)`)} className="flex items-center justify-center p-2">
            <Pip color="red" size="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          {/* Face 6: 6 Pips (2 columns of 3) */}
          <div style={faceStyle(`rotateY(180deg) translateZ(${halfSize}px)`)} className="flex justify-between p-2.5">
            <div className="flex flex-col justify-between">
              <Pip />
              <Pip />
              <Pip />
            </div>
            <div className="flex flex-col justify-between">
              <Pip />
              <Pip />
              <Pip />
            </div>
          </div>

          {/* Face 2: 2 Diagonal Pips */}
          <div style={faceStyle(`rotateX(90deg) translateZ(${halfSize}px)`)} className="flex justify-between p-2.5">
            <Pip />
            <div className="self-end">
              <Pip />
            </div>
          </div>

          {/* Face 5: 4 Corner Pips + Center Pip */}
          <div style={faceStyle(`rotateX(-90deg) translateZ(${halfSize}px)`)} className="flex justify-between p-2.5">
            <div className="flex flex-col justify-between">
              <Pip />
              <Pip />
            </div>
            <div className="self-center">
              <Pip color="red" />
            </div>
            <div className="flex flex-col justify-between">
              <Pip />
              <Pip />
            </div>
          </div>

          {/* Face 3: 3 Diagonal Pips */}
          <div style={faceStyle(`rotateY(-90deg) translateZ(${halfSize}px)`)} className="flex justify-between p-2.5">
            <Pip />
            <div className="self-center">
              <Pip />
            </div>
            <div className="self-end">
              <Pip />
            </div>
          </div>

          {/* Face 4: 4 Corner Pips (Red/Black) */}
          <div style={faceStyle(`rotateY(90deg) translateZ(${halfSize}px)`)} className="flex justify-between p-2.5">
            <div className="flex flex-col justify-between">
              <Pip color="red" />
              <Pip color="red" />
            </div>
            <div className="flex flex-col justify-between">
              <Pip color="red" />
              <Pip color="red" />
            </div>
          </div>
        </div>

        {/* Ambient Ground Shadow */}
        <div
          className={`absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 blur-md pointer-events-none transition-all duration-500 ${
            isRolling ? 'w-10 h-2 opacity-30 scale-75' : 'w-16 h-3 opacity-60 scale-100'
          }`}
        />
      </div>
    </div>
  );
};
