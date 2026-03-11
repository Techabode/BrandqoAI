-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TWITTER');

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('IDEA', 'APPROVED', 'USED');

-- CreateEnum
CREATE TYPE "GeneratedBy" AS ENUM ('AI', 'USER');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "ScheduledStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "industry" TEXT,
    "targetAudience" TEXT,
    "toneOfVoice" TEXT,
    "keywords" TEXT,
    "contentPillars" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceProfile" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "postingFrequency" TEXT,
    "preferredPostingTimes" JSONB,
    "platformPriority" JSONB,
    "bannedTopics" TEXT,
    "languages" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "externalPageId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentIdea" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'IDEA',
    "generatedBy" "GeneratedBy" NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTemplate" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "contentIdeaId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "caption" TEXT NOT NULL,
    "imagePrompt" TEXT,
    "imageUrl" TEXT,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "postTemplateId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledStatus" NOT NULL DEFAULT 'PENDING',
    "publishJobId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "whatsappPhone" TEXT,
    "currentStep" TEXT,
    "contextJson" JSONB,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceProfile_brandId_key" ON "PreferenceProfile"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationState_whatsappPhone_key" ON "ConversationState"("whatsappPhone");

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceProfile" ADD CONSTRAINT "PreferenceProfile_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIdea" ADD CONSTRAINT "ContentIdea_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTemplate" ADD CONSTRAINT "PostTemplate_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTemplate" ADD CONSTRAINT "PostTemplate_contentIdeaId_fkey" FOREIGN KEY ("contentIdeaId") REFERENCES "ContentIdea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_postTemplateId_fkey" FOREIGN KEY ("postTemplateId") REFERENCES "PostTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationState" ADD CONSTRAINT "ConversationState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
