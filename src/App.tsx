import React, { useState } from 'react';
import { extractTextFromImage } from './utils/ocr';
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const text = await extractTextFromImage(file);
      console.log('Extracted text:', text);
      
      const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Фильтруем строки с латинскими буквами длиной от 2 символов
          return line.length >= 2 && 
                 /[A-Z]/.test(line) && 
                 !/^\d+$/.test(line) && // исключаем чисто числовые строки
                 line !== 'PASSPORT' && // исключаем служебные слова
                 line !== 'PASSEPORT' &&
                 line !== 'TYPE' &&
                 line !== 'CODE';
        });

      console.log('Filtered lines:', lines);
      
      const extracted = lines.map(eng => ({ 
        eng, 
        rus: transliterate(eng), 
        edited: false 
      }));

      setRows(extracted);
      
      if (extracted.length === 0) {
        alert('Текст для транслитерации не найден. Попробуйте изображение с более четким текстом имен и фамилий.');
      } else {
        console.log(`Найдено ${extracted.length} строк для транслитерации`);
      }
    } catch (error) {
      console.error('Ошибка при обработке файла:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при обработке файла');
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
    setImagePreview(null);
    setRows([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Passport Translit</h1>
                <p className="text-sm text-blue-600">Powered by AGE Translation Bureau</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Бюро переводов</p>
              <p className="text-lg font-semibold text-blue-700">8 (495) 502-31-53</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Левая часть - загрузка */}
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 flex flex-col items-center justify-center">
            {!image ? (
              <div className="text-center w-full">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Загрузка документа</h2>
                  <p className="text-gray-600">Распознавание и транслитерация паспортных данных</p>
                </div>
                
                <label className="group relative block w-full max-w-md mx-auto">
                  <div className="border-2 border-dashed border-blue-300 group-hover:border-blue-400 rounded-xl p-8 bg-blue-50 group-hover:bg-blue-100 transition-all duration-200 cursor-pointer">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-blue-400 group-hover:text-blue-500 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-lg font-medium text-gray-700 mb-1">Перетащите изображение сюда</p>
                      <p className="text-sm text-gray-500">или нажмите для выбора</p>
                      <p className="text-xs text-gray-400 mt-2">JPG, PNG до 5MB</p>
                    </div>
                  </div>
                  <input type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                {imagePreview && (
                  <div className="flex-1 mb-6">
                    <img 
                      src={imagePreview} 
                      alt="Загруженная страница паспорта" 
                      className="w-full h-full object-contain rounded-lg shadow-lg border border-gray-200"
                      style={{ maxHeight: '60vh' }}
                    />
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{image.name}</h3>
                  
                  {loading ? (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center justify-center mb-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
                      </div>
                      <p className="text-blue-700 font-medium mb-1">Распознаем текст...</p>
                      <p className="text-sm text-blue-600">Это может занять до 30 секунд</p>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-green-700 font-medium">Текст распознан</p>
                      <p className="text-sm text-green-600">Результаты справа →</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Правая часть - результаты */}
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 overflow-hidden flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Результаты транслитерации</h2>
              <p className="text-gray-600">Проверьте и отредактируйте при необходимости</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-pulse bg-blue-100 h-4 rounded w-48 mb-4 mx-auto"></div>
                    <div className="animate-pulse bg-blue-100 h-4 rounded w-32 mx-auto"></div>
                  </div>
                </div>
              )}

              {rows.map((row, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 mb-4 hover:bg-gray-100 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Английский</label>
                      <input
                        value={row.eng}
                        onChange={(e) => updateField(i, 'eng', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="English text"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Русский</label>
                      <input
                        value={row.rus}
                        onChange={(e) => updateField(i, 'rus', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Русский текст"
                      />
                    </div>
                  </div>
                  {row.edited && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleConfirm(i, row.eng, row.rus)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Подтвердить</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!loading && rows.length === 0 && image && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Текст для транслитерации не найден</p>
                  <p className="text-sm text-gray-400">Попробуйте изображение с более четким текстом</p>
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => exportToWord(rows)} 
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Экспорт в Word</span>
                  </button>
                  <button 
                    onClick={reset} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Новый документ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © 2024 AGE Translation Bureau. AI-powered document processing.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Москва</span>
              <span>•</span>
              <span>Профессиональные переводы</span>
              <span>•</span>
              <span>age-com.ru</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
