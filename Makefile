.PHONY: dev seed reset build clean

dev:
	docker compose up -d mysql
	@echo "Waiting for MySQL..."
	@until docker compose exec mysql mysqladmin ping -h localhost --silent 2>/dev/null; do sleep 1; done
	pnpm dev

seed:
	MYSQL_DATABASE_HOST=localhost pnpm tsx src/scripts/seed-dev.ts

reset:
	docker compose down -v
	docker compose up -d mysql
	@echo "Waiting for MySQL..."
	@until docker compose exec mysql mysqladmin ping -h localhost --silent 2>/dev/null; do sleep 1; done
	@sleep 2
	MYSQL_DATABASE_HOST=localhost pnpm tsx src/scripts/seed-dev.ts

build:
	pnpm build

clean:
	docker compose down
