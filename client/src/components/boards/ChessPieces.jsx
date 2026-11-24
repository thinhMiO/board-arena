import React from 'react';

// Professional Vector SVG Chess Pieces (Standard FIDE / Lichess vector standard)
export const ChessPiece = ({ type, color }) => {
  const t = type.toLowerCase();
  const isWhite = color === 0;

  const strokeColor = isWhite ? '#1e293b' : '#f8fafc';
  const fillColor = isWhite ? '#ffffff' : '#1e293b';
  const accentColor = isWhite ? '#e2e8f0' : '#0f172a';

  if (t === 'p') {
    // Pawn
    return (
      <svg viewBox="0 0 45 45" className="w-[78%] h-[78%] drop-shadow-md select-none transition-transform pointer-events-none">
        <path
          d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isWhite && (
          <path
            d="m 14.5,36.5 16,0"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.2"
          />
        )}
      </svg>
    );
  }

  if (t === 'n') {
    // Knight
    return (
      <svg viewBox="0 0 45 45" className="w-[82%] h-[82%] drop-shadow-md select-none transition-transform pointer-events-none">
        <path
          d="m 22,10 c 10.5,1 16.5,8 16,29 l -23,0 c 0,-9 10,-6.5 8,-21"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.89,-1.9 2,-3.5 -0.73,-0.994 -0.5,-2 -0.5,-3 1,-1 3,2.5 3,2.5 z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="25.5" r="1" fill={isWhite ? '#1e293b' : '#ffffff'} />
      </svg>
    );
  }

  if (t === 'b') {
    // Bishop
    return (
      <svg viewBox="0 0 45 45" className="w-[84%] h-[84%] drop-shadow-md select-none transition-transform pointer-events-none">
        <g fill="none" fillRule="evenodd" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <g fill={fillColor}>
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
            <path d="M 12,36 C 12.5,32 14,27 16,23 C 14.5,21.5 13.5,19 13.5,16 C 13.5,10.5 17.5,6 22.5,6 C 27.5,6 31.5,10.5 31.5,16 C 31.5,19 30.5,21.5 29,23 C 31,27 32.5,32 33,36 z" />
            <circle cx="22.5" cy="6" r="1.8" />
          </g>
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,10 L 22.5,14 M 20,12 L 25,12" stroke={isWhite ? '#1e293b' : '#f8fafc'} />
        </g>
      </svg>
    );
  }

  if (t === 'r') {
    // Rook
    return (
      <svg viewBox="0 0 45 45" className="w-[80%] h-[80%] drop-shadow-md select-none transition-transform pointer-events-none">
        <g fill={fillColor} fillRule="evenodd" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17" />
          <path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5" />
        </g>
      </svg>
    );
  }

  if (t === 'q') {
    // Queen
    return (
      <svg viewBox="0 0 45 45" className="w-[86%] h-[86%] drop-shadow-md select-none transition-transform pointer-events-none">
        <g fill={fillColor} fillRule="evenodd" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14,11 L 14,25 L 7,14 L 9,26 z" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 11,38.5 C 17,37 28,37 34,38.5 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" />
          <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" />
          <circle cx="6" cy="12" r="1.5" />
          <circle cx="14" cy="9" r="1.5" />
          <circle cx="22.5" cy="8" r="1.5" />
          <circle cx="31" cy="9" r="1.5" />
          <circle cx="39" cy="12" r="1.5" />
        </g>
      </svg>
    );
  }

  // King (t === 'k')
  return (
    <svg viewBox="0 0 45 45" className="w-[88%] h-[88%] drop-shadow-md select-none transition-transform pointer-events-none">
      <g fill="none" fillRule="evenodd" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 22.5,11.63 L 22.5,6" />
        <path d="M 20,8 L 25,8" />
        <path
          d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 20.5,14.5 C 19,17.5 22.5,25 22.5,25"
          fill={fillColor}
        />
        <path
          d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 34.5,34 35,30 33,28.5 C 30.5,26.5 29,26 27.5,26 C 26,26 25,27.5 22.5,27.5 C 20,27.5 19,26 17.5,26 C 16,26 14.5,26.5 12,28.5 C 10,30 10.5,34 11.5,37 z"
          fill={fillColor}
        />
        <path d="M 11.5,30 C 17,27 28,27 33.5,30" />
        <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" />
        <path d="M 11.5,37 C 17,34 28,34 33.5,37" />
      </g>
    </svg>
  );
};
