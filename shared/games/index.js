import { GameRegistry } from '../gameFramework/GameRegistry.js';
import { ChessGame } from './ChessGame.js';
import { XiangqiGame } from './XiangqiGame.js';
import { GoGame } from './GoGame.js';
import { GomokuGame } from './GomokuGame.js';
import { CheckersGame } from './CheckersGame.js';
import { ReversiGame } from './ReversiGame.js';
import { ConnectFourGame } from './ConnectFourGame.js';
import { ShogiGame } from './ShogiGame.js';
import { CoGanhGame } from './CoGanhGame.js';
import { OAnQuanGame } from './OAnQuanGame.js';
import { CoCaNguaGame } from './CoCaNguaGame.js';
import { NineMensMorrisGame } from './NineMensMorrisGame.js';

// Auto-register all games into the global registry
GameRegistry.register(new ChessGame());
GameRegistry.register(new XiangqiGame());
GameRegistry.register(new GoGame());
GameRegistry.register(new GomokuGame());
GameRegistry.register(new CheckersGame());
GameRegistry.register(new ReversiGame());
GameRegistry.register(new ConnectFourGame());
GameRegistry.register(new ShogiGame());
GameRegistry.register(new CoGanhGame());
GameRegistry.register(new OAnQuanGame());
GameRegistry.register(new CoCaNguaGame());
GameRegistry.register(new NineMensMorrisGame());

export {
  GameRegistry,
  ChessGame,
  XiangqiGame,
  GoGame,
  GomokuGame,
  CheckersGame,
  ReversiGame,
  ConnectFourGame,
  ShogiGame,
  CoGanhGame,
  OAnQuanGame,
  CoCaNguaGame,
  NineMensMorrisGame
};
