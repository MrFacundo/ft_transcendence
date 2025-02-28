#!/bin/bash
#teste

echo "Aplicando migrations..."
python ./manage.py makemigrations 
python ./manage.py migrate

service cron start
crontab /usr/src/app/crontab

python ./manage.py runworker pong &
python ./manage.py runserver 0.0.0.0:8000

#Executar aliases
./app/scripts/setup_aliases.sh

# Iniciar monitor_games_.py
echo "Iniciando monitor_games_.py..."
python /usr/src/app/app/scripts/monitor_games_.py --monitorar

# Verificar o código de saída
if [ $? -eq 0 ]; then
  echo "✅monitor_games_.py executado com sucesso!"
else
  echo "❌ Erro ao executar monitor_games_.py"
fi