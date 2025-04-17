#!/bin/bash
set -euo pipefail

vault server -config=/vault/config/vault.hcl &
VAULT_PID=$!

# Wait for Vault to start responding
echo "Waiting for Vault to become ready..."
until curl -s http://127.0.0.1:8200/v1/sys/health > /dev/null; do
  echo -n "."
  sleep 2
done
echo "Vault is up!"

/vault/init-secrets.sh

wait $VAULT_PID
