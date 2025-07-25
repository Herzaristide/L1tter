import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user's reading progress
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bookId, chapterId } = req.query;

    const where: any = {
      userId: req.user!.id,
      ...(bookId ? { chapter: { bookId } } : {}),
      ...(chapterId ? { chapterId } : {}),
    };

    const progress = await prisma.progress.findMany({
      where,
      include: {
        chapter: {
          include: {
            book: {
              include: {
                locales: {
                  where: { language: 'en' },
                  take: 1,
                },
              },
            },
            locales: {
              where: { language: 'en' },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reading progress for a specific book
router.get(
  '/book/:bookId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { bookId } = req.params;

      // Get book with chapters and user's progress
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: {
          locales: {
            where: { language: 'en' },
            take: 1,
          },
          chapters: {
            where: { deletedAt: null },
            include: {
              locales: {
                where: { language: 'en' },
                take: 1,
              },
              progress: {
                where: { userId: req.user!.id },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      // Calculate overall progress
      const chaptersWithProgress = book.chapters.filter(
        (chapter) => chapter.progress.length > 0
      );
      const totalChapters = book.chapters.length;
      const progressPercentage =
        totalChapters > 0
          ? (chaptersWithProgress.length / totalChapters) * 100
          : 0;

      // Find current chapter (last chapter with progress or first chapter)
      const currentChapter =
        chaptersWithProgress.length > 0
          ? chaptersWithProgress[chaptersWithProgress.length - 1]
          : book.chapters[0];

      res.json({
        book: {
          id: book.id,
          title: book.locales[0]?.title || 'Untitled',
          totalChapters,
          completedChapters: chaptersWithProgress.length,
          progressPercentage: Math.round(progressPercentage),
          currentChapter: currentChapter
            ? {
                id: currentChapter.id,
                order: currentChapter.order,
                title:
                  currentChapter.locales[0]?.title ||
                  `Chapter ${currentChapter.order}`,
                position: currentChapter.progress[0]?.position || 0,
                lastRead: currentChapter.progress[0]?.updatedAt || null,
              }
            : null,
        },
        chapters: book.chapters.map((chapter) => ({
          id: chapter.id,
          order: chapter.order,
          title: chapter.locales[0]?.title || `Chapter ${chapter.order}`,
          hasProgress: chapter.progress.length > 0,
          position: chapter.progress[0]?.position || 0,
          lastRead: chapter.progress[0]?.updatedAt || null,
        })),
      });
    } catch (error) {
      console.error('Get book progress error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update reading progress
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId, position } = req.body;

    if (!chapterId || position === undefined) {
      return res
        .status(400)
        .json({ error: 'chapterId and position are required' });
    }

    // Verify chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, bookId: true },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Upsert progress
    const progress = await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId: req.user!.id,
          chapterId,
        },
      },
      update: {
        position,
        updatedAt: new Date(),
      },
      create: {
        userId: req.user!.id,
        chapterId,
        position,
      },
      include: {
        chapter: {
          include: {
            book: {
              include: {
                locales: {
                  where: { language: 'en' },
                  take: 1,
                },
              },
            },
            locales: {
              where: { language: 'en' },
              take: 1,
            },
          },
        },
      },
    });

    res.json({
      message: 'Progress updated successfully',
      progress,
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark chapter as completed
router.post(
  '/complete/:chapterId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { chapterId } = req.params;

      // Get chapter to determine content length
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          locales: {
            where: { language: 'en' },
            take: 1,
          },
        },
      });

      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }

      // Set position to end of content (or a large number if no content)
      const contentLength = chapter.locales[0]?.content?.length || 1000;

      const progress = await prisma.progress.upsert({
        where: {
          userId_chapterId: {
            userId: req.user!.id,
            chapterId,
          },
        },
        update: {
          position: contentLength,
          updatedAt: new Date(),
        },
        create: {
          userId: req.user!.id,
          chapterId,
          position: contentLength,
        },
        include: {
          chapter: {
            include: {
              book: {
                include: {
                  locales: {
                    where: { language: 'en' },
                    take: 1,
                  },
                },
              },
              locales: {
                where: { language: 'en' },
                take: 1,
              },
            },
          },
        },
      });

      res.json({
        message: 'Chapter marked as completed',
        progress,
      });
    } catch (error) {
      console.error('Complete chapter error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get reading statistics
router.get(
  '/stats',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get total books started (books with at least one progress record)
      const booksStarted = await prisma.book.count({
        where: {
          chapters: {
            some: {
              progress: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      });

      // Get total chapters read
      const chaptersRead = await prisma.progress.count({
        where: { userId },
      });

      // Get books completed (all chapters have progress)
      const allBooks = await prisma.book.findMany({
        where: {
          chapters: {
            some: {
              progress: {
                some: {
                  userId,
                },
              },
            },
          },
        },
        include: {
          chapters: {
            where: { deletedAt: null },
            include: {
              progress: {
                where: { userId },
              },
            },
          },
        },
      });

      const booksCompleted = allBooks.filter(
        (book) =>
          book.chapters.length > 0 &&
          book.chapters.every((chapter) => chapter.progress.length > 0)
      ).length;

      // Get recent reading activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await prisma.progress.count({
        where: {
          userId,
          updatedAt: {
            gte: sevenDaysAgo,
          },
        },
      });

      // Get favorite authors (most read)
      const authorStats = await prisma.progress.groupBy({
        by: ['chapterId'],
        where: { userId },
        _count: {
          chapterId: true,
        },
      });

      // Get currently reading books
      const currentlyReading = await prisma.progress.findMany({
        where: { userId },
        include: {
          chapter: {
            include: {
              book: {
                include: {
                  locales: {
                    where: { language: 'en' },
                    take: 1,
                  },
                  authors: {
                    include: {
                      author: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              locales: {
                where: { language: 'en' },
                take: 1,
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });

      res.json({
        stats: {
          booksStarted,
          booksCompleted,
          chaptersRead,
          recentActivity,
          readingStreak: 0, // Could be calculated based on daily reading activity
        },
        currentlyReading: currentlyReading.map((progress) => ({
          book: {
            id: progress.chapter.book.id,
            title: progress.chapter.book.locales[0]?.title || 'Untitled',
            authors: progress.chapter.book.authors.map((ba) => ba.author.name),
          },
          chapter: {
            id: progress.chapter.id,
            order: progress.chapter.order,
            title:
              progress.chapter.locales[0]?.title ||
              `Chapter ${progress.chapter.order}`,
          },
          position: progress.position,
          lastRead: progress.updatedAt,
        })),
      });
    } catch (error) {
      console.error('Get progress stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete progress record
router.delete(
  '/:chapterId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { chapterId } = req.params;

      await prisma.progress.delete({
        where: {
          userId_chapterId: {
            userId: req.user!.id,
            chapterId,
          },
        },
      });

      res.json({ message: 'Progress deleted successfully' });
    } catch (error) {
      console.error('Delete progress error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
