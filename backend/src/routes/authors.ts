import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all authors with search and filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, tag, page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { bio: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { contains: tag as string, mode: 'insensitive' },
          },
        },
      };
    }

    const authors = await prisma.author.findMany({
      where,
      skip,
      take,
      include: {
        books: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                description: true,
                language: true,
                genre: true,
                imageUrl: true,
                isPublic: true,
                editionPublished: true,
                deletedAt: true,
                publisher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                ratings: {
                  select: { rating: true },
                },
                _count: {
                  select: { ratings: true },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
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
        links: true,
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            books: true,
            ratings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate average ratings
    const authorsWithRatings = authors.map((author: any) => {
      const avgRating =
        author.ratings.length > 0
          ? author.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
            author.ratings.length
          : null;

      const { ratings, ...authorWithoutRatings } = author;
      return {
        ...authorWithoutRatings,
        averageRating: avgRating,
      };
    });

    const totalAuthors = await prisma.author.count({ where });

    res.json({
      authors: authorsWithRatings,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalAuthors,
        pages: Math.ceil(totalAuthors / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single author by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { language } = req.query;

    const author = await prisma.author.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        books: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                description: true,
                language: true,
                genre: true,
                imageUrl: true,
                isPublic: true,
                editionPublished: true,
                deletedAt: true,
                publisher: {
                  select: {
                    id: true,
                    name: true,
                    country: true,
                  },
                },
                tags: {
                  include: {
                    tag: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                ratings: {
                  select: { rating: true },
                },
                _count: {
                  select: { chapters: true, ratings: true },
                },
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        links: true,
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
            books: true,
            ratings: true,
          },
        },
      },
    });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Calculate average rating
    const avgRating =
      Array.isArray(author.ratings) && author.ratings.length > 0
        ? author.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
          author.ratings.length
        : null;

    // Filter non-deleted books and calculate average ratings
    const nonDeletedBooks = Array.isArray(author.books)
      ? author.books.filter(
          (bookAuthor) => bookAuthor.book && !bookAuthor.book.deletedAt
        )
      : [];
    const booksWithRatings = nonDeletedBooks.map((bookAuthor: any) => {
      const book = bookAuthor.book;
      const bookAvgRating =
        Array.isArray(book.ratings) && book.ratings.length > 0
          ? book.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
            book.ratings.length
          : null;
      const { ratings, ...bookWithoutRatings } = book;
      return {
        ...bookAuthor,
        book: {
          ...bookWithoutRatings,
          averageRating: bookAvgRating,
        },
      };
    });

    res.json({
      ...author,
      books: booksWithRatings,
      averageRating: avgRating,
    });
  } catch (error) {
    console.error('Get author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new author
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, links = [], tagIds = [] } = req.body;

    const author = await prisma.$transaction(async (tx) => {
      // Create author
      const newAuthor = await tx.author.create({
        data: {
          name,
          bio,
        },
      });

      // Create links
      if (links.length > 0) {
        await tx.authorLink.createMany({
          data: links.map((link: { url: string; label?: string }) => ({
            authorId: newAuthor.id,
            url: link.url,
            label: link.label,
          })),
        });
      }

      // Connect tags
      if (tagIds.length > 0) {
        await tx.authorTag.createMany({
          data: tagIds.map((tagId: string) => ({
            authorId: newAuthor.id,
            tagId,
          })),
        });
      }

      return newAuthor;
    });

    // Fetch complete author data
    const completeAuthor = await prisma.author.findUnique({
      where: { id: author.id },
      include: {
        links: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            books: true,
            ratings: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Author created successfully',
      author: completeAuthor,
    });
  } catch (error) {
    console.error('Create author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update author
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, bio } = req.body;

      const author = await prisma.author.update({
        where: { id },
        data: {
          name,
          bio,
          updatedAt: new Date(),
        },
        include: {
          links: true,
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              books: true,
              ratings: true,
            },
          },
        },
      });

      res.json({
        message: 'Author updated successfully',
        author,
      });
    } catch (error) {
      console.error('Update author error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Add author link
router.post(
  '/:id/links',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { url, label } = req.body;

      const link = await prisma.authorLink.create({
        data: {
          authorId: id,
          url,
          label,
        },
      });

      res.status(201).json({
        message: 'Link added successfully',
        link,
      });
    } catch (error) {
      console.error('Add author link error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete author link
router.delete(
  '/:id/links/:linkId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkId } = req.params;

      await prisma.authorLink.delete({
        where: { id: linkId },
      });

      res.json({ message: 'Link deleted successfully' });
    } catch (error) {
      console.error('Delete author link error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Rate author
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

      const authorRating = await prisma.authorRating.upsert({
        where: {
          userId_authorId: {
            userId: req.user!.id,
            authorId: id,
          },
        },
        update: {
          rating,
          comment,
          updatedAt: new Date(),
        },
        create: {
          userId: req.user!.id,
          authorId: id,
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
        rating: authorRating,
      });
    } catch (error) {
      console.error('Rate author error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Soft delete author
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.author.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      res.json({ message: 'Author deleted successfully' });
    } catch (error) {
      console.error('Delete author error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
