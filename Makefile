# Variables
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_FILE = docker-compose.yml

# Targets
.PHONY: up down build clean

all: build up

up:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d
	@echo "All services are up and running"

down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down
	@echo "All services are down"

build:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build
	@echo "All services are built"

clean:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans
	@echo "All services, volumes and orphans are removed"

# Additional targets
.PHONY: backend frontend db cache

backend:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d backend

frontend:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d frontend

db:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d db

cache:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d cache