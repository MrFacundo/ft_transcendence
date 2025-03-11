# Variables
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_FILE = docker-compose.yml
blockchain = blockchain
transcendence_back= transcendence_back
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

users:
	docker exec -it $(transcendence_back) bash -c "python manage.py create_users"

startmonitor:
	docker exec $(blockchain) python /usr/src/app/scripts/push_to_blockchain.py --startMonitor &

stopmonitor:
	docker exec $(blockchain) python /usr/src/app/scripts/push_to_blockchain.py --stopMonitor

saveallnewgames:
	docker exec $(blockchain) python /usr/src/app/scripts/push_to_blockchain.py --allNewGames

listallgames:
	docker exec $(blockchain) python /usr/src/app/scripts/list_all_games.py --list_blockchain_games

gamesbyplayers:
	docker exec $(blockchain) python /usr/src/app/scripts/get_game_by_player.py --games_by_player $(filter-out $@,$(MAKECMDGOALS))

gamesbytournament:
	docker exec $(blockchain) python /usr/src/app/scripts/get_game_by_tournament.py --games_by_tournament $(filter-out $@,$(MAKECMDGOALS))

%:
    @: