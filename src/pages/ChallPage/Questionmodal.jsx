import React from 'react';

export default function QuestionModal({
  currentQuestion,
  hasAnsweredCurrent,
  answer,
  setAnswer,
  onClose,
  onSubmit
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="close-btn" onClick={onClose}>×</button>
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
              onClick={onSubmit}
            >
              Отправить ответ ⚡
            </button>
          </>
        )}
      </div>
    </div>
  );
}