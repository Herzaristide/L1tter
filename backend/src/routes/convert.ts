import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import axios from 'axios';

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
 * Simple page number removal function
 */
function removePageNumbers(text: string): string {
  // Split into lines for analysis
  const lines = text.split('\n');
  const filteredLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
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

    // Enhanced chapter protection - protect simple chapter numbers
    const isProtectedChapter =
      // Explicit chapter keywords
      /\b(chapter|part|section)\s*\d+/i.test(line) || // "Chapter 1", "Part 2"
      (i > 0 && /\b(chapter|part|section)\b/i.test(lines[i - 1])) || // Previous line has chapter keyword
      // Protect numbers/Roman numerals that are likely chapters (at top of page with indentation)
      (i < 10 && // Within first 10 lines (top of page)
        (/^\d{1,2}$/.test(trimmed) || /^[ivxlcdm]{1,8}$/i.test(trimmed)) && // Simple number or Roman numeral
        line.length - line.trimStart().length >= 5) || // Has some indentation (likely centered)
      // Protect if followed by chapter-like content
      (i < lines.length - 1 &&
        (/^\d{1,2}$/.test(trimmed) || /^[ivxlcdm]{1,8}$/i.test(trimmed)) && // Simple number or Roman numeral
        lines[i + 1].trim().length > 3 && // Next line has substantial content
        /^[A-Z]/.test(lines[i + 1].trim())) || // Next line starts with capital
      // Protect if isolated with empty lines around (chapter pattern)
      (i > 0 &&
        i < 10 &&
        i < lines.length - 1 &&
        (/^\d{1,2}$/.test(trimmed) || /^[ivxlcdm]{1,8}$/i.test(trimmed)) &&
        lines[i - 1].trim().length === 0 && // Empty line before
        lines[i + 1].trim().length === 0); // Empty line after

    // Remove if it's a page number pattern AND not a protected chapter
    if (isPageNumber && !isProtectedChapter) {
      // Skip this line (don't add to filtered lines)
      continue;
    }

    // Keep all other lines
    filteredLines.push(line);
  }

  return filteredLines.join('\n');
}

/**
 * Detect chapter titles and numbers in text
 */
function detectChapters(text: string): { title: string; content: string }[] {
  const lines = text.split('\n');
  const chapters: { title: string; content: string; startIndex: number }[] = [];

  console.debug(
    `[Chapter Detection] Starting analysis on ${lines.length} lines`
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Calculate indentation (centering indicator)
    const indentation = line.length - line.trimStart().length;
    const lineLength = trimmed.length;
    const isLikelyCentered =
      indentation >= 10 || (indentation >= 5 && lineLength < 50);

    // Debug info for potential chapter lines (first 20 lines only to avoid spam)
    if (i < 20 && lineLength > 3 && lineLength < 100) {
      console.debug(
        `[Chapter Detection] Line ${i}: "${trimmed}" (indent: ${indentation}, centered: ${isLikelyCentered})`
      );
    }

    // Simplified chapter detection patterns - focus on simple numbers and Roman numerals
    const isChapterPattern =
      // Simple numeric chapters: 1, 2, 3, etc.
      /^\d{1,2}$/.test(trimmed) ||
      // Roman numerals: I, II, III, IV, V, etc.
      /^[ivxlcdm]{1,8}$/i.test(trimmed) ||
      // Explicit chapter patterns (backup)
      /^(chapter|part|section|book)\s*\d+/i.test(trimmed) ||
      /^(chapter|part|section|book)\s+[ivxlcdm]+$/i.test(trimmed) ||
      // Special sections
      /^(prologue|epilogue|introduction|conclusion|preface|acknowledgments?|bibliography|index)$/i.test(
        trimmed
      );

    if (isChapterPattern) {
      let chapterTitle = trimmed;
      let titleEndIndex = i;

      // Debug: Log detected chapter pattern
      console.debug(
        `[Chapter Detection] Found potential chapter at line ${i}: "${trimmed}"`
      );

      // Check if next line is also part of the title (continuation or subtitle)
      if (i < lines.length - 1) {
        const nextLine = lines[i + 1].trim();
        const nextIndentation =
          lines[i + 1].length - lines[i + 1].trimStart().length;
        const nextIsCentered =
          nextIndentation >= 5 ||
          (nextIndentation >= 3 && nextLine.length < 50);

        if (
          nextLine.length > 0 &&
          nextLine.length < 80 &&
          nextIsCentered &&
          /^[A-Za-z\s\-':,]+$/.test(nextLine) &&
          !nextLine.includes('.')
        ) {
          chapterTitle += ' ' + nextLine;
          titleEndIndex = i + 1;
          console.debug(
            `[Chapter Detection] Extended title: "${chapterTitle}"`
          );
        }
      }

      chapters.push({
        title: chapterTitle,
        content: '',
        startIndex: titleEndIndex + 1,
      });
    }
  }

  // If no chapters detected, try a more lenient approach
  if (chapters.length === 0) {
    console.debug(
      '[Chapter Detection] No strict chapters found, trying lenient detection...'
    );

    for (let i = 0; i < Math.min(100, lines.length); i++) {
      // Check first 100 lines
      const trimmed = lines[i].trim();
      if (!trimmed) continue;

      // Very simple chapter detection - just look for standalone numbers or Roman numerals
      const isSimpleChapter =
        // Standalone numbers 1-50
        (/^\d{1,2}$/.test(trimmed) && parseInt(trimmed) <= 50) ||
        // Roman numerals
        /^[ivxlcdm]{1,8}$/i.test(trimmed) ||
        // Explicit chapter words
        /^(chapter|part|section)\s*\d+/i.test(trimmed);

      if (isSimpleChapter) {
        console.debug(
          `[Chapter Detection] Simple chapter found at line ${i}: "${trimmed}"`
        );
        chapters.push({
          title: trimmed,
          content: '',
          startIndex: i + 1,
        });
      }
    }
  }

  // If still no chapters detected, return the entire content as one chapter
  if (chapters.length === 0) {
    console.debug(
      '[Chapter Detection] No chapters detected, returning entire content as single chapter'
    );
    return [
      {
        title: 'Content',
        content: text,
      },
    ];
  }

  console.debug(`[Chapter Detection] Found ${chapters.length} chapters`);

  // Extract content for each chapter
  const result: { title: string; content: string }[] = [];

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const nextChapter = chapters[i + 1];

    const endIndex = nextChapter ? nextChapter.startIndex - 1 : lines.length;
    const chapterLines = lines.slice(chapter.startIndex, endIndex);

    // Clean up chapter content
    const content = chapterLines
      .join('\n')
      .replace(/^\n+/, '') // Remove leading newlines
      .replace(/\n+$/, '') // Remove trailing newlines
      .replace(/\n{3,}/g, '\n\n'); // Reduce multiple newlines to double

    // Debug: Log detected chapter split
    console.debug(`[Chapter Split] Chapter ${i + 1}: "${chapter.title}"`);
    console.debug(
      `[Chapter Split] Content length: ${content.length} characters`
    );
    console.debug(
      `[Chapter Split] Content preview: ${content.slice(0, 100)}...`
    );

    if (content.trim().length > 0) {
      result.push({
        title: chapter.title,
        content: content,
      });
    }
  }

  return result.length > 0
    ? result
    : [
        {
          title: 'Content',
          content: text,
        },
      ];
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

    // Remove page numbers first
    const cleanedText = removePageNumbers(data.text);

    // Detect and split into chapters
    const chapters = detectChapters(cleanedText);

    return chapters;
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

    // Remove page numbers first
    const cleanedText = removePageNumbers(data.text);

    // Detect and split into chapters
    const chapters = detectChapters(cleanedText);

    return chapters;
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

    // Remove page numbers first
    const cleanedText = removePageNumbers(data.text);

    // Detect and split into chapters
    const chapters = detectChapters(cleanedText);

    return chapters;
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
