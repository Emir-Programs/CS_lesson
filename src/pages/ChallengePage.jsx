import React, { useState } from 'react';
import './ChallengePage.scss';

export default function KahootChallenge() {
  const [step, setStep] = useState('empty'); 
  const [nickname, setNickname] = useState('');
  const [answer, setAnswer] = useState('');

  const topPlayers = [
    { id: 1, name: 'QuantumHamster', points: 2500 },
    { id: 2, name: 'CyberCat', points: 2100 },
    { id: 3, name: 'MegaBrain', points: 1800 },
    { id: 4, name: 'SmartOwl', points: 1500 },
    { id: 5, name: 'TechWiz', points: 1200 }
  ];

  const resetFlow = () => {
    setStep('empty');
    setNickname('');
    setAnswer('');
  };

  return (
    <div className="kahoot-container">
      <div className="grid-overlay" />
      
      <header className="page-header">
        <div className="brand">
          <span className="dot" /> CLASS SMART SPEAKER
        </div>
        <div className="header-controls">
          <button className="top-toggle-btn" onClick={() => setStep('leaderboard')}>
            🏆 ТОП ИГРОКОВ
          </button>
          <div className="live-status">
            В ЭФИРЕ <span className="live-dot" />
          </div>
        </div>
      </header>

      <main className="main-content">
        {step === 'success' && (
          <div className="sidebar-badge">
            <span className="badge-dot" /> {nickname || 'Игрок'}
          </div>
        )}

        <div className="card-wrapper">
          {step === 'empty' && (
            <div className="empty-throne">
              <div className="crown-icon">👑</div>
              <h2>Трон пустует.</h2>
              <p>Кто готов принять вызов?</p>
              <div className="dots-indicator">•••••</div>
            </div>
          )}

          {step === 'success' && (
            <div className="success-screen">
              <div className="success-meta">● LIVE — ОТВЕЧАЕТ</div>
              <h1 className="result-text">
                Сколько ребер у куба? = <span className="highlight">{answer || '12'}</span>
              </h1>
            </div>
          )}

          {step === 'leaderboard' && (
            <div className="leaderboard-screen">
              <h2 className="leaderboard-title">🏆 Таблица лидеров класса</h2>
              <div className="leaderboard-list">
                {topPlayers.map((player, index) => (
                  <div key={player.id} className={`leaderboard-item rank-${index + 1}`}>
                    <div className="player-rank">
                      {index === 0 ? '👑' : `#${index + 1}`}
                    </div>
                    <div className="player-name">{player.name}</div>
                    <div className="player-points">{player.points} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'nickname' && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <button className="close-btn" onClick={() => setStep('empty')}>×</button>
                <div className="modal-tag">✦ КЛАССНЫЙ БАТТЛ</div>
                <h2 className="modal-title">Представься, знаток.</h2>
                
                <div className="input-group">
                  <label>ТВОЙ НИКНЕЙМ</label>
                  <input 
                    type="text" 
                    placeholder="например, КвантовыйХомяк" 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <button 
                  className={`action-btn ${nickname.trim() ? 'active' : ''}`}
                  disabled={!nickname.trim()}
                  onClick={() => setStep('question')}
                >
                  К вызову готов →
                </button>
              </div>
            </div>
          )}

          {step === 'question' && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <button className="close-btn" onClick={() => setStep('empty')}>×</button>
                <div className="modal-tag">✦ КЛАССНЫЙ БАТТЛ</div>
                <h2 className="modal-title">Ответь, чтобы занять трон.</h2>
                
                <div className="question-box">
                  Сколько ребер у куба?
                </div>

                <div className="input-group">
                  <label>ТВОЙ ОТВЕТ</label>
                  <input 
                    type="text" 
                    placeholder="Введи ответ..." 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>

                <span className="hint-link">Нужна подсказка?</span>

                <button 
                  className={`action-btn ${answer.trim() ? 'active' : ''}`}
                  disabled={!answer.trim()}
                  onClick={() => setStep('success')}
                >
                  Отправить ответ ⚡
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="page-footer">
        {step === 'success' || step === 'leaderboard' ? (
          <button className="footer-btn reset" onClick={resetFlow}>
            Вернуться на главную 🔄
          </button>
        ) : (
          <button className="footer-btn" onClick={() => setStep('nickname')}>
            Стать умником урока! ⚡
          </button>
        )}
      </footer>
    </div>
  );
}