import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import axios from 'axios';
import path from 'path';

// Import the JavaScript PDF parser
const PDFParagraphExtractor = require('../utils/parsing/pdf-parser.js');

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * Remove page numbers, chapter titles and unwanted line breaks from text
 */
function removePageNumbersAndChapters(text: string): string {
  // First, normalize whitespace - replace multiple spaces with single space
  text = text.replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
  text = text.replace(/ +\n/g, '\n'); // Remove trailing spaces before line breaks
  text = text.replace(/\n +/g, '\n'); // Remove leading spaces after line breaks

  // Split into lines for analysis
  const lines = text.split('\n');
  const filteredLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (but preserve them for natural paragraph breaks)
    if (!trimmed) {
      filteredLines.push(line);
      continue;
    }

    // Check if this line is likely a page number
    const isPageNumber =
      // Page number patterns
      /^\d{1,4}$/.test(trimmed) || // Just numbers: 1, 42, 123
      /^page\s*\d+$/i.test(trimmed) || // "Page 1", "page 42"
      /^\d+\s*page$/i.test(trimmed) || // "1 page", "42 Page"
      /^-\d{1,4}-$/.test(trimmed) || // "-8-", "-42-", "-24-" (exact dash pattern)
      /^—\d{1,4}—$/.test(trimmed) || // "—8—", "—42—" (em dash)
      /^–\d{1,4}–$/.test(trimmed) || // "–8–", "–42–" (en dash)
      /^\s*-\s*\d{1,4}\s*-\s*$/.test(trimmed) || // "- 8 -", " - 42 - "
      /^\s*—\s*\d{1,4}\s*—\s*$/.test(trimmed) || // "— 16 —", " — 42 — " (em dash with spaces)
      /^\s*–\s*\d{1,4}\s*–\s*$/.test(trimmed) || // "– 16 –", " – 42 – " (en dash with spaces)
      /^[ivxlcdm]{1,8}$/.test(trimmed.toLowerCase()) || // Roman numerals: i, ii, iii, iv
      // Additional patterns
      /^\[\s*\d{1,4}\s*\]$/.test(trimmed) || // [5], [42]
      /^\(\s*\d{1,4}\s*\)$/.test(trimmed) || // (5), (42)
      /^\d{1,4}\s*[-–—]\s*\d{1,4}$/.test(trimmed); // 5-6, 42-43 (page ranges)

    // Check if this line is likely a chapter title or number
    const isChapterTitle =
      // Simple numeric chapters: 1, 2, 3, etc.
      /^\d{1,2}$/.test(trimmed) ||
      // Roman numerals: I, II, III, IV, V, etc.
      /^[ivxlcdm]{1,8}$/i.test(trimmed) ||
      // Roman numeral with dash and title: "I – LA GRAND'SALLE", "II – CHAPTER TITLE"
      /^[ivxlcdm]{1,8}\s*[–—-]\s*.+$/i.test(trimmed) ||
      // Numeric with dash and title: "1 – TITLE", "2 - Chapter Name"
      /^\d{1,2}\s*[–—-]\s*.+$/.test(trimmed) ||
      // Explicit chapter patterns
      /^(chapter|part|section|book)\s*\d+/i.test(trimmed) ||
      /^(chapter|part|section|book)\s+[ivxlcdm]+$/i.test(trimmed) ||
      // Special sections
      /^(prologue|epilogue|introduction|conclusion|preface|acknowledgments?|bibliography|index)$/i.test(
        trimmed
      );

    // Remove if it's a page number or chapter title
    if (isPageNumber || isChapterTitle) {
      // Skip this line (don't add to filtered lines)
      continue;
    }

    // Keep all other lines
    filteredLines.push(line);
  }

  // Now merge artificial line breaks while preserving natural ones
  return mergeArtificialLineBreaks(filteredLines.join('\n'));
}

/**
 * Merge artificial line breaks created by PDF parsing - only preserve line breaks after punctuation
 */
function mergeArtificialLineBreaks(text: string): string {
  const lines = text.split('\n');
  const mergedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const trimmedCurrent = currentLine.trim();

    // If current line is empty, it's a natural paragraph break - preserve it
    if (!trimmedCurrent) {
      mergedLines.push(currentLine);
      continue;
    }

    // If this is the last line, just add it
    if (i === lines.length - 1) {
      mergedLines.push(currentLine);
      continue;
    }

    const nextLine = lines[i + 1];
    const trimmedNext = nextLine.trim();

    // If next line is empty, current line ends a paragraph naturally
    if (!trimmedNext) {
      mergedLines.push(currentLine);
      continue;
    }

    // Check if current line ends with sentence-ending punctuation ONLY (period, exclamation, question mark)
    // NOT comma, semicolon, colon, or other punctuation - these should be merged
    const endsWithSentenceEnd = /[.!?][\s]*$/.test(trimmedCurrent);

    // Check if current line ends with a hyphen (word continuation)
    const endsWithHyphen = /[-–—]$/.test(trimmedCurrent);

    // Check if next line starts with clear structural elements that should stay separate
    const nextIsStructural =
      /^[\s]*[-•*]\s/.test(nextLine) || // Bullet points
      /^\d+[\.\)]\s/.test(trimmedNext) || // Numbered lists
      /^(Chapter|Part|Section|Book|CHAPTER|PART|SECTION|BOOK)\s/i.test(
        trimmedNext
      ) || // Chapter headings
      /^[A-Z][A-Z\s]{3,}$/.test(trimmedNext); // ALL CAPS headings

    // ULTRA AGGRESSIVE MERGING: Merge everything except:
    // 1. Lines ending with ONLY sentence punctuation (.!?) - NOT commas, semicolons, etc.
    // 2. Lines followed by structural elements (bullets, lists, headings)
    const shouldMerge = !endsWithSentenceEnd && !nextIsStructural;

    if (shouldMerge) {
      // Merge with next line
      if (endsWithHyphen) {
        // Remove hyphen and merge directly (dehyphenation)
        const lineWithoutHyphen = trimmedCurrent.replace(/[-–—]$/, '');
        const mergedText = lineWithoutHyphen + trimmedNext;
        mergedLines.push(mergedText);
      } else {
        // Add space and merge, but normalize multiple spaces
        const mergedText = (trimmedCurrent + ' ' + trimmedNext).replace(
          /\s+/g,
          ' '
        );
        mergedLines.push(mergedText);
      }
      i++; // Skip the next line since we merged it
    } else {
      // Keep as separate lines (natural line break after punctuation or before structure)
      mergedLines.push(currentLine);
    }
  }

  // Additional cleanup pass to catch any remaining issues
  return finalCleanup(mergedLines.join('\n'));
}

/**
 * Final cleanup pass to merge any remaining obvious artificial breaks
 */
function finalCleanup(text: string): string {
  // Replace multiple line breaks that might have been created
  text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks

  // Normalize spaces again after merging
  text = text.replace(/[ \t]+/g, ' '); // Replace multiple spaces/tabs with single space
  text = text.replace(/ +\n/g, '\n'); // Remove trailing spaces before line breaks
  text = text.replace(/\n +/g, '\n'); // Remove leading spaces after line breaks

  const lines = text.split('\n');
  const finalLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const trimmed = currentLine.trim();

    // Always keep empty lines and last line
    if (!trimmed || i === lines.length - 1) {
      finalLines.push(currentLine);
      continue;
    }

    const nextLine = lines[i + 1];
    const nextTrimmed = nextLine?.trim();

    if (!nextTrimmed) {
      finalLines.push(currentLine);
      continue;
    }

    // Final aggressive check: if current line doesn't end with .!? ONLY (not comma, semicolon, etc.)
    // and next line doesn't start structural elements
    const shouldStillMerge =
      !/[.!?][\s]*$/.test(trimmed) &&
      !/^[\s]*[-•*]\s/.test(nextLine) &&
      !/^\d+[\.\)]\s/.test(nextTrimmed) &&
      !/^(Chapter|Part|Section|Book|CHAPTER|PART|SECTION|BOOK)\s/i.test(
        nextTrimmed
      ) &&
      !/^[A-Z][A-Z\s]{3,}$/.test(nextTrimmed);

    if (shouldStillMerge) {
      // Remove any trailing hyphen and merge
      const cleanCurrent = trimmed.replace(/[-–—]$/, '');
      const mergedText =
        cleanCurrent + (cleanCurrent === trimmed ? ' ' : '') + nextTrimmed;
      // Normalize spaces in the merged text
      finalLines.push(mergedText.replace(/\s+/g, ' '));
      i++; // Skip next line
    } else {
      finalLines.push(currentLine);
    }
  }

  return finalLines.join('\n');
}

/**
 * Extract paragraphs using the advanced PDF parser and map them to chapters
 */
async function extractParagraphsAndMapToChapters(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    // Initialize the PDF paragraph extractor
    const extractor = new PDFParagraphExtractor();

    // Extract paragraphs from the PDF
    const paragraphs = await extractor.parsePDF(buffer);

    if (!paragraphs || paragraphs.length === 0) {
      throw new Error('No paragraphs extracted from PDF');
    }

    // Map paragraphs to chapters
    return mapParagraphsToChapters(paragraphs);
  } catch (error) {
    console.error('Error extracting paragraphs:', error);
    throw new Error('Failed to extract paragraphs from PDF file');
  }
}

/**
 * Map extracted paragraphs to chapters based on content analysis
 */
function mapParagraphsToChapters(
  paragraphs: string[]
): { title: string; content: string }[] {
  const chapters: { title: string; content: string }[] = [];
  let currentChapter: string[] = [];
  let chapterCount = 1;

  // Chapter detection patterns
  const chapterPatterns = [
    /^(chapter|part|section|book)\s+\d+/i,
    /^(chapter|part|section|book)\s+[ivxlcdm]+/i,
    /^\d+\.\s*[A-Z]/,
    /^[IVX]+\.\s*[A-Z]/,
    /^(prologue|epilogue|introduction|conclusion|preface)$/i,
  ];

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();

    if (!paragraph) continue;

    // Check if this paragraph is a chapter heading
    const isChapterHeading = chapterPatterns.some((pattern) =>
      pattern.test(paragraph)
    );

    if (isChapterHeading && currentChapter.length > 0) {
      // Save the previous chapter
      const chapterContent = currentChapter.join('\n\n');
      if (chapterContent.trim()) {
        chapters.push({
          title: `Chapter ${chapterCount}`,
          content: chapterContent,
        });
        chapterCount++;
      }

      // Start new chapter with this heading
      currentChapter = [paragraph];
    } else {
      // Add paragraph to current chapter
      currentChapter.push(paragraph);
    }

    // Auto-split chapters if they get too long (more than 50 paragraphs)
    if (currentChapter.length > 50) {
      const chapterContent = currentChapter.join('\n\n');
      if (chapterContent.trim()) {
        chapters.push({
          title: `Chapter ${chapterCount}`,
          content: chapterContent,
        });
        chapterCount++;
      }
      currentChapter = [];
    }
  }

  // Add any remaining paragraphs as the final chapter
  if (currentChapter.length > 0) {
    const chapterContent = currentChapter.join('\n\n');
    if (chapterContent.trim()) {
      chapters.push({
        title: `Chapter ${chapterCount}`,
        content: chapterContent,
      });
    }
  }

  // If no chapters were detected, treat all paragraphs as one chapter
  if (chapters.length === 0 && paragraphs.length > 0) {
    chapters.push({
      title: 'Full Text',
      content: paragraphs.join('\n\n'),
    });
  }

  return chapters;
}

/**
 * Extract text from PDF buffer with advanced paragraph extraction and chapter mapping
 */
async function extractTextWithParagraphs(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    // Use the advanced PDF paragraph extractor
    return await extractParagraphsAndMapToChapters(buffer);
  } catch (error) {
    console.error('Error extracting text with paragraphs:', error);
    throw new Error(
      'Failed to extract text with paragraph structure from PDF file'
    );
  }
}

/**
 * Extract text from PDF buffer with basic text extraction
 */
async function extractTextWithStructure(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    // Use pdf-parse to extract text
    const data = await pdf(buffer);

    // Split by pages (removes page numbers and chapters automatically)
    const pages = removePageNumbersAndChapters(data.text);

    return [{ title: 'text', content: pages }];
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

/**
 * Extract text from PDF buffer using basic pdf-parse
 */
async function extractTextFromPDF(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    const data = await pdf(buffer);

    // Split by pages (removes page numbers and chapters automatically)
    const pages = removePageNumbersAndChapters(data.text);

    return [{ title: 'text', content: pages }];
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

/**
 * Alternative: Extract text with basic structure preservation
 */
async function extractTextWithPageStructure(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    const data = await pdf(buffer);

    // Split by pages (removes page numbers and chapters automatically)
    const pages = removePageNumbersAndChapters(data.text);

    return [{ title: 'text', content: pages }];
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

/**
 * POST /api/convert/pdf-to-text
 * Convert PDF file to text with optional processing mode
 */
router.post(
  '/pdf-to-text',
  upload.single('pdf'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No PDF file provided',
        });
      }

      // Get processing mode from request body (default: 'structure')
      const mode = req.body.mode || 'structure';
      let extractedContent: { title: string; content: string }[] | string;

      switch (mode) {
        case 'paragraphs':
          extractedContent = await extractTextWithParagraphs(req.file.buffer);
          break;
        case 'structure':
          extractedContent = await extractTextWithStructure(req.file.buffer);
          break;
        case 'page-structure':
          extractedContent = await extractTextWithPageStructure(
            req.file.buffer
          );
          break;
        case 'raw':
          const rawData = await pdf(req.file.buffer);
          extractedContent = rawData.text;
          break;
        case 'smart':
        default:
          extractedContent = await extractTextFromPDF(req.file.buffer);
          break;
      }

      res.json({
        success: true,
        chapters: Array.isArray(extractedContent)
          ? extractedContent
          : [{ title: 'Content', content: extractedContent }],
        filename: req.file.originalname,
        size: req.file.size,
        mode: mode,
      });
    } catch (error) {
      console.error('PDF conversion error:', error);
      res.status(500).json({
        error: 'Failed to convert PDF to text',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/convert/pdf-from-url
 * Download PDF from URL and convert to text with optional processing mode
 */
router.post('/pdf-from-url', async (req: Request, res: Response) => {
  try {
    const { url, mode = 'smart' } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'No URL provided',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        error: 'Invalid URL format',
      });
    }

    // Download the PDF from the URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });

    // Check if the response is actually a PDF
    const contentType = response.headers['content-type'];
    if (!contentType?.includes('application/pdf')) {
      return res.status(400).json({
        error: 'URL does not point to a PDF file',
      });
    }

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // Process based on mode
    let extractedContent: { title: string; content: string }[] | string;
    switch (mode) {
      case 'paragraphs':
        extractedContent = await extractTextWithParagraphs(buffer);
        break;
      case 'structure':
        extractedContent = await extractTextWithStructure(buffer);
        break;
      case 'page-structure':
        extractedContent = await extractTextWithPageStructure(buffer);
        break;
      case 'raw':
        const rawData = await pdf(buffer);
        extractedContent = rawData.text;
        break;
      case 'smart':
      default:
        extractedContent = await extractTextFromPDF(buffer);
        break;
    }

    // Extract filename from URL
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop() || 'document.pdf';

    res.json({
      success: true,
      chapters: Array.isArray(extractedContent)
        ? extractedContent
        : [{ title: 'Content', content: extractedContent }],
      filename: filename,
      size: buffer.length,
      url: url,
      mode: mode,
    });
  } catch (error) {
    console.error('PDF URL conversion error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          error: 'Request timeout - PDF download took too long',
        });
      }
    }

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 404) {
        return res.status(404).json({
          error: 'PDF file not found at the provided URL',
        });
      }
    }

    res.status(500).json({
      error: 'Failed to download and convert PDF from URL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/convert/health
 * Health check for convert service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'PDF Conversion Service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
