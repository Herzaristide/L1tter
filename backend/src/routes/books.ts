import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  splitIntoParagraphs,
  extractTextFromPDF,
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
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
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
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const { title, author } = req.body;
      const file = req.file;

      if (!title || !author) {
        return res.status(400).json({ error: 'Title and author are required' });
      }

      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }

      let content: string;

      // Extract text based on file type
      if (file.mimetype === 'application/pdf') {
        content = await extractTextFromPDF(file.buffer);
      } else if (file.mimetype === 'text/plain') {
        content = file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      // Split content into paragraphs
      const paragraphs = splitIntoParagraphs(content);

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

      res.status(201).json(completeBook);
    } catch (error) {
      console.error('Error uploading book:', error);
      res.status(500).json({ error: 'Internal server error' });
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
