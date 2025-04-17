#!/usr/bin/env bash

set -euo pipefail

# Check required env vars
: "${EMAIL_HOST:?}"
: "${EMAIL_PORT:?}"
: "${EMAIL_HOST_USER:?}"
: "${EMAIL_HOST_PASSWORD:?}"
: "${POSTGRES_HOST:?}"
: "${POSTGRES_PORT:?}"
: "${POSTGRES_USER:?}"
: "${POSTGRES_PASSWORD:?}"
: "${DATABASE_URL:?}"
: "${OAUTH_42_CLIENT_ID:?}"
: "${OAUTH_42_CLIENT_SECRET:?}"
: "${OAUTH_42_REDIRECT_URI:?}"
: "${REDIS_HOST:?}"
: "${REDIS_PORT:?}"
: "${REDIS_PASSWORD:?}"
: "${JWT_SECRET_KEY:?}"

export VAULT_ADDR="http://127.0.0.1:8200"
VAULT_BIN=/bin/vault
VAULT_UNSEAL_KEY_FILE="/vault/data/.unseal-key"
VAULT_TOKEN_FILE="/vault/data/.root-token"

# Initialize Vault if not already
if [ "$($VAULT_BIN status -format=json | jq -r '.initialized')" == "false" ]; then
	echo "Initializing Vault..."
	$VAULT_BIN operator init -key-shares=1 -key-threshold=1 > /vault/data/.vault-init
	grep 'Unseal Key 1:' /vault/data/.vault-init | awk '{ print $NF }' > "$VAULT_UNSEAL_KEY_FILE"
	grep 'Initial Root Token:' /vault/data/.vault-init | awk '{ print $NF }' > "$VAULT_TOKEN_FILE"
	chmod 600 "$VAULT_UNSEAL_KEY_FILE" "$VAULT_TOKEN_FILE"
	rm /vault/data/.vault-init
	echo "Vault initialized!"
fi

# Unseal if necessary
if [ "$($VAULT_BIN status -format=json | jq -r '.sealed')" == "true" ]; then
	echo "Vault is sealed. Unsealing..."
	$VAULT_BIN operator unseal "$(cat "$VAULT_UNSEAL_KEY_FILE")"
else
	echo "Vault already unsealed."
fi

# Set Vault token
export VAULT_TOKEN="$(cat "$VAULT_TOKEN_FILE")"

# Enable KV secrets engine if not already
if ! $VAULT_BIN secrets list | grep -q '^secret/'; then
	$VAULT_BIN secrets enable -path=secret kv-v2
fi

# Store secrets
$VAULT_BIN kv put secret/email_host \
	host="${EMAIL_HOST}" \
	port="${EMAIL_PORT}" \
	username="${EMAIL_HOST_USER}" \
	password="${EMAIL_HOST_PASSWORD}"

$VAULT_BIN kv put secret/database \
	host="${POSTGRES_HOST}" \
	port="${POSTGRES_PORT}" \
	username="${POSTGRES_USER}" \
	password="${POSTGRES_PASSWORD}" \
	db_url="${DATABASE_URL}"

$VAULT_BIN kv put secret/42oauth \
	client_id="${OAUTH_42_CLIENT_ID}" \
	client_secret="${OAUTH_42_CLIENT_SECRET}" \
	redirect_uri="${OAUTH_42_REDIRECT_URI}"

$VAULT_BIN kv put secret/redis \
	host="${REDIS_HOST}" \
	port="${REDIS_PORT}" \
	password="${REDIS_PASSWORD}"

$VAULT_BIN kv put secret/jwt \
	secret_key="${JWT_SECRET_KEY}"

# Enable PKI if not already
if ! $VAULT_BIN secrets list | grep -q '^pki/'; then
	$VAULT_BIN secrets enable pki
	$VAULT_BIN secrets tune -max-lease-ttl=8760h pki
	$VAULT_BIN write pki/root/generate/internal common_name="localhost" ttl=8760h
	$VAULT_BIN write pki/config/urls \
		issuing_certificates="$VAULT_ADDR/v1/pki/ca" \
		crl_distribution_points="$VAULT_ADDR/v1/pki/crl"
	$VAULT_BIN write pki/roles/localhost \
		allowed_domains="localhost" \
		allow_subdomains=true \
		max_ttl="72h"
fi
