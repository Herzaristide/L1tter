/*
  Warnings:

  - You are about to drop the column `searchVector` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BookLocale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChapterLocale` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Book` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Chapter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BookLocale" DROP CONSTRAINT "BookLocale_bookId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterLocale" DROP CONSTRAINT "ChapterLocale_chapterId_fkey";

-- AlterTable
ALTER TABLE "Author" DROP COLUMN "searchVector";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "searchVector",
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BookAuthor" ADD COLUMN     "position" INTEGER;

-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "searchVector",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "readingTimeEst" INTEGER,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "searchVector";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "searchVector";

-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "searchVector";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "searchVector";

-- DropTable
DROP TABLE "BookLocale";

-- DropTable
DROP TABLE "ChapterLocale";

-- CreateIndex
CREATE INDEX "Author_name_idx" ON "Author"("name");

-- CreateIndex
CREATE INDEX "Author_deletedAt_idx" ON "Author"("deletedAt");

-- CreateIndex
CREATE INDEX "AuthorRating_authorId_idx" ON "AuthorRating"("authorId");

-- CreateIndex
CREATE INDEX "AuthorRating_rating_idx" ON "AuthorRating"("rating");

-- CreateIndex
CREATE INDEX "AuthorRating_createdAt_idx" ON "AuthorRating"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Book_userId_idx" ON "Book"("userId");

-- CreateIndex
CREATE INDEX "Book_collectionId_idx" ON "Book"("collectionId");

-- CreateIndex
CREATE INDEX "Book_deletedAt_idx" ON "Book"("deletedAt");

-- CreateIndex
CREATE INDEX "Book_isPublic_idx" ON "Book"("isPublic");

-- CreateIndex
CREATE INDEX "Book_language_idx" ON "Book"("language");

-- CreateIndex
CREATE INDEX "Book_createdAt_idx" ON "Book"("createdAt");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_genre_idx" ON "Book"("genre");

-- CreateIndex
CREATE INDEX "Book_userId_deletedAt_idx" ON "Book"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Book_isPublic_deletedAt_idx" ON "Book"("isPublic", "deletedAt");

-- CreateIndex
CREATE INDEX "Book_language_isPublic_idx" ON "Book"("language", "isPublic");

-- CreateIndex
CREATE INDEX "BookAuthor_bookId_position_idx" ON "BookAuthor"("bookId", "position");

-- CreateIndex
CREATE INDEX "BookRating_bookId_idx" ON "BookRating"("bookId");

-- CreateIndex
CREATE INDEX "BookRating_rating_idx" ON "BookRating"("rating");

-- CreateIndex
CREATE INDEX "BookRating_createdAt_idx" ON "BookRating"("createdAt");

-- CreateIndex
CREATE INDEX "Chapter_bookId_idx" ON "Chapter"("bookId");

-- CreateIndex
CREATE INDEX "Chapter_order_idx" ON "Chapter"("order");

-- CreateIndex
CREATE INDEX "Chapter_deletedAt_idx" ON "Chapter"("deletedAt");

-- CreateIndex
CREATE INDEX "Chapter_bookId_order_idx" ON "Chapter"("bookId", "order");

-- CreateIndex
CREATE INDEX "ChapterRating_chapterId_idx" ON "ChapterRating"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterRating_rating_idx" ON "ChapterRating"("rating");

-- CreateIndex
CREATE INDEX "ChapterRating_createdAt_idx" ON "ChapterRating"("createdAt");

-- CreateIndex
CREATE INDEX "Collection_ownerId_idx" ON "Collection"("ownerId");

-- CreateIndex
CREATE INDEX "Collection_isPublic_idx" ON "Collection"("isPublic");

-- CreateIndex
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");

-- CreateIndex
CREATE INDEX "Collection_name_idx" ON "Collection"("name");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_bookId_idx" ON "Note"("bookId");

-- CreateIndex
CREATE INDEX "Note_chapterId_idx" ON "Note"("chapterId");

-- CreateIndex
CREATE INDEX "Note_deletedAt_idx" ON "Note"("deletedAt");

-- CreateIndex
CREATE INDEX "Note_isPublic_idx" ON "Note"("isPublic");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "Progress_userId_idx" ON "Progress"("userId");

-- CreateIndex
CREATE INDEX "Progress_chapterId_idx" ON "Progress"("chapterId");

-- CreateIndex
CREATE INDEX "Progress_updatedAt_idx" ON "Progress"("updatedAt");

-- CreateIndex
CREATE INDEX "Progress_userId_updatedAt_idx" ON "Progress"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_deletedAt_idx" ON "Tag"("deletedAt");
