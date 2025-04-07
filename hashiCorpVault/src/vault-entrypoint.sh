#!/usr/bin/env bash

set -euxo pipefail

export VAULT_ADDR="http://127.0.0.1:8200"
VAULT=/bin/vault
VAULT_UNSEAL_KEY_FILE=/vault/data/.unseal-key
VAULT_TOKEN_FILE=/vault/data/.root-token

echo "Starting Vault server..."
$VAULT server -config=/vault/config/vault.hcl &
VAULT_PID=$!

echo "Waiting for Vault to be ready..."
# Wait for Vault to be ready
sleep 10

# Check if Vault is initialized
if [ "$($VAULT status | awk '/Initialized/ { print $2 }')" = "false" ]; then
    echo "Initializing Vault..."
    $VAULT operator init -key-shares=1 -key-threshold=1 > /vault/data/.vault-init
    grep 'Unseal Key 1:' /vault/data/.vault-init | awk '{ print $NF }' > "$VAULT_UNSEAL_KEY_FILE"
    grep 'Initial Root Token:' /vault/data/.vault-init | awk '{ print $NF }' > "$VAULT_TOKEN_FILE"
    chmod 600 "$VAULT_UNSEAL_KEY_FILE" "$VAULT_TOKEN_FILE"
    rm /vault/data/.vault-init
    echo "Vault initialized!"
else
    echo "Vault already initialized."
    if [ -f "$VAULT_UNSEAL_KEY_FILE" ]; then
        echo "Loading unseal key from $VAULT_UNSEAL_KEY_FILE..."
    else
        echo "WARNING: Unseal key file not found. Expecting key from environment..."
    fi
fi

export VAULT_UNSEAL_KEY="$(cat "$VAULT_UNSEAL_KEY_FILE")"
export VAULT_TOKEN="$(cat "$VAULT_TOKEN_FILE")"

echo "Loading unseal key from $VAULT_UNSEAL_KEY_FILE..."

VAULT_UNSEAL_KEY="$(cat "$VAULT_UNSEAL_KEY_FILE")"

$VAULT operator unseal "$VAULT_UNSEAL_KEY"

# Create secrets engine
$VAULT secrets enable -path=secret kv-v2

vault kv put secret/email_host \
	host=${EMAIL_HOST} \
	port=${EMAIL_PORT} \
	username=${EMAIL_HOST_USER} \
	password=${EMAIL_HOST_PASSWORD}

# Database
vault kv put secret/database \
	host=${POSTGRES_HOST} \
	port=${POSTGRES_PORT} \
	username=${POSTGRES_USER} \
	password=${POSTGRES_PASSWORD} \
	db_url=${DATABASE_URL}

# 42Oauth
vault kv put secret/42oauth \
	client_id=${OAUTH_42_CLIENT_ID} \
	client_secret=${OAUTH_42_CLIENT_SECRET} \
	redirect_uri=${OAUTH_42_REDIRECT_URI}

# Redis
vault kv put secret/redis \
	host=${REDIS_HOST} \
	port=${REDIS_PORT} \
	password=${REDIS_PASSWORD}

# JWT
vault kv put secret/jwt \
	secret_key=${JWT_SECRET_KEY}
 
wait "$VAULT_PID"