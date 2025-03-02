#!/bin/bash

python ./manage.py makemigrations 
python ./manage.py migrate

service cron start
crontab /usr/src/app/crontab

python ./manage.py runworker pong &
python ./manage.py runserver 0.0.0.0:8000

#Executar aliases
./app/scripts/setup_aliases.sh

# Iniciar monitoring_push_to_blockchain.py
echo "Iniciando monitoring_push_to_blockchain.py..."
python /usr/src/app/app/scripts/monitoring_push_to_blockchain.py --monitorar
# Verificar o código de saída
if [ $? -eq 0 ]; then
  echo "✅monitoring_push_to_blockchain.py executado com sucesso!"
else
  echo "❌ Erro ao executar monitoring_push_to_blockchain.py"
fi