import React from 'react';
import './WrongVocabList.css';

function WrongVocabList({ wrongVocabList, onRemove, onClear, onViewData, onShowAll }) {
  // 如果错题本为空，显示提示信息
  if (wrongVocabList.length === 0) {
    return (
      <div className="wrong-vocab-container">
        <h2>错题本</h2>
        <div className="empty-message">
          暂无错题记录
        </div>
      </div>
    );
  }

  return (
    <div className="wrong-vocab-container">
      <div className="wrong-vocab-header">
        <h2>错题本</h2>
        <div className="wrong-vocab-info">
          错题本单词数量: {wrongVocabList.length}
          <button onClick={onViewData} className="info-button">
            查看错题本数据
          </button>
          <button onClick={onShowAll} className="info-button">
            显示全部错题
          </button>
        </div>
        <button className="clear-btn" onClick={onClear}>
          清空错题本
        </button>
      </div>

      <div className="wrong-vocab-list">
        <table>
          <thead>
            <tr>
              <th>韩语</th>
              <th>中文</th>
              <th>发音</th>
              <th>错误次数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {wrongVocabList.map((vocab) => (
              <tr key={vocab.id} className="vocab-item">
                <td className="korean-word">{vocab.korean}</td>
                <td className="chinese-meaning">{vocab.chinese}</td>
                <td className="pronunciation">{vocab.pronunciation || '-'}</td>
                <td className="wrong-count">{vocab.wrongCount}</td>
                <td className="actions">
                  <button
                    className="remove-btn"
                    onClick={() => onRemove(vocab.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WrongVocabList;