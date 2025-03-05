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
ganache-cli -p 8545 -m "$GANACHE_COD" &
GANACHE_PID=$!

# Aguardar Ganache estar pronto
sleep 5
if ! nc -z localhost 8545; then
  echo "Erro: Ganache não iniciou corretamente."
  exit 1
fi
echo "Ganache está pronto!"

# Compilar e migrar os smart contracts com Truffle
echo "Compilando smart contracts..."
truffle compile || { echo "Erro ao compilar smart contracts."; exit 1; }

echo "Deployando smart contracts..."
truffle migrate --reset || { echo "Erro ao fazer deploy dos smart contracts."; exit 1; }

# Verificar se o contrato foi implantado corretamente
if [ -f /usr/src/app/deployedAddress.json ]; then
  echo "Smart contract deployed successfully"
else
  echo "Smart contract deployment failed"
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
