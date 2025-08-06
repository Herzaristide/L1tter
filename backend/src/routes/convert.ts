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
 * Extract text from PDF buffer with enhanced structure detection
 * Uses line-by-line analysis to simulate position and formatting detection
 */
async function extractTextWithStructure(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    // Use pdf-parse to extract text - no special options needed for structure detection
    const data = await pdf(buffer);

    // Enhanced structure detection using line positioning analysis
    return detectChaptersFromLineAnalysis(data.text);
  } catch (error) {
    console.error('Error extracting structured text from PDF:', error);
    // Fallback to regular extraction
    return await extractTextFromPDF(buffer);
  }
}

/**
 * Check if a number appears at regular intervals (indicating page numbers)
 */
function isNumberAtRegularInterval(
  lines: Array<{ trimmed: string; isEmpty: boolean }>,
  currentIndex: number,
  currentText: string
): boolean {
  const currentNum = parseInt(currentText);
  if (isNaN(currentNum) || currentNum < 1 || currentNum > 999) return false;

  // Look for similar numbers within a reasonable range
  const searchRange = Math.min(50, Math.floor(lines.length / 10));
  let foundSimilarNumbers = 0;

  for (
    let i = Math.max(0, currentIndex - searchRange);
    i < Math.min(lines.length, currentIndex + searchRange);
    i++
  ) {
    if (i === currentIndex) continue;

    const lineText = lines[i].trimmed;
    if (/^\d{1,3}$/.test(lineText)) {
      const num = parseInt(lineText);
      // Check if it's a sequential number or follows a pattern
      if (Math.abs(num - currentNum) <= 5) {
        foundSimilarNumbers++;
      }
    }
  }

  // If we find 2 or more similar numbers, it's likely a page number pattern
  return foundSimilarNumbers >= 2;
}

/**
 * Advanced chapter detection using line-by-line analysis
 * Simulates position and font-based detection through text patterns
 */
function detectChaptersFromLineAnalysis(
  text: string
): { title: string; content: string }[] {
  // Split into lines and analyze each line's characteristics
  const lines = text
    .split('\n')
    .map((line) => ({
      original: line,
      trimmed: line.trim(),
      leadingSpaces: line.length - line.trimStart().length,
      trailingSpaces: line.length - line.trimEnd().length,
      isEmpty: line.trim().length === 0,
    }))
    .filter((line) => !line.isEmpty);

  // Analyze each line for chapter indicators
  const lineAnalysis = lines.map((line, index) => {
    let score = 0;
    let reasons: string[] = [];
    const text = line.trimmed;

    // 1. STRONG PATTERNS (Definitive chapter markers)
    const strongPatterns = [
      {
        pattern: /^Chapter\s+\d+(\s*[:\-\.]?\s*.*)?$/i,
        points: 100,
        reason: 'Chapter_Number',
      },
      {
        pattern: /^CHAPTER\s+\d+(\s*[:\-\.]?\s*.*)?$/i,
        points: 100,
        reason: 'CHAPTER_NUMBER',
      },
      {
        pattern: /^Chapter\s+[IVX]+(\s*[:\-\.]?\s*.*)?$/i,
        points: 95,
        reason: 'Chapter_Roman',
      },
      {
        pattern: /^CHAPTER\s+[IVX]+(\s*[:\-\.]?\s*.*)?$/i,
        points: 95,
        reason: 'CHAPTER_ROMAN',
      },
      {
        pattern: /^Part\s+\d+(\s*[:\-\.]?\s*.*)?$/i,
        points: 90,
        reason: 'Part_Number',
      },
      {
        pattern: /^PART\s+\d+(\s*[:\-\.]?\s*.*)?$/i,
        points: 90,
        reason: 'PART_NUMBER',
      },
    ];

    // 2. MEDIUM PATTERNS (Likely chapter markers)
    const mediumPatterns = [
      {
        pattern: /^\d+\.\s+[A-Z][^.]{5,60}$/i,
        points: 70,
        reason: 'Numbered_Section',
      },
      {
        pattern: /^[IVX]+\.\s+[A-Z][^.]{5,60}$/i,
        points: 65,
        reason: 'Roman_Section',
      },
      { pattern: /^[A-Z][A-Z\s]{10,80}$/, points: 60, reason: 'ALL_CAPS' },
      {
        pattern: /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,6}$/,
        points: 50,
        reason: 'Title_Case',
      },
    ];

    // 3. SIMPLE NUMBERED CHAPTERS (Common in books)
    const simpleNumberPatterns = [
      {
        pattern: /^\d+\s*$/,
        points: 85,
        reason: 'Simple_Number_Chapter',
      },
      {
        pattern: /^\d+\s*[:\-]\s*.*$/,
        points: 80,
        reason: 'Number_With_Title',
      },
      {
        pattern: /^[IVX]+\s*$/i,
        points: 80,
        reason: 'Simple_Roman_Chapter',
      },
    ];

    // Test patterns
    [...strongPatterns, ...mediumPatterns, ...simpleNumberPatterns].forEach(
      ({ pattern, points, reason }) => {
        if (pattern.test(text)) {
          score += points;
          reasons.push(reason);
        }
      }
    );

    // 4. POSITIONING ANALYSIS (Simulating visual layout)

    // TOP OF PAGE DETECTION (Strong indicator for chapter titles)
    const isTopOfPage = index < 5; // First few lines of document section
    const isAfterPageBreak =
      index > 0 &&
      (lines[index - 1]?.trimmed.includes('---') ||
        lines[index - 1]?.trimmed.length === 0);

    if (isTopOfPage || isAfterPageBreak) {
      score += 50; // Strong boost for top-of-page positioning
      reasons.push('Top_Of_Page');
    }

    // Centered text (many leading spaces, short line) - common for chapter titles
    if (line.leadingSpaces >= 10 && text.length < 60 && text.length > 5) {
      score += 40;
      reasons.push('Centered_Text');
    }

    // Left-aligned but indented (common for chapter titles)
    if (
      line.leadingSpaces >= 5 &&
      line.leadingSpaces <= 15 &&
      text.length < 80
    ) {
      score += 25;
      reasons.push('Indented_Title');
    }

    // Standalone line (isolated by empty lines)
    const prevLine = lines[index - 1];
    const nextLine = lines[index + 1];
    const isIsolated =
      (!prevLine || prevLine.isEmpty) && (!nextLine || nextLine.isEmpty);

    if (isIsolated && text.length > 5 && text.length < 100) {
      score += 35;
      reasons.push('Isolated_Line');
    }

    // 5. CHAPTER-SPECIFIC PATTERNS (Enhanced for top-of-page detection)

    // Boost simple numbers when they appear at top of page/section
    if (/^\d+\s*$/.test(text) && (isTopOfPage || isAfterPageBreak)) {
      score += 30; // Additional boost for top-positioned numbers
      reasons.push('Top_Positioned_Number');
    }

    // Detect chapter titles that follow numbers (common pattern)
    if (index > 0) {
      const prevLineText = lines[index - 1]?.trimmed;
      if (
        prevLineText &&
        /^\d+\s*$/.test(prevLineText) &&
        text.length > 5 &&
        text.length < 100 &&
        /^[A-Z]/.test(text)
      ) {
        score += 35; // Title following a chapter number
        reasons.push('Title_After_Number');
      }
    }

    // Detect when current line is a number and next line is a title
    if (/^\d+\s*$/.test(text) && index < lines.length - 1) {
      const nextLineText = lines[index + 1]?.trimmed;
      if (
        nextLineText &&
        nextLineText.length > 5 &&
        nextLineText.length < 100 &&
        /^[A-Z]/.test(nextLineText) &&
        !/[.!?]$/.test(nextLineText)
      ) {
        score += 35; // Number followed by likely title
        reasons.push('Number_Before_Title');
      }
    }

    // PAGE NUMBER FILTERING (Apply after positive scoring to preserve valid chapters)
    if (/^\d+\s*$/.test(text)) {
      // Check if this looks like a page number - but be more conservative
      const hasChapterIndicators =
        isTopOfPage ||
        isAfterPageBreak || // At page top
        (line.leadingSpaces >= 5 && line.leadingSpaces <= 20) || // Reasonable indentation
        reasons.includes('Number_Before_Title') || // Followed by title
        reasons.includes('Title_After_Number'); // Previous was title

      // Only apply page number filtering if no strong chapter indicators
      if (!hasChapterIndicators) {
        const isLikelyPageNumber =
          // Very short numbers (1-3 digits) at edge positions
          (text.length <= 3 &&
            (line.leadingSpaces > 20 || line.trailingSpaces > 20)) ||
          // Numbers at the very beginning or end of lines with lots of spacing
          (line.leadingSpaces === 0 && line.trailingSpaces > 15) ||
          (line.leadingSpaces > 20 && line.trailingSpaces === 0) ||
          // BOTTOM OF PAGE DETECTION - numbers near the end of document sections
          index > lines.length - 10 || // Last 10 lines of document
          // Numbers followed by page breaks or end of content
          (index < lines.length - 3 &&
            lines
              .slice(index + 1, index + 4)
              .every((l) => l.trimmed.length < 5)) ||
          // Numbers that are isolated at document boundaries
          (index > lines.length * 0.8 && // In last 20% of document
            text.length <= 3 &&
            line.leadingSpaces > 15) ||
          // AGGRESSIVE PAGE NUMBER PATTERNS
          // Numbers that are completely isolated (no content nearby)
          (text.length <= 3 &&
            index > 10 && // Not at very beginning
            index < lines.length - 10 && // Not at very end
            lines
              .slice(Math.max(0, index - 3), index)
              .every((l) => l.trimmed.length < 15) &&
            lines
              .slice(index + 1, Math.min(lines.length, index + 4))
              .every((l) => l.trimmed.length < 15)) ||
          // Numbers with excessive spacing (characteristic of page numbers)
          (text.length <= 3 && line.leadingSpaces + line.trailingSpaces > 40) ||
          // Numbers at regular intervals (check if similar numbers appear regularly)
          (text.length <= 3 && isNumberAtRegularInterval(lines, index, text));

        if (isLikelyPageNumber) {
          score -= 100; // Maximum reduction for page numbers
          reasons.push('Likely_Page_Number');
        }
      }
    }

    // ADDITIONAL PAGE NUMBER CHECK - exclude isolated single/double digit numbers
    if (
      /^\d{1,2}$/.test(text) &&
      line.leadingSpaces > 15 && // Increased threshold
      text.length <= 2 &&
      index > lines.length * 0.1 && // Not in first 10% of document
      index < lines.length * 0.9 && // Not in last 10% either
      !reasons.includes('Top_Of_Page') && // Not at top of page
      !reasons.includes('Number_Before_Title') // Not followed by title
    ) {
      score -= 50; // Additional penalty for isolated small numbers
      reasons.push('Isolated_Small_Number');
    }

    // 6. FORMAT ANALYSIS (Simulating font characteristics)

    // No ending punctuation (titles often don't end with periods)
    if (text.length > 5 && !/[.!?;,]$/.test(text)) {
      score += 15;
      reasons.push('No_Punctuation');
    }

    // Contains chapter-related keywords
    if (
      /\b(introduction|conclusion|summary|preface|epilogue|appendix)\b/i.test(
        text
      )
    ) {
      score += 25;
      reasons.push('Chapter_Keywords');
    }

    // Followed by longer content (chapters usually followed by paragraphs)
    if (
      nextLine &&
      !nextLine.isEmpty &&
      nextLine.trimmed.length > text.length * 1.5
    ) {
      score += 20;
      reasons.push('Followed_By_Content');
    }

    // 7. CONTENT STRUCTURE ANALYSIS

    // Line starts with number or Roman numeral
    if (/^(\d+|[IVX]+)[\.\s]/.test(text)) {
      score += 15;
      reasons.push('Starts_With_Number');
    }

    // Contains colon (often used in chapter titles)
    if (text.includes(':') && text.length < 100) {
      score += 10;
      reasons.push('Contains_Colon');
    }

    return {
      text,
      index,
      score,
      reasons,
      isChapterCandidate: score >= 40,
      confidence: Math.min(score / 100, 1),
    };
  });

  // Filter potential chapters and remove conflicts
  let chapterCandidates = lineAnalysis
    .filter((analysis) => analysis.isChapterCandidate)
    .sort((a, b) => b.score - a.score);

  // Remove candidates that are too close to higher-scoring ones
  chapterCandidates = chapterCandidates.filter((candidate, index) => {
    return !chapterCandidates
      .slice(0, index)
      .some(
        (other) =>
          Math.abs(candidate.index - other.index) <= 2 &&
          other.score > candidate.score
      );
  });

  // Sort by original document order
  chapterCandidates.sort((a, b) => a.index - b.index);

  // If no good chapters found, return whole document
  if (chapterCandidates.length === 0) {
    return [
      {
        title: 'Content',
        content: processTextContent(lines.map((l) => l.trimmed).join('\n')),
      },
    ];
  }

  // Build chapters from detected boundaries
  const chapters: { title: string; content: string }[] = [];

  for (let i = 0; i < chapterCandidates.length; i++) {
    const currentChapter = chapterCandidates[i];
    const nextChapter = chapterCandidates[i + 1];

    const startIndex = currentChapter.index + 1; // Start after the title
    const endIndex = nextChapter ? nextChapter.index : lines.length;

    // Extract content lines between chapters
    const contentLines = lines
      .slice(startIndex, endIndex)
      .map((line) => line.trimmed)
      .filter((line) => line.length > 0);

    const chapterContent = contentLines.join('\n').trim();

    if (chapterContent.length > 10) {
      // Only include chapters with substantial content
      chapters.push({
        title: currentChapter.text,
        content: processTextContent(chapterContent),
      });
    }
  }

  return chapters.length > 0
    ? chapters
    : [
        {
          title: 'Content',
          content: processTextContent(lines.map((l) => l.trimmed).join('\n')),
        },
      ];
}

/**
 * Extract text from PDF buffer using pdf-parse with smart chapter/paragraph detection (fallback)
 */
async function extractTextFromPDF(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    const data = await pdf(buffer);

    // Get raw text
    let rawText = data.text;

    // Apply smart text processing for books
    let processedChapters = smartBookTextProcessing(rawText);

    return processedChapters;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

/**
 * Smart text processing for book content with chapter and paragraph detection
 * Returns an array of chapters with their titles and content
 */
function smartBookTextProcessing(
  text: string
): { title: string; content: string }[] {
  // Step 1: Normalize whitespace but preserve intentional breaks
  let processed = text
    // Remove excessive spaces but keep single spaces
    .replace(/[ \t]+/g, ' ')
    // Remove excessive newlines (3+ becomes 2)
    .replace(/\n{3,}/g, '\n\n');

  // Step 2: Detect chapter boundaries with markers
  const chapterMarkers = [
    // Chapter patterns with numbers
    /^(Chapter\s+\d+)[\s\n]*(.*)$/gim,
    /^(CHAPTER\s+\d+)[\s\n]*(.*)$/gim,

    // Chapter patterns with Roman numerals
    /^(Chapter\s+[IVX]+)[\s\n]*(.*)$/gim,
    /^(CHAPTER\s+[IVX]+)[\s\n]*(.*)$/gim,

    // Part/Section patterns
    /^(Part\s+\d+)[\s\n]*(.*)$/gim,
    /^(PART\s+\d+)[\s\n]*(.*)$/gim,

    // Generic numbered headings
    /^(\d+\.\s+.{1,100})$/gm,
    /^([IVX]+\.\s+.{1,100})$/gm,
  ];

  // Find all chapter positions
  let chapterPositions: { index: number; title: string; fullMatch: string }[] =
    [];

  chapterMarkers.forEach((pattern) => {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(processed)) !== null) {
      const title = match[2]
        ? `${match[1]}: ${match[2]}`.trim()
        : match[1].trim();
      chapterPositions.push({
        index: match.index,
        title: title,
        fullMatch: match[0],
      });
    }
  });

  // Sort by position
  chapterPositions.sort((a, b) => a.index - b.index);

  // If no chapters found, return the whole text as one chapter
  if (chapterPositions.length === 0) {
    return [
      {
        title: 'Content',
        content: processTextContent(processed),
      },
    ];
  }

  // Split text into chapters
  const chapters: { title: string; content: string }[] = [];

  for (let i = 0; i < chapterPositions.length; i++) {
    const currentChapter = chapterPositions[i];
    const nextChapter = chapterPositions[i + 1];

    const startIndex = currentChapter.index;
    const endIndex = nextChapter ? nextChapter.index : processed.length;

    let chapterText = processed.substring(startIndex, endIndex);

    // Remove the chapter header from content
    chapterText = chapterText.replace(currentChapter.fullMatch, '').trim();

    // Process the chapter content
    const processedContent = processTextContent(chapterText);

    if (processedContent.trim()) {
      chapters.push({
        title: currentChapter.title,
        content: processedContent,
      });
    }
  }

  return chapters;
}

/**
 * Process individual chapter content
 */
function processTextContent(text: string): string {
  // Smart paragraph detection
  let processed = text
    // Split text into potential paragraphs
    .split(/\n\s*\n/)
    .map((paragraph) => {
      // Clean each paragraph
      let cleaned = paragraph
        .replace(/\n/g, ' ') // Convert internal newlines to spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      // Skip empty paragraphs
      if (!cleaned) return '';

      // Detect if this is likely a subheading
      if (
        cleaned.length < 100 &&
        !/[.!?]$/.test(cleaned) &&
        (/^[A-Z\s]{5,}$/.test(cleaned) || /^\d+\./.test(cleaned))
      ) {
        return `### ${cleaned}`;
      }

      // Regular paragraph
      return cleaned;
    })
    .filter((p) => p.length > 0)
    .join('\n\n');

  // Final cleanup
  processed = processed
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();

  return processed;
}

/**
 * Alternative: Extract text with page-based structure preservation
 */
async function extractTextWithPageStructure(
  buffer: Buffer
): Promise<{ title: string; content: string }[]> {
  try {
    const data = await pdf(buffer);

    // Process the full text but preserve more structure
    let processedText = data.text
      // Preserve page breaks (common patterns)
      .replace(/\f/g, '\n\n--- Page Break ---\n\n')
      // Preserve form feeds and page separators
      .replace(/\x0C/g, '\n\n--- Page Break ---\n\n');

    // Apply smart processing while preserving page structure
    let processedChapters = smartBookTextProcessing(processedText);

    return processedChapters;
  } catch (error) {
    console.error('Error extracting text with page structure:', error);
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
