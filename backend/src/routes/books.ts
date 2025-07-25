import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all books with search and filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      language = 'en',
      tag,
      author,
      collection,
      isPublic,
      page = '1',
      limit = '10',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      ...(isPublic === 'true' ? { isPublic: true } : {}),
      ...(collection ? { collectionId: collection as string } : {}),
      deletedAt: null,
    };

    // Search in book locales
    if (search) {
      where.locales = {
        some: {
          OR: [{ title: { contains: search as string, mode: 'insensitive' } }],
        },
      };
    }

    // Filter by author
    if (author) {
      where.authors = {
        some: {
          author: {
            name: { contains: author as string, mode: 'insensitive' },
          },
        },
      };
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { contains: tag as string, mode: 'insensitive' },
          },
        },
      };
    }

    const books = await prisma.book.findMany({
      where,
      skip,
      take,
      include: {
        locales: {
          where: { language: language as string },
          take: 1,
        },
        authors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                bio: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            chapters: true,
            ratings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average ratings
    const booksWithRatings = books.map((book) => {
      const avgRating =
        book.ratings.length > 0
          ? book.ratings.reduce((sum, r) => sum + r.rating, 0) /
            book.ratings.length
          : null;

      const { ratings, ...bookWithoutRatings } = book;
      return {
        ...bookWithoutRatings,
        averageRating: avgRating,
      };
    });

    const totalBooks = await prisma.book.count({ where });

    res.json({
      books: booksWithRatings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalBooks,
        pages: Math.ceil(totalBooks / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single book by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        locales: true,
        authors: {
          include: {
            author: {
              include: {
                links: true,
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
          },
        },
        chapters: {
          where: { deletedAt: null },
          include: {
            locales: {
              where: { language: language as string },
            },
            _count: {
              select: {
                notes: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
            description: true,
            isPublic: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            chapters: true,
            ratings: true,
            Note: true,
          },
        },
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if book is accessible (public or user owns it)
    if (!book.isPublic && book.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate average rating
    const avgRating =
      book.ratings.length > 0
        ? book.ratings.reduce((sum, r) => sum + r.rating, 0) /
          book.ratings.length
        : null;

    res.json({
      ...book,
      averageRating: avgRating,
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new book
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      language = 'en',
      imageUrl,
      collectionId,
      isPublic = false,
      authorIds = [],
      tagIds = [],
      chapters = [],
    } = req.body;

    const book = await prisma.$transaction(async (tx) => {
      // Create book
      const newBook = await tx.book.create({
        data: {
          userId: req.user!.id,
          collectionId,
          isPublic,
          createdBy: req.user!.id,
        },
      });

      // Create book locale
      await tx.bookLocale.create({
        data: {
          bookId: newBook.id,
          language,
          title,
          imageUrl,
        },
      });

      // Connect authors
      if (authorIds.length > 0) {
        await tx.bookAuthor.createMany({
          data: authorIds.map((authorId: string) => ({
            bookId: newBook.id,
            authorId,
          })),
        });
      }

      // Connect tags
      if (tagIds.length > 0) {
        await tx.bookTag.createMany({
          data: tagIds.map((tagId: string) => ({
            bookId: newBook.id,
            tagId,
          })),
        });
      }

      // Create chapters if provided
      if (chapters.length > 0) {
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          const newChapter = await tx.chapter.create({
            data: {
              bookId: newBook.id,
              order: i + 1,
              createdBy: req.user!.id,
            },
          });

          await tx.chapterLocale.create({
            data: {
              chapterId: newChapter.id,
              language,
              title: chapter.title || `Chapter ${i + 1}`,
              content: chapter.content,
            },
          });
        }
      }

      return newBook;
    });

    // Fetch complete book data
    const completeBook = await prisma.book.findUnique({
      where: { id: book.id },
      include: {
        locales: true,
        authors: {
          include: {
            author: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        chapters: {
          include: {
            locales: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json({
      message: 'Book created successfully',
      book: completeBook,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update book
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isPublic, collectionId, orderInCollection } = req.body;

      // Check if user owns the book
      const existingBook = await prisma.book.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingBook) {
        return res.status(404).json({ error: 'Book not found' });
      }

      if (existingBook.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const book = await prisma.book.update({
        where: { id },
        data: {
          isPublic,
          collectionId,
          orderInCollection,
          updatedBy: req.user!.id,
          updatedAt: new Date(),
        },
        include: {
          locales: true,
          authors: {
            include: {
              author: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      res.json({
        message: 'Book updated successfully',
        book,
      });
    } catch (error) {
      console.error('Update book error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Rate book
router.post(
  '/:id/rate',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: 'Rating must be between 1 and 5' });
      }

      const bookRating = await prisma.bookRating.upsert({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId: id,
          },
        },
        update: {
          rating,
          comment,
          updatedAt: new Date(),
        },
        create: {
          userId: req.user!.id,
          bookId: id,
          rating,
          comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      });

      res.json({
        message: 'Rating saved successfully',
        rating: bookRating,
      });
    } catch (error) {
      console.error('Rate book error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get book ratings
router.get('/:id/ratings', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const ratings = await prisma.bookRating.findMany({
      where: { bookId: id },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRatings = await prisma.bookRating.count({
      where: { bookId: id },
    });

    // Calculate average rating
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

    res.json({
      ratings,
      averageRating: avgRating,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalRatings,
        pages: Math.ceil(totalRatings / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get book ratings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete book
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user owns the book
      const existingBook = await prisma.book.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingBook) {
        return res.status(404).json({ error: 'Book not found' });
      }

      if (existingBook.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.book.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: req.user!.id,
        },
      });

      res.json({ message: 'Book deleted successfully' });
    } catch (error) {
      console.error('Delete book error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
