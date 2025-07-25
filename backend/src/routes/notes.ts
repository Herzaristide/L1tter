import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get notes with filtering
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      bookId,
      chapterId,
      isPublic,
      search,
      page = '1',
      limit = '10',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      deletedAt: null,
      OR: [
        { userId: req.user!.id }, // User's own notes
        { isPublic: true }, // Public notes
        { sharedWith: { some: { userId: req.user!.id } } }, // Shared notes
      ],
      ...(bookId ? { bookId } : {}),
      ...(chapterId ? { chapterId } : {}),
      ...(isPublic === 'true' ? { isPublic: true } : {}),
    };

    if (search) {
      where.AND = [
        where.AND || {},
        {
          OR: [
            { text: { contains: search as string, mode: 'insensitive' } },
            {
              firstContent: { contains: search as string, mode: 'insensitive' },
            },
            {
              secondContent: {
                contains: search as string,
                mode: 'insensitive',
              },
            },
            {
              thirdContent: { contains: search as string, mode: 'insensitive' },
            },
          ],
        },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
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
        book: {
          select: {
            id: true,
            locales: {
              where: { language: 'en' },
              take: 1,
              select: {
                title: true,
              },
            },
          },
        },
        chapter: {
          select: {
            id: true,
            order: true,
            locales: {
              where: { language: 'en' },
              take: 1,
              select: {
                title: true,
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
            sharedWith: true,
            tags: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalNotes = await prisma.note.count({ where });

    // Add isOwner flag to each note
    const notesWithOwnership = notes.map((note) => ({
      ...note,
      isOwner: note.userId === req.user!.id,
    }));

    res.json({
      notes: notesWithOwnership,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalNotes,
        pages: Math.ceil(totalNotes / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single note by ID
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const note = await prisma.note.findUnique({
        where: { id },
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
                where: { language: 'en' },
                take: 1,
              },
            },
          },
          chapter: {
            select: {
              id: true,
              order: true,
              locales: {
                where: { language: 'en' },
                take: 1,
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
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
        },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Check access permissions
      const isOwner = note.userId === req.user!.id;
      const isShared = note.sharedWith.some(
        (share) => share.userId === req.user!.id
      );

      if (!note.isPublic && !isOwner && !isShared) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        ...note,
        isOwner,
        isShared,
      });
    } catch (error) {
      console.error('Get note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Create new note
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      bookId,
      chapterId,
      startIndex,
      endIndex,
      text,
      firstContent,
      secondContent,
      thirdContent,
      isPublic = false,
      tagIds = [],
    } = req.body;

    const note = await prisma.$transaction(async (tx) => {
      // Create note
      const newNote = await tx.note.create({
        data: {
          userId: req.user!.id,
          bookId,
          chapterId,
          startIndex,
          endIndex,
          text,
          firstContent,
          secondContent,
          thirdContent,
          isPublic,
          createdBy: req.user!.id,
        },
      });

      // Connect tags
      if (tagIds.length > 0) {
        await tx.noteTag.createMany({
          data: tagIds.map((tagId: string) => ({
            noteId: newNote.id,
            tagId,
          })),
        });
      }

      return newNote;
    });

    // Fetch complete note data
    const completeNote = await prisma.note.findUnique({
      where: { id: note.id },
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
              where: { language: 'en' },
              take: 1,
            },
          },
        },
        chapter: {
          select: {
            id: true,
            order: true,
            locales: {
              where: { language: 'en' },
              take: 1,
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Note created successfully',
      note: completeNote,
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update note
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { firstContent, secondContent, thirdContent, isPublic } = req.body;

      // Check if user owns the note
      const existingNote = await prisma.note.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      if (existingNote.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const note = await prisma.note.update({
        where: { id },
        data: {
          firstContent,
          secondContent,
          thirdContent,
          isPublic,
          updatedBy: req.user!.id,
          updatedAt: new Date(),
        },
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
                where: { language: 'en' },
                take: 1,
              },
            },
          },
          chapter: {
            select: {
              id: true,
              order: true,
              locales: {
                where: { language: 'en' },
                take: 1,
              },
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
        message: 'Note updated successfully',
        note,
      });
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Share note with user
router.post(
  '/:id/share',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { userEmail } = req.body;

      // Check if user owns the note
      const note = await prisma.note.findUnique({
        where: { id },
        select: { userId: true, firstContent: true },
      });
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      if (note.userId !== req.user!.id) {
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
      const existingShare = await prisma.noteShare.findUnique({
        where: {
          noteId_userId: {
            noteId: id,
            userId: userToShare.id,
          },
        },
      });

      if (existingShare) {
        return res
          .status(400)
          .json({ error: 'Note already shared with this user' });
      }

      // Create share
      await prisma.noteShare.create({
        data: {
          noteId: id,
          userId: userToShare.id,
        },
      });

      res.json({
        message: 'Note shared successfully',
        sharedWith: userToShare,
      });
    } catch (error) {
      console.error('Share note error:', error);
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

      // Check if user owns the note
      const note = await prisma.note.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      if (note.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.noteShare.delete({
        where: {
          noteId_userId: {
            noteId: id,
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

// Soft delete note
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user owns the note
      const existingNote = await prisma.note.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      if (existingNote.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.note.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: req.user!.id,
        },
      });

      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Delete note error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
