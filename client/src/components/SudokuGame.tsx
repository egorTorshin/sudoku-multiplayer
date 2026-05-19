import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, CellStatus } from '../types';
import SudokuBoard from './SudokuBoard';
import NumberPad from './NumberPad';
import './SudokuGame.css';

interface HistoryEntry {
  row: number;
  col: number;
  prevValue: number;
  prevStatus: CellStatus;
}

interface Props {
  gameState: GameState;
  onCellInput: (row: number, col: number, value: number) => void;
  onNoteToggle: (row: number, col: number, num: number) => void;
  onBack: () => void;
}

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function SudokuGame({ gameState, onCellInput, onNoteToggle, onBack }: Props) {
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const history = useRef<HistoryEntry[]>([]);
  const timer = useTimer();

  const { board, puzzle, cellStatus, notes, mySolved, opponentSolved, totalEmpty } = gameState;

  const remaining = Array(10).fill(0);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v !== 0 && cellStatus[r][c] === 'correct' || cellStatus[r][c] === 'given') {
        remaining[v]++;
      }
    }
  }
  const remainingCount = remaining.map(cnt => 9 - cnt);

  const handleSelect = useCallback((r: number, c: number) => {
    setSelected(prev => (prev?.[0] === r && prev?.[1] === c) ? null : [r, c]);
  }, []);

  const handleNumber = useCallback((n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0) return;

    if (notesMode) {
      onNoteToggle(r, c, n);
      return;
    }

    history.current.push({ row: r, col: c, prevValue: board[r][c], prevStatus: cellStatus[r][c] });
    onCellInput(r, c, n);
  }, [selected, notesMode, board, cellStatus, puzzle, onCellInput, onNoteToggle]);

  const handleErase = useCallback(() => {
    if (!selected) return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0) return;
    history.current.push({ row: r, col: c, prevValue: board[r][c], prevStatus: cellStatus[r][c] });
    onCellInput(r, c, 0);
  }, [selected, board, cellStatus, puzzle, onCellInput]);

  const handleUndo = useCallback(() => {
    const entry = history.current.pop();
    if (!entry) return;
    const { row, col, prevValue } = entry;
    setSelected([row, col]);
    onCellInput(row, col, prevValue);
  }, [onCellInput]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') handleNumber(parseInt(e.key));
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') handleErase();
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (e.key === 'n' || e.key === 'N') setNotesMode(m => !m);
      if (!selected) return;
      const [r, c] = selected;
      if (e.key === 'ArrowUp' && r > 0) { e.preventDefault(); setSelected([r - 1, c]); }
      if (e.key === 'ArrowDown' && r < 8) { e.preventDefault(); setSelected([r + 1, c]); }
      if (e.key === 'ArrowLeft' && c > 0) { e.preventDefault(); setSelected([r, c - 1]); }
      if (e.key === 'ArrowRight' && c < 8) { e.preventDefault(); setSelected([r, c + 1]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, handleNumber, handleErase, handleUndo]);

  const myPct = totalEmpty > 0 ? Math.round((mySolved / totalEmpty) * 100) : 0;
  const opPct = totalEmpty > 0 ? Math.round((opponentSolved / totalEmpty) * 100) : 0;

  return (
    <div className="game-container">
      <div className="game-top">
        <button className="back-link" onClick={onBack}>← Выйти</button>
        <span className="game-timer">{timer}</span>
        {notesMode && <span className="notes-badge">Заметки</span>}
      </div>

      <div className="progress-section">
        <div className="progress-player">
          <div className="progress-label">
            <span className="progress-you">Вы</span>
            <span className="progress-count">{mySolved}/{totalEmpty}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill you" style={{ width: `${myPct}%` }} />
          </div>
        </div>
        <div className="progress-vs">VS</div>
        <div className="progress-player">
          <div className="progress-label">
            <span className="progress-opp">Соперник</span>
            <span className="progress-count">{opponentSolved}/{totalEmpty}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill opp" style={{ width: `${opPct}%` }} />
          </div>
        </div>
      </div>

      <SudokuBoard
        board={board}
        puzzle={puzzle}
        cellStatus={cellStatus}
        notes={notes}
        selected={selected}
        onSelect={handleSelect}
      />

      <NumberPad
        notesMode={notesMode}
        onToggleNotes={() => setNotesMode(m => !m)}
        onNumber={handleNumber}
        onErase={handleErase}
        onUndo={handleUndo}
        remaining={remainingCount}
      />
    </div>
  );
}
