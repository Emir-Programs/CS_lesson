import { useState, useEffect } from 'react';
import { onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  LESSON_DOC,
  ALL_TIME_DOC,
  RESET_META_DOC,
  LATEST_QUESTION_QUERY
} from './constants';
import { getBishkekNow, getResetMarker, addScoreToList } from './utils';

export function useLeaderboards() {
  const [lessonTop, setLessonTop] = useState([]);
  const [allTimeTop, setAllTimeTop] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({ id: '', text: 'Загрузка...', correctAnswer: '' });

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

  return { lessonTop, allTimeTop, currentQuestion, registerScore };
}