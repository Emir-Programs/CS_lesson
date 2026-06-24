import { useState, useEffect } from 'react';
import { LOCAL_STORAGE_CLEAR_INTERVAL_MS } from './constants';

export function usePlayerLocalState(currentQuestionId, step, setStep) {
  const [nickname, setNickname] = useState(() => localStorage.getItem('nickname') || '');
  const [answer, setAnswer] = useState('');
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  const [stats, setStats] = useState(() => {
    const total = parseInt(localStorage.getItem('stats_total') || '0', 10);
    const correct = parseInt(localStorage.getItem('stats_correct') || '0', 10);
    return { total, correct };
  });

  useEffect(() => {
    if (!currentQuestionId) return;

    const answeredStatus = localStorage.getItem(`answered_${currentQuestionId}`);
    const hasAnswered = !!answeredStatus;

    setHasAnsweredCurrent(hasAnswered);

    if (hasAnswered) {
      setAnswer(localStorage.getItem(`last_answer_${currentQuestionId}`) || '');
      if (step !== 'success') {
        setStep('success');
      }
    } else {
      setAnswer('');
      if (step === 'success') {
        setStep('empty');
      }
    }
  }, [currentQuestionId]);

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

  const saveNickname = (value) => {
    if (value.trim()) {
      localStorage.setItem('nickname', value.trim());
    }
  };

  const recordAnswer = (questionId, trimmedAnswer, isCorrect) => {
    localStorage.setItem(`answered_${questionId}`, 'true');
    localStorage.setItem(`last_answer_${questionId}`, trimmedAnswer);

    const newTotal = stats.total + 1;
    const newCorrect = stats.correct + (isCorrect ? 1 : 0);
    localStorage.setItem('stats_total', String(newTotal));
    localStorage.setItem('stats_correct', String(newCorrect));
    setStats({ total: newTotal, correct: newCorrect });
    setHasAnsweredCurrent(true);
  };

  return {
    nickname,
    setNickname,
    answer,
    setAnswer,
    hasAnsweredCurrent,
    stats,
    saveNickname,
    recordAnswer
  };
}