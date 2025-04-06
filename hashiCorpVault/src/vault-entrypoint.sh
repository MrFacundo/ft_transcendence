#!/bin/sh

# Iniciar o Vault no modo de desenvolvimento (se não estiver em produção)
vault server -dev -dev-root-token-id=${VAULT_TOKEN} -dev-listen-address="0.0.0.0:8200" &

# Aguardar o Vault estar pronto
echo "Aguardando o Vault iniciar..."
sleep 5

# Email Host
vault kv put secret/email_host \
    host=${EMAIL_HOST} \
    port=${EMAIL_PORT} \
    username=${EMAIL_HOST_USER} \
    password=${EMAIL_HOST_PASSWORD}

# Banco de Dados
vault kv put secret/database \
    host=${POSTGRES_HOST} \
    port=${POSTGRES_PORT} \
    username=${POSTGRES_USER} \
    password=${POSTGRES_PASSWORD} \
    db_url=${DATABASE_URL} \

# vault secrets enable database

# vault write database/config/postgresql \
#     plugin_name=postgresql-database-plugin \
#     connection_url="postgresql://{{username}}:{{password}}@${POSTGRES_HOST}:5432/transcendence?sslmode=disable" \
#     allowed_roles="myrole" \
#     username=${POSTGRES_USER} \
#     password=${POSTGRES_PASSWORD}

# vault write database/roles/myrole \
#     db_name=postgresql \
#     creation_statements="
#     CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}';
#     GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO \"{{name}}\";
#     GRANT USAGE ON SCHEMA public TO \"{{name}}\";
#     GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";
#     GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";
#     " \
#     default_ttl="1h" \
#     max_ttl="24h"

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

# Ganache
vault kv put secret/ganache \
    code=${GANACHE_COD} \

# JWT
vault kv put secret/jwt \
    secret_key=${JWT_SECRET_KEY} \

wait
