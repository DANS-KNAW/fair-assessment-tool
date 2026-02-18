.PHONY: dev seed reset build clean setup

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

setup:
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")
	docker compose up -d --build
	@echo "Waiting for app..."
	@until [ "$$(docker inspect --format='{{.State.Health.Status}}' fair-assessment-tool 2>/dev/null)" = "healthy" ]; do sleep 2; done
	@docker compose exec app node dist/cli.js create-admin --email root@fairaware.system.com --password admin123 || true
	@echo ""
	@echo "Setup complete!"
	@echo "  App:   http://localhost:3000"
	@echo "  Admin: http://localhost:3000/admin"
	@echo "  Login: root@fairaware.system.com / admin123"
