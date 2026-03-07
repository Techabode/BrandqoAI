# syntax=docker/dockerfile:1
# Use host network during npm install to avoid ECONNRESET in Docker Desktop (Mac/Windows)
FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --prefer-offline --no-audit --progress=false

# Dummy URL just for prisma generate; overridden at runtime by environment
ENV DATABASE_URL="postgresql://user:password@localhost:5432/placeholder"

RUN npx prisma generate

COPY src ./src

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]

