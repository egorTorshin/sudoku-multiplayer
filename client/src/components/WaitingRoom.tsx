import './WaitingRoom.css';

interface Props {
  roomId: string;
  puzzle: number[][];
  totalEmpty: number;
  onBack: () => void;
}

export default function WaitingRoom({ roomId, totalEmpty, onBack }: Props) {
  const copy = () => navigator.clipboard.writeText(roomId);

  return (
    <div className="waiting">
      <div className="waiting-card">
        <div className="waiting-spinner" />
        <h2 className="waiting-title">Ожидание соперника...</h2>
        <p className="waiting-desc">
          Поделитесь кодом комнаты с другом, чтобы начать игру.
        </p>
        <div className="room-code-display">
          <span className="room-code-label">Код комнаты</span>
          <div className="room-code-value">{roomId}</div>
          <button className="copy-btn" onClick={copy}>Скопировать</button>
        </div>
        <div className="waiting-info">
          Головоломка: <strong>{totalEmpty} пустых клеток</strong>
        </div>
        <button className="back-link" onClick={onBack}>← Отмена</button>
      </div>
    </div>
  );
}
