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

    // Define all the indexes/tables to search (new schema only)
    const searchIndexes = [
      { name: 'users', type: 'user' },
      { name: 'collections', type: 'collection' },
      { name: 'books', type: 'book' },
      { name: 'tags', type: 'tag' },
      { name: 'chapters', type: 'chapter' },
      { name: 'notes', type: 'note' },
      { name: 'authors', type: 'author' },
      { name: 'publishers', type: 'publisher' },
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
          filter: `isPublic = true OR userId = "${req.user?.id || ''}"`,
          attributesToHighlight: ['title'],
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

      // Map types to indexes (new schema only)
      const typeToIndex: Record<string, string> = {
        user: 'users',
        users: 'users',
        collection: 'collections',
        collections: 'collections',
        book: 'books',
        books: 'books',
        tag: 'tags',
        tags: 'tags',
        chapter: 'chapters',
        chapters: 'chapters',
        note: 'notes',
        notes: 'notes',
        author: 'authors',
        authors: 'authors',
        publisher: 'publishers',
        publishers: 'publishers',
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

export default router;
