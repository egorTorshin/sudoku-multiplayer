import { useState } from 'react';
import { socket } from '../socket';
import { Difficulty } from '../types';
import './GameLobby.css';

interface Props {
  onError: (msg: string) => void;
  onCustom: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Лёгкий', desc: '32 пустые клетки' },
  { value: 'medium', label: 'Средний', desc: '42 пустые клетки' },
  { value: 'hard', label: 'Сложный', desc: '50 пустых клеток' },
  { value: 'expert', label: 'Эксперт', desc: '56 пустых клеток' },
];

export default function GameLobby({ onError, onCustom }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const handleCreate = () => {
    onError('');
    socket.emit('create_room', { difficulty });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      onError('Введите код комнаты');
      return;
    }
    onError('');
    socket.emit('join_room', { roomId: joinCode.trim().toUpperCase() });
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="lobby-tabs">
          <button
            className={`lobby-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => setTab('create')}
          >
            Создать игру
          </button>
          <button
            className={`lobby-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            Присоединиться
          </button>
        </div>

        {tab === 'create' && (
          <div className="lobby-section">
            <p className="lobby-label">Сложность</p>
            <div className="difficulty-grid">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  className={`diff-btn ${difficulty === d.value ? 'active' : ''}`}
                  onClick={() => setDifficulty(d.value)}
                >
                  <span className="diff-label">{d.label}</span>
                  <span className="diff-desc">{d.desc}</span>
                </button>
              ))}
            </div>

            <button className="primary-btn" onClick={handleCreate}>
              Создать комнату
            </button>

            <div className="lobby-divider">или</div>

            <button className="secondary-btn" onClick={onCustom}>
              Создать свою головоломку
            </button>
          </div>
        )}

        {tab === 'join' && (
          <div className="lobby-section">
            <p className="lobby-label">Код комнаты</p>
            <input
              className="room-input"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Например: ABC123"
              maxLength={6}
              autoFocus
            />
            <button className="primary-btn" onClick={handleJoin}>
              Войти в комнату
            </button>
          </div>
        )}
      </div>

      <div className="lobby-hint">
        <span>Игра для двух игроков. Каждый решает головоломку независимо — кто первый, тот победил!</span>
      </div>
    </div>
  );
}
