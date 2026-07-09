import React from 'react';

export default function SuccessScreen({ currentQuestion, answer, stats, percentCorrect }) {
  return (
    <div className="success-screen">
      <div className="success-meta">ОТВЕТ ПРИНЯТ</div>
      <h1 className="result-text">
        {currentQuestion.text} = <span className="highlight">{answer}</span>
      </h1>
      <p className="sub-result-text">Очки зачислены в таблицу лидеров!</p>
      {stats.total > 0 && (
        <p className="sub-result-text">
          Твоя точность: {percentCorrect}% ({stats.correct}/{stats.total})
        </p>
      )}
    </div>
  );
}