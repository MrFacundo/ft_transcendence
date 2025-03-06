#!/bin/sh

set -e

echo "Starting entrypoint.sh"

if [ -z "$GANACHE_COD" ]; then
  echo "GANACHE_COD is not defined"
  exit 1
fi

echo "Starting Ganache..."
ganache-cli -h $GANACHE_HOST -p 8545 -m "$GANACHE_COD" &
GANACHE_PID=$!

while ! nc -z $GANACHE_HOST $GANACHE_PORT; do
  sleep 1
done
echo "Ganache is ready!"

echo "Compiling smart contracts..."
truffle compile || { echo "Error compiling smart contracts."; exit 1; }

echo "Deployando smart contracts..."
truffle migrate --reset || { echo "Error deploying smart contracts."; exit 1; }

# Verificar se o contrato foi implantado corretamente
if [ -f /usr/src/app/deployedAddress.json ]; then
  echo " ✅ Smart contract deployed successfully"
else
  echo "❌ Smart contract deployment failed"
  exit 1
fi

echo "Executing monitoring_push_to_blockchain.py..."
python3 scripts/monitoring_push_to_blockchain.py --monitor &
if [ $? -eq 0 ]; then
  echo "✅ monitoring_push_to_blockchain.py executed successfully!"
else
  echo "❌ Error executing monitoring_push_to_blockchain.py"
  exit 1
fi

wait $GANACHE_PID
