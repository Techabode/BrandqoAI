COMPOSE = docker compose
DATABASE_URL = postgresql://brandqoai:brandqoai@localhost:5442/brandqoai?schema=public

.PHONY: up down up-db build logs migrate seed migrate-local seed-local dev db-shell backend-shell

up:
	$(COMPOSE) up -d

up-db:
	docker compose -f docker-compose.db-only.yml up -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

dev:
	$(COMPOSE) up --build

install:
	$(COMPOSE) run --rm backend npm install
	$(COMPOSE) run --rm frontend npm install

# Generate and apply initial migration on host (call this only once when starting a new project)
migrate-init:
	cd backend && npx prisma migrate dev --name init

# Run migrations inside backend container (requires full build)
migrate:
	$(COMPOSE) run --rm backend npx prisma migrate deploy

# Run seed inside backend container (requires full build)
seed:
	$(COMPOSE) run --rm backend npm run prisma:seed

# Run migrations on host (use after "make up-db"; requires: cd backend && npm install)
migrate-local:
	cd backend && DATABASE_URL="$(DATABASE_URL)" npx prisma migrate deploy

# Run seed on host (use after "make up-db" and migrate-local)
seed-local:
	cd backend && DATABASE_URL="$(DATABASE_URL)" JWT_SECRET=dev npm run prisma:seed

db-shell:
	$(COMPOSE) exec db psql -U brandqoai -d brandqoai

backend-shell:
	$(COMPOSE) exec backend sh

