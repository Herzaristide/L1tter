import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  optionalAuth,
  AuthRequest,
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Book Ratings Routes

// Get book ratings
router.get('/books/:bookId', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { bookId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Check if book exists and is accessible
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

    const [ratings, total, averageRating] = await Promise.all([
      prisma.bookRating.findMany({
        where: { bookId },
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.bookRating.count({ where: { bookId } }),
      prisma.bookRating.aggregate({
        where: { bookId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    res.json({
      ratings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      statistics: {
        averageRating: averageRating._avg.rating || 0,
        totalRatings: averageRating._count.rating,
      },
    });
  } catch (error) {
    console.error('Error fetching book ratings:', error);
    res.status(500).json({ error: 'Failed to fetch book ratings' });
  }
});

// Create or update book rating
router.post(
  '/books/:bookId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;
      const { rating, comment } = req.body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: 'Rating must be between 1 and 5' });
      }

      // Check if book exists and is accessible
      const book = await prisma.book.findFirst({
        where: {
          id: bookId,
          OR: [{ isPublic: true }, { userId: req.user!.id }],
          deletedAt: null,
        },
      });

      if (!book) {
        return res
          .status(404)
          .json({ error: 'Book not found or not accessible' });
      }

      const bookRating = await prisma.bookRating.upsert({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId,
          },
        },
        update: {
          rating,
          comment,
        },
        create: {
          userId: req.user!.id,
          bookId,
          rating,
          comment,
        },
        include: {
          user: { select: { id: true, name: true } },
          book: { select: { id: true, title: true } },
        },
      });

      res.json(bookRating);
    } catch (error) {
      console.error('Error creating/updating book rating:', error);
      res.status(500).json({ error: 'Failed to create/update book rating' });
    }
  }
);

// Delete book rating
router.delete(
  '/books/:bookId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;

      const deletedRating = await prisma.bookRating.delete({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId,
          },
        },
      });

      res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Rating not found' });
      }
      console.error('Error deleting book rating:', error);
      res.status(500).json({ error: 'Failed to delete book rating' });
    }
  }
);

// Paragraph Ratings Routes

// Get paragraph ratings
router.get(
  '/paragraphs/:paragraphId',
  optionalAuth,
  async (req: AuthRequest, res) => {
    try {
      const { paragraphId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Check if paragraph exists and is accessible
      const paragraph = await prisma.paragraph.findFirst({
        where: {
          id: paragraphId,
          deletedAt: null,
        },
        include: {
          book: {
            select: { id: true, isPublic: true, userId: true },
          },
        },
      });

      if (!paragraph) {
        return res.status(404).json({ error: 'Paragraph not found' });
      }

      const isAccessible =
        paragraph.book.isPublic ||
        (req.user && paragraph.book.userId === req.user.id);

      if (!isAccessible) {
        return res
          .status(403)
          .json({ error: 'Access denied to this paragraph' });
      }

      const [ratings, total, averageRating] = await Promise.all([
        prisma.paragraphRating.findMany({
          where: { paragraphId },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        }),
        prisma.paragraphRating.count({ where: { paragraphId } }),
        prisma.paragraphRating.aggregate({
          where: { paragraphId },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      res.json({
        ratings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        statistics: {
          averageRating: averageRating._avg.rating || 0,
          totalRatings: averageRating._count.rating,
        },
      });
    } catch (error) {
      console.error('Error fetching paragraph ratings:', error);
      res.status(500).json({ error: 'Failed to fetch paragraph ratings' });
    }
  }
);

// Create or update paragraph rating
router.post(
  '/paragraphs/:paragraphId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { paragraphId } = req.params;
      const { rating, comment } = req.body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: 'Rating must be between 1 and 5' });
      }

      // Check if paragraph exists and is accessible
      const paragraph = await prisma.paragraph.findFirst({
        where: {
          id: paragraphId,
          deletedAt: null,
        },
        include: {
          book: {
            select: { id: true, isPublic: true, userId: true },
          },
        },
      });

      if (!paragraph) {
        return res.status(404).json({ error: 'Paragraph not found' });
      }

      const isAccessible =
        paragraph.book.isPublic || paragraph.book.userId === req.user!.id;

      if (!isAccessible) {
        return res
          .status(403)
          .json({ error: 'Access denied to this paragraph' });
      }

      const paragraphRating = await prisma.paragraphRating.upsert({
        where: {
          userId_paragraphId: {
            userId: req.user!.id,
            paragraphId,
          },
        },
        update: {
          rating,
          comment,
        },
        create: {
          userId: req.user!.id,
          paragraphId,
          rating,
          comment,
        },
        include: {
          user: { select: { id: true, name: true } },
          paragraph: {
            select: {
              id: true,
              content: true,
              book: { select: { id: true, title: true } },
            },
          },
        },
      });

      res.json(paragraphRating);
    } catch (error) {
      console.error('Error creating/updating paragraph rating:', error);
      res
        .status(500)
        .json({ error: 'Failed to create/update paragraph rating' });
    }
  }
);

// Delete paragraph rating
router.delete(
  '/paragraphs/:paragraphId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { paragraphId } = req.params;

      await prisma.paragraphRating.delete({
        where: {
          userId_paragraphId: {
            userId: req.user!.id,
            paragraphId,
          },
        },
      });

      res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Rating not found' });
      }
      console.error('Error deleting paragraph rating:', error);
      res.status(500).json({ error: 'Failed to delete paragraph rating' });
    }
  }
);

// Author Ratings Routes

// Get author ratings
router.get('/authors/:authorId', async (req: AuthRequest, res) => {
  try {
    const { authorId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Check if author exists
    const author = await prisma.author.findFirst({
      where: {
        id: authorId,
        deletedAt: null,
      },
    });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const [ratings, total, averageRating] = await Promise.all([
      prisma.authorRating.findMany({
        where: { authorId },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.authorRating.count({ where: { authorId } }),
      prisma.authorRating.aggregate({
        where: { authorId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    res.json({
      ratings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      statistics: {
        averageRating: averageRating._avg.rating || 0,
        totalRatings: averageRating._count.rating,
      },
    });
  } catch (error) {
    console.error('Error fetching author ratings:', error);
    res.status(500).json({ error: 'Failed to fetch author ratings' });
  }
});

// Create or update author rating
router.post(
  '/authors/:authorId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { authorId } = req.params;
      const { rating, comment } = req.body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: 'Rating must be between 1 and 5' });
      }

      // Check if author exists
      const author = await prisma.author.findFirst({
        where: {
          id: authorId,
          deletedAt: null,
        },
      });

      if (!author) {
        return res.status(404).json({ error: 'Author not found' });
      }

      const authorRating = await prisma.authorRating.upsert({
        where: {
          userId_authorId: {
            userId: req.user!.id,
            authorId,
          },
        },
        update: {
          rating,
          comment,
        },
        create: {
          userId: req.user!.id,
          authorId,
          rating,
          comment,
        },
        include: {
          user: { select: { id: true, name: true } },
          author: { select: { id: true, name: true } },
        },
      });

      res.json(authorRating);
    } catch (error) {
      console.error('Error creating/updating author rating:', error);
      res.status(500).json({ error: 'Failed to create/update author rating' });
    }
  }
);

// Delete author rating
router.delete(
  '/authors/:authorId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { authorId } = req.params;

      await prisma.authorRating.delete({
        where: {
          userId_authorId: {
            userId: req.user!.id,
            authorId,
          },
        },
      });

      res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Rating not found' });
      }
      console.error('Error deleting author rating:', error);
      res.status(500).json({ error: 'Failed to delete author rating' });
    }
  }
);

// Get user's ratings
router.get('/my-ratings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let ratings = [];
    let total = 0;

    if (type === 'books' || type === 'all') {
      const [bookRatings, bookTotal] = await Promise.all([
        prisma.bookRating.findMany({
          where: { userId: req.user!.id },
          skip: type === 'books' ? skip : 0,
          take: type === 'books' ? Number(limit) : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
            book: { select: { id: true, title: true, imageUrl: true } },
          },
        }),
        prisma.bookRating.count({ where: { userId: req.user!.id } }),
      ]);

      ratings.push(...bookRatings.map((r) => ({ ...r, type: 'book' })));
      total += bookTotal;
    }

    if (type === 'paragraphs' || type === 'all') {
      const [paragraphRatings, paragraphTotal] = await Promise.all([
        prisma.paragraphRating.findMany({
          where: { userId: req.user!.id },
          skip: type === 'paragraphs' ? skip : 0,
          take: type === 'paragraphs' ? Number(limit) : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
            paragraph: {
              select: {
                id: true,
                content: true,
                book: { select: { id: true, title: true } },
              },
            },
          },
        }),
        prisma.paragraphRating.count({ where: { userId: req.user!.id } }),
      ]);

      ratings.push(
        ...paragraphRatings.map((r) => ({ ...r, type: 'paragraph' }))
      );
      total += paragraphTotal;
    }

    if (type === 'authors' || type === 'all') {
      const [authorRatings, authorTotal] = await Promise.all([
        prisma.authorRating.findMany({
          where: { userId: req.user!.id },
          skip: type === 'authors' ? skip : 0,
          take: type === 'authors' ? Number(limit) : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true } },
          },
        }),
        prisma.authorRating.count({ where: { userId: req.user!.id } }),
      ]);

      ratings.push(...authorRatings.map((r) => ({ ...r, type: 'author' })));
      total += authorTotal;
    }

    // Sort by createdAt desc if fetching all types
    if (type === 'all') {
      ratings.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      ratings = ratings.slice(skip, skip + Number(limit));
    }

    res.json({
      ratings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({ error: 'Failed to fetch user ratings' });
  }
});

export default router;
