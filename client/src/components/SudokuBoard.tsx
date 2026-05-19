import { CellStatus } from '../types';
import './SudokuBoard.css';

interface Props {
  board: number[][];
  puzzle: number[][];
  cellStatus: CellStatus[][];
  notes: Set<number>[][];
  selected: [number, number] | null;
  onSelect: (row: number, col: number) => void;
}

function getCellClass(
  row: number,
  col: number,
  selected: [number, number] | null,
  board: number[][],
  cellStatus: CellStatus[][]
): string {
  const classes: string[] = ['cell'];
  const status = cellStatus[row][col];

  if (status === 'given') classes.push('cell-given');
  else if (status === 'correct') classes.push('cell-correct');
  else if (status === 'wrong') classes.push('cell-wrong');
  else classes.push('cell-empty');

  if (!selected) return classes.join(' ');

  const [sr, sc] = selected;
  const isSelected = sr === row && sc === col;

  if (isSelected) {
    classes.push('cell-selected');
    return classes.join(' ');
  }

  const isPeer = sr === row || sc === col
    || (Math.floor(sr / 3) === Math.floor(row / 3) && Math.floor(sc / 3) === Math.floor(col / 3));

  if (isPeer) {
    classes.push('cell-peer');
  }

  const selVal = board[sr][sc];
  const curVal = board[row][col];
  if (selVal !== 0 && curVal === selVal) {
    classes.push('cell-same-num');
  }

  return classes.join(' ');
}

export default function SudokuBoard({ board, cellStatus, notes, selected, onSelect }: Props) {
  return (
    <div className="sudoku-board" role="grid">
      {board.map((rowArr, r) =>
        rowArr.map((val, c) => {
          const status = cellStatus[r][c];
          const note = notes[r][c];
          const cls = getCellClass(r, c, selected, board, cellStatus);
          const isGiven = status === 'given';
          const hasNote = note.size > 0 && val === 0;

          return (
            <div
              key={`${r}-${c}`}
              className={cls}
              data-row={r}
              data-col={c}
              onClick={() => onSelect(r, c)}
              role="gridcell"
              aria-selected={selected?.[0] === r && selected?.[1] === c}
            >
              {hasNote ? (
                <div className="note-grid">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <span key={n} className={`note-num ${note.has(n) ? 'note-active' : ''}`}>
                      {note.has(n) ? n : ''}
                    </span>
                  ))}
                </div>
              ) : val !== 0 ? (
                <span className={`cell-num ${isGiven ? 'num-given' : status === 'wrong' ? 'num-wrong' : 'num-user'}`}>
                  {val}
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
