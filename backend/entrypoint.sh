#!/bin/bash

python ./manage.py makemigrations 
python ./manage.py migrate

env > /etc/environment
service cron start
crontab /usr/src/app/crontab

python ./manage.py runworker pong &
python ./manage.py collectstatic --noinput
python ./manage.py createsuperuser --noinput --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL
python ./manage.py runserver 0.0.0.0:8000

