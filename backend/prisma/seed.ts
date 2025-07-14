import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.progress.deleteMany({});
  await prisma.paragraph.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.user.deleteMany({});

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
    },
  });

  // Create sample books
  const book1 = await prisma.book.create({
    data: {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      userId: user1.id,
    },
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      userId: user2.id,
    },
  });

  // Create sample paragraphs for book1 (The Great Gatsby)
  const gatsbyParagraphs = [
    "In my younger and more vulnerable years my father gave me some advice that I've carried with me ever since.",
    "'Whenever you feel like criticizing any one,' he told me, 'just remember that all the people in this world haven't had the advantages that you've had.'",
    "He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.",
    "In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.",
    'The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men.',
  ];

  for (let i = 0; i < gatsbyParagraphs.length; i++) {
    await prisma.paragraph.create({
      data: {
        bookId: book1.id,
        order: i + 1,
        content: gatsbyParagraphs[i],
      },
    });
  }

  // Create sample paragraphs for book2 (To Kill a Mockingbird)
  const mockingbirdParagraphs = [
    "When I was almost six and Jem was nearly ten, our summertime boundaries (within calling distance of Calpurnia) were Mrs. Henry Lafayette Dubose's house two doors to the north of us, and the Radley Place three doors to the south.",
    'We never put back into the tree what we took out of it: we had given him nothing, and it made me sad.',
    "Mockingbirds don't do one thing but make music for us to enjoy. They don't eat up people's gardens, don't nest in corncribs, they don't do one thing but sing their hearts out for us.",
  ];

  for (let i = 0; i < mockingbirdParagraphs.length; i++) {
    await prisma.paragraph.create({
      data: {
        bookId: book2.id,
        order: i + 1,
        content: mockingbirdParagraphs[i],
      },
    });
  }

  // Create sample progress for user1 on book1
  const firstParagraph = await prisma.paragraph.findFirst({
    where: { bookId: book1.id, order: 1 },
  });

  if (firstParagraph) {
    await prisma.progress.create({
      data: {
        userId: user1.id,
        bookId: book1.id,
        paragraphId: firstParagraph.id,
        position: 1,
      },
    });
  }

  // Create sample progress for user2 on book2
  const secondBookFirstParagraph = await prisma.paragraph.findFirst({
    where: { bookId: book2.id, order: 1 },
  });

  if (secondBookFirstParagraph) {
    await prisma.progress.create({
      data: {
        userId: user2.id,
        bookId: book2.id,
        paragraphId: secondBookFirstParagraph.id,
        position: 1,
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
