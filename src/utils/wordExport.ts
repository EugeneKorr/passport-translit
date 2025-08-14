import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export async function exportToWord(rows: { eng: string, rus: string }[]) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: rows.map(row =>
        new Paragraph({
          children: [
            new TextRun({ text: `${row.eng} – ${row.rus}`, break: 1 }),
          ],
        })
      )
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'passport_output.docx');
}
