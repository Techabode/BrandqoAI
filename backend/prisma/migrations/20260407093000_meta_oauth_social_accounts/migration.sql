-- AlterTable
ALTER TABLE "SocialAccount"
  ADD COLUMN     "accountName" TEXT,
  ADD COLUMN     "provider" TEXT,
  ADD COLUMN     "pageId" TEXT,
  ADD COLUMN     "pageName" TEXT,
  ADD COLUMN     "instagramBusinessId" TEXT,
  ADD COLUMN     "metadataJson" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_platform_externalPageId_key" ON "SocialAccount"("platform", "externalPageId");
