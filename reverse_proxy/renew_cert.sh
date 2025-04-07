#!/bin/bash

# === CONFIG ===
VAULT_ADDR=${VAULT_ADDR}
VAULT_TOKEN="$(cat "/vault/data/.root-token")"                  # Store securely!
ROLE_NAME="localhost"
DOMAIN="localhost"
CERT_PATH="/etc/nginx/ssl/${DOMAIN}.crt"
KEY_PATH="/etc/nginx/ssl/${DOMAIN}.key"
CHAIN_PATH="/etc/nginx/ssl/${DOMAIN}-chain.crt"
NGINX_RELOAD_CMD="nginx -s reload"

# === REQUEST NEW CERT ===
RESPONSE=$(curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
  --request POST \
  --data "{\"common_name\": \"${DOMAIN}\"}" \
  "${VAULT_ADDR}/v1/pki/issue/${ROLE_NAME}")

# === PARSE AND SAVE FILES ===
echo "$RESPONSE" | jq -r '.data.certificate' > "$CERT_PATH"
echo "$RESPONSE" | jq -r '.data.private_key' > "$KEY_PATH"
echo "$RESPONSE" | jq -r '.data.issuing_ca' > "$CHAIN_PATH"

# === RELOAD PROXY ===
$NGINX_RELOAD_CMD
