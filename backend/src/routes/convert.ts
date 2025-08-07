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
 * POST /api/convert/pdf-to-text
 * Convert PDF file to text using paragraph extraction
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

      // Extract paragraphs and map to chapters
      const extractedContent = await extractTextWithParagraphs(req.file.buffer);

      res.json({
        success: true,
        chapters: extractedContent,
        filename: req.file.originalname,
        size: req.file.size,
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
 * Download PDF from URL and convert to text using paragraph extraction
 */
router.post('/pdf-from-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

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

    // Extract paragraphs and map to chapters
    const extractedContent = await extractTextWithParagraphs(buffer);

    // Extract filename from URL
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop() || 'document.pdf';

    res.json({
      success: true,
      chapters: extractedContent,
      filename: filename,
      size: buffer.length,
      url: url,
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
