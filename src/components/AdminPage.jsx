import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';

const LESSON_DOC = doc(db, 'leaderboard', 'lesson');
const CURRENT_QUESTION_DOC = doc(db, 'quiz', 'current');
const QUESTIONS_COLLECTION = collection(db, 'questions');

export default function AdminPage() {
  const navigate = useNavigate();
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const [questionsList, setQuestionsList] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({ text: 'Не установлен', correctAnswer: '' });
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');

  useEffect(() => {
    if (!isAuthorized) return;

    // Подписка на текущий активный вопрос
    const unsubQuestion = onSnapshot(CURRENT_QUESTION_DOC, (snap) => {
      if (snap.exists()) {
        setCurrentQuestion(snap.data());
      }
    });

    // Подписка на банк вопросов
    const unsubQuestionsList = onSnapshot(QUESTIONS_COLLECTION, (snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setQuestionsList(list);
    });

    return () => {
      unsubQuestion();
      unsubQuestionsList();
    };
  }, [isAuthorized]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === '123gg') { // Твой секретный пароль
      setIsAuthorized(true);
      localStorage.setItem('isAdmin', 'true');
    } else {
      alert('Неверный пароль администратора!');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthorized(false);
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newQuestionAnswer.trim()) return;

    try {
      await addDoc(QUESTIONS_COLLECTION, {
        text: newQuestionText.trim(),
        correctAnswer: newQuestionAnswer.trim(),
        createdAt: new Date().getTime()
      });
      setNewQuestionText('');
      setNewQuestionAnswer('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Удалить вопрос из базы данных?')) {
      await deleteDoc(doc(db, 'questions', id));
    }
  };

  const handleSetActiveQuestion = async (question) => {
    await setDoc(CURRENT_QUESTION_DOC, {
      db_id: question.id,
      text: question.text,
      correctAnswer: question.correctAnswer
    });
    alert('Вопрос запущен на экраны учеников!');
  };

  const handleResetLeaderboard = async () => {
    if (window.confirm('Очистить рейтинг текущего урока?')) {
      await setDoc(LESSON_DOC, { players: [] });
      alert('Рейтинг сброшен!');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="kahoot-container">
        <div className="modal-backdrop" style={{ display: 'flex' }}>
          <div className="modal-card">
            <div className="modal-tag">🔒 ВХОД ДЛЯ УЧИТЕЛЯ</div>
            <h2 className="modal-title">Панель управления</h2>
            <form onSubmit={handleAdminLogin}>
              <div className="input-group">
                <label>КЛЮЧ ДОСТУПА</label>
                <input 
                  type="password" 
                  placeholder="Введите пароль..." 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="action-btn active" style={{ marginTop: '15px' }}>
                Войти в панель →
              </button>
            </form>
            <span className="hint-link" style={{ textAlign: 'center', marginTop: '15px' }} onClick={() => navigate('/')}>
              Вернуться к ученикам
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Основной рабочий интерфейс Админа
  return (
    <div className="kahoot-container" style={{ overflowY: 'auto', paddingBottom: '50px' }}>
      <header className="page-header">
        <div className="brand">⚙️ ПАНЕЛЬ УПРАВЛЕНИЯ КЛАССОМ</div>
        <div className="header-controls">
          <button className="top-toggle-btn" style={{ background: '#e03131' }} onClick={handleAdminLogout}>
            Выйти 🚪
          </button>
        </div>
      </header>

      <main className="main-content" style={{ display: 'block', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        <section style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h3>⚡ Быстрые действия</h3>
          <button className="top-toggle-btn" style={{ background: '#f59f00', width: '100%', padding: '12px', marginTop: '10px' }} onClick={handleResetLeaderboard}>
            ⚠️ Сбросить топ текущего урока (вручную)
          </button>
        </section>

        <section style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h3>📢 Активный вопрос на экранах:</h3>
          <div className="question-box" style={{ margin: '15px 0', borderLeft: '4px solid #3b5bdb', textAlign: 'left' }}>
            <strong>Вопрос:</strong> {currentQuestion.text} <br/>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>Ответ: {currentQuestion.correctAnswer}</span>
          </div>
        </section>

        <section style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h3>➕ Добавить новый вопрос</h3>
          <form onSubmit={handleAddQuestion} style={{ marginTop: '15px' }}>
            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label>ТЕКСТ ВОПРОСА</label>
              <input type="text" placeholder='Например: "2 + 2 * 2 = ?"' value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} />
            </div>
            <div className="input-group">
              <label>ОТВЕТ</label>
              <input type="text" placeholder='Например: "6"' value={newQuestionAnswer} onChange={(e) => setNewQuestionAnswer(e.target.value)} />
            </div>
            <button type="submit" className="action-btn active" style={{ marginTop: '15px', background: '#2b8a3e' }}>Сохранить в базу</button>
          </form>
        </section>

        <section>
          <h3>📚 Банк вопросов ({questionsList.length})</h3>
          <div className="leaderboard-list" style={{ marginTop: '15px', background: 'transparent' }}>
            {questionsList.map((q) => (
              <div key={q.id} className="leaderboard-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px', height: 'auto', gap: '10px', marginBottom: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{q.text}</div>
                  <div style={{ fontSize: '13px', color: '#40c057' }}>Ответ: {q.correctAnswer}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button onClick={() => handleSetActiveQuestion(q)} style={{ flex: 2, background: '#3b5bdb', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚀 Запустить на экран</button>
                  <button onClick={() => handleDeleteQuestion(q.id)} style={{ flex: 1, background: '#c92a2a', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>Удалить 🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}