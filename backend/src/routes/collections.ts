import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all collections with filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, isPublic, ownerId, page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      deletedAt: null,
      ...(isPublic === 'true' ? { isPublic: true } : {}),
      ...(ownerId ? { ownerId: ownerId as string } : {}),
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const collections = await prisma.collection.findMany({
      where,
      skip,
      take,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        books: {
          where: { deletedAt: null },
          include: {
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
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                paragraphs: true,
                ratings: true,
              },
            },
          },
          orderBy: { orderInCollection: 'asc' },
        },
        sharedWith: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            books: true,
            sharedWith: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCollections = await prisma.collection.count({ where });

    res.json({
      collections,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCollections,
        pages: Math.ceil(totalCollections / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single collection by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        books: {
          where: { deletedAt: null },
          include: {
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
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                paragraphs: true,
                ratings: true,
              },
            },
          },
          orderBy: { orderInCollection: 'asc' },
        },
        sharedWith: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            books: true,
            sharedWith: true,
          },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if collection is accessible
    const isOwner = collection.ownerId === req.user?.id;
    const isShared = collection.sharedWith.some(
      (share) => share.userId === req.user?.id
    );

    if (!collection.isPublic && !isOwner && !isShared) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate average ratings for books
    const booksWithRatings = collection.books.map((book: any) => {
      const avgRating =
        book.ratings.length > 0
          ? book.ratings.reduce((sum: any, r: any) => sum + r.rating, 0) /
            book.ratings.length
          : null;

      const { ratings, ...bookWithoutRatings } = book;
      return {
        ...bookWithoutRatings,
        averageRating: avgRating,
      };
    });

    res.json({
      ...collection,
      books: booksWithRatings,
      isOwner,
      isShared,
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new collection
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic = false } = req.body;

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        ownerId: req.user!.id,
        isPublic,
        createdBy: req.user!.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            books: true,
            sharedWith: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Collection created successfully',
      collection,
    });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update collection
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, isPublic } = req.body;

      // Check if user owns the collection
      const existingCollection = await prisma.collection.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!existingCollection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (existingCollection.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const collection = await prisma.collection.update({
        where: { id },
        data: {
          name,
          description,
          isPublic,
          updatedBy: req.user!.id,
          updatedAt: new Date(),
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
          _count: {
            select: {
              books: true,
              sharedWith: true,
            },
          },
        },
      });

      res.json({
        message: 'Collection updated successfully',
        collection,
      });
    } catch (error) {
      console.error('Update collection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Share collection with user
router.post(
  '/:id/share',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { userEmail } = req.body;

      // Check if user owns the collection
      const collection = await prisma.collection.findUnique({
        where: { id },
        select: { ownerId: true, name: true },
      });

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (collection.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Find user to share with
      const userToShare = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, name: true, email: true },
      });

      if (!userToShare) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (userToShare.id === req.user!.id) {
        return res.status(400).json({ error: 'Cannot share with yourself' });
      }

      // Check if already shared
      const existingShare = await prisma.collectionShare.findUnique({
        where: {
          collectionId_userId: {
            collectionId: id,
            userId: userToShare.id,
          },
        },
      });

      if (existingShare) {
        return res
          .status(400)
          .json({ error: 'Collection already shared with this user' });
      }

      // Create share
      await prisma.collectionShare.create({
        data: {
          collectionId: id,
          userId: userToShare.id,
        },
      });

      res.json({
        message: 'Collection shared successfully',
        sharedWith: userToShare,
      });
    } catch (error) {
      console.error('Share collection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Remove share
router.delete(
  '/:id/share/:userId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, userId } = req.params;

      // Check if user owns the collection
      const collection = await prisma.collection.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (collection.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.collectionShare.delete({
        where: {
          collectionId_userId: {
            collectionId: id,
            userId,
          },
        },
      });

      res.json({ message: 'Share removed successfully' });
    } catch (error) {
      console.error('Remove share error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Soft delete collection
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user owns the collection
      const existingCollection = await prisma.collection.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!existingCollection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      if (existingCollection.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.collection.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: req.user!.id,
        },
      });

      res.json({ message: 'Collection deleted successfully' });
    } catch (error) {
      console.error('Delete collection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
