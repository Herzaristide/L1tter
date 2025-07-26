-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "BookLocale" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "ChapterLocale" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "searchVector" tsvector;
