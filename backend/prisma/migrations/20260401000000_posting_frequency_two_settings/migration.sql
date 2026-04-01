-- AlterTable: Replace postingFrequency with postingDaysPerWeek + postsPerDay
ALTER TABLE "PreferenceProfile" ADD COLUMN "postingDaysPerWeek" INTEGER;
ALTER TABLE "PreferenceProfile" ADD COLUMN "postsPerDay" INTEGER;

-- Migrate existing data from postingFrequency to new columns
UPDATE "PreferenceProfile" SET "postingDaysPerWeek" = 7, "postsPerDay" = 1 WHERE "postingFrequency" = 'daily';
UPDATE "PreferenceProfile" SET "postingDaysPerWeek" = 3, "postsPerDay" = 1 WHERE "postingFrequency" = '3_per_week';
UPDATE "PreferenceProfile" SET "postingDaysPerWeek" = 1, "postsPerDay" = 1 WHERE "postingFrequency" = 'weekly';

-- Drop old column
ALTER TABLE "PreferenceProfile" DROP COLUMN "postingFrequency";
