/*
  Warnings:

  - You are about to drop the column `chapterId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `chapterId` on the `Progress` table. All the data in the column will be lost.
  - You are about to drop the `Chapter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChapterRating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChapterTag` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,paragraphId]` on the table `Progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paragraphId` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paragraphId` to the `Progress` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('CONTENT_ERROR', 'SPELLING_ERROR', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT_VIOLATION', 'DUPLICATE_CONTENT', 'MISSING_INFORMATION', 'INCORRECT_INFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'DISMISSED');

-- DropForeignKey
ALTER TABLE "public"."Chapter" DROP CONSTRAINT "Chapter_bookId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChapterRating" DROP CONSTRAINT "ChapterRating_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChapterRating" DROP CONSTRAINT "ChapterRating_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChapterTag" DROP CONSTRAINT "ChapterTag_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChapterTag" DROP CONSTRAINT "ChapterTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Progress" DROP CONSTRAINT "Progress_chapterId_fkey";

-- DropIndex
DROP INDEX "public"."Note_chapterId_idx";

-- DropIndex
DROP INDEX "public"."Progress_chapterId_idx";

-- DropIndex
DROP INDEX "public"."Progress_userId_chapterId_key";

-- AlterTable
ALTER TABLE "public"."Book" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Note" DROP COLUMN "chapterId",
ADD COLUMN     "noteType" TEXT,
ADD COLUMN     "paragraphId" TEXT NOT NULL,
ADD COLUMN     "selectedText" TEXT,
ALTER COLUMN "startIndex" DROP NOT NULL,
ALTER COLUMN "endIndex" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Progress" DROP COLUMN "chapterId",
ADD COLUMN     "paragraphId" TEXT NOT NULL,
ADD COLUMN     "percentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Tag" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."Chapter";

-- DropTable
DROP TABLE "public"."ChapterRating";

-- DropTable
DROP TABLE "public"."ChapterTag";

-- CreateTable
CREATE TABLE "public"."Paragraph" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "chapterNumber" INTEGER,
    "readingTimeEst" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Paragraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ParagraphTag" (
    "paragraphId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ParagraphTag_pkey" PRIMARY KEY ("paragraphId","tagId")
);

-- CreateTable
CREATE TABLE "public"."ParagraphRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paragraphId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParagraphRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportType" "public"."ReportType" NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "adminNotes" TEXT,
    "bookId" TEXT,
    "paragraphId" TEXT,
    "authorId" TEXT,
    "publisherId" TEXT,
    "noteId" TEXT,
    "bookRatingId" TEXT,
    "paragraphRatingId" TEXT,
    "authorRatingId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Paragraph_bookId_idx" ON "public"."Paragraph"("bookId");

-- CreateIndex
CREATE INDEX "Paragraph_order_idx" ON "public"."Paragraph"("order");

-- CreateIndex
CREATE INDEX "Paragraph_chapterNumber_idx" ON "public"."Paragraph"("chapterNumber");

-- CreateIndex
CREATE INDEX "Paragraph_deletedAt_idx" ON "public"."Paragraph"("deletedAt");

-- CreateIndex
CREATE INDEX "Paragraph_bookId_order_idx" ON "public"."Paragraph"("bookId", "order");

-- CreateIndex
CREATE INDEX "Paragraph_bookId_chapterNumber_idx" ON "public"."Paragraph"("bookId", "chapterNumber");

-- CreateIndex
CREATE INDEX "ParagraphTag_paragraphId_idx" ON "public"."ParagraphTag"("paragraphId");

-- CreateIndex
CREATE INDEX "ParagraphTag_tagId_idx" ON "public"."ParagraphTag"("tagId");

-- CreateIndex
CREATE INDEX "ParagraphRating_paragraphId_idx" ON "public"."ParagraphRating"("paragraphId");

-- CreateIndex
CREATE INDEX "ParagraphRating_rating_idx" ON "public"."ParagraphRating"("rating");

-- CreateIndex
CREATE INDEX "ParagraphRating_createdAt_idx" ON "public"."ParagraphRating"("createdAt");

-- CreateIndex
CREATE INDEX "ParagraphRating_userId_rating_idx" ON "public"."ParagraphRating"("userId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "ParagraphRating_userId_paragraphId_key" ON "public"."ParagraphRating"("userId", "paragraphId");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "public"."Report"("userId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_reportType_idx" ON "public"."Report"("reportType");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_bookId_idx" ON "public"."Report"("bookId");

-- CreateIndex
CREATE INDEX "Report_paragraphId_idx" ON "public"."Report"("paragraphId");

-- CreateIndex
CREATE INDEX "Report_authorId_idx" ON "public"."Report"("authorId");

-- CreateIndex
CREATE INDEX "Report_publisherId_idx" ON "public"."Report"("publisherId");

-- CreateIndex
CREATE INDEX "Report_noteId_idx" ON "public"."Report"("noteId");

-- CreateIndex
CREATE INDEX "Report_bookRatingId_idx" ON "public"."Report"("bookRatingId");

-- CreateIndex
CREATE INDEX "Report_paragraphRatingId_idx" ON "public"."Report"("paragraphRatingId");

-- CreateIndex
CREATE INDEX "Report_authorRatingId_idx" ON "public"."Report"("authorRatingId");

-- CreateIndex
CREATE INDEX "Report_resolvedBy_idx" ON "public"."Report"("resolvedBy");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "public"."Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_userId_status_idx" ON "public"."Report"("userId", "status");

-- CreateIndex
CREATE INDEX "Report_reportType_status_idx" ON "public"."Report"("reportType", "status");

-- CreateIndex
CREATE INDEX "AuthorLink_authorId_idx" ON "public"."AuthorLink"("authorId");

-- CreateIndex
CREATE INDEX "AuthorRating_userId_rating_idx" ON "public"."AuthorRating"("userId", "rating");

-- CreateIndex
CREATE INDEX "AuthorTag_authorId_idx" ON "public"."AuthorTag"("authorId");

-- CreateIndex
CREATE INDEX "AuthorTag_tagId_idx" ON "public"."AuthorTag"("tagId");

-- CreateIndex
CREATE INDEX "Book_isDraft_idx" ON "public"."Book"("isDraft");

-- CreateIndex
CREATE INDEX "Book_userId_isDraft_idx" ON "public"."Book"("userId", "isDraft");

-- CreateIndex
CREATE INDEX "BookRating_userId_rating_idx" ON "public"."BookRating"("userId", "rating");

-- CreateIndex
CREATE INDEX "BookTag_bookId_idx" ON "public"."BookTag"("bookId");

-- CreateIndex
CREATE INDEX "BookTag_tagId_idx" ON "public"."BookTag"("tagId");

-- CreateIndex
CREATE INDEX "Note_paragraphId_idx" ON "public"."Note"("paragraphId");

-- CreateIndex
CREATE INDEX "Note_noteType_idx" ON "public"."Note"("noteType");

-- CreateIndex
CREATE INDEX "Note_paragraphId_startIndex_idx" ON "public"."Note"("paragraphId", "startIndex");

-- CreateIndex
CREATE INDEX "Note_paragraphId_noteType_idx" ON "public"."Note"("paragraphId", "noteType");

-- CreateIndex
CREATE INDEX "NoteTag_noteId_idx" ON "public"."NoteTag"("noteId");

-- CreateIndex
CREATE INDEX "NoteTag_tagId_idx" ON "public"."NoteTag"("tagId");

-- CreateIndex
CREATE INDEX "Progress_paragraphId_idx" ON "public"."Progress"("paragraphId");

-- CreateIndex
CREATE INDEX "Progress_userId_percentage_idx" ON "public"."Progress"("userId", "percentage");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_paragraphId_key" ON "public"."Progress"("userId", "paragraphId");

-- CreateIndex
CREATE INDEX "Tag_isSystem_idx" ON "public"."Tag"("isSystem");

-- CreateIndex
CREATE INDEX "Tag_createdBy_idx" ON "public"."Tag"("createdBy");

-- CreateIndex
CREATE INDEX "Tag_isPublic_idx" ON "public"."Tag"("isPublic");

-- CreateIndex
CREATE INDEX "Tag_isSystem_isPublic_idx" ON "public"."Tag"("isSystem", "isPublic");

-- CreateIndex
CREATE INDEX "Tag_createdBy_name_idx" ON "public"."Tag"("createdBy", "name");

-- AddForeignKey
ALTER TABLE "public"."Tag" ADD CONSTRAINT "Tag_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paragraph" ADD CONSTRAINT "Paragraph_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Progress" ADD CONSTRAINT "Progress_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "public"."Paragraph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "public"."Paragraph"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParagraphTag" ADD CONSTRAINT "ParagraphTag_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "public"."Paragraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParagraphTag" ADD CONSTRAINT "ParagraphTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParagraphRating" ADD CONSTRAINT "ParagraphRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParagraphRating" ADD CONSTRAINT "ParagraphRating_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "public"."Paragraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "public"."Paragraph"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "public"."Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "public"."Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_bookRatingId_fkey" FOREIGN KEY ("bookRatingId") REFERENCES "public"."BookRating"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_paragraphRatingId_fkey" FOREIGN KEY ("paragraphRatingId") REFERENCES "public"."ParagraphRating"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_authorRatingId_fkey" FOREIGN KEY ("authorRatingId") REFERENCES "public"."AuthorRating"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
