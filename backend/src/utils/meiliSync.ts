import { PrismaClient } from '@prisma/client';
import meiliClient from './meiliClient';

const prisma = new PrismaClient();

async function syncAllToMeili() {
  try {
    // Book
    await meiliClient.createIndex('books', { primaryKey: 'id' });
    await meiliClient
      .index('books')
      .updateSearchableAttributes([
        'title',
        'description',
        'genre',
        'language',
        'slug',
      ]);
    const books = await prisma.book.findMany({ where: { deletedAt: null } });
    console.log(`Found ${books.length} books`);
    if (books.length > 0) {
      const bookResult = await meiliClient.index('books').addDocuments(books);
      console.log(`Books sync result:`, bookResult);
    }

    // User
    await meiliClient.createIndex('users', { primaryKey: 'id' });
    await meiliClient
      .index('users')
      .updateSearchableAttributes(['name', 'email']);
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    if (users.length > 0) {
      const userResult = await meiliClient.index('users').addDocuments(users);
      console.log(`Users sync result:`, userResult);
    }

    // Collection
    await meiliClient.createIndex('collections', { primaryKey: 'id' });
    await meiliClient
      .index('collections')
      .updateSearchableAttributes(['name', 'description']);
    const collections = await prisma.collection.findMany({
      where: { deletedAt: null },
    });
    console.log(`Found ${collections.length} collections`);
    if (collections.length > 0) {
      const collectionResult = await meiliClient
        .index('collections')
        .addDocuments(collections);
      console.log(`Collections sync result:`, collectionResult);
    }

    // Tag
    await meiliClient.createIndex('tags', { primaryKey: 'id' });
    await meiliClient
      .index('tags')
      .updateSearchableAttributes(['name', 'description']);
    const tags = await prisma.tag.findMany({ where: { deletedAt: null } });
    console.log(`Found ${tags.length} tags`);
    if (tags.length > 0) {
      const tagResult = await meiliClient.index('tags').addDocuments(tags);
      console.log(`Tags sync result:`, tagResult);
    }

    // Chapter
    await meiliClient.createIndex('chapters', { primaryKey: 'id' });
    await meiliClient
      .index('chapters')
      .updateSearchableAttributes(['title', 'content', 'order', 'bookId']);
    const chapters = await prisma.chapter.findMany({
      where: { deletedAt: null },
    });
    console.log(`Found ${chapters.length} chapters`);
    if (chapters.length > 0) {
      const chapterResult = await meiliClient
        .index('chapters')
        .addDocuments(chapters);
      console.log(`Chapters sync result:`, chapterResult);
    }

    // Note
    await meiliClient.createIndex('notes', { primaryKey: 'id' });
    await meiliClient
      .index('notes')
      .updateSearchableAttributes([
        'text',
        'firstContent',
        'secondContent',
        'thirdContent',
      ]);
    const notes = await prisma.note.findMany({ where: { deletedAt: null } });
    console.log(`Found ${notes.length} notes`);
    if (notes.length > 0) {
      const noteResult = await meiliClient.index('notes').addDocuments(notes);
      console.log(`Notes sync result:`, noteResult);
    }

    // Author
    await meiliClient.createIndex('authors', { primaryKey: 'id' });
    await meiliClient
      .index('authors')
      .updateSearchableAttributes(['name', 'bio']);
    const authors = await prisma.author.findMany({
      where: { deletedAt: null },
    });
    console.log(`Found ${authors.length} authors`);
    if (authors.length > 0) {
      const authorResult = await meiliClient
        .index('authors')
        .addDocuments(authors);
      console.log(`Authors sync result:`, authorResult);
    }

    // Publisher
    await meiliClient.createIndex('publishers', { primaryKey: 'id' });
    await meiliClient
      .index('publishers')
      .updateSearchableAttributes(['name', 'description', 'country']);
    const publishers = await prisma.publisher.findMany({
      where: { deletedAt: null },
    });
    console.log(`Found ${publishers.length} publishers`);
    if (publishers.length > 0) {
      const publisherResult = await meiliClient
        .index('publishers')
        .addDocuments(publishers);
      console.log(`Publishers sync result:`, publisherResult);
    }

    console.log('Meilisearch sync complete!');
  } catch (error) {
    console.error('Detailed sync error:', error);
    throw error;
  }
}
if (require.main === module) {
  syncAllToMeili().catch((err) => {
    console.error('Meilisearch sync error:', err);
    process.exit(1);
  });
}

export default syncAllToMeili;
