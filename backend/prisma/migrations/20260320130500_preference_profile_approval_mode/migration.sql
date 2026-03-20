-- Add approval mode and onboarding completion marker for onboarding issue #22
CREATE TYPE "ApprovalMode" AS ENUM ('MANUAL', 'AUTO_POST');

ALTER TABLE "PreferenceProfile"
ADD COLUMN "approvalMode" "ApprovalMode",
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
