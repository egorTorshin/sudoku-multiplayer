export interface PlayerState {
  socketId: string;
  correctCells: Set<string>;
}

export interface Room {
  id: string;
  puzzle: number[][];
  solution: number[][];
  totalEmpty: number;
  players: Map<string, PlayerState>;
  isCustom: boolean;
}
