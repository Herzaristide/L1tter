import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get paragraphs for a book
router.get('/book/:bookId', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { bookId } = req.params;
    const {
      chapter,
      page = 1,
      limit = 50,
      includeNotes = false,
      includeProgress = false,
      includeRatings = false,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      bookId,
      deletedAt: null,
    };

    if (chapter) {
      where.chapterNumber = Number(chapter);
    }

    // Check if book is accessible to user
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        OR: [
          { isPublic: true },
          ...(req.user ? [{ userId: req.user.id }] : []),
        ],
        deletedAt: null,
      },
    });

    if (!book) {
      return res
        .status(404)
        .json({ error: 'Book not found or not accessible' });
    }

    const includeOptions: any = {};

    if (includeNotes && req.user) {
      includeOptions.notes = {
        where: {
          OR: [{ userId: req.user.id }, { isPublic: true }],
          deletedAt: null,
        },
        include: {
          user: { select: { id: true, name: true } },
          tags: {
            include: {
              tag: { select: { id: true, name: true } },
            },
          },
        },
      };
    }

    if (includeProgress && req.user) {
      includeOptions.progress = {
        where: { userId: req.user.id },
      };
    }

    if (includeRatings && req.user) {
      includeOptions.ratings = {
        where: {
          OR: [
            { userId: req.user.id },
            // Could add public ratings logic here
          ],
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      };
    }

    const [paragraphs, total] = await Promise.all([
      prisma.paragraph.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { order: 'asc' },
        include: includeOptions,
      }),
      prisma.paragraph.count({ where }),
    ]);

    res.json({
      paragraphs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching paragraphs:', error);
    res.status(500).json({ error: 'Failed to fetch paragraphs' });
  }
});

// Get a specific paragraph
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { includeNotes = false, includeProgress = false } = req.query;

    const includeOptions: any = {
      book: {
        select: {
          id: true,
          title: true,
          isPublic: true,
          userId: true,
        },
      },
    };

    if (includeNotes && req.user) {
      includeOptions.notes = {
        where: {
          OR: [{ userId: req.user.id }, { isPublic: true }],
          deletedAt: null,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      };
    }

    if (includeProgress && req.user) {
      includeOptions.progress = {
        where: { userId: req.user.id },
      };
    }

    const paragraph = await prisma.paragraph.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: includeOptions,
    });

    if (!paragraph) {
      return res.status(404).json({ error: 'Paragraph not found' });
    }

    // Check if paragraph is accessible
    const isAccessible =
      (paragraph.book as any).isPublic ||
      (req.user && (paragraph.book as any).userId === req.user.id);

    if (!isAccessible) {
      return res.status(403).json({ error: 'Access denied to this paragraph' });
    }

    res.json(paragraph);
  } catch (error) {
    console.error('Error fetching paragraph:', error);
    res.status(500).json({ error: 'Failed to fetch paragraph' });
  }
});

// Create a new paragraph (authenticated users only - for their own books)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { bookId, content, order, chapterNumber, readingTimeEst } = req.body;

    // Verify user owns the book or has permission
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: req.user!.id,
        deletedAt: null,
      },
    });

    if (!book) {
      return res.status(404).json({
        error: 'Book not found or you do not have permission to edit it',
      });
    }

    const paragraph = await prisma.paragraph.create({
      data: {
        bookId,
        content,
        order,
        chapterNumber,
        readingTimeEst,
        createdBy: req.user!.id,
      },
      include: {
        book: {
          select: { id: true, title: true },
        },
      },
    });

    res.status(201).json(paragraph);
  } catch (error) {
    console.error('Error creating paragraph:', error);
    res.status(500).json({ error: 'Failed to create paragraph' });
  }
});

// Update a paragraph
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, order, chapterNumber, readingTimeEst } = req.body;

    // Check if user owns the book containing this paragraph
    const paragraph = await prisma.paragraph.findFirst({
      where: { id, deletedAt: null },
      include: {
        book: { select: { id: true, userId: true } },
      },
    });

    if (!paragraph) {
      return res.status(404).json({ error: 'Paragraph not found' });
    }

    if (paragraph.book.userId !== req.user!.id) {
      return res.status(403).json({
        error: 'You do not have permission to edit this paragraph',
      });
    }

    const updatedParagraph = await prisma.paragraph.update({
      where: { id },
      data: {
        content,
        order,
        chapterNumber,
        readingTimeEst,
        updatedBy: req.user!.id,
      },
      include: {
        book: {
          select: { id: true, title: true },
        },
      },
    });

    res.json(updatedParagraph);
  } catch (error) {
    console.error('Error updating paragraph:', error);
    res.status(500).json({ error: 'Failed to update paragraph' });
  }
});

// Soft delete a paragraph
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the book containing this paragraph
    const paragraph = await prisma.paragraph.findFirst({
      where: { id, deletedAt: null },
      include: {
        book: { select: { id: true, userId: true } },
      },
    });

    if (!paragraph) {
      return res.status(404).json({ error: 'Paragraph not found' });
    }

    if (paragraph.book.userId !== req.user!.id) {
      return res.status(403).json({
        error: 'You do not have permission to delete this paragraph',
      });
    }

    await prisma.paragraph.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: req.user!.id,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting paragraph:', error);
    res.status(500).json({ error: 'Failed to delete paragraph' });
  }
});

// Get chapter structure for a book
router.get(
  '/book/:bookId/chapters',
  optionalAuth,
  async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;

      // Check if book is accessible
      const book = await prisma.book.findFirst({
        where: {
          id: bookId,
          OR: [
            { isPublic: true },
            ...(req.user ? [{ userId: req.user.id }] : []),
          ],
          deletedAt: null,
        },
      });

      if (!book) {
        return res
          .status(404)
          .json({ error: 'Book not found or not accessible' });
      }

      const chapters = await prisma.paragraph.groupBy({
        by: ['chapterNumber'],
        where: {
          bookId,
          deletedAt: null,
          chapterNumber: { not: null },
        },
        _count: {
          id: true,
        },
        _sum: {
          readingTimeEst: true,
        },
        orderBy: {
          chapterNumber: 'asc',
        },
      });

      const chaptersWithDetails = chapters.map((chapter) => ({
        chapterNumber: chapter.chapterNumber,
        paragraphCount: chapter._count.id,
        totalReadingTime: chapter._sum.readingTimeEst || 0,
      }));

      res.json(chaptersWithDetails);
    } catch (error) {
      console.error('Error fetching chapter structure:', error);
      res.status(500).json({ error: 'Failed to fetch chapter structure' });
    }
  }
);

export default router;
