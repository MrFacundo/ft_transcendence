#!/bin/bash
#teste

echo "Aplicando migrations..."
python ./manage.py makemigrations 
python ./manage.py migrate

service cron start
crontab /usr/src/app/crontab

python ./manage.py runserver 0.0.0.0:8000 &
python ./manage.py runworker pong &

#Executar alias
./app/scripts/setup_aliases.sh

# Aguardar PostgreSQL estar pronto
while ! nc -z db 5432; do
  sleep 1
done
echo "PostgreSQL está pronto!"

# Adicionar mensagens de log antes e depois da execução do script
echo "Iniciando getPostgresV2.py..."
GANACHE_HOST="ganache"
GANACHE_PORT=8545
MAX_RETRIES=30
SLEEP_INTERVAL=5

echo "🔄 Aguardando Ganache em $GANACHE_HOST:$GANACHE_PORT..."

# for ((i=1; i<=MAX_RETRIES; i++)); do
#     if nc -z "$GANACHE_HOST" "$GANACHE_PORT"; then
#         echo "✅ Ganache está pronto!"
#         python /usr/src/app/app/scripts/getPostgresV2.py  # Executa o script quando Ganache estiver pronto
#         break
#     fi
#     echo "⏳ Tentativa $i de $MAX_RETRIES... Ganache ainda não está disponível."
#     sleep "$SLEEP_INTERVAL"
# done

# if [ $i -gt $MAX_RETRIES ]; then
#     echo "❌ Tempo limite excedido: Ganache não respondeu. Abortando."
#     exit 1
# fi

# Iniciar monitor_games.py
echo "Iniciando monitor_games.py..."
python /usr/src/app/app/scripts/monitor_games.py

# Verificar o código de saída
if [ $? -eq 0 ]; then
  echo "monitor_games.py executado com sucesso!"
else
  echo "Erro ao executar monitor_games.py"
fi