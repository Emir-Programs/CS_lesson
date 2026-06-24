import React, { useState, useEffect } from 'react';
import './ChallengePage.scss';
import { db } from '../firebase';
import {
  doc,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';

const START_HOUR = 8;
const START_MINUTE = 15;
const INTERVAL_MINUTES = 45;
const SLOTS_COUNT = 10; 
const RESET_SLOTS = Array.from({ length: SLOTS_COUNT }, (_, i) => {
  const totalMinutes = START_HOUR * 60 + START_MINUTE + i * INTERVAL_MINUTES;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return h * 60 + m; 
});

const LESSON_DOC = doc(db, 'leaderboard', 'lesson');
const ALL_TIME_DOC = doc(db, 'leaderboard', 'allTime');
const RESET_META_DOC = doc(db, 'meta', 'reset');
const CURRENT_QUESTION_DOC = doc(db, 'quiz', 'current'); // Документ с текущим вопросом

function getBishkekNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bishkek' }));
}

function getResetMarker(now) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let lastPassedSlot = null;
  for (const slot of RESET_SLOTS) {
    if (slot <= nowMinutes) {
      lastPassedSlot = slot;
    }
  }
  if (lastPassedSlot === null) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString() + ' none';
  }
  return now.toDateString() + ' ' + lastPassedSlot;
}

function addScoreToList(list, name, points) {
  const existingIndex = list.findIndex((p) => p.name === name);
  let updated;
  if (existingIndex >= 0) {
    updated = [...list];
    updated[existingIndex] = {
      ...updated[existingIndex],
      points: updated[existingIndex].points + points
    };
  } else {
    updated = [...list, { name, points }];
  }
  return updated.sort((a, b) => b.points - a.points);
}

export default function KahootChallenge() {
  const [step, setStep] = useState('empty');
  
  // 1. Сразу инициализируем nickname из localStorage, если он есть
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('nickname') || '';
  });
  
  const [answer, setAnswer] = useState('');
  const [leaderboardView, setLeaderboardView] = useState('lesson');

  const [lessonTop, setLessonTop] = useState([]);
  const [allTimeTop, setAllTimeTop] = useState([]);
  
  // Состояния для динамического вопроса
  const [currentQuestion, setCurrentQuestion] = useState({ id: '', text: 'Загрузка...', correctAnswer: '' });
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  // Подписка на лидерборды И на текущий вопрос из базы
  useEffect(() => {
    const unsubLesson = onSnapshot(LESSON_DOC, (snap) => {
      setLessonTop(snap.exists() ? snap.data().players || [] : []);
    });
    const unsubAllTime = onSnapshot(ALL_TIME_DOC, (snap) => {
      setAllTimeTop(snap.exists() ? snap.data().players || [] : []);
    });
    const unsubQuestion = onSnapshot(CURRENT_QUESTION_DOC, (snap) => {
      if (snap.exists()) {
        const qData = snap.data();
        setCurrentQuestion({
          id: snap.id + '_' + (qData.id || 'default'), // уникальный ID вопроса
          text: qData.text || '',
          correctAnswer: qData.correctAnswer || ''
        });
      }
    });

    return () => {
      unsubLesson();
      unsubAllTime();
      unsubQuestion();
    };
  }, []);

  // Проверка: отвечал ли уже пользователь на ЭТОТ вопрос?
  useEffect(() => {
    if (currentQuestion.id) {
      const answeredStatus = localStorage.getItem(`answered_${currentQuestion.id}`);
      setHasAnsweredCurrent(!!answeredStatus);
      
      // Если на текущий вопрос уже отвечали, то не даем висеть на экране успеха старого ответа
      if (answeredStatus && step === 'success') {
        setAnswer(localStorage.getItem(`last_answer_${currentQuestion.id}`) || '');
      } else if (!answeredStatus && step === 'success') {
        setStep('empty'); // сброс экрана, если прилетел новый вопрос
      }
    }
  }, [currentQuestion.id, step]);

  // Сброс по расписанию
  useEffect(() => {
    const checkReset = async () => {
      const now = getBishkekNow();
      const currentMarker = getResetMarker(now);

      try {
        await runTransaction(db, async (tx) => {
          const metaSnap = await tx.get(RESET_META_DOC);
          const lastMarker = metaSnap.exists() ? metaSnap.data().marker : null;

          if (currentMarker !== lastMarker) {
            tx.set(RESET_META_DOC, { marker: currentMarker });
            tx.set(LESSON_DOC, { players: [] });
          }
        });
      } catch (e) {
        console.error('Ошибка проверки сброса топа:', e);
      }
    };

    checkReset();
    const interval = setInterval(checkReset, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Атомарное начисление очков
  const registerScore = async (name, points) => {
    try {
      await runTransaction(db, async (tx) => {
        const lessonSnap = await tx.get(LESSON_DOC);
        const allTimeSnap = await tx.get(ALL_TIME_DOC);

        const lessonPlayers = lessonSnap.exists() ? lessonSnap.data().players || [] : [];
        const allTimePlayers = allTimeSnap.exists() ? allTimeSnap.data().players || [] : [];

        tx.set(LESSON_DOC, { players: addScoreToList(lessonPlayers, name, points) });
        tx.set(ALL_TIME_DOC, { players: addScoreToList(allTimePlayers, name, points) });
      });
    } catch (e) {
      console.error('Ошибка начисления очков:', e);
    }
  };

  // Логика кнопки действия на главном экране (Стать умником!)
  const handleStartChallenge = () => {
    // Если никнейм уже сохранен, сразу перекидываем на вопрос
    if (nickname.trim()) {
      setStep('question');
    } else {
      setStep('nickname');
    }
  };

  const handleSaveNickname = () => {
    if (nickname.trim()) {
      localStorage.setItem('nickname', nickname.trim());
      setStep('question');
    }
  };

  const handleSubmitAnswer = () => {
    const trimmedAnswer = answer.trim();
    const isCorrect = trimmedAnswer.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    
    // Начисляем очки
    registerScore(nickname.trim(), isCorrect ? 100 : 10);
    
    // Локально фиксируем, что на этот вопрос ответ отправлен
    localStorage.setItem(`answered_${currentQuestion.id}`, 'true');
    localStorage.setItem(`last_answer_${currentQuestion.id}`, trimmedAnswer);
    setHasAnsweredCurrent(true);
    
    setStep('success');
  };

  const resetFlow = () => {
    setStep('empty');
    setAnswer('');
  };

  const currentTop = leaderboardView === 'lesson' ? lessonTop : allTimeTop;

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
              <div className="success-meta">● LIVE — ОТВЕТ ПРИНЯТ</div>
              <h1 className="result-text">
                {currentQuestion.text} = <span className="highlight">{answer}</span>
              </h1>
              <p className="sub-result-text">Очки зачислены в таблицу лидеров!</p>
            </div>
          )}

          {step === 'leaderboard' && (
            <div className="leaderboard-screen">
              <h2 className="leaderboard-title">🏆 Таблица лидеров класса</h2>

              <div className="leaderboard-tabs">
                <button
                  className={leaderboardView === 'lesson' ? 'active' : ''}
                  onClick={() => setLeaderboardView('lesson')}
                >
                  Топ урока
                </button>
                <button
                  className={leaderboardView === 'all' ? 'active' : ''}
                  onClick={() => setLeaderboardView('all')}
                >
                  Общий топ
                </button>
              </div>

              <div className="leaderboard-list">
                {currentTop.length === 0 && (
                  <div className="leaderboard-empty">Пока никто не отвечал 🙈</div>
                )}
                {currentTop.map((player, index) => (
                  <div key={player.name} className={`leaderboard-item rank-${index + 1}`}>
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
                    placeholder="Введи свое имя..." 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <button 
                  className={`action-btn ${nickname.trim() ? 'active' : ''}`}
                  disabled={!nickname.trim()}
                  onClick={handleSaveNickname}
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
                  {currentQuestion.text}
                </div>

                {hasAnsweredCurrent ? (
                  <div className="already-answered">
                    🛑 Ты уже ответил на этот вопрос! Дождись следующего задания от учителя.
                  </div>
                ) : (
                  <>
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
                      onClick={handleSubmitAnswer}
                    >
                      Отправить ответ ⚡
                    </button>
                  </>
                )}
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
          <button className="footer-btn" onClick={handleStartChallenge}>
            Стать умником урока! ⚡
          </button>
        )}
      </footer>
    </div>
  );
}