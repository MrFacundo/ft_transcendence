#!/usr/bin/env bash

export VAULT_ADDR="http://127.0.0.1:8200"
VAULT=/bin/vault
VAULT_UNSEAL_KEY_FILE=/vault/data/.unseal-key
VAULT_TOKEN_FILE=/vault/data/.root-token

echo "Starting Vault server..."
$VAULT server -config=/vault/config/vault.hcl &
VAULT_PID=$!

sleep 3  # Give Vault some time to start

# Check if Vault is initialized
if ! $VAULT status > /dev/null 2>&1; then
    echo "Initializing Vault..."
    $VAULT operator init -key-shares=1 -key-threshold=1 > /vault/data/.vault-init

    grep 'Unseal Key 1:' /vault/data/.vault-init | awk '{ print $NF }' > "$VAULT_UNSEAL_KEY_FILE"
    grep 'Initial Root Token:' /vault/data/.vault-init | awk '{ print $NF }' > "$VAULT_TOKEN_FILE"

    chmod 600 "$VAULT_UNSEAL_KEY_FILE" "$VAULT_TOKEN_FILE"
    rm /vault/data/.vault-init
    echo "Vault initialized!"
fi

# Unseal Vault
if $VAULT status | grep -q "Sealed: true"; then
    echo "Unsealing Vault..."
    $VAULT operator unseal "$(cat "$VAULT_UNSEAL_KEY_FILE")"
fi

wait "$VAULT_PID"