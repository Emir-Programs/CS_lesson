import { RESET_SLOTS, NEARBY_RADIUS } from './constants';

export function getBishkekNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bishkek' }));
}

export function getResetMarker(now) {
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

export function addScoreToList(list, name, points) {
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

export function getNearbySlice(list, name, radius = NEARBY_RADIUS) {
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