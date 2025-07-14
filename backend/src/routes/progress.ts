import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's reading progress for all books
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.progress.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
        paragraph: {
          select: {
            id: true,
            order: true,
            content: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reading progress for a specific book
router.get(
  '/book/:bookId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;

      // Verify book belongs to user
      const book = await prisma.book.findFirst({
        where: {
          id: bookId,
          userId: req.user!.id,
        },
      });

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const progress = await prisma.progress.findUnique({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId,
          },
        },
        include: {
          chapter: {
            select: {
              id: true,
              number: true,
              title: true,
            },
          },
          paragraph: {
            select: {
              id: true,
              order: true,
              content: true,
            },
          },
        },
      });

      res.json(progress);
    } catch (error) {
      console.error('Error fetching book progress:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update reading progress
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { bookId, chapterId, paragraphId, position } = req.body;

    if (!bookId || !chapterId || !paragraphId || position === undefined) {
      return res.status(400).json({
        error: 'bookId, chapterId, paragraphId, and position are required',
      });
    }

    // Verify all entities belong to the user
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId: req.user!.id,
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        bookId,
      },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const paragraph = await prisma.paragraph.findFirst({
      where: {
        id: paragraphId,
        chapterId,
      },
    });

    if (!paragraph) {
      return res.status(404).json({ error: 'Paragraph not found' });
    }

    // Upsert progress
    const progress = await prisma.progress.upsert({
      where: {
        userId_bookId: {
          userId: req.user!.id,
          bookId,
        },
      },
      update: {
        chapterId,
        paragraphId,
        position,
      },
      create: {
        userId: req.user!.id,
        bookId,
        chapterId,
        paragraphId,
        position,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
        chapter: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
        paragraph: {
          select: {
            id: true,
            order: true,
            content: true,
          },
        },
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete reading progress for a book
router.delete(
  '/book/:bookId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;

      const progress = await prisma.progress.findUnique({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId,
          },
        },
      });

      if (!progress) {
        return res.status(404).json({ error: 'Progress not found' });
      }

      await prisma.progress.delete({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId,
          },
        },
      });

      res.json({ message: 'Progress deleted successfully' });
    } catch (error) {
      console.error('Error deleting progress:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
