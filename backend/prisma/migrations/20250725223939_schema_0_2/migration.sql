/*
  Warnings:

  - You are about to drop the column `content` on the `Note` table. All the data in the column will be lost.
  - Added the required column `firstContent` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondContent` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thirdContent` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Note" DROP COLUMN "content",
ADD COLUMN     "firstContent" TEXT NOT NULL,
ADD COLUMN     "secondContent" TEXT NOT NULL,
ADD COLUMN     "thirdContent" TEXT NOT NULL;
