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

  // Create author with additional data
  const author4 = await prisma.author.create({
    data: {
      name: 'Jane Austen',
      bio: 'English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.',
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
      {
        authorId: author4.id,
        url: 'https://en.wikipedia.org/wiki/Jane_Austen',
        label: 'Wikipedia',
      },
      {
        authorId: author4.id,
        url: 'https://www.janeausten.org/',
        label: 'Jane Austen Society',
      },
    ],
  });

  console.log('✅ Author links created');

  // Create tags (both system and user tags)
  const systemTags = await prisma.tag.createMany({
    data: [
      {
        name: 'Classic',
        description: 'Classic literature',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'American Literature',
        description: 'Literature from American authors',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'Drama',
        description: 'Dramatic works',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'Coming of Age',
        description: 'Stories about growing up',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'Dystopian',
        description: 'Dystopian fiction',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'Political',
        description: 'Political themes',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'Philosophical',
        description: 'Philosophical themes',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'Romance',
        description: 'Romantic themes and relationships',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'British Literature',
        description: 'Literature from British authors',
        isSystem: true,
        isPublic: true,
      },
      {
        name: 'Social Commentary',
        description: 'Works that comment on society',
        isSystem: true,
        isPublic: true,
      },
    ],
  });

  // Create user tags
  await prisma.tag.createMany({
    data: [
      {
        name: 'My Favorites',
        description: 'Personal favorite books',
        isSystem: false,
        isPublic: false,
        createdBy: user1.id,
      },
      {
        name: 'Book Club Picks',
        description: 'Books selected for book club',
        isSystem: false,
        isPublic: true,
        createdBy: user1.id,
      },
      {
        name: 'Must Read',
        description: 'Essential reading list',
        isSystem: false,
        isPublic: true,
        createdBy: user2.id,
      },
      {
        name: 'Quick Reads',
        description: 'Books that can be read quickly',
        isSystem: false,
        isPublic: false,
        createdBy: user2.id,
      },
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
  const romanceTag = allTags.find((t) => t.name === 'Romance');
  const britishTag = allTags.find((t) => t.name === 'British Literature');
  const socialTag = allTags.find((t) => t.name === 'Social Commentary');

  console.log('✅ Tags created');

  // Create publishers
  const publisher1 = await prisma.publisher.create({
    data: {
      name: "Charles Scribner's Sons",
      description:
        'American publisher founded in 1846, known for publishing classic American literature.',
      website: 'https://www.simonandschuster.com',
      address: 'New York, NY, USA',
      foundedYear: 1846,
      country: 'United States',
    },
  });

  const publisher2 = await prisma.publisher.create({
    data: {
      name: 'J.B. Lippincott & Co.',
      description:
        'American publishing house founded in 1836, known for literary fiction.',
      address: 'Philadelphia, PA, USA',
      foundedYear: 1836,
      country: 'United States',
    },
  });

  const publisher3 = await prisma.publisher.create({
    data: {
      name: 'Secker & Warburg',
      description:
        'British publishing house founded in 1936, known for political and literary works.',
      website: 'https://www.penguinrandomhouse.co.uk',
      address: 'London, UK',
      foundedYear: 1936,
      country: 'United Kingdom',
    },
  });

  const publisher4 = await prisma.publisher.create({
    data: {
      name: 'T. Egerton',
      description:
        "Historical British publisher known for Jane Austen's works.",
      address: 'London, UK',
      foundedYear: 1780,
      country: 'United Kingdom',
    },
  });

  const publisher5 = await prisma.publisher.create({
    data: {
      name: 'Grasset',
      description:
        'French publishing house founded in 1907, known for literary works.',
      website: 'https://www.grasset.fr',
      address: 'Paris, France',
      foundedYear: 1907,
      country: 'France',
    },
  });

  console.log('✅ Publishers created');

  // Create books with new schema fields
  const book1 = await prisma.book.create({
    data: {
      workId: 'gatsby-work-001',
      userId: user1.id,
      collectionId: collection1.id,
      publisherId: publisher1.id,
      title: 'The Great Gatsby',
      description:
        'A classic American novel exploring themes of wealth, love, idealism, and moral decay in the Jazz Age.',
      edition: 'First Edition',
      editionPublished: 1925,
      originalLanguage: 'en',
      originalPublished: 1925,
      imageUrl:
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      language: 'en',
      slug: 'the-great-gatsby',
      genre: 'Classic Fiction',
      isPublic: true,
      isDraft: false,
      orderInCollection: 1,
      createdBy: user1.id,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      workId: 'mockingbird-work-001',
      userId: user2.id,
      collectionId: collection1.id,
      publisherId: publisher2.id,
      title: 'To Kill a Mockingbird',
      description:
        'A gripping tale of racial injustice and loss of innocence in the American South.',
      edition: 'Standard Edition',
      editionPublished: 1960,
      originalLanguage: 'en',
      originalPublished: 1960,
      imageUrl:
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      language: 'en',
      slug: 'to-kill-a-mockingbird',
      genre: 'Literary Fiction',
      isPublic: true,
      isDraft: false,
      orderInCollection: 2,
      createdBy: user2.id,
    },
  });

  const book3 = await prisma.book.create({
    data: {
      workId: '1984-work-001',
      userId: user1.id,
      collectionId: collection2.id,
      publisherId: publisher3.id,
      title: '1984',
      description:
        'A dystopian social science fiction novel about totalitarian control and surveillance.',
      edition: 'Modern Edition',
      editionPublished: 1949,
      originalLanguage: 'en',
      originalPublished: 1949,
      imageUrl:
        'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400',
      language: 'en',
      slug: '1984',
      genre: 'Dystopian Fiction',
      isPublic: false,
      isDraft: false,
      orderInCollection: 1,
      createdBy: user1.id,
    },
  });

  const book4 = await prisma.book.create({
    data: {
      workId: 'pride-prejudice-work-001',
      userId: adminUser.id,
      collectionId: collection1.id,
      publisherId: publisher4.id,
      title: 'Pride and Prejudice',
      description:
        'A romantic novel of manners exploring the issues of marriage, money, and love in Georgian England.',
      edition: 'Annotated Edition',
      editionPublished: 1813,
      originalLanguage: 'en',
      originalPublished: 1813,
      imageUrl:
        'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
      language: 'en',
      slug: 'pride-and-prejudice',
      genre: 'Romance',
      isPublic: true,
      isDraft: false,
      orderInCollection: 3,
      createdBy: adminUser.id,
    },
  });

  // Create a French edition of The Great Gatsby to demonstrate multi-edition support
  const book5 = await prisma.book.create({
    data: {
      workId: 'gatsby-work-001', // Same workId as book1
      userId: user2.id,
      collectionId: collection1.id,
      publisherId: publisher5.id,
      title: 'Gatsby le Magnifique',
      description:
        "Un roman classique américain explorant les thèmes de la richesse, de l'amour, de l'idéalisme et de la décadence morale à l'époque du Jazz.",
      edition: 'Édition française',
      editionPublished: 1926,
      originalLanguage: 'en',
      originalPublished: 1925,
      imageUrl:
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      language: 'fr',
      slug: 'gatsby-le-magnifique',
      genre: 'Fiction Classique',
      isPublic: true,
      isDraft: false,
      orderInCollection: 4,
      createdBy: user2.id,
    },
  });

  console.log('✅ Books created');

  // Create book-author relationships with position
  await prisma.bookAuthor.createMany({
    data: [
      { bookId: book1.id, authorId: author1.id, position: 1 },
      { bookId: book2.id, authorId: author2.id, position: 1 },
      { bookId: book3.id, authorId: author3.id, position: 1 },
      { bookId: book4.id, authorId: author4.id, position: 1 },
      { bookId: book5.id, authorId: author1.id, position: 1 }, // French edition of Gatsby
    ],
  });

  console.log('✅ Book-author relationships created');

  // Create paragraphs with content and reading time estimates
  const paragraph1 = await prisma.paragraph.create({
    data: {
      bookId: book1.id,
      content: `In my younger and more vulnerable years my father gave me some advice that I've carried with me ever since.`,
      order: 1,
      chapterNumber: 1,
      readingTimeEst: 2,
      createdBy: user1.id,
    },
  });

  const paragraph2 = await prisma.paragraph.create({
    data: {
      bookId: book1.id,
      content: `"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."`,
      order: 2,
      chapterNumber: 1,
      readingTimeEst: 2,
      createdBy: user1.id,
    },
  });

  const paragraph3 = await prisma.paragraph.create({
    data: {
      bookId: book1.id,
      content: `He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.`,
      order: 3,
      chapterNumber: 1,
      readingTimeEst: 2,
      createdBy: user1.id,
    },
  });

  const paragraph4 = await prisma.paragraph.create({
    data: {
      bookId: book1.id,
      content: `About half way between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land.`,
      order: 4,
      chapterNumber: 2,
      readingTimeEst: 3,
      createdBy: user1.id,
    },
  });

  const paragraph5 = await prisma.paragraph.create({
    data: {
      bookId: book1.id,
      content: `This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, with a transcendent effort, of men who move dimly and already crumbling through the powdery air.`,
      order: 5,
      chapterNumber: 2,
      readingTimeEst: 4,
      createdBy: user1.id,
    },
  });

  const paragraph6 = await prisma.paragraph.create({
    data: {
      bookId: book2.id,
      content: `When I was almost thirteen years old my brother Jem got his arm badly broken at the elbow.`,
      order: 1,
      chapterNumber: 1,
      readingTimeEst: 2,
      createdBy: user2.id,
    },
  });

  const paragraph7 = await prisma.paragraph.create({
    data: {
      bookId: book2.id,
      content: `When it healed, and Jem's fears of never being able to play football were assuaged, he was seldom self-conscious about his injury.`,
      order: 2,
      chapterNumber: 1,
      readingTimeEst: 2,
      createdBy: user2.id,
    },
  });

  const paragraph8 = await prisma.paragraph.create({
    data: {
      bookId: book3.id,
      content: `It was a bright cold day in April, and the clocks were striking thirteen.`,
      order: 1,
      chapterNumber: 1,
      readingTimeEst: 1,
      createdBy: user1.id,
    },
  });

  const paragraph9 = await prisma.paragraph.create({
    data: {
      bookId: book3.id,
      content: `Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.`,
      order: 2,
      chapterNumber: 1,
      readingTimeEst: 3,
      createdBy: user1.id,
    },
  });

  const paragraph10 = await prisma.paragraph.create({
    data: {
      bookId: book4.id,
      content: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.`,
      order: 1,
      chapterNumber: 1,
      readingTimeEst: 2,
      createdBy: adminUser.id,
    },
  });

  const paragraph11 = await prisma.paragraph.create({
    data: {
      bookId: book4.id,
      content: `However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.`,
      order: 2,
      chapterNumber: 1,
      readingTimeEst: 3,
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Paragraphs created');

  // Create book tags
  if (
    classicTag &&
    americanTag &&
    dramaTag &&
    comingOfAgeTag &&
    dystopianTag &&
    politicalTag &&
    romanceTag &&
    britishTag &&
    socialTag
  ) {
    await prisma.bookTag.createMany({
      data: [
        { bookId: book1.id, tagId: classicTag.id },
        { bookId: book1.id, tagId: americanTag.id },
        { bookId: book1.id, tagId: socialTag.id },
        { bookId: book2.id, tagId: classicTag.id },
        { bookId: book2.id, tagId: americanTag.id },
        { bookId: book2.id, tagId: comingOfAgeTag.id },
        { bookId: book2.id, tagId: socialTag.id },
        { bookId: book3.id, tagId: dystopianTag.id },
        { bookId: book3.id, tagId: politicalTag.id },
        { bookId: book3.id, tagId: socialTag.id },
        { bookId: book4.id, tagId: classicTag.id },
        { bookId: book4.id, tagId: romanceTag.id },
        { bookId: book4.id, tagId: britishTag.id },
        { bookId: book4.id, tagId: socialTag.id },
        { bookId: book5.id, tagId: classicTag.id },
        { bookId: book5.id, tagId: americanTag.id },
        { bookId: book5.id, tagId: socialTag.id },
      ],
    });
  }

  // Create author tags
  if (classicTag && americanTag && politicalTag && britishTag && romanceTag) {
    await prisma.authorTag.createMany({
      data: [
        { authorId: author1.id, tagId: classicTag.id },
        { authorId: author1.id, tagId: americanTag.id },
        { authorId: author2.id, tagId: classicTag.id },
        { authorId: author2.id, tagId: americanTag.id },
        { authorId: author3.id, tagId: politicalTag.id },
        { authorId: author3.id, tagId: britishTag.id },
        { authorId: author4.id, tagId: classicTag.id },
        { authorId: author4.id, tagId: romanceTag.id },
        { authorId: author4.id, tagId: britishTag.id },
      ],
    });
  }

  console.log('✅ Tags assigned');

  // Create progress records
  await prisma.progress.createMany({
    data: [
      {
        userId: user1.id,
        bookId: book1.id,
        paragraphId: paragraph1.id,
        position: 25.5,
      },
      {
        userId: user2.id,
        bookId: book2.id,
        paragraphId: paragraph6.id,
        position: 80.0,
      },
      {
        userId: adminUser.id,
        bookId: book3.id,
        paragraphId: paragraph8.id,
        position: 45.2,
      },
    ],
  });

  console.log('✅ Progress records created');

  // Create notes with enhanced structure
  const note1 = await prisma.note.create({
    data: {
      userId: user1.id,
      bookId: book1.id,
      paragraphId: paragraph1.id,
      startIndex: 0,
      endIndex: 50,
      selectedText: 'In my younger and more vulnerable years',
      text: 'This opening line sets the reflective tone of the entire novel.',
      firstContent: 'Nick Carraway establishes himself as narrator.',
      secondContent: 'The theme of judgment and moral relativism begins here.',
      thirdContent: 'Literary device: first-person retrospective narration.',
      noteType: 'highlight',
      isPublic: true,
      createdBy: user1.id,
    },
  });

  const note2 = await prisma.note.create({
    data: {
      userId: user2.id,
      bookId: book2.id,
      paragraphId: paragraph6.id,
      startIndex: 0,
      endIndex: 30,
      selectedText: 'When I was almost thirteen',
      text: 'The story begins with Scout as an adult looking back.',
      firstContent: 'This establishes the retrospective narrative style.',
      secondContent: 'Shows the maturation theme from the start.',
      thirdContent: 'Harper Lee uses this device throughout the novel.',
      noteType: 'comment',
      isPublic: false,
      createdBy: user2.id,
    },
  });

  const note3 = await prisma.note.create({
    data: {
      userId: adminUser.id,
      bookId: book4.id,
      paragraphId: paragraph10.id,
      startIndex: 0,
      endIndex: 60,
      selectedText: 'It is a truth universally acknowledged',
      text: 'One of the most famous opening lines in literature.',
      firstContent:
        'Establishes the satirical tone about marriage and society.',
      secondContent: 'Irony is immediately apparent in this statement.',
      thirdContent: 'Sets up the entire social critique of the novel.',
      noteType: 'definition',
      isPublic: true,
      createdBy: adminUser.id,
    },
  });

  // Create a whole paragraph note (no text selection)
  const note4 = await prisma.note.create({
    data: {
      userId: user1.id,
      bookId: book3.id,
      paragraphId: paragraph8.id,
      startIndex: null,
      endIndex: null,
      selectedText: null,
      text: 'This paragraph perfectly captures the dystopian atmosphere.',
      firstContent: 'The striking thirteen creates immediate unease.',
      secondContent: 'Orwell establishes the unsettling tone from the start.',
      thirdContent: 'Shows how language itself is corrupted in this world.',
      noteType: 'paragraph_note',
      isPublic: true,
      createdBy: user1.id,
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
      {
        userId: adminUser.id,
        bookId: book3.id,
        rating: 5,
        comment: 'Chilling and prophetic. More relevant than ever.',
      },
      {
        userId: user1.id,
        bookId: book4.id,
        rating: 5,
        comment: 'Wit, romance, and social commentary at its finest.',
      },
    ],
  });

  await prisma.paragraphRating.createMany({
    data: [
      {
        userId: user1.id,
        paragraphId: paragraph1.id,
        rating: 4,
        comment: 'Great opening that sets the tone perfectly.',
      },
      {
        userId: user2.id,
        paragraphId: paragraph6.id,
        rating: 5,
        comment: 'Love how the story begins.',
      },
      {
        userId: adminUser.id,
        paragraphId: paragraph10.id,
        rating: 5,
        comment: 'Iconic opening line!',
      },
      {
        userId: user1.id,
        paragraphId: paragraph8.id,
        rating: 5,
        comment: 'Perfectly captures the dystopian atmosphere.',
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
      {
        userId: adminUser.id,
        authorId: author4.id,
        rating: 5,
        comment: 'Jane Austen is unmatched in wit and social observation.',
      },
      {
        userId: user1.id,
        authorId: author3.id,
        rating: 5,
        comment: 'Orwell was a visionary writer.',
      },
    ],
  });

  console.log('✅ Ratings created');

  // Share collections
  await prisma.collectionShare.createMany({
    data: [
      {
        collectionId: collection1.id,
        userId: user2.id,
      },
      {
        collectionId: collection1.id,
        userId: adminUser.id,
      },
    ],
  });

  // Share notes
  await prisma.noteShare.createMany({
    data: [
      {
        noteId: note1.id,
        userId: user2.id,
      },
      {
        noteId: note3.id,
        userId: user1.id,
      },
      {
        noteId: note4.id,
        userId: user2.id,
      },
    ],
  });

  console.log('✅ Sharing relationships created');

  // Create sample reports (admin will review these)
  const report1 = await prisma.report.create({
    data: {
      userId: user2.id,
      reportType: 'SPELLING_ERROR',
      description:
        'There seems to be a typo in this paragraph - "beleive" should be "believe"',
      paragraphId: paragraph5.id,
      status: 'PENDING',
    },
  });

  const report2 = await prisma.report.create({
    data: {
      userId: user1.id,
      reportType: 'INAPPROPRIATE_CONTENT',
      description:
        'This note contains inappropriate language that should be reviewed',
      noteId: note2.id,
      status: 'UNDER_REVIEW',
    },
  });

  const report3 = await prisma.report.create({
    data: {
      userId: user2.id,
      reportType: 'INCORRECT_INFORMATION',
      description:
        'The publication year listed seems incorrect based on my research',
      bookId: book3.id,
      status: 'PENDING',
    },
  });

  const report4 = await prisma.report.create({
    data: {
      userId: user1.id,
      reportType: 'DUPLICATE_CONTENT',
      description: 'This author appears to be a duplicate of another entry',
      authorId: author2.id,
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedBy: adminUser.id,
      adminNotes:
        'Checked - this is not a duplicate, different author with similar name.',
    },
  });

  // Create some rating reports
  const bookRating1 = await prisma.bookRating.findFirst({
    where: { userId: user1.id, bookId: book2.id },
  });

  const paragraphRating1 = await prisma.paragraphRating.findFirst({
    where: { userId: user1.id, paragraphId: paragraph1.id },
  });

  if (bookRating1) {
    await prisma.report.create({
      data: {
        userId: user2.id,
        reportType: 'OTHER',
        description: 'This rating seems fake - user has never read this book',
        bookRatingId: bookRating1.id,
        status: 'PENDING',
      },
    });
  }

  if (paragraphRating1) {
    await prisma.report.create({
      data: {
        userId: adminUser.id,
        reportType: 'INAPPROPRIATE_CONTENT',
        description: 'Rating comment contains inappropriate language',
        paragraphRatingId: paragraphRating1.id,
        status: 'DISMISSED',
        resolvedAt: new Date(),
        resolvedBy: adminUser.id,
        adminNotes:
          'Reviewed - comment is acceptable within community guidelines.',
      },
    });
  }

  console.log('✅ Sample reports created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Sample accounts:');
  console.log('  📧 admin@example.com (password: password123) - ADMIN');
  console.log('  📧 john@example.com (password: password123) - USER');
  console.log('  📧 jane@example.com (password: password123) - USER');
  console.log('\n📚 Sample data includes:');
  console.log(
    '  • 5 books with descriptions, editions, and multilingual support'
  );
  console.log('  • 4 authors with bios and external links');
  console.log('  • 5 publishers with company information');
  console.log('  • 2 collections (public and private)');
  console.log('  • 11 paragraphs with content and reading time estimates');
  console.log('  • 14 comprehensive tags (system and user tags)');
  console.log('  • Book, paragraph, and author ratings');
  console.log('  • 4 notes with multi-level content and different types');
  console.log('  • Progress tracking across multiple paragraphs');
  console.log('  • Sharing relationships between users');
  console.log('  • 6 sample reports demonstrating the reporting system');
  console.log(
    '  • Multi-edition support (The Great Gatsby in English and French)'
  );
  console.log('  • Publisher relationships for complete bibliographic data');
  console.log('  • Enhanced tagging system with system and user-created tags');
  console.log('  • Comprehensive reporting system for content moderation');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
