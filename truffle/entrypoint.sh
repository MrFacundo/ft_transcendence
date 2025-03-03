#!/bin/bash

set -e

# Wait for Ganache to be ready
echo "AWaiting for Ganache..."
sleep 10

# Compile and migrate contracts
echo "Compiling contracts..."
truffle compile
echo "Migrating contracts..."
truffle migrate --network development --reset

# Move address file
if [ -f /usr/src/app/deployedAddress.json ]; then
  cp /usr/src/app/deployedAddress.json /usr/src/app/shared/
  echo "✅File deployedAddress.json Copied to shared volume."
else
  echo "❌Error: deployedAddress.json not found!"
  exit 1
fi

# Keep container running
# tail -f /dev/null