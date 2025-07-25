import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      imageUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'USER',
      imageUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'USER',
      imageUrl:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    },
  });

  console.log('✅ Users created');

  // Create user preferences
  await prisma.userPreference.createMany({
    data: [
      { userId: user1.id, key: 'preferredLanguage', value: 'en' },
      { userId: user1.id, key: 'theme', value: 'dark' },
      { userId: user1.id, key: 'fontSize', value: '16' },
      { userId: user2.id, key: 'preferredLanguage', value: 'fr' },
      { userId: user2.id, key: 'theme', value: 'light' },
      { userId: user2.id, key: 'fontSize', value: '14' },
    ],
  });

  console.log('✅ User preferences created');

  // Create collections
  const collection1 = await prisma.collection.create({
    data: {
      name: 'Classic Literature',
      description: 'Timeless classics that everyone should read',
      ownerId: user1.id,
      isPublic: true,
      createdBy: user1.id,
    },
  });

  const collection2 = await prisma.collection.create({
    data: {
      name: 'Modern Fiction',
      description: 'Contemporary novels and stories',
      ownerId: user2.id,
      isPublic: false,
      createdBy: user2.id,
    },
  });

  console.log('✅ Collections created');

  // Create authors
  const author1 = await prisma.author.create({
    data: {
      name: 'F. Scott Fitzgerald',
      bio: 'American novelist and short story writer, widely regarded as one of the greatest American writers of the 20th century.',
    },
  });

  const author2 = await prisma.author.create({
    data: {
      name: 'Harper Lee',
      bio: 'American novelist best known for her 1960 novel To Kill a Mockingbird.',
    },
  });

  const author3 = await prisma.author.create({
    data: {
      name: 'George Orwell',
      bio: 'English novelist, essayist, journalist and critic whose work is characterised by lucid prose, biting social criticism, opposition to totalitarianism, and outspoken support of democratic socialism.',
    },
  });

  console.log('✅ Authors created');

  // Create author links
  await prisma.authorLink.createMany({
    data: [
      {
        authorId: author1.id,
        url: 'https://en.wikipedia.org/wiki/F._Scott_Fitzgerald',
        label: 'Wikipedia',
      },
      {
        authorId: author2.id,
        url: 'https://en.wikipedia.org/wiki/Harper_Lee',
        label: 'Wikipedia',
      },
      {
        authorId: author3.id,
        url: 'https://en.wikipedia.org/wiki/George_Orwell',
        label: 'Wikipedia',
      },
      {
        authorId: author3.id,
        url: 'https://www.orwellfoundation.com/',
        label: 'Official Foundation',
      },
    ],
  });

  console.log('✅ Author links created');

  // Create tags
  const tags = await prisma.tag.createMany({
    data: [
      { name: 'Classic', description: 'Classic literature' },
      {
        name: 'American Literature',
        description: 'Literature from American authors',
      },
      { name: 'Drama', description: 'Dramatic works' },
      { name: 'Coming of Age', description: 'Stories about growing up' },
      { name: 'Dystopian', description: 'Dystopian fiction' },
      { name: 'Political', description: 'Political themes' },
      { name: 'Philosophical', description: 'Philosophical themes' },
    ],
  });

  // Get created tags
  const allTags = await prisma.tag.findMany();
  const classicTag = allTags.find((t) => t.name === 'Classic');
  const americanTag = allTags.find((t) => t.name === 'American Literature');
  const dramaTag = allTags.find((t) => t.name === 'Drama');
  const comingOfAgeTag = allTags.find((t) => t.name === 'Coming of Age');
  const dystopianTag = allTags.find((t) => t.name === 'Dystopian');
  const politicalTag = allTags.find((t) => t.name === 'Political');

  console.log('✅ Tags created');

  // Create books
  const book1 = await prisma.book.create({
    data: {
      userId: user1.id,
      collectionId: collection1.id,
      isPublic: true,
      orderInCollection: 1,
      createdBy: user1.id,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      userId: user2.id,
      collectionId: collection1.id,
      isPublic: true,
      orderInCollection: 2,
      createdBy: user2.id,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      userId: user1.id,
      collectionId: collection2.id,
      isPublic: false,
      orderInCollection: 1,
      createdBy: user1.id,
    },
  });

  console.log('✅ Books created');

  // Create book locales (multilingual support)
  await prisma.bookLocale.createMany({
    data: [
      // The Great Gatsby - English
      {
        bookId: book1.id,
        language: 'en',
        title: 'The Great Gatsby',
        imageUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      },
      // The Great Gatsby - French
      {
        bookId: book1.id,
        language: 'fr',
        title: 'Gatsby le Magnifique',
        imageUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      },
      // To Kill a Mockingbird - English
      {
        bookId: book2.id,
        language: 'en',
        title: 'To Kill a Mockingbird',
        imageUrl:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
      // To Kill a Mockingbird - French
      {
        bookId: book2.id,
        language: 'fr',
        title: "Ne tirez pas sur l'oiseau moqueur",
        imageUrl:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
      // 1984 - English
      {
        bookId: book3.id,
        language: 'en',
        title: '1984',
        imageUrl:
          'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400',
      },
      // 1984 - Spanish
      {
        bookId: book3.id,
        language: 'es',
        title: 'Mil novecientos ochenta y cuatro',
        imageUrl:
          'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400',
      },
    ],
  });

  console.log('✅ Book locales created');

  // Create book-author relationships
  await prisma.bookAuthor.createMany({
    data: [
      { bookId: book1.id, authorId: author1.id },
      { bookId: book2.id, authorId: author2.id },
      { bookId: book3.id, authorId: author3.id },
    ],
  });

  console.log('✅ Book-author relationships created');

  // Create chapters
  const chapter1 = await prisma.chapter.create({
    data: {
      bookId: book1.id,
      order: 1,
      createdBy: user1.id,
    },
  });

  const chapter2 = await prisma.chapter.create({
    data: {
      bookId: book1.id,
      order: 2,
      createdBy: user1.id,
    },
  });

  const chapter3 = await prisma.chapter.create({
    data: {
      bookId: book2.id,
      order: 1,
      createdBy: user2.id,
    },
  });

  console.log('✅ Chapters created');

  // Create chapter locales (multilingual content)
  await prisma.chapterLocale.createMany({
    data: [
      // Great Gatsby Chapter 1 - English
      {
        chapterId: chapter1.id,
        language: 'en',
        title: 'Chapter 1',
        content: `In my younger and more vulnerable years my father gave me some advice that I've carried with me ever since.

"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."

He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.

In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.`,
      },
      // Great Gatsby Chapter 1 - French
      {
        chapterId: chapter1.id,
        language: 'fr',
        title: 'Chapitre 1',
        content: `Dans mes années les plus jeunes et les plus vulnérables, mon père m'a donné un conseil que j'ai gardé avec moi depuis.

"Chaque fois que tu as envie de critiquer quelqu'un," m'a-t-il dit, "souviens-toi que tous les gens de ce monde n'ont pas eu les avantages que tu as eus."

Il n'en a pas dit davantage, mais nous avons toujours été exceptionnellement communicatifs d'une manière réservée, et j'ai compris qu'il voulait dire beaucoup plus que cela.`,
      },
      // Great Gatsby Chapter 2 - English
      {
        chapterId: chapter2.id,
        language: 'en',
        title: 'Chapter 2',
        content: `About half way between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land.

This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, with a transcendent effort, of men who move dimly and already crumbling through the powdery air.`,
      },
      // To Kill a Mockingbird Chapter 1 - English
      {
        chapterId: chapter3.id,
        language: 'en',
        title: 'Chapter 1',
        content: `When I was almost thirteen years old my brother Jem got his arm badly broken at the elbow.

When it healed, and Jem's fears of never being able to play football were assuaged, he was seldom self-conscious about his injury.

His left arm was somewhat shorter than his right; when he stood or walked, the back of his hand was at right angles to his body, his thumb parallel to his thigh.`,
      },
    ],
  });

  console.log('✅ Chapter locales created');

  // Create book tags
  if (
    classicTag &&
    americanTag &&
    dramaTag &&
    comingOfAgeTag &&
    dystopianTag &&
    politicalTag
  ) {
    await prisma.bookTag.createMany({
      data: [
        { bookId: book1.id, tagId: classicTag.id },
        { bookId: book1.id, tagId: americanTag.id },
        { bookId: book2.id, tagId: classicTag.id },
        { bookId: book2.id, tagId: americanTag.id },
        { bookId: book2.id, tagId: comingOfAgeTag.id },
        { bookId: book3.id, tagId: dystopianTag.id },
        { bookId: book3.id, tagId: politicalTag.id },
      ],
    });
  }

  // Create author tags
  if (classicTag && americanTag && politicalTag) {
    await prisma.authorTag.createMany({
      data: [
        { authorId: author1.id, tagId: classicTag.id },
        { authorId: author1.id, tagId: americanTag.id },
        { authorId: author2.id, tagId: classicTag.id },
        { authorId: author2.id, tagId: americanTag.id },
        { authorId: author3.id, tagId: politicalTag.id },
      ],
    });
  }

  console.log('✅ Tags assigned');

  // Create progress records
  await prisma.progress.createMany({
    data: [
      {
        userId: user1.id,
        chapterId: chapter1.id,
        position: 150,
      },
      {
        userId: user2.id,
        chapterId: chapter3.id,
        position: 75,
      },
    ],
  });

  console.log('✅ Progress records created');

  // Create notes
  const note1 = await prisma.note.create({
    data: {
      userId: user1.id,
      bookId: book1.id,
      chapterId: chapter1.id,
      startIndex: 0,
      endIndex: 50,
      text: 'In my younger and more vulnerable years',
      firstContent:
        'This opening line sets the reflective tone of the entire novel.',
      secondContent: 'Oki .',
      thirdContent: '',
      isPublic: true,
      createdBy: user1.id,
    },
  });

  const note2 = await prisma.note.create({
    data: {
      userId: user2.id,
      bookId: book2.id,
      chapterId: chapter3.id,
      startIndex: 0,
      endIndex: 30,
      text: 'When I was almost thirteen',
      firstContent: 'The story begins with Scout as an adult looking back.',
      thirdContent: 'The story begins with Scout as an adult looking back.',
      isPublic: false,
      createdBy: user2.id,
    },
  });

  console.log('✅ Notes created');

  // Create ratings
  await prisma.bookRating.createMany({
    data: [
      {
        userId: user1.id,
        bookId: book2.id,
        rating: 5,
        comment: 'A masterpiece of American literature!',
      },
      {
        userId: user2.id,
        bookId: book1.id,
        rating: 4,
        comment: 'Beautiful prose and compelling characters.',
      },
    ],
  });

  await prisma.authorRating.createMany({
    data: [
      {
        userId: user1.id,
        authorId: author2.id,
        rating: 5,
        comment: "Harper Lee's writing is incredibly powerful.",
      },
      {
        userId: user2.id,
        authorId: author1.id,
        rating: 4,
        comment: 'Fitzgerald captures the Jazz Age perfectly.',
      },
    ],
  });

  console.log('✅ Ratings created');

  // Share collections
  await prisma.collectionShare.create({
    data: {
      collectionId: collection1.id,
      userId: user2.id,
    },
  });

  // Share notes
  await prisma.noteShare.create({
    data: {
      noteId: note1.id,
      userId: user2.id,
    },
  });

  console.log('✅ Sharing relationships created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Sample accounts:');
  console.log('  📧 admin@example.com (password: password123) - ADMIN');
  console.log('  📧 john@example.com (password: password123) - USER');
  console.log('  📧 jane@example.com (password: password123) - USER');
  console.log('\n📚 Sample data includes:');
  console.log(
    '  • 3 books with multilingual support (English, French, Spanish)'
  );
  console.log('  • 3 authors with bios and links');
  console.log('  • 2 collections (public and private)');
  console.log('  • Multiple chapters with content in different languages');
  console.log('  • Tags, ratings, notes, and progress tracking');
  console.log('  • Sharing relationships between users');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
