import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get paragraphs for a book (with pagination)
router.get(
  '/book/:bookId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

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

      const [paragraphs, total] = await Promise.all([
        prisma.paragraph.findMany({
          where: {
            bookId,
          },
          orderBy: {
            order: 'asc',
          },
          skip,
          take: limit,
        }),
        prisma.paragraph.count({
          where: {
            bookId,
          },
        }),
      ]);

      res.json({
        paragraphs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching paragraphs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get single paragraph
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const paragraph = await prisma.paragraph.findFirst({
      where: {
        id,
        book: {
          userId: req.user!.id,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
    });

    if (!paragraph) {
      return res.status(404).json({ error: 'Paragraph not found' });
    }

    res.json(paragraph);
  } catch (error) {
    console.error('Error fetching paragraph:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
