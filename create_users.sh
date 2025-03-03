#!/bin/bash

CONTAINER_NAME="transcendence_back"
docker exec -it $CONTAINER_NAME bash -c "python manage.py create_users"