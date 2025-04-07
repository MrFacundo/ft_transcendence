#!/usr/bin/env bash

set -euo pipefail

# Check if essential environment variables are set
: "${EMAIL_HOST:?Environment variable EMAIL_HOST is required}"
: "${EMAIL_PORT:?Environment variable EMAIL_PORT is required}"
: "${EMAIL_HOST_USER:?Environment variable EMAIL_HOST_USER is required}"
: "${EMAIL_HOST_PASSWORD:?Environment variable EMAIL_HOST_PASSWORD is required}"
: "${POSTGRES_HOST:?Environment variable POSTGRES_HOST is required}"
: "${POSTGRES_PORT:?Environment variable POSTGRES_PORT is required}"
: "${POSTGRES_USER:?Environment variable POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?Environment variable POSTGRES_PASSWORD is required}"
: "${DATABASE_URL:?Environment variable DATABASE_URL is required}"
: "${OAUTH_42_CLIENT_ID:?Environment variable OAUTH_42_CLIENT_ID is required}"
: "${OAUTH_42_CLIENT_SECRET:?Environment variable OAUTH_42_CLIENT_SECRET is required}"
: "${OAUTH_42_REDIRECT_URI:?Environment variable OAUTH_42_REDIRECT_URI is required}"
: "${REDIS_HOST:?Environment variable REDIS_HOST is required}"
: "${REDIS_PORT:?Environment variable REDIS_PORT is required}"
: "${REDIS_PASSWORD:?Environment variable REDIS_PASSWORD is required}"
: "${JWT_SECRET_KEY:?Environment variable JWT_SECRET_KEY is required}"

export VAULT_ADDR="http://127.0.0.1:8200"
VAULT_BIN=/bin/vault
VAULT_UNSEAL_KEY_FILE=/vault/data/.unseal-key
VAULT_TOKEN_FILE=/vault/data/.root-token

# Function for cleanup on exit or error
cleanup() {
    echo "Cleaning up Vault process..."
    if [ -n "$VAULT_PID" ]; then
        kill "$VAULT_PID" || true
    fi
}
trap cleanup EXIT

echo "Starting Vault server..."
$VAULT_BIN server -config=/vault/config/vault.hcl &
VAULT_PID=$!

echo "Waiting for Vault to be ready..."
sleep 10

# Vault initialization and unseal process with error checks
if [ "$($VAULT_BIN status -format=json | jq -r '.initialized')" == "false" ]; then
    echo "Initializing Vault..."
    $VAULT_BIN operator init -key-shares=1 -key-threshold=1 > /vault/data/.vault-init
    if ! grep 'Unseal Key 1:' /vault/data/.vault-init; then
        echo "ERROR: Unseal key not found during initialization. Exiting."
        exit 1
    fi
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
        echo "WARNING: Unseal key file not found. Exiting."
        exit 1
    fi
fi

# Protecting VAULT_UNSEAL_KEY and VAULT_TOKEN files by checking if they exist
if [ ! -f "$VAULT_UNSEAL_KEY_FILE" ]; then
    echo "ERROR: Unseal key file does not exist. Exiting."
    exit 1
fi

if [ ! -f "$VAULT_TOKEN_FILE" ]; then
    echo "ERROR: Root token file does not exist. Exiting."
    exit 1
fi

export VAULT_UNSEAL_KEY="$(cat "$VAULT_UNSEAL_KEY_FILE")"
export VAULT_TOKEN="$(cat "$VAULT_TOKEN_FILE")"

echo "Loading unseal key from $VAULT_UNSEAL_KEY_FILE..."

$VAULT_BIN operator unseal "$VAULT_UNSEAL_KEY"

# Create secrets engine with error checks
$VAULT_BIN secrets enable -path=secret kv-v2 || { echo "ERROR: Failed to enable KV secrets engine. Exiting."; exit 1; }

$VAULT_BIN kv put secret/email_host \
    host=${EMAIL_HOST} \
    port=${EMAIL_PORT} \
    username=${EMAIL_HOST_USER} \
    password=${EMAIL_HOST_PASSWORD} || { echo "ERROR: Failed to store email host secrets. Exiting."; exit 1; }

# Database secrets
$VAULT_BIN kv put secret/database \
    host=${POSTGRES_HOST} \
    port=${POSTGRES_PORT} \
    username=${POSTGRES_USER} \
    password=${POSTGRES_PASSWORD} \
    db_url=${DATABASE_URL} || { echo "ERROR: Failed to store database secrets. Exiting."; exit 1; }

# OAuth secrets
$VAULT_BIN kv put secret/42oauth \
    client_id=${OAUTH_42_CLIENT_ID} \
    client_secret=${OAUTH_42_CLIENT_SECRET} \
    redirect_uri=${OAUTH_42_REDIRECT_URI} || { echo "ERROR: Failed to store 42 OAuth secrets. Exiting."; exit 1; }

# Redis secrets
$VAULT_BIN kv put secret/redis \
    host=${REDIS_HOST} \
    port=${REDIS_PORT} \
    password=${REDIS_PASSWORD} || { echo "ERROR: Failed to store Redis secrets. Exiting."; exit 1; }

# JWT secrets
$VAULT_BIN kv put secret/jwt \
    secret_key=${JWT_SECRET_KEY} || { echo "ERROR: Failed to store JWT secret. Exiting."; exit 1; }

# SSL Certificate
$VAULT_BIN secrets enable pki || { echo "ERROR: Failed to enable PKI secrets engine. Exiting."; exit 1; }
$VAULT_BIN secrets tune -max-lease-ttl=8760h pki
$VAULT_BIN write pki/root/generate/internal common_name="localhost" ttl=8760h || { echo "ERROR: Failed to generate root certificate. Exiting."; exit 1; }
$VAULT_BIN write pki/config/urls issuing_certificates="$VAULT_ADDR/v1/pki/ca" crl_distribution_points="$VAULT_ADDR/v1/pki/crl" || { echo "ERROR: Failed to configure certificate URLs. Exiting."; exit 1; }

$VAULT_BIN write pki/roles/localhost \
    allowed_domains="localhost" \
    allow_subdomains=true \
    max_ttl="72h" || { echo "ERROR: Failed to write PKI role. Exiting."; exit 1; }

wait "$VAULT_PID"
