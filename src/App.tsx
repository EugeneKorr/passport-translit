import React, { useState } from 'react';
import { extractTextFromPDF } from './utils/ocr';
import { transliterate } from './utils/translit';
import { exportToWord } from './utils/wordExport';
import { logCorrection } from './utils/db';

interface Row {
  eng: string;
  rus: string;
  edited: boolean;
}

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImage(file);
    setLoading(true);

    try {
      const text = await extractTextFromPDF(file);
      const extracted = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^[A-Z -]{2,}$/.test(line))
        .map(eng => ({ eng, rus: transliterate(eng), edited: false }));

      setRows(extracted);
    } catch (error) {
      console.error('Ошибка при обработке файла:', error);
      alert('Ошибка при обработке файла');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (index: number, newEng: string, newRus: string) => {
    logCorrection(newEng, newRus);
    const updated = [...rows];
    updated[index] = { eng: newEng, rus: newRus, edited: false };
    setRows(updated);
  };

  const updateField = (index: number, key: 'eng' | 'rus', value: string) => {
    const updated = [...rows];
    updated[index][key] = value;
    updated[index].edited = true;
    setRows(updated);
  };

  const reset = () => {
    setImage(null);
    setRows([]);
  };

  return (
    <div className="flex h-screen">
      {/* Левая часть - загрузка */}
      <div className="w-1/2 p-4 border-r flex flex-col items-center justify-center bg-gray-50">
        {!image ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6 text-gray-700">Passport Translit</h1>
            <label className="border-2 border-dashed border-gray-300 px-8 py-6 bg-white cursor-pointer hover:bg-gray-100 rounded-lg transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-lg">Загрузить PDF или изображение</span>
              </div>
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-4">📄 {image.name}</p>
            {loading ? (
              <p className="text-blue-600">Обрабатываем документ...</p>
            ) : (
              <p className="text-green-600">Данные обработаны →</p>
            )}
          </div>
        )}
      </div>

      {/* Правая часть - результаты */}
      <div className="w-1/2 p-4 overflow-y-scroll">
        <h2 className="text-xl font-semibold mb-4">Результаты распознавания</h2>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
            <input
              value={row.eng}
              onChange={(e) => updateField(i, 'eng', e.target.value)}
              className="border px-3 py-2 w-1/3 rounded"
              placeholder="English"
            />
            <span className="text-gray-400">→</span>
            <input
              value={row.rus}
              onChange={(e) => updateField(i, 'rus', e.target.value)}
              className="border px-3 py-2 w-1/3 rounded"
              placeholder="Русский"
            />
            {row.edited && (
              <button
                onClick={() => handleConfirm(i, row.eng, row.rus)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-sm rounded transition-colors"
              >
                ✓ Подтвердить
              </button>
            )}
          </div>
        ))}

        {rows.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <button 
              onClick={() => exportToWord(rows)} 
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 mr-3 rounded font-medium transition-colors"
            >
              📄 Экспорт в Word
            </button>
            <button 
              onClick={reset} 
              className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded font-medium transition-colors"
            >
              🔄 Сбросить
            </button>
          </div>
        )}

        {!loading && rows.length === 0 && image && (
          <p className="text-gray-500 text-center py-8">
            Не найдено текста для транслитерации
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
