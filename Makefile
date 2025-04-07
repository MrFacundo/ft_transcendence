# Variables
DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_FILE = docker-compose.yml
blockchain = blockchain
transcendence_back= transcendence_back

# Targets

# Containers
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

fclean:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build --no-cache
	@echo "All services, volumes and orphans are removed and all services are built with no cache"

backend:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d backend

frontend:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d frontend

db:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d db

cache:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d cache

blockchain:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d blockchain

waf:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d waf

vault:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d hashicorpvault

# Commands
create_users:
	docker exec -it $(transcendence_back) bash -c "python manage.py create_users"

frontend-build:
	docker exec transcendence_front npm run build

frontend-stop:
	docker stop transcendence_front

frontend-dev: frontend-stop
	$(DOCKER_COMPOSE) up -d frontend

frontend-prod: frontend-stop
	NODE_ENV=production $(DOCKER_COMPOSE) up -d frontend 

blockchain_startmonitor:
	docker exec $(blockchain) python /usr/src/app/scripts/push_to_blockchain.py --startMonitor &

blockchain_stopmonitor:
	docker exec $(blockchain) python /usr/src/app/scripts/push_to_blockchain.py --stopMonitor

blockchain_listallgames:
	docker exec $(blockchain) python /usr/src/app/scripts/list_all_games.py --list_blockchain_games

blockchain_gamesbyplayers:
	docker exec $(blockchain) python /usr/src/app/scripts/get_game_by_player.py --games_by_player $(filter-out $@,$(MAKECMDGOALS))

blockchain_gamesbytournament:
	docker exec $(blockchain) python /usr/src/app/scripts/get_game_by_tournament.py --games_by_tournament $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

.PHONY: all up down build clean backend frontend db cache blockchain waf create_users blockchain_startmonitor blockchain_stopmonitor blockchain_listallgames blockchain_gamesbyplayers blockchain_gamesbytournament