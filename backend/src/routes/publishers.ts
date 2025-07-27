import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/publishers - Get all publishers
router.get('/', async (req, res) => {
  try {
    const { country, search, limit = '20', offset = '0' } = req.query;

    const where: any = {
      deletedAt: null,
    };

    if (country) {
      where.country = country as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const publishers = await prisma.publisher.findMany({
      where,
      include: {
        books: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            language: true,
            editionPublished: true,
          },
        },
        _count: {
          select: { books: true },
        },
      },
      orderBy: { name: 'asc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.publisher.count({ where });

    res.json({
      publishers,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
      },
    });
  } catch (error) {
    console.error('Error fetching publishers:', error);
    res.status(500).json({ error: 'Failed to fetch publishers' });
  }
});

// GET /api/publishers/:id - Get publisher by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const publisher = await prisma.publisher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        books: {
          where: { deletedAt: null },
          include: {
            authors: {
              include: {
                author: true,
              },
            },
            ratings: {
              select: {
                rating: true,
              },
            },
          },
          orderBy: { editionPublished: 'desc' },
        },
      },
    });

    if (!publisher) {
      return res.status(404).json({ error: 'Publisher not found' });
    }

    res.json(publisher);
  } catch (error) {
    console.error('Error fetching publisher:', error);
    res.status(500).json({ error: 'Failed to fetch publisher' });
  }
});

// POST /api/publishers - Create new publisher (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, website, address, foundedYear, country } =
      req.body;

    if (!name) {
      return res.status(400).json({ error: 'Publisher name is required' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const publisher = await prisma.publisher.create({
      data: {
        name,
        description,
        website,
        address,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        country,
      },
    });

    res.status(201).json(publisher);
  } catch (error) {
    console.error('Error creating publisher:', error);
    res.status(500).json({ error: 'Failed to create publisher' });
  }
});

// PUT /api/publishers/:id - Update publisher (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, website, address, foundedYear, country } =
      req.body;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const publisher = await prisma.publisher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!publisher) {
      return res.status(404).json({ error: 'Publisher not found' });
    }

    const updatedPublisher = await prisma.publisher.update({
      where: { id },
      data: {
        name: name || publisher.name,
        description,
        website,
        address,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        country,
      },
    });

    res.json(updatedPublisher);
  } catch (error) {
    console.error('Error updating publisher:', error);
    res.status(500).json({ error: 'Failed to update publisher' });
  }
});

// DELETE /api/publishers/:id - Delete publisher (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const publisher = await prisma.publisher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!publisher) {
      return res.status(404).json({ error: 'Publisher not found' });
    }

    // Soft delete
    await prisma.publisher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({ message: 'Publisher deleted successfully' });
  } catch (error) {
    console.error('Error deleting publisher:', error);
    res.status(500).json({ error: 'Failed to delete publisher' });
  }
});

// GET /api/publishers/:id/books - Get books by publisher
router.get('/:id/books', async (req, res) => {
  try {
    const { id } = req.params;
    const { language, year, limit = '20', offset = '0' } = req.query;

    const publisher = await prisma.publisher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!publisher) {
      return res.status(404).json({ error: 'Publisher not found' });
    }

    const where: any = {
      publisherId: id,
      deletedAt: null,
    };

    if (language) {
      where.language = language as string;
    }

    if (year) {
      where.editionPublished = parseInt(year as string);
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { editionPublished: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.book.count({ where });

    res.json({
      books,
      publisher,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
      },
    });
  } catch (error) {
    console.error('Error fetching publisher books:', error);
    res.status(500).json({ error: 'Failed to fetch publisher books' });
  }
});

export default router;
