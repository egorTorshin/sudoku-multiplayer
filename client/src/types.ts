export type GamePhase = 'lobby' | 'custom' | 'waiting' | 'playing' | 'gameover';

export interface GameState {
  roomId: string;
  puzzle: number[][];
  board: number[][];
  cellStatus: CellStatus[][];
  totalEmpty: number;
  mySolved: number;
  opponentSolved: number;
  notes: Set<number>[][];
}

export type CellStatus = 'empty' | 'correct' | 'wrong' | 'given';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
