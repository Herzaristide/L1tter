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
      language,
      workId,
      publisherId,
      tag,
      author,
      collection,
      genre,
      isPublic,
      page = '1',
      limit = '10',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { deletedAt: null };
    if (isPublic === 'true') where.isPublic = true;
    if (collection) where.collectionId = collection as string;
    if (workId) where.workId = workId as string;
    if (publisherId) where.publisherId = publisherId as string;
    if (language) where.language = language as string;
    if (genre) where.genre = { contains: genre as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (author) {
      where.authors = {
        some: {
          author: {
            name: { contains: author as string, mode: 'insensitive' },
          },
        },
      };
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

    const books = await prisma.book.findMany({
      where,
      skip,
      take,
      include: {
        authors: {
          include: {
            author: {
              select: { id: true, name: true, bio: true },
            },
          },
          orderBy: { position: 'asc' },
        },
        publisher: { select: { id: true, name: true, country: true } },
        tags: {
          include: {
            tag: { select: { id: true, name: true, description: true } },
          },
        },
        collection: { select: { id: true, name: true, description: true } },
        user: { select: { id: true, name: true, imageUrl: true } },
        ratings: { select: { rating: true } },
        _count: { select: { chapters: true, ratings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const booksWithRatings = books.map((book) => {
      const avgRating =
        book.ratings.length > 0
          ? book.ratings.reduce((sum: any, r: any) => sum + r.rating, 0) /
            book.ratings.length
          : null;
      const { ratings, ...bookWithoutRatings } = book;
      return { ...bookWithoutRatings, averageRating: avgRating };
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

// Get book by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { chapterId } = req.query;
    if (chapterId) {
      // Fetch a single chapter for this book
      const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId as string, bookId: id, deletedAt: null },
        select: {
          id: true,
          title: true,
          content: true,
          order: true,
          readingTimeEst: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
      return res.json(chapter);
    }
    // Default: fetch book with all chapters
    const book = await prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: {
        authors: {
          include: {
            author: {
              include: {
                links: true,
                ratings: { select: { rating: true } },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        publisher: true,
        chapters: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            content: true,
            order: true,
            readingTimeEst: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
        tags: { include: { tag: true } },
        collection: {
          select: { id: true, name: true, description: true, isPublic: true },
        },
        user: { select: { id: true, name: true, imageUrl: true } },
        ratings: {
          include: {
            user: { select: { id: true, name: true, imageUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { chapters: true, ratings: true, Note: true } },
      },
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const avgRating =
      book.ratings.length > 0
        ? book.ratings.reduce((sum: any, r: any) => sum + r.rating, 0) /
          book.ratings.length
        : null;
    res.json({ ...book, averageRating: avgRating });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all editions of a work
router.get('/work/:workId', async (req: AuthRequest, res: Response) => {
  try {
    const { workId } = req.params;
    const { language } = req.query;
    const where: any = { workId, deletedAt: null };
    if (language) where.language = language as string;
    const editions = await prisma.book.findMany({
      where,
      include: {
        authors: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { position: 'asc' },
        },
        publisher: { select: { id: true, name: true, country: true } },
        ratings: { select: { rating: true } },
        _count: { select: { chapters: true, ratings: true } },
      },
      orderBy: [{ language: 'asc' }, { editionPublished: 'desc' }],
    });
    const editionsWithRatings = editions.map((edition) => {
      const avgRating =
        edition.ratings.length > 0
          ? edition.ratings.reduce((sum: any, r: any) => sum + r.rating, 0) /
            edition.ratings.length
          : null;
      const { ratings, ...editionWithoutRatings } = edition;
      return { ...editionWithoutRatings, averageRating: avgRating };
    });
    res.json({
      workId,
      editions: editionsWithRatings,
      totalEditions: editions.length,
      languages: [...new Set(editions.map((e) => e.language))],
    });
  } catch (error) {
    console.error('Get work editions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new book
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      workId,
      collectionId,
      publisherId,
      title,
      description,
      edition,
      editionPublished,
      originalLanguage,
      originalPublished,
      imageUrl,
      language = 'en',
      slug,
      genre,
      isPublic = false,
      authorIds = [],
      tagIds = [],
    } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const book = await prisma.book.create({
      data: {
        workId,
        userId: req.user!.id,
        collectionId,
        publisherId,
        title,
        description,
        edition,
        editionPublished: editionPublished ? parseInt(editionPublished) : null,
        originalLanguage: originalLanguage || language,
        originalPublished: originalPublished
          ? parseInt(originalPublished)
          : null,
        imageUrl,
        language,
        slug,
        genre,
        isPublic,
        createdBy: req.user!.id,
      },
    });
    if (authorIds.length > 0) {
      await prisma.bookAuthor.createMany({
        data: authorIds.map((authorId: string, index: number) => ({
          bookId: book.id,
          authorId,
          position: index + 1,
        })),
      });
    }
    if (tagIds.length > 0) {
      await prisma.bookTag.createMany({
        data: tagIds.map((tagId: string) => ({ bookId: book.id, tagId })),
      });
    }
    const completeBook = await prisma.book.findUnique({
      where: { id: book.id },
      include: {
        authors: { include: { author: true }, orderBy: { position: 'asc' } },
        publisher: true,
        tags: { include: { tag: true } },
        collection: true,
        user: { select: { id: true, name: true, imageUrl: true } },
      },
    });
    res.status(201).json(completeBook);
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a book
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        workId,
        collectionId,
        publisherId,
        title,
        description,
        edition,
        editionPublished,
        originalLanguage,
        originalPublished,
        imageUrl,
        language,
        slug,
        genre,
        isPublic,
        authorIds,
        tagIds,
      } = req.body;
      const book = await prisma.book.findFirst({
        where: { id, deletedAt: null },
      });
      if (!book) return res.status(404).json({ error: 'Book not found' });
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });
      if (!user || (book.userId !== req.user!.id && user.role !== 'ADMIN')) {
        return res
          .status(403)
          .json({ error: 'Not authorized to edit this book' });
      }
      const updatedBook = await prisma.book.update({
        where: { id },
        data: {
          workId: workId !== undefined ? workId : book.workId,
          collectionId:
            collectionId !== undefined ? collectionId : book.collectionId,
          publisherId:
            publisherId !== undefined ? publisherId : book.publisherId,
          title: title || book.title,
          description:
            description !== undefined ? description : book.description,
          edition: edition !== undefined ? edition : book.edition,
          editionPublished:
            editionPublished !== undefined
              ? editionPublished
                ? parseInt(editionPublished)
                : null
              : book.editionPublished,
          originalLanguage: originalLanguage || book.originalLanguage,
          originalPublished:
            originalPublished !== undefined
              ? originalPublished
                ? parseInt(originalPublished)
                : null
              : book.originalPublished,
          imageUrl: imageUrl !== undefined ? imageUrl : book.imageUrl,
          language: language || book.language,
          slug: slug !== undefined ? slug : book.slug,
          genre: genre !== undefined ? genre : book.genre,
          isPublic: isPublic !== undefined ? isPublic : book.isPublic,
          updatedBy: req.user!.id,
        },
      });
      if (authorIds !== undefined) {
        await prisma.bookAuthor.deleteMany({ where: { bookId: id } });
        if (authorIds.length > 0) {
          await prisma.bookAuthor.createMany({
            data: authorIds.map((authorId: string, index: number) => ({
              bookId: id,
              authorId,
              position: index + 1,
            })),
          });
        }
      }
      if (tagIds !== undefined) {
        await prisma.bookTag.deleteMany({ where: { bookId: id } });
        if (tagIds.length > 0) {
          await prisma.bookTag.createMany({
            data: tagIds.map((tagId: string) => ({ bookId: id, tagId })),
          });
        }
      }
      const completeBook = await prisma.book.findUnique({
        where: { id },
        include: {
          authors: { include: { author: true }, orderBy: { position: 'asc' } },
          publisher: true,
          tags: { include: { tag: true } },
          collection: true,
          user: { select: { id: true, name: true, imageUrl: true } },
        },
      });
      res.json(completeBook);
    } catch (error) {
      console.error('Update book error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete a book (soft delete)
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const book = await prisma.book.findFirst({
        where: { id, deletedAt: null },
      });
      if (!book) return res.status(404).json({ error: 'Book not found' });
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });
      if (!user || (book.userId !== req.user!.id && user.role !== 'ADMIN')) {
        return res
          .status(403)
          .json({ error: 'Not authorized to delete this book' });
      }
      await prisma.book.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy: req.user!.id },
      });
      res.json({ message: 'Book deleted successfully' });
    } catch (error) {
      console.error('Delete book error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Rate a book
router.post(
  '/:id/rate',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: 'Rating must be between 1 and 5' });
      }
      const book = await prisma.book.findFirst({
        where: { id, deletedAt: null },
      });
      if (!book) return res.status(404).json({ error: 'Book not found' });
      const bookRating = await prisma.bookRating.upsert({
        where: {
          userId_bookId: {
            userId: req.user!.id,
            bookId: id,
          },
        },
        create: {
          userId: req.user!.id,
          bookId: id,
          rating: parseInt(rating),
          comment,
        },
        update: {
          rating: parseInt(rating),
          comment,
        },
        include: {
          user: { select: { id: true, name: true, imageUrl: true } },
        },
      });
      res.json(bookRating);
    } catch (error) {
      console.error('Rate book error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
