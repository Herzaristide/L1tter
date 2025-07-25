import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all user preferences
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await prisma.userPreference.findMany({
      where: { userId: req.user!.id },
      orderBy: { key: 'asc' },
    });

    // Convert to key-value object for easier use
    const preferencesObject = preferences.reduce((acc, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {} as Record<string, string>);

    res.json({
      preferences: preferencesObject,
      raw: preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific preference by key
router.get(
  '/:key',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { key } = req.params;

      const preference = await prisma.userPreference.findUnique({
        where: {
          userId_key: {
            userId: req.user!.id,
            key,
          },
        },
      });

      if (!preference) {
        return res.status(404).json({ error: 'Preference not found' });
      }

      res.json(preference);
    } catch (error) {
      console.error('Get preference error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Set or update preference
router.put(
  '/:key',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined || value === null) {
        return res.status(400).json({ error: 'Value is required' });
      }

      const preference = await prisma.userPreference.upsert({
        where: {
          userId_key: {
            userId: req.user!.id,
            key,
          },
        },
        update: {
          value: String(value),
          updatedAt: new Date(),
        },
        create: {
          userId: req.user!.id,
          key,
          value: String(value),
        },
      });

      res.json({
        message: 'Preference saved successfully',
        preference,
      });
    } catch (error) {
      console.error('Set preference error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Set multiple preferences at once
router.post(
  '/batch',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        return res
          .status(400)
          .json({ error: 'Preferences object is required' });
      }

      const results = await Promise.all(
        Object.entries(preferences).map(async ([key, value]) => {
          return prisma.userPreference.upsert({
            where: {
              userId_key: {
                userId: req.user!.id,
                key,
              },
            },
            update: {
              value: String(value),
              updatedAt: new Date(),
            },
            create: {
              userId: req.user!.id,
              key,
              value: String(value),
            },
          });
        })
      );

      res.json({
        message: 'Preferences saved successfully',
        preferences: results,
      });
    } catch (error) {
      console.error('Set batch preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete specific preference
router.delete(
  '/:key',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { key } = req.params;

      await prisma.userPreference.delete({
        where: {
          userId_key: {
            userId: req.user!.id,
            key,
          },
        },
      });

      res.json({ message: 'Preference deleted successfully' });
    } catch (error) {
      console.error('Delete preference error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Reset all preferences to defaults
router.post(
  '/reset',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      // Delete all existing preferences
      await prisma.userPreference.deleteMany({
        where: { userId: req.user!.id },
      });

      // Set default preferences
      const defaultPreferences = [
        { key: 'theme', value: 'light' },
        { key: 'fontSize', value: '16' },
        { key: 'preferredLanguage', value: 'en' },
        { key: 'readingSpeed', value: 'normal' },
        { key: 'autoBookmark', value: 'true' },
        { key: 'showProgressBar', value: 'true' },
        { key: 'enableNotifications', value: 'true' },
      ];

      const createdPreferences = await Promise.all(
        defaultPreferences.map((pref) =>
          prisma.userPreference.create({
            data: {
              userId: req.user!.id,
              key: pref.key,
              value: pref.value,
            },
          })
        )
      );

      res.json({
        message: 'Preferences reset to defaults',
        preferences: createdPreferences,
      });
    } catch (error) {
      console.error('Reset preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get available preference options/schema
router.get('/schema/options', async (req: AuthRequest, res: Response) => {
  try {
    const schema = {
      theme: {
        type: 'string',
        options: ['light', 'dark', 'auto'],
        default: 'light',
        description: 'Color theme for the application',
      },
      fontSize: {
        type: 'string',
        options: ['12', '14', '16', '18', '20', '24'],
        default: '16',
        description: 'Font size for reading content',
      },
      preferredLanguage: {
        type: 'string',
        options: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
        default: 'en',
        description: 'Preferred language for content display',
      },
      readingSpeed: {
        type: 'string',
        options: ['slow', 'normal', 'fast'],
        default: 'normal',
        description: 'Reading speed preference for recommendations',
      },
      autoBookmark: {
        type: 'boolean',
        default: 'true',
        description: 'Automatically bookmark reading progress',
      },
      showProgressBar: {
        type: 'boolean',
        default: 'true',
        description: 'Show reading progress bar',
      },
      enableNotifications: {
        type: 'boolean',
        default: 'true',
        description: 'Enable push notifications',
      },
      pageTransition: {
        type: 'string',
        options: ['none', 'fade', 'slide'],
        default: 'fade',
        description: 'Page transition animation',
      },
      readingMode: {
        type: 'string',
        options: ['paginated', 'continuous'],
        default: 'paginated',
        description: 'Reading layout mode',
      },
      lineHeight: {
        type: 'string',
        options: ['1.2', '1.4', '1.6', '1.8', '2.0'],
        default: '1.6',
        description: 'Line height for reading content',
      },
    };

    res.json({ schema });
  } catch (error) {
    console.error('Get preference schema error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
