-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "deathPlace" TEXT,
ADD COLUMN     "deathPlaceUncertain" BOOLEAN NOT NULL DEFAULT false;
