-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "description" TEXT,
ADD COLUMN     "edition" TEXT,
ADD COLUMN     "editionPublished" INTEGER,
ADD COLUMN     "originalLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "originalPublished" INTEGER,
ADD COLUMN     "publisherId" TEXT,
ADD COLUMN     "shoppingUrl" TEXT,
ADD COLUMN     "workId" TEXT;

-- CreateTable
CREATE TABLE "Publisher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "address" TEXT,
    "foundedYear" INTEGER,
    "country" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Publisher_name_idx" ON "Publisher"("name");

-- CreateIndex
CREATE INDEX "Publisher_country_idx" ON "Publisher"("country");

-- CreateIndex
CREATE INDEX "Publisher_deletedAt_idx" ON "Publisher"("deletedAt");

-- CreateIndex
CREATE INDEX "Book_workId_idx" ON "Book"("workId");

-- CreateIndex
CREATE INDEX "Book_publisherId_idx" ON "Book"("publisherId");

-- CreateIndex
CREATE INDEX "Book_originalLanguage_idx" ON "Book"("originalLanguage");

-- CreateIndex
CREATE INDEX "Book_editionPublished_idx" ON "Book"("editionPublished");

-- CreateIndex
CREATE INDEX "Book_originalPublished_idx" ON "Book"("originalPublished");

-- CreateIndex
CREATE INDEX "Book_workId_language_idx" ON "Book"("workId", "language");

-- CreateIndex
CREATE INDEX "Book_publisherId_editionPublished_idx" ON "Book"("publisherId", "editionPublished");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "Publisher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
