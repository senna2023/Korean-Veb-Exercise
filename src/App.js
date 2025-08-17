import React, { useState, useEffect, useRef } from 'react';
import WrongVocabList from './components/WrongVocabList'; // 导入错题本组件
import './App.css';
import ReciteMode from './components/ReciteMode';
import CustomMode from './components/CustomMode';
import MemoMode from './components/MemoMode';
import presetVocab from './data/presetVocab'; // 内置单词本
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

function App() {
  const [userVocabList, setUserVocabList] = useState([]); // 用户上传的单词本
  const [studyMode, setStudyMode] = useState('recite'); // 'recite', 'custom', 'wrongList', or 'memo'
  // 内置单词本 - 直接使用预设数据
  const builtInVocabList = presetVocab;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null
  const [uploadMessage, setUploadMessage] = useState('');
  const [wrongVocabList, setWrongVocabList] = useState([]); // 错题本
  const [reciteDifficulty, setReciteDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'
  const [reciteCount, setReciteCount] = useState(10);
  const [showReciteSettings, setShowReciteSettings] = useState(false);
  const [reciteResults, setReciteResults] = useState(null);
  const [selectedVocabIds, setSelectedVocabIds] = useState([]);
  const [showCustomSelection, setShowCustomSelection] = useState(false);
  const [showReciteInterface, setShowReciteInterface] = useState(false); // 控制是否显示背诵界面
  const [showMemoSettings, setShowMemoSettings] = useState(false); // 控制是否显示默写设置界面
  const [showMemoInterface, setShowMemoInterface] = useState(false); // 控制是否显示默写界面
  const [memoResults, setMemoResults] = useState(null); // 默写结果
  const [showBuiltInVocab, setShowBuiltInVocab] = useState(false); // 控制是否显示内置单词列表
  const [showUserVocab, setShowUserVocab] = useState(false); // 控制是否显示用户单词列表
  const [autoNextQuestion, setAutoNextQuestion] = useState(false); // 控制是否自动跳到下一题
  const [showSettings, setShowSettings] = useState(false); // 控制设置菜单的显示和隐藏
  const settingsRef = useRef(null); // 用于设置菜单的引用

  // 初始化用户单词表 - 优先使用localStorage中的数据
  useEffect(() => {
    try {
      console.log('Initializing app data...');
      // 初始化用户单词表
      const savedVocab = localStorage.getItem('koreanUserVocabList');
      if (savedVocab) {
        setUserVocabList(JSON.parse(savedVocab));
        console.log('Loaded user vocab list from localStorage, count:', JSON.parse(savedVocab).length);
      } else {
        setUserVocabList([]);
        console.log('No user vocab list in localStorage');
      }

      // 初始化错题本
      const savedWrongVocab = localStorage.getItem('koreanWrongVocabList');
      if (savedWrongVocab) {
        const parsedWrongVocab = JSON.parse(savedWrongVocab);
        setWrongVocabList(parsedWrongVocab);
        console.log('Loaded wrong vocab list from localStorage, count:', parsedWrongVocab.length);
        console.log('Wrong vocab list:', parsedWrongVocab);
      } else {
        setWrongVocabList([]);
        console.log('No wrong vocab list in localStorage');
      }
    } catch (e) {
      setError('读取数据失败: ' + e.message);
      console.error('Error loading data:', e);
      setUserVocabList([]);
      setWrongVocabList([]);
    }
  }, []);

  // 保存用户单词表到localStorage
  useEffect(() => {
    try {
      console.log('Saving user vocab list to localStorage, count:', userVocabList.length);
      localStorage.setItem('koreanUserVocabList', JSON.stringify(userVocabList));
    } catch (e) {
      setError('保存单词表失败: ' + e.message);
      console.error('Error saving user vocab list:', e);
    }
  }, [userVocabList]);

  // 保存错题本到localStorage
  useEffect(() => {
    try {
      console.log('Saving wrong vocab list to localStorage, count:', wrongVocabList.length);
      console.log('Wrong vocab list content:', JSON.stringify(wrongVocabList));
      localStorage.setItem('koreanWrongVocabList', JSON.stringify(wrongVocabList));
      // 立即验证保存的数据
      const savedData = localStorage.getItem('koreanWrongVocabList');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Verified saved wrong vocab list, count:', parsedData.length);
      } else {
        console.warn('Failed to verify saved wrong vocab list: data not found');
      }
    } catch (e) {
      setError('保存错题本失败: ' + e.message);
      console.error('Error saving wrong vocab list:', e);
    }
  }, [wrongVocabList]);

  // 监听错题本变化并记录日志
  useEffect(() => {
    console.log('Wrong vocab list updated, current count:', wrongVocabList.length);
    console.log('Current wrong vocab list:', wrongVocabList);
  }, [wrongVocabList]);

  // 添加新单词
  const addVocab = (korean, chinese, pronunciation, example = '') => {
    const newVocab = {
      id: uuidv4(),
      korean,
      chinese,
      pronunciation,
      example,
      familiarity: 0,
      difficulty: '未分类',
      source: 'manual', // 标记为手动添加的单词
      wrongCount: 0 // 错误次数
    };

    setUserVocabList([...userVocabList, newVocab]);
  };

  // 处理Excel上传
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // 处理Excel数据 - 增强版支持多种格式
          console.log('Excel原始数据:', jsonData);
          // 改进Excel解析逻辑，避免将例句识别为单词
          const newVocabList = [];
          let lastValidWord = null;

          jsonData.forEach((item, index) => {
            let korean = '';
            let chinese = '';
            let example = '';

            // 尝试多种方式提取数据
            // 1. 检查是否有标题行(韩语/中文/例句)
            if (item['韩语'] !== undefined) {
              korean = item['韩语'] || '';
              chinese = item['中文'] || '';
              example = item['例句'] || '';
            } 
            // 2. 检查是否有英文标题(Korean/Chinese/Example)
            else if (item['Korean'] !== undefined) {
              korean = item['Korean'] || '';
              chinese = item['Chinese'] || '';
              example = item['Example'] || '';
            }
            // 3. 检查是否有列字母(A/B/C)
            else if (item['A'] !== undefined) {
              korean = item['A'] || item['a'] || '';
              chinese = item['B'] || item['b'] || '';
              example = item['C'] || item['c'] || '';
            }
            // 4. 检查是否有列索引(0/1/2)
            else if (item[0] !== undefined) {
              korean = item[0] || '';
              chinese = item[1] || '';
              example = item[2] || '';
            }
            // 5. 尝试其他可能的键名
            else {
              // 获取所有键并尝试第一个和第二个作为韩语和中文
              const keys = Object.keys(item);
              if (keys.length >= 1) korean = item[keys[0]] || '';
              if (keys.length >= 2) chinese = item[keys[1]] || '';
              if (keys.length >= 3) example = item[keys[2]] || '';
            }

            // 处理数据行
            const isWordRow = korean.trim() && chinese.trim();
            const isExampleRow = !korean.trim() && !chinese.trim() && example.trim();

            if (isWordRow) {
              // 这是一个单词行
              const newWord = {
                id: uuidv4(),
                korean: korean.trim(),
                chinese: chinese.trim(),
                pronunciation: '',
                example: example.trim(),
                familiarity: 0,
                difficulty: '未分类',
                source: 'upload' // 标记为上传的单词
              };
              newVocabList.push(newWord);
              lastValidWord = newWord;
              console.log('解析后的单词:', newWord);
            } else if (isExampleRow && lastValidWord) {
              // 这是一个例句行，关联到上一个单词
              lastValidWord.example += (lastValidWord.example ? '\n' : '') + example.trim();
              console.log('关联例句到单词:', lastValidWord.korean, '例句:', example.trim());
            } else if (!korean.trim() && !chinese.trim() && !example.trim()) {
              // 空行，跳过
              console.log('跳过空行');
            } else {
              // 无法识别的行，记录日志
              console.log('无法识别的行:', index, item);
            }
          });

          console.log('成功解析的单词数量:', newVocabList.length);

          console.log('成功解析的单词数量:', newVocabList.length);

        // 添加新单词到用户单词表
        setUserVocabList([...userVocabList, ...newVocabList]);
        setError(null);
        setUploadStatus('success');
        setUploadMessage(`上传成功！已添加 ${newVocabList.length} 个单词到自定义单词本`);
        
        // 3秒后清除上传状态
        setTimeout(() => {
          setUploadStatus(null);
          setUploadMessage('');
        }, 3000);
      } catch (err) {
        setError('上传失败: ' + err.message);
        setUploadStatus('error');
        setUploadMessage('上传失败: ' + err.message);
        
        // 3秒后清除上传状态
        setTimeout(() => {
          setUploadStatus(null);
          setUploadMessage('');
        }, 3000);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 添加通知状态
  const [notification, setNotification] = useState('');

  // 删除单词 - 仅在自定义模式下可用
const deleteVocab = (id) => {
    // 过滤掉要删除的单词
    const updatedList = userVocabList.filter(vocab => vocab.id !== id);
    setUserVocabList(updatedList);
    setNotification(`已删除单词`);
    
    // 3秒后清除通知
    setTimeout(() => {
      setNotification('');
    }, 3000);
};

  // 开始背诵
  const startRecite = () => {
    if (builtInVocabList.length === 0) {
      setError('内置单词表为空');
      return;
    }
    // 重置背诵结果，确保开始新的背诵
    setReciteResults(null);
    setShowReciteInterface(true);
  };

  // 添加错误单词到错题本
  const addToWrongVocabList = (vocab) => {
    console.log('Adding to wrong vocab list:', vocab);
    // 确保vocab有唯一id属性
    const vocabWithId = {...vocab};
    if (!vocabWithId.id) {
      vocabWithId.id = uuidv4(); // 使用UUID生成唯一临时id
      console.log('Generated unique temporary id:', vocabWithId.id);
    }
    
    // 使用函数式更新确保基于最新状态
    setWrongVocabList(prevList => {
      // 检查单词是否已在最新状态的错题本中
      const existingIndex = prevList.findIndex(item => item.id === vocabWithId.id);
      console.log('Existing index in latest wrong vocab list:', existingIndex);
      
      if (existingIndex >= 0) {
        // 如果已存在，增加错误次数
        const updatedList = [...prevList];
        updatedList[existingIndex].wrongCount = (updatedList[existingIndex].wrongCount || 0) + 1;
        console.log('Vocab already exists, incrementing wrong count:', updatedList[existingIndex]);
        return updatedList;
      } else {
        // 如果不存在，添加到错题本
        const newVocab = {...vocabWithId, wrongCount: 1};
        console.log('Adding new vocab to wrong list:', newVocab);
        return [...prevList, newVocab];
      }
    });
    
    // 显示通知（假设setNotification已定义或添加此函数）
    const notificationText = '已添加到错题本';
    console.log(notificationText);
    // 如果setNotification函数不存在，可以添加以下实现
    // setNotification(notificationText);
    // setTimeout(() => setNotification(''), 3000);
  };

    // 注意：这里不再直接访问wrongVocabList.length，因为状态更新是异步的
    // 如需记录更新后的数量，可以在useEffect中监听wrongVocabList的变化

  // 从错题本中移除单词
  const removeFromWrongVocabList = (id) => {
    const updatedList = wrongVocabList.filter(vocab => vocab.id !== id);
    setWrongVocabList(updatedList);
  };

  // 清空错题本
  const clearWrongVocabList = () => {
    console.log('Clearing wrong vocab list');
    setWrongVocabList([]);
  };

  // 调试函数：检查并记录localStorage中的错题数据
  const debugWrongVocabList = () => {
    try {
      // 检查内存中的状态
      console.log('内存中的错题数据:', wrongVocabList);
      console.log('内存中的错题数量:', wrongVocabList.length);

      // 检查localStorage中的数据
      const storedData = localStorage.getItem('koreanWrongVocabList');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('localStorage中的错题数据:', parsedData);
        console.log('localStorage中的错题数量:', parsedData.length);
        alert(`内存中的错题数量: ${wrongVocabList.length}\nlocalStorage中的错题数量: ${parsedData.length}\n\n内存中的数据:\n${JSON.stringify(wrongVocabList, null, 2)}\n\nlocalStorage中的数据:\n${JSON.stringify(parsedData, null, 2)}`);
      } else {
        console.log('localStorage中没有错题数据');
        alert(`内存中的错题数量: ${wrongVocabList.length}\nlocalStorage中没有错题数据`);
      }
    } catch (e) {
      console.error('读取错题数据时出错:', e);
      alert('读取错题数据时出错: ' + e.message);
    }
  }

  // 高级调试函数：追踪状态更新和存储
  const advancedDebug = () => {
    console.log('======== 高级调试信息 ========');
    console.log('当前组件状态:');
    console.log('- wrongVocabList长度:', wrongVocabList.length);
    console.log('- wrongVocabList内容:', wrongVocabList);
    console.log('- 当前模式:', studyMode);
    
    // 检查localStorage
    const storedData = localStorage.getItem('koreanWrongVocabList');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log('localStorage数据:');
      console.log('- 长度:', parsedData.length);
      console.log('- 内容:', parsedData);
    } else {
      console.log('localStorage中没有错题数据');
    }
    
    // 检查是否有重复的id
    const ids = wrongVocabList.map(item => item.id);
    const hasDuplicates = new Set(ids).size !== ids.length;
    console.log('错题本中是否有重复的id:', hasDuplicates);
    if (hasDuplicates) {
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('重复的id:', duplicateIds);
    }
    
    console.log('======== 调试结束 ========');
    alert('高级调试信息已输出到控制台，请查看浏览器开发者工具');
  };

  // 在组件挂载时调用调试函数
  useEffect(() => {
    debugWrongVocabList();
  }, []);

  // 处理背诵完成
  const handleReciteComplete = (correct, incorrect, wrongVocabs) => {
    setReciteResults({
      correct,
      incorrect,
      total: correct + incorrect,
      accuracy: Math.round((correct / (correct + incorrect)) * 100)
    });

    // 将错误单词添加到错题本
    console.log('Handling recite complete, wrong vocabs count:', wrongVocabs ? wrongVocabs.length : 0);
    if (wrongVocabs && wrongVocabs.length > 0) {
      console.log('Wrong vocabs list:', wrongVocabs);
      console.log('Starting to add wrong vocabs to wrong list...');
      wrongVocabs.forEach((vocab, index) => {
        console.log(`Processing wrong vocab ${index + 1}/${wrongVocabs.length}:`, vocab);
        addToWrongVocabList(vocab);
      });
      console.log('Finished adding wrong vocabs to wrong list');
    } else {
      console.log('No wrong vocabs to add');
    }
  };

  // 重置背诵结果
  const resetRecite = () => {
    setReciteResults(null);
    // 保持在背诵模式
  };

  // 切换单词选择状态
  const toggleVocabSelection = (id) => {
    if (selectedVocabIds.includes(id)) {
      setSelectedVocabIds(selectedVocabIds.filter(vocabId => vocabId !== id));
    } else {
      setSelectedVocabIds([...selectedVocabIds, id]);
    }
  };

  // 开始自定义背诵
  const startCustomRecite = () => {
    if (selectedVocabIds.length === 0) {
      setError('请先选择单词');
      return;
    }
    setShowCustomSelection(false);
    setReciteResults(null);
    setShowReciteInterface(true); // 显示背诵界面
  };

  // 开始默写
  const startMemoRecite = () => {
    if (selectedVocabIds.length === 0) {
      setError('请先选择单词');
      return;
    }
    setShowCustomSelection(false);
    setMemoResults(null);
    setShowMemoInterface(true); // 显示默写界面
  };

  // 重置自定义选择
  const resetCustomSelection = () => {
    setSelectedVocabIds([]);
  };

  // 处理自定义背诵完成
  const handleCustomComplete = (correct, incorrect, wrongVocabs) => {
    setReciteResults({
      correct,
      incorrect,
      total: correct + incorrect,
      accuracy: Math.round((correct / (correct + incorrect)) * 100)
    });

    // 将错误单词添加到错题本
    console.log('Handling custom complete, wrong vocabs count:', wrongVocabs ? wrongVocabs.length : 0);
    if (wrongVocabs && wrongVocabs.length > 0) {
      console.log('Wrong vocabs list:', wrongVocabs);
      console.log('Starting to add wrong vocabs to wrong list...');
      wrongVocabs.forEach((vocab, index) => {
        console.log(`Processing wrong vocab ${index + 1}/${wrongVocabs.length}:`, vocab);
        addToWrongVocabList(vocab);
        console.log(`After adding vocab ${index + 1}, current wrongVocabList length:`, wrongVocabList.length);
      });
      console.log('Finished adding wrong vocabs to wrong list. Final wrongVocabList length:', wrongVocabList.length);
    } else {
      console.log('No wrong vocabs to add');
    }
  };

  // 处理默写完成
  const handleMemoComplete = (correct, incorrect, wrongVocabs) => {
    setMemoResults({
      correct,
      incorrect,
      total: correct + incorrect,
      accuracy: Math.round((correct / (correct + incorrect)) * 100)
    });

    // 将错误单词添加到错题本
    console.log('Handling memo complete, wrong vocabs count:', wrongVocabs ? wrongVocabs.length : 0);
    if (wrongVocabs && wrongVocabs.length > 0) {
      console.log('Wrong vocabs list:', wrongVocabs);
      wrongVocabs.forEach((vocab) => {
        addToWrongVocabList(vocab);
      });
    }
  };

  // 切换自定义选择界面
  const toggleCustomSelection = () => {
    setShowCustomSelection(!showCustomSelection);
  };

  return (
    <div className="app-container">
      {notification && <div className="notification">{notification}</div>}
      <header className="app-header">
        <h1>韩语背单词APP</h1>
        <div className="settings-container-right" ref={settingsRef}>
          <button 
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            设置
          </button>
          {showSettings && (
            <div className="settings-menu">
              <div className="setting-item">
                <input
                  type="checkbox"
                  id="autoNextQuestion"
                  checked={autoNextQuestion}
                  onChange={(e) => setAutoNextQuestion(e.target.checked)}
                />
                <label htmlFor="autoNextQuestion">自动跳到下一题</label>
              </div>
            </div>
          )}
        </div>

      </header>

      <div className="mode-switch-container">
        <div className="mode-switch">
          <button
            className={studyMode === 'recite' ? 'active' : ''}
            onClick={() => setStudyMode('recite')}
          >
            背诵模式
          </button>
          <button
            className={studyMode === 'custom' ? 'active' : ''}
            onClick={() => setStudyMode('custom')}
          >
            自定义模式
          </button>
          <button
            className={studyMode === 'memo' ? 'active' : ''}
            onClick={() => setStudyMode('memo')}
          >
            默写模式
          </button>
          <button
            className={studyMode === 'wrongList' ? 'active' : ''}
            onClick={() => setStudyMode('wrongList')}
          >
            错题本
          </button>
        </div>
      </div>

      <div className="settings-container">
        {studyMode === 'recite' && !reciteResults && !showReciteInterface && (
          <div className="recite-settings">
            <h3>背诵设置</h3>
            <div className="setting-item">
              <label>难度:</label>
              <select
                value={reciteDifficulty}
                onChange={(e) => setReciteDifficulty(e.target.value)}
              >
                <option value="easy">初级</option>
                <option value="medium">中级</option>
                <option value="hard">高级</option>
              </select>
            </div>
            <div className="setting-item">
              <label>单词数量:</label>
              <select
                value={reciteCount}
                onChange={(e) => setReciteCount(parseInt(e.target.value))}
              >
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            <button className="start-recite-btn" onClick={startRecite}>
              开始背诵
            </button>
          </div>
        )}

        {studyMode === 'custom' && !reciteResults && !showCustomSelection && !showReciteInterface && (
          <div className="custom-settings">
            <h3>自定义模式</h3>
            <div className="upload-section">
              <h3>导入单词表</h3>
              <label className="upload-btn">
                选择Excel文件
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <p className="upload-info">支持格式: .xlsx, .xls (韩语在左，中文在中，例句在右)</p>
              {uploadStatus === 'success' && (
                <div className="upload-success">{uploadMessage}</div>
              )}
              {uploadStatus === 'error' && (
                <div className="upload-error">{uploadMessage}</div>
              )}
            </div>
            <p>选择要背诵的单词:</p>
            <button className="select-vocab-btn" onClick={toggleCustomSelection}>
              选择单词
            </button>
            <p>已选择: {selectedVocabIds.length} 个单词</p>
            <button
              className="start-recite-btn"
              onClick={startCustomRecite}
              disabled={selectedVocabIds.length === 0}
            >
              开始背诵
            </button>
          </div>
        )}

        {studyMode === 'memo' && !memoResults && !showCustomSelection && !showMemoInterface && (
          <div className="memo-settings">
            <h3>默写模式</h3>
            <div className="upload-section">
              <h3>导入单词表</h3>
              <label className="upload-btn">
                选择Excel文件
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <p className="upload-info">支持格式: .xlsx, .xls (韩语在左，中文在中，例句在右)</p>
              {uploadStatus === 'success' && (
                <div className="upload-success">{uploadMessage}</div>
              )}
              {uploadStatus === 'error' && (
                <div className="upload-error">{uploadMessage}</div>
              )}
            </div>
            <p>选择要默写的单词:</p>
            <button className="select-vocab-btn" onClick={toggleCustomSelection}>
              选择单词
            </button>
            <p>已选择: {selectedVocabIds.length} 个单词</p>
            <button
              className="start-recite-btn"
              onClick={startMemoRecite}
              disabled={selectedVocabIds.length === 0}
            >
              开始默写
            </button>
          </div>
        )}


        {(studyMode === 'custom' || studyMode === 'memo') && showCustomSelection && !showReciteInterface && !showMemoInterface && (
          <div className="custom-selection">
            <h3>{studyMode === 'custom' ? '选择单词' : '选择要默写的单词'}</h3>
            <div className="vocab-selection-list">
              {userVocabList.length === 0 ? (
                <div className="no-vocab-message">没有单词可供选择，请先上传单词表</div>
              ) : (
                userVocabList.filter(vocab => vocab.source === 'upload' || vocab.source === 'manual').length === 0 ? (
                  <div className="no-vocab-message">没有上传的单词，请先上传单词表</div>
                ) : (
                  userVocabList
                    .filter(vocab => vocab.source === 'upload' || vocab.source === 'manual') // 只显示上传的单词
                    .map((vocab) => (
                      <div
                        key={vocab.id}
                        className={`vocab-selection-item ${selectedVocabIds.includes(vocab.id) ? 'selected' : ''}`}
                        onClick={() => toggleVocabSelection(vocab.id)}
                      >
                        <span className="vocab-korean">{vocab.korean || '无韩语'}</span>
                        <span className="vocab-chinese">{vocab.chinese || '无中文'}</span>
                        {vocab.example && vocab.example.trim() && (
                          <span className="vocab-example">{vocab.example.trim()}</span>
                        )}
                        <span className="vocab-pronunciation">{vocab.pronunciation ? `[${vocab.pronunciation}]` : ''}</span>
                        <span className="vocab-difficulty">{vocab.difficulty || '未分类'}</span>
                      </div>
                    ))
                )
              )}
            </div>
            <div className="selection-actions">
                <button onClick={() => setSelectedVocabIds(userVocabList.filter(vocab => vocab.source === 'upload' || vocab.source === 'manual').map(vocab => vocab.id))}>全选</button>
                <button onClick={resetCustomSelection}>清空选择</button>
                <button onClick={toggleCustomSelection}>确认选择</button>
              </div>
          </div>
        )}
      </div>

      <main className="app-main">
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading">加载中...</div>}

        {studyMode === 'recite' ? (
          reciteResults ? (
            <div className="recite-results">
              <h2>背诵结果</h2>
              <p>总单词数: {reciteResults.total}</p>
              <p>正确: {reciteResults.correct}</p>
              <p>错误: {reciteResults.incorrect}</p>
              <p>正确率: {reciteResults.accuracy}%</p>
              <button onClick={resetRecite}>返回</button>
              <button onClick={startRecite}>再次背诵</button>
            </div>
          ) : showReciteInterface ? (
            <ReciteMode
              vocabList={builtInVocabList}
              difficulty={reciteDifficulty}
              reciteCount={reciteCount}
              onComplete={handleReciteComplete}
              autoNextQuestion={autoNextQuestion}
            />
          ) : null
        ) : studyMode === 'custom' ? (
          reciteResults ? (
            <div className="recite-results">
              <h2>背诵结果</h2>
              <p>总单词数: {reciteResults.total}</p>
              <p>正确: {reciteResults.correct}</p>
              <p>错误: {reciteResults.incorrect}</p>
              <p>正确率: {reciteResults.accuracy}%</p>
              <button onClick={() => {setReciteResults(null); setShowReciteInterface(false);}}>返回</button>
              <button onClick={startCustomRecite}>再次背诵</button>
            </div>
          ) : showReciteInterface ? (
            <CustomMode
              vocabList={userVocabList}
              selectedVocabIds={selectedVocabIds}
              onComplete={handleCustomComplete}
              autoNextQuestion={autoNextQuestion}
            />
          ) : null
        ) : studyMode === 'memo' ? (
          memoResults ? (
            <div className="memo-results">            <h2>默写结果</h2>            <p>总单词数: {memoResults.total}</p>            <p>正确: {memoResults.correct}</p>            <p>错误: {memoResults.incorrect}</p>            <p>正确率: {memoResults.accuracy}%</p>            <button onClick={() => {setMemoResults(null); setShowMemoInterface(false);}}>返回</button>            <button onClick={startMemoRecite}>再次默写</button>          </div>
          ) : showMemoInterface ? (
            <MemoMode
              vocabList={userVocabList}
              selectedVocabIds={selectedVocabIds}
              onComplete={handleMemoComplete}
            />
          ) : null
        ) : studyMode === 'wrongList' ? (
          <WrongVocabList
            wrongVocabList={wrongVocabList}
            onRemove={removeFromWrongVocabList}
            onClear={clearWrongVocabList}
            onViewData={debugWrongVocabList}
            onShowAll={() => {
              console.log('Current wrongVocabList:', wrongVocabList);
              alert(`错题本当前有 ${wrongVocabList.length} 个单词\n\n${JSON.stringify(wrongVocabList, null, 2)}`);
            }}
          />
        ) : null}

        {/* 单词列表查看按钮 */}
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <button
            onClick={() => setShowBuiltInVocab(!showBuiltInVocab)}
            style={{ marginBottom: '5px' }}
          >
            查看内置单词
          </button>
          <button
            onClick={() => setShowUserVocab(!showUserVocab)}
          >
            查看用户单词
          </button>
        </div>

        {/* 内置单词列表模态框 */}
        {showBuiltInVocab && (
          <div className="vocab-modal">
            <div className="vocab-modal-content">
              <div className="vocab-modal-header">
                <h2>内置单词列表</h2>
                <button onClick={() => setShowBuiltInVocab(false)} className="close-btn">×</button>
              </div>
              <div className="vocab-modal-body">
                {builtInVocabList.length === 0 ? (
                  <p>没有内置单词</p>
                ) : (
                  <div className="vocab-list">
                    {builtInVocabList.map((vocab, index) => (
                      <div key={index} className="vocab-item">
                        <div className="vocab-item-korean">{vocab.korean}</div>
                        <div className="vocab-item-chinese">{vocab.chinese}</div>
                        {vocab.example && <div className="vocab-item-example">{vocab.example}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 用户单词列表模态框 */}
        {showUserVocab && (
          <div className="vocab-modal">
            <div className="vocab-modal-content">
              <div className="vocab-modal-header">
                <h2>用户单词列表</h2>
                <button onClick={() => setShowUserVocab(false)} className="close-btn">×</button>
              </div>
              <div className="vocab-modal-body">
                {userVocabList.length === 0 ? (
                  <p>没有用户单词，请先上传单词表</p>
                ) : (
                  <div className="vocab-list">
                    {userVocabList.map((vocab) => (
                      <div key={vocab.id} className="vocab-item">
                        <div className="vocab-item-korean">{vocab.korean}</div>
                        <div className="vocab-item-chinese">{vocab.chinese}</div>
                        {vocab.example && <div className="vocab-item-example">{vocab.example}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 删除单词功能 - 仅用于自定义模式中选择单词时 */}
        {studyMode === 'custom' && showCustomSelection && (
          <style jsx>{
            `
              .vocab-selection-item:hover .delete-btn {
                display: inline;
              }
              .delete-btn {
                display: none;
                margin-left: 10px;
                color: red;
                cursor: pointer;
              }
            `
          }</style>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2025 韩语背单词APP</p>
      </footer>
    </div>
  );
}

export default App;