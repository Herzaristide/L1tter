I am building a full-stack book reader web application.
Use TypeScript for both frontend and backend.

🔹 Backend: Use Node.js with Express.
🔹 Database: PostgreSQL with Prisma ORM.
🔹 Frontend: React with Tailwind CSS.
🔹 Book content should be stored in a PostgreSQL database, split by chapters, and each chapter split into paragraphs.
🔹 Auth: Add basic user authentication with JWT or session-based login (optionally using bcrypt and jsonwebtoken).

🔧 Backend Features:

Create API endpoints to:

Upload a new book (title, author, and full text as a string).

Automatically split the full text into chapters, and split each chapter into paragraphs.

Store book metadata in a books table.

Store each chapter in a chapters table (with a foreign key to books).

Store each paragraph in a paragraphs table (with a foreign key to chapters).

Get a list of books.

Get chapters for a book.

Get paragraphs for a specific chapter.

User signup and login.

Auth features:

Associate each book and reading progress with a user.

Store hashed passwords securely.

Use JWT-based authentication to protect routes.

Add auth middleware for route protection.

Allow users to track their reading progress down to the paragraph level.

📄 Updated Database Schema (Prisma):

model User {
id String @id @default(uuid())
name String
email String @unique
password String
books Book[]
progress Progress[]
}

model Book {
id String @id @default(uuid())
title String
author String
userId String?
user User? @relation(fields: [userId], references: [id])
chapters Chapter[]
}

model Chapter {
id String @id @default(uuid())
bookId String
number Int
title String
book Book @relation(fields: [bookId], references: [id])
paragraphs Paragraph[]
}

model Paragraph {
id String @id @default(uuid())
chapterId String
order Int
content String
chapter Chapter @relation(fields: [chapterId], references: [id])
}

model Progress {
id String @id @default(uuid())
userId String
bookId String
chapterId String
paragraphId String
position Int
updatedAt DateTime @updatedAt
user User @relation(fields: [userId], references: [id])
book Book @relation(fields: [bookId], references: [id])
chapter Chapter @relation(fields: [chapterId], references: [id])
paragraph Paragraph @relation(fields: [paragraphId], references: [id])
}

🎨 Frontend Features:

Add login/signup forms.

Store JWT securely (localStorage or cookies).

Authenticate users and fetch their reading progress.

Show personalized book list and reading progress.

Search books by title or author.

Display list of books.

Display chapters when a book is selected.

Display paragraphs when a chapter is selected.

Support scrolling through entire books by loading paragraphs incrementally.

Please scaffold the backend and frontend folder structure and generate example files for routes, components, database seed scripts, and API calls.
