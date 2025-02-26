#!/bin/bash

python ./manage.py makemigrations 
python ./manage.py migrate

env > /etc/environment
service cron start
crontab /usr/src/app/crontab

python ./manage.py runserver 0.0.0.0:8000 &
python ./manage.py runworker pong