# syntax=docker/dockerfile:1
FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --prefer-offline --no-audit --progress=false

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

