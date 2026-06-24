import React from 'react';

export default function EmptyThrone({ stats, percentCorrect, leaderboardView, setLeaderboardView, nearbyTop, nickname }) {
  return (
    <div className="empty-throne">
      <div className="crown-icon">👑</div>
      <h2>Начни покарять топы</h2>
      <p>Кто готов принять вызов?</p>
      {stats.total > 0 && (
        <div className="accuracy-badge">
          ✅ Правильных ответов: {percentCorrect}% ({stats.correct}/{stats.total})
        </div>
      )}
      <div className="dots-indicator">•••••</div>
      import React from 'react';


    <div className="leaderboard-screen">
      <h2 className="leaderboard-title">Топ</h2>

      <div className="leaderboard-list">
        {nearbyTop.length === 0 && (
          <div className="leaderboard-empty">Пока никто не отвечал </div>
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
 
    </div>
  );
}