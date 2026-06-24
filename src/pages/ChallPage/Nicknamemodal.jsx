import React from 'react';

export default function NicknameModal({ nickname, setNickname, onClose, onSave }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="close-btn" onClick={onClose}>×</button>
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
          onClick={onSave}
        >
          К вызову готов →
        </button>
      </div>
    </div>
  );
}