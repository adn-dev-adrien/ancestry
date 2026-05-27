-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "birthName" TEXT,
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "birthPlaceUncertain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "living" BOOLEAN NOT NULL DEFAULT false;
