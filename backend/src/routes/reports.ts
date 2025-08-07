import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new report (authenticated users only)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      reportType,
      description,
      bookId,
      paragraphId,
      authorId,
      publisherId,
      noteId,
      bookRatingId,
      paragraphRatingId,
      authorRatingId,
    } = req.body;

    // Validate that only one entity is being reported
    const entityCount = [
      bookId,
      paragraphId,
      authorId,
      publisherId,
      noteId,
      bookRatingId,
      paragraphRatingId,
      authorRatingId,
    ].filter(Boolean).length;

    if (entityCount !== 1) {
      return res.status(400).json({
        error: 'Exactly one entity must be specified for reporting',
      });
    }

    // Check if user already has a pending report for this entity
    const existingReport = await prisma.report.findFirst({
      where: {
        userId: req.user!.id,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
        ...(bookId && { bookId }),
        ...(paragraphId && { paragraphId }),
        ...(authorId && { authorId }),
        ...(publisherId && { publisherId }),
        ...(noteId && { noteId }),
        ...(bookRatingId && { bookRatingId }),
        ...(paragraphRatingId && { paragraphRatingId }),
        ...(authorRatingId && { authorRatingId }),
      },
    });

    if (existingReport) {
      return res.status(400).json({
        error: 'You already have a pending report for this item',
      });
    }

    const report = await prisma.report.create({
      data: {
        userId: req.user!.id,
        reportType,
        description,
        ...(bookId && { bookId }),
        ...(paragraphId && { paragraphId }),
        ...(authorId && { authorId }),
        ...(publisherId && { publisherId }),
        ...(noteId && { noteId }),
        ...(bookRatingId && { bookRatingId }),
        ...(paragraphRatingId && { paragraphRatingId }),
        ...(authorRatingId && { authorRatingId }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true } },
        paragraph: { select: { id: true, content: true } },
        author: { select: { id: true, name: true } },
        publisher: { select: { id: true, name: true } },
        note: { select: { id: true, text: true } },
        bookRating: { select: { id: true, rating: true, comment: true } },
        paragraphRating: { select: { id: true, rating: true, comment: true } },
        authorRating: { select: { id: true, rating: true, comment: true } },
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get all reports (admin only)
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const {
        status,
        reportType,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (reportType) where.reportType = reportType;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder },
          include: {
            user: { select: { id: true, name: true, email: true } },
            book: { select: { id: true, title: true } },
            paragraph: {
              select: {
                id: true,
                content: true,
                book: { select: { title: true } },
              },
            },
            author: { select: { id: true, name: true } },
            publisher: { select: { id: true, name: true } },
            note: {
              select: {
                id: true,
                text: true,
                user: { select: { name: true } },
              },
            },
            bookRating: {
              select: {
                id: true,
                rating: true,
                comment: true,
                user: { select: { name: true } },
                book: { select: { title: true } },
              },
            },
            paragraphRating: {
              select: {
                id: true,
                rating: true,
                comment: true,
                user: { select: { name: true } },
              },
            },
            authorRating: {
              select: {
                id: true,
                rating: true,
                comment: true,
                user: { select: { name: true } },
                author: { select: { name: true } },
              },
            },
            resolver: { select: { id: true, name: true } },
          },
        }),
        prisma.report.count({ where }),
      ]);

      res.json({
        reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }
);

// Get user's own reports
router.get('/my-reports', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          book: { select: { id: true, title: true } },
          paragraph: { select: { id: true, content: true } },
          author: { select: { id: true, name: true } },
          publisher: { select: { id: true, name: true } },
          note: { select: { id: true, text: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Update report status (admin only)
router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const updateData: any = { status };

      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }

      if (status === 'RESOLVED' || status === 'DISMISSED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user!.id;
      }

      const report = await prisma.report.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true } },
          resolver: { select: { id: true, name: true } },
        },
      });

      res.json(report);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }
);

// Get report statistics (admin only)
router.get(
  '/stats',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res) => {
    try {
      const [
        totalReports,
        pendingReports,
        resolvedReports,
        reportsByType,
        reportsByStatus,
        recentReports,
      ] = await Promise.all([
        prisma.report.count(),
        prisma.report.count({ where: { status: 'PENDING' } }),
        prisma.report.count({ where: { status: 'RESOLVED' } }),
        prisma.report.groupBy({
          by: ['reportType'],
          _count: true,
        }),
        prisma.report.groupBy({
          by: ['status'],
          _count: true,
        }),
        prisma.report.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      res.json({
        totalReports,
        pendingReports,
        resolvedReports,
        recentReports,
        reportsByType,
        reportsByStatus,
      });
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      res.status(500).json({ error: 'Failed to fetch report statistics' });
    }
  }
);

export default router;
