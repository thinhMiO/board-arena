import React from 'react';
import { GameRegistry } from '@shared/games/index.js';
import { ChessBoard } from './ChessBoard';
import { XiangqiBoard } from './XiangqiBoard';
import { GoBoard } from './GoBoard';
import { GomokuBoard } from './GomokuBoard';
import { CheckersBoard } from './CheckersBoard';
import { ReversiBoard } from './ReversiBoard';
import { ConnectFourBoard } from './ConnectFourBoard';
import { ShogiBoard } from './ShogiBoard';
import { CoGanhBoard } from './CoGanhBoard';
import { OAnQuanBoard } from './OAnQuanBoard';
import { CoCaNguaBoard } from './CoCaNguaBoard';
import { NineMensMorrisBoard } from './NineMensMorrisBoard';

const BOARDS = {
  chess: ChessBoard,
  xiangqi: XiangqiBoard,
  go: GoBoard,
  gomoku: GomokuBoard,
  checkers: CheckersBoard,
  reversi: ReversiBoard,
  connect_four: ConnectFourBoard,
  shogi: ShogiBoard,
  co_ganh: CoGanhBoard,
  o_an_quan: OAnQuanBoard,
  co_ca_ngua: CoCaNguaBoard,
  nine_mens_morris: NineMensMorrisBoard
};

export const BoardRenderer = ({ gameId, gameState, onMove, playerIndex, isInteractive = true }) => {
  const Component = BOARDS[gameId] || GomokuBoard;
  const gameEngine = GameRegistry.get(gameId);

  return (
    <Component
      gameState={gameState}
      onMove={onMove}
      playerIndex={playerIndex}
      isInteractive={isInteractive}
      gameEngine={gameEngine}
    />
  );
};
