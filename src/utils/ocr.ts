import { createWorker } from 'tesseract.js';

export async function extractTextFromPDF(image: File): Promise<string> {
  const worker = await createWorker('eng', 1, {
    workerPath: 'https://unpkg.com/tesseract.js@v6.0.1/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://unpkg.com/tesseract.js-core@v6.0.1/tesseract-core.wasm.js',
  });
  
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Ошибка при распознавании текста. Попробуйте другой файл.');
  } finally {
    await worker.terminate();
  }
}
