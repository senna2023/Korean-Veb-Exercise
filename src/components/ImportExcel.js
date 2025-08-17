import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function ImportExcel({ onImport }) {
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setImporting(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // 移除表头（如果有）
        if (jsonData.length > 0) {
          // 假设第一行是表头，检查是否包含韩语、中文、发音等关键词
          const firstRow = jsonData[0].join('').toLowerCase();
          const hasHeader = firstRow.includes('韩语') || firstRow.includes('中文') || firstRow.includes('发音');
          const vocabData = hasHeader ? jsonData.slice(1) : jsonData;
          onImport(vocabData);
        }
      } catch (error) {
        setImportError('导入失败: ' + error.message);
      } finally {
        setImporting(false);
        // 重置文件输入，以便可以重复选择同一个文件
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="import-container">
      <input
        type="file"
        id="excel-import"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
      />
      <label htmlFor="excel-import">
        {importing ? '导入中...' : '选择Excel文件'}
      </label>
      {fileName && <p>已选择: {fileName}</p>}
      {importError && <p className="error-message">{importError}</p>}
      <p>支持格式: .xlsx, .xls</p>
      <p>Excel格式要求: 第一列为韩语单词，第二列为中文释义，第三列为发音（可选）</p>
    </div>
  );
}

export default ImportExcel;