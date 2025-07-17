import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  splitIntoParagraphs,
  extractTextFromPDF,
  analyzeBookStructure,
} from '../utils/textProcessor';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  },
});

// Get all books for authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const books = await prisma.book.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        paragraphs: {
          select: {
            id: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 1, // Just get the first paragraph to show progress
        },
        progress: {
          where: {
            userId: req.user!.id,
          },
          include: {
            paragraph: true,
          },
        },
        _count: {
          select: {
            paragraphs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single book by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        paragraphs: {
          orderBy: {
            order: 'asc',
          },
        },
        progress: {
          where: {
            userId: req.user!.id,
          },
        },
        _count: {
          select: {
            paragraphs: true,
          },
        },
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new book with text content
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, author, content } = req.body;

    if (!title || !author || !content) {
      return res
        .status(400)
        .json({ error: 'Title, author, and content are required' });
    }

    // Split content into paragraphs
    const paragraphs = splitIntoParagraphs(content);

    if (paragraphs.length === 0) {
      return res
        .status(400)
        .json({ error: 'No valid paragraphs found in content' });
    }

    // Create book and paragraphs in a transaction
    const book = await prisma.$transaction(async (tx) => {
      // Create book
      const newBook = await tx.book.create({
        data: {
          title,
          author,
          userId: req.user!.id,
        },
      });

      // Create paragraphs
      for (let i = 0; i < paragraphs.length; i++) {
        await tx.paragraph.create({
          data: {
            bookId: newBook.id,
            order: i + 1,
            content: paragraphs[i],
          },
        });
      }

      return newBook;
    });

    // Fetch the complete book with paragraphs
    const completeBook = await prisma.book.findUnique({
      where: { id: book.id },
      include: {
        paragraphs: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            paragraphs: true,
          },
        },
      },
    });

    res.status(201).json(completeBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload book from file (PDF or text)
router.post(
  '/upload',
  authenticateToken,
  requireAdmin,
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      let { title, author } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      let content: string;

      // Extract text based on file type
      if (file.mimetype === 'application/pdf') {
        // Configure AI extraction for upload
        const aiConfig = {
          enabled: process.env.ENABLE_AI_EXTRACTION === 'true',
          fallbackThreshold: parseInt(process.env.AI_FALLBACK_THRESHOLD || '100'),
          provider: (process.env.AI_PROVIDER as any) || 'openai',
          apiKey: process.env.OPENAI_API_KEY
        };

        const extractionResult = await extractTextFromPDF(file.buffer, aiConfig);
        content = extractionResult.text;

        console.log(`Upload extraction method: ${extractionResult.method}`);
      } else if (file.mimetype === 'text/plain') {
        content = file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      // Analyze book structure for automatic title/author detection
      const bookStructure = analyzeBookStructure(content);

      // Use detected title/author if not provided manually
      if (!title && bookStructure.title) {
        title = bookStructure.title;
      }
      if (!author && bookStructure.author) {
        author = bookStructure.author;
      }

      // Validate that we have at least a title
      if (!title) {
        return res.status(400).json({
          error: 'Title is required (could not be auto-detected from file)',
          detected: {
            title: bookStructure.title,
            author: bookStructure.author,
            hasChapters: bookStructure.hasChapters,
            chapterCount: bookStructure.chapters.length
          }
        });
      }

      // Use a default author if not provided
      if (!author) {
        author = 'Unknown Author';
      }

      // Determine if we should use chapter-based or paragraph-based processing
      let paragraphs: string[];

      if (bookStructure.hasChapters && bookStructure.chapters.length > 1) {
        // Use chapter content as paragraphs for now
        // (You could extend the schema to support chapters properly)
        paragraphs = bookStructure.chapters
          .map(chapter => `**${chapter.title}**\n\n${chapter.content}`)
          .flatMap(chapterText => splitIntoParagraphs(chapterText))
          .filter(p => p.length > 20);
      } else {
        // Standard paragraph splitting
        paragraphs = splitIntoParagraphs(content);
      }

      if (paragraphs.length === 0) {
        return res
          .status(400)
          .json({ error: 'No valid paragraphs found in file' });
      }

      // Create book and paragraphs in a transaction
      const book = await prisma.$transaction(async (tx) => {
        // Create book
        const newBook = await tx.book.create({
          data: {
            title,
            author,
            userId: req.user!.id,
          },
        });

        // Create paragraphs
        for (let i = 0; i < paragraphs.length; i++) {
          await tx.paragraph.create({
            data: {
              bookId: newBook.id,
              order: i + 1,
              content: paragraphs[i],
            },
          });
        }

        return newBook;
      });

      // Fetch the complete book with paragraphs
      const completeBook = await prisma.book.findUnique({
        where: { id: book.id },
        include: {
          paragraphs: {
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              paragraphs: true,
            },
          },
        },
      });

      // Include detection results in response
      const response = {
        ...completeBook,
        detectionResults: {
          detectedTitle: bookStructure.title,
          detectedAuthor: bookStructure.author,
          hasChapters: bookStructure.hasChapters,
          chapterCount: bookStructure.chapters.length,
          chapters: bookStructure.chapters.map(chapter => ({
            title: chapter.title,
            contentLength: chapter.content.length
          })),
          usedDetectedTitle: !req.body.title && !!bookStructure.title,
          usedDetectedAuthor: !req.body.author && !!bookStructure.author,
        }
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error uploading book:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Analyze book structure (preview without uploading)
router.post(
  '/analyze',
  authenticateToken,
  // requireAdmin, // Temporarily disabled for testing
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      let content: string;
      let extractionMethod = 'traditional';

      // Extract text based on file type
      if (file.mimetype === 'application/pdf') {
        // Configure AI extraction options
        const aiConfig = {
          enabled: process.env.ENABLE_AI_EXTRACTION === 'true',
          fallbackThreshold: parseInt(process.env.AI_FALLBACK_THRESHOLD || '100'),
          provider: (process.env.AI_PROVIDER as any) || 'openai',
          apiKey: process.env.OPENAI_API_KEY
        };

        const extractionResult = await extractTextFromPDF(file.buffer, aiConfig);
        content = extractionResult.text;
        extractionMethod = extractionResult.method;

        console.log(`PDF extraction completed using method: ${extractionMethod}`);
      } else if (file.mimetype === 'text/plain') {
        content = file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      // Analyze book structure
      const bookStructure = analyzeBookStructure(content, extractionMethod);      // Get paragraph count for different processing methods
      const standardParagraphs = splitIntoParagraphs(content);
      const chapterBasedParagraphs = bookStructure.hasChapters
        ? bookStructure.chapters
          .flatMap(chapter => splitIntoParagraphs(chapter.content))
          .filter(p => p.length > 20)
        : [];

      const analysis = {
        fileName: file.originalname,
        fileSize: file.size,
        extractionMethod: bookStructure.extractionMethod || extractionMethod,
        detectedTitle: bookStructure.title,
        detectedAuthor: bookStructure.author,
        hasChapters: bookStructure.hasChapters,
        chapterCount: bookStructure.chapters.length,
        textQuality: {
          totalLength: content.length,
          hasStructure: bookStructure.hasChapters,
          confidence: content.length > 1000 ? 'high' : content.length > 100 ? 'medium' : 'low'
        },
        chapters: bookStructure.chapters.map(chapter => ({
          title: chapter.title,
          contentLength: chapter.content.length,
          paragraphCount: splitIntoParagraphs(chapter.content).length
        })),
        paragraphCounts: {
          standard: standardParagraphs.length,
          chapterBased: chapterBasedParagraphs.length
        },
        contentPreview: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        recommendations: {
          useDetectedTitle: !!bookStructure.title,
          useDetectedAuthor: !!bookStructure.author,
          useChapterStructure: bookStructure.hasChapters && bookStructure.chapters.length > 1
        }
      };

      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing book:', error);

      // Provide more specific error messages
      let errorMessage = 'Failed to analyze file';
      if (error instanceof Error) {
        if (error.message.includes('PDF')) {
          errorMessage = 'Failed to read PDF file. Please ensure the file is not corrupted.';
        } else if (error.message.includes('parse')) {
          errorMessage = 'Failed to parse file content. Please try a different file.';
        } else {
          errorMessage = `Analysis error: ${error.message}`;
        }
      }

      res.status(500).json({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// Delete book
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await prisma.book.delete({
      where: { id },
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search books
router.get(
  '/search/:query',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { query } = req.params;

      const books = await prisma.book.findMany({
        where: {
          userId: req.user!.id,
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              author: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              paragraphs: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json(books);
    } catch (error) {
      console.error('Error searching books:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
