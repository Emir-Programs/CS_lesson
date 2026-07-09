import React, { useState } from 'react';
import './ChallengePage.scss';

import { useLeaderboards } from './useLeaderboards';
import { usePlayerLocalState } from './Useplayerlocalstate.js';
import { getNearbySlice, getTopsFive} from './utils';

import EmptyThrone from './EmptyThrone';
import SuccessScreen from './SuccessScreen';
import LeaderboardScreen from './Leaderboardscreen.jsx';
import NicknameModal from './NicknameModal';
import QuestionModal from './QuestionModal';
import { Navigate, useNavigate } from 'react-router-dom';

export default function ChallengePage() {
  const [step, setStep] = useState('empty');
  const [leaderboardView, setLeaderboardView] = useState('lesson');

  const { lessonTop, allTimeTop, currentQuestion, registerScore } = useLeaderboards();

  const {
    nickname,
    setNickname,
    answer,
    setAnswer,
    hasAnsweredCurrent,
    stats,
    saveNickname,
    recordAnswer
  } = usePlayerLocalState(currentQuestion.id, step, setStep);

  const handleStartChallenge = () => {
    if (nickname.trim()) {
      setStep('question');
    } else {
      setStep('nickname');
    }
  };

  const handleSaveNickname = () => {
    if (nickname.trim()) {
      saveNickname(nickname);
      setStep('question');
    }
  };

  const handleSubmitAnswer = () => {
    const trimmedAnswer = answer.trim();
    const isCorrect = trimmedAnswer.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    registerScore(nickname.trim(), isCorrect ? 100 : 10);
    recordAnswer(currentQuestion.id, trimmedAnswer, isCorrect);

    setStep('success');
  };

  const resetFlow = () => {
    setStep('empty');
    setAnswer('');
  };

  const currentTop = leaderboardView === 'lesson' ? lessonTop : allTimeTop;
  const nearbyTop = getNearbySlice(currentTop, nickname.trim());
  const percentCorrect = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const top = getTopsFive(currentTop, nickname.trim());
  let navigate = useNavigate()
  return (
    <div className="kahoot-container">
      <div className="grid-overlay" />

      <header className="page-header">
        <div className="brand">
          {nickname}
        </div>
        <div className="header-controls">
          <button className="top-toggle-btn" onClick={() => setStep('leaderboard')}>
            🏆 ТОП ИГРОКОВ
          </button>
          <button className='top-toggle-btn' onClick={() => navigate('/admin')}>
            Админка
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
            <EmptyThrone 
            stats={stats} 
            percentCorrect={percentCorrect} 
            leaderboardView={leaderboardView}
            setLeaderboardView={setLeaderboardView}
            nearbyTop={nearbyTop}
            nickname={nickname} />
          )}

          {step === 'success' && (
            <SuccessScreen
              currentQuestion={currentQuestion}
              answer={answer}
              stats={stats}
              percentCorrect={percentCorrect}
            />
          )}

          {step === 'leaderboard' && (
            <LeaderboardScreen
              leaderboardView={leaderboardView}
              setLeaderboardView={setLeaderboardView}
              nearbyTop={top}
              nickname={nickname}
            />
          )}

          {step === 'nickname' && (
            <NicknameModal
              nickname={nickname}
              setNickname={setNickname}
              onClose={() => setStep('empty')}
              onSave={handleSaveNickname}
            />
          )}

          {step === 'question' && (
            <QuestionModal
              currentQuestion={currentQuestion}
              hasAnsweredCurrent={hasAnsweredCurrent}
              answer={answer}
              setAnswer={setAnswer}
              onClose={() => setStep('empty')}
              onSubmit={handleSubmitAnswer}
            />
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