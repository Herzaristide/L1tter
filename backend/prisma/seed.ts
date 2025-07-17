import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { splitIntoParagraphs } from '../src/utils/textProcessor';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  // Sample book content
  const book1Content = `In my younger and more vulnerable years my father gave me some advice that I've carried with me ever since.

"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."

He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.

In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.

The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men.`;

  const book2Content = `When I was almost thirteen years old my brother Jem got his arm badly broken at the elbow.

When it healed, and Jem's fears of never being able to play football were assuaged, he was seldom self-conscious about his injury.

His left arm was somewhat shorter than his right; when he stood or walked, the back of his hand was at right angles to his body, his thumb parallel to his thigh.

He couldn't have cared less, so long as he could pass and punt.

When enough years had gone by to enable us to look back on them, we sometimes discussed the events leading to his accident.`;

  // Create sample books with paragraphs
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

  // Split content into paragraphs and create them
  const book1Paragraphs = splitIntoParagraphs(book1Content);
  for (let i = 0; i < book1Paragraphs.length; i++) {
    await prisma.paragraph.create({
      data: {
        bookId: book1.id,
        order: i + 1,
        content: book1Paragraphs[i],
      },
    });
  }

  const book2Paragraphs = splitIntoParagraphs(book2Content);
  for (let i = 0; i < book2Paragraphs.length; i++) {
    await prisma.paragraph.create({
      data: {
        bookId: book2.id,
        order: i + 1,
        content: book2Paragraphs[i],
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

  console.log('Database seeded successfully!');
  console.log('Sample users created:');
  console.log('  Email: admin@example.com, Password: password123 (ADMIN)');
  console.log('  Email: john@example.com, Password: password123');
  console.log('  Email: jane@example.com, Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
