#!/usr/bin/env bash
set -euo pipefail

VAULT_ADDR="http://127.0.0.1:8200"
VAULT_BIN="/bin/vault"
VAULT_CONFIG="/vault/config/vault.hcl"
UNSEAL_KEY_FILE="/vault/data/.unseal-key"
TOKEN_FILE="/vault/data/.root-token"
INIT_FILE="/vault/data/.vault-init"

export VAULT_ADDR

start_vault() {
    echo "Starting Vault server..."
    "$VAULT_BIN" server -config="$VAULT_CONFIG" &
    export VAULT_PID=$!
    echo "Vault server PID: $VAULT_PID"
    echo "$VAULT_PID"
}

wait_for_vault() {
    echo "Waiting for Vault to start..."
	sleep 10
	while nc -z localhost 8200; do # nc returns 0 if the port is open
		sleep 1
	done
    echo "Vault is now available."
}

initialize_vault() {
    echo "Initializing Vault..."
    "$VAULT_BIN" operator init -key-shares=1 -key-threshold=1 > "$INIT_FILE"
    
    grep 'Unseal Key 1:' "$INIT_FILE" | awk '{ print $NF }' > "$UNSEAL_KEY_FILE"
    grep 'Initial Root Token:' "$INIT_FILE" | awk '{ print $NF }' > "$TOKEN_FILE"

    chmod 600 "$UNSEAL_KEY_FILE" "$TOKEN_FILE"
    rm -f "$INIT_FILE"
    echo "Vault initialized."
}

load_keys() {
    if [[ ! -s "$UNSEAL_KEY_FILE" ]]; then
        echo "Unseal key file is missing or empty. Exiting..."
        return 1
    fi
    if [[ ! -s "$TOKEN_FILE" ]]; then
        echo "Root token file is missing or empty. Exiting..."
        return 1
    fi

    export VAULT_UNSEAL_KEY
    export VAULT_TOKEN

    VAULT_UNSEAL_KEY="$(<"$UNSEAL_KEY_FILE")"
    VAULT_TOKEN="$(<"$TOKEN_FILE")"

    echo "Loaded unseal key and root token."
}

unseal_vault() {
    echo "Unsealing Vault..."
    "$VAULT_BIN" operator unseal "$VAULT_UNSEAL_KEY"
}

setup_secrets() {
    echo "Enabling KV secrets engine..."
    "$VAULT_BIN" secrets enable -path=secret kv-v2 || echo "Secrets engine may already be enabled."

    echo "Storing secrets..."

    "$VAULT_BIN" kv put secret/email_host \
        host="${EMAIL_HOST}" \
        port="${EMAIL_PORT}" \
        username="${EMAIL_HOST_USER}" \
        password="${EMAIL_HOST_PASSWORD}"

    "$VAULT_BIN" kv put secret/database \
        host="${POSTGRES_HOST}" \
        port="${POSTGRES_PORT}" \
        username="${POSTGRES_USER}" \
        password="${POSTGRES_PASSWORD}" \
        db_url="${DATABASE_URL}"

    "$VAULT_BIN" kv put secret/42oauth \
        client_id="${OAUTH_42_CLIENT_ID}" \
        client_secret="${OAUTH_42_CLIENT_SECRET}" \
        redirect_uri="${OAUTH_42_REDIRECT_URI}"

    "$VAULT_BIN" kv put secret/redis \
        host="${REDIS_HOST}" \
        port="${REDIS_PORT}" \
        password="${REDIS_PASSWORD}"

    "$VAULT_BIN" kv put secret/jwt \
        secret_key="${JWT_SECRET_KEY}"

    echo "Secrets stored successfully."
}

main() {
	echo "Starting Vault entrypoint script..."
    VAULT_PID=$(start_vault)
	echo "Vault server started with PID: $VAULT_PID"

	echo "Waiting for Vault to start..."
    wait_for_vault

    if [[ "$($VAULT_BIN status -format=json | jq -r '.initialized')" == "false" ]]; then
        initialize_vault
    else
        echo "Vault already initialized."
    fi

    if ! load_keys; then
        kill "$VAULT_PID"
        exit 1
    fi

    unseal_vault
    setup_secrets

    wait "$VAULT_PID"
}

main
