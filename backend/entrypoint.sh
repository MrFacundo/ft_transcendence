#!/bin/bash
#teste

echo "Aplicando migrations..."
python ./manage.py makemigrations 
python ./manage.py migrate

service cron start
crontab /usr/src/app/crontab

python ./manage.py runworker pong &
python ./manage.py createsuperuser --noinput --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL
python ./manage.py runserver 0.0.0.0:8000

# # echo "Aguardando PostgreSQL..."
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL está pronto!"

python /usr/src/app/app/scripts/getPostgresV2.py
