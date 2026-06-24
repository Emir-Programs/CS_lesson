import React, { useState, useEffect } from 'react';
import './ChallengePage.scss';
import { db } from '../firebase';
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
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

const LOCAL_STORAGE_CLEAR_INTERVAL_MS = 20 * 60 * 1000;
const NEARBY_RADIUS = 2;

const LESSON_DOC = doc(db, 'leaderboard', 'lesson');
const ALL_TIME_DOC = doc(db, 'leaderboard', 'allTime');
const RESET_META_DOC = doc(db, 'meta', 'reset');
const QUESTIONS_COLLECTION = collection(db, 'questions');
const LATEST_QUESTION_QUERY = query(QUESTIONS_COLLECTION, orderBy('createdAt', 'desc'), limit(1));

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

function getNearbySlice(list, name, radius = NEARBY_RADIUS) {
  if (!list.length) return [];
  const idx = list.findIndex((p) => p.name === name);
  if (idx === -1) {
    return list.slice(0, radius * 2 + 1).map((p, i) => ({ ...p, rank: i + 1 }));
  }
  let start = idx - radius;
  let end = idx + radius + 1;
  if (start < 0) {
    end += -start;
    start = 0;
  }
  if (end > list.length) {
    start -= end - list.length;
    end = list.length;
    start = Math.max(0, start);
  }
  return list.slice(start, end).map((p, i) => ({ ...p, rank: start + i + 1 }));
}

export default function KahootChallenge() {
  const [step, setStep] = useState('empty');

  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('nickname') || '';
  });

  const [answer, setAnswer] = useState('');
  const [leaderboardView, setLeaderboardView] = useState('lesson');

  const [lessonTop, setLessonTop] = useState([]);
  const [allTimeTop, setAllTimeTop] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState({ id: '', text: 'Загрузка...', correctAnswer: '' });
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  const [stats, setStats] = useState(() => {
    const total = parseInt(localStorage.getItem('stats_total') || '0', 10);
    const correct = parseInt(localStorage.getItem('stats_correct') || '0', 10);
    return { total, correct };
  });

  useEffect(() => {
    const unsubLesson = onSnapshot(LESSON_DOC, (snap) => {
      setLessonTop(snap.exists() ? snap.data().players || [] : []);
    });
    const unsubAllTime = onSnapshot(ALL_TIME_DOC, (snap) => {
      setAllTimeTop(snap.exists() ? snap.data().players || [] : []);
    });
    const unsubQuestion = onSnapshot(LATEST_QUESTION_QUERY, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const qData = docSnap.data();
        setCurrentQuestion({
          id: docSnap.id,
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

  useEffect(() => {
    if (!currentQuestion.id) return;

    const answeredStatus = localStorage.getItem(`answered_${currentQuestion.id}`);
    const hasAnswered = !!answeredStatus;

    setHasAnsweredCurrent(hasAnswered);

    if (hasAnswered) {
      setAnswer(localStorage.getItem(`last_answer_${currentQuestion.id}`) || '');
      if (step !== 'success') {
        setStep('success');
      }
    } else {
      setAnswer('');
      if (step === 'success') {
        setStep('empty');
      }
    }
  }, [currentQuestion.id]);

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

  useEffect(() => {
    const clearOldLocalStorage = () => {
      const savedNickname = localStorage.getItem('nickname');
      const savedTotal = localStorage.getItem('stats_total');
      const savedCorrect = localStorage.getItem('stats_correct');

      localStorage.clear();

      if (savedNickname) localStorage.setItem('nickname', savedNickname);
      if (savedTotal) localStorage.setItem('stats_total', savedTotal);
      if (savedCorrect) localStorage.setItem('stats_correct', savedCorrect);

      setHasAnsweredCurrent(false);
      if (step === 'success') {
        setStep('empty');
      }
    };

    const interval = setInterval(clearOldLocalStorage, LOCAL_STORAGE_CLEAR_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [step]);

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

  const handleStartChallenge = () => {
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

    registerScore(nickname.trim(), isCorrect ? 100 : 10);

    localStorage.setItem(`answered_${currentQuestion.id}`, 'true');
    localStorage.setItem(`last_answer_${currentQuestion.id}`, trimmedAnswer);

    const newTotal = stats.total + 1;
    const newCorrect = stats.correct + (isCorrect ? 1 : 0);
    localStorage.setItem('stats_total', String(newTotal));
    localStorage.setItem('stats_correct', String(newCorrect));
    setStats({ total: newTotal, correct: newCorrect });

    setHasAnsweredCurrent(true);
    setStep('success');
  };

  const resetFlow = () => {
    setStep('empty');
    setAnswer('');
  };

  const currentTop = leaderboardView === 'lesson' ? lessonTop : allTimeTop;
  const nearbyTop = getNearbySlice(currentTop, nickname.trim(), NEARBY_RADIUS);

  const percentCorrect = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

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
              {stats.total > 0 && (
                <div className="accuracy-badge">
                  ✅ Правильных ответов: {percentCorrect}% ({stats.correct}/{stats.total})
                </div>
              )}
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
              {stats.total > 0 && (
                <p className="sub-result-text">
                  Твоя точность: {percentCorrect}% ({stats.correct}/{stats.total})
                </p>
              )}
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
                {nearbyTop.length === 0 && (
                  <div className="leaderboard-empty">Пока никто не отвечал 🙈</div>
                )}
                {nearbyTop.map((player) => (
                  <div
                    key={player.name}
                    className={`leaderboard-item rank-${player.rank} ${player.name === nickname.trim() ? 'is-me' : ''}`}
                  >
                    <div className="player-rank">
                      {player.rank === 1 ? '👑' : `#${player.rank}`}
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