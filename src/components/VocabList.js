import React from 'react';

function VocabList({ vocabList, onDelete, updateFamiliarity }) {
  return (
    <table className="vocab-list">
      <thead>
        <tr>
          <th>韩语单词</th>
          <th>发音</th>
          <th>中文释义</th>
          <th>熟悉度</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {vocabList.map((vocab, index) => (
          <tr key={vocab.id}>
            <td>{vocab.korean}</td>
            <td>{vocab.pronunciation ? `[${vocab.pronunciation}]` : '-'}</td>
            <td>{vocab.chinese}</td>
            <td>
              <div className="familiarity-rating">
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    className={vocab.familiarity === value ? 'active' : ''}
                    onClick={() => updateFamiliarity(index, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </td>
            <td>
              <div className="list-actions">
                <button className="delete-btn" onClick={() => onDelete(vocab.id)}>
                  删除
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default VocabList;