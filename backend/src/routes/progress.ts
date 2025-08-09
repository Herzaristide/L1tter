import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all progress for the current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const progress = await prisma.progress.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        book: {
          include: {
            authors: {
              include: {
                author: true,
              },
            },
          },
        },
        paragraph: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get progress for a specific book
router.get(
  '/book/:bookId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { bookId } = req.params;

      const progress = await prisma.progress.findFirst({
        where: {
          userId: req.user!.id,
          bookId: bookId,
        },
        include: {
          book: {
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
            },
          },
          paragraph: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      if (!progress) {
        return res.json(null);
      }

      res.json(progress);
    } catch (error) {
      console.error('Error fetching book progress:', error);
      res.status(500).json({ error: 'Failed to fetch book progress' });
    }
  }
);

// Create or update progress
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { paragraphId, position } = req.body;

    if (!paragraphId || position === undefined) {
      return res
        .status(400)
        .json({ error: 'paragraphId and position are required' });
    }

    // Get paragraph to find the book
    const paragraph = await prisma.paragraph.findUnique({
      where: { id: paragraphId },
      include: { book: true },
    });

    if (!paragraph) {
      return res.status(404).json({ error: 'Paragraph not found' });
    }

    // Check if progress already exists for this user and book
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId: req.user!.id,
        bookId: paragraph.bookId,
      },
    });

    let progress;
    if (existingProgress) {
      // Update existing progress
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          paragraphId,
          position,
          updatedAt: new Date(),
        },
        include: {
          book: {
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
            },
          },
          paragraph: true,
        },
      });
    } else {
      // Create new progress
      progress = await prisma.progress.create({
        data: {
          userId: req.user!.id,
          bookId: paragraph.bookId,
          paragraphId,
          position,
        },
        include: {
          book: {
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
            },
          },
          paragraph: true,
        },
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get reading statistics and currently reading books
router.get(
  '/stats',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get all progress for the user
      const allProgress = await prisma.progress.findMany({
        where: { userId },
        include: {
          book: {
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
              _count: {
                select: {
                  paragraphs: true,
                },
              },
            },
          },
          paragraph: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Group by book and get the latest progress for each
      const bookProgressMap = new Map();
      allProgress.forEach((progress) => {
        if (!bookProgressMap.has(progress.bookId)) {
          bookProgressMap.set(progress.bookId, progress);
        }
      });

      const currentlyReading = Array.from(bookProgressMap.values())
        .filter((progress) => progress.position < 100) // Not completed
        .map((progress) => ({
          ...progress.book,
          progress: {
            position: progress.position,
            paragraphId: progress.paragraphId,
            updatedAt: progress.updatedAt,
          },
        }));

      const completed = Array.from(bookProgressMap.values())
        .filter((progress) => progress.position >= 100)
        .map((progress) => progress.book);

      const stats = {
        totalBooks: bookProgressMap.size,
        currentlyReading,
        completed,
        completedCount: completed.length,
        inProgressCount: currentlyReading.length,
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching reading stats:', error);
      res.status(500).json({ error: 'Failed to fetch reading stats' });
    }
  }
);

// Mark paragraph as completed
router.post(
  '/complete/:paragraphId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { paragraphId } = req.params;

      // Get paragraph to find the book
      const paragraph = await prisma.paragraph.findUnique({
        where: { id: paragraphId },
        include: {
          book: {
            include: {
              _count: {
                select: {
                  paragraphs: true,
                },
              },
            },
          },
        },
      });

      if (!paragraph) {
        return res.status(404).json({ error: 'Paragraph not found' });
      }

      // Calculate position as 100% if this is the last paragraph
      const totalParagraphs = paragraph.book._count.paragraphs;
      const paragraphOrder = paragraph.order || 1;
      const position = Math.min(100, (paragraphOrder / totalParagraphs) * 100);

      // Update or create progress
      const progress = await prisma.progress.upsert({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId: paragraph.bookId,
          },
        },
        update: {
          paragraphId,
          position,
          updatedAt: new Date(),
        },
        create: {
          userId: req.user!.id,
          bookId: paragraph.bookId,
          paragraphId,
          position,
        },
        include: {
          book: {
            include: {
              authors: {
                include: {
                  author: true,
                },
              },
            },
          },
          paragraph: true,
        },
      });

      res.json(progress);
    } catch (error) {
      console.error('Error completing paragraph:', error);
      res.status(500).json({ error: 'Failed to complete paragraph' });
    }
  }
);

// Delete progress for a paragraph
router.delete(
  '/:paragraphId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { paragraphId } = req.params;

      await prisma.progress.deleteMany({
        where: {
          userId: req.user!.id,
          paragraphId,
        },
      });

      res.json({ message: 'Progress deleted successfully' });
    } catch (error) {
      console.error('Error deleting progress:', error);
      res.status(500).json({ error: 'Failed to delete progress' });
    }
  }
);

export default router;
