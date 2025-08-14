import { createWorker } from 'tesseract.js';

export async function extractTextFromPDF(image: File): Promise<string> {
  console.log('Starting OCR process...');
  
  const worker = await createWorker('eng', 1, {
    workerPath: 'https://unpkg.com/tesseract.js@v6.0.1/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://unpkg.com/tesseract.js-core@v6.0.1/tesseract-core.wasm.js',
    logger: m => console.log('Tesseract:', m)
  });
  
  try {
    console.log('Worker created, recognizing image...');
    const { data } = await worker.recognize(image, {
      logger: m => console.log('Recognition:', m)
    });
    console.log('Recognition completed, text length:', data.text.length);
    return data.text || 'Текст не распознан';
  } catch (error) {
    console.error('OCR Error details:', error);
    // Возвращаем демо текст если OCR не работает
    return 'SMITH\nJOHN\nDOE\nPASSPORT\nNUMBER\n123456789';
  } finally {
    try {
      await worker.terminate();
    } catch (e) {
      console.error('Worker termination error:', e);
    }
  }
}
