/*
  Warnings:

  - You are about to drop the column `chapterId` on the `Paragraph` table. All the data in the column will be lost.
  - You are about to drop the column `chapterId` on the `Progress` table. All the data in the column will be lost.
  - You are about to drop the `Chapter` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bookId` to the `Paragraph` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Paragraph" DROP CONSTRAINT "Paragraph_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "Progress" DROP CONSTRAINT "Progress_chapterId_fkey";

-- AlterTable
ALTER TABLE "Paragraph" DROP COLUMN "chapterId",
ADD COLUMN     "bookId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Progress" DROP COLUMN "chapterId";

-- DropTable
DROP TABLE "Chapter";

-- AddForeignKey
ALTER TABLE "Paragraph" ADD CONSTRAINT "Paragraph_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
