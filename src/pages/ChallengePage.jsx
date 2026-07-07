import React, { useState } from 'react';
import './ChallengePage.scss';

export default function ChallengePage() {
  // Этапы: 'empty' (основной), 'nickname' (модалка 1), 'question' (модалка 2), 'success' (результат)
  const [step, setStep] = useState('empty');
  const [nickname, setNickname] = useState('');
  const [answer, setAnswer] = useState('');

  const resetFlow = () => {
    setStep('empty');
    setNickname('');
    setAnswer('');
  };

  return (
    <div className="challenge-container">
      {/* Фоновая сетка и общая обертка */}
      <div className="grid-overlay" />
      
      <header className="page-header">
        <div className="brand">
          <span className="dot" /> CLASS SMART SPEAKER
        </div>
        <div className="live-status">
          LIVE <span className="live-dot" />
        </div>
      </header>

      <main className="main-content">
        {/* Боковая панель для финального экрана (как на 4-м скрине) */}
        {step === 'success' && (
          <div className="sidebar-badge">
            <span className="badge-dot" /> фыв
          </div>
        )}

        <div className="card-wrapper">
          {/* ЭКРАН 1: Трон пустует */}
          {step === 'empty' && (
            <div className="empty-throne">
              <div className="crown-icon">👑</div>
              <h2>Трон пустует.</h2>
              <p>Кто готов?</p>
              <div className="dots-indicator">•••••</div>
            </div>
          )}

          {/* ЭКРАН 4: Результат ответа */}
          {step === 'success' && (
            <div className="success-screen">
              <div className="success-meta">● LIVE — ОТВЕЧАЕТ</div>
              <h1 className="result-text">
                How many edges does a cube have? = <span className="highlight">{answer || '12'}</span>
              </h1>
            </div>
          )}

          {/* МОДАЛКА 1: Ввод никнейма */}
          {step === 'nickname' && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <button className="close-btn" onClick={() => setStep('empty')}>×</button>
                <div className="modal-tag">✦ CHALLENGE ROOM</div>
                <h2 className="modal-title">Identify yourself, scholar.</h2>
                
                <div className="input-group">
                  <label>YOUR NICKNAME</label>
                  <input 
                    type="text" 
                    placeholder="e.g. QuantumHamster" 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <button 
                  className={`action-btn ${nickname.trim() ? 'active' : ''}`}
                  disabled={!nickname.trim()}
                  onClick={() => setStep('question')}
                >
                  Ready for the challenge →
                </button>
              </div>
            </div>
          )}

          {/* МОДАЛКА 2: Вопрос */}
          {step === 'question' && (
            <div className="modal-backdrop">
              <div className="modal-card">
                <button className="close-btn" onClick={() => setStep('empty')}>×</button>
                <div className="modal-tag">✦ CHALLENGE ROOM</div>
                <h2 className="modal-title">Solve to claim the throne.</h2>
                
                <div className="question-box">
                  How many edges does a cube have?
                </div>

                <div className="input-group">
                  <label>YOUR ANSWER</label>
                  <input 
                    type="text" 
                    placeholder="Type your answer..." 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>

                <span className="hint-link">Need a hint?</span>

                <button 
                  className={`action-btn ${answer.trim() ? 'active' : ''}`}
                  disabled={!answer.trim()}
                  onClick={() => setStep('success')}
                >
                  Submit Answer ⚡
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Нижняя фиксированная кнопка действия */}
      <footer className="page-footer">
        {step === 'success' ? (
          <button className="footer-btn reset" onClick={resetFlow}>
            Освободить трон 🔄
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