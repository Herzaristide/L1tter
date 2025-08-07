import { Router, Response } from 'express';
import meiliClient from '../utils/meiliClient';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Universal search endpoint - searches across all tables with one string
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = '50' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const searchLimit = parseInt(limit as string);
    const searchQuery = q as string;

    // Define all the indexes/tables to search (updated schema)
    const searchIndexes = [
      { name: 'users', type: 'user' },
      { name: 'collections', type: 'collection' },
      { name: 'books', type: 'book' },
      { name: 'tags', type: 'tag' },
      { name: 'paragraphs', type: 'paragraph' }, // Updated from chapters
      { name: 'notes', type: 'note' },
      { name: 'authors', type: 'author' },
      { name: 'publishers', type: 'publisher' },
      { name: 'progress', type: 'progress' },
      { name: 'book-ratings', type: 'book-rating' },
      // Note: reports index excluded from general search for privacy
    ];

    // Search all indexes in parallel
    const searchPromises = searchIndexes.map(async (index) => {
      try {
        const result = await meiliClient.index(index.name).search(searchQuery, {
          limit: Math.ceil(searchLimit / searchIndexes.length),
          attributesToHighlight: ['*'],
        });
        return result.hits.map((hit) => ({
          ...hit,
          type: index.type,
          index: index.name,
        }));
      } catch (error) {
        console.warn(`Search failed for index ${index.name}:`, error);
        return [];
      }
    });

    const allResults = await Promise.all(searchPromises);
    const combinedResults = allResults.flat();

    // Sort by relevance score if available
    combinedResults.sort((a, b) => {
      const scoreA = (a as any)._rankingScore || 0;
      const scoreB = (b as any)._rankingScore || 0;
      return scoreB - scoreA;
    });

    // Limit final results
    const finalResults = combinedResults.slice(0, searchLimit);

    res.json({
      results: finalResults,
      query: searchQuery,
      total: finalResults.length,
      totalFound: combinedResults.length,
      searchedIndexes: searchIndexes.map((idx) => idx.name),
    });
  } catch (error) {
    console.error('Universal search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search specifically for books (optimized for frontend dropdown)
router.get(
  '/books',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { q, limit = '10' } = req.query;

      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const searchLimit = parseInt(limit as string);

      // Search only books index
      const bookResults = await meiliClient
        .index('books')
        .search(q as string, {
          limit: searchLimit,
          filter: `(isPublic = true OR userId = "${
            req.user?.id || ''
          }") AND deletedAt IS NULL`,
          attributesToHighlight: ['title', 'description'],
        })
        .catch(() => ({ hits: [] }));

      res.json(bookResults.hits.slice(0, searchLimit));
    } catch (error) {
      console.error('Book search error:', error);
      res.status(500).json({ error: 'Book search failed' });
    }
  }
);

// Search by specific type/table
router.get(
  '/by-type/:type',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.params;
      const { q, limit = '20' } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query (q) is required' });
      }

      const searchLimit = parseInt(limit as string);

      // Map types to indexes (updated schema)
      const typeToIndex: Record<string, string> = {
        user: 'users',
        users: 'users',
        collection: 'collections',
        collections: 'collections',
        book: 'books',
        books: 'books',
        tag: 'tags',
        tags: 'tags',
        paragraph: 'paragraphs', // Updated from chapter
        paragraphs: 'paragraphs', // Updated from chapters
        note: 'notes',
        notes: 'notes',
        author: 'authors',
        authors: 'authors',
        publisher: 'publishers',
        publishers: 'publishers',
        progress: 'progress',
        'book-rating': 'book-ratings',
        'book-ratings': 'book-ratings',
        rating: 'book-ratings',
        ratings: 'book-ratings',
      };

      const indexName = typeToIndex[type.toLowerCase()];
      if (!indexName) {
        return res.status(400).json({ error: `Invalid search type: ${type}` });
      }

      const result = await meiliClient.index(indexName).search(q as string, {
        limit: searchLimit,
        attributesToHighlight: ['*'],
      });

      res.json({
        results: result.hits.map((hit) => ({
          ...hit,
          type: type.toLowerCase(),
        })),
        query: q,
        total: result.hits.length,
        estimatedTotalHits: result.estimatedTotalHits,
        type: type,
      });
    } catch (error) {
      console.error(`Search error for type ${req.params.type}:`, error);
      res
        .status(500)
        .json({ error: `Search failed for type: ${req.params.type}` });
    }
  }
);

// Admin-only: Search reports
router.get(
  '/reports',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { q, status, reportType, limit = '50' } = req.query;
      const searchLimit = parseInt(limit as string);

      let filter = '';
      const filters = [];

      if (status && typeof status === 'string') {
        filters.push(`status = "${status}"`);
      }

      if (reportType && typeof reportType === 'string') {
        filters.push(`reportType = "${reportType}"`);
      }

      if (filters.length > 0) {
        filter = filters.join(' AND ');
      }

      const searchOptions: any = {
        limit: searchLimit,
        attributesToHighlight: ['description', 'adminNotes'],
      };

      if (filter) {
        searchOptions.filter = filter;
      }

      const result = await meiliClient
        .index('reports')
        .search((q as string) || '', searchOptions);

      res.json({
        results: result.hits.map((hit) => ({
          ...hit,
          type: 'report',
        })),
        query: q || '',
        total: result.hits.length,
        estimatedTotalHits: result.estimatedTotalHits,
        appliedFilters: { status, reportType },
      });
    } catch (error) {
      console.error('Reports search error:', error);
      res.status(500).json({ error: 'Reports search failed' });
    }
  }
);

// Search user's progress
router.get(
  '/progress',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { q, limit = '20' } = req.query;
      const searchLimit = parseInt(limit as string);

      const searchOptions: any = {
        limit: searchLimit,
        filter: `userId = "${req.user?.id}"`,
        attributesToHighlight: ['*'],
      };

      const result = await meiliClient
        .index('progress')
        .search((q as string) || '', searchOptions);

      res.json({
        results: result.hits.map((hit) => ({
          ...hit,
          type: 'progress',
        })),
        query: q || '',
        total: result.hits.length,
        estimatedTotalHits: result.estimatedTotalHits,
      });
    } catch (error) {
      console.error('Progress search error:', error);
      res.status(500).json({ error: 'Progress search failed' });
    }
  }
);

// Search user's ratings
router.get(
  '/ratings',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { q, minRating, maxRating, limit = '20' } = req.query;
      const searchLimit = parseInt(limit as string);

      const filters = [`userId = "${req.user?.id}"`];

      if (minRating && typeof minRating === 'string') {
        filters.push(`rating >= ${parseInt(minRating)}`);
      }

      if (maxRating && typeof maxRating === 'string') {
        filters.push(`rating <= ${parseInt(maxRating)}`);
      }

      const searchOptions: any = {
        limit: searchLimit,
        filter: filters.join(' AND '),
        attributesToHighlight: ['comment'],
      };

      const result = await meiliClient
        .index('book-ratings')
        .search((q as string) || '', searchOptions);

      res.json({
        results: result.hits.map((hit) => ({
          ...hit,
          type: 'book-rating',
        })),
        query: q || '',
        total: result.hits.length,
        estimatedTotalHits: result.estimatedTotalHits,
        appliedFilters: { minRating, maxRating },
      });
    } catch (error) {
      console.error('Ratings search error:', error);
      res.status(500).json({ error: 'Ratings search failed' });
    }
  }
);

export default router;
