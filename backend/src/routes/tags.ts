import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all tags with usage statistics
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      type, // books, authors, chapters, notes
      page = '1',
      limit = '50',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const tags = await prisma.tag.findMany({
      where,
      skip,
      take,
      include: {
        _count: {
          select: {
            books: true,
            chapters: true,
            authors: true,
            notes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter by type if specified
    let filteredTags = tags;
    if (type) {
      filteredTags = tags.filter((tag) => {
        switch (type) {
          case 'books':
            return tag._count.books > 0;
          case 'authors':
            return tag._count.authors > 0;
          case 'chapters':
            return tag._count.chapters > 0;
          case 'notes':
            return tag._count.notes > 0;
          default:
            return true;
        }
      });
    }

    const totalTags = await prisma.tag.count({ where });

    res.json({
      tags: filteredTags,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalTags,
        pages: Math.ceil(totalTags / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single tag with related content
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        books: {
          include: {
            book: {
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
                      },
                    },
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
            },
          },
        },
        authors: {
          include: {
            author: {
              include: {
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
            },
          },
        },
        chapters: {
          include: {
            chapter: {
              include: {
                book: {
                  include: {
                    locales: {
                      where: { language: language as string },
                      take: 1,
                    },
                  },
                },
                locales: {
                  where: { language: language as string },
                  take: 1,
                },
              },
            },
          },
        },
        notes: {
          include: {
            note: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                  },
                },
                book: {
                  select: {
                    id: true,
                    locales: {
                      where: { language: language as string },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            books: true,
            chapters: true,
            authors: true,
            notes: true,
          },
        },
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Filter non-deleted content and calculate average ratings
    const nonDeletedBooks = tag.books.filter(
      (bookTag) => !bookTag.book.deletedAt
    );
    const booksWithRatings = nonDeletedBooks.map((bookTag: any) => {
      const book = bookTag.book;
      const avgRating =
        book.ratings.length > 0
          ? book.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
            book.ratings.length
          : null;

      const { ratings, ...bookWithoutRatings } = book;
      return {
        ...bookTag,
        book: {
          ...bookWithoutRatings,
          averageRating: avgRating,
        },
      };
    });

    const nonDeletedAuthors = tag.authors.filter(
      (authorTag) => !authorTag.author.deletedAt
    );
    const authorsWithRatings = nonDeletedAuthors.map((authorTag: any) => {
      const author = authorTag.author;
      const avgRating =
        author.ratings.length > 0
          ? author.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
            author.ratings.length
          : null;

      const { ratings, ...authorWithoutRatings } = author;
      return {
        ...authorTag,
        author: {
          ...authorWithoutRatings,
          averageRating: avgRating,
        },
      };
    });

    // Filter notes for visibility and deletion
    const visibleNotes = tag.notes.filter((noteTag) => {
      const note = noteTag.note;
      return (
        !note.deletedAt &&
        (note.isPublic || (req.user && note.userId === req.user.id))
      );
    });

    // Filter chapters for deletion
    const nonDeletedChapters = tag.chapters.filter(
      (chapterTag) => !chapterTag.chapter.deletedAt
    );

    res.json({
      ...tag,
      books: booksWithRatings,
      authors: authorsWithRatings,
      chapters: nonDeletedChapters,
      notes: visibleNotes,
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new tag
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    // Check if tag already exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existingTag) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        description,
      },
      include: {
        _count: {
          select: {
            books: true,
            chapters: true,
            authors: true,
            notes: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Tag created successfully',
      tag,
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tag
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Check if another tag with the same name exists
      if (name) {
        const existingTag = await prisma.tag.findFirst({
          where: {
            name: { equals: name, mode: 'insensitive' },
            deletedAt: null,
            NOT: { id },
          },
        });

        if (existingTag) {
          return res
            .status(400)
            .json({ error: 'Tag with this name already exists' });
        }
      }

      const tag = await prisma.tag.update({
        where: { id },
        data: {
          name,
          description,
          updatedAt: new Date(),
        },
        include: {
          _count: {
            select: {
              books: true,
              chapters: true,
              authors: true,
              notes: true,
            },
          },
        },
      });

      res.json({
        message: 'Tag updated successfully',
        tag,
      });
    } catch (error) {
      console.error('Update tag error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get popular tags
router.get('/popular/trending', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '10', type = 'all' } = req.query;

    const tags = await prisma.tag.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            books: true,
            chapters: true,
            authors: true,
            notes: true,
          },
        },
      },
    });

    // Calculate total usage for each tag
    const tagsWithUsage = tags.map((tag) => {
      let totalUsage = 0;

      switch (type) {
        case 'books':
          totalUsage = tag._count.books;
          break;
        case 'authors':
          totalUsage = tag._count.authors;
          break;
        case 'chapters':
          totalUsage = tag._count.chapters;
          break;
        case 'notes':
          totalUsage = tag._count.notes;
          break;
        default:
          totalUsage =
            tag._count.books +
            tag._count.chapters +
            tag._count.authors +
            tag._count.notes;
      }

      return {
        ...tag,
        totalUsage,
      };
    });

    // Sort by usage and take top results
    const popularTags = tagsWithUsage
      .filter((tag) => tag.totalUsage > 0)
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, parseInt(limit as string));

    res.json({
      tags: popularTags,
      type,
    });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search tags by name
router.get('/search/:query', async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.params;
    const { limit = '20' } = req.query;

    const tags = await prisma.tag.findMany({
      where: {
        deletedAt: null,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: {
            books: true,
            chapters: true,
            authors: true,
            notes: true,
          },
        },
      },
      take: parseInt(limit as string),
      orderBy: { name: 'asc' },
    });

    res.json({ tags });
  } catch (error) {
    console.error('Search tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete tag
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.tag.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
      console.error('Delete tag error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
