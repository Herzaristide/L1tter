import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all books with search and filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  console.log('[GET] /books called', { query: req.query });
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
        _count: { select: { paragraphs: true, ratings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const booksWithRatings = books.map((book: any) => {
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
    console.log('[GET] /books response', {
      status: 200,
      books: booksWithRatings.length,
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Internal server error' });
    console.log('[GET] /books response', { status: 500, error });
  }
});

// Get book by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  console.log('[GET] /books/:id called', {
    params: req.params,
    query: req.query,
  });
  try {
    const { id } = req.params;
    const { paragraphId } = req.query;

    if (paragraphId) {
      // Fetch a single paragraph for this book
      const paragraph = await prisma.paragraph.findFirst({
        where: { id: paragraphId as string, bookId: id, deletedAt: null },
        select: {
          id: true,
          content: true,
          order: true,
          chapterNumber: true,
          readingTimeEst: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!paragraph)
        return res.status(404).json({ error: 'Paragraph not found' });
      return res.json(paragraph);
    }

    // Default: fetch book with all paragraphs
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
        paragraphs: {
          where: { deletedAt: null },
          select: {
            id: true,
            content: true,
            order: true,
            chapterNumber: true,
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
        _count: { select: { paragraphs: true, ratings: true, Note: true } },
      },
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (!book) {
      console.log('[GET] /books/:id response', { status: 404 });
      return res.status(404).json({ error: 'Book not found' });
    }
    const avgRating =
      book.ratings.length > 0
        ? book.ratings.reduce((sum: any, r: any) => sum + r.rating, 0) /
          book.ratings.length
        : null;
    res.json({ ...book, averageRating: avgRating });
    console.log('[GET] /books/:id response', { status: 200, bookId: book.id });

    console.log('test');
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Internal server error' });
    console.log('[GET] /books/:id response', { status: 500, error });
  }
});

// Get all editions of a work
router.get('/work/:workId', async (req: AuthRequest, res: Response) => {
  console.log('[GET] /books/work/:workId called', {
    params: req.params,
    query: req.query,
  });
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
        _count: { select: { paragraphs: true, ratings: true } },
      },
      orderBy: [{ language: 'asc' }, { editionPublished: 'desc' }],
    });
    const editionsWithRatings = editions.map((edition: any) => {
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
      languages: [...new Set(editions.map((e: any) => e.language))],
    });
    console.log('[GET] /books/work/:workId response', {
      status: 200,
      totalEditions: editions.length,
    });
  } catch (error) {
    console.error('Get work editions error:', error);
    res.status(500).json({ error: 'Internal server error' });
    console.log('[GET] /books/work/:workId response', { status: 500, error });
  }
});

// Create a new book
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  console.log('[POST] /books called', { body: req.body });
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
      isDraft = true,
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
        isDraft,
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
    console.log('[POST] /books response', {
      status: 201,
      bookId: completeBook?.id,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Internal server error' });
    console.log('[POST] /books response', { status: 500, error });
  }
});

// Update a book
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    console.log('[PUT] /books/:id called', {
      params: req.params,
      body: req.body,
    });
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
        isDraft,
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
          isDraft: isDraft !== undefined ? isDraft : book.isDraft,
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
      console.log('[PUT] /books/:id response', {
        status: 200,
        bookId: completeBook?.id,
      });
    } catch (error) {
      console.error('Update book error:', error);
      res.status(500).json({ error: 'Internal server error' });
      console.log('[PUT] /books/:id response', { status: 500, error });
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
      console.log('[DELETE] /books/:id response', { status: 200, bookId: id });
    } catch (error) {
      console.error('Delete book error:', error);
      res.status(500).json({ error: 'Internal server error' });
      console.log('[DELETE] /books/:id response', { status: 500, error });
    }
  }
);

// Create a new paragraph
router.post(
  '/:bookId/paragraphs',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { bookId } = req.params;
      const { content, order, chapterNumber, readingTimeEst } = req.body;

      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) return res.status(404).json({ error: 'Book not found' });

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });
      if (!user || (book.userId !== req.user!.id && user.role !== 'ADMIN')) {
        return res
          .status(403)
          .json({ error: 'Not authorized to add paragraph to this book' });
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
      });

      res.status(201).json(paragraph);
      console.log('[POST] /books/:bookId/paragraphs response', {
        status: 201,
        paragraphId: paragraph?.id,
      });
    } catch (error) {
      console.error('Create paragraph error:', error);
      res.status(500).json({ error: 'Internal server error' });
      console.log('[POST] /books/:bookId/paragraphs response', {
        status: 500,
        error,
      });
    }
  }
);

// Update a paragraph
router.put(
  '/paragraphs/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { content, order, chapterNumber, readingTimeEst } = req.body;

      const paragraph = await prisma.paragraph.findFirst({
        where: { id, deletedAt: null },
        include: { book: true },
      });
      if (!paragraph)
        return res.status(404).json({ error: 'Paragraph not found' });

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });
      if (
        !user ||
        (paragraph.book.userId !== req.user!.id && user.role !== 'ADMIN')
      ) {
        return res
          .status(403)
          .json({ error: 'Not authorized to edit this paragraph' });
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
      });

      res.json(updatedParagraph);
      console.log('[PUT] /paragraphs/:id response', {
        status: 200,
        paragraphId: updatedParagraph?.id,
      });
    } catch (error) {
      console.error('Update paragraph error:', error);
      res.status(500).json({ error: 'Internal server error' });
      console.log('[PUT] /paragraphs/:id response', { status: 500, error });
    }
  }
);

// Get book structure (chapters and paragraph counts)
router.get('/:id/structure', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, title: true, isPublic: true, userId: true },
    });

    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Get chapter structure
    const chapters = await prisma.paragraph.groupBy({
      by: ['chapterNumber'],
      where: {
        bookId: id,
        deletedAt: null,
        chapterNumber: { not: null },
      },
      _count: { id: true },
      _sum: { readingTimeEst: true },
      orderBy: { chapterNumber: 'asc' },
    });

    const structure = chapters.map((chapter) => ({
      chapterNumber: chapter.chapterNumber,
      paragraphCount: chapter._count.id,
      totalReadingTime: chapter._sum.readingTimeEst || 0,
    }));

    // Get total statistics
    const totalStats = await prisma.paragraph.aggregate({
      where: { bookId: id, deletedAt: null },
      _count: { id: true },
      _sum: { readingTimeEst: true },
    });

    res.json({
      bookId: id,
      chapters: structure,
      totalParagraphs: totalStats._count.id,
      totalReadingTime: totalStats._sum.readingTimeEst || 0,
    });
  } catch (error) {
    console.error('Get book structure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
