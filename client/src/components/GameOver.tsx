import './GameOver.css';

interface Props {
  winner: 'you' | 'opponent' | null;
  reason?: string;
  onBack: () => void;
}

export default function GameOver({ winner, reason, onBack }: Props) {
  const won = winner === 'you';

  const desc = won
    ? reason === 'opponent_mistakes'
      ? 'Соперник допустил 3 ошибки — вы победили!'
      : 'Вы решили судоку первым!'
    : reason === 'mistakes'
      ? 'Вы допустили 3 ошибки.'
      : 'Соперник решил судоку быстрее.';

  return (
    <div className="gameover">
      <div className="gameover-card">
        <div className={`gameover-emoji ${won ? 'won' : 'lost'}`}>
          {won ? '🏆' : '😔'}
        </div>
        <h2 className="gameover-title">
          {won ? 'Поздравляем!' : 'В следующий раз повезёт'}
        </h2>
        <p className="gameover-desc">{desc}</p>
        <button className="primary-btn" onClick={onBack}>
          Новая игра
        </button>
      </div>
    </div>
  );
}
