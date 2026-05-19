import './NumberPad.css';

interface Props {
  notesMode: boolean;
  onToggleNotes: () => void;
  onNumber: (n: number) => void;
  onErase: () => void;
  onUndo: () => void;
  remaining: number[];
}

export default function NumberPad({ notesMode, onToggleNotes, onNumber, onErase, onUndo, remaining }: Props) {
  return (
    <div className="numpad">
      <div className="numpad-controls">
        <button className="ctrl-btn" onClick={onUndo} title="Отменить">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l3-3-3-3" transform="rotate(180 7.5 7.5)" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H3" />
          </svg>
          Отмена
        </button>
        <button
          className={`ctrl-btn ${notesMode ? 'ctrl-active' : ''}`}
          onClick={onToggleNotes}
          title="Заметки"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Заметки
        </button>
        <button className="ctrl-btn" onClick={onErase} title="Стереть">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20H7L3 16l11-11 6 6-1 1" />
            <path d="M6.5 17.5l5-5" />
          </svg>
          Стереть
        </button>
      </div>

      <div className="numpad-numbers">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            className={`num-btn ${remaining[n] === 0 ? 'num-btn-done' : ''}`}
            onClick={() => onNumber(n)}
            disabled={remaining[n] === 0 && !notesMode}
          >
            <span className="num-btn-digit">{n}</span>
            {remaining[n] > 0 && (
              <span className="num-btn-remaining">{remaining[n]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
