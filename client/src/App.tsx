import { useCallback, useEffect, useState } from 'react';
import { socket } from './socket';
import { GamePhase, GameState, CellStatus } from './types';
import GameLobby from './components/GameLobby';
import CustomPuzzleCreator from './components/CustomPuzzleCreator';
import WaitingRoom from './components/WaitingRoom';
import SudokuGame from './components/SudokuGame';
import GameOver from './components/GameOver';
import './App.css';

function makeEmptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function makeStatusGrid(puzzle: number[][]): CellStatus[][] {
  return puzzle.map(row => row.map(v => (v !== 0 ? 'given' : 'empty'))) as CellStatus[][];
}

function makeNotes(): Set<number>[][] {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()));
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [winner, setWinner] = useState<'you' | 'opponent' | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    socket.connect();

    socket.on('room_created', ({ roomId, puzzle, totalEmpty }) => {
      setGameState({
        roomId,
        puzzle,
        board: (puzzle as number[][]).map((r: number[]) => [...r]),
        cellStatus: makeStatusGrid(puzzle),
        totalEmpty,
        mySolved: 0,
        opponentSolved: 0,
        notes: makeNotes(),
      });
      setPhase('waiting');
    });

    socket.on('room_joined', ({ puzzle, totalEmpty, opponentSolved }) => {
      setGameState({
        roomId: '',
        puzzle,
        board: (puzzle as number[][]).map((r: number[]) => [...r]),
        cellStatus: makeStatusGrid(puzzle),
        totalEmpty,
        mySolved: 0,
        opponentSolved,
        notes: makeNotes(),
      });
      setPhase('playing');
    });

    socket.on('opponent_joined', ({ opponentSolved }) => {
      setGameState(prev => prev ? { ...prev, opponentSolved } : prev);
      setPhase('playing');
    });

    socket.on('opponent_progress', ({ solved }) => {
      setGameState(prev => prev ? { ...prev, opponentSolved: solved } : prev);
    });

    socket.on('cell_result', ({ row, col, correct, solved }) => {
      setGameState(prev => {
        if (!prev) return prev;
        const newStatus = prev.cellStatus.map((r: CellStatus[]) => [...r]) as CellStatus[][];
        newStatus[row][col] = correct ? 'correct' : 'wrong';
        return { ...prev, cellStatus: newStatus, mySolved: solved ?? prev.mySolved };
      });
    });

    socket.on('game_over', ({ winner }) => {
      setWinner(winner);
      setPhase('gameover');
    });

    socket.on('opponent_disconnected', () => {
      setError('Соперник отключился');
      setPhase('lobby');
      setGameState(null);
    });

    socket.on('join_error', ({ message }) => setError(message));
    socket.on('puzzle_error', ({ message }) => setError(message));

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('opponent_joined');
      socket.off('opponent_progress');
      socket.off('cell_result');
      socket.off('game_over');
      socket.off('opponent_disconnected');
      socket.off('join_error');
      socket.off('puzzle_error');
    };
  }, []);

  const handleCellInput = useCallback((row: number, col: number, value: number) => {
    if (!gameState) return;
    if (gameState.puzzle[row][col] !== 0) return;

    if (value === 0) {
      const prevStatus = gameState.cellStatus[row][col];
      const wasCorrect = prevStatus === 'correct';
      socket.emit('erase_cell', { roomId: gameState.roomId, row, col });
      setGameState(prev => {
        if (!prev) return prev;
        const board = prev.board.map(r => [...r]);
        const status = prev.cellStatus.map(r => [...r]) as CellStatus[][];
        board[row][col] = 0;
        status[row][col] = 'empty';
        const notes = prev.notes.map(r => r.map(s => new Set(s)));
        notes[row][col].clear();
        return {
          ...prev,
          board,
          cellStatus: status,
          notes,
          mySolved: wasCorrect ? prev.mySolved - 1 : prev.mySolved,
        };
      });
      return;
    }

    setGameState(prev => {
      if (!prev) return prev;
      const board = prev.board.map(r => [...r]);
      board[row][col] = value;
      return { ...prev, board };
    });

    socket.emit('check_cell', { roomId: gameState.roomId, row, col, value });
  }, [gameState]);

  const handleNoteToggle = useCallback((row: number, col: number, num: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const notes = prev.notes.map(r => r.map(s => new Set(s)));
      if (notes[row][col].has(num)) {
        notes[row][col].delete(num);
      } else {
        notes[row][col].add(num);
      }
      return { ...prev, notes };
    });
  }, []);

  const backToLobby = useCallback(() => {
    setPhase('lobby');
    setGameState(null);
    setWinner(null);
    setError('');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-logo">Судоку</h1>
        <span className="app-subtitle">Мультиплеер</span>
      </header>

      {error && (
        <div className="error-banner" onClick={() => setError('')}>
          {error} <span className="error-close">×</span>
        </div>
      )}

      {phase === 'lobby' && (
        <GameLobby onError={setError} onCustom={() => setPhase('custom')} />
      )}
      {phase === 'custom' && (
        <CustomPuzzleCreator
          onBack={() => setPhase('lobby')}
          onError={setError}
        />
      )}
      {phase === 'waiting' && gameState && (
        <WaitingRoom
          roomId={gameState.roomId}
          puzzle={gameState.puzzle}
          totalEmpty={gameState.totalEmpty}
          onBack={backToLobby}
        />
      )}
      {phase === 'playing' && gameState && (
        <SudokuGame
          gameState={gameState}
          onCellInput={handleCellInput}
          onNoteToggle={handleNoteToggle}
          onBack={backToLobby}
        />
      )}
      {phase === 'gameover' && (
        <GameOver winner={winner} onBack={backToLobby} />
      )}
    </div>
  );
}
