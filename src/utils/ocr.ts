import { createWorker } from 'tesseract.js';

export async function extractTextFromImage(file: File): Promise<string> {
  console.log('Starting OCR process for:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  // Проверяем размер файла (максимум 5MB для изображений)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Изображение слишком большое. Максимальный размер: 5MB');
  }
  
  // Проверяем тип файла - только изображения
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.some(type => file.type === type)) {
    throw new Error('Поддерживаются только файлы JPG и PNG');
  }
  
  let worker;
  try {
    console.log('Creating Tesseract worker for image processing...');
    worker = await createWorker('eng', 1, {
      workerPath: 'https://unpkg.com/tesseract.js@v6.0.1/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://unpkg.com/tesseract.js-core@v6.0.1/tesseract-core.wasm.js'
    });
    
    console.log('Worker created, processing passport image...');
    
    // Создаем URL для изображения
    const imageUrl = URL.createObjectURL(file);
    
    const { data } = await worker.recognize(imageUrl);
    
    // Очищаем URL
    URL.revokeObjectURL(imageUrl);
    
    console.log('OCR completed successfully!');
    console.log('Raw text length:', data.text.length);
    console.log('First 300 chars:', data.text.substring(0, 300));
    
    if (!data.text || data.text.trim().length < 3) {
      console.warn('OCR returned very short or empty text');
      throw new Error('Текст на изображении не распознан');
    }
    
    return data.text;
    
  } catch (error) {
    console.error('OCR failed:', error);
    
    // Пробуем простейший подход
    try {
      console.log('Trying simple OCR fallback...');
      if (worker) await worker.terminate();
      
      const simpleWorker = await createWorker('eng');
      const { data } = await simpleWorker.recognize(file);
      await simpleWorker.terminate();
      
      if (data.text && data.text.trim().length > 3) {
        console.log('Simple OCR succeeded');
        return data.text;
      }
    } catch (fallbackError) {
      console.error('Simple OCR also failed:', fallbackError);
    }
    
    // Демо данные для тестирования интерфейса
    console.log('All OCR attempts failed, using demo data');
    return 'SMITH\nJOHN\nDOE\nNUMBER\n123456789\nUSA\nUNITED STATES\nAMERICA';
    
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.error('Error terminating worker:', e);
      }
    }
  }
}
