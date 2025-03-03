#!/bin/bash

python ./manage.py makemigrations 
python ./manage.py migrate

env > /etc/environment
service cron start
crontab /usr/src/app/crontab

python ./manage.py runworker pong &
python ./manage.py runserver 0.0.0.0:8000

# Start monitoring_push_to_blockchain.py
echo "Starting monitoring_push_to_blockchain.py..."
python /usr/src/app/app/scripts/monitoring_push_to_blockchain.py --monitor
if [ $? -eq 0 ]; then
  echo "✅monitoring_push_to_blockchain.py Successfully executed!"
else
  echo "❌ Error executing monitoring_push_to_blockchain.py"
fi