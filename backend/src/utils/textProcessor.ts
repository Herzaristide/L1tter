import pdfParse from 'pdf-parse';

export interface ChapterInfo {
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

export interface AIExtractionConfig {
  enabled: boolean;
  fallbackThreshold: number; // Minimum text length to consider traditional parsing successful
  provider: 'openai' | 'google' | 'azure' | 'local';
  apiKey?: string;
}

export interface BookStructure {
  title?: string;
  author?: string;
  chapters: ChapterInfo[];
  hasChapters: boolean;
  extractionMethod?: 'traditional' | 'ai-fallback' | 'ai-primary';
}

// AI-based text extraction using OpenAI Vision API
async function extractTextWithOpenAI(buffer: Buffer, config: AIExtractionConfig): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key not provided');
  }

  try {
    console.log('Using OpenAI Vision API for PDF text extraction');

    // Convert PDF to base64 for OpenAI API
    const base64Pdf = buffer.toString('base64');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text content from this PDF document. Preserve the structure, paragraphs, and any chapter headings. Return only the extracted text without any additional commentary.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    const extractedText = data.choices?.[0]?.message?.content || '';

    console.log('OpenAI extraction successful, text length:', extractedText.length);
    return extractedText;
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw new Error('AI extraction failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Enhanced text extraction using local AI (Tesseract.js for OCR)
async function extractTextWithTesseract(buffer: Buffer): Promise<string> {
  try {
    console.log('Using Tesseract.js for OCR extraction');

    // Note: This requires installing tesseract.js and pdf2pic
    // npm install tesseract.js pdf2pic
    const { createWorker } = require('tesseract.js');
    const pdf2pic = require('pdf2pic');

    // Convert PDF pages to images
    const convert = pdf2pic.fromBuffer(buffer, {
      density: 300,
      saveFilename: 'page',
      savePath: '/tmp',
      format: 'png',
      width: 2480,
      height: 3508
    });

    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    let fullText = '';
    const pageResults = await convert.bulk(-1); // Convert all pages

    for (const page of pageResults) {
      const { data: { text } } = await worker.recognize(page.path);
      fullText += text + '\n\n';
    }

    await worker.terminate();
    console.log('Tesseract extraction successful, text length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('Tesseract extraction error:', error);
    throw new Error('OCR extraction failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function extractTextFromPDF(buffer: Buffer, config?: AIExtractionConfig): Promise<{ text: string; method: string }> {
  const defaultConfig: AIExtractionConfig = {
    enabled: true,
    fallbackThreshold: 100,
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY
  };

  const aiConfig = { ...defaultConfig, ...config };
  let extractionMethod: 'traditional' | 'ai-fallback' | 'ai-primary' = 'traditional';

  try {
    console.log('Starting PDF extraction, buffer size:', buffer.length);

    // Try traditional parsing first
    const data = await pdfParse(buffer);
    const traditionalText = data.text || '';

    console.log('Traditional PDF extraction result, text length:', traditionalText.length);

    // Check if traditional extraction was successful
    if (traditionalText.length >= aiConfig.fallbackThreshold) {
      console.log('Traditional extraction successful');
      return { text: traditionalText, method: 'traditional' };
    }

    // Traditional extraction failed or produced minimal text - try AI
    if (aiConfig.enabled && traditionalText.length < aiConfig.fallbackThreshold) {
      console.log('Traditional extraction insufficient, trying AI fallback');
      extractionMethod = 'ai-fallback';

      try {
        let aiText = '';

        switch (aiConfig.provider) {
          case 'openai':
            if (aiConfig.apiKey) {
              aiText = await extractTextWithOpenAI(buffer, aiConfig);
            } else {
              throw new Error('OpenAI API key not configured');
            }
            break;
          case 'local':
            aiText = await extractTextWithTesseract(buffer);
            break;
          default:
            throw new Error(`AI provider ${aiConfig.provider} not implemented yet`);
        }

        if (aiText.length > traditionalText.length) {
          console.log('AI extraction successful, using AI result');
          return { text: aiText, method: 'ai-fallback' };
        } else {
          console.log('AI extraction did not improve result, using traditional');
          return { text: traditionalText, method: 'traditional' };
        }
      } catch (aiError) {
        console.error('AI extraction failed, falling back to traditional result:', aiError);
        if (traditionalText.length > 0) {
          return { text: traditionalText, method: 'traditional' };
        }
        throw aiError;
      }
    }

    return { text: traditionalText, method: 'traditional' };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to parse PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
} export function detectBookTitle(text: string): string | null {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Look for title in first few lines
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];

    // Skip common non-title patterns
    if (line.match(/^(page|copyright|isbn|published|author|by\s+|table of contents|contents)/i)) {
      continue;
    }

    // Title is likely to be:
    // - Not too short (more than 2 words usually)
    // - Not too long (less than 15 words)
    // - Contains letters
    // - Not all caps (unless it's a proper title)
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 15 && /[a-zA-Z]/.test(line)) {
      // Prefer lines that are not all caps (unless they look like proper titles)
      if (!line.match(/^[A-Z\s\d\W]+$/) || line.match(/^[A-Z][a-z\s]+$/)) {
        return line;
      }
    }
  }

  return null;
}

export function detectAuthor(text: string): string | null {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Look for author patterns in first 20 lines
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i];

    // Common author patterns
    const authorPatterns = [
      /^by\s+(.+)/i,
      /^author[:\s]+(.+)/i,
      /^written\s+by\s+(.+)/i,
      /^(.+),\s*author$/i,
    ];

    for (const pattern of authorPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Look for standalone names (after title, before content)
    if (i > 2 && i < 10) {
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        // Check if it looks like a name (capitalized words)
        if (words.every(word => /^[A-Z][a-z]+$/.test(word))) {
          return line;
        }
      }
    }
  }

  return null;
}

// Normalize text for better OCR chapter detection
function normalizeOCRText(text: string): string {
  return text
    // Fix common OCR spacing issues
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between lowercase and uppercase
    .replace(/(\d)([A-Z])/g, '$1 $2') // Insert space between digit and uppercase
    .replace(/([A-Z])(\d)/g, '$1 $2') // Insert space between uppercase and digit
    // Fix multiple spaces
    .replace(/\s+/g, ' ')
    // Normalize common OCR misreads
    .replace(/Ch apter/gi, 'Chapter')
    .replace(/Ch\s*apter/gi, 'Chapter')
    .replace(/CHAPTER/g, 'Chapter')
    .replace(/chapt er/gi, 'Chapter')
    // Fix Roman numerals that might be split
    .replace(/\b([IVX])\s+([IVX])\b/g, '$1$2')
    // Normalize punctuation
    .replace(/\s*[:：]\s*/g, ': ')
    .replace(/\s*[-－—]\s*/g, ' - ')
    .trim();
}

// Enhanced chapter detection for OCR text
function detectChaptersOCR(text: string): ChapterInfo[] {
  console.log('Using enhanced OCR chapter detection');

  // Normalize the text first
  const normalizedText = normalizeOCRText(text);
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const chapters: ChapterInfo[] = [];

  // More flexible chapter patterns for OCR text
  const chapterPatterns = [
    // Standard chapter patterns (more flexible)
    /^chapter\s*(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i,
    /^ch\s*(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i, // OCR might miss letters
    /^chap\s*(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i,

    // Number-based patterns
    /^(\d+)[\.\):\s]\s*(.+)$/,
    /^(\d+)\s*[-–—]\s*(.+)$/,
    /^(\d+)\s+(.{3,50})$/,  // Flexible length for chapter titles

    // Part/Section patterns
    /^part\s*(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i,
    /^section\s*(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i,

    // All caps patterns (common in OCR)
    /^([A-Z][A-Z\s]{2,30})$/,  // Shorter max length for OCR

    // Roman numeral patterns
    /^([IVX]+)[\.\)\s]\s*(.+)$/,

    // OCR-specific patterns
    /^(\d+)\s*[\.:]?\s*([A-Z][a-zA-Z\s]{2,40})$/,  // Simple number + title
    /^([A-Z]+)\s+(\d+)[\s:\-]*(.*)$/i,  // "CHAPTER 1" format
  ];

  let currentChapterStart = 0;
  let lastChapterIndex = -1;
  let chapterCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineUpper = line.toUpperCase();

    // Skip very short lines or obvious non-chapter content
    if (line.length < 3) continue;
    if (line.match(/^(page|\d+|copyright|isbn|table|contents|index)/i)) continue;

    // Check each pattern
    let isChapter = false;
    let chapterTitle = '';
    let chapterNumber = '';

    for (const pattern of chapterPatterns) {
      const match = line.match(pattern);

      if (match) {
        isChapter = true;

        if (match[2]) {
          chapterNumber = match[1] || '';
          chapterTitle = match[2].trim();
        } else if (match[1]) {
          if (/^\d+$/.test(match[1])) {
            chapterNumber = match[1];
            chapterTitle = `Chapter ${match[1]}`;
          } else {
            chapterTitle = match[1];
          }
        } else {
          chapterTitle = line;
        }
        break;
      }
    }

    // Additional heuristics for OCR text
    if (!isChapter) {
      // Check for standalone numbers that might be chapter indicators
      if (/^\d+$/.test(line) && parseInt(line) > 0 && parseInt(line) <= 50) {
        // Look at next line for potential chapter title
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.length > 3 && nextLine.length < 60 && /^[A-Z]/.test(nextLine)) {
            isChapter = true;
            chapterNumber = line;
            chapterTitle = nextLine;
            i++; // Skip the next line since we used it
          }
        }
      }

      // Check for lines that look like chapter titles (mostly uppercase, reasonable length)
      else if (line.length >= 5 && line.length <= 50) {
        const upperRatio = (line.match(/[A-Z]/g) || []).length / line.replace(/\s/g, '').length;
        const hasNumbers = /\d/.test(line);
        const startsWithCap = /^[A-Z]/.test(line);

        if ((upperRatio > 0.6 || (startsWithCap && hasNumbers)) &&
          !line.match(/^(the|and|but|for|with|from|this|that|they|there|where|when)/i)) {
          isChapter = true;
          chapterTitle = line;
          chapterNumber = (chapterCount + 1).toString();
        }
      }
    }

    if (isChapter) {
      // Save previous chapter if exists
      if (lastChapterIndex >= 0 && chapters.length > 0) {
        const prevChapterContent = lines
          .slice(currentChapterStart, i)
          .join('\n')
          .trim();

        if (prevChapterContent.length > 50) { // Lower threshold for OCR
          chapters[chapters.length - 1].content = prevChapterContent;
          chapters[chapters.length - 1].endIndex = i - 1;
        } else {
          // Remove the previous chapter if it's too short
          chapters.pop();
        }
      }

      // Clean up title
      chapterTitle = chapterTitle
        .replace(/^[-–—\s]+|[-–—\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!chapterTitle || chapterTitle.length < 2) {
        chapterTitle = `Chapter ${chapterNumber || (chapterCount + 1)}`;
      }

      // Add new chapter
      chapters.push({
        title: chapterTitle,
        content: '',
        startIndex: i,
        endIndex: -1,
      });

      currentChapterStart = i + 1;
      lastChapterIndex = i;
      chapterCount++;

      console.log(`Detected chapter: "${chapterTitle}" at line ${i}`);
    }
  }

  // Add the last chapter if exists
  if (lastChapterIndex >= 0 && chapters.length > 0) {
    const lastChapterContent = lines
      .slice(currentChapterStart)
      .join('\n')
      .trim();

    if (lastChapterContent.length > 50) {
      chapters[chapters.length - 1].content = lastChapterContent;
      chapters[chapters.length - 1].endIndex = lines.length - 1;
    } else {
      chapters.pop();
    }
  }

  // Final filtering - remove chapters that are likely false positives
  const filteredChapters = chapters.filter(chapter => {
    const hasSubstantialContent = chapter.content.length > 100;
    const hasReasonableTitle = chapter.title.length > 0 && chapter.title.length < 100;
    const notTableOfContents = !chapter.title.toLowerCase().includes('contents');
    const notPageNumber = !/^(page\s*)?\d+$/i.test(chapter.title);

    return hasSubstantialContent && hasReasonableTitle && notTableOfContents && notPageNumber;
  });

  console.log(`OCR chapter detection found ${filteredChapters.length} chapters`);
  return filteredChapters;
}

export function detectChapters(text: string, isOCR: boolean = false): ChapterInfo[] {
  // Use enhanced OCR detection if the text came from OCR
  if (isOCR) {
    return detectChaptersOCR(text);
  }

  // Original chapter detection for traditional PDF text
  const lines = text.split('\n');
  const chapters: ChapterInfo[] = [];

  // Chapter detection patterns (ordered by reliability)
  const chapterPatterns = [
    /^chapter\s+(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i,
    /^(\d+)[\.\)]\s+(.+)$/,
    /^part\s+(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i,
    /^section\s+(\d+|[ivxlcdm]+)[\s:\-\.]*(.*)$/i,
    /^(\d+)\s*[-–—]\s*(.+)$/,
    /^([A-Z][A-Z\s]{3,})$/,  // All caps titles
  ];

  let currentChapterStart = 0;
  let lastChapterIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Check each pattern
    for (const pattern of chapterPatterns) {
      const match = line.match(pattern);

      if (match) {
        // If this is not the first chapter, save the previous one
        if (lastChapterIndex >= 0) {
          const prevChapterContent = lines
            .slice(currentChapterStart, i)
            .join('\n')
            .trim();

          if (prevChapterContent.length > 100) { // Only save substantial chapters
            chapters[chapters.length - 1].content = prevChapterContent;
            chapters[chapters.length - 1].endIndex = i - 1;
          }
        }

        // Extract chapter title
        let chapterTitle = '';
        if (match[2]) {
          chapterTitle = match[2].trim();
        } else if (match[1]) {
          chapterTitle = `Chapter ${match[1]}`;
        } else {
          chapterTitle = line;
        }

        // Clean up title
        chapterTitle = chapterTitle.replace(/^[-–—\s]+|[-–—\s]+$/g, '');
        if (!chapterTitle) {
          chapterTitle = `Chapter ${chapters.length + 1}`;
        }

        // Add new chapter
        chapters.push({
          title: chapterTitle,
          content: '',
          startIndex: i,
          endIndex: -1,
        });

        currentChapterStart = i + 1;
        lastChapterIndex = i;
        break;
      }
    }
  }

  // Add the last chapter if exists
  if (lastChapterIndex >= 0 && chapters.length > 0) {
    const lastChapterContent = lines
      .slice(currentChapterStart)
      .join('\n')
      .trim();

    if (lastChapterContent.length > 100) {
      chapters[chapters.length - 1].content = lastChapterContent;
      chapters[chapters.length - 1].endIndex = lines.length - 1;
    }
  }

  // Filter out chapters that are too short or likely false positives
  return chapters.filter(chapter =>
    chapter.content.length > 200 &&
    chapter.title.length > 0 &&
    chapter.title.length < 100
  );
}

export function analyzeBookStructure(text: string, extractionMethod?: string): BookStructure {
  try {
    console.log('Analyzing book structure, text length:', text?.length || 0);
    console.log('Extraction method:', extractionMethod);

    if (!text || text.length === 0) {
      console.warn('Empty text provided for analysis');
      return {
        title: undefined,
        author: undefined,
        chapters: [],
        hasChapters: false,
        extractionMethod: extractionMethod as any
      };
    }

    const title = detectBookTitle(text);
    const author = detectAuthor(text);

    // Detect if this text came from OCR (AI extraction)
    const isOCRText = extractionMethod === 'ai-fallback' || extractionMethod === 'ai-primary';
    const chapters = detectChapters(text, isOCRText);

    console.log('Analysis results:', {
      title: title || 'not detected',
      author: author || 'not detected',
      chapterCount: chapters.length,
      extractionMethod: extractionMethod || 'traditional',
      usedOCRDetection: isOCRText
    });

    return {
      title: title || undefined,
      author: author || undefined,
      chapters,
      hasChapters: chapters.length > 1,
      extractionMethod: extractionMethod as any
    };
  } catch (error) {
    console.error('Error in analyzeBookStructure:', error);
    return {
      title: undefined,
      author: undefined,
      chapters: [],
      hasChapters: false,
      extractionMethod: extractionMethod as any
    };
  }
}

export function splitIntoParagraphs(text: string): string[] {
  // Split by double newlines, single newlines with indentation, or common paragraph markers
  return text
    .split(/\n\s*\n|\n(?=\s{2,})|\n(?=\d+\.|\•|\-\s)/)
    .map((p) => p.trim())
    .map((p) => p.replace(/\s+/g, ' ')) // Normalize whitespace
    .filter((p) => p.length > 20); // Filter out very short paragraphs
}
