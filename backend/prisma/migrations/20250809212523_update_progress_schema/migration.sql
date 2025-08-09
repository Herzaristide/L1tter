/*
  Warnings:

  - You are about to drop the column `percentage` on the `Progress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,bookId]` on the table `Progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookId` to the `Progress` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Progress" DROP CONSTRAINT "Progress_paragraphId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Progress" DROP CONSTRAINT "Progress_userId_fkey";

-- DropIndex
DROP INDEX "public"."Progress_userId_paragraphId_key";

-- DropIndex
DROP INDEX "public"."Progress_userId_percentage_idx";

-- First, add the bookId column as nullable
ALTER TABLE "public"."Progress" ADD COLUMN "bookId" TEXT;

-- Populate bookId from paragraph.bookId
UPDATE "public"."Progress" 
SET "bookId" = "public"."Paragraph"."bookId"
FROM "public"."Paragraph" 
WHERE "public"."Progress"."paragraphId" = "public"."Paragraph"."id";

-- Now make bookId NOT NULL and set default for position
ALTER TABLE "public"."Progress" 
DROP COLUMN "percentage",
ALTER COLUMN "bookId" SET NOT NULL,
ALTER COLUMN "position" SET DEFAULT 0,
ALTER COLUMN "position" SET DATA TYPE DOUBLE PRECISION;

-- Remove duplicate progress records (keep the most recent one for each user-book combination)
DELETE FROM "public"."Progress" 
WHERE "id" NOT IN (
  SELECT DISTINCT ON ("userId", "bookId") "id"
  FROM "public"."Progress"
  ORDER BY "userId", "bookId", "updatedAt" DESC
);

-- CreateIndex
CREATE INDEX "Progress_bookId_idx" ON "public"."Progress"("bookId");

-- CreateIndex
CREATE INDEX "Progress_userId_position_idx" ON "public"."Progress"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_bookId_key" ON "public"."Progress"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "public"."Progress" ADD CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Progress" ADD CONSTRAINT "Progress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Progress" ADD CONSTRAINT "Progress_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "public"."Paragraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;
