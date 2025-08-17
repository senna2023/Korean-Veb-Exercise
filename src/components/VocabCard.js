import React from 'react';

function VocabCard({ vocab, showDefinition, toggleDefinition, updateFamiliarity, onDelete }) {
  return (
    <div className="card-container">
      <div className={`vocab-card ${showDefinition ? 'flipped' : ''}`}>
        <div className="card-front">
          <div className="korean-word">{vocab.korean}</div>
          {vocab.pronunciation && (
            <div className="pronunciation">[{vocab.pronunciation}]</div>
          )}
          <button className="flip-btn" onClick={toggleDefinition}>
            查看释义
          </button>
        </div>
        <div className="card-back">
          <div className="korean-word">{vocab.korean}</div>
          {vocab.pronunciation && (
            <div className="pronunciation">[{vocab.pronunciation}]</div>
          )}
          <div className="chinese-meaning">{vocab.chinese}</div>
          {vocab.example && (
            <div className="example">
              <strong>例句:</strong> {vocab.example}
            </div>
          )}
          <div className="familiarity-rating">
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                className={vocab.familiarity === value ? 'active' : ''}
                onClick={() => updateFamiliarity(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="card-actions">
            <button className="flip-btn" onClick={toggleDefinition}>
              返回
            </button>
            <button className="delete-btn" onClick={onDelete}>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VocabCard;