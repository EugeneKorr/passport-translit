import { createWorker } from 'tesseract.js';

export async function extractTextFromPDF(image: File): Promise<string> {
  const worker = await createWorker('eng');
  
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
