#!/bin/bash

# === CONFIG ===
VAULT_ADDR=${VAULT_ADDR}
VAULT_TOKEN="$(cat "/vault/data/.root-token")"
ROLE_NAME="localhost"
DOMAIN="localhost"
CERT_PATH="/etc/nginx/ssl/${DOMAIN}.crt"
KEY_PATH="/etc/nginx/ssl/${DOMAIN}.key"

# === CREATE FILES ===
touch "$CERT_PATH"
touch "$KEY_PATH"

# === REQUEST NEW CERT ===
RESPONSE=$(curl -s --header "X-Vault-Token: ${VAULT_TOKEN}" \
  --request POST \
  --data "{\"common_name\": \"${DOMAIN}\"}" \
  "${VAULT_ADDR}/v1/pki/issue/${ROLE_NAME}")

# === PARSE AND SAVE FILES ===
echo "$RESPONSE" | jq -r '.data.certificate' > "$CERT_PATH"
echo "$RESPONSE" | jq -r '.data.private_key' > "$KEY_PATH"

# infinite loop
while true; do sleep 1; done