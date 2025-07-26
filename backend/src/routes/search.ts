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

    // Define all the indexes/tables to search
    const searchIndexes = [
      { name: 'users', type: 'user' },
      { name: 'collections', type: 'collection' },
      { name: 'books', type: 'book' },
      { name: 'book_locales', type: 'book_locale' },
      { name: 'tags', type: 'tag' },
      { name: 'chapters', type: 'chapter' },
      { name: 'chapter_locales', type: 'chapter_locale' },
      { name: 'notes', type: 'note' },
      { name: 'authors', type: 'author' },
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

    // Sort by relevance score if available, otherwise by relevance heuristics
    combinedResults.sort((a, b) => {
      // Meilisearch provides ranking score
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

      // Search both books and book_locales for comprehensive results
      const [bookResults, bookLocaleResults] = await Promise.all([
        meiliClient
          .index('books')
          .search(q as string, {
            limit: searchLimit,
            filter: `isPublic = true OR userId = "${req.user?.id || ''}"`,
            attributesToHighlight: ['title'],
          })
          .catch(() => ({ hits: [] })),

        meiliClient
          .index('book_locales')
          .search(q as string, {
            limit: searchLimit,
            attributesToHighlight: ['title'],
          })
          .catch(() => ({ hits: [] })),
      ]);

      // Combine and deduplicate results
      const combinedHits = [...bookResults.hits, ...bookLocaleResults.hits];
      const uniqueBooks = combinedHits.reduce((acc, hit) => {
        const bookId = (hit as any).bookId || (hit as any).id;
        if (
          !acc.find(
            (item) =>
              (item as any).id === bookId || (item as any).bookId === bookId
          )
        ) {
          acc.push({ ...hit, type: 'book' });
        }
        return acc;
      }, [] as any[]);

      res.json(uniqueBooks.slice(0, searchLimit));
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

      // Map types to indexes
      const typeToIndex: Record<string, string> = {
        user: 'users',
        users: 'users',
        collection: 'collections',
        collections: 'collections',
        book: 'books',
        books: 'books',
        book_locale: 'book_locales',
        book_locales: 'book_locales',
        tag: 'tags',
        tags: 'tags',
        chapter: 'chapters',
        chapters: 'chapters',
        chapter_locale: 'chapter_locales',
        chapter_locales: 'chapter_locales',
        note: 'notes',
        notes: 'notes',
        author: 'authors',
        authors: 'authors',
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
