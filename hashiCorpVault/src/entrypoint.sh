#!/bin/bash
set -euo pipefail

vault server -config=/vault/config/vault.hcl &
VAULT_PID=$!

/vault/init-secrets.sh

wait $VAULT_PID
