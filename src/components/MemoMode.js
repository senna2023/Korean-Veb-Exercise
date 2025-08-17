import React, { useState, useEffect, useCallback } from 'react';
function MemoMode({ vocabList, selectedVocabIds, onComplete }) {
  // 筛选出用户选择的单词
  const filteredVocabList = selectedVocabIds.length > 0
    ? vocabList.filter(vocab => selectedVocabIds.includes(vocab.id))
    : vocabList;

  // 使用state存储打乱后的单词列表，确保只在必要时重新计算
  const [shuffledVocabList, setShuffledVocabList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // 在组件挂载时初始化一次
  useEffect(() => {
    if (!initialized && filteredVocabList.length > 0) {
      setShuffledVocabList([...filteredVocabList].sort(() => Math.random() - 0.5));
      setInitialized(true);
    }
  }, [filteredVocabList, initialized]);

  // 防止currentIndex超出范围
  useEffect(() => {
    if (shuffledVocabList.length > 0 && currentIndex >= shuffledVocabList.length) {
      setCurrentIndex(0);
    }
  }, [shuffledVocabList, currentIndex]);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [wrongVocabs, setWrongVocabs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  // 检查是否有单词可默写
  useEffect(() => {
    if (shuffledVocabList.length === 0) {
      setError('没有可默写的单词，请先选择单词');
    } else {
      setError('');
    }
  }, [shuffledVocabList]);

  // 删除重复的useEffect
  

  const currentVocab = shuffledVocabList[currentIndex] || {};

  // 处理用户输入提交
  const handleSubmit = () => {
    const isInputCorrect = userInput.trim().toLowerCase() === currentVocab.korean.trim().toLowerCase();
    setIsCorrect(isInputCorrect);

    if (isInputCorrect) {
      setFeedback('正确！');
      setCorrectCount(prev => prev + 1);
    } else {
      setFeedback(`错误！正确答案：${currentVocab.korean}`);
      setIncorrectCount(prev => prev + 1);
      setWrongVocabs(prev => [...prev, currentVocab]);
    }
  };

  // 处理下一题
  const handleNextQuestion = () => {
    if (currentIndex >= shuffledVocabList.length - 1) {
      // 完成所有单词
      setIsComplete(true);
      onComplete(correctCount, incorrectCount, wrongVocabs);
    } else {
      // 下一题
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(null);
      setFeedback('');
    }
  };

  // 处理键盘事件
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isCorrect && !isComplete) {
      handleSubmit();
    }
  }, [isCorrect, isComplete, handleSubmit]);

  // 不再需要额外的memoizedHandleKeyDown变量

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isComplete) {
    return (
      <div className="memo-results">
        <h2>默写完成！</h2>
        <p>总单词数: {shuffledVocabList.length}</p>
        <p>正确: {correctCount}</p>
        <p>错误: {incorrectCount}</p>
        <p>正确率: {Math.round((correctCount / shuffledVocabList.length) * 100)}%</p>
        <button onClick={() => {
          setIsComplete(false);
          setCurrentIndex(0);
          setUserInput('');
          setIsCorrect(null);
          setFeedback('');
          setCorrectCount(0);
          setIncorrectCount(0);
          setWrongVocabs([]);
        }}>重新开始</button>
        <button onClick={() => onComplete(correctCount, incorrectCount, wrongVocabs)}>返回</button>
      </div>
    );
  }

  // 显示错误信息
  if (error) {
    return (
      <div className="memo-container">
        <div className="error-message">{error}</div>
        <button className="start-recite-btn" onClick={() => onComplete(0, 0, [])}>返回</button>
      </div>
    );
  }

  // 确保有单词可默写
  if (shuffledVocabList.length === 0) {
    return (
      <div className="memo-container">
        <div className="error-message">没有可默写的单词，请先选择单词</div>
        <button className="start-recite-btn" onClick={() => onComplete(0, 0, [])}>返回</button>
      </div>
    );
  }

  return (
    <div className="memo-container">
      <div className="memo-header">
        <div>第 {currentIndex + 1}/{shuffledVocabList.length} 题</div>
      </div>
      <div className="memo-card">
        <div className="chinese-word">{currentVocab.chinese}</div>

        <div className="memo-input-container">
          <input
            type="text"
            className="memo-input"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
            }}
            placeholder="请输入韩语单词..."
            disabled={isCorrect !== null}
            autoFocus
          />
          <button
            className="start-recite-btn"
            onClick={handleSubmit}
            disabled={isCorrect !== null}
          >
            提交
          </button>
          <button
            className="start-recite-btn next-question-btn"
            onClick={handleNextQuestion}
            disabled={isComplete || error || shuffledVocabList.length === 0}
          >
            下一题
          </button>
        </div>

        {feedback && (
          <div className={`memo-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemoMode;