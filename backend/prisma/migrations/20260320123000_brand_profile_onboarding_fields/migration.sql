-- Add optional logo URL so onboarding can capture a reusable brand logo reference
ALTER TABLE "BrandProfile"
ADD COLUMN "logoUrl" TEXT;
