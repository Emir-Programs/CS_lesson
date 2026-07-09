import React from 'react';

export default function EmptyThrone({ stats, percentCorrect, leaderboardView, setLeaderboardView, nearbyTop, nickname }) {
  return (
    <div className="empty-throne">
     
      {stats.total > 0 && (
        <div className="accuracy-badge">
          <h1 className="accuracy-badge__title">Правильных ответов:</h1>
          <h1 className='accuracy-badge__value' >{percentCorrect}% ({stats.correct}/{stats.total})</h1>
        </div>
      )}


    <div className="leaderboard-screen">
      <h2 className="leaderboard-title">Топ</h2>
      
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
          <div className="leaderboard-empty">Пока никто не отвечал </div>
        )}
        {nearbyTop.map((player) => (
          <div
            key={player.name}
            className={`leaderboard-item rank-${player.rank} ${player.name === nickname.trim() ? 'is-me' : 'dfga'}`}
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