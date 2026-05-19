import { useCallback, useEffect, useState } from 'react';
import { socket } from '../socket';
import './CustomPuzzleCreator.css';

interface Props {
  onBack: () => void;
  onError: (msg: string) => void;
}

function makeEmpty(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export default function CustomPuzzleCreator({ onBack, onError }: Props) {
  const [grid, setGrid] = useState<number[][]>(makeEmpty);
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const setCell = useCallback((r: number, c: number, val: number) => {
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = val;
      return next;
    });
  }, []);

  const handleSelect = (r: number, c: number) => {
    setSelected(prev => (prev?.[0] === r && prev?.[1] === c) ? null : [r, c]);
  };

  const handleNumber = (n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    setCell(r, c, n);
  };

  const handleErase = () => {
    if (!selected) return;
    const [r, c] = selected;
    setCell(r, c, 0);
  };

  const handleCreate = () => {
    const filled = grid.flat().filter(v => v !== 0).length;
    if (filled < 17) {
      onError('Минимум 17 заполненных клеток для уникального решения');
      return;
    }
    onError('');
    socket.emit('create_custom_room', { givenCells: grid });
  };

  const handleClear = () => {
    setGrid(makeEmpty());
    setSelected(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') handleNumber(parseInt(e.key));
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') handleErase();
      if (!selected) return;
      const [r, c] = selected;
      if (e.key === 'ArrowUp' && r > 0) { e.preventDefault(); setSelected([r - 1, c]); }
      if (e.key === 'ArrowDown' && r < 8) { e.preventDefault(); setSelected([r + 1, c]); }
      if (e.key === 'ArrowLeft' && c > 0) { e.preventDefault(); setSelected([r, c - 1]); }
      if (e.key === 'ArrowRight' && c < 8) { e.preventDefault(); setSelected([r, c + 1]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const filledCount = grid.flat().filter(v => v !== 0).length;
  const emptyCount = 81 - filledCount;

  function getCellClass(r: number, c: number) {
    const classes = ['cc-cell'];
    if (selected?.[0] === r && selected?.[1] === c) classes.push('cc-selected');
    else if (selected) {
      const [sr, sc] = selected;
      if (sr === r || sc === c || (Math.floor(sr/3) === Math.floor(r/3) && Math.floor(sc/3) === Math.floor(c/3))) {
        classes.push('cc-peer');
      }
    }
    return classes.join(' ');
  }

  return (
    <div className="custom-creator">
      <div className="custom-header">
        <button className="back-link" onClick={onBack}>← Назад</button>
        <h2 className="custom-title">Своя головоломка</h2>
      </div>

      <p className="custom-hint">
        Заполните начальные цифры — это будет условие задачи для обоих игроков.
        Оставьте пустыми те клетки, которые нужно разгадать.
      </p>

      <div className="cc-board" role="grid">
        {grid.map((rowArr, r) =>
          rowArr.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className={getCellClass(r, c)}
              data-row={r}
              data-col={c}
              onClick={() => handleSelect(r, c)}
              role="gridcell"
            >
              {val !== 0 && (
                <span className="cc-num">{val}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="cc-numpad">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="cc-num-btn" onClick={() => handleNumber(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="cc-actions">
        <span className="cc-stat">
          Заполнено: <strong>{filledCount}</strong> | Пустых: <strong>{emptyCount}</strong>
        </span>
        <div className="cc-btns">
          <button className="secondary-btn" onClick={handleClear}>Очистить</button>
          <button
            className="primary-btn"
            onClick={handleCreate}
            disabled={filledCount < 17}
          >
            Создать комнату
          </button>
        </div>
      </div>
    </div>
  );
}
