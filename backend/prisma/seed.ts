import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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

  // Create sample chapters for book1
  const chapter1 = await prisma.chapter.create({
    data: {
      bookId: book1.id,
      number: 1,
      title: 'Chapter 1: In My Younger and More Vulnerable Years',
    },
  });

  const chapter2 = await prisma.chapter.create({
    data: {
      bookId: book1.id,
      number: 2,
      title: 'Chapter 2: About Half Way Between West Egg and New York',
    },
  });

  // Create sample paragraphs for chapter1
  const paragraphs = [
    "In my younger and more vulnerable years my father gave me some advice that I've carried with me ever since.",
    "'Whenever you feel like criticizing any one,' he told me, 'just remember that all the people in this world haven't had the advantages that you've had.'",
    "He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.",
    "In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.",
  ];

  for (let i = 0; i < paragraphs.length; i++) {
    await prisma.paragraph.create({
      data: {
        chapterId: chapter1.id,
        order: i + 1,
        content: paragraphs[i],
      },
    });
  }

  // Create sample progress
  const firstParagraph = await prisma.paragraph.findFirst({
    where: { chapterId: chapter1.id, order: 1 },
  });

  if (firstParagraph) {
    await prisma.progress.create({
      data: {
        userId: user1.id,
        bookId: book1.id,
        chapterId: chapter1.id,
        paragraphId: firstParagraph.id,
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
