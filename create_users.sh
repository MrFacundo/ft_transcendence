#!/bin/bash

# Nome do contêiner
CONTAINER_NAME="transcendence_back"

# Executa o comando dentro do contêiner
docker exec -it $CONTAINER_NAME bash -c "python manage.py create_users"