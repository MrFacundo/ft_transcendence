#!/bin/sh

set -e

echo "Starting entrypoint.sh"

variables="GANACHE_URL GANACHE_PORT GANACHE_COD DB_NAME DB_USER DB_PASSWORD DB_HOST"

for var in $variables; do
  if [ -z "$(eval echo \$$var)" ]; then
    echo "Error: The environment variable $var is not defined."
    exit 1
  fi
done

echo "Starting Ganache..."
ganache-cli -h $GANACHE_HOST -p 8545 -m "$GANACHE_COD" &
GANACHE_PID=$!

while ! nc -z $GANACHE_HOST $GANACHE_PORT; do
  sleep 1
done
echo "Ganache is ready!"

echo "Compiling smart contracts..."
truffle compile || { echo "Error compiling smart contracts."; exit 1; }

echo "Deploying smart contracts..."
truffle migrate --reset || { echo "Error deploying smart contracts."; exit 1; }

if [ -f /usr/src/app/deployedAddress.json ]; then
  echo " ✅ Smart contract deployed successfully"
else
  echo "❌ Smart contract deployment failed"
  exit 1
fi

wait $GANACHE_PID