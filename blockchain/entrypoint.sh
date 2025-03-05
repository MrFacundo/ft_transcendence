#!/bin/sh

set -e  # Faz o script falhar imediatamente se algum comando falhar

echo "Iniciando entrypoint.sh"

# Verificar se a variável de ambiente GANACHE_COD está definida
if [ -z "$GANACHE_COD" ]; then
  echo "GANACHE_COD is not defined"
  exit 1
fi

# Iniciar Ganache em segundo plano
echo "Iniciando Ganache..."
ganache-cli -h $GANACHE_HOST -p 8545 -m "$GANACHE_COD" &
GANACHE_PID=$!

# Aguardar Ganache estar pronto

#sleep 2
echo "Aguardando Ganache estar pronto..."
while ! nc -z $GANACHE_HOST $GANACHE_PORT; do
  sleep 1
done
echo "Ganache está pronto!"

# Compilar e migrar os smart contracts com Truffle
echo "Compilando smart contracts..."
truffle compile || { echo "Erro ao compilar smart contracts."; exit 1; }

echo "Deployando smart contracts..."
truffle migrate --reset || { echo "Erro ao fazer deploy dos smart contracts."; exit 1; }

# Verificar se o contrato foi implantado corretamente
if [ -f /usr/src/app/deployedAddress.json ]; then
  echo " ✅ Smart contract deployed successfully"
else
  echo "❌ Smart contract deployment failed"
  exit 1
fi

# Iniciar script Python de monitoramento
echo "Executando monitoring_push_to_blockchain.py..."
python3 scripts/monitoring_push_to_blockchain.py --monitor &
if [ $? -eq 0 ]; then
  echo "✅ monitoring_push_to_blockchain.py executado com sucesso!"
else
  echo "❌ Erro ao executar monitoring_push_to_blockchain.py"
  exit 1
fi

# Manter o container rodando
wait $GANACHE_PID
