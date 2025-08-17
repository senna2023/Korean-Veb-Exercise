import React, { useState, useEffect } from 'react';

function CustomMode({ vocabList, selectedVocabIds, onComplete, autoNextQuestion = false }) {
  const [reciteList, setReciteList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [wrongVocabs, setWrongVocabs] = useState([]); // 存储错误单词

  // 播放正确语音提示
  const playCorrectSound = () => {
    // 检查浏览器是否支持语音合成API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('正确');
      utterance.lang = 'zh-CN'; // 设置语言为中文
      utterance.volume = 1; // 设置音量
      window.speechSynthesis.speak(utterance);
    }
  };

  // 播放错误语音提示
  const playIncorrectSound = () => {
    // 检查浏览器是否支持语音合成API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('错误');
      utterance.lang = 'zh-CN'; // 设置语言为中文
      utterance.volume = 1; // 设置音量
      window.speechSynthesis.speak(utterance);
    }
  };

  // 根据选中的单词ID筛选单词
  useEffect(() => {
    if (!selectedVocabIds || selectedVocabIds.length === 0) {
      setReciteList([]);
      return;
    }

    // 根据ID筛选单词
    const filteredVocab = vocabList.filter(vocab => selectedVocabIds.includes(vocab.id));

    // 随机排序选中的单词
    const shuffled = [...filteredVocab].sort(() => 0.5 - Math.random());
    setReciteList(shuffled);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
  }, [vocabList, selectedVocabIds]);

  // 生成选项
  useEffect(() => {
    if (reciteList.length === 0 || currentIndex >= reciteList.length) return;

    const currentVocab = reciteList[currentIndex];
    // 收集所有可能的干扰项
    const allMeanings = vocabList.map(vocab => vocab.chinese || '无中文');
    // 过滤掉当前单词的释义
    let otherMeanings = allMeanings.filter(meaning => meaning !== currentVocab.chinese && meaning.trim() !== '无中文');

    // 确保至少有3个干扰项
    if (otherMeanings.length < 3) {
      // 如果不够，从所有释义中随机选择（包括当前单词的）
      const additionalDistractors = [...allMeanings]
        .sort(() => 0.5 - Math.random())
        .filter(meaning => !otherMeanings.includes(meaning) && meaning.trim() !== '无中文');
      otherMeanings = [...otherMeanings, ...additionalDistractors];

      // 如果还是不够，使用一些默认的干扰项
      if (otherMeanings.length < 3) {
        const defaultDistractors = ['错误选项1', '错误选项2', '错误选项3', '错误选项4'];
        otherMeanings = [...otherMeanings, ...defaultDistractors];
      }
    }

    // 随机选择3个干扰项
    const shuffledOthers = [...otherMeanings].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3).map(meaning => meaning || '无中文');
    // 合并正确答案和干扰项
    const allOptions = [currentVocab.chinese || '无中文', ...distractors];
    // 打乱选项顺序
    const shuffledOptions = allOptions.sort(() => 0.5 - Math.random());
    setOptions(shuffledOptions);
    setSelectedOption(null);
    setShowResult(false);
  }, [reciteList, currentIndex, vocabList]);

  // 处理选项选择
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowResult(true);

    const currentVocab = reciteList[currentIndex];
    if (option === currentVocab.chinese) {
      setCorrectCount(prevCount => prevCount + 1);
      // 播放正确语音提示
      playCorrectSound();

      // 如果启用了自动跳到下一题，则在短暂延迟后自动跳转
      if (autoNextQuestion) {
        setTimeout(() => {
          handleNext();
        }, 1000); // 1秒后自动跳转
      }
    } else {
      setIncorrectCount(prevCount => prevCount + 1);
      // 播放错误语音提示
      playIncorrectSound();
      // 添加到错误单词列表
      // 创建一个新对象，确保包含id属性
      const vocabToAdd = {...currentVocab};
      if (!vocabToAdd.id) {
        vocabToAdd.id = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
      setWrongVocabs(prev => [...prev, vocabToAdd]);
    }
  };

  // 下一题
  const handleNext = () => {
    if (currentIndex + 1 < reciteList.length) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      // 完成背诵
      onComplete(correctCount, incorrectCount, wrongVocabs);
    }
  };

  if (reciteList.length === 0) {
    return <div className="loading">请先选择要背诵的单词</div>;
  }

  const currentVocab = reciteList[currentIndex];

  return (
    <div className="recite-container">
      <div className="recite-header">
        <h2>自定义模式</h2>
        <p>进度: {currentIndex + 1}/{reciteList.length}</p>
      </div>

      <div className="vocab-card">
        <div className="korean-word">{currentVocab.korean}</div>
        {currentVocab.pronunciation && (
          <div className="pronunciation">[{currentVocab.pronunciation}]</div>
        )}
        {currentVocab.example && (
          <div className="example">
            <strong>例句:</strong> {currentVocab.example}
          </div>
        )}
      </div>

      <div className="options-container">
        {options.map((option, index) => (
          <button
            key={index}
            className={`option-btn ${selectedOption === option ? (showResult ? (option === currentVocab.chinese ? 'correct' : 'incorrect') : 'selected') : ''}`}
            onClick={() => !showResult && handleOptionSelect(option)}
            disabled={showResult}
          >
            {String.fromCharCode(65 + index)}. {option}
          </button>
        ))}
      </div>

      {showResult && (
        <div className="result-feedback">
          {selectedOption === currentVocab.chinese ? (
            <p className="correct">正确!</p>
          ) : (
            <p className="incorrect">错误! 正确答案是: {currentVocab.chinese}</p>
          )}
        </div>
      )}

      <div className="navigation-buttons">
        <button onClick={handleNext} disabled={!showResult}>
          {currentIndex + 1 < reciteList.length ? '下一题' : '完成'}
        </button>
      </div>
    </div>
  );
}

export default CustomMode;