import React, { useState, useEffect } from 'react';
import './ChallengePage.scss';
import { db } from '../firebase';
import {
  doc,
  onSnapshot,
  runTransaction,
  setDoc
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

// Коллекция "meta":
//   doc "reset"   -> { marker: "..." }                 — общий для всех устройств маркер
//                                                          последнего выполненного сброса
const LESSON_DOC = doc(db, 'leaderboard', 'lesson');
const ALL_TIME_DOC = doc(db, 'leaderboard', 'allTime');
const RESET_META_DOC = doc(db, 'meta', 'reset');

// Текущее время в Бишкеке
function getBishkekNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bishkek' }));
}

// Уникальный "маркер" последнего пройденного слота сброса на сегодня.
// Находит последний слот из расписания, который уже наступил, и возвращает
// его вместе с датой — так сброс срабатывает один раз за каждый слот,
// даже если приложение не было открыто в момент самого сброса.
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
  const [nickname, setNickname] = useState('');
  const [answer, setAnswer] = useState('');
  const [leaderboardView, setLeaderboardView] = useState('lesson'); // 'lesson' | 'all'

  const [lessonTop, setLessonTop] = useState([]);
  const [allTimeTop, setAllTimeTop] = useState([]);

  // Живая подписка на топ урока и общий топ — обновляются у всех в реальном времени
  useEffect(() => {
    const unsubLesson = onSnapshot(LESSON_DOC, (snap) => {
      setLessonTop(snap.exists() ? snap.data().players || [] : []);
    });
    const unsubAllTime = onSnapshot(ALL_TIME_DOC, (snap) => {
      setAllTimeTop(snap.exists() ? snap.data().players || [] : []);
    });
    return () => {
      unsubLesson();
      unsubAllTime();
    };
  }, []);

  // Проверка и выполнение сброса топа урока по времени Кыргызстана.
  // Маркер сброса хранится в Firestore, поэтому сброс синхронный для всех устройств —
  // не важно, кто из учеников/учителей открыл приложение первым.
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

  // Начисление очков — атомарно обновляет оба документа в Firestore
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

  const resetFlow = () => {
    setStep('empty');
    setNickname('');
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
              <div className="success-meta">● LIVE — ОТВЕЧАЕТ</div>
              <h1 className="result-text">
                Сколько ребер у куба? = <span className="highlight">{answer || '12'}</span>
              </h1>
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
                  onClick={() => {
                    const isCorrect = answer.trim() === '12';
                    registerScore(nickname.trim() || 'Игрок', isCorrect ? 100 : 10);
                    setStep('success');
                  }}
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