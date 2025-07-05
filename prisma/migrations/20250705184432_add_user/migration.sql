/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `FlashCard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FlashCardSet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FlashCard" DROP CONSTRAINT "FlashCard_setId_fkey";

-- DropForeignKey
ALTER TABLE "FlashCardSet" DROP CONSTRAINT "FlashCardSet_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt";

-- DropTable
DROP TABLE "FlashCard";

-- DropTable
DROP TABLE "FlashCardSet";

-- CreateTable
CREATE TABLE "flashcard_set" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "flashcard_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "flashcard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "flashcard_set" ADD CONSTRAINT "flashcard_set_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_setId_fkey" FOREIGN KEY ("setId") REFERENCES "flashcard_set"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
