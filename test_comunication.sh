#!/bin/bash

# Containers a serem testados
CONTAINERS=(
    "transcendence_front"
    "transcendence_back"
    "blockchain_truffle"
    "transcendence_cache"
    "transcendence_db"
    "blockchain_ganache"
)

# Testa conexão entre containers usando ping
echo "🔍 Testando conectividade entre os containers..."
for container in "${CONTAINERS[@]}"; do
    echo "➡️ Testando $container..."
    for target in "${CONTAINERS[@]}"; do
        if [ "$container" != "$target" ]; then
            docker exec "$container" ping -c 2 "$target" &> /dev/null
            if [ $? -eq 0 ]; then
                echo "✅ $container pode comunicar-se com $target"
            else
                echo "❌ ERRO: $container NÃO consegue comunicar-se com $target"
            fi
        fi
    done
done

# Testar conexão ao PostgreSQL
echo "🔍 Testando conexão ao banco de dados PostgreSQL..."
docker exec transcendence_back psql -h transcendence_db -U admin -d transcendence -c "SELECT version();" &> /dev/null
if [ $? -eq 0 ]; then
    echo "✅ transcendence_back pode se conectar ao PostgreSQL (transcendence_db)"
else
    echo "❌ ERRO: transcendence_back NÃO consegue se conectar ao PostgreSQL"
fi

# Testar acesso HTTP da API Django
echo "🔍 Testando acesso à API do backend Django..."
docker exec transcendence_front curl -s -o /dev/null -w "%{http_code}" http://transcendence_back:8000/api/
if [ $? -eq 0 ]; then
    echo "✅ transcendence_front pode acessar transcendence_back API"
else
    echo "❌ ERRO: transcendence_front NÃO consegue acessar transcendence_back API"
fi

# Testar conexão ao Ganache
echo "🔍 Testando conexão ao Blockchain Ganache..."
docker exec blockchain_truffle curl -s -o /dev/null -w "%{http_code}" http://blockchain_ganache:8545
if [ $? -eq 0 ]; then
    echo "✅ blockchain_truffle
