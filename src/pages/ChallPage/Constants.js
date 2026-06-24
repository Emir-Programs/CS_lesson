import { db } from '../../firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';

export const START_HOUR = 8;
export const START_MINUTE = 15;
export const INTERVAL_MINUTES = 45;
export const SLOTS_COUNT = 10;

export const RESET_SLOTS = Array.from({ length: SLOTS_COUNT }, (_, i) => {
  const totalMinutes = START_HOUR * 60 + START_MINUTE + i * INTERVAL_MINUTES;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return h * 60 + m;
});

export const LOCAL_STORAGE_CLEAR_INTERVAL_MS = 20 * 60 * 1000;
export const NEARBY_RADIUS = 2;

export const LESSON_DOC = doc(db, 'leaderboard', 'lesson');
export const ALL_TIME_DOC = doc(db, 'leaderboard', 'allTime');
export const RESET_META_DOC = doc(db, 'meta', 'reset');
export const QUESTIONS_COLLECTION = collection(db, 'questions');
export const LATEST_QUESTION_QUERY = query(QUESTIONS_COLLECTION, orderBy('createdAt', 'desc'), limit(1));