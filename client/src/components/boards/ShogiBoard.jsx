import React, { useState } from 'react';
import { sound } from '../../services/audio';

// Shogi piece kanji names
const SHOGI_KANJI = {
  K: '王', R: '飛', B: '角', G: '金', S: '銀', N: '桂', L: '香', P: '歩'
};
const PROMOTED_KANJI = {
  R: '竜', B: '馬', S: '全', N: '圭', L: '杏', P: 'と'
};

export const ShogiBoard = ({ gameState, onMove, isInteractive = true }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState(null);
  const { board, hand, turn } = gameState;

  const handleClickSquare = (r, c) => {
    if (!isInteractive || gameState.gameOver) return;

    if (selectedHandPiece) {
      // Drop piece onto empty square
      if (board[r][c] === null) {
        onMove({ isDrop: true, pieceType: selectedHandPiece, to: { r, c } });
        setSelectedHandPiece(null);
        sound.playMove();
      }
      return;
    }

    const clickedPiece = board[r][c];

    if (selectedSquare) {
      if (selectedSquare.r === r && selectedSquare.c === c) {
        setSelectedSquare(null);
        return;
      }
      if (clickedPiece && clickedPiece.color === turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
        return;
      }

      onMove({ from: selectedSquare, to: { r, c } });
      setSelectedSquare(null);
      sound.playMove();
    } else {
      if (clickedPiece && clickedPiece.color === turn) {
        setSelectedSquare({ r, c });
        sound.playClick();
      }
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Hand for Player 1 (Gote / Top) */}
      <div className="flex items-center gap-1 mb-2 px-3 py-1 bg-amber-950/60 rounded-lg border border-amber-800/40 min-h-[36px] w-[320px] xs:w-[350px] sm:w-[420px]">
        <span className="text-xs font-bold text-amber-300 mr-2">Tay Hậu:</span>
        {(hand[1] || []).map((p, idx) => (
          <span
            key={idx}
            onClick={() => turn === 1 && setSelectedHandPiece(p)}
            className={`cursor-pointer px-2 py-0.5 rounded font-serif font-bold text-sm bg-[#eed4ad] text-slate-900 border border-amber-900 shadow ${
              selectedHandPiece === p ? 'ring-2 ring-amber-400' : ''
            }`}
          >
            {SHOGI_KANJI[p]}
          </span>
        ))}
      </div>

      {/* 9x9 Grid */}
      <div className="border-4 sm:border-8 border-[#5c3e21] rounded-2xl overflow-hidden shadow-2xl bg-[#eed4ad] p-1 sm:p-2 max-w-full">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gridTemplateRows: 'repeat(9, 1fr)',
            width: 'min(86vw, min(65vh, 440px))',
            height: 'min(86vw, min(65vh, 440px))'
          }}
          className="gap-[1px] bg-[#7a481c] p-[1px] rounded-lg"
        >
          {board.map((row, r) =>
            row.map((piece, c) => {
              const sel = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleClickSquare(r, c)}
                  className={`bg-[#eed4ad] flex items-center justify-center cursor-pointer hover:bg-[#e4be88] transition-colors ${
                    sel ? '!bg-amber-300 ring-2 ring-amber-500 z-10' : ''
                  }`}
                >
                  {piece && (
                    <div
                      className={`font-serif font-bold text-sm sm:text-lg select-none px-1 rounded flex items-center justify-center ${
                        piece.color === 0 ? 'text-amber-950' : 'text-red-900 rotate-180'
                      } ${piece.promoted ? 'text-red-600' : ''}`}
                    >
                      {piece.promoted ? PROMOTED_KANJI[piece.type] : SHOGI_KANJI[piece.type]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hand for Player 0 (Sente / Bottom) */}
      <div className="flex items-center gap-1 mt-2 px-3 py-1 bg-amber-950/60 rounded-lg border border-amber-800/40 min-h-[36px] w-[320px] xs:w-[350px] sm:w-[420px]">
        <span className="text-xs font-bold text-amber-300 mr-2">Tay Tiên:</span>
        {(hand[0] || []).map((p, idx) => (
          <span
            key={idx}
            onClick={() => turn === 0 && setSelectedHandPiece(p)}
            className={`cursor-pointer px-2 py-0.5 rounded font-serif font-bold text-sm bg-[#eed4ad] text-slate-900 border border-amber-900 shadow ${
              selectedHandPiece === p ? 'ring-2 ring-amber-400' : ''
            }`}
          >
            {SHOGI_KANJI[p]}
          </span>
        ))}
      </div>
    </div>
  );
};
