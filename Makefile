.PHONY: up down test backend-test frontend-test

up:
	docker compose up --build

down:
	docker compose down

test: backend-test frontend-test

backend-test:
	mvn -B -f backend/pom.xml verify

frontend-test:
	npm --prefix frontend ci
	npm --prefix frontend test
	npm --prefix frontend run lint
	npm --prefix frontend run format:check
	npm --prefix frontend run build
