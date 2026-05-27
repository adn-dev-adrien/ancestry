-- AlterTable
ALTER TABLE "Relationship" ADD COLUMN     "divorceDate" TEXT,
ADD COLUMN     "divorced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marriageDate" TEXT;
