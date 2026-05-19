import './GameOver.css';

interface Props {
  winner: 'you' | 'opponent' | null;
  onBack: () => void;
}

export default function GameOver({ winner, onBack }: Props) {
  const won = winner === 'you';
  return (
    <div className="gameover">
      <div className="gameover-card">
        <div className={`gameover-emoji ${won ? 'won' : 'lost'}`}>
          {won ? '🏆' : '😔'}
        </div>
        <h2 className="gameover-title">
          {won ? 'Поздравляем!' : 'В следующий раз повезёт'}
        </h2>
        <p className="gameover-desc">
          {won
            ? 'Вы решили судоку первым!'
            : 'Соперник решил судоку быстрее.'}
        </p>
        <button className="primary-btn" onClick={onBack}>
          Новая игра
        </button>
      </div>
    </div>
  );
}
