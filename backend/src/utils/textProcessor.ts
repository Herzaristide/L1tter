import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to parse PDF: ' + error);
  }
}

export function splitIntoParagraphs(text: string): string[] {
  // Split by double newlines, single newlines with indentation, or common paragraph markers
  return text
    .split(/\n\s*\n|\n(?=\s{2,})|\n(?=\d+\.|\•|\-\s)/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20) // Filter out very short lines that aren't real paragraphs
    .map((p) => p.replace(/\s+/g, ' ')); // Normalize whitespace
}
